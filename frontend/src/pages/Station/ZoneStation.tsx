import { useState, useEffect } from 'react'
import { api } from '../../api/client'
import { Game, Zone, Team } from '../../types'
import { useGameUpdates } from '../../hooks/useWebSocket'
import GameTimer from '../../components/GameTimer'

interface ZoneStationProps {
  zone: Zone
  game: Game
}

function ZoneStation({ zone, game: initialGame }: ZoneStationProps) {
  const [game, setGame] = useState<Game>(initialGame)
  const [teamsInZone, setTeamsInZone] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)

  useGameUpdates(game.id, (data) => {
    if (data.zoneId === zone.id) {
      loadZoneStatus()
    }
    // Update entire game object when game:update event is received
    if (data.id && data.status) {
      setGame(data)
    }
  })

  useEffect(() => {
    loadZoneStatus()
  }, [zone.id])

  const loadZoneStatus = async () => {
    try {
      setLoading(true)
      const response = await api.getZoneStatus(zone.id)
      setTeamsInZone(new Set(response.teamsInZone))
    } catch (error) {
      console.error('Error loading zone status:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleTeam = async (teamId: string) => {
    const isInZone = teamsInZone.has(teamId)

    try {
      if (isInZone) {
        await api.zoneLeave(zone.id, teamId, 'Station')
      } else {
        await api.zoneEnter(zone.id, teamId, 'Station')
      }

      // Optimistic update
      const newTeams = new Set(teamsInZone)
      if (isInZone) {
        newTeams.delete(teamId)
      } else {
        newTeams.add(teamId)
      }
      setTeamsInZone(newTeams)
    } catch (error) {
      console.error('Error toggling team:', error)
      alert('Fehler beim Aktualisieren')
      loadZoneStatus()
    }
  }

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '40px' }}>
        <h2>Laden...</h2>
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

      <h1 style={{ marginBottom: '10px', fontSize: '3em' }}>{zone.name}</h1>
      <p style={{ color: '#888', fontSize: '1.2em', marginBottom: '20px' }}>
        {game.name}
      </p>

      <div style={{ marginBottom: '30px' }}>
        <GameTimer gameId={game.id} />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '20px',
        }}
      >
        {game.teams.map((team) => {
          const isInZone = teamsInZone.has(team.id)

          return (
            <button
              key={team.id}
              onClick={() => toggleTeam(team.id)}
              style={{
                padding: '40px 20px',
                fontSize: '1.5em',
                fontWeight: 'bold',
                backgroundColor: isInZone ? team.color : '#2a2a2a',
                color: isInZone ? '#fff' : team.color,
                border: `3px solid ${team.color}`,
                borderRadius: '12px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                transform: isInZone ? 'scale(1.05)' : 'scale(1)',
                boxShadow: isInZone ? `0 8px 20px ${team.color}40` : 'none',
              }}
            >
              <div style={{ marginBottom: '10px' }}>
                {isInZone ? '✓' : '○'}
              </div>
              {team.name}
            </button>
          )
        })}
      </div>

      {teamsInZone.size > 0 && (
        <div
          style={{
            marginTop: '40px',
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            textAlign: 'center',
          }}
        >
          <h3 style={{ marginBottom: '10px' }}>Teams in Zone</h3>
          <div style={{ fontSize: '1.2em' }}>
            {game.teams
              .filter((t) => teamsInZone.has(t.id))
              .map((t) => t.name)
              .join(', ')}
          </div>
        </div>
      )}
    </div>
  )
}

export default ZoneStation
