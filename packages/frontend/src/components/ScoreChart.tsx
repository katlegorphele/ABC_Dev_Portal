import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ReferenceLine,
} from 'recharts'

interface Score {
  technical:       number
  security:        number
  problem_solving: number
  professionalism: number
  recorded_at:     string
}

interface Props {
  scores: Score[]
}

export default function ScoreChart({ scores }: Props) {
  if (!scores || scores.length < 2) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-600 text-sm">
        Need at least 2 score entries to show trend
      </div>
    )
  }

  const data = scores.map((s, i) => ({
    name:            i === 0 ? 'Start' : `#${i + 1}`,
    date:            new Date(s.recorded_at).toLocaleDateString('en-ZA', { day: 'numeric', month: 'short' }),
    Technical:       s.technical,
    Security:        s.security,
    'Problem Solving': s.problem_solving,
    Professionalism: s.professionalism,
  }))

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
        <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 11 }} />
        <YAxis domain={[0, 10]} tick={{ fill: '#6b7280', fontSize: 11 }} ticks={[0,2,4,6,7,8,10]} />
        <ReferenceLine y={7} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Commercial', fill: '#4b5563', fontSize: 10 }} />
        <Tooltip
          contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: 8 }}
          labelStyle={{ color: '#f9fafb', fontSize: 12 }}
          formatter={(v: any) => [`${v}/10`]}
        />
        <Legend wrapperStyle={{ paddingTop: 12, fontSize: 12 }} />
        <Line type="monotone" dataKey="Technical"       stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Security"        stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Problem Solving" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
        <Line type="monotone" dataKey="Professionalism" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
