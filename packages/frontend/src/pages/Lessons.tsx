import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PlusIcon, CheckCircleIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'

const STATUS_STYLES: Record<string, string> = {
  scheduled:  'bg-blue-900/50 text-blue-300 border border-blue-800/40',
  delivered:  'bg-brand-900/50 text-brand-300 border border-brand-800/40',
  cancelled:  'bg-red-900/40 text-red-300 border border-red-800/30',
}

export default function Lessons() {
  const [showCreate, setShowCreate] = useState(false)
  const [filter, setFilter]         = useState('')
  const qc = useQueryClient()

  const { data: lessons = [], isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: () => api.get('/lessons').then(r => r.data),
  })

  const markDelivered = useMutation({
    mutationFn: (id: string) => api.patch(`/lessons/${id}`, { status: 'delivered' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['lessons'] }),
  })

  const filtered = lessons.filter((l: any) =>
    !filter || l.status === filter
  )

  return (
    <div className="p-6 space-y-5 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Lessons</h1>
          <p className="text-gray-500 text-sm">16-week curriculum</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> New Lesson
        </button>
      </div>

      <div className="flex gap-2">
        {['', 'scheduled', 'delivered', 'cancelled'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn text-xs py-1.5 ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-gray-500">Loading…</p> : (
        <div className="space-y-3">
          {filtered.map((l: any) => (
            <div key={l.id} className="card flex items-start gap-4 hover:border-gray-700 transition-colors">
              {/* Week number */}
              <div className="flex-shrink-0 w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center">
                <span className="text-xs text-gray-400 font-bold">W{l.week}</span>
              </div>

              {/* Main content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-white">{l.title}</p>
                  <span className={`badge text-xs ${STATUS_STYLES[l.status]}`}>{l.status}</span>
                  {l.attendance_count > 0 && (
                    <span className="badge bg-gray-800 text-gray-400 text-xs">
                      {l.attendance_count} attended
                    </span>
                  )}
                </div>
                {l.scheduled_date && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(l.scheduled_date).toLocaleDateString('en-ZA', { weekday:'long', day:'numeric', month:'long' })}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {l.objectives?.slice(0, 4).map((o: string, i: number) => (
                    <span key={i} className="text-xs bg-gray-800 text-gray-400 px-2 py-0.5 rounded-full">{o}</span>
                  ))}
                  {l.objectives?.length > 4 && (
                    <span className="text-xs text-gray-600">+{l.objectives.length - 4} more</span>
                  )}
                </div>
              </div>

              {/* Actions */}
              {l.status === 'scheduled' && (
                <button
                  onClick={() => markDelivered.mutate(l.id)}
                  disabled={markDelivered.isPending}
                  className="btn-secondary text-xs flex-shrink-0"
                  title="Mark as delivered"
                >
                  <CheckCircleIcon className="h-4 w-4 text-brand-400" />
                  Delivered
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateLessonModal onClose={() => { setShowCreate(false); qc.invalidateQueries({ queryKey: ['lessons'] }) }} />
      )}
    </div>
  )
}

function CreateLessonModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    title: '', week: 1, description: '',
    objectives: '', scheduled_date: '', status: 'scheduled',
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/lessons', {
      ...data,
      week: Number(data.week),
      objectives: data.objectives.split('\n').map((s: string) => s.trim()).filter(Boolean),
    }),
    onSuccess: onClose,
    onError: (e: any) => setError(e.response?.data?.error || 'Error creating lesson'),
  })

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Create Lesson</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="label">Title</label>
              <input className="input" value={form.title} onChange={e => set('title', e.target.value)} />
            </div>
            <div>
              <label className="label">Week</label>
              <input type="number" className="input" min={1} max={52} value={form.week}
                onChange={e => set('week', e.target.value)} />
            </div>
          </div>
          <div>
            <label className="label">Scheduled Date</label>
            <input type="date" className="input" value={form.scheduled_date}
              onChange={e => set('scheduled_date', e.target.value)} />
          </div>
          <div>
            <label className="label">Description (optional)</label>
            <textarea className="input h-16 resize-none" value={form.description}
              onChange={e => set('description', e.target.value)} />
          </div>
          <div>
            <label className="label">Learning Objectives (one per line)</label>
            <textarea className="input h-28 resize-none font-mono text-xs" value={form.objectives}
              placeholder={"What is blockchain?\nHow transactions work\nWallets & keys"}
              onChange={e => set('objectives', e.target.value)} />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Creating…' : 'Create Lesson'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
