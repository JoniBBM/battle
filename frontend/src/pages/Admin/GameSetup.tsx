import { useState } from 'react'
import { api } from '../../api/client'
import { Game } from '../../types'

interface GameSetupProps {
  game: Game
  onUpdate: () => void
}

// Farbmap: Deutsche Farbnamen -> Hex-Codes
const COLOR_MAP: Record<string, string> = {
  // Grundfarben
  'rot': '#FF0000',
  'rote': '#FF0000',
  'roter': '#FF0000',
  'roten': '#FF0000',
  'grün': '#00FF00',
  'grüne': '#00FF00',
  'grüner': '#00FF00',
  'grünen': '#00FF00',
  'blau': '#0000FF',
  'blaue': '#0000FF',
  'blauer': '#0000FF',
  'blauen': '#0000FF',
  'gelb': '#FFFF00',
  'gelbe': '#FFFF00',
  'gelber': '#FFFF00',
  'gelben': '#FFFF00',
  'orange': '#FF8800',
  'orangen': '#FF8800',

  // Lila/Violett/Rosa
  'lila': '#9B59B6',
  'violett': '#8B00FF',
  'violette': '#8B00FF',
  'rosa': '#FF69B4',
  'pink': '#FF1493',
  'magenta': '#FF00FF',

  // Schwarz/Weiß/Grau
  'schwarz': '#000000',
  'schwarze': '#000000',
  'schwarzer': '#000000',
  'schwarzen': '#000000',
  'weiß': '#FFFFFF',
  'weiss': '#FFFFFF',
  'weiße': '#FFFFFF',
  'weisse': '#FFFFFF',
  'grau': '#808080',
  'graue': '#808080',
  'grauer': '#808080',
  'grauen': '#808080',

  // Braun/Beige
  'braun': '#8B4513',
  'braune': '#8B4513',
  'brauner': '#8B4513',
  'braunen': '#8B4513',
  'beige': '#F5F5DC',

  // Cyan/Türkis
  'cyan': '#00FFFF',
  'türkis': '#40E0D0',
  'turkis': '#40E0D0',

  // Hellere Varianten
  'hellblau': '#87CEEB',
  'hellgrün': '#90EE90',
  'hellgrun': '#90EE90',
  'hellrot': '#FF6B6B',
  'hellgelb': '#FFFFE0',
  'hellgrau': '#D3D3D3',
  'hellrosa': '#FFB6C1',

  // Dunklere Varianten
  'dunkelblau': '#00008B',
  'dunkelgrün': '#006400',
  'dunkelgrun': '#006400',
  'dunkelrot': '#8B0000',
  'dunkelgelb': '#B8860B',
  'dunkelgrau': '#404040',
  'dunkellila': '#4B0082',

  // Metallic
  'gold': '#FFD700',
  'silber': '#C0C0C0',
  'bronze': '#CD7F32',

  // Sonstige
  'olive': '#808000',
  'oliv': '#808000',
  'khaki': '#F0E68C',
  'mint': '#98FF98',
  'limette': '#00FF00',
  'lime': '#00FF00',
  'koralle': '#FF7F50',
  'lachs': '#FA8072',
  'pfirsich': '#FFDAB9',
}

// Funktion zur automatischen Farberkennung
function detectColorFromName(name: string): string | null {
  const nameLower = name.toLowerCase()

  // Prüfe jede Farbe in der Map
  for (const [colorName, hexCode] of Object.entries(COLOR_MAP)) {
    if (nameLower.includes(colorName)) {
      return hexCode
    }
  }

  return null
}

function GameSetup({ game, onUpdate }: GameSetupProps) {
  const [newTeamName, setNewTeamName] = useState('')
  const [newTeamColor, setNewTeamColor] = useState('#FF0000')
  const [newZoneName, setNewZoneName] = useState('')
  const [newZonePin, setNewZonePin] = useState('')
  const [bandStationName, setBandStationName] = useState('Hauptstation')
  const [bandStationPin, setBandStationPin] = useState('')
  const [durationMinutes, setDurationMinutes] = useState(game.settings?.durationMinutes?.toString() || '')

  // Handler für Team-Name Änderung mit automatischer Farberkennung
  const handleTeamNameChange = (name: string) => {
    setNewTeamName(name)

    // Automatische Farberkennung
    const detectedColor = detectColorFromName(name)
    if (detectedColor) {
      setNewTeamColor(detectedColor)
    }
  }

  // Handler für Zonen-Name Änderung mit automatischer PIN-Generierung
  const handleZoneNameChange = (name: string) => {
    setNewZoneName(name)

    // Prüfe ob der Name nur aus 1-2 Ziffern besteht
    const trimmedName = name.trim()
    const numberMatch = trimmedName.match(/^(\d{1,2})$/)

    if (numberMatch) {
      const zoneNumber = numberMatch[1]
      const generatedPin = '1864' + zoneNumber
      setNewZonePin(generatedPin)
    }
  }

  const addTeam = async () => {
    if (!newTeamName.trim()) return

    // Prüfe ob Team-Name bereits existiert
    const teamExists = game.teams.some(
      team => team.name.toLowerCase() === newTeamName.trim().toLowerCase()
    )
    if (teamExists) {
      alert(`Team "${newTeamName}" existiert bereits!`)
      return
    }

    try {
      await api.createTeam(game.id, { name: newTeamName, color: newTeamColor })
      setNewTeamName('')
      setNewTeamColor(generateRandomColor())
      onUpdate()
    } catch (error) {
      console.error('Error adding team:', error)
      alert('Fehler beim Hinzufügen des Teams')
    }
  }

  const deleteTeam = async (teamId: string) => {
    if (!confirm('Team wirklich löschen?')) return

    try {
      await api.deleteTeam(teamId)
      onUpdate()
    } catch (error) {
      console.error('Error deleting team:', error)
      alert('Fehler beim Löschen des Teams')
    }
  }

  const addZone = async () => {
    if (!newZoneName.trim() || !newZonePin.trim()) return
    if (newZonePin.length < 4 || newZonePin.length > 6) {
      alert('PIN muss 4-6 Ziffern lang sein')
      return
    }

    // Prüfe ob Zonen-Name bereits existiert
    const zoneNameExists = game.zones.some(
      zone => zone.name.toLowerCase() === newZoneName.trim().toLowerCase()
    )
    if (zoneNameExists) {
      alert(`Zone "${newZoneName}" existiert bereits!`)
      return
    }

    // Prüfe ob PIN bereits verwendet wird
    const zonePinExists = game.zones.some(
      zone => zone.pin === newZonePin
    )
    if (zonePinExists) {
      alert(`PIN "${newZonePin}" wird bereits für eine andere Zone verwendet!`)
      return
    }

    try {
      await api.createZone(game.id, { name: newZoneName, pin: newZonePin })
      setNewZoneName('')
      setNewZonePin('')
      onUpdate()
    } catch (error) {
      console.error('Error adding zone:', error)
      alert('Fehler beim Hinzufügen der Zone')
    }
  }

  const deleteZone = async (zoneId: string) => {
    if (!confirm('Zone wirklich löschen?')) return

    try {
      await api.deleteZone(zoneId)
      onUpdate()
    } catch (error) {
      console.error('Error deleting zone:', error)
      alert('Fehler beim Löschen der Zone')
    }
  }

  const createBandStation = async () => {
    if (!bandStationName.trim() || !bandStationPin.trim()) return
    if (bandStationPin.length < 4 || bandStationPin.length > 6) {
      alert('PIN muss 4-6 Ziffern lang sein')
      return
    }

    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/stations/bands/station`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, name: bandStationName, pin: bandStationPin }),
      })
      setBandStationName('Hauptstation')
      setBandStationPin('')
      onUpdate()
    } catch (error) {
      console.error('Error creating band station:', error)
      alert('Fehler beim Erstellen der Bändel-Station')
    }
  }

  const saveDuration = async () => {
    const duration = parseInt(durationMinutes)
    if (isNaN(duration) || duration < 1) {
      alert('Bitte gültige Spieldauer in Minuten eingeben (min. 1)')
      return
    }

    try {
      await api.updateGame(game.id, { durationMinutes: duration })
      onUpdate()
      alert('Spieldauer gespeichert!')
    } catch (error) {
      console.error('Error saving duration:', error)
      alert('Fehler beim Speichern der Spieldauer')
    }
  }

  const startGame = async () => {
    if (game.teams.length < 2) {
      alert('Mindestens 2 Teams erforderlich!')
      return
    }
    if (game.zones.length < 1) {
      alert('Mindestens 1 Zone erforderlich!')
      return
    }
    if (!confirm('Spiel jetzt starten?')) return

    try {
      await api.startGame(game.id)
      onUpdate()
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Fehler beim Starten des Spiels')
    }
  }

  return (
    <div style={{ display: 'grid', gap: '30px' }}>
      {/* Teams */}
      <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Teams ({game.teams.length})</h2>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Team-Name (z.B. 'Grün', 'Team Blau', 'Die Roten')"
            value={newTeamName}
            onChange={(e) => handleTeamNameChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addTeam()}
            style={{ flex: 1 }}
          />
          <input
            type="color"
            value={newTeamColor}
            onChange={(e) => setNewTeamColor(e.target.value)}
            style={{ width: '60px' }}
          />
          <button
            onClick={addTeam}
            disabled={!newTeamName.trim()}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              opacity: newTeamName.trim() ? 1 : 0.5,
            }}
          >
            + Team
          </button>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {game.teams.length === 0 ? (
            <p style={{ color: '#888' }}>Noch keine Teams</p>
          ) : (
            game.teams.map((team) => (
              <div
                key={team.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                  borderLeft: `4px solid ${team.color}`,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div
                    style={{
                      width: '30px',
                      height: '30px',
                      backgroundColor: team.color,
                      borderRadius: '4px',
                    }}
                  />
                  <span style={{ fontWeight: 'bold' }}>{team.name}</span>
                </div>
                <button
                  onClick={() => deleteTeam(team.id)}
                  style={{ backgroundColor: '#e74c3c', color: 'white', padding: '8px 16px' }}
                >
                  Löschen
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Zones */}
      <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Zonen ({game.zones.length})</h2>

        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Zonen-Name (z.B. '1', '2', '10' für Auto-PIN)"
            value={newZoneName}
            onChange={(e) => handleZoneNameChange(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && addZone()}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            placeholder="PIN (4-6 Ziffern)"
            value={newZonePin}
            onChange={(e) => setNewZonePin(e.target.value.replace(/\D/g, '').slice(0, 6))}
            onKeyPress={(e) => e.key === 'Enter' && addZone()}
            style={{ width: '150px' }}
          />
          <button
            onClick={addZone}
            disabled={!newZoneName.trim() || !newZonePin.trim()}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              opacity: newZoneName.trim() && newZonePin.trim() ? 1 : 0.5,
            }}
          >
            + Zone
          </button>
        </div>

        <div style={{ display: 'grid', gap: '10px' }}>
          {game.zones.length === 0 ? (
            <p style={{ color: '#888' }}>Noch keine Zonen</p>
          ) : (
            game.zones.map((zone) => (
              <div
                key={zone.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '12px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '4px',
                }}
              >
                <div>
                  <span style={{ fontWeight: 'bold' }}>{zone.name}</span>
                  <span style={{ marginLeft: '12px', color: '#888' }}>PIN: {zone.pin}</span>
                </div>
                <button
                  onClick={() => deleteZone(zone.id)}
                  style={{ backgroundColor: '#e74c3c', color: 'white', padding: '8px 16px' }}
                >
                  Löschen
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Band Station */}
      <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Bändel-Station</h2>

        {game.bandStation ? (
          <div
            style={{
              padding: '12px',
              backgroundColor: '#1a1a1a',
              borderRadius: '4px',
            }}
          >
            <div>
              <span style={{ fontWeight: 'bold' }}>{game.bandStation.name}</span>
              <span style={{ marginLeft: '12px', color: '#888' }}>PIN: {game.bandStation.pin}</span>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              placeholder="Stations-Name"
              value={bandStationName}
              onChange={(e) => setBandStationName(e.target.value)}
              style={{ flex: 1 }}
            />
            <input
              type="text"
              placeholder="PIN (4-6 Ziffern)"
              value={bandStationPin}
              onChange={(e) => setBandStationPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
              style={{ width: '150px' }}
            />
            <button
              onClick={createBandStation}
              disabled={!bandStationName.trim() || !bandStationPin.trim()}
              style={{
                backgroundColor: '#9b59b6',
                color: 'white',
                opacity: bandStationName.trim() && bandStationPin.trim() ? 1 : 0.5,
              }}
            >
              Erstellen
            </button>
          </div>
        )}
      </div>

      {/* Game Duration */}
      <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Spieldauer</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <input
            type="number"
            placeholder="Dauer in Minuten (optional)"
            value={durationMinutes}
            onChange={(e) => setDurationMinutes(e.target.value)}
            min="1"
            style={{ flex: 1, maxWidth: '300px' }}
          />
          <button
            onClick={saveDuration}
            disabled={!durationMinutes.trim()}
            style={{
              backgroundColor: '#3498db',
              color: 'white',
              opacity: durationMinutes.trim() ? 1 : 0.5,
            }}
          >
            Speichern
          </button>
          {game.settings?.durationMinutes && (
            <span style={{ color: '#2ecc71', marginLeft: '10px' }}>
              ✓ {game.settings.durationMinutes} Minuten
            </span>
          )}
        </div>
        <p style={{ color: '#888', fontSize: '0.9em', marginTop: '10px' }}>
          Optional: Legen Sie eine Spieldauer fest, um einen Countdown-Timer zu aktivieren.
        </p>
      </div>

      {/* Start Game Button */}
      <div style={{ textAlign: 'center', paddingTop: '20px' }}>
        <button
          onClick={startGame}
          style={{
            backgroundColor: '#2ecc71',
            color: 'white',
            fontSize: '1.5em',
            padding: '20px 60px',
          }}
        >
          Spiel starten
        </button>
      </div>
    </div>
  )
}

function generateRandomColor(): string {
  const colors = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#800080']
  return colors[Math.floor(Math.random() * colors.length)]
}

export default GameSetup
