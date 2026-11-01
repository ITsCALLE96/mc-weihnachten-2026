#!/usr/bin/env bash
# VM200: vm.swappiness 60 → 10 (Leitung/Pascal 01.11., Lag-Analyse: bis 700 MB im Swap, obwohl 8,6 GB RAM frei waren; ausgelagerte
# Java-Heap-Seiten verlängern GC-Pausen). Wirkt sofort (sysctl) und dauerhaft (/etc/sysctl.d). Kein Neustart. Als root auf VM200.
set -euo pipefail
D=/etc/sysctl.d/90-mc-swappiness.conf
echo "vorher: vm.swappiness=$(cat /proc/sys/vm/swappiness), Swap belegt $(free -m | awk '/^Swap/{print $3}') MB"
cat > "$D" <<'EOF'
# Minecraft-Netz (01.11.): Java-Heaps nicht auslagern, solange RAM frei ist (Standard 60)
vm.swappiness = 10
EOF
chmod 644 "$D"
sysctl -q -p "$D"
echo "nachher: vm.swappiness=$(cat /proc/sys/vm/swappiness) (Datei $D)"
exit 0
