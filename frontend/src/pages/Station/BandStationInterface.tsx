import { useState } from 'react'
import { api } from '../../api/client'
import { Game, BandStation } from '../../types'
import { useGameUpdates } from '../../hooks/useWebSocket'
import GameTimer from '../../components/GameTimer'

interface BandStationInterfaceProps {
  bandStation: BandStation
  game: Game
}

function BandStationInterface({ bandStation, game: initialGame }: BandStationInterfaceProps) {
  const [game, setGame] = useState<Game>(initialGame)
  const [capturingTeamId, setCapturingTeamId] = useState('')
  const [capturedTeamId, setCapturedTeamId] = useState('')
  const [success, setSuccess] = useState(false)

  useGameUpdates(game.id, (data) => {
    // Update entire game object when game:update event is received
    if (data.id && data.status) {
      setGame(data)
    }
  })

  const handleSubmit = async () => {
    if (!capturingTeamId || !capturedTeamId) {
      alert('Bitte beide Teams auswählen')
      return
    }

    if (capturingTeamId === capturedTeamId) {
      alert('Ein Team kann sich nicht selbst fangen!')
      return
    }

    try {
      await api.captureBand({
        gameId: game.id,
        capturingTeamId,
        capturedTeamId,
        stationName: bandStation.name,
      })

      // Show success animation
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setCapturingTeamId('')
        setCapturedTeamId('')
      }, 2000)
    } catch (error) {
      console.error('Error capturing band:', error)
      alert('Fehler beim Erfassen der Bändel-Abgabe')
    }
  }

  if (success) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            fontSize: '8em',
            marginBottom: '20px',
            animation: 'bounce 0.6s',
          }}
        >
          ✓
        </div>
        <h2 style={{ fontSize: '3em', color: '#2ecc71' }}>Erfasst!</h2>
        <style>{`
          @keyframes bounce {
            0%, 100% { transform: translateY(0); }
            50% { transform: translateY(-30px); }
          }
        `}</style>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      {/* PAUSE Overlay */}
      {game.status === 'paused' && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            backdropFilter: 'blur(8px)',
          }}
        >
          <div
            style={{
              textAlign: 'center',
              animation: 'pulse 2s ease-in-out infinite',
            }}
          >
            <div
              style={{
                fontSize: '12em',
                fontWeight: 'bold',
                color: '#e74c3c',
                textShadow: '0 0 30px rgba(231, 76, 60, 0.5)',
                marginBottom: '20px',
              }}
            >
              ⏸
            </div>
            <div
              style={{
                fontSize: '4em',
                fontWeight: 'bold',
                color: '#e74c3c',
                textTransform: 'uppercase',
                letterSpacing: '10px',
              }}
            >
              PAUSE
            </div>
          </div>
          <style>{`
            @keyframes pulse {
              0%, 100% { opacity: 1; transform: scale(1); }
              50% { opacity: 0.7; transform: scale(1.05); }
            }
          `}</style>
        </div>
      )}

      <h1 style={{ marginBottom: '10px', fontSize: '3em' }}>{bandStation.name}</h1>
      <p style={{ color: '#888', fontSize: '1.2em', marginBottom: '20px' }}>
        {game.name} • Bändel-Abgabe
      </p>

      <div style={{ marginBottom: '30px' }}>
        <GameTimer gameId={game.id} />
      </div>

      <div style={{ display: 'grid', gap: '40px' }}>
        {/* Capturing Team */}
        <div>
          <h2 style={{ marginBottom: '20px', color: '#2ecc71' }}>Team das gefangen hat:</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
            }}
          >
            {game.teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setCapturingTeamId(team.id)}
                style={{
                  padding: '30px 20px',
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  backgroundColor: capturingTeamId === team.id ? team.color : '#2a2a2a',
                  color: capturingTeamId === team.id ? '#fff' : team.color,
                  border: `3px solid ${team.color}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: capturingTeamId === team.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {capturingTeamId === team.id && <div style={{ marginBottom: '8px' }}>✓</div>}
                {team.name}
              </button>
            ))}
          </div>
        </div>

        {/* Captured Team */}
        <div>
          <h2 style={{ marginBottom: '20px', color: '#e74c3c' }}>Team das gefangen wurde:</h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: '15px',
            }}
          >
            {game.teams.map((team) => (
              <button
                key={team.id}
                onClick={() => setCapturedTeamId(team.id)}
                style={{
                  padding: '30px 20px',
                  fontSize: '1.3em',
                  fontWeight: 'bold',
                  backgroundColor: capturedTeamId === team.id ? team.color : '#2a2a2a',
                  color: capturedTeamId === team.id ? '#fff' : team.color,
                  border: `3px solid ${team.color}`,
                  borderRadius: '12px',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  transform: capturedTeamId === team.id ? 'scale(1.05)' : 'scale(1)',
                }}
              >
                {capturedTeamId === team.id && <div style={{ marginBottom: '8px' }}>✓</div>}
                {team.name}
              </button>
            ))}
          </div>
        </div>

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={!capturingTeamId || !capturedTeamId}
          style={{
            padding: '30px',
            fontSize: '2em',
            fontWeight: 'bold',
            backgroundColor: capturingTeamId && capturedTeamId ? '#2ecc71' : '#555',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: capturingTeamId && capturedTeamId ? 'pointer' : 'not-allowed',
            opacity: capturingTeamId && capturedTeamId ? 1 : 0.5,
          }}
        >
          Bändel erfassen
        </button>
      </div>
    </div>
  )
}

export default BandStationInterface
