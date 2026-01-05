const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

// Token management
const getAuthToken = (): string | null => {
  return localStorage.getItem('admin_token')
}

const setAuthToken = (token: string) => {
  localStorage.setItem('admin_token', token)
}

const clearAuthToken = () => {
  localStorage.removeItem('admin_token')
}

const getAuthHeaders = () => {
  const token = getAuthToken()
  if (token) {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    }
  }
  return { 'Content-Type': 'application/json' }
}

// Auth API
export const authApi = {
  login: async (password: string) => {
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    })
    const data = await response.json()
    if (response.ok && data.token) {
      setAuthToken(data.token)
    }
    return data
  },

  logout: () => {
    clearAuthToken()
  },

  isAuthenticated: (): boolean => {
    return getAuthToken() !== null
  },

  verifyToken: async () => {
    const token = getAuthToken()
    if (!token) return false

    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    })
    return response.ok
  }
}

export const api = {
  // Games
  getGames: async () => {
    const response = await fetch(`${API_URL}/api/games`)
    return response.json()
  },

  getGame: async (id: string) => {
    const response = await fetch(`${API_URL}/api/games/${id}`)
    return response.json()
  },

  createGame: async (data: { name: string }) => {
    const response = await fetch(`${API_URL}/api/games`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updateGame: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/api/games/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  startGame: async (id: string) => {
    const response = await fetch(`${API_URL}/api/games/${id}/start`, {
      method: 'POST',
    })
    return response.json()
  },

  pauseGame: async (id: string) => {
    const response = await fetch(`${API_URL}/api/games/${id}/pause`, {
      method: 'POST',
    })
    return response.json()
  },

  endGame: async (id: string) => {
    const response = await fetch(`${API_URL}/api/games/${id}/end`, {
      method: 'POST',
    })
    return response.json()
  },

  deleteGame: async (id: string) => {
    const response = await fetch(`${API_URL}/api/games/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    })
    if (!response.ok) {
      throw new Error('Failed to delete game')
    }
    return response.json()
  },

  // Teams
  createTeam: async (gameId: string, data: { name: string; color: string }) => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/teams`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updateTeam: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/api/teams/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  deleteTeam: async (id: string) => {
    const response = await fetch(`${API_URL}/api/teams/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  },

  // Zones
  createZone: async (gameId: string, data: { name: string; pin: string }) => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/zones`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  updateZone: async (id: string, data: any) => {
    const response = await fetch(`${API_URL}/api/zones/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  deleteZone: async (id: string) => {
    const response = await fetch(`${API_URL}/api/zones/${id}`, {
      method: 'DELETE',
    })
    return response.json()
  },

  // Stations
  authStation: async (pin: string) => {
    const response = await fetch(`${API_URL}/api/stations/auth`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    })
    return response.json()
  },

  zoneEnter: async (zoneId: string, teamId: string, createdBy: string) => {
    const response = await fetch(`${API_URL}/api/stations/zones/${zoneId}/enter`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, createdBy }),
    })
    return response.json()
  },

  zoneLeave: async (zoneId: string, teamId: string, createdBy: string) => {
    const response = await fetch(`${API_URL}/api/stations/zones/${zoneId}/leave`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teamId, createdBy }),
    })
    return response.json()
  },

  getZoneStatus: async (zoneId: string) => {
    const response = await fetch(`${API_URL}/api/stations/zones/${zoneId}/status`)
    return response.json()
  },

  captureBand: async (data: {
    gameId: string
    capturingTeamId: string
    capturedTeamId: string
    stationName: string
  }) => {
    const response = await fetch(`${API_URL}/api/bands/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return response.json()
  },

  // Scores
  getScores: async (gameId: string) => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/scores`)
    return response.json()
  },

  getTimeline: async (gameId: string) => {
    const response = await fetch(`${API_URL}/api/games/${gameId}/timeline`)
    return response.json()
  },
}
