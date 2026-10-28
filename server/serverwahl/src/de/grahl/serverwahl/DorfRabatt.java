package de.grahl.serverwahl;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.util.ArrayList;
import java.util.List;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;

import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Villager;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.inventory.InventoryOpenEvent;
import org.bukkit.inventory.MerchantInventory;
import org.bukkit.inventory.MerchantRecipe;

/**
 * Weihnachtsrabatt bei Dorfbewohnern (Pascal 28.10.): an den eingestellten Tagen (Standard 24.–26.12., echte Uhr Europe/Berlin) kostet jedes
 * Angebot die Hälfte, zusätzlich zu den Vanilla-Rabatten (geheilter Zombie-Dorfbewohner, Held des Dorfes).
 * Wie in Vanilla über den Sonderpreis des Angebots: Vanilla rechnet ihn beim Öffnen des Handelsfensters aus Ruf/Effekten neu und setzt ihn
 * beim Schließen wieder auf 0. serverwahl zieht beim Öffnen (nach Vanilla, vor dem Senden an den Client) zusätzlich die Hälfte des dann
 * gültigen Preises ab. Dadurch bleibt nichts dauerhaft halbiert; an An- und Ausschalten hängt kein Neustart, ab 27.12. 00:00 gilt der Normalpreis
 * beim nächsten Öffnen. Nur Dorfbewohner (Wanderhändler hat sein eigenes Datapack). /serverwahl rabatt an | aus | auto | status zum Testen.
 */
final class DorfRabatt implements Listener {

    private boolean aktiv;
    private ZoneId zone = ZoneId.of("Europe/Berlin");
    private final List<LocalDate> tage = new ArrayList<>();
    private int prozent = 50;
    /** Test: null = nach Datum, true/false = erzwungen */
    private Boolean erzwungen;

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        tage.clear();
        if (c == null) {
            return;
        }
        zone = ZoneId.of(c.getString("zeitzone", "Europe/Berlin"));
        prozent = Math.max(1, Math.min(100, c.getInt("prozent", 50)));
        for (String t : c.getStringList("tage")) {
            tage.add(LocalDate.parse(t));
        }
    }

    boolean gilt() {
        if (erzwungen != null) {
            return erzwungen;
        }
        return aktiv && tage.contains(LocalDateTime.now(zone).toLocalDate());
    }

    @EventHandler(priority = EventPriority.HIGHEST, ignoreCancelled = true)
    public void beimOeffnen(InventoryOpenEvent e) {
        if (!(e.getInventory() instanceof MerchantInventory mi) || !(mi.getHolder() instanceof Villager) || !gilt()) {
            return;
        }
        boolean geaendert = false;
        for (MerchantRecipe r : mi.getMerchant().getRecipes()) {
            // getAdjustedIngredient1: Grundpreis + Nachfrage + Sonderpreis, so wie der Spieler ihn gerade sieht
            int jetzt = r.getAdjustedIngredient1() == null ? 0 : r.getAdjustedIngredient1().getAmount();
            if (jetzt <= 1) {
                continue;
            }
            int ziel = Math.max(1, (int) Math.ceil(jetzt * (100 - prozent) / 100.0));
            r.setSpecialPrice(r.getSpecialPrice() - (jetzt - ziel));
            geaendert = true;
        }
        if (geaendert) {
            e.getPlayer().sendActionBar(Component.text("Weihnachtsrabatt: alles zum halben Preis!", NamedTextColor.GOLD));
        }
    }

    String befehl(String[] args) {
        if (args.length >= 2) {
            switch (args[1]) {
                case "an" -> erzwungen = true;
                case "aus" -> erzwungen = false;
                case "auto" -> erzwungen = null;
                default -> {
                }
            }
        }
        return "Dorf-Rabatt " + (gilt() ? "gilt gerade" : "gilt nicht") + (erzwungen == null ? " (nach Datum: " + tage + ")" : " (Test erzwungen)")
                + ", " + prozent + " %. /serverwahl rabatt an | aus | auto";
    }
}
