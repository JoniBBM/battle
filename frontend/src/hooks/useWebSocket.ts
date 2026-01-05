import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export function useWebSocket(gameId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [connected, setConnected] = useState(false)
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Create socket connection
    const newSocket = io(API_URL)

    newSocket.on('connect', () => {
      console.log('WebSocket connected')
      setConnected(true)

      // Subscribe to game updates if gameId provided
      if (gameId) {
        newSocket.emit('subscribe:game', gameId)
      }
    })

    newSocket.on('disconnect', () => {
      console.log('WebSocket disconnected')
      setConnected(false)
    })

    socketRef.current = newSocket
    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [gameId])

  return { socket, connected }
}

export function useGameUpdates(
  gameId: string | undefined,
  onUpdate: (data: any) => void
) {
  const { socket } = useWebSocket(gameId)

  const stableOnUpdate = useCallback(onUpdate, [onUpdate])

  useEffect(() => {
    if (!socket || !gameId) return

    socket.on('game:update', stableOnUpdate)
    socket.on('scores:update', stableOnUpdate)
    socket.on('zone:update', stableOnUpdate)
    socket.on('band:captured', stableOnUpdate)

    console.log(`Subscribed to game ${gameId} updates`)

    return () => {
      console.log(`Unsubscribed from game ${gameId} updates`)
      socket.off('game:update', stableOnUpdate)
      socket.off('scores:update', stableOnUpdate)
      socket.off('zone:update', stableOnUpdate)
      socket.off('band:captured', stableOnUpdate)
    }
  }, [socket, gameId, stableOnUpdate])

  return socket
}
