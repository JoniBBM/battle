#!/bin/bash
# Temporär Firewall-Ports für Battlefield öffnen

echo "🔓 Öffne Firewall-Ports für Battlefield..."

# Ports öffnen
sudo iptables -I INPUT -p tcp --dport 3000 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 5173 -j ACCEPT
sudo iptables -I INPUT -p tcp --dport 8080 -j ACCEPT

# Zeige aktive Regeln
echo ""
echo "✅ Ports geöffnet. Aktive INPUT-Regeln:"
sudo iptables -L INPUT -n --line-numbers | head -20

echo ""
echo "📱 Teste jetzt auf deinem iPhone:"
echo "   http://192.168.187.164:8080/test.html"
echo "   http://192.168.187.164:5173"
