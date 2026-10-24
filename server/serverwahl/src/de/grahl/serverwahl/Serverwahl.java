package de.grahl.serverwahl;

import java.io.ByteArrayOutputStream;
import java.io.DataOutputStream;
import java.io.IOException;
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
import org.bukkit.inventory.EquipmentSlot;
import org.bukkit.inventory.Inventory;
import org.bukkit.inventory.InventoryHolder;
import org.bukkit.inventory.ItemStack;
import org.bukkit.inventory.meta.ItemMeta;
import org.bukkit.plugin.java.JavaPlugin;
import org.bukkit.scoreboard.Objective;

/**
 * Server-Wahl für Hub und SMP hinter Velocity.
 * Hub: Rechtsklick auf eine eingetragene Kiste öffnet das Menü ihrer Kategorie, ein Klick auf einen Server schickt
 * den Spieler über den BungeeCord-Kanal „Connect“ dorthin (Velocity versteht den Kanal).
 * Überall: /hub bringt zum Hub zurück (auf dem Hub selbst: zum Spawn).
 */
public final class Serverwahl extends JavaPlugin implements Listener {

    private static final String KANAL = "BungeeCord";
    private static final MiniMessage MM = MiniMessage.miniMessage();

    /** Blockposition „welt:x:y:z“ → Kategorie-Schlüssel */
    private final Map<String, String> kisten = new HashMap<>();
    private String hubServer;
    private boolean istHub;

    @Override
    public void onEnable() {
        saveDefaultConfig();
        laden();
        getServer().getMessenger().registerOutgoingPluginChannel(this, KANAL);
        getServer().getPluginManager().registerEvents(this, this);
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
        getLogger().info((istHub ? "Hub" : "Backend") + ", " + kisten.size() + " Kisten, Hub-Server „" + hubServer + "“");
    }

    @Override
    public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {
        if (command.getName().equals("serverwahl")) {
            if (args.length == 1 && args[0].equals("reload")) {
                laden();
                sender.sendMessage(Component.text("serverwahl neu geladen (" + kisten.size() + " Kisten)", NamedTextColor.GREEN));
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

    @EventHandler
    public void beiKlick(PlayerInteractEvent e) {
        if (!istHub || e.getAction() != Action.RIGHT_CLICK_BLOCK || e.getHand() != EquipmentSlot.HAND) {
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
        e.setCancelled(true);
        menueOeffnen(e.getPlayer(), kategorie);
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
            String gesperrt = sperrText(p, s.get("sperre"));
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

    /**
     * Sperre aus der Config: {objective, eintrag, ab, text}. Gesperrt, solange der Punktestand von eintrag im Haupt-Scoreboard
     * unter ab liegt (z. B. #offen in insel_zustand vor der Eröffnung). Wer serverwahl.vorab hat (Ops, Tester), kommt trotzdem durch.
     * @return Sperrtext oder null, wenn frei
     */
    private String sperrText(Player p, Object sperre) {
        if (!(sperre instanceof Map<?, ?> sp) || p.hasPermission("serverwahl.vorab")) {
            return null;
        }
        Objective obj = Bukkit.getScoreboardManager().getMainScoreboard().getObjective(String.valueOf(sp.get("objective")));
        int ab = sp.get("ab") instanceof Number n ? n.intValue() : 1;
        int stand = obj == null ? 0 : obj.getScore(String.valueOf(sp.get("eintrag"))).getScore();
        return stand >= ab ? null : String.valueOf(sp.containsKey("text") ? sp.get("text") : "<red>Noch geschlossen");
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
