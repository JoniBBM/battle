import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Game, Zone, BandStation } from '../../types'
import ZoneStation from './ZoneStation'
import BandStationInterface from './BandStationInterface'

function StationPage() {
  const [pin, setPin] = useState('')
  const [loading, setLoading] = useState(false)
  const [station, setStation] = useState<{ type: 'zone' | 'band'; station: Zone | BandStation; game: Game } | null>(null)

  const handleLogin = async () => {
    if (!pin.trim()) return

    try {
      setLoading(true)
      const response = await api.authStation(pin)
      setStation(response)
    } catch (error) {
      console.error('Error authenticating:', error)
      alert('Ungültige PIN')
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    setStation(null)
    setPin('')
  }

  if (station) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <button onClick={handleLogout} style={{ backgroundColor: '#e74c3c', color: 'white' }}>
            Abmelden
          </button>
        </div>

        {station.type === 'zone' ? (
          <ZoneStation zone={station.station as Zone} game={station.game} />
        ) : (
          <BandStationInterface bandStation={station.station as BandStation} game={station.game} />
        )}
      </div>
    )
  }

  return (
    <div
      style={{
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',
      }}
    >
      <div style={{ marginBottom: '40px', textAlign: 'center' }}>
        <Link to="/">
          <button style={{ backgroundColor: '#555', color: 'white' }}>← Zurück</button>
        </Link>
      </div>

      <h1 style={{ marginBottom: '40px', fontSize: '3em' }}>Station Login</h1>

      <div
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
        }}
      >
        <input
          type="password"
          inputMode="numeric"
          placeholder="PIN eingeben"
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 6))}
          onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
          disabled={loading}
          style={{
            width: '100%',
            fontSize: '2em',
            textAlign: 'center',
            marginBottom: '20px',
          }}
        />

        <button
          onClick={handleLogin}
          disabled={!pin.trim() || loading}
          style={{
            width: '100%',
            backgroundColor: '#2ecc71',
            color: 'white',
            fontSize: '1.5em',
            padding: '20px',
            opacity: pin.trim() && !loading ? 1 : 0.5,
          }}
        >
          {loading ? 'Laden...' : 'Anmelden'}
        </button>
      </div>
    </div>
  )
}

export default StationPage
