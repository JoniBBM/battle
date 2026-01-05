export enum GameStatus {
  SETUP = 'setup',
  RUNNING = 'running',
  PAUSED = 'paused',
  FINISHED = 'finished',
}

export enum OccupationAction {
  ENTER = 'enter',
  LEAVE = 'leave',
}

export interface Game {
  id: string
  name: string
  status: GameStatus
  createdAt: string
  startedAt?: string
  endedAt?: string
  teams: Team[]
  zones: Zone[]
  settings?: GameSettings
  bandStation?: BandStation
}

export interface Team {
  id: string
  gameId: string
  name: string
  color: string
  orderIndex: number
}

export interface Zone {
  id: string
  gameId: string
  name: string
  pin: string
  orderIndex: number
}

export interface ZoneOccupationEvent {
  id: string
  zoneId: string
  teamId: string
  action: OccupationAction
  timestamp: string
  createdBy: string
}

export interface BandCapture {
  id: string
  gameId: string
  capturingTeamId: string
  capturedTeamId: string
  points: number
  timestamp: string
  stationName: string
}

export interface GameSettings {
  id: string
  gameId: string
  pointsPerSecond: number
  bandCapturePoints: number
  durationMinutes?: number
}

export interface BandStation {
  id: string
  gameId: string
  name: string
  pin: string
}

export interface TeamScore {
  teamId: string
  teamName: string
  teamColor: string
  zonePoints: number
  bandPoints: number
  totalPoints: number
}

export interface ZoneStatus {
  zoneId: string
  zoneName: string
  teams: string[] // team IDs currently in zone
}
