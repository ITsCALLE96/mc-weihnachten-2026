package de.grahl.serverwahl;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.format.TextDecoration;
import net.kyori.adventure.text.serializer.plain.PlainTextComponentSerializer;
import org.prism_mc.prism.api.activities.Activity;
import org.prism_mc.prism.api.activities.ActivityQuery;
import org.prism_mc.prism.api.containers.Container;
import org.prism_mc.prism.api.containers.IdentityContainer;
import org.prism_mc.prism.paper.api.PrismPaperApi;
import org.prism_mc.prism.paper.api.activities.PaperActivityQuery;

import org.bukkit.Bukkit;
import org.bukkit.Location;
import org.bukkit.Material;
import org.bukkit.block.Block;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.block.Action;
import org.bukkit.event.block.BlockBreakEvent;
import org.bukkit.event.player.PlayerInteractEvent;
import org.bukkit.event.player.PlayerItemHeldEvent;
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.plugin.Plugin;

/**
 * Prüfwerkzeug (Pascal 28.10., Grief-Tool Prism 4.5): Wer prism.lookup hat und eine Holzspitzhacke in der Haupthand hält, sieht per Klick,
 * was an einer Stelle passiert ist – ohne /pr wand, ohne Umschalten, ohne Chatmeldung beim Wechseln.
 * Linksklick auf einen Block = was an dieser Stelle passiert ist; Rechtsklick auf eine Kiste/einen Container = was hinein- und herausgenommen
 * wurde; Rechtsklick an eine Blockseite = was an der leeren Stelle davor passiert ist (abgebaute Blöcke). Der Klick wird abgebrochen,
 * nichts geht kaputt. Schleichen = normale Spitzhacke. Abfrage über die öffentliche Prism-API (PrismPaperApi.lookup), Ausgabe von uns.
 * Nur geladen, wenn Prism läuft (Klassen der Prism-API sonst nicht vorhanden).
 */
final class Pruefwerkzeug implements Listener {

    private static final Map<String, String> TATEN = Map.ofEntries(
            Map.entry("block-break", "abgebaut"), Map.entry("block-place", "gesetzt"), Map.entry("block-use", "benutzt"),
            Map.entry("item-insert", "hineingelegt"), Map.entry("item-remove", "herausgenommen"), Map.entry("sign-edit", "beschriftet"),
            Map.entry("bucket-empty", "ausgegossen"), Map.entry("bucket-fill", "aufgefüllt"), Map.entry("block-ignite", "angezündet"),
            Map.entry("block-burn", "verbrannt"), Map.entry("block-explode", "gesprengt"), Map.entry("entity-explode", "gesprengt"),
            Map.entry("hanging-break", "abgenommen"), Map.entry("hanging-place", "aufgehängt"), Map.entry("block-harvest", "geerntet"),
            Map.entry("block-form", "entstanden"), Map.entry("block-fade", "geschmolzen"), Map.entry("block-spread", "ausgebreitet"),
            Map.entry("entity-death", "getötet"), Map.entry("item-drop", "fallen gelassen"), Map.entry("item-pickup", "aufgehoben"),
            Map.entry("worldedit-break", "per WorldEdit entfernt"), Map.entry("worldedit-place", "per WorldEdit gesetzt"));

    private final Plugin plugin;
    private final PrismPaperApi prism;
    private boolean aktiv;
    private Material werkzeug = Material.WOODEN_PICKAXE;
    private int zeilen = 8;
    private final Map<UUID, Long> zuletzt = new HashMap<>();

    private Pruefwerkzeug(Plugin plugin, PrismPaperApi prism) {
        this.plugin = plugin;
        this.prism = prism;
    }

    /** null, wenn Prism fehlt oder seine API nicht angemeldet ist */
    static Pruefwerkzeug starten(Plugin plugin) {
        var reg = Bukkit.getServicesManager().getRegistration(PrismPaperApi.class);
        if (reg == null) {
            plugin.getLogger().warning("Prüfwerkzeug: Prism-API nicht gefunden, Holzspitzhacke bleibt normal");
            return null;
        }
        return new Pruefwerkzeug(plugin, reg.getProvider());
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        Material m = c == null ? null : Material.matchMaterial(c.getString("werkzeug", "WOODEN_PICKAXE"));
        werkzeug = m == null ? Material.WOODEN_PICKAXE : m;
        zeilen = c == null ? 8 : Math.max(1, c.getInt("zeilen", 8));
    }

    private boolean pruefer(Player p) {
        return aktiv && p.getInventory().getItemInMainHand().getType() == werkzeug && !p.isSneaking() && p.hasPermission("prism.lookup");
    }

    /** vor WorldGuard und Prisms eigenem Listener: Klick abbrechen und abfragen */
    @EventHandler(priority = EventPriority.LOWEST)
    public void beimKlick(PlayerInteractEvent e) {
        Block b = e.getClickedBlock();
        if (b == null || e.getHand() != EquipmentSlot.HAND || !pruefer(e.getPlayer())) {
            return;
        }
        e.setCancelled(true);
        long jetzt = System.currentTimeMillis();
        Long vorher = zuletzt.put(e.getPlayer().getUniqueId(), jetzt);
        if (vorher != null && jetzt - vorher < 300) {
            return;
        }
        Block ziel = e.getAction() == Action.RIGHT_CLICK_BLOCK && !(b.getState() instanceof org.bukkit.block.Container) ? b.getRelative(e.getBlockFace()) : b;
        abfragen(e.getPlayer(), ziel.getLocation());
    }

    /** Kreativ: Linksklick baut sofort ab, dann kommt BlockBreakEvent – auch abbrechen */
    @EventHandler(priority = EventPriority.LOWEST)
    public void beimAbbauen(BlockBreakEvent e) {
        if (pruefer(e.getPlayer())) {
            e.setCancelled(true);
        }
    }

    @EventHandler
    public void beimWechsel(PlayerItemHeldEvent e) {
        Player p = e.getPlayer();
        var neu = p.getInventory().getItem(e.getNewSlot());
        if (aktiv && neu != null && neu.getType() == werkzeug && p.hasPermission("prism.lookup")) {
            p.sendActionBar(Component.text("Prüfwerkzeug: Links = Block, Rechts = Kiste/Stelle davor, Schleichen = normal abbauen", NamedTextColor.AQUA));
        }
    }

    private void abfragen(Player p, Location l) {
        ActivityQuery q = PaperActivityQuery.builder().worldUuid(l.getWorld().getUID()).coordinate(l.getBlockX(), l.getBlockY(), l.getBlockZ())
                .lookup(true).limit(zeilen).sort(ActivityQuery.Sort.DESCENDING).build();
        prism.lookup(q).whenComplete((liste, ex) -> Bukkit.getScheduler().runTask(plugin, () -> {
            if (!p.isOnline()) {
                return;
            }
            if (ex != null) {
                plugin.getLogger().warning("Prüfwerkzeug: " + ex);
                p.sendMessage(Component.text("Abfrage ging schief, siehe Server-Log.", NamedTextColor.RED));
                return;
            }
            ausgeben(p, l, liste);
        }));
    }

    private void ausgeben(Player p, Location l, List<Activity> liste) {
        p.sendMessage(Component.text("— " + l.getBlockX() + " " + l.getBlockY() + " " + l.getBlockZ() + " —", NamedTextColor.DARK_AQUA));
        if (liste.isEmpty()) {
            p.sendMessage(Component.text("Hier ist nichts verzeichnet.", NamedTextColor.GRAY));
            return;
        }
        for (Activity a : liste) {
            String key = a.action().type().key();
            String tat = TATEN.getOrDefault(key, a.action().type().defaultPastTense() == null ? key : a.action().type().defaultPastTense());
            Component was = a.action().descriptorComponent() != null ? a.action().descriptorComponent()
                    : Component.text(a.action().descriptor() == null ? "" : a.action().descriptor());
            p.sendMessage(Component.text().append(Component.text(wann(a.timestamp()) + " ", NamedTextColor.GRAY))
                    .append(Component.text(wer(a.cause() == null ? null : a.cause().container()) + " ", NamedTextColor.GOLD))
                    .append(Component.text(tat + " ", a.reversed() ? NamedTextColor.DARK_GRAY : NamedTextColor.WHITE))
                    .append(was.colorIfAbsent(NamedTextColor.AQUA))
                    .append(a.reversed() ? Component.text(" (zurückgesetzt)", NamedTextColor.DARK_GRAY, TextDecoration.ITALIC) : Component.empty())
                    .hoverEvent(Component.text(key + " · " + PlainTextComponentSerializer.plainText().serialize(was), NamedTextColor.GRAY))
                    .build());
        }
    }

    private static String wer(Container c) {
        if (c == null) {
            return "?";
        }
        return c instanceof IdentityContainer i ? i.name() : c.toString();
    }

    /** Zeitstempel (Sekunden oder Millisekunden) als „vor 5 min“ */
    private static String wann(long t) {
        long ms = t < 100_000_000_000L ? t * 1000 : t;
        long s = Math.max(0, (System.currentTimeMillis() - ms) / 1000);
        if (s < 60) {
            return "vor " + s + " s";
        }
        if (s < 3600) {
            return "vor " + s / 60 + " min";
        }
        if (s < 86400) {
            return "vor " + s / 3600 + " h";
        }
        return "vor " + s / 86400 + " d";
    }
}
