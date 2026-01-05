# Battlefield Geländespiel - Entwicklungsdokumentation

## Projektübersicht

Ein Echtzeit-Punktesystem für ein Capture-the-Flag Geländespiel mit 60 Teilnehmern auf einer Konfifreizeit.

### Spielkonzept
- **Teams** erobern **Zonen** durch Anwesenheit
- Mehrere Teams können gleichzeitig in einer Zone sein
- **Wichtig**: Jedes Team bekommt VOLLE Punkte (nicht aufgeteilt!) - Bei 3 Teams in Zone = 3 Punkte/Sekunde gesamt
- Zone bleibt beim letzten Team wenn alle gehen
- **Lebensbändel-System**: Gefangene Bändel können an separater Station abgegeben werden für Punkte

## Technologie-Stack

```
Frontend (Port 5173)          Backend (Port 3000)          Database (Port 5432)
├── React 18                  ├── Node.js 20               └── PostgreSQL 16
├── TypeScript                ├── Express
├── Vite                      ├── TypeScript
├── React Router              ├── Socket.IO (Real-time)
└── Socket.IO Client          ├── Prisma ORM
                              └── tsx (Dev Server)
```

## Architektur

### Datenbank-Schema (Prisma)

**games** - Spielsessions
- `id`, `name`, `status` (setup/running/paused/finished)
- `startedAt`, `endedAt` für Zeiterfassung

**teams** - Teilnehmende Teams
- `id`, `gameId`, `name`, `color` (hex), `orderIndex`
- Relation: Gehört zu einem Game

**zones** - Eroberbare Zonen
- `id`, `gameId`, `name`, `pin` (4-6 Ziffern für Station-Login), `orderIndex`
- Relation: Gehört zu einem Game

**zone_occupation_events** - Event-Sourcing für Zonenstatus
- `id`, `zoneId`, `teamId`, `action` (enter/leave), `timestamp`, `createdBy`
- **Wichtig**: Status wird NICHT gespeichert, sondern aus Events berechnet!
- Relation: Zone + Team

**band_captures** - Lebensbändel-Abgaben
- `id`, `gameId`, `capturingTeamId`, `capturedTeamId`, `points`, `timestamp`

**game_settings** - Spieleinstellungen
- `pointsPerSecond` (default: 1.0), `bandCapturePoints` (default: 10)

**band_stations** - Bändel-Station
- `id`, `gameId`, `name`, `pin`

### Backend-Routen

#### Games (`/api/games`)
```
GET    /                    - Alle Spiele
GET    /:id                 - Ein Spiel laden
POST   /                    - Spiel erstellen
PUT    /:id                 - Spiel aktualisieren
POST   /:id/start           - Spiel starten
POST   /:id/pause           - Spiel pausieren
POST   /:id/resume          - Spiel fortsetzen
POST   /:id/end             - Spiel beenden
POST   /:gameId/teams       - Team zum Spiel hinzufügen
POST   /:gameId/zones       - Zone zum Spiel hinzufügen
GET    /:gameId/scores      - Aktuelle Punktestände
GET    /:gameId/timeline    - Event-Timeline
```

#### Teams (`/api/teams`)
```
PUT    /:id                 - Team aktualisieren
DELETE /:id                 - Team löschen
```

#### Zones (`/api/zones`)
```
PUT    /:id                 - Zone aktualisieren
DELETE /:id                 - Zone löschen
```

#### Stations (`/api/stations`)
```
POST   /auth                      - Station mit PIN authentifizieren
POST   /zones/:zoneId/enter       - Team betritt Zone
POST   /zones/:zoneId/leave       - Team verlässt Zone
GET    /zones/:zoneId/status      - Aktueller Zonenstatus
POST   /bands/capture             - Bändel abgeben
POST   /bands/station             - Bändel-Station erstellen
```

### WebSocket-Events (Socket.IO)

**Client → Server**
```javascript
socket.emit('subscribe:game', gameId)  // Für Updates registrieren
```

**Server → Client**
```javascript
socket.emit('game:update', game)              // Spielstatus geändert
socket.emit('scores:update', {                // Punktestand Update (alle 1s)
  scores: TeamScore[],
  zoneStatuses: ZoneStatus[],
  timestamp: string
})
socket.emit('zone:update', { zoneId, event }) // Team enter/leave
socket.emit('band:captured', capture)         // Bändel abgegeben
```

### Punkteberechnung (Kritisch!)

**Location**: `backend/src/services/scoring.service.ts`

**Algorithmus** (Event-Sourcing):
1. Alle `zone_occupation_events` für eine Zone chronologisch laden
2. Für jedes Team einen Tracker erstellen: `{ enterTime, totalSeconds }`
3. Events durchgehen:
   - `enter`: `enterTime` setzen
   - `leave`: Zeit berechnen `(leaveTime - enterTime)`, zu `totalSeconds` addieren
4. Für Teams die NOCH in Zone sind: Aktuelle Zeit bis jetzt addieren
5. Punkte = `totalSeconds * pointsPerSecond`

**Background-Job**: Läuft alle 1 Sekunde für `status = 'running'` Games
- Berechnet aktuelle Scores
- Sendet via WebSocket an alle Clients die dieses Game subscribed haben
- **Wichtig**: Job startet 3 Sekunden nach Server-Start (damit DB ready ist)

## Frontend-Struktur

### Pages

**1. Admin-Interface** (`/admin`)
- **GameSetup.tsx**: Spiel konfigurieren (Setup-Phase)
  - Teams erstellen (Name + Farbe)
  - Zonen erstellen (Name + PIN)
  - Bändel-Station erstellen (Name + PIN)
  - "Spiel starten" Button

- **GameControl.tsx**: Spielsteuerung (Running/Paused/Finished)
  - Pause/Resume/Beenden Buttons
  - Live-Punktestände mit Breakdown (Zonen + Bändel)
  - Balkendiagramm
  - WebSocket-Integration für Real-time Updates

**2. Stations-Interface** (`/station`)
- **StationLogin.tsx**: PIN-Eingabe
  - Authentifiziert als Zone oder Bändel-Station

- **ZoneStation.tsx**: Für Mitarbeiter an Zonen
  - Große klickbare Team-Buttons
  - Toggle: Team in Zone / Team nicht in Zone
  - Sendet `zoneEnter`/`zoneLeave` Events
  - WebSocket für Live-Status

- **BandStationInterface.tsx**: Für Bändel-Station
  - Team auswählen das gefangen hat
  - Team auswählen das gefangen wurde
  - Submit → Punkte werden vergeben
  - Success-Animation

**3. Live-Dashboard** (`/dashboard`)
- Anzeige laufender/beendeter Spiele
- Echtzeit-Punktestände (Balkendiagramm)
- Zonen-Status (welche Teams in welcher Zone)
- **Fullscreen-Mode** für Beamer/TV
- WebSocket für automatische Updates

### Wichtige Hooks

**useWebSocket** (`hooks/useWebSocket.ts`)
```typescript
// Erstellt Socket-Verbindung und subscribed zu Game
const { socket, connected } = useWebSocket(gameId)

// Hook für Game-Updates mit Callback
useGameUpdates(gameId, (data) => {
  // Handle scores:update, zone:update, etc.
})
```

## Docker Setup

### Wichtige Details

**1. Backend Dockerfile**
- Alpine Linux mit OpenSSL installiert (für Prisma)
- `netcat-openbsd` für Healthcheck
- Entrypoint-Script wartet auf PostgreSQL
- Migrations werden automatisch ausgeführt

**2. Entrypoint-Script** (`backend/docker-entrypoint.sh`)
```bash
1. Warte auf PostgreSQL (netcat Port-Check)
2. Führe Prisma Migrations aus
3. Starte Anwendung
```

**3. docker-compose.yml**
- PostgreSQL mit persistentem Volume
- Backend depends_on postgres (mit healthcheck)
- Frontend depends_on backend
- Environment-Variablen aus `.env`

## Wichtige Implementierungsdetails

### 1. Punktevergabe-Regeln

**Volle Punkte für alle Teams**:
```typescript
// FALSCH (wurde NICHT so implementiert):
const pointsPerTeam = pointsPerSecond / teamsInZone.length

// RICHTIG (so ist es implementiert):
for (const team of teamsInZone) {
  teamPoints = totalSeconds * pointsPerSecond  // Jedes Team volle Punkte!
}
```

### 2. Zone bleibt bei letztem Team

Wenn alle Teams eine Zone verlassen, gehört sie dem letzten Team das gegangen ist.
**Implementierung**: Events werden chronologisch verarbeitet, Zone-Status ergibt sich daraus.

### 3. Pause-Funktion

Bei `status = 'paused'`:
- Punkteberechnung stoppt NICHT das Addieren von Zeit
- Aber Background-Job berechnet nur für `status = 'running'`
- **Wichtig**: Pause-Zeiten werden NICHT getrackt (könnte verbessert werden)

### 4. PIN-System

Jede Zone und die Bändel-Station haben eigene 4-6 stellige PINs:
- Frontend validiert Länge
- Backend authentifiziert via `/api/stations/auth`
- Gibt `type: 'zone' | 'band'` und Game-Daten zurück

## Häufige Probleme & Lösungen

### 1. "The table public.games does not exist"

**Ursache**: Migrations nicht ausgeführt oder DB nicht ready
**Lösung**:
```bash
sudo docker compose down
sudo docker volume rm battlefield_postgres_data
sudo docker compose up --build
```

### 2. "Error loading shared library libssl.so.1.1"

**Ursache**: OpenSSL fehlt in Alpine
**Lösung**: Im Dockerfile `apk add openssl openssl-dev`

### 3. Teams/Zonen können nicht erstellt werden

**Ursache**: API-Routen falsch gemappt
**Lösung**: Teams/Zonen-Erstellung ist unter Games-Routen:
- `POST /api/games/:gameId/teams`
- `POST /api/games/:gameId/zones`

### 4. WebSocket verbindet nicht

**Ursache**: CORS oder URL falsch
**Lösung**:
- Backend CORS auf Frontend-URL setzen
- Frontend `VITE_API_URL` richtig setzen

## Deployment

### Lokale Entwicklung

```bash
# Erste Installation
sudo docker compose up --build

# Logs anschauen
sudo docker compose logs -f backend
sudo docker compose logs -f frontend

# Neu starten nach Code-Änderungen
# (Hot Reload funktioniert, kein Neustart nötig)

# Datenbank zurücksetzen
sudo docker compose down
sudo docker volume rm battlefield_postgres_data
sudo docker compose up
```

### Produktion

Für Produktion anpassen:
1. `NODE_ENV=production` setzen
2. Frontend bauen und mit Nginx ausliefern
3. PostgreSQL mit starkem Passwort
4. HTTPS mit SSL-Zertifikat
5. Backend hinter Reverse Proxy

## Testing-Workflow

### Typischer Ablauf

1. **Admin**: Spiel erstellen
   - 3-4 Teams hinzufügen (mit Farben)
   - 3-5 Zonen hinzufügen (mit PINs, z.B. 1111, 2222, 3333)
   - Bändel-Station erstellen (PIN z.B. 9999)
   - Spiel starten

2. **Stations**: Mit PINs einloggen
   - Zone 1 (PIN 1111): Team Rot + Blau markieren
   - Zone 2 (PIN 2222): Team Grün markieren
   - Bändel-Station (PIN 9999): Rot fängt Blau

3. **Dashboard**: Fullscreen öffnen
   - Punktestand steigt automatisch
   - Zonen-Status live
   - Nach 30 Sekunden: Teams haben ~30 Punkte (Zone) + 10 Punkte (Bändel)

4. **Admin**: Spiel beenden
   - Punkte werden eingefroren
   - Endstand sichtbar

## Nächste Schritte / Verbesserungen

### Must-Have vor Einsatz
- [ ] Mobile Testing auf echten Tablets
- [ ] Offline-Handling (wenn Tablets Verbindung verlieren)
- [ ] Besseres Error-Handling im Frontend

### Nice-to-Have
- [ ] Pause-Zeiten tracken (aktuell werden sie ignoriert)
- [ ] Export als PDF statt nur CSV
- [ ] Historische Spiele archivieren
- [ ] Multi-Spiel Support (mehrere Spiele parallel)
- [ ] Sounds/Vibrationen bei Team-Wechsel

### Performance
- [ ] Datenbank-Indizes optimieren bei vielen Events
- [ ] WebSocket-Reconnect-Logik verbessern
- [ ] Caching für Punkteberechnungen

## API-Typen (TypeScript)

Alle Typen sind definiert in `frontend/src/types/index.ts`:

```typescript
enum GameStatus { SETUP, RUNNING, PAUSED, FINISHED }
enum OccupationAction { ENTER, LEAVE }

interface Game { id, name, status, teams, zones, settings, bandStation }
interface Team { id, gameId, name, color, orderIndex }
interface Zone { id, gameId, name, pin, orderIndex }
interface TeamScore { teamId, teamName, teamColor, zonePoints, bandPoints, totalPoints }
interface ZoneStatus { zoneId, zoneName, teamsInZone }
```

## Kontakt & Support

Bei Fragen oder Problemen:
1. Logs prüfen: `sudo docker compose logs`
2. Browser-Console öffnen (F12)
3. GitHub Issues erstellen

---

**Erstellt**: 2025-12-21
**Version**: 1.0.0
**Letzte Änderung**: Initial Release
