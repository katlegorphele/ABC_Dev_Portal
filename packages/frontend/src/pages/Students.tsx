import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'

const LEVEL_COLORS: Record<string, string> = {
  L1: 'bg-gray-700 text-gray-300',
  L2: 'bg-blue-900/60 text-blue-300',
  L3: 'bg-brand-900/60 text-brand-300',
  L4: 'bg-purple-900/60 text-purple-300',
}
const STATUS_COLORS: Record<string, string> = {
  active:   'bg-brand-900/60 text-brand-300',
  inactive: 'bg-yellow-900/60 text-yellow-300',
  pending:  'bg-orange-900/60 text-orange-300',
  alumni:   'bg-gray-700 text-gray-400',
}

function ScoreBar({ score }: { score: number }) {
  return (
    <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
      <div
        className={`h-1.5 rounded-full ${score >= 7 ? 'bg-brand-500' : score >= 5 ? 'bg-yellow-500' : 'bg-red-500'}`}
        style={{ width: `${score * 10}%` }}
      />
    </div>
  )
}

export default function Students() {
  const [search, setSearch]   = useState('')
  const [status, setStatus]   = useState('active')
  const [level, setLevel]     = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const qc = useQueryClient()

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['students', status, level],
    queryFn: () => {
      const p = new URLSearchParams()
      if (status) p.set('status', status)
      if (level)  p.set('level', level)
      return api.get(`/students?${p}`).then(r => r.data)
    },
  })

  const filtered = students.filter((s: any) =>
    !search || s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.handle.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6 space-y-5 max-w-6xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Students</h1>
          <p className="text-gray-500 text-sm">{filtered.length} showing</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          <PlusIcon className="h-4 w-4" /> Add Student
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
          <input className="input pl-9 w-56" placeholder="Search name or handle…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="input w-36" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending</option>
          <option value="inactive">Inactive</option>
          <option value="alumni">Alumni</option>
        </select>
        <select className="input w-28" value={level} onChange={e => setLevel(e.target.value)}>
          <option value="">All levels</option>
          <option value="L1">L1</option>
          <option value="L2">L2</option>
          <option value="L3">L3</option>
          <option value="L4">L4</option>
        </select>
      </div>

      {/* Table */}
      {isLoading ? (
        <p className="text-gray-500">Loading…</p>
      ) : filtered.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">No students found</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800 text-left">
                <th className="px-4 py-3 text-gray-400 font-medium">Student</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Level</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Technical</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Security</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="px-4 py-3 text-gray-400 font-medium">Joined</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {filtered.map((s: any) => {
                const sc = s.latest_scores ? JSON.parse(s.latest_scores) : null
                return (
                  <tr key={s.id} className="hover:bg-gray-800/30 transition-colors">
                    <td className="px-4 py-3">
                      <p className="font-medium text-white">{s.name}</p>
                      <p className="text-xs text-gray-500">{s.handle} · {s.discord_handle}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${LEVEL_COLORS[s.level]}`}>{s.level}</span>
                    </td>
                    <td className="px-4 py-3 w-28">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">{sc?.technical ?? 0}/10</p>
                        <ScoreBar score={sc?.technical ?? 0} />
                      </div>
                    </td>
                    <td className="px-4 py-3 w-28">
                      <div className="space-y-1">
                        <p className="text-xs text-gray-400">{sc?.security ?? 0}/10</p>
                        <ScoreBar score={sc?.security ?? 0} />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`badge ${STATUS_COLORS[s.status]}`}>{s.status}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {new Date(s.joined_at).toLocaleDateString('en-ZA')}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link to={`/students/${s.id}`} className="btn-secondary text-xs py-1.5 px-3">
                        View
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {showAdd && <AddStudentModal onClose={() => { setShowAdd(false); qc.invalidateQueries({ queryKey: ['students'] }) }} />}
    </div>
  )
}

// ─── Add Student Modal ────────────────────────────────────────────────────────
function AddStudentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({
    name: '', handle: '', email: '', discord_handle: '', github_username: '',
    country: '', blockchain_experience: 'none', goals: '', hours_per_week: 10,
  })
  const [error, setError] = useState('')

  const mutation = useMutation({
    mutationFn: (data: any) => api.post('/students', data),
    onSuccess: onClose,
    onError: (e: any) => setError(e.response?.data?.error || 'Error creating student'),
  })

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-900 border border-gray-800 rounded-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="font-semibold text-white">Add Student</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">×</button>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {[['name','Full Name'],['handle','Handle (@name)'],['email','Email'],['discord_handle','Discord'],['github_username','GitHub'],['country','Country']].map(([k, label]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input className="input" value={(form as any)[k]} onChange={e => set(k, e.target.value)} />
              </div>
            ))}
          </div>
          <div>
            <label className="label">Blockchain Experience</label>
            <select className="input" value={form.blockchain_experience} onChange={e => set('blockchain_experience', e.target.value)}>
              <option value="none">None</option>
              <option value="heard">Heard of it</option>
              <option value="tried">Tried it</option>
              <option value="built">Built with it</option>
            </select>
          </div>
          <div>
            <label className="label">Goals</label>
            <textarea className="input h-20 resize-none" value={form.goals} onChange={e => set('goals', e.target.value)} />
          </div>
          <div>
            <label className="label">Hours/week: {form.hours_per_week}</label>
            <input type="range" min={5} max={40} value={form.hours_per_week}
              onChange={e => set('hours_per_week', Number(e.target.value))}
              className="w-full accent-brand-500" />
          </div>
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <button onClick={onClose} className="btn-secondary flex-1 justify-center">Cancel</button>
            <button onClick={() => mutation.mutate(form)} disabled={mutation.isPending} className="btn-primary flex-1 justify-center">
              {mutation.isPending ? 'Adding…' : 'Add Student'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
