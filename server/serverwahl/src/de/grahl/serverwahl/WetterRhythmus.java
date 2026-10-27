package de.grahl.serverwahl;

import java.util.concurrent.ThreadLocalRandom;

import org.bukkit.Bukkit;
import org.bukkit.World;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.event.EventHandler;
import org.bukkit.event.Listener;
import org.bukkit.event.weather.WeatherChangeEvent;
import org.bukkit.plugin.Plugin;

/**
 * Öfter Niederschlag als in Vanilla (Pascal 27.10., Winter-Season): Der Wetterzyklus läuft weiter, nur die Dauern werden gesetzt.
 * Beginnt Regen/Schnee, dauert er dauer-min…dauer-max Minuten; danach bleibt es pause-min…pause-max Minuten klar.
 * Gewitter folgt weiter Vanilla. Mit aktiv: false gilt wieder das normale Vanilla-Wetter.
 */
final class WetterRhythmus implements Listener {

    private final Plugin plugin;
    private boolean aktiv;
    private String welt;
    private int pauseMin;
    private int pauseMax;
    private int dauerMin;
    private int dauerMax;

    WetterRhythmus(Plugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        if (!aktiv) {
            return;
        }
        welt = c.getString("welt", "world");
        pauseMin = c.getInt("pause-min", 40);
        pauseMax = Math.max(pauseMin, c.getInt("pause-max", 60));
        dauerMin = c.getInt("dauer-min", 5);
        dauerMax = Math.max(dauerMin, c.getInt("dauer-max", 8));
        // nach Start/Reload: laufende klare Phase auf unseren Rhythmus kürzen
        Bukkit.getScheduler().runTask(plugin, () -> {
            World w = Bukkit.getWorld(welt);
            if (w != null && !w.hasStorm() && w.getClearWeatherDuration() > minuten(pauseMax)) {
                w.setClearWeatherDuration(minuten(zufall(pauseMin, pauseMax)));
            }
        });
    }

    private static int zufall(int von, int bis) {
        return ThreadLocalRandom.current().nextInt(von, bis + 1);
    }

    private static int minuten(int m) {
        return m * 60 * 20;
    }

    @EventHandler(ignoreCancelled = true)
    public void beimWetterwechsel(WeatherChangeEvent e) {
        if (!aktiv || !e.getWorld().getName().equals(welt)) {
            return;
        }
        World w = e.getWorld();
        boolean niederschlag = e.toWeatherState();
        // erst im nächsten Tick setzen, Vanilla schreibt die neue Dauer erst nach dem Ereignis
        Bukkit.getScheduler().runTask(plugin, () -> {
            if (niederschlag && w.hasStorm()) {
                w.setWeatherDuration(minuten(zufall(dauerMin, dauerMax)));
            } else if (!niederschlag && !w.hasStorm()) {
                w.setClearWeatherDuration(minuten(zufall(pauseMin, pauseMax)));
            }
        });
    }
}
