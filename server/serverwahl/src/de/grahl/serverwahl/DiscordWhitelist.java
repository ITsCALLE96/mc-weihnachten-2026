package de.grahl.serverwahl;

import java.io.IOException;
import java.io.InputStream;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.HexFormat;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.function.Predicate;
import java.util.regex.Pattern;

import com.google.gson.Gson;
import com.google.gson.GsonBuilder;
import com.google.gson.JsonObject;
import com.google.gson.JsonParser;
import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;

import io.papermc.paper.connection.PlayerConfigurationConnection;
import io.papermc.paper.connection.PlayerLoginConnection;
import io.papermc.paper.event.connection.PlayerConnectionValidateLoginEvent;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.TranslatableComponent;
import net.kyori.adventure.text.format.NamedTextColor;

import org.bukkit.Bukkit;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.plugin.Plugin;

/**
 * Discord-Whitelist (Spezifikation server/discord-whitelist.md, Pascal/Leitung 28.10.): Der Community-Bot meldet angemeldete Discord-Mitglieder
 * über einen kleinen HTTP-Endpunkt (nur Hub, nur LAN, IP-Sperre + Schlüssel) an; die Einträge liegen in einer gemeinsamen Datei, die Hub und SMP
 * alle paar Sekunden lesen. Wer dort steht, darf trotz Vanilla-Whitelist herein (die Vanilla-Whitelist bleibt für Pascal und Tester von Hand).
 * Fällt jemand aus der Datei, wird er gekickt, sofern er nicht von Hand auf der Whitelist steht oder Op ist. Spielerdaten und Bauten bleiben.
 * Namensprüfung auf dem Server: Java über die Mojang-API, Bedrock über die GeyserMC-API (Gamertag → XUID → Floodgate-UUID).
 * Mehrere Discord-Server (Pascal 28.10.): Jeder Eintrag merkt sich die Guilds, die ihn freigeben; er fällt erst weg, wenn keine mehr übrig ist.
 * Nur Guilds aus api.gilden werden angenommen.
 */
final class DiscordWhitelist implements Listener {

    private static final Gson GSON = new GsonBuilder().setPrettyPrinting().disableHtmlEscaping().create();
    private static final Pattern JAVA_NAME = Pattern.compile("[A-Za-z0-9_]{3,16}");
    private static final Pattern BEDROCK_NAME = Pattern.compile("[A-Za-z0-9 ]{1,16}");
    private static final Pattern DISCORD_ID = Pattern.compile("\\d{5,25}");

    /** ein Eintrag der gemeinsamen Datei */
    static final class Eintrag {
        String discord;
        String name;
        String uuid;
        String edition;
        /** Guild-IDs, über die der Eintrag freigegeben ist */
        List<String> gilden = new ArrayList<>();
    }

    static final class Datei {
        String stand;
        List<Eintrag> eintraege = new ArrayList<>();
    }

    private record Konto(String name, UUID uuid, String edition, String kopf) {
    }

    /** Fehler, die als HTTP-Antwort zurückgehen */
    private static final class ApiFehler extends Exception {
        final int status;

        ApiFehler(int status, String text) {
            super(text);
            this.status = status;
        }
    }

    private final Plugin plugin;
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build();
    private boolean aktiv;
    private Path datei;
    private String kickText;
    private String floodgatePraefix;
    /** zugelassene UUIDs aus der Datei (für den Login-Thread) */
    private volatile Set<UUID> erlaubt = Set.of();
    private long zuletztGeaendert = -1;
    private HttpServer server;
    private Set<String> erlaubteIps = Set.of();
    private Set<String> erlaubteGilden = Set.of();
    private byte[] schluessel;
    private final Object schreibSperre = new Object();
    private final Map<String, Konto> zwischenspeicher = new ConcurrentHashMap<>();
    private final Map<String, Long> zwischenspeicherZeit = new ConcurrentHashMap<>();
    private volatile long sekunde;
    private volatile int anfragenInSekunde;

    DiscordWhitelist(Plugin plugin) {
        this.plugin = plugin;
        Bukkit.getScheduler().runTaskTimer(plugin, this::abgleichen, 40L, 200L);
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        apiStoppen();
        if (!aktiv) {
            erlaubt = Set.of();
            return;
        }
        datei = Path.of(c.getString("datei", "/opt/mc-weihnachten/whitelist/discord.json"));
        kickText = c.getString("kick-text", "Du stehst nicht mehr auf der Whitelist (Discord-Anmeldung bzw. Rolle fehlt).");
        floodgatePraefix = c.getString("floodgate-praefix", ".");
        zuletztGeaendert = -1;
        abgleichen();
        ConfigurationSection api = c.getConfigurationSection("api");
        if (api != null && api.getBoolean("aktiv", false)) {
            apiStarten(api);
        }
    }

    // ---------- Datei und Abgleich (Hub + SMP) ----------

    private Datei lesen() throws IOException {
        if (!Files.exists(datei)) {
            return new Datei();
        }
        Datei d = GSON.fromJson(Files.readString(datei), Datei.class);
        if (d == null) {
            d = new Datei();
        }
        if (d.eintraege == null) {
            d.eintraege = new ArrayList<>();
        }
        for (Eintrag e : d.eintraege) {
            if (e.gilden == null) {
                e.gilden = new ArrayList<>();
            }
        }
        return d;
    }

    /** atomar schreiben (temporäre Datei + Umbenennen), damit der andere Server nie eine halbe Datei liest */
    private void schreiben(Datei d) throws IOException {
        d.stand = Instant.now().toString();
        Files.createDirectories(datei.getParent());
        Path tmp = datei.resolveSibling(datei.getFileName() + ".tmp");
        Files.writeString(tmp, GSON.toJson(d));
        Files.move(tmp, datei, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
    }

    /** alle 10 s: Datei neu lesen, wenn geändert; Gekickte bestimmen */
    private void abgleichen() {
        if (!aktiv) {
            return;
        }
        long geaendert;
        try {
            geaendert = Files.exists(datei) ? Files.getLastModifiedTime(datei).toMillis() : 0;
        } catch (IOException e) {
            return;
        }
        if (geaendert == zuletztGeaendert) {
            return;
        }
        Set<UUID> neu = new HashSet<>();
        try {
            for (Eintrag e : lesen().eintraege) {
                neu.add(UUID.fromString(e.uuid));
            }
        } catch (IOException | RuntimeException ex) {
            plugin.getLogger().warning("Discord-Whitelist: Datei nicht lesbar (" + ex.getMessage() + "), alter Stand bleibt");
            return;
        }
        Set<UUID> alt = erlaubt;
        erlaubt = Set.copyOf(neu);
        zuletztGeaendert = geaendert;
        if (alt.size() != neu.size() || !alt.equals(neu)) {
            plugin.getLogger().info("Discord-Whitelist: " + neu.size() + " Einträge");
        }
        for (UUID weg : alt) {
            if (neu.contains(weg)) {
                continue;
            }
            Player p = Bukkit.getPlayer(weg);
            if (p != null && !p.isWhitelisted() && !p.isOp()) {
                p.kick(Component.text(kickText, NamedTextColor.RED));
                plugin.getLogger().info("Discord-Whitelist: " + p.getName() + " gekickt (nicht mehr eingetragen)");
            }
        }
    }

    /** Vanilla lehnt wegen Whitelist ab → wer in der Discord-Datei steht, darf trotzdem (nur genau diese Ablehnung wird aufgehoben) */
    @EventHandler(priority = EventPriority.HIGH)
    public void beimPruefen(PlayerConnectionValidateLoginEvent e) {
        if (!aktiv || e.isAllowed() || !(e.getKickMessage() instanceof TranslatableComponent t)
                || !t.key().equals("multiplayer.disconnect.not_whitelisted")) {
            return;
        }
        UUID id = null;
        if (e.getConnection() instanceof PlayerLoginConnection l && l.getAuthenticatedProfile() != null) {
            id = l.getAuthenticatedProfile().getId();
        } else if (e.getConnection() instanceof PlayerConfigurationConnection k) {
            id = k.getProfile().getId();
        }
        if (id != null && erlaubt.contains(id)) {
            e.allow();
        }
    }

    // ---------- HTTP-Endpunkt (nur Hub) ----------

    private void apiStarten(ConfigurationSection api) {
        try {
            Path keyDatei = plugin.getDataFolder().toPath().resolve(api.getString("schluessel-datei", "whitelist-api.key"));
            if (!Files.exists(keyDatei)) {
                byte[] b = new byte[32];
                new SecureRandom().nextBytes(b);
                Files.writeString(keyDatei, HexFormat.of().formatHex(b) + System.lineSeparator());
                plugin.getLogger().info("Discord-Whitelist: neuer API-Schlüssel in " + keyDatei + " (für den Bot kopieren, nie ins Repo)");
            }
            schluessel = Files.readString(keyDatei).trim().getBytes(StandardCharsets.UTF_8);
            erlaubteIps = Set.copyOf(api.getStringList("erlaubt"));
            erlaubteGilden = Set.copyOf(api.getStringList("gilden"));
            if (erlaubteGilden.isEmpty()) {
                plugin.getLogger().warning("Discord-Whitelist: keine Guild in api.gilden – alle Anmeldungen werden abgelehnt");
            }
            server = HttpServer.create(new InetSocketAddress(api.getString("adresse", "127.0.0.1"), api.getInt("port", 8765)), 8);
            server.createContext("/", this::anfrage);
            server.setExecutor(Executors.newSingleThreadExecutor(r -> {
                Thread t = new Thread(r, "serverwahl-whitelist-api");
                t.setDaemon(true);
                return t;
            }));
            server.start();
            plugin.getLogger().info("Discord-Whitelist: API auf " + server.getAddress() + ", erlaubt von " + erlaubteIps);
        } catch (IOException | RuntimeException e) {
            plugin.getLogger().severe("Discord-Whitelist: API startet nicht: " + e);
            server = null;
        }
    }

    void apiStoppen() {
        if (server != null) {
            server.stop(0);
            server = null;
        }
    }

    private void anfrage(HttpExchange x) throws IOException {
        try (x) {
            String ip = x.getRemoteAddress().getAddress().getHostAddress();
            if (!erlaubteIps.contains(ip)) {
                antwort(x, 403, fehler("ip"));
                return;
            }
            String auth = x.getRequestHeaders().getFirst("Authorization");
            byte[] gegeben = auth != null && auth.startsWith("Bearer ") ? auth.substring(7).trim().getBytes(StandardCharsets.UTF_8) : new byte[0];
            if (!MessageDigest.isEqual(gegeben, schluessel)) {
                antwort(x, 401, fehler("schluessel"));
                return;
            }
            long jetzt = System.currentTimeMillis() / 1000;
            if (jetzt != sekunde) {
                sekunde = jetzt;
                anfragenInSekunde = 0;
            }
            if (++anfragenInSekunde > 10) {
                antwort(x, 429, fehler("zu viele"));
                return;
            }
            String pfad = x.getRequestURI().getPath();
            String methode = x.getRequestMethod();
            try {
                Map<String, String> q = query(x.getRequestURI().getRawQuery());
                if (methode.equals("GET") && pfad.equals("/pruefen")) {
                    Konto k = konto(q.getOrDefault("name", ""), q.getOrDefault("edition", "java"));
                    // mit discord=<id>: das eigene, schon eingetragene Konto zählt nicht als belegt (Anmeldung über die zweite Guild)
                    String eigene = q.containsKey("discord") ? discordId(q.get("discord")) : null;
                    JsonObject o = kontoJson(k);
                    o.addProperty("belegt", belegtVonAnderem(k.uuid(), eigene));
                    antwort(x, 200, o);
                } else if (methode.equals("GET") && pfad.equals("/whitelist")) {
                    // mit guild=<id> nur die Einträge dieser Guild
                    String gilde = q.containsKey("guild") ? gilde(q.get("guild")) : null;
                    synchronized (schreibSperre) {
                        Datei d = lesen();
                        if (gilde != null) {
                            d.eintraege.removeIf(e -> !e.gilden.contains(gilde));
                        }
                        antwort(x, 200, JsonParser.parseString(GSON.toJson(d)).getAsJsonObject());
                    }
                } else if (methode.equals("PUT") && pfad.startsWith("/whitelist/")) {
                    String discord = discordId(pfad.substring("/whitelist/".length()));
                    JsonObject rumpf = rumpf(x);
                    String gilde = gilde(text(rumpf, "guild"));
                    Konto k = konto(text(rumpf, "name"), text(rumpf, "edition"));
                    antwort(x, 200, eintragen(discord, k, gilde));
                } else if (methode.equals("DELETE") && pfad.startsWith("/whitelist/")) {
                    String discord = discordId(pfad.substring("/whitelist/".length()));
                    String gilde = gilde(q.get("guild"));
                    JsonObject o = new JsonObject();
                    o.add("entfernt", GSON.toJsonTree(austragen(gilde, e -> e.discord.equals(discord))));
                    antwort(x, 200, o);
                } else if (methode.equals("PUT") && pfad.equals("/whitelist")) {
                    JsonObject rumpf = rumpf(x);
                    String gilde = gilde(text(rumpf, "guild"));
                    Set<String> behalten = new HashSet<>();
                    if (!rumpf.has("discord") || !rumpf.get("discord").isJsonArray()) {
                        throw new ApiFehler(400, "discord");
                    }
                    rumpf.getAsJsonArray("discord").forEach(el -> behalten.add(el.getAsString()));
                    JsonObject o = new JsonObject();
                    o.add("entfernt", GSON.toJsonTree(austragen(gilde, e -> !behalten.contains(e.discord))));
                    antwort(x, 200, o);
                } else {
                    antwort(x, 404, fehler("pfad"));
                }
            } catch (ApiFehler f) {
                antwort(x, f.status, fehler(f.getMessage()));
            }
        } catch (RuntimeException e) {
            plugin.getLogger().warning("Discord-Whitelist API: " + e);
        }
    }

    /**
     * Ein Discord-Konto hat genau ein MC-Konto, egal über welche Guild: Der letzte PUT gilt (anderer Name ersetzt den alten, die Freigaben der
     * übrigen Guilds bleiben). Gehört das MC-Konto schon einem anderen Discord-Konto → 409.
     */
    private JsonObject eintragen(String discord, Konto k, String gilde) throws ApiFehler, IOException {
        synchronized (schreibSperre) {
            Datei d = lesen();
            if (belegtVonAnderem(k.uuid(), discord, d)) {
                throw new ApiFehler(409, "belegt");
            }
            Eintrag e = d.eintraege.stream().filter(a -> a.discord.equals(discord)).findFirst().orElse(null);
            boolean neu = e == null;
            if (neu) {
                e = new Eintrag();
                e.discord = discord;
                d.eintraege.add(e);
            } else if (!e.uuid.equals(k.uuid().toString())) {
                plugin.getLogger().info("Discord-Whitelist: Discord " + discord + " wechselt von " + e.name + " zu " + k.name());
            }
            e.name = k.name();
            e.uuid = k.uuid().toString();
            e.edition = k.edition();
            if (!e.gilden.contains(gilde)) {
                e.gilden.add(gilde);
            }
            schreiben(d);
            plugin.getLogger().info("Discord-Whitelist: +" + k.name() + " (" + k.edition() + ", Discord " + discord + ", Guild " + gilde + ")");
            JsonObject o = kontoJson(k);
            o.addProperty("neu", neu);
            o.add("gilden", GSON.toJsonTree(e.gilden));
            return o;
        }
    }

    /**
     * Freigabe der Guild bei allen betroffenen Einträgen entfernen (DELETE: genau eine Discord-ID; Abgleich: alle nicht mehr gemeldeten dieser
     * Guild). Andere Guilds bleiben unberührt; ein Eintrag fällt erst weg, wenn keine Guild ihn mehr freigibt. Rückgabe: ganz entfernte Namen.
     */
    private List<String> austragen(String gilde, Predicate<Eintrag> betroffen) throws IOException {
        synchronized (schreibSperre) {
            Datei d = lesen();
            List<String> weg = new ArrayList<>();
            Set<Eintrag> leer = new HashSet<>();
            boolean geaendert = false;
            for (Eintrag e : d.eintraege) {
                // Alt-Einträge ohne gilden (vor dem 28.10. abends, nur Testnetz) gelten als von jeder Guild freigegeben
                boolean alt = e.gilden.isEmpty();
                if (betroffen.test(e) && (e.gilden.remove(gilde) || alt)) {
                    geaendert = true;
                    if (e.gilden.isEmpty()) {
                        weg.add(e.name);
                        leer.add(e);
                    }
                }
            }
            if (geaendert) {
                d.eintraege.removeIf(leer::contains);
                schreiben(d);
                plugin.getLogger().info("Discord-Whitelist: Guild " + gilde + " zieht Freigaben zurück, ganz entfernt: " + weg);
            }
            return weg;
        }
    }

    private boolean belegtVonAnderem(UUID uuid, String discord) {
        synchronized (schreibSperre) {
            try {
                return belegtVonAnderem(uuid, discord, lesen());
            } catch (IOException e) {
                return false;
            }
        }
    }

    private static boolean belegtVonAnderem(UUID uuid, String discord, Datei d) {
        return d.eintraege.stream().anyMatch(e -> e.uuid.equals(uuid.toString()) && !e.discord.equals(discord));
    }

    // ---------- Namensprüfung ----------

    private Konto konto(String name, String edition) throws ApiFehler {
        name = name == null ? "" : name.trim();
        String schluesselCache = edition + ":" + name.toLowerCase();
        Long zeit = zwischenspeicherZeit.get(schluesselCache);
        if (zeit != null && System.currentTimeMillis() - zeit < 600_000) {
            return zwischenspeicher.get(schluesselCache);
        }
        Konto k;
        if ("java".equals(edition)) {
            if (!JAVA_NAME.matcher(name).matches()) {
                throw new ApiFehler(400, "name");
            }
            JsonObject o = holen("https://api.mojang.com/users/profiles/minecraft/" + name);
            String id = o.get("id").getAsString();
            UUID uuid = UUID.fromString(id.replaceFirst("(\\w{8})(\\w{4})(\\w{4})(\\w{4})(\\w{12})", "$1-$2-$3-$4-$5"));
            k = new Konto(o.get("name").getAsString(), uuid, "java", "https://mc-heads.net/avatar/" + uuid + "/64");
        } else if ("bedrock".equals(edition)) {
            if (name.startsWith(floodgatePraefix)) {
                name = name.substring(floodgatePraefix.length());
            }
            if (!BEDROCK_NAME.matcher(name).matches()) {
                throw new ApiFehler(400, "name");
            }
            JsonObject o = holen("https://api.geysermc.org/v2/xbox/xuid/" + URLEncoder.encode(name, StandardCharsets.UTF_8).replace("+", "%20"));
            long xuid = Long.parseLong(o.get("xuid").getAsString());
            String kopf = "https://mc-heads.net/avatar/MHF_Steve/64";
            try {
                JsonObject skin = holen("https://api.geysermc.org/v2/skin/" + xuid);
                if (skin.has("texture_id") && !skin.get("texture_id").getAsString().isBlank()) {
                    kopf = "https://mc-heads.net/avatar/" + skin.get("texture_id").getAsString() + "/64";
                }
            } catch (ApiFehler ignoriert) {
                // ohne Skin bleibt der Standardkopf
            }
            k = new Konto(floodgatePraefix + name.replace(' ', '_'), new UUID(0L, xuid), "bedrock", kopf);
        } else {
            throw new ApiFehler(400, "edition");
        }
        zwischenspeicher.put(schluesselCache, k);
        zwischenspeicherZeit.put(schluesselCache, System.currentTimeMillis());
        return k;
    }

    private JsonObject holen(String url) throws ApiFehler {
        try {
            HttpResponse<String> r = http.send(HttpRequest.newBuilder(URI.create(url)).timeout(Duration.ofSeconds(5))
                    .header("User-Agent", "serverwahl-weihnachten").GET().build(), HttpResponse.BodyHandlers.ofString());
            if (r.statusCode() == 404 || r.statusCode() == 204 || r.body().isBlank()) {
                throw new ApiFehler(404, "unbekannt");
            }
            if (r.statusCode() != 200) {
                throw new ApiFehler(503, "mojang");
            }
            JsonObject o = JsonParser.parseString(r.body()).getAsJsonObject();
            if (o.has("xuid") && o.get("xuid").isJsonNull() || o.size() == 0) {
                throw new ApiFehler(404, "unbekannt");
            }
            return o;
        } catch (IOException | InterruptedException | RuntimeException e) {
            if (e instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            throw new ApiFehler(503, "mojang");
        }
    }

    // ---------- Hilfen ----------

    /** Guild-ID prüfen: Format → 400, nicht in api.gilden → 403 */
    private String gilde(String s) throws ApiFehler {
        if (s == null || !DISCORD_ID.matcher(s).matches()) {
            throw new ApiFehler(400, "guild");
        }
        if (!erlaubteGilden.contains(s)) {
            throw new ApiFehler(403, "guild");
        }
        return s;
    }

    private static String discordId(String s) throws ApiFehler {
        if (!DISCORD_ID.matcher(s).matches()) {
            throw new ApiFehler(400, "discord");
        }
        return s;
    }

    private static JsonObject rumpf(HttpExchange x) throws ApiFehler {
        try (InputStream in = x.getRequestBody()) {
            byte[] b = in.readNBytes(65_537);
            if (b.length > 65_536) {
                throw new ApiFehler(413, "zu gross");
            }
            return JsonParser.parseString(new String(b, StandardCharsets.UTF_8)).getAsJsonObject();
        } catch (IOException | RuntimeException e) {
            throw new ApiFehler(400, "json");
        }
    }

    private static String text(JsonObject o, String feld) throws ApiFehler {
        if (!o.has(feld) || !o.get(feld).isJsonPrimitive()) {
            throw new ApiFehler(400, feld);
        }
        return o.get(feld).getAsString();
    }

    private static Map<String, String> query(String q) {
        Map<String, String> m = new java.util.HashMap<>();
        if (q == null) {
            return m;
        }
        for (String teil : q.split("&")) {
            int i = teil.indexOf('=');
            if (i > 0) {
                m.put(java.net.URLDecoder.decode(teil.substring(0, i), StandardCharsets.UTF_8),
                        java.net.URLDecoder.decode(teil.substring(i + 1), StandardCharsets.UTF_8));
            }
        }
        return m;
    }

    private static JsonObject kontoJson(Konto k) {
        JsonObject o = new JsonObject();
        o.addProperty("name", k.name());
        o.addProperty("uuid", k.uuid().toString());
        o.addProperty("edition", k.edition());
        o.addProperty("kopf", k.kopf());
        return o;
    }

    private static JsonObject fehler(String text) {
        JsonObject o = new JsonObject();
        o.addProperty("fehler", text);
        return o;
    }

    private static void antwort(HttpExchange x, int status, JsonObject o) throws IOException {
        byte[] b = GSON.toJson(o).getBytes(StandardCharsets.UTF_8);
        x.getResponseHeaders().set("Content-Type", "application/json; charset=utf-8");
        x.sendResponseHeaders(status, b.length);
        try (OutputStream out = x.getResponseBody()) {
            out.write(b);
        }
    }

    /** für /serverwahl whitelist: Stand anzeigen */
    String status() {
        return "Discord-Whitelist " + (aktiv ? "an" : "aus") + ", " + erlaubt.size() + " Einträge, Datei " + datei
                + (server != null ? ", API " + server.getAddress() + ", Guilds " + erlaubteGilden : ", ohne API");
    }
}
