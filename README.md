# Battlefield Geländespiel

Ein Echtzeit-Punktesystem für ein Capture-the-Flag Geländespiel mit 60 Teilnehmern.

> **📖 Für Entwickler**: Siehe [DEVELOPMENT.md](./DEVELOPMENT.md) für detaillierte technische Dokumentation, Architektur und Implementierungsdetails.

## Features

- Flexibel konfigurierbare Teams und Zonen
- Echtzeit-Punkteberechnung
- Lebensbändel-System
- Live-Dashboard für Zuschauer
- Admin-Interface für Spielkonfiguration
- Stations-Interface für Mitarbeiter vor Ort

## Tech-Stack

- **Backend**: Node.js + Express + TypeScript + Socket.IO
- **Frontend**: React + TypeScript + Vite
- **Datenbank**: PostgreSQL
- **Containerisierung**: Docker + Docker Compose

## Schnellstart

### Voraussetzungen

- Docker und Docker Compose installiert
- Node.js 20+ (optional, für lokale Entwicklung)

### Installation und Start

1. Repository klonen und ins Verzeichnis wechseln:
```bash
cd battlefield
```

2. Umgebungsvariablen konfigurieren:
```bash
# .env ist bereits erstellt, kann bei Bedarf angepasst werden
cat .env
```

3. Docker Container starten:
```bash
docker-compose up --build
```

4. Beim ersten Start: Datenbank migrieren:
```bash
# In einem neuen Terminal
docker exec -it battlefield-backend npx prisma migrate dev --name init
```

5. Anwendung öffnen:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **Datenbank**: localhost:5432

## Entwicklung

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Datenbank-Migrationen

```bash
cd backend
npx prisma migrate dev --name migration_name
npx prisma studio  # Datenbank-Browser öffnen
```

## Projektstruktur

```
battlefield/
├── backend/
│   ├── src/
│   │   ├── index.ts          # Express + Socket.IO Server
│   │   ├── routes/           # API Routes
│   │   ├── services/         # Business Logic
│   │   └── jobs/             # Background Jobs
│   ├── prisma/
│   │   └── schema.prisma     # Datenbank-Schema
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/           # React Pages
│   │   ├── components/      # React Components
│   │   ├── hooks/           # Custom Hooks
│   │   └── api/             # API Client
│   └── Dockerfile
└── docker-compose.yml
```

## Spielmechanik

### Zonen-Eroberung
- Teams erobern Zonen durch Anwesenheit
- Mehrere Teams können gleichzeitig in einer Zone sein
- Jedes Team bekommt volle Punkte (1 Punkt/Sekunde pro Team)
- Zone bleibt beim letzten Team wenn alle gehen

### Lebensbändel
- Gefangene Bändel können an der Bändel-Station abgegeben werden
- Konfigurierbare Punkte pro Bändel (Standard: 10 Punkte)

## Interfaces

### 1. Admin-Interface (`/admin`)
- Spiel erstellen und konfigurieren
- Teams und Zonen verwalten
- Spiel starten/pausieren/beenden
- Auswertung und Export

### 2. Stations-Interface (`/station`)
- PIN-Login für Mitarbeiter
- Zonen-Station: Teams an-/abwählen
- Bändel-Station: Bändel-Abgaben erfassen

### 3. Live-Dashboard (`/dashboard`)
- Echtzeit-Punktestände
- Zonenstatus-Übersicht
- Fullscreen-Mode für Beamer

## API-Endpunkte

### Games
- `POST /api/games` - Neues Spiel erstellen
- `GET /api/games/:id` - Spiel laden
- `POST /api/games/:id/start` - Spiel starten
- `POST /api/games/:id/pause` - Spiel pausieren
- `POST /api/games/:id/end` - Spiel beenden

### Teams & Zones
- `POST /api/games/:id/teams` - Team hinzufügen
- `POST /api/games/:id/zones` - Zone hinzufügen

### Stations
- `POST /api/stations/auth` - Station authentifizieren
- `POST /api/zones/:id/enter` - Team betritt Zone
- `POST /api/zones/:id/leave` - Team verlässt Zone
- `POST /api/bands/capture` - Bändel abgeben

### Scores
- `GET /api/games/:id/scores` - Aktuelle Punktestände
- `GET /api/games/:id/timeline` - Event-Timeline

## WebSocket-Events

```javascript
// Client subscribes to game updates
socket.emit('subscribe:game', gameId)

// Server sends updates
socket.on('game:update', (data) => {})
socket.on('scores:update', (data) => {})
socket.on('zone:update', (data) => {})
socket.on('band:captured', (data) => {})
```

## Lizenz

MIT
