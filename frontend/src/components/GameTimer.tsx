import { useState, useEffect } from 'react'

interface GameTimerProps {
  gameId: string
  large?: boolean
}

interface TimerData {
  hasTimer: boolean
  remainingSeconds: number | null
  totalSeconds: number | null
  isExpired: boolean
}

function GameTimer({ gameId, large = false }: GameTimerProps) {
  const [timerData, setTimerData] = useState<TimerData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchTimer = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000'}/api/games/${gameId}/time`
      )
      const data = await response.json()
      setTimerData(data)
    } catch (error) {
      console.error('Error fetching timer:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTimer()
    // Update every second
    const interval = setInterval(fetchTimer, 1000)
    return () => clearInterval(interval)
  }, [gameId])

  if (loading) {
    return (
      <div style={{ color: '#888', fontSize: large ? '1.2em' : '1em' }}>
        Lade Timer...
      </div>
    )
  }

  if (!timerData || !timerData.hasTimer) {
    // Show "no timer set" message only in large mode (admin dashboard)
    if (large) {
      return (
        <div
          style={{
            padding: '20px',
            backgroundColor: '#2a2a2a',
            borderRadius: '8px',
            textAlign: 'center',
            color: '#888',
          }}
        >
          <div style={{ fontSize: '1em', marginBottom: '5px' }}>⏱️ Spieldauer</div>
          <div style={{ fontSize: '1.2em' }}>Keine Zeitbegrenzung gesetzt</div>
        </div>
      )
    }
    return null
  }

  const remainingSeconds = timerData.remainingSeconds || 0
  const totalSeconds = timerData.totalSeconds || 1

  // Format time as MM:SS or HH:MM:SS
  const formatTime = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = seconds % 60

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate percentage for progress bar
  const percentage = (remainingSeconds / totalSeconds) * 100

  // Determine color based on remaining time
  const getColor = () => {
    if (timerData.isExpired) return '#e74c3c'
    if (percentage < 10) return '#e74c3c' // Red
    if (percentage < 25) return '#f39c12' // Orange
    return '#2ecc71' // Green
  }

  const color = getColor()

  return (
    <div
      style={{
        padding: large ? '20px' : '15px',
        backgroundColor: '#2a2a2a',
        borderRadius: '8px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: '10px', color: '#888', fontSize: large ? '1em' : '0.9em' }}>
        {timerData.isExpired ? 'Zeit abgelaufen!' : 'Verbleibende Zeit'}
      </div>

      <div
        style={{
          fontSize: large ? '3em' : '2em',
          fontWeight: 'bold',
          color: color,
          fontFamily: 'monospace',
        }}
      >
        {formatTime(remainingSeconds)}
      </div>

      {/* Progress bar */}
      <div
        style={{
          marginTop: '15px',
          height: large ? '12px' : '8px',
          backgroundColor: '#0a0a0a',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${percentage}%`,
            backgroundColor: color,
            transition: 'width 0.3s, background-color 0.3s',
          }}
        />
      </div>

      {/* Expiration warning */}
      {timerData.isExpired && (
        <div
          style={{
            marginTop: '10px',
            padding: '10px',
            backgroundColor: '#e74c3c33',
            borderRadius: '4px',
            color: '#e74c3c',
            fontSize: large ? '1em' : '0.9em',
          }}
        >
          ⚠️ Die Spielzeit ist abgelaufen!
        </div>
      )}
    </div>
  )
}

export default GameTimer
