package de.grahl.serverwahl;

import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Pattern;

import io.papermc.paper.event.player.AsyncChatEvent;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.minimessage.MiniMessage;
import net.kyori.adventure.text.serializer.legacy.LegacyComponentSerializer;
import net.luckperms.api.LuckPerms;
import net.luckperms.api.LuckPermsProvider;
import net.luckperms.api.cacheddata.CachedMetaData;
import net.luckperms.api.event.user.UserDataRecalculateEvent;
import net.luckperms.api.node.NodeType;
import net.luckperms.api.node.matcher.NodeMatcher;
import net.luckperms.api.node.types.MetaNode;

import org.bukkit.Bukkit;
import org.bukkit.OfflinePlayer;
import org.bukkit.command.Command;
import org.bukkit.command.CommandExecutor;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.player.PlayerJoinEvent;
import org.bukkit.event.player.PlayerQuitEvent;
import org.bukkit.plugin.Plugin;
import org.bukkit.scoreboard.Scoreboard;
import org.bukkit.scoreboard.Team;

/**
 * Nicknames und Clan-Tags (Pascal 28.10.): /nick setzt den eigenen Nick, gespeichert als LuckPerms-Meta „nick“, damit Hub und SMP
 * denselben Stand haben (gemeinsamer LuckPerms-Speicher). Der Clan-Tag ist der LuckPerms-Präfix der Clan-Gruppe, nur Pascal vergibt ihn.
 * Chat und Tab zeigen nur „[Tag] Nick“ (Pascal 28.10.: der echte Name ist nicht sichtbar); Moderatoren sehen ihn per Hover im Chat und mit
 * /nick info. Über dem Kopf bleibt „[Tag] EchterName“ per Scoreboard-Team: den Namen dort ersetzt nur ein Paket-Plugin (eine mitreitende
 * Text-Anzeige ginge per API, sperrt aber in Paper Teleports von Spielern mit Passagier). Xaero, Voice Chat und LSS nehmen weiter den Kontonamen.
 * Nur aktiv, wenn LuckPerms läuft.
 */
final class Namen implements Listener, CommandExecutor {

    private static final String META_NICK = "nick";
    private static final String RECHT_ANDERE = "serverwahl.nick.andere";
    private static final String TEAM_PRAEFIX = "sw_";
    private static final Pattern ERLAUBT = Pattern.compile("[A-Za-zÄÖÜäöüß0-9_-]+");
    private static final MiniMessage MM = MiniMessage.miniMessage();

    private final Plugin plugin;
    private LuckPerms lp;
    private boolean aktiv;
    private int minLaenge;
    private int maxLaenge;
    private int abklingSekunden;
    private List<String> sperrliste = List.of();

    /** fertige Anzeige „[Tag] Nick“ für den Chat (wird asynchron gelesen) */
    private final Map<UUID, Component> anzeige = new ConcurrentHashMap<>();
    private final Map<UUID, Long> zuletzt = new HashMap<>();

    Namen(Plugin plugin) {
        this.plugin = plugin;
    }

    /** true, wenn LuckPerms da ist und der Teil läuft */
    boolean starten() {
        try {
            lp = LuckPermsProvider.get();
        } catch (IllegalStateException | NoClassDefFoundError e) {
            plugin.getLogger().warning("Namen: LuckPerms nicht geladen, /nick und Clan-Tags aus");
            return false;
        }
        lp.getEventBus().subscribe(plugin, UserDataRecalculateEvent.class, e -> Bukkit.getScheduler().runTask(plugin, () -> {
            Player p = Bukkit.getPlayer(e.getUser().getUniqueId());
            if (p != null) {
                aktualisieren(p);
            }
        }));
        return true;
    }

    void laden(ConfigurationSection c) {
        aktiv = lp != null && c != null && c.getBoolean("aktiv", false);
        minLaenge = c == null ? 3 : c.getInt("nick-min", 3);
        maxLaenge = c == null ? 16 : Math.min(16, c.getInt("nick-max", 16));
        abklingSekunden = c == null ? 10 : c.getInt("abklingzeit-sekunden", 10);
        sperrliste = new ArrayList<>();
        if (c != null) {
            c.getStringList("sperrliste").forEach(s -> sperrliste.add(grundform(s)));
        }
        if (aktiv) {
            Bukkit.getOnlinePlayers().forEach(this::aktualisieren);
        }
    }

    /**
     * Vergleichsform gegen Nachahmung: klein, Umlaute aufgelöst, übliche Ersatzzeichen zurück auf Buchstaben (0→o, 1/l→i, 3→e, 4→a, 5→s, 7→t),
     * alles außer Buchstaben und Ziffern weg. „Pa5ca1_“ und „pascal“ ergeben dasselbe
     */
    static String grundform(String s) {
        String t = s.toLowerCase(Locale.ROOT).replace("ä", "a").replace("ö", "o").replace("ü", "u").replace("ß", "ss");
        t = Normalizer.normalize(t, Normalizer.Form.NFD).replaceAll("\\p{M}", "");
        StringBuilder b = new StringBuilder();
        for (char ch : t.toCharArray()) {
            switch (ch) {
                case '0' -> b.append('o');
                case '1', 'l', '!', '|' -> b.append('i');
                case '3' -> b.append('e');
                case '4', '@' -> b.append('a');
                case '5', '$' -> b.append('s');
                case '7' -> b.append('t');
                default -> {
                    if (Character.isLetterOrDigit(ch)) {
                        b.append(ch);
                    }
                }
            }
        }
        return b.toString();
    }

    private static Component tagAus(String praefix) {
        if (praefix == null || praefix.isBlank()) {
            return Component.empty();
        }
        Component tag = praefix.indexOf('&') >= 0 || praefix.indexOf('§') >= 0
                ? LegacyComponentSerializer.legacy(praefix.indexOf('§') >= 0 ? '§' : '&').deserialize(praefix)
                : MM.deserialize(praefix);
        return tag.append(Component.text(" "));
    }

    void aktualisieren(Player p) {
        if (!aktiv) {
            return;
        }
        CachedMetaData meta = lp.getPlayerAdapter(Player.class).getMetaData(p);
        String praefix = meta.getPrefix();
        String nick = meta.getMetaValue(META_NICK);
        Component tag = tagAus(praefix);
        Component name = Component.text(nick == null ? p.getName() : nick);
        Component voll = tag.append(name);
        anzeige.put(p.getUniqueId(), voll);
        p.displayName(voll);
        p.playerListName(voll);
        teamSetzen(p, praefix, tag);
    }

    /** Namensschild über dem Kopf: Team je Präfix, Präfix = Clan-Tag, Name bleibt der echte (Vanilla zeigt den Kontonamen) */
    private void teamSetzen(Player p, String praefix, Component tag) {
        Scoreboard sb = Bukkit.getScoreboardManager().getMainScoreboard();
        String ziel = praefix == null || praefix.isBlank() ? null : TEAM_PRAEFIX + Integer.toHexString(praefix.hashCode());
        Team jetzt = sb.getEntryTeam(p.getName());
        if (jetzt != null && jetzt.getName().startsWith(TEAM_PRAEFIX) && !jetzt.getName().equals(ziel)) {
            jetzt.removeEntry(p.getName());
            if (jetzt.getEntries().isEmpty()) {
                jetzt.unregister();
            }
        } else if (jetzt != null && !jetzt.getName().startsWith(TEAM_PRAEFIX)) {
            return; // fremdes Team (Datapack o. ä.) nicht anfassen
        }
        if (ziel == null) {
            return;
        }
        Team t = sb.getTeam(ziel);
        if (t == null) {
            t = sb.registerNewTeam(ziel);
        }
        t.prefix(tag);
        t.addEntry(p.getName());
    }

    /** Nick, sonst Kontoname (für Anzeigen wie die Spender-Tafel) */
    String nickOderName(Player p) {
        if (!aktiv) {
            return p.getName();
        }
        String nick = lp.getPlayerAdapter(Player.class).getMetaData(p).getMetaValue(META_NICK);
        return nick == null ? p.getName() : nick;
    }

    @EventHandler
    public void beimBeitritt(PlayerJoinEvent e) {
        aktualisieren(e.getPlayer());
    }

    @EventHandler
    public void beimVerlassen(PlayerQuitEvent e) {
        Player p = e.getPlayer();
        anzeige.remove(p.getUniqueId());
        zuletzt.remove(p.getUniqueId());
        Team t = Bukkit.getScoreboardManager().getMainScoreboard().getEntryTeam(p.getName());
        if (aktiv && t != null && t.getName().startsWith(TEAM_PRAEFIX)) {
            t.removeEntry(p.getName());
            if (t.getEntries().isEmpty()) {
                t.unregister();
            }
        }
    }

    @EventHandler
    public void beimChat(AsyncChatEvent e) {
        if (!aktiv) {
            return;
        }
        Component name = anzeige.get(e.getPlayer().getUniqueId());
        if (name == null) {
            return;
        }
        String echt = e.getPlayer().getName();
        Component mitHover = name.hoverEvent(net.kyori.adventure.text.event.HoverEvent.showText(Component.text("Echter Name: " + echt, NamedTextColor.GRAY)));
        // echter Name nur für Moderatoren (und Konsole) per Hover
        e.renderer((quelle, anzeigeName, nachricht, empfaenger) -> Component.text()
                .append(empfaenger instanceof Player v && !v.hasPermission(RECHT_ANDERE) ? name : mitHover)
                .append(Component.text(": ", NamedTextColor.GRAY)).append(nachricht).build());
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (!aktiv) {
            sender.sendMessage(Component.text("Nicknames sind gerade aus.", NamedTextColor.RED));
            return true;
        }
        // /nick info <nick oder name> (Moderation): echter Name ↔ Nick
        if (args.length == 2 && args[0].equalsIgnoreCase("info")) {
            if (!sender.hasPermission(RECHT_ANDERE)) {
                sender.sendMessage(Component.text("Dazu fehlt dir die Berechtigung.", NamedTextColor.RED));
                return true;
            }
            info(sender, args[1]);
            return true;
        }
        // /nick reset <spieler> (Moderation)
        if (args.length == 2 && args[0].equalsIgnoreCase("reset")) {
            if (!sender.hasPermission(RECHT_ANDERE)) {
                sender.sendMessage(Component.text("Dazu fehlt dir die Berechtigung.", NamedTextColor.RED));
                return true;
            }
            OfflinePlayer ziel = Bukkit.getOfflinePlayerIfCached(args[1]);
            if (ziel == null) {
                sender.sendMessage(Component.text("Spieler " + args[1] + " kenne ich nicht.", NamedTextColor.RED));
                return true;
            }
            nickSpeichern(ziel.getUniqueId(), null, sender, "Nick von " + args[1] + " zurückgesetzt.");
            return true;
        }
        if (!(sender instanceof Player p)) {
            sender.sendMessage("Nur im Spiel. Für andere: /nick reset <spieler>");
            return true;
        }
        if (args.length == 0) {
            String nick = lp.getPlayerAdapter(Player.class).getMetaData(p).getMetaValue(META_NICK);
            p.sendMessage(Component.text(nick == null ? "Du hast keinen Nick. /nick <name> setzt einen." : "Dein Nick: " + nick + " (/nick reset entfernt ihn)",
                    NamedTextColor.GRAY));
            p.sendMessage(Component.text("Das [Tag] davor ist dein Clan-Tag, den vergibt das Server-Team.", NamedTextColor.DARK_GRAY));
            return true;
        }
        if (args.length != 1) {
            p.sendMessage(Component.text("/nick <name> oder /nick reset", NamedTextColor.RED));
            return true;
        }
        long jetzt = System.currentTimeMillis();
        Long vorher = zuletzt.get(p.getUniqueId());
        if (vorher != null && jetzt - vorher < abklingSekunden * 1000L) {
            p.sendMessage(Component.text("Bitte kurz warten, bevor du den Nick wieder änderst.", NamedTextColor.RED));
            return true;
        }
        if (args[0].equalsIgnoreCase("reset")) {
            zuletzt.put(p.getUniqueId(), jetzt);
            nickSpeichern(p.getUniqueId(), null, p, "Nick entfernt.");
            return true;
        }
        String wunsch = args[0];
        String fehler = pruefen(p, wunsch);
        if (fehler != null) {
            p.sendMessage(Component.text(fehler, NamedTextColor.RED));
            return true;
        }
        zuletzt.put(p.getUniqueId(), jetzt);
        String form = grundform(wunsch);
        // vergebene Nicks der anderen stehen in LuckPerms (auch Spieler, die gerade nicht online oder auf dem anderen Server sind)
        lp.getUserManager().searchAll(NodeMatcher.metaKey(META_NICK)).thenAccept(alle -> Bukkit.getScheduler().runTask(plugin, () -> {
            for (Map.Entry<UUID, ? extends Collection<MetaNode>> e : alle.entrySet()) {
                if (e.getKey().equals(p.getUniqueId())) {
                    continue;
                }
                for (MetaNode n : e.getValue()) {
                    if (grundform(n.getMetaValue()).equals(form)) {
                        p.sendMessage(Component.text("Den Nick (oder einen sehr ähnlichen) hat schon jemand.", NamedTextColor.RED));
                        return;
                    }
                }
            }
            nickSpeichern(p.getUniqueId(), wunsch, p, "Dein Nick ist jetzt " + wunsch + ".");
        }));
        return true;
    }

    /** Regeln: Länge, nur Buchstaben/Ziffern/_/-, keine Formatcodes, nicht auf der Sperrliste, kein Name eines anderen bekannten Spielers */
    private String pruefen(Player p, String wunsch) {
        if (wunsch.indexOf('&') >= 0 || wunsch.indexOf('§') >= 0 || wunsch.indexOf('<') >= 0) {
            return "Farb- und Formatcodes sind im Nick nicht erlaubt.";
        }
        if (wunsch.length() < minLaenge || wunsch.length() > maxLaenge) {
            return "Der Nick muss " + minLaenge + " bis " + maxLaenge + " Zeichen lang sein.";
        }
        if (!ERLAUBT.matcher(wunsch).matches()) {
            return "Erlaubt sind nur Buchstaben, Ziffern, _ und -.";
        }
        String form = grundform(wunsch);
        if (form.length() < 2) {
            return "Der Nick braucht mindestens zwei Buchstaben oder Ziffern.";
        }
        for (String s : sperrliste) {
            // kurze Wörter (mod, team …) nur genau, längere auch als Teil (z. B. „xAdminx“)
            if (!s.isEmpty() && (s.length() >= 5 ? form.contains(s) : form.equals(s))) {
                return "Dieser Nick ist nicht erlaubt.";
            }
        }
        String eigen = grundform(p.getName());
        for (OfflinePlayer o : Bukkit.getOfflinePlayers()) {
            if (o.getName() == null || o.getUniqueId().equals(p.getUniqueId())) {
                continue;
            }
            String fremd = grundform(o.getName());
            // gleich oder (bei Namen ab 4 Zeichen) darin enthalten, z. B. „xPascalx“; der eigene Name bleibt erlaubt
            if (!fremd.equals(eigen) && (fremd.equals(form) || (fremd.length() >= 4 && form.contains(fremd)))) {
                return "Der Nick ähnelt dem Namen eines anderen Spielers.";
            }
        }
        return null;
    }

    /** sucht nach Nick (Grundform) oder echtem Namen, auch Spieler, die nicht online sind */
    private void info(CommandSender an, String suche) {
        String form = grundform(suche);
        lp.getUserManager().searchAll(NodeMatcher.metaKey(META_NICK)).thenAccept(alle -> Bukkit.getScheduler().runTask(plugin, () -> {
            List<String> treffer = new ArrayList<>();
            for (Map.Entry<UUID, ? extends Collection<MetaNode>> e : alle.entrySet()) {
                OfflinePlayer o = Bukkit.getOfflinePlayer(e.getKey());
                for (MetaNode n : e.getValue()) {
                    if (grundform(n.getMetaValue()).equals(form) || (o.getName() != null && o.getName().equalsIgnoreCase(suche))) {
                        treffer.add("Nick " + n.getMetaValue() + " = " + (o.getName() == null ? e.getKey() : o.getName()));
                    }
                }
            }
            if (treffer.isEmpty()) {
                OfflinePlayer o = Bukkit.getOfflinePlayerIfCached(suche);
                treffer.add(o == null ? "Keinen Spieler oder Nick „" + suche + "“ gefunden." : o.getName() + " hat keinen Nick.");
            }
            treffer.forEach(t -> an.sendMessage(Component.text(t, NamedTextColor.GRAY)));
        }));
    }

    private void nickSpeichern(UUID id, String nick, CommandSender an, String meldung) {
        java.util.function.Consumer<net.luckperms.api.model.user.User> aendern = u -> {
            u.data().clear(NodeType.META.predicate(n -> n.getMetaKey().equals(META_NICK)));
            if (nick != null) {
                u.data().add(MetaNode.builder(META_NICK, nick).build());
            }
        };
        // Online: das geladene Objekt direkt ändern und speichern (modifyUser lädt neu, die Anzeige las danach noch den alten Stand, Test 28.10.)
        net.luckperms.api.model.user.User geladen = lp.getUserManager().getUser(id);
        java.util.concurrent.CompletableFuture<Void> fertig;
        if (geladen != null) {
            aendern.accept(geladen);
            fertig = lp.getUserManager().saveUser(geladen);
        } else {
            fertig = lp.getUserManager().modifyUser(id, aendern);
        }
        fertig.whenComplete((ok, ex) -> Bukkit.getScheduler().runTask(plugin, () -> {
            if (ex != null) {
                plugin.getLogger().warning("Nick speichern: " + ex);
                an.sendMessage(Component.text("Speichern ging schief, bitte später nochmal.", NamedTextColor.RED));
                return;
            }
            plugin.getLogger().info("Nick " + id + " = " + (nick == null ? "(keiner)" : nick) + " (von " + an.getName() + ")");
            an.sendMessage(Component.text(meldung, NamedTextColor.GREEN));
            Player p = Bukkit.getPlayer(id);
            net.luckperms.api.model.user.User u = lp.getUserManager().getUser(id);
            if (u != null) {
                u.getCachedData().invalidate();
            }
            if (p != null) {
                aktualisieren(p);
            }
        }));
    }
}
