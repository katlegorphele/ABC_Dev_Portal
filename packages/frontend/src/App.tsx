import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Students from './pages/Students'
import StudentProfile from './pages/StudentProfile'
import Lessons from './pages/Lessons'
import Projects from './pages/Projects'
import Registrations from './pages/Registrations'
import Register from './pages/Register'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const token = localStorage.getItem('abc_token')
  return token ? <>{children}</> : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Admin (protected) */}
        <Route path="/" element={<RequireAuth><Layout /></RequireAuth>}>
          <Route index                         element={<Dashboard />} />
          <Route path="students"               element={<Students />} />
          <Route path="students/:id"           element={<StudentProfile />} />
          <Route path="lessons"                element={<Lessons />} />
          <Route path="projects"               element={<Projects />} />
          <Route path="registrations"          element={<Registrations />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
