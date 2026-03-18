import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'
import api from '../lib/api'

export default function Registrations() {
  const [filter, setFilter] = useState('pending')
  const qc = useQueryClient()

  const { data: regs = [], isLoading } = useQuery({
    queryKey: ['registrations', filter],
    queryFn: () => api.get(`/registrations?status=${filter}`).then(r => r.data),
  })

  const approve = useMutation({
    mutationFn: (id: string) => api.post(`/registrations/${id}/approve`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registrations'] }),
  })

  const reject = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/registrations/${id}/reject`, { reason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['registrations'] }),
  })

  const xpMap: Record<string, string> = {
    none: 'No blockchain experience',
    heard: 'Heard of it',
    tried: 'Tried it',
    built: 'Built with it',
  }

  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Registrations</h1>
        <p className="text-gray-500 text-sm">Review and approve new students</p>
      </div>

      <div className="flex gap-2">
        {['pending', 'approved', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`btn text-xs py-1.5 ${filter === s ? 'btn-primary' : 'btn-secondary'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {isLoading ? <p className="text-gray-500">Loading…</p> :
       regs.length === 0 ? (
        <div className="card text-center py-12 text-gray-500">
          {filter === 'pending' ? '🎉 No pending registrations' : 'No registrations found'}
        </div>
       ) : (
        <div className="space-y-4">
          {regs.map((r: any) => (
            <RegistrationCard
              key={r.id}
              reg={r}
              xpMap={xpMap}
              onApprove={() => approve.mutate(r.id)}
              onReject={(reason) => reject.mutate({ id: r.id, reason })}
              isPending={filter === 'pending'}
            />
          ))}
        </div>
       )}
    </div>
  )
}

function RegistrationCard({ reg: r, xpMap, onApprove, onReject, isPending }: any) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason]       = useState('')
  const langs = JSON.parse(r.languages || '[]')

  return (
    <div className="card space-y-4">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-semibold text-white text-lg">{r.name}</p>
          <p className="text-gray-500 text-sm">{r.handle} · {r.email}</p>
          <p className="text-gray-600 text-xs mt-0.5">Submitted {new Date(r.submitted_at).toLocaleDateString('en-ZA')}</p>
        </div>
        {isPending && !rejecting && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => setRejecting(true)} className="btn-danger text-xs py-1.5 px-3">
              <XMarkIcon className="h-4 w-4" /> Reject
            </button>
            <button onClick={onApprove} className="btn-primary text-xs py-1.5 px-3">
              <CheckIcon className="h-4 w-4" /> Approve
            </button>
          </div>
        )}
        {r.status !== 'pending' && (
          <span className={`badge ${r.status === 'approved' ? 'bg-brand-900/60 text-brand-300' : 'bg-red-900/50 text-red-300'}`}>
            {r.status}
          </span>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Discord</p>
          <p className="text-gray-300">{r.discord_handle}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">GitHub</p>
          <p className="text-gray-300">{r.github_username}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Country</p>
          <p className="text-gray-300">{r.country}</p>
        </div>
        <div>
          <p className="text-gray-500 text-xs mb-0.5">Hours/week</p>
          <p className="text-gray-300">{r.hours_per_week}h</p>
        </div>
      </div>

      <div>
        <p className="text-gray-500 text-xs mb-1">Experience: <span className="text-gray-300">{xpMap[r.blockchain_experience] || r.blockchain_experience}</span></p>
        {langs.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {langs.map((l: string) => <span key={l} className="badge bg-gray-800 text-gray-300 text-xs">{l}</span>)}
          </div>
        )}
        <p className="text-gray-500 text-xs mb-0.5">Goals</p>
        <p className="text-sm text-gray-400 leading-relaxed">{r.goals}</p>
      </div>

      {r.rejection_reason && (
        <p className="text-xs text-red-400 bg-red-900/20 p-3 rounded-lg">
          Rejection reason: {r.rejection_reason}
        </p>
      )}

      {rejecting && (
        <div className="space-y-2 pt-2 border-t border-gray-800">
          <label className="label">Rejection reason (optional)</label>
          <input className="input" value={reason} onChange={e => setReason(e.target.value)}
            placeholder="Not enough experience, try again in 3 months…" />
          <div className="flex gap-2">
            <button onClick={() => setRejecting(false)} className="btn-secondary flex-1 justify-center text-xs">Cancel</button>
            <button onClick={() => onReject(reason)} className="btn-danger flex-1 justify-center text-xs">Confirm Reject</button>
          </div>
        </div>
      )}
    </div>
  )
}
