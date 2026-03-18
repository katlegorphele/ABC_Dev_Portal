import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { connectDb } from './db/connect'
import { seedDefaults } from './db/seed'
import authRoutes         from './routes/auth'
import studentRoutes      from './routes/students'
import lessonRoutes       from './routes/lessons'
import projectRoutes      from './routes/projects'
import registrationRoutes from './routes/registrations'
import reportRoutes        from './routes/reports'
import cohortRoutes        from './routes/cohorts'

const app  = express()
const PORT = process.env.PORT || 3002

app.use(helmet())
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5174', credentials: true }))
app.use(express.json({ limit: '5mb' }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }))

app.use('/api/auth',          authRoutes)
app.use('/api/students',      studentRoutes)
app.use('/api/lessons',       lessonRoutes)
app.use('/api/projects',      projectRoutes)
app.use('/api/registrations', registrationRoutes)
app.use('/api/reports',       reportRoutes)
app.use('/api/cohorts',       cohortRoutes)

app.get('/api/health', (_req, res) => res.json({
  status: 'ok',
  service: 'ABC Dev Portal API',
  timestamp: new Date().toISOString(),
  uptime: Math.round(process.uptime()),
}))

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err)
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' })
})

async function start() {
  await connectDb()
  await seedDefaults()
  app.listen(PORT, () => {
    console.log(`
  ╔═══════════════════════════════════════════════╗
  ║   🌍  ABC Dev Portal — API                   ║
  ║   http://localhost:${PORT}                      ║
  ╚═══════════════════════════════════════════════╝
    `)
  })
}

start().catch(err => { console.error('Fatal:', err); process.exit(1) })
