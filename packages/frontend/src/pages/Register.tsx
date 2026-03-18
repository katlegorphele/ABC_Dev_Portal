import { useState, FormEvent } from 'react'
import api from '../lib/api'

const LANGUAGES = ['JavaScript','TypeScript','Python','Rust','Go','Java','C++','Solidity','Other']
const EXPERIENCE = [
  { value: 'none',  label: "I'm new to blockchain" },
  { value: 'heard', label: "I've heard of it but haven't built" },
  { value: 'tried', label: "I've tried some tutorials" },
  { value: 'built', label: "I've built something with blockchain" },
]

export default function Register() {
  const [step, setStep]       = useState(1)
  const [done, setDone]       = useState(false)
  const [error, setError]     = useState('')
  const [loading, setLoading] = useState(false)

  const [form, setForm] = useState({
    name: '', email: '', handle: '', discord_handle: '', github_username: '',
    country: '', languages: [] as string[], blockchain_experience: 'none',
    goals: '', hours_per_week: 10,
  })

  function set(k: string, v: any) { setForm(f => ({ ...f, [k]: v })) }

  function toggleLang(lang: string) {
    setForm(f => ({
      ...f,
      languages: f.languages.includes(lang)
        ? f.languages.filter(l => l !== lang)
        : [...f.languages, lang]
    }))
  }

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError(''); setLoading(true)
    try {
      await api.post('/registrations', form)
      setDone(true)
    } catch (err: any) {
      const e = err.response?.data?.error
      if (typeof e === 'string') setError(e)
      else if (typeof e === 'object') setError(Object.values(e).flat().join(', '))
      else setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (done) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <span className="text-6xl">🎉</span>
        <h1 className="text-2xl font-bold text-white mt-4">Application Submitted!</h1>
        <p className="text-gray-400 mt-2 leading-relaxed">
          Thanks {form.name.split(' ')[0]}! We'll review your application and reach out on Discord soon.
        </p>
        <p className="text-gray-600 text-sm mt-4">Africa's Blockchain Club — Dev Training Programme</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <span className="text-4xl">🌍</span>
          <h1 className="text-2xl font-bold text-white mt-3">Join ABC Dev Training</h1>
          <p className="text-gray-500 text-sm mt-1">Africa's Blockchain Club — 16-Week Developer Programme</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2 mb-6">
          {[1,2,3].map(s => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                step >= s ? 'bg-brand-600 text-white' : 'bg-gray-800 text-gray-500'
              }`}>{s}</div>
              {s < 3 && <div className={`flex-1 h-0.5 ${step > s ? 'bg-brand-600' : 'bg-gray-800'}`} />}
            </div>
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-500 mb-6 px-1">
          <span>Personal Info</span><span>Background</span><span>Goals</span>
        </div>

        <form onSubmit={submit} className="card space-y-4">
          {/* Step 1: Personal */}
          {step === 1 && <>
            <h2 className="font-semibold text-white">Personal Information</h2>
            {[
              ['name','Full Name','text','Amara Osei'],
              ['email','Email','email','amara@example.com'],
              ['handle','Handle','text','@amara (your preferred nickname)'],
              ['discord_handle','Discord Username','text','amara#1234'],
              ['github_username','GitHub Username','text','amaradev'],
              ['country','Country','text','Ghana'],
            ].map(([k, label, type, placeholder]) => (
              <div key={k}>
                <label className="label">{label}</label>
                <input className="input" type={type} placeholder={placeholder}
                  value={(form as any)[k]} onChange={e => set(k, e.target.value)} required />
              </div>
            ))}
            <button type="button" onClick={() => setStep(2)} className="btn-primary w-full justify-center py-2.5">
              Continue →
            </button>
          </>}

          {/* Step 2: Background */}
          {step === 2 && <>
            <h2 className="font-semibold text-white">Technical Background</h2>
            <div>
              <label className="label">Programming Languages (select all you know)</label>
              <div className="flex flex-wrap gap-2 mt-1">
                {LANGUAGES.map(l => (
                  <button key={l} type="button" onClick={() => toggleLang(l)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors border ${
                      form.languages.includes(l)
                        ? 'bg-brand-900/60 text-brand-300 border-brand-700'
                        : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-gray-600'
                    }`}>{l}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="label">Blockchain Experience</label>
              <div className="space-y-2">
                {EXPERIENCE.map(({ value, label }) => (
                  <label key={value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    form.blockchain_experience === value
                      ? 'bg-brand-900/40 border-brand-700 text-brand-300'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-600'
                  }`}>
                    <input type="radio" name="xp" value={value} checked={form.blockchain_experience === value}
                      onChange={() => set('blockchain_experience', value)} className="accent-brand-500" />
                    <span className="text-sm">{label}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(1)} className="btn-secondary flex-1 justify-center">← Back</button>
              <button type="button" onClick={() => setStep(3)} className="btn-primary flex-1 justify-center">Continue →</button>
            </div>
          </>}

          {/* Step 3: Goals */}
          {step === 3 && <>
            <h2 className="font-semibold text-white">Goals & Commitment</h2>
            <div>
              <label className="label">What do you want to build with blockchain?</label>
              <textarea className="input h-32 resize-none" required
                placeholder="I want to build a DeFi protocol for African remittances that helps people send money home without high fees…"
                value={form.goals} onChange={e => set('goals', e.target.value)} />
              <p className="text-xs text-gray-600 mt-1">Minimum 20 characters. Be specific!</p>
            </div>
            <div>
              <label className="label">Hours available per week: <span className="text-brand-400 font-bold">{form.hours_per_week}h</span></label>
              <input type="range" min={5} max={40} value={form.hours_per_week}
                onChange={e => set('hours_per_week', Number(e.target.value))}
                className="w-full accent-brand-500 mt-1" />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>5h (minimum)</span><span>40h</span>
              </div>
            </div>
            <div className="p-3 bg-brand-900/20 border border-brand-800/40 rounded-lg">
              <p className="text-sm text-brand-300 font-medium">📋 Programme Commitment</p>
              <ul className="text-xs text-gray-400 mt-1.5 space-y-1">
                <li>• 16-week structured curriculum</li>
                <li>• Office hours: Every Thursday 8PM SAST</li>
                <li>• Minimum 10 hours/week recommended</li>
                <li>• Complete projects & code reviews</li>
              </ul>
            </div>
            {error && <p className="text-red-400 text-sm">{error}</p>}
            <div className="flex gap-3">
              <button type="button" onClick={() => setStep(2)} className="btn-secondary flex-1 justify-center">← Back</button>
              <button type="submit" disabled={loading} className="btn-primary flex-1 justify-center py-2.5">
                {loading ? 'Submitting…' : '🚀 Apply Now'}
              </button>
            </div>
          </>}
        </form>
      </div>
    </div>
  )
}
