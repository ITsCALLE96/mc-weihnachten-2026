package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.TimeUnit;
import java.util.regex.Pattern;

import com.google.gson.JsonArray;
import com.google.gson.JsonNull;
import com.google.gson.JsonObject;

import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.model.group.Group;
import net.luckperms.api.model.user.User;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.matcher.NodeMatcher;
import net.luckperms.api.node.types.InheritanceNode;
import net.luckperms.api.node.types.MetaNode;
import net.luckperms.api.node.types.PrefixNode;

import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.plugin.Plugin;

/**
 * Clans in Selbstverwaltung über Discord (Pascal 01.11., Vertrag server/clans-api.md): Endpunkte /clans der Whitelist-API (nur Hub, gleicher
 * Zugang). Speicher ist LuckPerms: Gruppe clan-&lt;kürzel&gt; mit Präfix „&amp;&lt;farbe&gt;[KÜRZEL]“ (Priorität 100), Meta clan.name/farbe/leiter/gegruendet
 * und clan.einladung.&lt;uuid&gt; (Ablauf) an der Gruppe, Meta clan.seit am Mitglied. Die Anzeige (Tab, Chat, Kopf) macht Namen über den Präfix.
 * Discord-IDs ordnet die Whitelist-Datei Minecraft-Konten zu. Läuft im Thread der API (ein Thread, also nacheinander); LuckPerms-Aufrufe
 * blockieren dort mit join(), Bukkit-Daten (bekannte Spielernamen) holt callSyncMethod vom Haupt-Thread.
 */
final class Clans {

    static final Map<String, Character> FARBEN = new LinkedHashMap<>();

    static {
        FARBEN.put("dark_red", '4');
        FARBEN.put("red", 'c');
        FARBEN.put("gold", '6');
        FARBEN.put("yellow", 'e');
        FARBEN.put("dark_green", '2');
        FARBEN.put("green", 'a');
        FARBEN.put("aqua", 'b');
        FARBEN.put("dark_aqua", '3');
        FARBEN.put("dark_blue", '1');
        FARBEN.put("blue", '9');
        FARBEN.put("light_purple", 'd');
        FARBEN.put("dark_purple", '5');
        FARBEN.put("white", 'f');
        FARBEN.put("gray", '7');
    }

    private static final Pattern KUERZEL = Pattern.compile("[A-Z0-9]{2,10}");
    private static final Pattern NAME = Pattern.compile("[\\p{L}0-9 _'\\-]{3,32}");
    private static final String GRUPPE = "clan-";
    private static final String M_NAME = "clan.name";
    private static final String M_FARBE = "clan.farbe";
    private static final String M_LEITER = "clan.leiter";
    private static final String M_GEGRUENDET = "clan.gegruendet";
    private static final String M_EINLADUNG = "clan.einladung.";
    private static final String M_SEIT = "clan.seit";

    /** Antwort an die API */
    record Antwort(int status, JsonObject json) {
    }

    /** Zuordnung Discord ↔ Minecraft aus der Whitelist-Datei */
    interface Konten {
        /** Discord-ID → [uuid, name] oder null */
        String[] zuDiscord(String discord);

        /** UUID → Discord-ID oder null */
        String discordVon(UUID uuid);
    }

    private final Plugin plugin;
    private final Konten konten;
    private LuckPerms lp;
    private boolean aktiv;
    private int einladungTage = 7;
    private List<String> sperrliste = List.of();
    private List<String> beleidigungen = List.of();

    Clans(Plugin plugin, Konten konten) {
        this.plugin = plugin;
        this.konten = konten;
    }

    void laden(ConfigurationSection c, List<String> nickSperrliste) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        if (!aktiv) {
            return;
        }
        try {
            lp = LuckPermsProvider.get();
        } catch (IllegalStateException | NoClassDefFoundError e) {
            plugin.getLogger().warning("Clan/Team: LuckPerms nicht geladen, Clans/Teams aus");
            aktiv = false;
            return;
        }
        einladungTage = Math.max(1, c.getInt("einladung-tage", 7));
        List<String> s = new ArrayList<>(nickSperrliste);
        c.getStringList("sperrliste").forEach(w -> s.add(Namen.grundform(w)));
        sperrliste = s;
        List<String> b = new ArrayList<>();
        Path woerter = plugin.getDataFolder().toPath().resolve(c.getString("woerter-datei", "clans-woerter.txt"));
        try {
            if (Files.exists(woerter)) {
                for (String z : Files.readAllLines(woerter, StandardCharsets.UTF_8)) {
                    String f = Namen.grundform(z.strip());
                    if (!z.strip().startsWith("#") && f.length() >= 3) {
                        b.add(f);
                    }
                }
            }
        } catch (IOException e) {
            plugin.getLogger().warning("Clan/Team: " + woerter + " nicht lesbar: " + e.getMessage());
        }
        beleidigungen = b;
        plugin.getLogger().info("Clan/Team: an, Sperrliste " + sperrliste.size() + ", Wortliste " + beleidigungen.size() + " (" + woerter.getFileName() + ")");
    }

    boolean aktiv() {
        return aktiv;
    }

    // ---------- Prüfungen (statisch, für den Test) ----------

    /** Format von Kürzel, Name, Farbe; null = in Ordnung, sonst Fehlercode */
    static String formatFehler(String kuerzel, String name, String farbe) {
        if (kuerzel == null || !KUERZEL.matcher(kuerzel).matches()) {
            return "kuerzel";
        }
        if (name == null || !NAME.matcher(name).matches() || !name.equals(name.strip()) || name.contains("  ")) {
            return "name";
        }
        if (farbe == null || !FARBEN.containsKey(farbe)) {
            return "farbe";
        }
        return null;
    }

    /** gesperrt? null = nein, sonst „sperrliste“ oder „beleidigung“. Kurze Sperrwörter (unter 5) nur als ganzes Wort, längere auch als Teil (wie /nick) */
    static String sperrGrund(String text, List<String> sperr, List<String> beleid) {
        String form = Namen.grundform(text);
        Set<String> woerter = new HashSet<>();
        for (String w : text.split("[\\s_'\\-]+")) {
            woerter.add(Namen.grundform(w));
        }
        for (String s : sperr) {
            if (!s.isEmpty() && (s.length() >= 5 ? form.contains(s) : form.equals(s) || woerter.contains(s))) {
                return "sperrliste";
            }
        }
        for (String b : beleid) {
            if (form.contains(b)) {
                return "beleidigung";
            }
        }
        return null;
    }

    static String gruppe(String kuerzel) {
        return GRUPPE + kuerzel.toLowerCase(Locale.ROOT);
    }

    static String praefix(String kuerzel, String farbe) {
        return "&" + FARBEN.get(farbe) + "[" + kuerzel + "]";
    }

    // ---------- Lesen ----------

    private record Mitglied(UUID uuid, String name, Instant seit) {
    }

    private static String meta(Group g, String key) {
        return g.getNodes(NodeType.META).stream().filter(n -> n.getMetaKey().equals(key)).map(MetaNode::getMetaValue).findFirst().orElse(null);
    }

    private List<Group> clanGruppen() {
        lp.getGroupManager().loadAllGroups().join();
        return lp.getGroupManager().getLoadedGroups().stream().filter(g -> g.getName().startsWith(GRUPPE))
                .sorted(Comparator.comparing(Group::getName)).toList();
    }

    private Group gruppeHolen(String kuerzel) throws DiscordWhitelist.ApiFehler {
        String k = kuerzel.toUpperCase(Locale.ROOT);
        if (!k.matches("[A-Z0-9]{1,16}")) {
            throw new DiscordWhitelist.ApiFehler(404, "clan");
        }
        Group g = lp.getGroupManager().loadGroup(gruppe(k)).join().orElse(null);
        if (g == null) {
            throw new DiscordWhitelist.ApiFehler(404, "clan");
        }
        return g;
    }

    private static String kuerzelVon(Group g) {
        return g.getName().substring(GRUPPE.length()).toUpperCase(Locale.ROOT);
    }

    private List<Mitglied> mitglieder(Group g) {
        Map<UUID, Collection<InheritanceNode>> treffer = lp.getUserManager()
                .searchAll(NodeMatcher.key(InheritanceNode.builder(g.getName()).build())).join();
        List<Mitglied> l = new ArrayList<>();
        for (UUID u : treffer.keySet()) {
            User user = lp.getUserManager().loadUser(u).join();
            String seit = user.getCachedData().getMetaData().getMetaValue(M_SEIT);
            Instant s;
            try {
                s = seit == null ? Instant.EPOCH : Instant.parse(seit);
            } catch (RuntimeException e) {
                s = Instant.EPOCH;
            }
            l.add(new Mitglied(u, user.getUsername() == null ? u.toString() : user.getUsername(), s));
        }
        l.sort(Comparator.comparing(Mitglied::seit).thenComparing(Mitglied::name));
        return l;
    }

    /** Clan des Spielers (erste clan-Gruppe als direkter Parent) oder null */
    private Group clanVon(UUID u) {
        User user = lp.getUserManager().loadUser(u).join();
        for (InheritanceNode n : user.getNodes(NodeType.INHERITANCE)) {
            if (n.getGroupName().startsWith(GRUPPE)) {
                Group g = lp.getGroupManager().loadGroup(n.getGroupName()).join().orElse(null);
                if (g != null) {
                    return g;
                }
            }
        }
        return null;
    }

    private JsonObject person(UUID u, String name) {
        JsonObject o = new JsonObject();
        String d = konten.discordVon(u);
        if (d == null) {
            o.add("discord", JsonNull.INSTANCE);
        } else {
            o.addProperty("discord", d);
        }
        o.addProperty("name", name);
        o.addProperty("uuid", u.toString());
        return o;
    }

    private JsonObject clanJson(Group g) {
        List<Mitglied> m = mitglieder(g);
        JsonObject o = new JsonObject();
        o.addProperty("kuerzel", kuerzelVon(g));
        o.addProperty("name", meta(g, M_NAME));
        o.addProperty("farbe", meta(g, M_FARBE));
        o.addProperty("gegruendet", meta(g, M_GEGRUENDET));
        String leiter = meta(g, M_LEITER);
        Mitglied l = m.stream().filter(x -> x.uuid().toString().equals(leiter)).findFirst().orElse(null);
        o.add("leiter", l == null ? JsonNull.INSTANCE : person(l.uuid(), l.name()));
        JsonArray a = new JsonArray();
        for (Mitglied x : m) {
            JsonObject p = person(x.uuid(), x.name());
            p.addProperty("seit", x.seit().equals(Instant.EPOCH) ? null : x.seit().toString());
            a.add(p);
        }
        o.add("mitglieder", a);
        JsonArray e = new JsonArray();
        Instant jetzt = Instant.now();
        for (MetaNode n : g.getNodes(NodeType.META)) {
            if (n.getMetaKey().startsWith(M_EINLADUNG)) {
                try {
                    UUID u = UUID.fromString(n.getMetaKey().substring(M_EINLADUNG.length()));
                    Instant bis = Instant.parse(n.getMetaValue());
                    if (bis.isAfter(jetzt)) {
                        String name = lp.getUserManager().loadUser(u).join().getUsername();
                        JsonObject p = person(u, name == null ? u.toString() : name);
                        p.remove("uuid");
                        p.addProperty("bis", bis.toString());
                        e.add(p);
                    }
                } catch (RuntimeException ignoriert) {
                    // kaputter Eintrag: überspringen
                }
            }
        }
        o.add("einladungen", e);
        return o;
    }

    // ---------- Ändern ----------

    private void gruppeAendern(Group g) {
        lp.getGroupManager().saveGroup(g).join();
    }

    private static void metaSetzen(Group g, String key, String wert) {
        g.data().clear(NodeType.META.predicate(n -> n.getMetaKey().equals(key)));
        if (wert != null) {
            g.data().add(MetaNode.builder(key, wert).build());
        }
    }

    private void eintreten(UUID u, Group g) {
        lp.getUserManager().modifyUser(u, user -> {
            user.data().clear(NodeType.INHERITANCE.predicate(n -> n.getGroupName().startsWith(GRUPPE)));
            user.data().clear(NodeType.META.predicate(n -> n.getMetaKey().equals(M_SEIT)));
            user.data().add(InheritanceNode.builder(g.getName()).build());
            user.data().add(MetaNode.builder(M_SEIT, Instant.now().toString()).build());
        }).join();
    }

    private void austreten(UUID u, Group g) {
        lp.getUserManager().modifyUser(u, user -> {
            user.data().clear(NodeType.INHERITANCE.predicate(n -> n.getGroupName().equals(g.getName())));
            user.data().clear(NodeType.META.predicate(n -> n.getMetaKey().equals(M_SEIT)));
        }).join();
    }

    /** nach einem Austritt: Leitung nachrücken lassen oder auflösen; liefert [neuer Leiter UUID oder null, aufgelöst] */
    private Object[] nachAustritt(Group g, UUID weg) {
        List<Mitglied> rest = mitglieder(g).stream().filter(x -> !x.uuid().equals(weg)).toList();
        if (rest.isEmpty()) {
            aufloesen(g);
            return new Object[] {null, true};
        }
        if (weg.toString().equals(meta(g, M_LEITER))) {
            UUID neu = rest.get(0).uuid();
            metaSetzen(g, M_LEITER, neu.toString());
            gruppeAendern(g);
            return new Object[] {neu, false};
        }
        return new Object[] {null, false};
    }

    private List<String> aufloesen(Group g) {
        List<String> namen = new ArrayList<>();
        for (Mitglied m : mitglieder(g)) {
            austreten(m.uuid(), g);
            namen.add(m.name());
        }
        lp.getGroupManager().deleteGroup(g).join();
        plugin.getLogger().info("Clan/Team: " + kuerzelVon(g) + " aufgelöst" + (namen.isEmpty() ? "" : " (" + String.join(", ", namen) + ")"));
        return namen;
    }

    // ---------- API ----------

    private String[] konto(String discord) throws DiscordWhitelist.ApiFehler {
        String[] k = konten.zuDiscord(discord);
        if (k == null) {
            throw new DiscordWhitelist.ApiFehler(404, "konto");
        }
        return k;
    }

    private static String von(String s) throws DiscordWhitelist.ApiFehler {
        if (s == null || !s.matches("\\d{5,25}")) {
            throw new DiscordWhitelist.ApiFehler(400, "von");
        }
        return s;
    }

    private static String feld(JsonObject o, String f) {
        return o != null && o.has(f) && o.get(f).isJsonPrimitive() ? o.get(f).getAsString() : null;
    }

    private static DiscordWhitelist.ApiFehler gesperrt(String grund) {
        DiscordWhitelist.ApiFehler f = new DiscordWhitelist.ApiFehler(422, "gesperrt");
        f.extra.addProperty("grund", grund);
        return f;
    }

    /** volle Prüfung wie bei der Gründung (ohne „im-clan“); liefert das normierte Kürzel */
    private String pruefen(String kuerzelRoh, String name, String farbe) throws DiscordWhitelist.ApiFehler {
        String k = kuerzelRoh == null ? null : kuerzelRoh.strip().toUpperCase(Locale.ROOT);
        String n = name == null ? null : name.strip();
        String fehler = formatFehler(k, n, farbe);
        if (fehler != null) {
            throw new DiscordWhitelist.ApiFehler(400, fehler);
        }
        String grund = sperrGrund(k, sperrliste, beleidigungen);
        if (grund == null) {
            grund = sperrGrund(n, sperrliste, beleidigungen);
        }
        if (grund != null) {
            throw gesperrt(grund);
        }
        String form = Namen.grundform(k);
        for (Group g : clanGruppen()) {
            if (Namen.grundform(kuerzelVon(g)).equals(form)) {
                throw new DiscordWhitelist.ApiFehler(409, "kuerzel-vergeben");
            }
        }
        // Nachahmung: Name oder Nick eines bekannten Spielers
        Set<String> bekannt = new HashSet<>();
        try {
            bekannt.addAll(Bukkit.getScheduler().callSyncMethod(plugin, () -> {
                Set<String> s = new HashSet<>();
                for (OfflinePlayer o : Bukkit.getOfflinePlayers()) {
                    if (o.getName() != null) {
                        s.add(Namen.grundform(o.getName()));
                    }
                }
                Bukkit.getOnlinePlayers().forEach(p -> s.add(Namen.grundform(p.getName())));
                return s;
            }).get(5, TimeUnit.SECONDS));
        } catch (Exception e) {
            plugin.getLogger().warning("Clan/Team: Spielernamen nicht lesbar: " + e);
        }
        lp.getUserManager().searchAll(NodeMatcher.metaKey("nick")).join().values()
                .forEach(c -> c.forEach(m -> bekannt.add(Namen.grundform(m.getMetaValue()))));
        if (bekannt.contains(form)) {
            throw gesperrt("nachahmung");
        }
        return k;
    }

    /** alle Anfragen nacheinander (Bot-Session 01.11.: Beitritt/Rauswurf, Gründungen mit gleicher Grundform, Leitung/Austritt dürfen sich nicht überschneiden) */
    synchronized Antwort anfrage(String methode, String pfad, Map<String, String> q, JsonObject rumpf) throws DiscordWhitelist.ApiFehler {
        if (!aktiv) {
            throw new DiscordWhitelist.ApiFehler(503, "clans");
        }
        String[] teile = pfad.substring(1).split("/");   // clans, <K>, mitglieder, <id>
        int n = teile.length;
        if (methode.equals("GET") && n == 1) {
            JsonArray a = new JsonArray();
            clanGruppen().forEach(g -> a.add(clanJson(g)));
            JsonObject o = new JsonObject();
            o.add("clans", a);
            return new Antwort(200, o);
        }
        if (methode.equals("GET") && n == 2 && teile[1].equals("pruefen")) {
            String k = pruefen(q.get("kuerzel"), q.get("name"), q.get("farbe"));
            JsonObject o = new JsonObject();
            o.addProperty("ok", true);
            o.addProperty("kuerzel", k);
            return new Antwort(200, o);
        }
        if (methode.equals("GET") && n == 3 && teile[1].equals("von")) {
            String[] k = konto(von(teile[2]));
            UUID u = UUID.fromString(k[0]);
            Group g = clanVon(u);
            JsonObject o = new JsonObject();
            o.add("clan", g == null ? JsonNull.INSTANCE : clanJson(g));
            JsonArray e = new JsonArray();
            Instant jetzt = Instant.now();
            for (Group c : clanGruppen()) {
                String bis = meta(c, M_EINLADUNG + u);
                try {
                    if (bis != null && Instant.parse(bis).isAfter(jetzt)) {
                        JsonObject x = new JsonObject();
                        x.addProperty("kuerzel", kuerzelVon(c));
                        x.addProperty("name", meta(c, M_NAME));
                        x.addProperty("farbe", meta(c, M_FARBE));
                        x.addProperty("bis", bis);
                        e.add(x);
                    }
                } catch (RuntimeException ignoriert) {
                    // kaputter Eintrag
                }
            }
            o.add("einladungen", e);
            return new Antwort(200, o);
        }
        if (methode.equals("GET") && n == 2) {
            return new Antwort(200, clanJson(gruppeHolen(teile[1])));
        }
        if (methode.equals("POST") && n == 1) {
            String d = von(feld(rumpf, "von"));
            String[] k = konto(d);
            UUID u = UUID.fromString(k[0]);
            String kuerzel = pruefen(feld(rumpf, "kuerzel"), feld(rumpf, "name"), feld(rumpf, "farbe"));
            Group alt = clanVon(u);
            if (alt != null) {
                DiscordWhitelist.ApiFehler f = new DiscordWhitelist.ApiFehler(409, "im-clan");
                f.extra.addProperty("clan", kuerzelVon(alt));
                throw f;
            }
            Group g = lp.getGroupManager().createAndLoadGroup(gruppe(kuerzel)).join();
            String farbe = feld(rumpf, "farbe");
            g.data().add(PrefixNode.builder(praefix(kuerzel, farbe), 100).build());
            metaSetzen(g, M_NAME, feld(rumpf, "name").strip());
            metaSetzen(g, M_FARBE, farbe);
            metaSetzen(g, M_LEITER, u.toString());
            metaSetzen(g, M_GEGRUENDET, Instant.now().toString());
            gruppeAendern(g);
            eintreten(u, g);
            plugin.getLogger().info("Clan/Team: +" + kuerzel + " von " + k[1]);
            return new Antwort(201, clanJson(g));
        }
        if (n >= 3 && teile[2].equals("einladungen")) {
            Group g = gruppeHolen(teile[1]);
            if (methode.equals("POST") && n == 3) {
                String d = von(feld(rumpf, "von"));
                if (!konto(d)[0].equals(meta(g, M_LEITER))) {
                    throw new DiscordWhitelist.ApiFehler(403, "kein-leiter");
                }
                String an = von(feld(rumpf, "an"));
                if (an.equals(d)) {
                    throw new DiscordWhitelist.ApiFehler(400, "selbst");
                }
                String[] ziel = konto(an);
                Group dessen = clanVon(UUID.fromString(ziel[0]));
                if (dessen != null && dessen.getName().equals(g.getName())) {
                    throw new DiscordWhitelist.ApiFehler(409, "schon-mitglied");
                }
                Instant bis = Instant.now().plus(Duration.ofDays(einladungTage));
                metaSetzen(g, M_EINLADUNG + ziel[0], bis.toString());
                gruppeAendern(g);
                plugin.getLogger().info("Clan/Team: " + kuerzelVon(g) + " lädt " + ziel[1] + " ein");
                JsonObject o = new JsonObject();
                JsonObject p = new JsonObject();
                p.addProperty("discord", an);
                p.addProperty("name", ziel[1]);
                o.add("an", p);
                o.addProperty("bis", bis.toString());
                o.addProperty("kuerzel", kuerzelVon(g));
                o.addProperty("name", meta(g, M_NAME));
                o.addProperty("farbe", meta(g, M_FARBE));
                return new Antwort(200, o);
            }
            if (methode.equals("DELETE") && n == 4) {
                String d = von(q.get("von"));
                String ziel = von(teile[3]);
                String[] wer = konto(d);
                boolean darf = d.equals(ziel) || wer[0].equals(meta(g, M_LEITER));
                if (!darf) {
                    throw new DiscordWhitelist.ApiFehler(403, "kein-recht");
                }
                String[] z = konten.zuDiscord(ziel);
                if (z != null) {
                    metaSetzen(g, M_EINLADUNG + z[0], null);
                    gruppeAendern(g);
                }
                return new Antwort(200, new JsonObject());
            }
        }
        if (n >= 3 && teile[2].equals("mitglieder")) {
            Group g = gruppeHolen(teile[1]);
            if (methode.equals("POST") && n == 3) {
                String d = von(feld(rumpf, "von"));
                String[] k = konto(d);
                UUID u = UUID.fromString(k[0]);
                String bis = meta(g, M_EINLADUNG + u);
                boolean gueltig;
                try {
                    gueltig = bis != null && Instant.parse(bis).isAfter(Instant.now());
                } catch (RuntimeException e) {
                    gueltig = false;
                }
                if (!gueltig) {
                    throw new DiscordWhitelist.ApiFehler(403, "keine-einladung");
                }
                Group alt = clanVon(u);
                String verlassen = null;
                String aufgeloest = null;
                if (alt != null && !alt.getName().equals(g.getName())) {
                    verlassen = kuerzelVon(alt);
                    austreten(u, alt);
                    if ((Boolean) nachAustritt(alt, u)[1]) {
                        aufgeloest = verlassen;
                    }
                }
                metaSetzen(g, M_EINLADUNG + u, null);
                gruppeAendern(g);
                eintreten(u, g);
                plugin.getLogger().info("Clan/Team: " + k[1] + " → " + kuerzelVon(g) + (verlassen == null ? "" : " (vorher " + verlassen + ")"));
                JsonObject o = new JsonObject();
                o.add("clan", clanJson(g));
                o.addProperty("verlassen", verlassen);
                o.addProperty("aufgeloest", aufgeloest);
                return new Antwort(200, o);
            }
            if (methode.equals("DELETE") && n == 4) {
                String d = von(q.get("von"));
                String ziel = von(teile[3]);
                String[] wer = konto(d);
                String[] z = konto(ziel);
                boolean selbst = d.equals(ziel);
                if (!selbst && !wer[0].equals(meta(g, M_LEITER))) {
                    throw new DiscordWhitelist.ApiFehler(403, "kein-recht");
                }
                UUID zu = UUID.fromString(z[0]);
                Group dessen = clanVon(zu);
                if (dessen == null || !dessen.getName().equals(g.getName())) {
                    throw new DiscordWhitelist.ApiFehler(404, "kein-mitglied");
                }
                austreten(zu, g);
                Object[] folge = nachAustritt(g, zu);
                plugin.getLogger().info("Clan/Team: " + z[1] + (selbst ? " verlässt " : " fliegt aus ") + kuerzelVon(g));
                JsonObject o = new JsonObject();
                boolean weg = (Boolean) folge[1];
                o.add("clan", weg ? JsonNull.INSTANCE : clanJson(g));
                String neuerLeiter = folge[0] == null ? null : konten.discordVon((UUID) folge[0]);
                o.addProperty("neuer_leiter", neuerLeiter);
                o.addProperty("aufgeloest", weg);
                return new Antwort(200, o);
            }
        }
        if (methode.equals("PUT") && n == 3 && teile[2].equals("leiter")) {
            Group g = gruppeHolen(teile[1]);
            String d = von(feld(rumpf, "von"));
            if (!konto(d)[0].equals(meta(g, M_LEITER))) {
                throw new DiscordWhitelist.ApiFehler(403, "kein-leiter");
            }
            String[] z = konto(von(feld(rumpf, "an")));
            Group dessen = clanVon(UUID.fromString(z[0]));
            if (dessen == null || !dessen.getName().equals(g.getName())) {
                throw new DiscordWhitelist.ApiFehler(404, "kein-mitglied");
            }
            metaSetzen(g, M_LEITER, z[0]);
            gruppeAendern(g);
            plugin.getLogger().info("Clan/Team: " + kuerzelVon(g) + " Leitung → " + z[1]);
            return new Antwort(200, clanJson(g));
        }
        if (methode.equals("DELETE") && n == 2 && "1".equals(q.get("admin"))) {
            Group g = gruppeHolen(teile[1]);
            String k = kuerzelVon(g);
            String wer = q.get("von");
            String[] admin = wer == null || !wer.matches("\\d{5,25}") ? null : konten.zuDiscord(wer);
            plugin.getLogger().info("Clan/Team: " + k + " gelöscht von " + (admin != null ? admin[1] + " (Discord " + wer + ")" : wer == null ? "?" : "Discord " + wer));
            List<String> namen = aufloesen(g);
            JsonObject o = new JsonObject();
            o.addProperty("aufgeloest", k);
            JsonArray a = new JsonArray();
            namen.forEach(a::add);
            o.add("mitglieder", a);
            return new Antwort(200, o);
        }
        throw new DiscordWhitelist.ApiFehler(404, "pfad");
    }
}
