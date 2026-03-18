export type StudentLevel = 'L1' | 'L2' | 'L3' | 'L4'
export type StudentStatus = 'pending' | 'active' | 'inactive' | 'alumni'
export type LessonStatus = 'scheduled' | 'delivered' | 'cancelled'
export type SubmissionStatus = 'pending' | 'submitted' | 'reviewed' | 'overdue'

export interface Student {
  id: string
  name: string
  handle: string
  email: string
  discord_handle: string
  discord_id?: string
  github_username: string
  country: string
  languages: string           // JSON array
  blockchain_experience: string
  goals: string
  hours_per_week: number
  level: StudentLevel
  status: StudentStatus
  cohort_id?: string
  joined_at: string
  last_active?: string
  notes?: string
}

export interface Scores {
  id: string
  student_id: string
  technical: number
  security: number
  problem_solving: number
  professionalism: number
  recorded_at: string
  notes?: string
}

export interface Cohort {
  id: string
  name: string
  start_date: string
  end_date?: string
  status: 'active' | 'completed' | 'upcoming'
}

export interface Lesson {
  id: string
  title: string
  week: number
  description?: string
  objectives: string          // JSON array
  materials?: string
  cohort_id?: string
  scheduled_date?: string
  status: LessonStatus
  created_at: string
}

export interface Project {
  id: string
  lesson_id?: string
  title: string
  description: string
  requirements: string        // JSON array
  due_date?: string
  cohort_id?: string
  created_at: string
}

export interface Submission {
  id: string
  project_id: string
  student_id: string
  github_url?: string
  notes?: string
  score_technical?: number
  score_security?: number
  score_functionality?: number
  score_quality?: number
  total_score?: number
  feedback?: string
  status: SubmissionStatus
  submitted_at?: string
  reviewed_at?: string
}

export interface Attendance {
  lesson_id: string
  student_id: string
  attended: boolean
}

export interface Registration {
  id: string
  name: string
  email: string
  handle: string
  discord_handle: string
  github_username: string
  country: string
  languages: string
  blockchain_experience: string
  goals: string
  hours_per_week: number
  status: 'pending' | 'approved' | 'rejected'
  submitted_at: string
  reviewed_at?: string
  rejection_reason?: string
}

export interface JWTPayload {
  id: string
  email: string
  role: 'admin'
}
