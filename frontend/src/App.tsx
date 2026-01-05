import { BrowserRouter, Routes, Route, Link } from 'react-router-dom'
import AdminPage from './pages/Admin/AdminPage'
import StationPage from './pages/Station/StationPage'
import DashboardPage from './pages/Dashboard/DashboardPage'

function HomePage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      gap: '20px'
    }}>
      <h1 style={{ fontSize: '3em', marginBottom: '40px' }}>Battlefield Geländespiel</h1>
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', justifyContent: 'center' }}>
        <Link to="/admin">
          <button style={{
            backgroundColor: '#4a9eff',
            color: 'white',
            fontSize: '1.2em',
            padding: '20px 40px'
          }}>
            Admin
          </button>
        </Link>
        <Link to="/station">
          <button style={{
            backgroundColor: '#2ecc71',
            color: 'white',
            fontSize: '1.2em',
            padding: '20px 40px'
          }}>
            Station
          </button>
        </Link>
        <Link to="/dashboard">
          <button style={{
            backgroundColor: '#e74c3c',
            color: 'white',
            fontSize: '1.2em',
            padding: '20px 40px'
          }}>
            Live Dashboard
          </button>
        </Link>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/station" element={<StationPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
