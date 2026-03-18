import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import api from '../lib/api'

const SCORE_COLOR: Record<string, string> = {
  technical:       '#22c55e',
  security:        '#3b82f6',
  problem_solving: '#f59e0b',
  professionalism: '#a78bfa',
}

export default function Reports() {
  const [tab, setTab] = useState<'weekly' | 'cohort'>('weekly')

  const { data: weekly, isLoading: wLoading, refetch } = useQuery({
    queryKey: ['report-weekly'],
    queryFn: () => api.get('/reports/weekly').then(r => r.data),
  })

  const { data: cohort, isLoading: cLoading } = useQuery({
    queryKey: ['report-cohort'],
    queryFn: () => api.get('/reports/cohort-stats').then(r => r.data),
    enabled: tab === 'cohort',
  })

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Reports</h1>
          <p className="text-gray-500 text-sm">Cohort analytics & progress tracking</p>
        </div>
        <button onClick={() => refetch()} className="btn-secondary">
          ↻ Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-800 pb-0">
        {(['weekly', 'cohort'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t
                ? 'border-brand-500 text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-300'
            }`}>
            {t === 'weekly' ? '📋 Weekly Report' : '📊 Cohort Analytics'}
          </button>
        ))}
      </div>

      {/* ── Weekly Report ── */}
      {tab === 'weekly' && (
        wLoading ? <p className="text-gray-500">Generating report…</p> : weekly && (
          <div className="space-y-6">
            {/* Header */}
            <div className="card bg-gradient-to-r from-brand-900/30 to-gray-900 border-brand-800/40">
              <p className="text-xs text-gray-500 mb-1">Generated {new Date(weekly.generated_at).toLocaleString('en-ZA', { timeZone: 'Africa/Johannesburg' })} SAST</p>
              <p className="text-lg font-bold text-white">Weekly Progress Report</p>
              <p className="text-sm text-gray-400">Africa's Blockchain Club — Dev Training Programme</p>
            </div>

            {/* Stat grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: 'Active Students',    value: weekly.cohort.active,           color: 'text-brand-400' },
                { label: 'New This Week',       value: weekly.cohort.new_this_week,    color: 'text-blue-400' },
                { label: 'Pending Approval',    value: weekly.cohort.pending_approval, color: 'text-yellow-400' },
                { label: 'Commercial Ready',    value: weekly.cohort.commercial_ready, color: 'text-purple-400' },
                { label: 'Lessons Delivered',   value: weekly.activity.lessons_delivered,  color: 'text-brand-400' },
                { label: 'Projects Submitted',  value: weekly.activity.projects_submitted, color: 'text-blue-400' },
                { label: 'Projects Reviewed',   value: weekly.activity.projects_reviewed,  color: 'text-brand-400' },
                { label: 'Inactive (>5 days)',  value: weekly.alerts.inactive_students.length, color: 'text-red-400' },
              ].map(({ label, value, color }) => (
                <div key={label} className="card text-center">
                  <p className={`text-3xl font-bold ${color}`}>{value}</p>
                  <p className="text-xs text-gray-500 mt-1">{label}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Cohort averages */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-white">Cohort Score Averages</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={[
                    { name: 'Technical',       score: weekly.averages.technical },
                    { name: 'Security',        score: weekly.averages.security },
                    { name: 'Problem Solving', score: weekly.averages.problem_solving },
                    { name: 'Professionalism', score: weekly.averages.professionalism },
                  ]} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Bar dataKey="score" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(weekly.averages).map(([k, v]: any) => (
                    <div key={k} className="flex justify-between p-2 bg-gray-800/50 rounded-lg">
                      <span className="text-xs text-gray-400 capitalize">{k.replace('_', ' ')}</span>
                      <span className={`text-xs font-bold ${v >= 7 ? 'text-brand-400' : v >= 5 ? 'text-yellow-400' : 'text-red-400'}`}>{v}/10</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Level distribution */}
              <div className="card space-y-4">
                <h2 className="font-semibold text-white">Level Distribution</h2>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weekly.cohort.level_distribution} barSize={40}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="level" tick={{ fill: '#6b7280', fontSize: 12 }} />
                    <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
                      labelStyle={{ color: '#f9fafb' }}
                    />
                    <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-4 gap-2">
                  {['L1','L2','L3','L4'].map(l => {
                    const found = weekly.cohort.level_distribution.find((d: any) => d.level === l)
                    return (
                      <div key={l} className="text-center p-2 bg-gray-800/50 rounded-lg">
                        <p className="text-lg font-bold text-white">{found?.count ?? 0}</p>
                        <p className="text-xs text-gray-500">{l}</p>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Top performers */}
            {weekly.top_performers?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-white mb-3">🏆 Top Performers This Week</h2>
                <div className="space-y-2">
                  {weekly.top_performers.map((s: any, i: number) => (
                    <div key={s._id} className="flex items-center gap-4 p-3 bg-gray-800/50 rounded-lg">
                      <span className="text-lg w-8 text-center">{['🥇','🥈','🥉','4️⃣','5️⃣'][i]}</span>
                      <div className="flex-1">
                        <p className="font-medium text-white text-sm">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.handle} · {s.level}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-brand-400">
                          T:{s.latestScore?.technical ?? 0} S:{s.latestScore?.security ?? 0}
                        </p>
                        <p className="text-xs text-gray-600">combined {s.combined}/20</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inactive alerts */}
            {weekly.alerts.inactive_students?.length > 0 && (
              <div className="card border-red-900/40">
                <h2 className="font-semibold text-red-400 mb-3">⚠️ Inactive Students ({'>'}5 days)</h2>
                <div className="space-y-2">
                  {weekly.alerts.inactive_students.map((s: any) => (
                    <div key={s._id} className="flex items-center justify-between p-3 bg-red-900/10 rounded-lg border border-red-900/20">
                      <div>
                        <p className="text-sm font-medium text-gray-200">{s.name}</p>
                        <p className="text-xs text-gray-500">{s.handle}</p>
                      </div>
                      <p className="text-xs text-red-400">
                        {s.last_active
                          ? `Last seen: ${new Date(s.last_active).toLocaleDateString('en-ZA')}`
                          : 'Never active'}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )
      )}

      {/* ── Cohort Analytics ── */}
      {tab === 'cohort' && (
        cLoading ? <p className="text-gray-500">Loading analytics…</p> : cohort && (
          <div className="space-y-6">
            {/* Score history over time */}
            {cohort.scoreHistory?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-white mb-4">Score Trends Over Time</h2>
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={cohort.scoreHistory.map((w: any) => ({
                    name:            `W${w._id.week}`,
                    Technical:       +w.avg_technical.toFixed(1),
                    Security:        +w.avg_security.toFixed(1),
                    'Problem Solving': +w.avg_problem_solving.toFixed(1),
                  }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                    <Legend wrapperStyle={{ paddingTop: 16 }} />
                    {['Technical','Security','Problem Solving'].map((k, i) => (
                      <Line key={k} type="monotone" dataKey={k}
                        stroke={['#22c55e','#3b82f6','#f59e0b'][i]}
                        strokeWidth={2} dot={{ r: 3 }} />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Lesson attendance */}
            {cohort.lessonAttendance?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-white mb-4">Lesson Attendance</h2>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={cohort.lessonAttendance.map((l: any) => ({
                    name:     `W${l.week}`,
                    Attended: l.attended,
                    Total:    l.total,
                    Rate:     l.total > 0 ? +((l.attended / l.total) * 100).toFixed(0) : 0,
                  }))} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 11 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }} />
                    <Legend />
                    <Bar dataKey="Attended" fill="#22c55e" radius={[4,4,0,0]} />
                    <Bar dataKey="Total"    fill="#374151" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Project completion */}
            {cohort.projectCompletion?.length > 0 && (
              <div className="card">
                <h2 className="font-semibold text-white mb-4">Project Completion</h2>
                <div className="space-y-3">
                  {cohort.projectCompletion.map((p: any) => {
                    const rate = p.total > 0 ? Math.round((p.reviewed / p.total) * 100) : 0
                    return (
                      <div key={p._id} className="space-y-1.5">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-300 truncate">{p.title}</span>
                          <span className="text-gray-500 flex-shrink-0 ml-2">
                            {p.reviewed}/{p.total} reviewed ({rate}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden flex">
                          <div className="h-2 bg-brand-500 transition-all" style={{ width: `${rate}%` }} />
                          <div className="h-2 bg-blue-600 transition-all"
                            style={{ width: `${p.total > 0 ? Math.round((p.submitted / p.total) * 100) : 0}%` }} />
                        </div>
                      </div>
                    )
                  })}
                </div>
                <div className="flex gap-4 mt-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-brand-500 rounded-sm inline-block" /> Reviewed</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 bg-blue-600 rounded-sm inline-block" /> Submitted</span>
                </div>
              </div>
            )}
          </div>
        )
      )}
    </div>
  )
}
