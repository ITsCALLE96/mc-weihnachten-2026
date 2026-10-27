package de.grahl.serverwahl;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.text.minimessage.MiniMessage;

import org.bukkit.Bukkit;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.command.Command;
import org.bukkit.command.CommandSender;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.inventory.InventoryClickEvent;
import org.bukkit.event.inventory.InventoryDragEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerLoginEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scoreboard.Objective;

/**
 * Server-Wahl für Hub und SMP hinter Velocity.
 * Hub und SMP: Rechtsklick auf eine eingetragene Kiste öffnet das Menü ihrer Kategorie, ein Klick auf einen Server schickt
 * den Spieler über den BungeeCord-Kanal „Connect“ dorthin (Velocity versteht den Kanal).
 * Überall: /hub bringt zum Hub zurück (auf dem Hub selbst: zum Spawn). Portale: begehbare Quader aus der Config schicken auf einen Server.
 * Eröffnung: ein gemeinsamer Merker als Datei (beide Server laufen auf derselben VM). Der Hub legt sie an, sobald das
 * Hub-Datapack das Scoreboard umstellt; das SMP lehnt jeden Beitritt ab, solange sie fehlt (außer serverwahl.vorab).
 */
public final class Serverwahl extends JavaPlugin implements Listener {

    private static final String KANAL = "BungeeCord";
    private static final MiniMessage MM = MiniMessage.miniMessage();

    /** Blockposition „welt:x:y:z“ → Kategorie-Schlüssel */
    private final Map<String, String> kisten = new HashMap<>();
    private String hubServer;
    private boolean istHub;
    /** Merker „SMP ist eröffnet“, null = keine Eröffnungssperre */
    private Path offenDatei;
    private boolean beitrittSperren;
    private String sperrText;
    private String ausloeserObjective;
    private String ausloeserEintrag;
    private int ausloeserAb;
    private List<String> eroeffnungsBefehle = List.of();
    private boolean portaleSperren;
    /** Begehbare Portale (Quader), die per Velocity auf einen anderen Server schicken */
    private final List<Portal> portale = new ArrayList<>();
    private final Map<java.util.UUID, Long> portalZuletzt = new HashMap<>();
    private final SpawnElytra spawnElytra = new SpawnElytra(this);
    private final WetterRhythmus wetter = new WetterRhythmus(this);
    /** Xaero-Kanäle für die Welt-ID (Paket 0 = LevelMapProperties: ein int) */
    private static final List<String> XAERO_KANAELE = List.of("xaeroworldmap:main", "xaerominimap:main");
    /** eigene Welt-ID für Xaero, 0 = aus. Hinter Velocity sehen Hub und SMP sonst für Xaero gleich aus (gleiche Adresse, Dimension) */
    private int xaeroWeltId;
    /** Winterkalender: Scoreboard-Ziel/Eintrag, das täglich auf den Dezembertag (1–24) gesetzt wird, null = aus */
    private String kalenderObjective;
    private String kalenderEintrag;
    private java.time.ZoneId kalenderZone;
    /** > 0: fester Tag statt Datum (Testnetz) */
    private int kalenderFest;

    private record Portal(String welt, int x1, int y1, int z1, int x2, int y2, int z2, String ziel, boolean sperre) {
        boolean enthaelt(org.bukkit.Location l, int rand) {
            return l.getWorld() != null && l.getWorld().getName().equals(welt)
                    && l.getBlockX() >= x1 - rand && l.getBlockX() <= x2 + rand
                    && l.getBlockY() >= y1 - rand && l.getBlockY() <= y2 + rand
                    && l.getBlockZ() >= z1 - rand && l.getBlockZ() <= z2 + rand;
        }
    }

    @Override
    public void onEnable() {
        saveDefaultConfig();
        laden();
        getServer().getMessenger().registerOutgoingPluginChannel(this, KANAL);
        XAERO_KANAELE.forEach(k -> getServer().getMessenger().registerOutgoingPluginChannel(this, k));
        getServer().getPluginManager().registerEvents(this, this);
        getServer().getPluginManager().registerEvents(spawnElytra, this);
        getServer().getPluginManager().registerEvents(wetter, this);
        // Hub: einmal pro Sekunde schauen, ob das Datapack die Eröffnung ausgelöst hat. Legt die Datei nur an, löscht sie nie
        // (eine zurückgesetzte Hub-Welt soll das SMP nicht wieder schließen; schließen nur per /serverwahl schliessen)
        getServer().getScheduler().runTaskTimer(this, () -> {
            if (!istHub || offenDatei == null || ausloeserObjective == null || istOffen()) {
                return;
            }
            Objective obj = Bukkit.getScoreboardManager().getMainScoreboard().getObjective(ausloeserObjective);
            if (obj != null && obj.getScore(ausloeserEintrag).getScore() >= ausloeserAb) {
                oeffnen("Scoreboard " + ausloeserObjective + "/" + ausloeserEintrag);
            }
        }, 40L, 20L);
        // SMP: beim Wechsel geschlossen → offen einmalig die Eröffnungsbefehle (Phase 1, Tag, klares Wetter).
        // Erledigt-Merker im Plugin-Ordner, damit ein Neustart sie nicht wiederholt; schließt der Merker wieder (Probe), wird er zurückgesetzt
        getServer().getScheduler().runTaskTimer(this, () -> {
            if (istHub || offenDatei == null || eroeffnungsBefehle.isEmpty()) {
                return;
            }
            Path erledigt = getDataFolder().toPath().resolve("eroeffnet.txt");
            try {
                if (!istOffen()) {
                    Files.deleteIfExists(erledigt);
                } else if (!Files.exists(erledigt)) {
                    for (String befehl : eroeffnungsBefehle) {
                        getLogger().info("Eröffnung: " + befehl);
                        Bukkit.dispatchCommand(Bukkit.getConsoleSender(), befehl);
                    }
                    Files.writeString(erledigt, "Eröffnungsbefehle ausgeführt " + LocalDateTime.now() + System.lineSeparator());
                }
            } catch (IOException ex) {
                getLogger().warning("Eröffnungs-Merker im Plugin-Ordner: " + ex.getMessage());
            }
        }, 60L, 20L);
        // Winterkalender: jede Minute Dezembertag ins Scoreboard (vor Dezember 0, ab 24.12. bis Jahresende 24, danach 0).
        // Aus dem Datum statt Zähler: übersteht Neustarts und verpasste Läufe
        getServer().getScheduler().runTaskTimer(this, () -> {
            if (kalenderObjective == null) {
                return;
            }
            Objective obj = Bukkit.getScoreboardManager().getMainScoreboard().getObjective(kalenderObjective);
            if (obj == null) {
                return;
            }
            java.time.LocalDate heute = java.time.LocalDate.now(kalenderZone);
            int tag = kalenderFest > 0 ? Math.min(kalenderFest, 24) : heute.getMonthValue() == 12 ? Math.min(heute.getDayOfMonth(), 24) : 0;
            if (obj.getScore(kalenderEintrag).getScore() != tag) {
                obj.getScore(kalenderEintrag).setScore(tag);
                getLogger().info("Winterkalender: " + kalenderEintrag + " " + kalenderObjective + " = " + tag);
            }
        }, 100L, 1200L);
    }

    private void laden() {
        reloadConfig();
        hubServer = getConfig().getString("hub-server", "hub");
        istHub = getConfig().getBoolean("ist-hub", false);
        kisten.clear();
        for (Map<?, ?> k : getConfig().getMapList("kisten")) {
            String schluessel = k.get("welt") + ":" + k.get("x") + ":" + k.get("y") + ":" + k.get("z");
            kisten.put(schluessel, String.valueOf(k.get("kategorie")));
        }
        ConfigurationSection er = getConfig().getConfigurationSection("eroeffnung");
        String datei = er == null ? "" : er.getString("datei", "");
        offenDatei = datei.isBlank() ? null : Path.of(datei);
        beitrittSperren = er != null && er.getBoolean("beitritt-sperren", false);
        sperrText = er == null ? "" : er.getString("text", "<red>Der Weihnachtsserver öffnet am <white>05.12.</white>");
        ConfigurationSection al = er == null ? null : er.getConfigurationSection("ausloeser");
        ausloeserObjective = al == null ? null : al.getString("objective");
        ausloeserEintrag = al == null ? null : al.getString("eintrag");
        ausloeserAb = al == null ? 1 : al.getInt("ab", 1);
        eroeffnungsBefehle = er == null ? List.of() : er.getStringList("befehle");
        portaleSperren = getConfig().getBoolean("portale-sperren", false);
        spawnElytra.laden(getConfig().getConfigurationSection("spawn-elytra"));
        wetter.laden(getConfig().getConfigurationSection("wetter-rhythmus"));
        xaeroWeltId = getConfig().getInt("xaero-welt-id", 0);
        ConfigurationSection ka = getConfig().getConfigurationSection("kalender");
        kalenderObjective = ka == null || !ka.getBoolean("aktiv", false) ? null : ka.getString("objective", "insel_kalender");
        kalenderEintrag = ka == null ? "#tag" : ka.getString("eintrag", "#tag");
        kalenderZone = java.time.ZoneId.of(ka == null ? "Europe/Berlin" : ka.getString("zeitzone", "Europe/Berlin"));
        kalenderFest = ka == null ? 0 : ka.getInt("fester-tag", 0);
        portale.clear();
        for (Map<?, ?> m : getConfig().getMapList("portale")) {
            int[] a = koordinaten(m.get("von"));
            int[] b = koordinaten(m.get("bis"));
            if (a == null || b == null || m.get("welt") == null) {
                getLogger().warning("Portal ohne welt/von/bis übersprungen: " + m);
                continue;
            }
            Object ziel = m.get("ziel");
            portale.add(new Portal(String.valueOf(m.get("welt")), Math.min(a[0], b[0]), Math.min(a[1], b[1]), Math.min(a[2], b[2]),
                    Math.max(a[0], b[0]), Math.max(a[1], b[1]), Math.max(a[2], b[2]),
                    ziel == null ? hubServer : String.valueOf(ziel), "eroeffnung".equals(m.get("sperre"))));
        }
        getLogger().info((istHub ? "Hub" : "Backend") + ", " + kisten.size() + " Kisten, " + portale.size() + " Portale, Hub-Server " + hubServer
                + (offenDatei == null ? "" : ", Eröffnung " + (istOffen() ? "offen" : "geschlossen") + " (" + offenDatei + ")"));
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equals("serverwahl")) {
            if (args.length == 1 && args[0].equals("reload")) {
                laden();
                sender.sendMessage(Component.text("serverwahl neu geladen (" + kisten.size() + " Kisten, " + portale.size() + " Portale)", NamedTextColor.GREEN));
                return true;
            }
            if (args.length == 1 && (args[0].equals("oeffnen") || args[0].equals("schliessen") || args[0].equals("status"))) {
                if (offenDatei == null) {
                    sender.sendMessage(Component.text("Keine Eröffnungssperre eingestellt (eroeffnung.datei)", NamedTextColor.YELLOW));
                    return true;
                }
                if (args[0].equals("oeffnen")) {
                    oeffnen("Befehl von " + sender.getName());
                } else if (args[0].equals("schliessen")) {
                    try {
                        Files.deleteIfExists(offenDatei);
                        getLogger().info("Eröffnung zurückgenommen (" + sender.getName() + ")");
                    } catch (IOException ex) {
                        sender.sendMessage(Component.text("Löschen fehlgeschlagen: " + ex.getMessage(), NamedTextColor.RED));
                    }
                }
                sender.sendMessage(Component.text("SMP " + (istOffen() ? "offen" : "geschlossen") + " (" + offenDatei + ")", NamedTextColor.GREEN));
                return true;
            }
            if (args.length == 2 && args[0].equals("menue") && sender instanceof Player p) {
                menueOeffnen(p, args[1]);
                return true;
            }
            return false;
        }
        // /hub
        if (!(sender instanceof Player p)) {
            sender.sendMessage("Nur für Spieler");
            return true;
        }
        if (istHub) {
            p.teleport(p.getWorld().getSpawnLocation());
        } else {
            verbinden(p, hubServer);
        }
        return true;
    }

    /** Liest den Zustand von DimensionControl (plugins/DimensionControl/data.yml, closed-dimensions), damit nether/end open dort die einzige Stellschraube bleibt */
    private boolean dimensionZu(String name) {
        java.io.File daten = new java.io.File(getDataFolder().getParentFile(), "DimensionControl/data.yml");
        return daten.exists() && org.bukkit.configuration.file.YamlConfiguration.loadConfiguration(daten)
                .getStringList("closed-dimensions").contains(name);
    }

    /** SMP: Netherportal lässt sich nicht anzünden, solange der Nether zu ist (Pascal, 26.10.) */
    @EventHandler(ignoreCancelled = true)
    public void beimPortalBau(org.bukkit.event.world.PortalCreateEvent e) {
        if (!portaleSperren || e.getReason() != org.bukkit.event.world.PortalCreateEvent.CreateReason.FIRE || !dimensionZu("nether")) {
            return;
        }
        if (e.getEntity() instanceof Player p) {
            if (p.hasPermission("dimensioncontrol.bypass.nether")) {
                return;
            }
            p.sendActionBar(MM.deserialize(getConfig().getString("text-nether-zu", "<red>Der Nether ist noch geschlossen!")));
        }
        e.setCancelled(true);
    }

    /** SMP: keine Enderaugen in Endportalrahmen, solange das End zu ist – so bleibt kein halber Rahmen und kein Auge geht verloren */
    @EventHandler(ignoreCancelled = true)
    public void beimEnderauge(PlayerInteractEvent e) {
        if (!portaleSperren || e.getAction() != Action.RIGHT_CLICK_BLOCK || e.getClickedBlock() == null
                || e.getClickedBlock().getType() != Material.END_PORTAL_FRAME || e.getItem() == null
                || e.getItem().getType() != Material.ENDER_EYE || e.getPlayer().hasPermission("dimensioncontrol.bypass.end")
                || !dimensionZu("end")) {
            return;
        }
        e.setCancelled(true);
        e.getPlayer().sendActionBar(MM.deserialize(getConfig().getString("text-end-zu", "<red>Das End ist noch geschlossen!")));
    }

    /** „x y z“ (Leerzeichen oder Komma) → int[3], sonst null */
    private static int[] koordinaten(Object o) {
        if (o == null) {
            return null;
        }
        String[] t = String.valueOf(o).trim().split("[\\s,]+");
        if (t.length != 3) {
            return null;
        }
        try {
            return new int[] {Integer.parseInt(t[0]), Integer.parseInt(t[1]), Integer.parseInt(t[2])};
        } catch (NumberFormatException ex) {
            return null;
        }
    }

    /** Betritt ein Spieler einen Block eines Portals: per Velocity auf dessen Ziel (Standard: Hub). 3 s Abklingzeit */
    @EventHandler(ignoreCancelled = true)
    public void imPortal(org.bukkit.event.player.PlayerMoveEvent e) {
        if (portale.isEmpty() || !e.hasChangedBlock()) {
            return;
        }
        for (Portal portal : portale) {
            if (!portal.enthaelt(e.getTo(), 0)) {
                continue;
            }
            Player p = e.getPlayer();
            long jetzt = System.currentTimeMillis();
            Long zuletzt = portalZuletzt.get(p.getUniqueId());
            if (zuletzt != null && jetzt - zuletzt < 3000) {
                return;
            }
            portalZuletzt.put(p.getUniqueId(), jetzt);
            if (portal.sperre() && !istOffen() && !p.hasPermission("serverwahl.vorab")) {
                p.sendActionBar(MM.deserialize(sperrText));
                return;
            }
            p.sendActionBar(MM.deserialize(getConfig().getString("text-portal", "<gold>Ab zum Hub …")));
            verbinden(p, portal.ziel());
            return;
        }
    }

    /** Echte Portalblöcke (Nether, End, Gateway) in einem unserer Portale teleportieren nicht in die Dimension */
    @EventHandler(ignoreCancelled = true)
    public void beimDimensionsPortal(org.bukkit.event.player.PlayerPortalEvent e) {
        portalAbfangen(e);
    }

    @EventHandler(ignoreCancelled = true)
    public void beimGateway(org.bukkit.event.player.PlayerTeleportEvent e) {
        if (e.getCause() == org.bukkit.event.player.PlayerTeleportEvent.TeleportCause.END_GATEWAY) {
            portalAbfangen(e);
        }
    }

    private void portalAbfangen(org.bukkit.event.player.PlayerTeleportEvent e) {
        for (Portal portal : portale) {
            if (portal.enthaelt(e.getFrom(), 1)) {
                e.setCancelled(true);
                return;
            }
        }
    }

    /** Xaero meldet seine Kanäle an (auch nach jedem Velocity-Wechsel neu): dann die Welt-ID dieses Servers schicken */
    @EventHandler
    public void beiKanalAnmeldung(org.bukkit.event.player.PlayerRegisterChannelEvent e) {
        if (xaeroWeltId != 0 && XAERO_KANAELE.contains(e.getChannel())) {
            weltIdSenden(e.getPlayer(), e.getChannel());
        }
    }

    @EventHandler
    public void beimBeitrittXaero(org.bukkit.event.player.PlayerJoinEvent e) {
        if (xaeroWeltId == 0) {
            return;
        }
        Player p = e.getPlayer();
        getServer().getScheduler().runTaskLater(this, () -> XAERO_KANAELE.stream()
                .filter(k -> p.isOnline() && p.getListeningPluginChannels().contains(k))
                .forEach(k -> weltIdSenden(p, k)), 20L);
    }

    private void weltIdSenden(Player p, String kanal) {
        byte[] daten = java.nio.ByteBuffer.allocate(5).put((byte) 0).putInt(xaeroWeltId).array();
        p.sendPluginMessage(this, kanal, daten);
    }

    @EventHandler
    public void beimVerlassen(org.bukkit.event.player.PlayerQuitEvent e) {
        portalZuletzt.remove(e.getPlayer().getUniqueId());
    }

    /** Früh abfangen (LOWEST) und abbrechen: WorldGuard überspringt abgebrochene Klicks, so erscheint keine „you can't open that here“-Meldung */
    @EventHandler(priority = org.bukkit.event.EventPriority.LOWEST)
    public void beiKlick(PlayerInteractEvent e) {
        if (kisten.isEmpty() || e.getAction() != Action.RIGHT_CLICK_BLOCK) {
            return;
        }
        Block b = e.getClickedBlock();
        if (b == null) {
            return;
        }
        String kategorie = kisten.get(b.getWorld().getName() + ":" + b.getX() + ":" + b.getY() + ":" + b.getZ());
        if (kategorie == null) {
            return;
        }
        // beide Hände abbrechen (sonst meldet WorldGuard beim Zweithand-Klick), Menü nur einmal für die Haupthand
        e.setCancelled(true);
        if (e.getHand() == EquipmentSlot.HAND) {
            menueOeffnen(e.getPlayer(), kategorie);
        }
    }

    private boolean istOffen() {
        return offenDatei == null || Files.exists(offenDatei);
    }

    private void oeffnen(String anlass) {
        try {
            if (offenDatei.getParent() != null) {
                Files.createDirectories(offenDatei.getParent());
            }
            Files.writeString(offenDatei, "eröffnet " + LocalDateTime.now() + " durch " + anlass + System.lineSeparator());
            getLogger().info("SMP eröffnet (" + anlass + "), Merker " + offenDatei);
        } catch (IOException ex) {
            getLogger().severe("Eröffnungs-Merker " + offenDatei + " nicht schreibbar: " + ex.getMessage());
        }
    }

    /** SMP: vor der Eröffnung niemanden hereinlassen, auch nicht über /server smp */
    @EventHandler
    @SuppressWarnings("deprecation")
    public void beimBeitritt(PlayerLoginEvent e) {
        if (!beitrittSperren || istOffen() || e.getPlayer().hasPermission("serverwahl.vorab")) {
            return;
        }
        e.disallow(PlayerLoginEvent.Result.KICK_OTHER, MM.deserialize(sperrText));
    }

    private void menueOeffnen(Player p, String kategorie) {
        ConfigurationSection kat = getConfig().getConfigurationSection("kategorien." + kategorie);
        if (kat == null) {
            p.sendMessage(Component.text("Kategorie „" + kategorie + "“ fehlt in der Config", NamedTextColor.RED));
            return;
        }
        Menue menue = new Menue();
        menue.inventar = Bukkit.createInventory(menue, 27, MM.deserialize(kat.getString("titel", kategorie)));
        List<Map<?, ?>> server = kat.getMapList("server");
        if (server.isEmpty()) {
            menue.inventar.setItem(13, gegenstand(Material.BARRIER, "<gray>Bald verfügbar", List.of()));
        }
        // bis zu 7 Server mittig in der zweiten Reihe
        for (int i = 0; i < server.size() && i < 7; i++) {
            Map<?, ?> s = server.get(i);
            Material mat = Material.matchMaterial(String.valueOf(s.get("material")));
            List<String> text = new ArrayList<>();
            if (s.get("beschreibung") instanceof List<?> zeilen) {
                zeilen.forEach(z -> text.add(String.valueOf(z)));
            }
            int slot = 13 - (Math.min(server.size(), 7) - 1) / 2 + i;
            if (Boolean.TRUE.equals(s.get("hier"))) {
                menue.inventar.setItem(slot, gegenstand(mat == null ? Material.GRASS_BLOCK : mat, String.valueOf(s.get("anzeige")), text));
                continue;
            }
            String gesperrt = "eroeffnung".equals(s.get("sperre")) && !istOffen() && !p.hasPermission("serverwahl.vorab") ? sperrText : null;
            if (gesperrt != null) {
                // Text unter „Klicken zum Beitreten“ ersetzen: letzte Zeile raus, Sperrtext rein
                if (!text.isEmpty()) {
                    text.remove(text.size() - 1);
                }
                text.add(gesperrt);
                menue.inventar.setItem(slot, gegenstand(Material.BARRIER, String.valueOf(s.get("anzeige")), text));
                continue;
            }
            menue.inventar.setItem(slot, gegenstand(mat == null ? Material.GRASS_BLOCK : mat, String.valueOf(s.get("anzeige")), text));
            menue.ziele.put(slot, String.valueOf(s.get("name")));
        }
        p.openInventory(menue.inventar);
    }

    private static ItemStack gegenstand(Material mat, String name, List<String> beschreibung) {
        ItemStack item = new ItemStack(mat);
        ItemMeta meta = item.getItemMeta();
        meta.displayName(MM.deserialize(name).decorationIfAbsent(TextDecoration.ITALIC, TextDecoration.State.FALSE));
        meta.lore(beschreibung.stream()
                .map(z -> MM.deserialize(z).decorationIfAbsent(TextDecoration.ITALIC, TextDecoration.State.FALSE))
                .toList());
        item.setItemMeta(meta);
        return item;
    }

    @EventHandler
    public void imMenue(InventoryClickEvent e) {
        if (!(e.getInventory().getHolder() instanceof Menue menue)) {
            return;
        }
        e.setCancelled(true);
        if (e.getClickedInventory() != menue.inventar || !(e.getWhoClicked() instanceof Player p)) {
            return;
        }
        String ziel = menue.ziele.get(e.getSlot());
        if (ziel != null) {
            p.closeInventory();
            verbinden(p, ziel);
        }
    }

    @EventHandler
    public void imMenueZiehen(InventoryDragEvent e) {
        if (e.getInventory().getHolder() instanceof Menue) {
            e.setCancelled(true);
        }
    }

    private void verbinden(Player p, String server) {
        try (ByteArrayOutputStream bytes = new ByteArrayOutputStream(); DataOutputStream out = new DataOutputStream(bytes)) {
            out.writeUTF("Connect");
            out.writeUTF(server);
            p.sendPluginMessage(this, KANAL, bytes.toByteArray());
            p.sendMessage(Component.text("Verbinde mit " + server + " …", NamedTextColor.GRAY));
        } catch (IOException ex) {
            getLogger().warning("Connect zu " + server + " fehlgeschlagen: " + ex.getMessage());
        }
    }

    /** Eigener Halter, damit nur unsere Menüs gesperrt werden */
    private static final class Menue implements InventoryHolder {
        private Inventory inventar;
        private final Map<Integer, String> ziele = new HashMap<>();

        @Override
        public Inventory getInventory() {
            return inventar;
        }
    }
}
