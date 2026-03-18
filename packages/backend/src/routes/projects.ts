import { Router, Response } from 'express'
import { z } from 'zod'
import { Project } from '../models/Project'
import { Student } from '../models/Student'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── GET /projects ────────────────────────────────────────────────────────────
router.get('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const { cohort, lesson } = req.query
  const filter: any = {}
  if (cohort)  filter.cohort  = cohort
  if (lesson)  filter.lesson  = lesson

  const projects = await Project.find(filter).sort({ createdAt: -1 }).lean()

  const withStats = projects.map(p => {
    const subs      = p.submissions as any[]
    const reviewed  = subs.filter(s => s.status === 'reviewed').length
    const submitted = subs.filter(s => s.status === 'submitted').length
    return {
      ...p,
      submission_stats: {
        total: subs.length, reviewed, submitted,
        pending: subs.length - reviewed - submitted,
      },
    }
  })

  res.json(withStats)
})

// ─── GET /projects/:id ────────────────────────────────────────────────────────
router.get('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const project = await Project
    .findById(req.params.id)
    .populate('submissions.student', 'name handle level')
    .lean()

  if (!project) return res.status(404).json({ error: 'Not found' })
  res.json(project)
})

// ─── POST /projects ───────────────────────────────────────────────────────────
const createSchema = z.object({
  title:        z.string().min(2),
  description:  z.string().min(10),
  requirements: z.array(z.string()).optional().default([]),
  lesson:       z.string().optional(),
  cohort:       z.string().optional(),
  due_date:     z.string().optional(),
})

router.post('/', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const d = parsed.data

  // Auto-create pending submissions for all active students in cohort
  let submissions: any[] = []
  if (d.cohort) {
    const students = await Student.find({ cohort: d.cohort, status: 'active' }).select('_id')
    submissions = students.map(s => ({ student: s._id, status: 'pending' }))
  }

  const project = await Project.create({
    ...d,
    due_date: d.due_date ? new Date(d.due_date) : undefined,
    submissions,
  })

  res.status(201).json({ _id: project._id, message: 'Project created' })
})

// ─── PATCH /projects/:id ──────────────────────────────────────────────────────
router.patch('/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const allowed = ['title','description','requirements','due_date']
  const updates: any = {}
  for (const [k, v] of Object.entries(req.body)) {
    if (allowed.includes(k)) updates[k] = v
  }
  await Project.findByIdAndUpdate(req.params.id, { $set: updates })
  res.json({ message: 'Updated' })
})

// ─── PATCH /projects/:id/submissions/:studentId ───────────────────────────────
const reviewSchema = z.object({
  github_url:           z.string().url().optional(),
  notes:                z.string().optional(),
  score_technical:      z.number().int().min(0).max(10).optional(),
  score_security:       z.number().int().min(0).max(10).optional(),
  score_functionality:  z.number().int().min(0).max(10).optional(),
  score_quality:        z.number().int().min(0).max(10).optional(),
  feedback:             z.string().optional(),
  status:               z.enum(['pending','submitted','reviewed','overdue']).optional(),
})

router.patch('/:id/submissions/:studentId', requireAuth, async (req: AuthRequest, res: Response) => {
  const parsed = reviewSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() })

  const d    = parsed.data
  const now  = new Date()

  // Calculate total score
  let total: number | undefined
  if (d.score_technical != null && d.score_security != null &&
      d.score_functionality != null && d.score_quality != null) {
    total = Math.round((d.score_technical + d.score_security + d.score_functionality + d.score_quality) * 2.5)
  }

  const setFields: any = {}
  if (d.github_url)           setFields['submissions.$.github_url']          = d.github_url
  if (d.notes)                setFields['submissions.$.notes']               = d.notes
  if (d.score_technical    != null) setFields['submissions.$.score_technical']    = d.score_technical
  if (d.score_security     != null) setFields['submissions.$.score_security']     = d.score_security
  if (d.score_functionality!= null) setFields['submissions.$.score_functionality']= d.score_functionality
  if (d.score_quality      != null) setFields['submissions.$.score_quality']      = d.score_quality
  if (total                != null) setFields['submissions.$.total_score']        = total
  if (d.feedback)             setFields['submissions.$.feedback']             = d.feedback
  if (d.status)               setFields['submissions.$.status']               = d.status
  if (d.status === 'submitted') setFields['submissions.$.submitted_at']       = now
  if (d.status === 'reviewed')  setFields['submissions.$.reviewed_at']        = now

  // Upsert: if student has no submission yet, push one; else update
  const project = await Project.findOne({
    _id: req.params.id,
    'submissions.student': req.params.studentId,
  })

  if (project) {
    await Project.findOneAndUpdate(
      { _id: req.params.id, 'submissions.student': req.params.studentId },
      { $set: setFields }
    )
  } else {
    await Project.findByIdAndUpdate(req.params.id, {
      $push: {
        submissions: {
          student:  req.params.studentId,
          status:   d.status || 'submitted',
          ...d,
          total_score:   total,
          submitted_at:  d.status === 'submitted' ? now : undefined,
          reviewed_at:   d.status === 'reviewed'  ? now : undefined,
        },
      },
    })
  }

  res.json({ message: 'Submission updated', total_score: total })
})

export default router
