import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, LinkIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'
import { Link } from 'react-router-dom'

export default function Projects() {
  const [showCreate, setShowCreate] = useState(false)
  const [selected, setSelected]     = useState<any>(null)
  const qc = useQueryClient()

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => api.get('/projects').then(r => r.data),
  })

  const { data: detail } = useQuery({
    queryKey: ['project-detail', selected?.id],
    queryFn: () => api.get(`/projects/${selected.id}`).then(r => r.data),
    enabled: !!selected,
  })

  return (
    <div className="p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-bold text-white">Projects</h1>
          <p className="text-gray-500 text-sm">{projects.length} total</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> New Project
        </button>
      </div>

      <div className={`grid gap-4 ${selected ? 'grid-cols-2' : 'grid-cols-1'}`}>
        {/* Project list */}
        <div className="space-y-3">
          {isLoading ? <p className="text-gray-500">Loading…</p> : projects.map((p: any) => {
            const s = p.submission_stats
            const reviewed  = s?.reviewed  ?? 0
            const submitted = s?.submitted ?? 0
            const total     = s?.total     ?? 0
            return (
              <button key={p.id} onClick={() => setSelected(p)}
                className={`card w-full text-left hover:border-gray-700 transition-colors ${selected?.id === p.id ? 'border-brand-700' : ''}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{p.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{p.description}</p>
                    {p.due_date && (
                      <p className="text-xs text-gray-600 mt-1">Due: {new Date(p.due_date).toLocaleDateString('en-ZA')}</p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 space-y-1">
                    <p className="text-xs text-gray-400">{reviewed}/{total} reviewed</p>
                    <div className="flex gap-1 justify-end">
                      {reviewed > 0   && <span className="badge bg-brand-900/50 text-brand-300 text-xs">{reviewed} ✅</span>}
                      {submitted > 0  && <span className="badge bg-blue-900/50 text-blue-300 text-xs">{submitted} 📤</span>}
                      {(total - reviewed - submitted) > 0 && (
                        <span className="badge bg-gray-700 text-gray-400 text-xs">{total - reviewed - submitted} ⏳</span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>

        {/* Submission panel */}
        {selected && detail && (
          <div className="card self-start sticky top-6 space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="font-semibold text-white">{detail.title}</h2>
                <p className="text-xs text-gray-500 mt-0.5">{detail.submissions?.length ?? 0} submissions</p>
              </div>
              <button onClick={() => setSelected(null)} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
            </div>

            <div className="space-y-2 max-h-[60vh] overflow-y-auto">
              {detail.submissions?.map((sub: any) => (
                <SubmissionRow
                  key={sub.id}
                  submission={sub}
                  projectId={detail.id}
                  onUpdate={() => qc.invalidateQueries({ queryKey: ['project-detail', detail.id] })}
                />
              ))}
              {!detail.submissions?.length && (
                <p className="text-gray-500 text-sm text-center py-4">No submissions yet</p>
              )}
            </div>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateProjectModal onClose={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['projects'] }) }} />
      )}
    </div>
  )
}

function SubmissionRow({ submission: s, projectId, onUpdate }: any) {
  const [showReview, setShowReview] = useState(false)
  const [scores, setScores] = useState({
    score_technical: s.score_technical ?? 0,
    score_security: s.score_security ?? 0,
    score_functionality: s.score_functionality ?? 0,
    score_quality: s.score_quality ?? 0,
    feedback: s.feedback ?? '',
  })

  const mutation = useMutation({
    mutationFn: (data: any) => api.patch(`/projects/${projectId}/submissions/${s.student_id}`, { ...data, status: 'reviewed' }),
    onSuccess: () => { setShowReview(false); onUpdate() },
  })

  return (
    <div className="p-3 bg-gray-800/50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div>
          <Link to={`/students/${s.student_id}`} className="text-sm font-medium text-gray-200 hover:text-brand-400">
            {s.student_name}
          </Link>
          <p className="text-xs text-gray-500">{s.student_handle}</p>
        </div>
        <div className="flex items-center gap-2">
          {s.total_score != null && (
            <span className={`text-sm font-bold ${s.total_score >= 70 ? 'text-brand-400' : s.total_score >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
              {s.total_score}%
            </span>
          )}
          <span className={`badge text-xs ${
            s.status === 'reviewed' ? 'bg-brand-900/60 text-brand-300' :
            s.status === 'submitted' ? 'bg-blue-900/60 text-blue-300' :
            s.status === 'overdue' ? 'bg-red-900/50 text-red-300' :
            'bg-gray-700 text-gray-400'
          }`}>{s.status}</span>
        </div>
      </div>

      {s.github_url && (
        <a href={s.github_url} target="_blank" rel="noreferrer"
          className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 truncate">
          <LinkIcon className="h-3 w-3 flex-shrink-0" /> {s.github_url}
        </a>
      )}

      {s.status === 'submitted' && !showReview && (
        <button onClick={() => setShowReview(true)} className="btn-secondary text-xs py-1 w-full justify-center">
          Review Submission
        </button>
      )}

      {showReview && (
        <div className="space-y-2 pt-1 border-t border-gray-700">
          {[['score_technical','Technical'],['score_security','Security'],['score_functionality','Functionality'],['score_quality','Code Quality']].map(([k, label]) => (
            <div key={k} className="flex items-center gap-2">
              <span className="text-xs text-gray-500 w-24">{label}</span>
              <input type="range" min={0} max={10} value={(scores as any)[k]}
                onChange={e => setScores(s => ({ ...s, [k]: Number(e.target.value) }))}
                className="flex-1 accent-brand-500" />
              <span className="text-xs text-brand-400 w-5">{(scores as any)[k]}</span>
            </div>
          ))}
          <textarea className="input h-16 resize-none text-xs" placeholder="Feedback…"
            value={scores.feedback} onChange={e => setScores(s => ({ ...s, feedback: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={() => setShowReview(false)} className="btn-secondary text-xs flex-1 justify-center">Cancel</button>
            <button onClick={() => mutation.mutate(scores)} disabled={mutation.isPending} className="btn-primary text-xs flex-1 justify-center">
              {mutation.isPending ? '…' : 'Submit Review'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function CreateProjectModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ title: '', description: '', requirements: '', due_date: '' })
  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/projects', {
      ...data,
      requirements: data.requirements.split('\n').map((s: string) => s.trim()).filter(Boolean),
    }),
    onSuccess: onClose,
  })

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Create Project</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="label">Title</label>
            <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input h-20 resize-none" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Requirements (one per line)</label>
            <textarea className="input h-24 resize-none font-mono text-xs" value={form.requirements}
              placeholder={"Contract deploys without errors\nVoting logic works correctly\nEvents emitted correctly"}
              onChange={e => set('requirements', e.target.value)} />
          </div>
          <div>
            <label className="label">Due Date</label>
            <input type="date" className="input" value={form.due_date} onChange={e => set('due_date', e.target.value)} />
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
