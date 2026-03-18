import { Router, Response } from 'express'
import { Student } from '../models/Student'
import { Lesson } from '../models/Lesson'
import { Project } from '../models/Project'
import { Registration } from '../models/Registration'
import { requireAuth, AuthRequest } from '../middleware/auth'

const router = Router()

// ─── GET /reports/weekly ───────────────────────────────────────────────────────
// Full weekly summary — runs every Monday 9AM or on-demand
router.get('/weekly', requireAuth, async (_req: AuthRequest, res: Response) => {
  const now       = new Date()
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - 7)

  const [
    totalStudents,
    activeStudents,
    newStudents,
    pendingRegs,
    lessonsDelivered,
    projectsSubmitted,
    projectsReviewed,
    inactiveStudents,
    commercialReady,
    levelDist,
    avgScores,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Student.countDocuments({ joined_at: { $gte: weekStart } }),
    Registration.countDocuments({ status: 'pending' }),
    Lesson.countDocuments({ status: 'delivered', updatedAt: { $gte: weekStart } }),
    Project.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.submitted_at': { $gte: weekStart } } },
      { $count: 'n' },
    ]),
    Project.aggregate([
      { $unwind: '$submissions' },
      { $match: { 'submissions.reviewed_at': { $gte: weekStart } } },
      { $count: 'n' },
    ]),
    Student.find({
      status: 'active',
      $or: [
        { last_active: { $lt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000) } },
        { last_active: null },
      ],
    }).select('name handle joined_at last_active').lean(),
    Student.countDocuments({
      status: 'active',
      scores: { $elemMatch: { technical: { $gte: 7 }, security: { $gte: 7 } } },
    }),
    Student.aggregate([
      { $match: { status: 'active' } },
      { $group: { _id: '$level', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
    Student.aggregate([
      { $match: { status: 'active' } },
      { $unwind: '$scores' },
      { $sort: { 'scores.recorded_at': -1 } },
      { $group: {
        _id: '$_id',
        technical:       { $first: '$scores.technical' },
        security:        { $first: '$scores.security' },
        problem_solving: { $first: '$scores.problem_solving' },
        professionalism: { $first: '$scores.professionalism' },
      }},
      { $group: {
        _id: null,
        avg_technical:       { $avg: '$technical' },
        avg_security:        { $avg: '$security' },
        avg_problem_solving: { $avg: '$problem_solving' },
        avg_professionalism: { $avg: '$professionalism' },
      }},
    ]),
  ])

  // Top performers (score tech+sec >= 14)
  const topPerformers = await Student.aggregate([
    { $match: { status: 'active' } },
    { $addFields: { latestScore: { $last: '$scores' } } },
    { $addFields: { combined: { $add: ['$latestScore.technical', '$latestScore.security'] } } },
    { $sort: { combined: -1 } },
    { $limit: 5 },
    { $project: { name: 1, handle: 1, level: 1, latestScore: 1, combined: 1 } },
  ])

  const scores = avgScores[0] || {}

  res.json({
    generated_at:  now.toISOString(),
    period:        { from: weekStart.toISOString(), to: now.toISOString() },
    cohort: {
      total:            totalStudents,
      active:           activeStudents,
      new_this_week:    newStudents,
      pending_approval: pendingRegs,
      commercial_ready: commercialReady,
      level_distribution: levelDist.map((l: any) => ({ level: l._id, count: l.count })),
    },
    activity: {
      lessons_delivered:   lessonsDelivered,
      projects_submitted:  projectsSubmitted[0]?.n ?? 0,
      projects_reviewed:   projectsReviewed[0]?.n  ?? 0,
    },
    averages: {
      technical:       +(scores.avg_technical       ?? 0).toFixed(1),
      security:        +(scores.avg_security        ?? 0).toFixed(1),
      problem_solving: +(scores.avg_problem_solving ?? 0).toFixed(1),
      professionalism: +(scores.avg_professionalism ?? 0).toFixed(1),
    },
    alerts: {
      inactive_students: inactiveStudents,
    },
    top_performers: topPerformers,
  })
})

// ─── GET /reports/cohort-stats ─────────────────────────────────────────────────
// Aggregated stats for charts: score trends over time, level movement
router.get('/cohort-stats', requireAuth, async (_req: AuthRequest, res: Response) => {
  // Score averages over last 8 weeks (by week)
  const scoreHistory = await Student.aggregate([
    { $match: { status: 'active' } },
    { $unwind: '$scores' },
    { $group: {
      _id: {
        week: { $isoWeek: '$scores.recorded_at' },
        year: { $isoWeekYear: '$scores.recorded_at' },
      },
      avg_technical:       { $avg: '$scores.technical' },
      avg_security:        { $avg: '$scores.security' },
      avg_problem_solving: { $avg: '$scores.problem_solving' },
      count: { $sum: 1 },
    }},
    { $sort: { '_id.year': 1, '_id.week': 1 } },
    { $limit: 8 },
  ])

  // Project completion rates per project
  const projectCompletion = await Project.aggregate([
    { $project: {
      title: 1,
      total:    { $size: '$submissions' },
      reviewed: { $size: { $filter: { input: '$submissions', cond: { $eq: ['$$this.status', 'reviewed'] } } } },
      submitted:{ $size: { $filter: { input: '$submissions', cond: { $eq: ['$$this.status', 'submitted'] } } } },
    }},
    { $sort: { createdAt: 1 } },
    { $limit: 10 },
  ])

  // Lesson attendance rates
  const lessonAttendance = await Lesson.aggregate([
    { $match: { status: 'delivered' } },
    { $project: {
      title: 1,
      week:  1,
      attended: { $size: { $filter: { input: '$attendance', cond: '$$this.attended' } } },
      total:    { $size: '$attendance' },
    }},
    { $sort: { week: 1 } },
  ])

  // Student join timeline (by month)
  const joinTimeline = await Student.aggregate([
    { $group: {
      _id: {
        year:  { $year: '$joined_at' },
        month: { $month: '$joined_at' },
      },
      count: { $sum: 1 },
    }},
    { $sort: { '_id.year': 1, '_id.month': 1 } },
    { $limit: 12 },
  ])

  res.json({ scoreHistory, projectCompletion, lessonAttendance, joinTimeline })
})

// ─── GET /reports/student/:id ──────────────────────────────────────────────────
// Individual student report
router.get('/student/:id', requireAuth, async (req: AuthRequest, res: Response) => {
  const student = await Student.findById(req.params.id).lean() as any
  if (!student) return res.status(404).json({ error: 'Not found' })

  const submissions = await Project.aggregate([
    { $unwind: '$submissions' },
    { $match: { 'submissions.student': student._id } },
    { $project: {
      title: 1,
      due_date: 1,
      submission: '$submissions',
    }},
    { $sort: { 'submission.submitted_at': -1 } },
  ])

  const attendedCount = await Lesson.countDocuments({
    attendance: { $elemMatch: { student: student._id, attended: true } },
  })
  const totalDelivered = await Lesson.countDocuments({ status: 'delivered' })

  const latestScore = student.scores?.[student.scores.length - 1] || null
  const firstScore  = student.scores?.[0] || null

  const improvement = latestScore && firstScore ? {
    technical:       latestScore.technical       - firstScore.technical,
    security:        latestScore.security        - firstScore.security,
    problem_solving: latestScore.problem_solving - firstScore.problem_solving,
    professionalism: latestScore.professionalism - firstScore.professionalism,
  } : null

  const commercialReady = latestScore
    ? latestScore.technical >= 7 && latestScore.security >= 7
    : false

  res.json({
    student,
    latest_score:     latestScore,
    score_history:    student.scores,
    improvement,
    commercial_ready: commercialReady,
    attendance: {
      attended:       attendedCount,
      total_delivered: totalDelivered,
      rate:           totalDelivered > 0 ? +((attendedCount / totalDelivered) * 100).toFixed(0) : 0,
    },
    submissions,
  })
})

export default router
