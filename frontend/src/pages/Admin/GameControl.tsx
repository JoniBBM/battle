import { useState, useEffect, useCallback } from 'react'
import { api } from '../../api/client'
import { Game, GameStatus, TeamScore } from '../../types'
import { useGameUpdates } from '../../hooks/useWebSocket'
import GameTimer from '../../components/GameTimer'

interface GameControlProps {
  game: Game
  onUpdate: () => void
}

function GameControl({ game, onUpdate }: GameControlProps) {
  const [scores, setScores] = useState<TeamScore[]>([])
  const [loading, setLoading] = useState(true)

  // Funktion für WebSocket-Updates (OHNE loading State)
  const updateScores = useCallback(async () => {
    try {
      const data = await api.getScores(game.id)
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    }
  }, [game.id])

  // WebSocket-Updates verwenden updateScores (ohne loading)
  useGameUpdates(game.id, updateScores)

  // Initial load (mit loading State)
  useEffect(() => {
    const initialLoad = async () => {
      try {
        setLoading(true)
        const data = await api.getScores(game.id)
        setScores(data)
      } catch (error) {
        console.error('Error loading scores:', error)
      } finally {
        setLoading(false)
      }
    }
    initialLoad()
  }, [game.id])

  const pauseGame = async () => {
    try {
      await api.pauseGame(game.id)
      onUpdate()
    } catch (error) {
      console.error('Error pausing game:', error)
    }
  }

  const resumeGame = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/games/${game.id}/resume`, {
        method: 'POST',
      })
      onUpdate()
    } catch (error) {
      console.error('Error resuming game:', error)
    }
  }

  const endGame = async () => {
    if (!confirm('Spiel wirklich beenden?')) return

    try {
      await api.endGame(game.id)
      onUpdate()
    } catch (error) {
      console.error('Error ending game:', error)
    }
  }

  const sortedScores = [...scores].sort((a, b) => b.totalPoints - a.totalPoints)
  const maxPoints = Math.max(...scores.map((s) => s.totalPoints), 1)

  return (
    <div style={{ display: 'grid', gap: '30px' }}>
      {/* Game Timer */}
      <GameTimer gameId={game.id} large={true} />

      {/* Control Buttons */}
      <div
        style={{
          padding: '20px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
          display: 'flex',
          gap: '10px',
          justifyContent: 'center',
        }}
      >
        {game.status === GameStatus.RUNNING && (
          <button
            onClick={pauseGame}
            style={{ backgroundColor: '#f39c12', color: 'white', fontSize: '1.2em', padding: '15px 40px' }}
          >
            ⏸ Pausieren
          </button>
        )}
        {game.status === GameStatus.PAUSED && (
          <button
            onClick={resumeGame}
            style={{ backgroundColor: '#2ecc71', color: 'white', fontSize: '1.2em', padding: '15px 40px' }}
          >
            ▶ Fortsetzen
          </button>
        )}
        <button
          onClick={endGame}
          style={{ backgroundColor: '#e74c3c', color: 'white', fontSize: '1.2em', padding: '15px 40px' }}
        >
          ⏹ Beenden
        </button>
        <button
          onClick={updateScores}
          style={{ backgroundColor: '#3498db', color: 'white', fontSize: '1.2em', padding: '15px 40px' }}
        >
          🔄 Aktualisieren
        </button>
      </div>

      {/* Scores */}
      <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h2 style={{ marginBottom: '20px' }}>Punktestand</h2>

        {loading ? (
          <p style={{ color: '#888' }}>Laden...</p>
        ) : scores.length === 0 ? (
          <p style={{ color: '#888' }}>Keine Daten</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {sortedScores.map((score, index) => (
              <div
                key={score.teamId}
                style={{
                  padding: '20px',
                  backgroundColor: '#1a1a1a',
                  borderRadius: '8px',
                  borderLeft: `6px solid ${score.teamColor}`,
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <span style={{ fontSize: '2em', fontWeight: 'bold', color: '#888', width: '40px' }}>
                      #{index + 1}
                    </span>
                    <div
                      style={{
                        width: '40px',
                        height: '40px',
                        backgroundColor: score.teamColor,
                        borderRadius: '4px',
                      }}
                    />
                    <span style={{ fontSize: '1.5em', fontWeight: 'bold' }}>{score.teamName}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                      {score.totalPoints.toFixed(1)}
                    </div>
                    <div style={{ fontSize: '0.9em', color: '#888' }}>Punkte</div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ height: '30px', backgroundColor: '#0a0a0a', borderRadius: '4px', overflow: 'hidden', marginBottom: '10px' }}>
                  <div
                    style={{
                      height: '100%',
                      width: `${(score.totalPoints / maxPoints) * 100}%`,
                      backgroundColor: score.teamColor,
                      transition: 'width 0.3s',
                    }}
                  />
                </div>

                {/* Point breakdown */}
                <div style={{ display: 'flex', gap: '20px', fontSize: '0.9em', color: '#888' }}>
                  <div>
                    Zonen: <span style={{ color: '#fff' }}>{score.zonePoints.toFixed(1)}</span>
                  </div>
                  <div>
                    Bändel: <span style={{ color: '#fff' }}>{score.bandPoints}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Game Info */}
      <div style={{ padding: '20px', backgroundColor: '#2a2a2a', borderRadius: '8px' }}>
        <h3 style={{ marginBottom: '15px' }}>Spiel-Informationen</h3>
        <div style={{ display: 'grid', gap: '8px', color: '#888' }}>
          <div>
            <strong>Status:</strong> {game.status}
          </div>
          <div>
            <strong>Gestartet:</strong> {game.startedAt ? new Date(game.startedAt).toLocaleString('de-DE') : '-'}
          </div>
          {game.endedAt && (
            <div>
              <strong>Beendet:</strong> {new Date(game.endedAt).toLocaleString('de-DE')}
            </div>
          )}
          <div>
            <strong>Teams:</strong> {game.teams.length}
          </div>
          <div>
            <strong>Zonen:</strong> {game.zones.length}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GameControl
