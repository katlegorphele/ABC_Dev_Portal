import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeftIcon, PencilIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'

function ScorePill({ label, value }: { label: string; value: number }) {
  const color = value >= 7 ? 'text-brand-400' : value >= 5 ? 'text-yellow-400' : 'text-red-400'
  return (
    <div className="text-center p-3 bg-gray-800 rounded-lg">
      <p className={`text-xl font-bold ${color}`}>{value}<span className="text-xs text-gray-500">/10</span></p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  )
}

export default function StudentProfile() {
  const { id } = useParams<{ id: string }>()
  const qc = useQueryClient()
  const [showScore, setShowScore] = useState(false)

  const { data: student, isLoading } = useQuery({
    queryKey: ['student', id],
    queryFn: () => api.get(`/students/${id}`).then(r => r.data),
  })

  if (isLoading) return <div className="p-6 text-gray-500">Loading…</div>
  if (!student)  return <div className="p-6 text-red-400">Student not found</div>

  const latest = student.scores?.[0]
  const langs  = JSON.parse(student.languages || '[]')

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Link to="/students" className="text-gray-500 hover:text-gray-300">
          <ArrowLeftIcon className="h-5 w-5" />
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-white">{student.name}</h1>
            <span className="badge bg-brand-900/60 text-brand-300">{student.level}</span>
            <span className={`badge ${student.status === 'active' ? 'bg-brand-900/60 text-brand-300' : 'bg-gray-700 text-gray-400'}`}>
              {student.status}
            </span>
          </div>
          <p className="text-gray-500 text-sm mt-0.5">{student.handle} · {student.discord_handle} · {student.country}</p>
        </div>
        <button onClick={() => setShowScore(true)} className="btn-primary">
          <PencilIcon className="h-4 w-4" /> Update Scores
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="space-y-4">
          <div className="card space-y-3">
            <h3 className="font-medium text-white text-sm">Details</h3>
            {[
              ['Email', student.email],
              ['GitHub', student.github_username],
              ['Discord', student.discord_handle],
              ['Country', student.country],
              ['Hours/week', `${student.hours_per_week}h`],
              ['Joined', new Date(student.joined_at).toLocaleDateString('en-ZA')],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-sm">
                <span className="text-gray-500">{k}</span>
                <span className="text-gray-300 text-right max-w-[60%] truncate">{v}</span>
              </div>
            ))}
            {langs.length > 0 && (
              <div>
                <p className="text-gray-500 text-sm mb-1.5">Languages</p>
                <div className="flex flex-wrap gap-1">
                  {langs.map((l: string) => (
                    <span key={l} className="badge bg-gray-800 text-gray-300">{l}</span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {student.goals && (
            <div className="card">
              <h3 className="font-medium text-white text-sm mb-2">Goals</h3>
              <p className="text-sm text-gray-400 leading-relaxed">{student.goals}</p>
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="md:col-span-2 space-y-4">
          {/* Latest scores */}
          {latest && (
            <div className="card space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium text-white text-sm">Current Scores</h3>
                <span className="text-xs text-gray-500">
                  {new Date(latest.recorded_at).toLocaleDateString('en-ZA')}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                <ScorePill label="Technical"   value={latest.technical} />
                <ScorePill label="Security"    value={latest.security} />
                <ScorePill label="Problem Solving" value={latest.problem_solving} />
                <ScorePill label="Professionalism" value={latest.professionalism} />
              </div>
              {latest.technical >= 7 && latest.security >= 7 && (
                <div className="p-3 bg-brand-900/30 border border-brand-800/40 rounded-lg">
                  <p className="text-sm text-brand-300 font-medium">🎯 Commercial Ready</p>
                  <p className="text-xs text-brand-600 mt-0.5">Meets threshold for client projects (Tech ≥7, Security ≥7)</p>
                </div>
              )}
            </div>
          )}

          {/* Submissions */}
          {student.submissions?.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-white text-sm mb-3">Project Submissions</h3>
              <div className="space-y-2">
                {student.submissions.map((s: any) => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-gray-200">{s.project_title}</p>
                      <p className="text-xs text-gray-500">{s.submitted_at ? new Date(s.submitted_at).toLocaleDateString('en-ZA') : 'Not submitted'}</p>
                    </div>
                    <div className="text-right">
                      {s.total_score != null && (
                        <p className={`text-sm font-bold ${s.total_score >= 70 ? 'text-brand-400' : s.total_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                          {s.total_score}%
                        </p>
                      )}
                      <span className={`badge text-xs ${s.status === 'reviewed' ? 'bg-brand-900/60 text-brand-300' : s.status === 'submitted' ? 'bg-blue-900/60 text-blue-300' : 'bg-gray-700 text-gray-400'}`}>
                        {s.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Attendance */}
          {student.attendance?.length > 0 && (
            <div className="card">
              <h3 className="font-medium text-white text-sm mb-3">Attendance</h3>
              <div className="flex flex-wrap gap-2">
                {student.attendance.map((a: any) => (
                  <div key={a.lesson_id} title={a.lesson_title}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium ${
                      a.attended ? 'bg-brand-900/50 text-brand-300' : 'bg-red-900/30 text-red-400'
                    }`}
                  >
                    W{a.week} {a.attended ? '✓' : '✗'}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {showScore && (
        <UpdateScoresModal
          studentId={id!}
          current={latest}
          onClose={() => { setShowScore(false); qc.invalidateQueries({ queryKey: ['student', id] }) }}
        />
      )}
    </div>
  )
}

function UpdateScoresModal({ studentId, current, onClose }: any) {
  const [scores, setScores] = useState({
    technical:       current?.technical       ?? 0,
    security:        current?.security        ?? 0,
    problem_solving: current?.problem_solving ?? 0,
    professionalism: current?.professionalism ?? 0,
    notes: '',
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.post(`/students/${studentId}/scores`, data),
    onSuccess: onClose,
  })

  const fields = [
    ['technical',       'Technical'],
    ['security',        'Security'],
    ['problem_solving', 'Problem Solving'],
    ['professionalism', 'Professionalism'],
  ]

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Update Scores</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          {fields.map(([k, label]) => (
            <div key={k}>
              <div className="flex justify-between mb-1">
                <label className="label mb-0">{label}</label>
                <span className="text-sm font-bold text-brand-400">{(scores as any)[k]}</span>
              </div>
              <input type="range" min={0} max={10}
                value={(scores as any)[k]}
                onChange={e => setScores(s => ({ ...s, [k]: Number(e.target.value) }))}
                className="w-full accent-brand-500"
              />
            </div>
          ))}
          <div>
            <label className="label">Notes (optional)</label>
            <textarea className="input h-16 resize-none" value={scores.notes}
              onChange={e => setScores(s => ({ ...s, notes: e.target.value }))} />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => mutation.mutate(scores)} disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Saving…' : 'Save Scores'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
