import { Router, Request, Response } from 'express'
import { z } from 'zod'
import { Registration } from '../models/Registration'
import { Student } from '../models/Student'
import { Cohort } from '../models/Cohort'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

const registerSchema = z.object({
  name:                  z.string().min(2),
  email:                 z.string().email(),
  handle:                z.string().min(2),
  discord_handle:        z.string().min(2),
  github_username:       z.string().min(1),
  country:               z.string().min(2),
  languages:             z.array(z.string()).min(1),
  blockchain_experience: z.enum(['none','heard','tried','built']),
  goals:                 z.string().min(20),
  hours_per_week:        z.number().int().min(5).max(80),
})

// ─── POST /registrations (public) ─────────────────────────────────────────────
router.post('/', async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten().fieldErrors })

  const d      = parsed.data
  const handle = d.handle.startsWith('@') ? d.handle : `@${d.handle}`

  const existing = await Registration.findOne({
    $or: [{ email: d.email }, { handle }],
    status: 'pending',
  })
  if (existing) return res.status(409).json({ error: 'A pending registration with this email or handle already exists' })

  const reg = await Registration.create({ ...d, handle, submitted_at: new Date() })

  res.status(201).json({
    message: "Application received! We'll review it and reach out via Discord soon.",
    _id: reg._id,
  })
})

// ─── GET /registrations (admin) ───────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const filter: any = {}
  if (req.query.status) filter.status = req.query.status
  const regs = await Registration.find(filter).sort({ submitted_at: -1 }).lean()
  res.json(regs)
})

// ─── POST /registrations/:id/approve ─────────────────────────────────────────
router.post('/:id/approve', requireAuth, async (req: AuthRequest, res: Response) => {
  const reg = await Registration.findById(req.params.id)
  if (!reg)              return res.status(404).json({ error: 'Not found' })
  if (reg.status !== 'pending') return res.status(400).json({ error: 'Not pending' })

  const cohort = await Cohort.findOne({ status: 'active' })

  try {
    const student = await Student.create({
      name:                  reg.name,
      handle:                reg.handle,
      email:                 reg.email,
      discord_handle:        reg.discord_handle,
      github_username:       reg.github_username,
      country:               reg.country,
      languages:             reg.languages,
      blockchain_experience: reg.blockchain_experience,
      goals:                 reg.goals,
      hours_per_week:        reg.hours_per_week,
      level:                 'L1',
      status:                'active',
      cohort:                cohort?._id ?? null,
      joined_at:             new Date(),
      scores:                [{ technical: 0, security: 0, problem_solving: 0, professionalism: 0 }],
    })

    await Registration.findByIdAndUpdate(req.params.id, {
      $set: { status: 'approved', reviewed_at: new Date() },
    })

    res.json({ message: 'Approved', student_id: student._id })
  } catch (err: any) {
    if (err.code === 11000) return res.status(409).json({ error: 'Email or handle already exists as a student' })
    throw err
  }
})

// ─── POST /registrations/:id/reject ──────────────────────────────────────────
router.post('/:id/reject', requireAuth, async (req: AuthRequest, res: Response) => {
  const { reason } = req.body
  const reg = await Registration.findByIdAndUpdate(
    req.params.id,
    { $set: { status: 'rejected', reviewed_at: new Date(), rejection_reason: reason || null } },
    { new: true }
  )
  if (!reg) return res.status(404).json({ error: 'Not found' })
  res.json({ message: 'Rejected' })
})

export default router
