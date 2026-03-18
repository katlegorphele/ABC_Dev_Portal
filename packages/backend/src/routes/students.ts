import { Router, Response } from 'express'
import { z } from 'zod'
import { Student } from '../models/Student'
import { Cohort } from '../models/Cohort'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── GET /students ────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { status, cohort, level } = req.query
  const filter: any = {}
  if (status) filter.status = status
  if (cohort) filter.cohort = cohort
  if (level)  filter.level  = level

  const students = await Student
    .find(filter)
    .populate('cohort', 'name')
    .sort({ joined_at: -1 })
    .lean()

  res.json(students)
})

// ─── GET /students/stats ──────────────────────────────────────────────────────
router.get('/stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  const [total, active, pending, byLevel] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Student.countDocuments({ status: 'pending' }),
    Student.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ])

  // Commercial ready: latest score has tech >= 7 AND security >= 7
  const commercialReady = await Student.countDocuments({
    status: 'active',
    scores: {
      $elemMatch: {
        technical: { $gte: 7 },
        security:  { $gte: 7 },
      },
    },
  })

  res.json({
    total, active, pending,
    commercial_ready: commercialReady,
    by_level: byLevel.map(b => ({ level: b._id, count: b.count })),
  })
})

// ─── GET /students/:id ────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const student = await Student
    .findById(req.params.id)
    .populate('cohort', 'name')
    .lean()

  if (!student) return res.status(404).json({ error: 'Student not found' })
  res.json(student)
})

// ─── POST /students ───────────────────────────────────────────────────────────
const createSchema = z.object({
  name:                  z.string().min(2),
  handle:                z.string().min(2),
  email:                 z.string().email(),
  discord_handle:        z.string().min(2),
  github_username:       z.string().min(1),
  country:               z.string().optional().default(''),
  languages:             z.array(z.string()).optional().default([]),
  blockchain_experience: z.enum(['none','heard','tried','built']).optional().default('none'),
  goals:                 z.string().optional().default(''),
  hours_per_week:        z.number().int().min(1).max(80).optional().default(10),
  cohort:                z.string().optional(),
  level:                 z.enum(['L1','L2','L3','L4']).optional().default('L1'),
})

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const d = parsed.data

  // Auto-assign to active cohort if none specified
  if (!d.cohort) {
    const activeCohort = await Cohort.findOne({ status: 'active' })
    if (activeCohort) (d as any).cohort = activeCohort._id
  }

  try {
    const handle = d.handle.startsWith('@') ? d.handle : `@${d.handle}`
    const student = await Student.create({
      ...d,
      handle,
      status:   'active',
      joined_at: new Date(),
      scores:   [{ technical: 0, security: 0, problem_solving: 0, professionalism: 0 }],
    })
    res.status(201).json({ _id: student._id, message: 'Student created' })
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email or handle already exists' })
    throw err
  }
})

// ─── PATCH /students/:id ──────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const allowed = ['name','handle','email','discord_handle','github_username','country',
    'languages','blockchain_experience','goals','hours_per_week','level',
    'status','cohort','notes','last_active']

  const updates: any = {}
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) updates[k] = v
  }

  await Student.findByIdAndUpdate(req.params.id, { $set: updates })
  res.json({ message: 'Updated' })
})

// ─── DELETE /students/:id ─────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  await Student.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})

// ─── POST /students/:id/scores ────────────────────────────────────────────────
const scoreSchema = z.object({
  technical:       z.number().int().min(0).max(10),
  security:        z.number().int().min(0).max(10),
  problem_solving: z.number().int().min(0).max(10),
  professionalism: z.number().int().min(0).max(10),
  notes:           z.string().optional(),
})

router.post('/:id/scores', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = scoreSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const { technical, security, problem_solving, professionalism, notes } = parsed.data

  // Auto-level based on scores
  let newLevel = 'L1'
  if (technical >= 8 && security >= 8)      newLevel = 'L4'
  else if (technical >= 7 && security >= 7) newLevel = 'L3'
  else if (technical >= 5 && security >= 5) newLevel = 'L2'

  const student = await Student.findByIdAndUpdate(
    req.params.id,
    {
      $push: { scores: { technical, security, problem_solving, professionalism, notes, recorded_at: new Date() } },
      $set:  { level: newLevel },
    },
    { new: true }
  )

  if (!student) return res.status(404).json({ error: 'Not found' })
  res.status(201).json({ message: 'Scores updated', level_updated_to: newLevel })
})

// ─── PATCH /students/:id/attendance ──────────────────────────────────────────
router.patch('/:id/attendance', requireAuth, async (req: AuthRequest, res: Response) => {
  const { lesson_id, attended } = req.body
  if (!lesson_id) return res.status(400).json({ error: 'lesson_id required' })

  const { Lesson } = await import('../models/Lesson')

  await Lesson.findByIdAndUpdate(lesson_id, {
    $pull: { attendance: { student: req.params.id } },
  })
  await Lesson.findByIdAndUpdate(lesson_id, {
    $push: { attendance: { student: req.params.id, attended: !!attended } },
  })

  res.json({ message: 'Attendance updated' })
})

export default router
