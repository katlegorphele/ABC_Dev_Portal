import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar,
} from 'recharts'
import {
  UserGroupIcon, BookOpenIcon, ClipboardDocumentListIcon,
  BellAlertIcon, ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline'
import api from '../lib/api'

function StatCard({ icon: Icon, label, value, sub, color, to }: any) {
  const inner = (
    <div className="card flex items-center gap-4 hover:border-gray-700 transition-colors cursor-pointer">
      <div className={`p-3 rounded-xl ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-white">{value ?? '—'}</p>
        <p className="text-xs text-gray-400">{label}</p>
        {sub && <p className="text-xs text-gray-600 mt-0.5">{sub}</p>}
      </div>
    </div>
  )
  return to ? <Link to={to}>{inner}</Link> : inner
}

const TOOLTIP_STYLE = {
  contentStyle: { backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 },
  labelStyle:   { color: '#f9fafb', fontSize: 12 },
}

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ['student-stats'],
    queryFn:  () => api.get('/students/stats').then(r => r.data),
  })
  const { data: lessons = [] } = useQuery({
    queryKey: ['lessons'],
    queryFn:  () => api.get('/lessons').then(r => r.data),
  })
  const { data: registrations = [] } = useQuery({
    queryKey: ['registrations-pending'],
    queryFn:  () => api.get('/registrations?status=pending').then(r => r.data),
  })
  const { data: projects = [] } = useQuery({
    queryKey: ['projects'],
    queryFn:  () => api.get('/projects').then(r => r.data),
  })
  const { data: weekly } = useQuery({
    queryKey: ['report-weekly'],
    queryFn:  () => api.get('/reports/weekly').then(r => r.data),
  })

  const nextLesson        = lessons.find((l: any) => l.status === 'scheduled')
  const deliveredLessons  = lessons.filter((l: any) => l.status === 'delivered').length
  const byLevel: Record<string, number> = {}
  stats?.by_level?.forEach((r: any) => { byLevel[r.level] = r.count })
  const pendingReviews    = projects.reduce((sum: number, p: any) => sum + (p.submission_stats?.submitted || 0), 0)

  const levelChartData = ['L1','L2','L3','L4'].map(l => ({
    level: l, count: byLevel[l] || 0,
  }))

  const radarData = weekly ? [
    { subject: 'Technical',       score: weekly.averages?.technical },
    { subject: 'Security',        score: weekly.averages?.security },
    { subject: 'Problem Solving', score: weekly.averages?.problem_solving },
    { subject: 'Professionalism', score: weekly.averages?.professionalism },
  ] : []

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Overview</h1>
          <p className="text-gray-500 text-sm">Africa's Blockchain Club — Dev Training Portal</p>
        </div>
        <Link to="/reports" className="btn-secondary text-sm">
          <ArrowTrendingUpIcon className="h-4 w-4" /> Full Report
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={UserGroupIcon}             label="Active Students"   value={stats?.active}            color="bg-brand-900/40 text-brand-400"   to="/students?status=active" />
        <StatCard icon={UserGroupIcon}             label="Pending Approval"  value={registrations.length}     color="bg-yellow-900/40 text-yellow-400" to="/registrations" />
        <StatCard icon={ClipboardDocumentListIcon} label="Awaiting Review"   value={pendingReviews}           color="bg-blue-900/40 text-blue-400"     to="/projects" />
        <StatCard icon={BellAlertIcon}             label="Commercial Ready"  value={stats?.commercial_ready}  color="bg-purple-900/40 text-purple-400" sub="Tech ≥7 & Sec ≥7" />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Level distribution bar chart */}
        <div className="card col-span-1 space-y-3">
          <h2 className="font-semibold text-white text-sm">Level Distribution</h2>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={levelChartData} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
              <XAxis dataKey="level" tick={{ fill: '#6b7280', fontSize: 12 }} />
              <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
              <Tooltip {...TOOLTIP_STYLE} />
              <Bar dataKey="count" fill="#22c55e" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Cohort averages radar */}
        <div className="card col-span-1 space-y-3">
          <h2 className="font-semibold text-white text-sm">Cohort Skill Averages</h2>
          {radarData.length > 0 ? (
            <ResponsiveContainer width="100%" height={160}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#1f2937" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                <Radar dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.25} />
                <Tooltip {...TOOLTIP_STYLE} formatter={(v: any) => [`${v}/10`]} />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-40 text-gray-600 text-sm">No score data yet</div>
          )}
        </div>

        {/* Schedule + alerts */}
        <div className="card col-span-1 space-y-3">
          <h2 className="font-semibold text-white text-sm">This Week</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
              <span className="text-base">⏰</span>
              <div>
                <p className="text-xs font-medium text-white">Office Hours</p>
                <p className="text-xs text-gray-500">Thursday 8:00 PM SAST</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-2.5 bg-gray-800/50 rounded-lg">
              <span className="text-base">📚</span>
              <div>
                <p className="text-xs font-medium text-white">
                  {deliveredLessons}/{lessons.length} lessons delivered
                </p>
                <p className="text-xs text-gray-500">
                  {nextLesson ? `Next: Week ${nextLesson.week} — ${nextLesson.title}` : 'All lessons complete!'}
                </p>
              </div>
            </div>
            {weekly?.alerts?.inactive_students?.length > 0 && (
              <div className="flex items-center gap-3 p-2.5 bg-red-900/20 border border-red-900/30 rounded-lg">
                <span className="text-base">⚠️</span>
                <div>
                  <p className="text-xs font-medium text-red-300">
                    {weekly.alerts.inactive_students.length} inactive student{weekly.alerts.inactive_students.length !== 1 ? 's' : ''}
                  </p>
                  <p className="text-xs text-red-600">No activity in 5+ days</p>
                </div>
              </div>
            )}
            {registrations.length > 0 && (
              <Link to="/registrations"
                className="flex items-center gap-3 p-2.5 bg-yellow-900/20 border border-yellow-900/30 rounded-lg hover:bg-yellow-900/30 transition-colors">
                <span className="text-base">📥</span>
                <div>
                  <p className="text-xs font-medium text-yellow-300">{registrations.length} pending approval</p>
                  <p className="text-xs text-yellow-700">Tap to review</p>
                </div>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Curriculum progress grid */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-white">Curriculum Progress</h2>
            <p className="text-xs text-gray-500 mt-0.5">{deliveredLessons} of {lessons.length} lessons delivered</p>
          </div>
          <Link to="/lessons" className="text-xs text-brand-400 hover:text-brand-300">Manage →</Link>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-gray-800 rounded-full mb-4 overflow-hidden">
          <div
            className="h-1.5 bg-brand-500 rounded-full transition-all"
            style={{ width: `${lessons.length > 0 ? (deliveredLessons / lessons.length) * 100 : 0}%` }}
          />
        </div>

        <div className="grid grid-cols-4 sm:grid-cols-8 lg:grid-cols-16 gap-1.5">
          {lessons.map((l: any) => (
            <div
              key={l.id}
              title={`Week ${l.week}: ${l.title}\nAttended: ${l.attendance_count ?? 0}`}
              className={`aspect-square rounded-lg flex flex-col items-center justify-center text-center p-1 transition-colors cursor-default ${
                l.status === 'delivered'  ? 'bg-brand-900/60 border border-brand-800/40'
                : l.status === 'cancelled' ? 'bg-red-900/30 border border-red-800/30'
                : 'bg-gray-800 border border-gray-700/50'
              }`}
            >
              <p className="text-[10px] font-bold text-gray-400">W{l.week}</p>
              <span className="text-xs mt-0.5">
                {l.status === 'delivered' ? '✅' : l.status === 'cancelled' ? '❌' : '⏳'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
