import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api, authApi } from '../../api/client'
import { Game, GameStatus } from '../../types'
import GameSetup from './GameSetup'
import GameControl from './GameControl'

function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [loginError, setLoginError] = useState('')
  const [games, setGames] = useState<Game[]>([])
  const [selectedGame, setSelectedGame] = useState<Game | null>(null)
  const [loading, setLoading] = useState(true)
  const [newGameName, setNewGameName] = useState('')

  // Check authentication on mount
  useEffect(() => {
    const checkAuth = async () => {
      const isValid = await authApi.verifyToken()
      setIsAuthenticated(isValid)
      if (isValid) {
        loadGames()
      } else {
        setLoading(false)
      }
    }
    checkAuth()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoginError('')

    try {
      const result = await authApi.login(password)
      if (result.success) {
        setIsAuthenticated(true)
        setPassword('')
        loadGames()
      } else {
        setLoginError('Falsches Passwort')
      }
    } catch (error) {
      setLoginError('Login fehlgeschlagen')
      console.error('Login error:', error)
    }
  }

  const handleLogout = () => {
    authApi.logout()
    setIsAuthenticated(false)
    setSelectedGame(null)
    setGames([])
  }

  const loadGames = async () => {
    try {
      setLoading(true)
      const data = await api.getGames()
      setGames(data)
    } catch (error) {
      console.error('Error loading games:', error)
    } finally {
      setLoading(false)
    }
  }

  const createGame = async () => {
    if (!newGameName.trim()) return

    try {
      const game = await api.createGame({ name: newGameName })
      setGames([game, ...games])
      setSelectedGame(game)
      setNewGameName('')
    } catch (error) {
      console.error('Error creating game:', error)
      alert('Fehler beim Erstellen des Spiels')
    }
  }

  const selectGame = async (gameId: string) => {
    try {
      const game = await api.getGame(gameId)
      setSelectedGame(game)
    } catch (error) {
      console.error('Error loading game:', error)
    }
  }

  const deleteGame = async (gameId: string, gameName: string) => {
    if (!confirm(`Spiel "${gameName}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden!`)) {
      return
    }

    try {
      await api.deleteGame(gameId)
      setGames(games.filter(g => g.id !== gameId))
      if (selectedGame?.id === gameId) {
        setSelectedGame(null)
      }
      alert('Spiel erfolgreich gelöscht')
    } catch (error) {
      console.error('Error deleting game:', error)
      alert('Fehler beim Löschen des Spiels')
    }
  }

  const refreshGame = async () => {
    if (selectedGame) {
      await selectGame(selectedGame.id)
    }
  }

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#1a1a1a'
      }}>
        <div style={{
          width: '100%',
          maxWidth: '400px',
          padding: '40px',
          backgroundColor: '#2a2a2a',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
        }}>
          <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>
            Admin Login
          </h1>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#ccc' }}>
                Passwort
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Passwort eingeben"
                style={{
                  width: '100%',
                  padding: '12px',
                  fontSize: '16px',
                  backgroundColor: '#1a1a1a',
                  color: 'white',
                  border: '2px solid #444',
                  borderRadius: '6px'
                }}
                autoFocus
              />
            </div>

            {loginError && (
              <div style={{
                padding: '12px',
                marginBottom: '20px',
                backgroundColor: '#e74c3c',
                color: 'white',
                borderRadius: '6px',
                textAlign: 'center'
              }}>
                {loginError}
              </div>
            )}

            <button
              type="submit"
              style={{
                width: '100%',
                padding: '14px',
                fontSize: '18px',
                backgroundColor: '#2ecc71',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Anmelden
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>
              Zurück zur Startseite
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h2>Laden...</h2>
      </div>
    )
  }

  if (selectedGame) {
    return (
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            onClick={() => setSelectedGame(null)}
            style={{ backgroundColor: '#555', color: 'white' }}
          >
            ← Zurück zur Übersicht
          </button>
          <h2 style={{ margin: 0 }}>{selectedGame.name}</h2>
          <span
            style={{
              padding: '4px 12px',
              borderRadius: '4px',
              backgroundColor:
                selectedGame.status === GameStatus.RUNNING
                  ? '#2ecc71'
                  : selectedGame.status === GameStatus.PAUSED
                  ? '#f39c12'
                  : selectedGame.status === GameStatus.FINISHED
                  ? '#e74c3c'
                  : '#555',
              fontSize: '14px',
            }}
          >
            {selectedGame.status.toUpperCase()}
          </span>
          <button
            onClick={handleLogout}
            style={{
              marginLeft: 'auto',
              backgroundColor: '#e74c3c',
              color: 'white'
            }}
          >
            Abmelden
          </button>
        </div>

        {selectedGame.status === GameStatus.SETUP ? (
          <GameSetup game={selectedGame} onUpdate={refreshGame} />
        ) : (
          <GameControl game={selectedGame} onUpdate={refreshGame} />
        )}
      </div>
    )
  }

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between' }}>
        <Link to="/">
          <button style={{ backgroundColor: '#555', color: 'white' }}>← Zurück</button>
        </Link>
        <button
          onClick={handleLogout}
          style={{ backgroundColor: '#e74c3c', color: 'white' }}
        >
          Abmelden
        </button>
      </div>

      <h1 style={{ marginBottom: '30px' }}>Admin-Interface</h1>

      {/* Create new game */}
      <div
        style={{
          marginBottom: '40px',
          padding: '20px',
          backgroundColor: '#2a2a2a',
          borderRadius: '8px',
        }}
      >
        <h2 style={{ marginBottom: '15px' }}>Neues Spiel erstellen</h2>
        <div style={{ display: 'flex', gap: '10px' }}>
          <input
            type="text"
            placeholder="Spielname"
            value={newGameName}
            onChange={(e) => setNewGameName(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && createGame()}
            style={{ flex: 1 }}
          />
          <button
            onClick={createGame}
            disabled={!newGameName.trim()}
            style={{
              backgroundColor: '#2ecc71',
              color: 'white',
              opacity: newGameName.trim() ? 1 : 0.5,
            }}
          >
            Erstellen
          </button>
        </div>
      </div>

      {/* Existing games */}
      <div>
        <h2 style={{ marginBottom: '20px' }}>Vorhandene Spiele</h2>
        {games.length === 0 ? (
          <p style={{ color: '#888' }}>Keine Spiele vorhanden</p>
        ) : (
          <div style={{ display: 'grid', gap: '15px' }}>
            {games.map((game) => (
              <div
                key={game.id}
                style={{
                  padding: '20px',
                  backgroundColor: '#2a2a2a',
                  borderRadius: '8px',
                  border: '2px solid transparent',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div
                    onClick={() => selectGame(game.id)}
                    style={{
                      flex: 1,
                      cursor: 'pointer',
                      marginRight: '20px'
                    }}
                  >
                    <h3 style={{ margin: 0, marginBottom: '8px' }}>{game.name}</h3>
                    <div style={{ color: '#888', fontSize: '14px' }}>
                      {game.teams.length} Teams • {game.zones.length} Zonen
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <span
                      style={{
                        padding: '4px 12px',
                        borderRadius: '4px',
                        backgroundColor:
                          game.status === GameStatus.RUNNING
                            ? '#2ecc71'
                            : game.status === GameStatus.PAUSED
                            ? '#f39c12'
                            : game.status === GameStatus.FINISHED
                            ? '#e74c3c'
                            : '#555',
                        fontSize: '14px',
                      }}
                    >
                      {game.status}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        deleteGame(game.id, game.name)
                      }}
                      style={{
                        backgroundColor: '#e74c3c',
                        color: 'white',
                        padding: '8px 16px',
                        fontSize: '14px',
                        border: 'none',
                        borderRadius: '6px',
                        cursor: 'pointer'
                      }}
                    >
                      Löschen
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminPage
