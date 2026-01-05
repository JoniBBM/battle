import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../../api/client'
import { Game, GameStatus, TeamScore, ZoneStatus } from '../../types'
import { useGameUpdates } from '../../hooks/useWebSocket'

function DashboardPage() {
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [scores, setScores] = useState<TeamScore[]>([])
  const [zoneStatuses, setZoneStatuses] = useState<ZoneStatus[]>([])
  const [fullscreen, setFullscreen] = useState(false)

  useEffect(() => {
    loadGames()
  }, [])

  const handleGameUpdate = useCallback((data: any) => {
    if (data.scores) {
      setScores(data.scores)
      setZoneStatuses(data.zoneStatuses || [])
    }
  }, [])

  useGameUpdates(selectedGame?.id, handleGameUpdate)

  useEffect(() => {
    if (selectedGame) {
      loadScores()
      // Kein setInterval! WebSocket übernimmt Updates
    }
  }, [selectedGame])

  const loadGames = async () => {
    try {
      const data = await api.getGames()
      const runningOrFinished = data.filter(
        (g: Game) => g.status === GameStatus.RUNNING || g.status === GameStatus.PAUSED || g.status === GameStatus.FINISHED
      )
      setGames(runningOrFinished)
      if (runningOrFinished.length > 0 && !selectedGame) {
        setSelectedGame(runningOrFinished[0])
      }
    } catch (error) {
      console.error('Error loading games:', error)
    }
  }

  const loadScores = async () => {
    if (!selectedGame) return

    try {
      const data = await api.getScores(selectedGame.id)
      setScores(data)
    } catch (error) {
      console.error('Error loading scores:', error)
    }
  }

  const toggleFullscreen = () => {
    if (!fullscreen) {
      document.documentElement.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
    setFullscreen(!fullscreen)
  }

  if (!selectedGame) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <Link to="/">
            <button style={{ backgroundColor: '#555', color: 'white' }}>← Zurück</button>
          </Link>
        </div>
        <h1 style={{ marginBottom: '30px' }}>Live Dashboard</h1>
        <p style={{ color: '#888' }}>Keine laufenden Spiele gefunden</p>
      </div>
    )
  }

  const sortedScores = [...scores].sort((a, b) => b.totalPoints - a.totalPoints)
  const maxPoints = Math.max(...scores.map((s) => s.totalPoints), 1)

  return (
    <div style={{ padding: fullscreen ? '40px' : '20px', backgroundColor: '#1a1a1a', minHeight: '100vh' }}>
      {!fullscreen && (
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <Link to="/">
            <button style={{ backgroundColor: '#555', color: 'white' }}>← Zurück</button>
          </Link>
          {games.length > 1 && (
            <select
              value={selectedGame.id}
              onChange={(e) => {
                const game = games.find((g) => g.id === e.target.value)
                if (game) setSelectedGame(game)
              }}
              style={{
                padding: '12px',
                fontSize: '16px',
                backgroundColor: '#2a2a2a',
                color: 'white',
                border: '2px solid #444',
                borderRadius: '8px',
              }}
            >
              {games.map((game) => (
                <option key={game.id} value={game.id}>
                  {game.name}
                </option>
              ))}
            </select>
          )}
          <button onClick={toggleFullscreen} style={{ backgroundColor: '#3498db', color: 'white' }}>
            Vollbild
          </button>
        </div>
      )}

      {fullscreen && (
        <button
          onClick={toggleFullscreen}
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#555',
            color: 'white',
            padding: '10px 20px',
            zIndex: 1000,
          }}
        >
          Vollbild beenden
        </button>
      )}

      <div style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: fullscreen ? '4em' : '3em', marginBottom: '10px' }}>{selectedGame.name}</h1>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '20px' }}>
          <span
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              backgroundColor:
                selectedGame.status === GameStatus.RUNNING
                  ? '#2ecc71'
                  : selectedGame.status === GameStatus.PAUSED
                  ? '#f39c12'
                  : '#e74c3c',
              fontSize: fullscreen ? '1.5em' : '1.2em',
            }}
          >
            {selectedGame.status === GameStatus.RUNNING
              ? 'LÄUFT'
              : selectedGame.status === GameStatus.PAUSED
              ? 'PAUSIERT'
              : 'BEENDET'}
          </span>
        </div>
      </div>

      {/* Scores */}
      <div style={{ marginBottom: '40px' }}>
        <h2
          style={{
            fontSize: fullscreen ? '2.5em' : '2em',
            marginBottom: '30px',
            textAlign: 'center',
          }}
        >
          Punktestand
        </h2>
        <div style={{ display: 'grid', gap: fullscreen ? '30px' : '20px' }}>
          {sortedScores.map((score, index) => (
            <div
              key={score.teamId}
              style={{
                padding: fullscreen ? '40px' : '30px',
                backgroundColor: '#2a2a2a',
                borderRadius: '12px',
                borderLeft: `8px solid ${score.teamColor}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                  <span
                    style={{
                      fontSize: fullscreen ? '4em' : '3em',
                      fontWeight: 'bold',
                      color: '#888',
                      width: fullscreen ? '100px' : '60px',
                    }}
                  >
                    #{index + 1}
                  </span>
                  <div
                    style={{
                      width: fullscreen ? '80px' : '60px',
                      height: fullscreen ? '80px' : '60px',
                      backgroundColor: score.teamColor,
                      borderRadius: '8px',
                    }}
                  />
                  <span style={{ fontSize: fullscreen ? '3em' : '2em', fontWeight: 'bold' }}>
                    {score.teamName}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: fullscreen ? '4em' : '3em', fontWeight: 'bold' }}>
                    {score.totalPoints.toFixed(1)}
                  </div>
                  <div style={{ fontSize: fullscreen ? '1.2em' : '1em', color: '#888' }}>Punkte</div>
                </div>
              </div>

              {/* Progress bar */}
              <div
                style={{
                  height: fullscreen ? '40px' : '30px',
                  backgroundColor: '#0a0a0a',
                  borderRadius: '8px',
                  overflow: 'hidden',
                  marginBottom: '15px',
                }}
              >
                <div
                  style={{
                    height: '100%',
                    width: `${(score.totalPoints / maxPoints) * 100}%`,
                    backgroundColor: score.teamColor,
                    transition: 'width 0.5s ease',
                  }}
                />
              </div>

              {/* Breakdown */}
              <div
                style={{
                  display: 'flex',
                  gap: '40px',
                  fontSize: fullscreen ? '1.3em' : '1em',
                  color: '#888',
                }}
              >
                <div>
                  Zonen: <span style={{ color: '#fff', fontWeight: 'bold' }}>{score.zonePoints.toFixed(1)}</span>
                </div>
                <div>
                  Bändel: <span style={{ color: '#fff', fontWeight: 'bold' }}>{score.bandPoints}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Zone Status */}
      {zoneStatuses.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: fullscreen ? '2.5em' : '2em',
              marginBottom: '30px',
              textAlign: 'center',
            }}
          >
            Zonen-Status
          </h2>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: fullscreen
                ? 'repeat(auto-fit, minmax(300px, 1fr))'
                : 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '20px',
            }}
          >
            {selectedGame.zones.map((zone) => {
              const status = zoneStatuses.find((z) => z.zoneId === zone.id)
              const teamsInZone = status?.teamsInZone || []

              return (
                <div
                  key={zone.id}
                  style={{
                    padding: fullscreen ? '30px' : '20px',
                    backgroundColor: '#2a2a2a',
                    borderRadius: '12px',
                    textAlign: 'center',
                  }}
                >
                  <h3 style={{ fontSize: fullscreen ? '2em' : '1.5em', marginBottom: '15px' }}>
                    {zone.name}
                  </h3>
                  {teamsInZone.length === 0 ? (
                    <div style={{ color: '#555', fontSize: fullscreen ? '1.2em' : '1em' }}>Leer</div>
                  ) : (
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
                      {teamsInZone.map((teamId) => {
                        const team = selectedGame.teams.find((t) => t.id === teamId)
                        if (!team) return null
                        return (
                          <div
                            key={teamId}
                            style={{
                              padding: '8px 16px',
                              backgroundColor: team.color,
                              borderRadius: '6px',
                              fontWeight: 'bold',
                              fontSize: fullscreen ? '1.2em' : '0.9em',
                            }}
                          >
                            {team.name}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage
