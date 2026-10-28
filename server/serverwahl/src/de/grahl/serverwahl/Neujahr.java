package de.grahl.serverwahl;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;

import net.kyori.adventure.text.Component;
import net.kyori.adventure.text.format.NamedTextColor;
import net.kyori.adventure.text.minimessage.MiniMessage;
import net.kyori.adventure.title.Title;

import org.bukkit.Bukkit;
import org.bukkit.Color;
import org.bukkit.FireworkEffect;
import org.bukkit.Location;
import org.bukkit.World;
import org.bukkit.configuration.ConfigurationSection;
import org.bukkit.entity.Firework;
import org.bukkit.entity.Player;
import org.bukkit.event.EventHandler;
import org.bukkit.event.EventPriority;
import org.bukkit.event.Listener;
import org.bukkit.event.entity.EntityDamageByEntityEvent;
import org.bukkit.inventory.meta.FireworkMeta;
import org.bukkit.plugin.Plugin;
import org.bukkit.scheduler.BukkitTask;

/**
 * Neujahrsfeuerwerk (Pascal 28.10.): Zum Zeitpunkt (echte Uhr, Standard 01.01.2027 00:00 Europe/Berlin) für alle online Spieler, wo sie gerade sind.
 * Vorher (nacht-vorher-sekunden) Nacht und klares Wetter in den Overworld-Welten, danach läuft der Tageszyklus normal weiter.
 * Countdown 10…1 als Titel, dann der Neujahrstitel und dauer-sekunden lang Raketen in einigem Abstand um die Spieler.
 * Gegen Lag: Spieler, die nah beieinander stehen (gruppen-radius), teilen sich die Raketen; je Runde (alle runde-ticks) je Gruppe
 * raketen-je-runde Raketen. Raketen machen keinen Schaden. Nicht im Nether. Erledigt-Merker plugins/Serverwahl/neujahr.txt, damit ein
 * Neustart im Zeitfenster nicht von vorn beginnt. /serverwahl feuerwerk test [sekunden] löst es sofort aus (ohne Merker), … stopp beendet es.
 * Am Himmel steht währenddessen „Frohes neues Jahr 2027!“ (bzw. Englisch je nach Client-Sprache): je Spieler ein großes, leuchtendes
 * Text-Display vor ihm am Himmel, nur für ihn sichtbar (sonst überlagern sich die Schriftzüge in Gruppen). Nicht gespeichert
 * (setPersistent false), ein Neustart räumt sie also weg; der Merker setzt die Show mit neuen Schriftzügen fort.
 * Die Nacht kommt als Zeitraffer über nacht-uebergang-sekunden statt als Sprung, damit Dorfbewohner ihren Tagesplan normal durchlaufen.
 */
final class Neujahr implements Listener {

    private static final MiniMessage MM = MiniMessage.miniMessage();
    private static final String RAKETEN_TAG = "sw_neujahr";
    private static final List<Color> FARBEN = List.of(Color.RED, Color.LIME, Color.AQUA, Color.YELLOW, Color.FUCHSIA, Color.ORANGE,
            Color.WHITE, Color.fromRGB(0x3366FF), Color.fromRGB(0xFFD700), Color.fromRGB(0xFF69B4));
    private static final FireworkEffect.Type[] FORMEN = { FireworkEffect.Type.BALL, FireworkEffect.Type.BALL_LARGE, FireworkEffect.Type.STAR,
            FireworkEffect.Type.BURST, FireworkEffect.Type.BALL };

    private final Plugin plugin;
    private boolean aktiv;
    private ZonedDateTime zeitpunkt;
    private int nachtVorher;
    private int countdown;
    private int dauer;
    private int rundeTicks;
    private int raketenJeRunde;
    private double gruppenRadius;
    private double abstandMin;
    private double abstandMax;
    private String titel;
    private String untertitel;
    private String himmelDe;
    private String himmelEn;
    private float himmelSkala;
    private double himmelAbstand;
    private double himmelHoehe;
    private int nachtUebergang;
    /** Schriftzug je Spieler */
    private final java.util.Map<java.util.UUID, org.bukkit.entity.TextDisplay> schriftzuege = new java.util.HashMap<>();
    private final java.util.Map<java.util.UUID, Float> schriftRichtung = new java.util.HashMap<>();

    private BukkitTask uhr;
    private BukkitTask show;
    /** Test: eigener Zeitpunkt statt des eingestellten, ohne Merker */
    private ZonedDateTime testZeitpunkt;
    private int testDauer;
    private boolean nachtGesetzt;
    private int zuletztGezeigt = Integer.MAX_VALUE;

    Neujahr(Plugin plugin) {
        this.plugin = plugin;
    }

    void laden(ConfigurationSection c) {
        aktiv = c != null && c.getBoolean("aktiv", false);
        ZoneId zone = ZoneId.of(c == null ? "Europe/Berlin" : c.getString("zeitzone", "Europe/Berlin"));
        zeitpunkt = LocalDateTime.parse(c == null ? "2027-01-01T00:00" : c.getString("zeitpunkt", "2027-01-01T00:00")).atZone(zone);
        nachtVorher = c == null ? 120 : c.getInt("nacht-vorher-sekunden", 120);
        countdown = c == null ? 10 : c.getInt("countdown-sekunden", 10);
        dauer = c == null ? 120 : c.getInt("dauer-sekunden", 120);
        rundeTicks = Math.max(5, c == null ? 30 : c.getInt("runde-ticks", 30));
        raketenJeRunde = Math.max(1, c == null ? 2 : c.getInt("raketen-je-runde", 2));
        gruppenRadius = c == null ? 32 : c.getDouble("gruppen-radius", 32);
        abstandMin = c == null ? 8 : c.getDouble("abstand-min", 8);
        abstandMax = Math.max(abstandMin, c == null ? 22 : c.getDouble("abstand-max", 22));
        titel = c == null ? "<gold><bold>Frohes neues Jahr 2027!" : c.getString("titel", "<gold><bold>Frohes neues Jahr 2027!");
        untertitel = c == null ? "" : c.getString("untertitel", "");
        himmelDe = c == null ? null : c.getString("himmel-text-de", "<bold><gradient:#FFD700:#FF8C00:#FF3B3B>Frohes neues Jahr 2027!");
        himmelEn = c == null ? null : c.getString("himmel-text-en", "<bold><gradient:#FFD700:#FF8C00:#FF3B3B>Happy New Year 2027!");
        himmelSkala = c == null ? 7f : (float) c.getDouble("himmel-skala", 7);
        himmelAbstand = c == null ? 45 : c.getDouble("himmel-abstand", 45);
        himmelHoehe = c == null ? 22 : c.getDouble("himmel-hoehe", 22);
        nachtUebergang = c == null ? 40 : c.getInt("nacht-uebergang-sekunden", 40);
        if (uhr == null) {
            uhr = Bukkit.getScheduler().runTaskTimer(plugin, this::ticken, 40L, 5L);
        }
    }

    private Path merker() {
        return plugin.getDataFolder().toPath().resolve("neujahr.txt");
    }

    private boolean erledigt() {
        try {
            return Files.exists(merker()) && Files.readString(merker()).trim().equals(zeitpunkt.toString());
        } catch (IOException e) {
            return false;
        }
    }

    /** alle 5 Ticks: Nacht, Countdown, Start */
    private void ticken() {
        boolean test = testZeitpunkt != null;
        if (!test && (!aktiv || erledigt())) {
            return;
        }
        ZonedDateTime ziel = test ? testZeitpunkt : zeitpunkt;
        int laenge = test ? testDauer : dauer;
        long ms = Duration.between(ZonedDateTime.now(ziel.getZone()), ziel).toMillis();
        if (ms <= -laenge * 1000L) {
            return; // vorbei (Server war aus)
        }
        if (ms <= nachtVorher * 1000L && !nachtGesetzt) {
            nachtGesetzt = true;
            for (World w : Bukkit.getWorlds()) {
                if (w.getEnvironment() == World.Environment.NORMAL) {
                    w.setStorm(false);
                    w.setThundering(false);
                    w.setClearWeatherDuration(20 * 60 * 10);
                    zeitraffer(w, test ? 3 : nachtUebergang);
                }
            }
            plugin.getLogger().info("Neujahr: Nacht und klares Wetter" + (test ? " (Test)" : ""));
        }
        if (ms > 0) {
            int sek = (int) ((ms + 999) / 1000);
            if (sek <= countdown && sek != zuletztGezeigt) {
                zuletztGezeigt = sek;
                Title t = Title.title(Component.text(sek, NamedTextColor.GOLD), Component.empty(),
                        Title.Times.times(Duration.ZERO, Duration.ofMillis(900), Duration.ofMillis(100)));
                Bukkit.getOnlinePlayers().forEach(p -> p.showTitle(t));
            }
            return;
        }
        if (show != null) {
            return;
        }
        Title t = Title.title(MM.deserialize(titel), MM.deserialize(untertitel),
                Title.Times.times(Duration.ofMillis(200), Duration.ofSeconds(5), Duration.ofSeconds(1)));
        Bukkit.getOnlinePlayers().forEach(p -> p.showTitle(t));
        if (!test) {
            try {
                Files.writeString(merker(), zeitpunkt.toString());
            } catch (IOException e) {
                plugin.getLogger().warning("Neujahr-Merker: " + e.getMessage());
            }
        }
        // nach einem Neustart mitten im Feuerwerk nur den Rest zeigen
        long restTicks = Math.max(20, (laenge * 1000L + ms) / 50);
        plugin.getLogger().info("Neujahr: Feuerwerk " + (restTicks / 20) + " s" + (test ? " (Test)" : ""));
        long[] gelaufen = { 0 };
        show = Bukkit.getScheduler().runTaskTimer(plugin, () -> {
            gelaufen[0] += rundeTicks;
            if (gelaufen[0] > restTicks) {
                beenden();
                return;
            }
            runde();
        }, 0L, rundeTicks);
    }

    /** Uhrzeit in sekunden Sekunden auf 18000 (Mitternacht) laufen lassen, auf dem kürzeren Weg (vor oder zurück) */
    private void zeitraffer(World w, int sekunden) {
        long start = w.getFullTime();
        long vor = (18000 - start % 24000 + 24000) % 24000;
        long weg = vor <= 12000 ? vor : vor - 24000;
        int ticks = Math.max(1, sekunden * 20);
        long[] schritt = { 0 };
        // setFullTime statt setTime: setTime läuft nur vorwärts, hier darf es auch zurück gehen (z. B. von 21000 auf 18000)
        Bukkit.getScheduler().runTaskTimer(plugin, task -> {
            schritt[0]++;
            w.setFullTime(start + weg * schritt[0] / ticks);
            if (schritt[0] >= ticks) {
                task.cancel();
            }
        }, 0L, 1L);
    }

    /** Schriftzug am Himmel vor dem Spieler (Blickrichtung beim Erscheinen, neu ausgerichtet bei > 60° Drehung), nur für ihn sichtbar */
    private void schriftzug(Player p) {
        if (himmelDe == null || himmelDe.isBlank() || p.getWorld().getEnvironment() == World.Environment.NETHER) {
            return;
        }
        float yaw = p.getLocation().getYaw();
        Float alt = schriftRichtung.get(p.getUniqueId());
        org.bukkit.entity.TextDisplay d = schriftzuege.get(p.getUniqueId());
        if (d != null && d.isValid() && d.getWorld().equals(p.getWorld()) && alt != null && Math.abs(((yaw - alt) % 360 + 540) % 360 - 180) < 60) {
            yaw = alt; // Richtung behalten, nur mitziehen
        }
        double rad = Math.toRadians(yaw);
        Location ziel = p.getLocation().add(-Math.sin(rad) * himmelAbstand, himmelHoehe, Math.cos(rad) * himmelAbstand);
        ziel.setYaw(0);
        ziel.setPitch(0);
        schriftRichtung.put(p.getUniqueId(), yaw);
        if (d != null && d.isValid() && d.getWorld().equals(p.getWorld())) {
            d.teleport(ziel);
            return;
        }
        if (d != null) {
            d.remove();
        }
        boolean deutsch = p.locale().getLanguage().equals("de");
        String text = deutsch || himmelEn == null ? himmelDe : himmelEn;
        org.bukkit.entity.TextDisplay neu = p.getWorld().spawn(ziel, org.bukkit.entity.TextDisplay.class, t -> {
            t.text(MM.deserialize(text));
            t.setBillboard(org.bukkit.entity.Display.Billboard.CENTER);
            t.setBrightness(new org.bukkit.entity.Display.Brightness(15, 15));
            t.setBackgroundColor(Color.fromARGB(0, 0, 0, 0));
            t.setShadowed(true);
            t.setViewRange(4f);
            t.setTeleportDuration(20);
            t.setTransformation(new org.bukkit.util.Transformation(new org.joml.Vector3f(), new org.joml.AxisAngle4f(),
                    new org.joml.Vector3f(himmelSkala, himmelSkala, himmelSkala), new org.joml.AxisAngle4f()));
            t.setPersistent(false);
            t.setVisibleByDefault(false);
            t.addScoreboardTag(RAKETEN_TAG);
        });
        p.showEntity(plugin, neu);
        schriftzuege.put(p.getUniqueId(), neu);
    }

    private void schriftzuegeWeg() {
        schriftzuege.values().forEach(org.bukkit.entity.Entity::remove);
        schriftzuege.clear();
        schriftRichtung.clear();
    }

    /** eine Runde: Spieler zu Gruppen zusammenfassen, je Gruppe ein paar Raketen, zeitlich in der Runde verteilt */
    private void runde() {
        List<Location> mitten = new ArrayList<>();
        Bukkit.getOnlinePlayers().forEach(this::schriftzug);
        schriftzuege.keySet().removeIf(id -> {
            if (Bukkit.getPlayer(id) == null) {
                schriftzuege.get(id).remove();
                return true;
            }
            return false;
        });
        for (Player p : Bukkit.getOnlinePlayers()) {
            Location l = p.getLocation();
            if (l.getWorld().getEnvironment() == World.Environment.NETHER) {
                continue;
            }
            boolean schon = mitten.stream().anyMatch(m -> m.getWorld().equals(l.getWorld()) && m.distanceSquared(l) < gruppenRadius * gruppenRadius);
            if (!schon) {
                mitten.add(l);
            }
        }
        ThreadLocalRandom r = ThreadLocalRandom.current();
        for (Location m : mitten) {
            for (int i = 0; i < raketenJeRunde; i++) {
                Bukkit.getScheduler().runTaskLater(plugin, () -> rakete(m), r.nextInt(rundeTicks));
            }
        }
    }

    private void rakete(Location mitte) {
        ThreadLocalRandom r = ThreadLocalRandom.current();
        double winkel = r.nextDouble(Math.PI * 2);
        double abstand = r.nextDouble(abstandMin, abstandMax);
        World w = mitte.getWorld();
        double x = mitte.getX() + Math.cos(winkel) * abstand;
        double z = mitte.getZ() + Math.sin(winkel) * abstand;
        if (!w.isChunkLoaded((int) Math.floor(x) >> 4, (int) Math.floor(z) >> 4)) {
            return;
        }
        // über dem Boden an der Stelle, mindestens auf Höhe des Spielers (Höhlen, Insel)
        double y = Math.max(mitte.getY(), w.getHighestBlockYAt((int) Math.floor(x), (int) Math.floor(z)) + 1);
        Location start = new Location(w, x, y, z);
        w.spawn(start, Firework.class, f -> {
            FireworkMeta fm = f.getFireworkMeta();
            List<Color> farben = new ArrayList<>();
            for (int i = 0, n = 1 + r.nextInt(3); i < n; i++) {
                farben.add(FARBEN.get(r.nextInt(FARBEN.size())));
            }
            fm.addEffect(FireworkEffect.builder().with(FORMEN[r.nextInt(FORMEN.length)]).withColor(farben)
                    .withFade(FARBEN.get(r.nextInt(FARBEN.size()))).flicker(r.nextInt(4) == 0).trail(r.nextBoolean()).build());
            fm.setPower(1 + r.nextInt(2));
            f.setFireworkMeta(fm);
            f.addScoreboardTag(RAKETEN_TAG);
            f.setPersistent(false);
        });
    }

    /** unsere Raketen machen keinen Schaden */
    @EventHandler(priority = EventPriority.LOWEST)
    public void beimSchaden(EntityDamageByEntityEvent e) {
        if (e.getDamager() instanceof Firework f && f.getScoreboardTags().contains(RAKETEN_TAG)) {
            e.setCancelled(true);
        }
    }

    private void beenden() {
        if (show != null) {
            show.cancel();
            show = null;
        }
        schriftzuegeWeg();
        plugin.getLogger().info("Neujahr: Feuerwerk vorbei" + (testZeitpunkt != null ? " (Test)" : ""));
        testZeitpunkt = null;
        nachtGesetzt = false;
        zuletztGezeigt = Integer.MAX_VALUE;
    }

    /** /serverwahl feuerwerk test [sekunden]: Countdown startet sofort, Feuerwerk danach so lange (Standard: dauer-sekunden) */
    String test(Integer sekunden) {
        if (show != null || testZeitpunkt != null) {
            return "Feuerwerk läuft schon (/serverwahl feuerwerk stopp)";
        }
        testDauer = sekunden == null ? dauer : Math.max(5, sekunden);
        testZeitpunkt = ZonedDateTime.now(zeitpunkt.getZone()).plusSeconds(countdown + 1L);
        nachtGesetzt = false;
        zuletztGezeigt = Integer.MAX_VALUE;
        return "Test: Countdown läuft, danach " + testDauer + " s Feuerwerk (Nacht wird gesetzt)";
    }

    String stopp() {
        boolean lief = show != null || testZeitpunkt != null;
        beenden();
        return lief ? "Feuerwerk beendet" : "Es lief kein Feuerwerk";
    }

    String status() {
        return "Neujahr " + (aktiv ? "an" : "aus") + ", Zeitpunkt " + zeitpunkt + (erledigt() ? " (erledigt)" : "") + ", Dauer " + dauer
                + " s, Runde " + rundeTicks + " Ticks, " + raketenJeRunde + " Raketen je Gruppe";
    }
}
