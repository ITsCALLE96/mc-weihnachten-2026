package de.grahl.serverwahl;

import java.time.Duration;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

import net.kyori.adventure.bossbar.BossBar;
import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.minimessage.MiniMessage;
import net.kyori.adventure.title.Title;

import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.Location;
import org.bukkit.Particle;
import org.bukkit.Sound;
import org.bukkit.SoundCategory;
import org.bukkit.World;
import org.bukkit.WorldBorder;
import org.bukkit.WeatherType;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Player;
import org.bukkit.plugin.Plugin;
import org.bukkit.potion.PotionEffect;
import org.bukkit.potion.PotionEffectType;
import org.bukkit.scheduler.BukkitTask;

/**
 * Kurzes Event beim Öffnen von Nether bzw. End (Pascal 28.10.), gestartet von Termine (Feld „event: nether|end“), vorlauf Sekunden vor dem Termin
 * bis nachlauf Sekunden danach. Alles nur fürs Auge und Ohr der Spieler in der Oberwelt, nichts an der Welt:
 * - Stimmung über Spieler-eigene Werte: Nacht als Zeitraffer (setPlayerTime), Regen (setPlayerWeather), roter Bildschirmrand über eine nur für den
 *   Spieler gesetzte Weltgrenze mit riesiger Warn-Distanz (setWorldBorder, wirkt nur auf die Anzeige; Rand nur mit Vignette/„Schön“-Grafik sichtbar)
 * - Blitze nur als Effekt (strikeLightningEffect: kein Schaden, kein Feuer), um die Spieler verteilt, zum Ende hin dichter; beim End mit lila Partikeln
 * - Partikel um die Spieler (Nether: Lava-Tropfen, Flammen, Asche; End: Portal-, Reverse-Portal-, Endstab-Partikel), Klänge, Bossbar
 * - bei 0: Knall + Titel; danach Zeit als Zeitraffer zurück, Wetter, Grenze und Zeit wieder Server-Stand
 * dezent: true (Hub) = weniger Partikel, seltene, weite Blitze, keine Dunkelheit, leisere Klänge. Ein Neustart beendet alles (nichts gespeichert).
 */
final class DimensionsEvent {

    private static final MiniMessage MM = MiniMessage.miniMessage();
    private static final long NACHT = 18000;
    private static final Particle.DustOptions LILA = new Particle.DustOptions(Color.fromRGB(0xA040FF), 2.0f);
    private static final Particle.DustOptions BLAU = new Particle.DustOptions(Color.fromRGB(0x4060FF), 1.6f);

    private final Plugin plugin;
    private int vorlauf = 75;
    private int nachlauf = 12;
    private boolean dezent;
    private boolean blitze = true;
    private boolean rand = true;
    private boolean nacht = true;
    private String titelNether = "<red><bold>Der Nether ist offen!";
    private String titelEnd = "<light_purple><bold>Das End ist offen – Drachenkampf!";
    private String barNether = "<red>Der Nether öffnet …";
    private String barEnd = "<light_purple>Das End öffnet …";

    // laufendes Event
    private String art;
    private long nullZeit;
    private long startZeit;
    private boolean geoeffnet;
    private long naechsterBlitz;
    private int takt;
    private BukkitTask task;
    private BossBar bar;
    private final Set<UUID> betroffen = new HashSet<>();

    DimensionsEvent(Plugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c) {
        if (c == null) {
            return;
        }
        vorlauf = Math.max(5, c.getInt("vorlauf", 75));
        nachlauf = Math.max(3, c.getInt("nachlauf", 12));
        dezent = c.getBoolean("dezent", false);
        blitze = c.getBoolean("blitze", true);
        rand = c.getBoolean("rand", true);
        nacht = c.getBoolean("nacht", true);
        titelNether = c.getString("titel-nether", titelNether);
        titelEnd = c.getString("titel-end", titelEnd);
        barNether = c.getString("bossbar-nether", barNether);
        barEnd = c.getString("bossbar-end", barEnd);
    }

    int vorlauf() {
        return vorlauf;
    }

    boolean laeuft(String a) {
        return task != null && a.equals(art);
    }

    /** startet das Event; nullZeitMillis = Zeitpunkt der Öffnung (Systemzeit). Ein laufendes anderes Event wird beendet */
    void starten(String a, long nullZeitMillis) {
        if (!a.equals("nether") && !a.equals("end")) {
            return;
        }
        if (task != null) {
            beenden();
        }
        art = a;
        nullZeit = nullZeitMillis;
        startZeit = System.currentTimeMillis();
        geoeffnet = false;
        naechsterBlitz = 0;
        takt = 0;
        boolean nether = art.equals("nether");
        bar = BossBar.bossBar(MM.deserialize(nether ? barNether : barEnd), 1f, nether ? BossBar.Color.RED : BossBar.Color.PURPLE, BossBar.Overlay.NOTCHED_10);
        task = Bukkit.getScheduler().runTaskTimer(plugin, this::schritt, 1L, 2L);
        plugin.getLogger().info("Dimensions-Event " + art + " gestartet (" + (nullZeit - startZeit) / 1000 + " s bis zur Öffnung" + (dezent ? ", dezent" : "") + ")");
    }

    /** vom Termin bei 0: Knall und Titel (die Befehle führt Termine aus) */
    void oeffnen(String a) {
        if (!laeuft(a) || geoeffnet) {
            return;
        }
        geoeffnet = true;
        boolean nether = art.equals("nether");
        Title t = Title.title(MM.deserialize(nether ? titelNether : titelEnd), Component.empty(),
                Title.Times.times(Duration.ofMillis(200), Duration.ofSeconds(4), Duration.ofSeconds(1)));
        float laut = dezent ? 0.5f : 1f;
        for (Player p : oberwelt()) {
            p.showTitle(t);
            Location l = p.getLocation();
            p.playSound(l, Sound.ENTITY_GENERIC_EXPLODE, SoundCategory.MASTER, laut, 0.6f);
            p.playSound(l, Sound.ENTITY_LIGHTNING_BOLT_THUNDER, SoundCategory.MASTER, laut, 0.8f);
            if (nether) {
                p.playSound(l, Sound.ENTITY_GHAST_SCREAM, SoundCategory.MASTER, laut, 0.7f);
            } else {
                p.playSound(l, Sound.ENTITY_ENDER_DRAGON_GROWL, SoundCategory.MASTER, laut, 1f);
                p.playSound(l, Sound.BLOCK_END_PORTAL_SPAWN, SoundCategory.MASTER, laut, 1f);
            }
            p.spawnParticle(nether ? Particle.LAVA : Particle.REVERSE_PORTAL, l.clone().add(0, 1, 0), dezent ? 20 : 60, 2, 1.5, 2, 0.2);
            if (blitze && !dezent) {
                blitz(p, 8, 20);
            }
        }
        if (bar != null) {
            bar.progress(0f);
        }
    }

    String stopp() {
        if (task == null) {
            return "Kein Dimensions-Event aktiv";
        }
        String a = art;
        beenden();
        return "Dimensions-Event " + a + " beendet, alles zurückgesetzt";
    }

    private List<Player> oberwelt() {
        List<Player> l = new ArrayList<>();
        for (Player p : Bukkit.getOnlinePlayers()) {
            if (p.getWorld().getEnvironment() == World.Environment.NORMAL) {
                l.add(p);
            }
        }
        return l;
    }

    private void schritt() {
        long jetzt = System.currentTimeMillis();
        long bisNull = nullZeit - jetzt;
        if (bisNull < -nachlauf * 1000L) {
            beenden();
            return;
        }
        takt++;
        boolean nether = art.equals("nether");
        long gesamt = Math.max(1, nullZeit - startZeit);
        // 0 → 1 bis zur Öffnung, danach 1
        float stufe = (float) Math.min(1.0, Math.max(0.0, 1.0 - (double) bisNull / gesamt));
        // Ausklang: 1 → 0 über den Nachlauf
        float ausklang = bisNull >= 0 ? 1f : (float) Math.max(0.0, 1.0 + bisNull / (nachlauf * 1000.0));
        List<Player> spieler = oberwelt();
        Set<UUID> jetztDa = new HashSet<>();
        for (Player p : spieler) {
            jetztDa.add(p.getUniqueId());
            if (betroffen.add(p.getUniqueId())) {
                p.showBossBar(bar);
                if (nether) {
                    p.setPlayerWeather(WeatherType.DOWNFALL);
                }
            }
        }
        // wer in Nether/End gewechselt ist, bekommt sofort seinen normalen Stand zurück
        for (UUID id : new ArrayList<>(betroffen)) {
            if (!jetztDa.contains(id)) {
                Player p = Bukkit.getPlayer(id);
                if (p != null) {
                    zuruecksetzen(p);
                }
                betroffen.remove(id);
            }
        }
        if (bar != null && bisNull >= 0) {
            bar.progress(Math.max(0f, Math.min(1f, (float) bisNull / gesamt)));
        }
        for (Player p : spieler) {
            if (nacht) {
                zeit(p, stufe, ausklang, bisNull);
            }
            if (rand && takt % 10 == 0) {
                rand(p, (dezent ? 0.45f : 0.85f) * Math.min(1f, stufe * 1.5f + 0.2f) * ausklang);
            }
            if (takt % (dezent ? 10 : 5) == 0 && ausklang > 0.05f) {
                partikel(p, nether, stufe * ausklang);
            }
            if (takt % 40 == 0 && bisNull > 0) {
                klang(p, nether);
            }
            if (!nether && !dezent && bisNull > 0 && bisNull < gesamt && takt % 100 == 50) {
                // End: kurze Dunkelheits-Pulse
                p.addPotionEffect(new PotionEffect(PotionEffectType.DARKNESS, 50, 0, true, false, false));
            }
        }
        // Blitze: Abstand von 4 s (dezent 12 s) auf 0,5 s (dezent 3 s) zum Ende hin
        if (blitze && bisNull > 0 && !spieler.isEmpty() && jetzt >= naechsterBlitz) {
            double max = dezent ? 12000 : 4000;
            double min = dezent ? 3000 : 500;
            naechsterBlitz = jetzt + (long) (max - (max - min) * stufe);
            Player p = spieler.get(ThreadLocalRandom.current().nextInt(spieler.size()));
            blitz(p, dezent ? 35 : 15, dezent ? 80 : 50);
        }
    }

    /** Nacht als Zeitraffer hinein (erste 8 s) und hinaus (Nachlauf), dazwischen Nacht */
    private void zeit(Player p, float stufe, float ausklang, long bisNull) {
        long welt = p.getWorld().getTime();
        if (bisNull >= 0) {
            long hinein = Math.min(8000, Math.max(1, nullZeit - startZeit));
            double f = Math.min(1.0, (System.currentTimeMillis() - startZeit) / (double) hinein);
            long delta = Math.floorMod(NACHT - welt, 24000L);
            p.setPlayerTime(welt + (long) (delta * glatt(f)), false);
        } else {
            long delta = Math.floorMod(welt - NACHT, 24000L);
            p.setPlayerTime(NACHT + (long) (delta * glatt(1.0 - ausklang)), false);
        }
    }

    private static double glatt(double f) {
        return f * f * (3 - 2 * f);
    }

    /** roter Rand: Spieler-eigene Grenze wie die echte, Warn-Distanz so gewählt, dass die Stärke etwa „staerke“ ist */
    private void rand(Player p, float staerke) {
        if (staerke <= 0.02f) {
            p.setWorldBorder(null);
            return;
        }
        WorldBorder echt = p.getWorld().getWorldBorder();
        WorldBorder b = Bukkit.createWorldBorder();
        b.setCenter(echt.getCenter());
        b.setSize(echt.getSize());
        Location c = echt.getCenter();
        double halb = echt.getSize() / 2;
        double abstand = Math.max(1, Math.min(halb - Math.abs(p.getX() - c.getX()), halb - Math.abs(p.getZ() - c.getZ())));
        b.setWarningDistance((int) Math.min(Integer.MAX_VALUE / 2, abstand / Math.max(0.05, 1 - staerke)));
        b.setWarningTime(0);
        p.setWorldBorder(b);
    }

    /** nur an den Spieler selbst (sonst vervielfachen sich die Partikel, wo Spieler beieinander stehen) */
    private void partikel(Player p, boolean nether, float staerke) {
        Location l = p.getLocation().add(0, 1.2, 0);
        Player w = p;
        int n = Math.max(2, (int) ((dezent ? 6 : 14) * (0.4f + staerke)));
        if (nether) {
            w.spawnParticle(Particle.FALLING_LAVA, l.clone().add(0, 5, 0), n, 6, 2, 6, 0);
            w.spawnParticle(Particle.FLAME, l, n / 2, 4, 1.5, 4, 0.01);
            w.spawnParticle(Particle.ASH, l.clone().add(0, 2, 0), n * 2, 6, 3, 6, 0);
        } else {
            w.spawnParticle(Particle.PORTAL, l, n * 2, 4, 1.5, 4, 0.6);
            w.spawnParticle(Particle.REVERSE_PORTAL, l.clone().add(0, 3, 0), n, 6, 2, 6, 0.02);
            w.spawnParticle(Particle.END_ROD, l.clone().add(0, 4, 0), n / 3 + 1, 6, 2, 6, 0.01);
        }
    }

    private void klang(Player p, boolean nether) {
        float laut = dezent ? 0.3f : 0.7f;
        Sound s;
        if (nether) {
            s = ThreadLocalRandom.current().nextBoolean() ? Sound.ENTITY_GHAST_AMBIENT : Sound.AMBIENT_NETHER_WASTES_MOOD;
        } else {
            s = ThreadLocalRandom.current().nextBoolean() ? Sound.ENTITY_ENDERMAN_STARE : Sound.ENTITY_ENDER_DRAGON_AMBIENT;
        }
        p.playSound(p.getLocation(), s, SoundCategory.AMBIENT, laut, 0.8f + ThreadLocalRandom.current().nextFloat() * 0.3f);
    }

    /** Blitz nur als Effekt in min…max Blöcken Abstand, beim End lila „eingefärbt“ */
    private void blitz(Player p, int min, int max) {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        double winkel = r.nextDouble(Math.PI * 2);
        double abst = min + r.nextDouble(Math.max(1, max - min));
        Location l = p.getLocation();
        int x = (int) (l.getX() + Math.cos(winkel) * abst);
        int z = (int) (l.getZ() + Math.sin(winkel) * abst);
        World w = p.getWorld();
        if (!w.isChunkLoaded(x >> 4, z >> 4)) {
            return;
        }
        Location ziel = new Location(w, x + 0.5, w.getHighestBlockYAt(x, z) + 1, z + 0.5);
        w.strikeLightningEffect(ziel);
        if (art.equals("end")) {
            for (int y = 0; y < 24; y += 2) {
                w.spawnParticle(Particle.DUST, ziel.clone().add(0, y, 0), 6, 0.3, 1, 0.3, 0, y % 4 == 0 ? LILA : BLAU);
            }
            w.spawnParticle(Particle.REVERSE_PORTAL, ziel, 40, 1, 0.5, 1, 0.1);
        } else {
            w.spawnParticle(Particle.LAVA, ziel, 12, 1, 0.3, 1, 0);
        }
    }

    private void zuruecksetzen(Player p) {
        p.hideBossBar(bar);
        p.resetPlayerTime();
        p.resetPlayerWeather();
        p.setWorldBorder(null);
    }

    private void beenden() {
        if (task != null) {
            task.cancel();
            task = null;
        }
        for (UUID id : betroffen) {
            Player p = Bukkit.getPlayer(id);
            if (p != null) {
                zuruecksetzen(p);
            }
        }
        betroffen.clear();
        plugin.getLogger().info("Dimensions-Event " + art + " beendet");
        art = null;
    }

    String status() {
        return task == null ? "Dimensions-Event: keines aktiv" : "Dimensions-Event " + art + ": " + (nullZeit - System.currentTimeMillis()) / 1000 + " s bis zur Öffnung, "
                + betroffen.size() + " Spieler";
    }
}
