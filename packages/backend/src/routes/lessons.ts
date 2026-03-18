import { Router, Response } from 'express'
import { z } from 'zod'
import { Lesson } from '../models/Lesson'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── GET /lessons ─────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { cohort, status } = req.query
  const filter: any = {}
  if (cohort) filter.cohort = cohort
  if (status) filter.status = status

  const lessons = await Lesson
    .find(filter)
    .populate('cohort', 'name')
    .sort({ week: 1 })
    .lean()

  const withStats = lessons.map(l => ({
    ...l,
    attendance_count: (l.attendance as any[]).filter(a => a.attended).length,
  }))

  res.json(withStats)
})

// ─── GET /lessons/:id ─────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const lesson = await Lesson
    .findById(req.params.id)
    .populate('cohort', 'name')
    .populate('attendance.student', 'name handle level')
    .lean()

  if (!lesson) return res.status(404).json({ error: 'Not found' })
  res.json(lesson)
})

// ─── POST /lessons ────────────────────────────────────────────────────────────
const createSchema = z.object({
  title:          z.string().min(2),
  week:           z.number().int().min(1),
  description:    z.string().optional(),
  objectives:     z.array(z.string()).optional().default([]),
  materials:      z.string().optional(),
  cohort:         z.string().optional(),
  scheduled_date: z.string().optional(),
  status:         z.enum(['scheduled','delivered','cancelled']).optional().default('scheduled'),
})

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const lesson = await Lesson.create({
    ...parsed.data,
    scheduled_date: parsed.data.scheduled_date ? new Date(parsed.data.scheduled_date) : undefined,
  })

  res.status(201).json({ _id: lesson._id, message: 'Lesson created' })
})

// ─── PATCH /lessons/:id ───────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const allowed = ['title','week','description','objectives','materials','scheduled_date','status','cohort']
  const updates: any = {}
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) updates[k] = v
  }

  await Lesson.findByIdAndUpdate(req.params.id, { $set: updates })
  res.json({ message: 'Updated' })
})

// ─── DELETE /lessons/:id ──────────────────────────────────────────────────────
router.delete('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  await Lesson.findByIdAndDelete(req.params.id)
  res.json({ message: 'Deleted' })
})

export default router
