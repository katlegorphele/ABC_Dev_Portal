import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import {
  HomeIcon, UserGroupIcon, BookOpenIcon,
  ClipboardDocumentListIcon, BellIcon, ArrowRightOnRectangleIcon,
  UserPlusIcon,
} from '@heroicons/react/24/outline'

const nav = [
  { to: '/',              label: 'Overview',       icon: HomeIcon },
  { to: '/students',      label: 'Students',       icon: UserGroupIcon },
  { to: '/lessons',       label: 'Lessons',        icon: BookOpenIcon },
  { to: '/projects',      label: 'Projects',       icon: ClipboardDocumentListIcon },
  { to: '/registrations', label: 'Registrations',  icon: UserPlusIcon },
]

export default function Layout() {
  const navigate = useNavigate()

  function logout() {
    localStorage.removeItem('abc_token')
    navigate('/login')
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-gray-900 border-r border-gray-800 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌍</span>
            <div>
              <p className="font-bold text-sm text-white">ABC Dev Portal</p>
              <p className="text-xs text-gray-500">Africa's Blockchain Club</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {nav.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-brand-900/50 text-brand-400 border border-brand-800/50'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5 flex-shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Bottom actions */}
        <div className="px-3 py-4 border-t border-gray-800 space-y-1">
          <button className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-400 hover:text-gray-100 hover:bg-gray-800 w-full transition-colors">
            <BellIcon className="h-5 w-5" />
            Alerts
          </button>
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-400 hover:text-red-300 hover:bg-red-900/20 w-full transition-colors"
          >
            <ArrowRightOnRectangleIcon className="h-5 w-5" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto bg-gray-950">
        <Outlet />
      </main>
    </div>
  )
}
