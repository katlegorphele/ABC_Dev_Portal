import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { UserGroupIcon, BookOpenIcon, ClipboardDocumentListIcon, BellAlertIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'

function StatCard({ icon: Icon, label, value, sub, color, to }: any) {
  const inner = (
    <div className="card flex items-center gap-4 hover:border-gray-700 transition-colors">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-sm text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

function LevelBar({ label, value, max }: { label: string; value: number; max: number }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-500 w-6">{label}</span>
      <div className="flex-1 h-2 bg-gray-800 rounded-full overflow-hidden">
        <div className="h-2 bg-brand-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-gray-400 w-5 text-right">{value}</span>
    </div>
  )
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['student-stats'],
    queryFn: () => api.get('/students/stats').then(r => r.data),
  })
  const { data: lessons } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => api.get('/lessons').then(r => r.data),
  })
  const { data: registrations } = useQuery({
    queryKey: ['registrations-pending'],
    queryFn: () => api.get('/registrations?status=pending').then(r => r.data),
  })
  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const nextLesson = lessons?.find((l: any) => l.status === 'scheduled')
  const byLevel: Record<string, number> = {}
  stats?.by_level?.forEach((r: any) => { byLevel[r.level] = r.count })
  const pendingSubmissions = projects?.reduce((sum: number, p: any) =>
    sum + (p.submission_stats?.submitted || 0), 0) ?? 0

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Overview</h1>
        <p className="text-gray-500 text-sm mt-1">Africa's Blockchain Club — Dev Training Portal</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserGroupIcon}               label="Active Students"      value={stats?.active}          color="bg-brand-900/40 text-brand-400"  to="/students?status=active" />
        <StatCard icon={UserGroupIcon}               label="Pending Approval"     value={stats?.pending}         color="bg-yellow-900/40 text-yellow-400" to="/registrations" />
        <StatCard icon={ClipboardDocumentListIcon}   label="Awaiting Review"      value={pendingSubmissions}     color="bg-blue-900/40 text-blue-400"    to="/projects" />
        <StatCard icon={BellAlertIcon}               label="Commercial Ready"     value={stats?.commercial_ready} color="bg-purple-900/40 text-purple-400" sub="Tech ≥7 & Security ≥7" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Next lesson */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white flex items-center gap-2">
              <BookOpenIcon className="h-5 w-5 text-brand-400" /> Next Lesson
            </h2>
            <Link to="/lessons" className="text-xs text-brand-400 hover:text-brand-300">View all</Link>
          </div>
          {nextLesson ? (
            <div className="space-y-2">
              <p className="font-medium text-white">Week {nextLesson.week} — {nextLesson.title}</p>
              <p className="text-xs text-gray-500">
                {nextLesson.scheduled_date
                  ? new Date(nextLesson.scheduled_date).toLocaleDateString('en-ZA', { weekday:'long', day:'numeric', month:'long' })
                  : 'Date not set'}
              </p>
              <div className="space-y-1 pt-1">
                {nextLesson.objectives?.slice(0, 3).map((o: string, i: number) => (
                  <p key={i} className="text-xs text-gray-400 flex items-start gap-1.5">
                    <span className="text-brand-500 mt-0.5">•</span> {o}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-sm text-gray-500">No upcoming lessons</p>
          )}
        </div>

        {/* Cohort progress */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Cohort Levels</h2>
          <div className="space-y-3 pt-1">
            {['L1','L2','L3','L4'].map(l => (
              <LevelBar key={l} label={l} value={byLevel[l] || 0} max={stats?.active || 1} />
            ))}
          </div>
          <div className="pt-2 border-t border-gray-800">
            <p className="text-xs text-gray-500">
              {stats?.commercial_ready ?? 0} student{stats?.commercial_ready !== 1 ? 's' : ''} commercial-ready
            </p>
          </div>
        </div>

        {/* Office hours */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Schedule</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-lg">⏰</span>
              <div>
                <p className="text-sm font-medium text-white">Office Hours</p>
                <p className="text-xs text-gray-400">Every Thursday 8:00 PM SAST</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-3 bg-gray-800/50 rounded-lg">
              <span className="text-lg">📋</span>
              <div>
                <p className="text-sm font-medium text-white">Weekly Report</p>
                <p className="text-xs text-gray-400">Every Monday 9:00 AM SAST</p>
              </div>
            </div>
            {registrations?.length > 0 && (
              <Link to="/registrations" className="flex items-start gap-3 p-3 bg-yellow-900/20 border border-yellow-800/40 rounded-lg hover:bg-yellow-900/30 transition-colors">
                <span className="text-lg">📥</span>
                <div>
                  <p className="text-sm font-medium text-yellow-300">{registrations.length} pending registration{registrations.length !== 1 ? 's' : ''}</p>
                  <p className="text-xs text-yellow-600">Click to review</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Recent lessons */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-white">Curriculum Progress</h2>
          <Link to="/lessons" className="text-xs text-brand-400 hover:text-brand-300">Manage lessons →</Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
          {lessons?.slice(0, 16).map((l: any) => (
            <div
              key={l.id}
              title={`Week ${l.week}: ${l.title}`}
              className={`p-2 rounded-lg text-center cursor-default transition-colors ${
                l.status === 'delivered' ? 'bg-brand-900/50 border border-brand-800/40'
                : l.status === 'cancelled' ? 'bg-red-900/30 border border-red-800/30'
                : 'bg-gray-800 border border-gray-700'
              }`}
            >
              <p className="text-xs font-bold text-gray-300">W{l.week}</p>
              <p className="text-[10px] text-gray-500 leading-tight mt-0.5 truncate">{l.title.split(' ').slice(0,2).join(' ')}</p>
              <span className="text-xs mt-1 block">{l.status === 'delivered' ? '✅' : l.status === 'cancelled' ? '❌' : '⏳'}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
