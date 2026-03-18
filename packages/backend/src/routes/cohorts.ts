import { Router, Response } from 'express'
import { z } from 'zod'
import { Cohort } from '../models/Cohort'
import { Student } from '../models/Student'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

router.get('/', requireAuth, async (_req, res: Response) => {
  const cohorts = await Cohort.find().sort({ start_date: -1 }).lean()
  const withCounts = await Promise.all(cohorts.map(async c => ({
    ...c,
    student_count: await Student.countDocuments({ cohort: c._id, status: 'active' }),
  })))
  res.json(withCounts)
})

router.get('/:id', requireAuth, async (req, res: Response) => {
  const cohort = await Cohort.findById(req.params.id).lean()
  if (!cohort) return res.status(404).json({ error: 'Not found' })
  res.json(cohort)
})

const createSchema = z.object({
  name:       z.string().min(2),
  start_date: z.string(),
  end_date:   z.string().optional(),
  status:     z.enum(['upcoming','active','completed']).optional().default('upcoming'),
})

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })
  const cohort = await Cohort.create({
    ...parsed.data,
    start_date: new Date(parsed.data.start_date),
    end_date:   parsed.data.end_date ? new Date(parsed.data.end_date) : undefined,
  })
  res.status(201).json({ _id: cohort._id, message: 'Cohort created' })
})

router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  await Cohort.findByIdAndUpdate(req.params.id, { $set: req.body })
  res.json({ message: 'Updated' })
})

export default router
