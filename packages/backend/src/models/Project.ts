import { Schema, model, Document, Types } from 'mongoose'

export interface ISubmission {
  _id:                 Types.ObjectId
  student:             Types.ObjectId
  github_url?:         string
  notes?:              string
  score_technical?:    number
  score_security?:     number
  score_functionality?:number
  score_quality?:      number
  total_score?:        number
  feedback?:           string
  status:              'pending' | 'submitted' | 'reviewed' | 'overdue'
  submitted_at?:       Date
  reviewed_at?:        Date
}

export interface IProject extends Document {
  title:        string
  description:  string
  requirements: string[]
  lesson:       Types.ObjectId | null
  cohort:       Types.ObjectId | null
  due_date?:    Date
  submissions:  ISubmission[]
}

const SubmissionSchema = new Schema<ISubmission>({
  student:              { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  github_url:           { type: String },
  notes:                { type: String },
  score_technical:      { type: Number, min: 0, max: 10 },
  score_security:       { type: Number, min: 0, max: 10 },
  score_functionality:  { type: Number, min: 0, max: 10 },
  score_quality:        { type: Number, min: 0, max: 10 },
  total_score:          { type: Number, min: 0, max: 100 },
  feedback:             { type: String },
  status:               { type: String, enum: ['pending','submitted','reviewed','overdue'], default: 'pending' },
  submitted_at:         { type: Date },
  reviewed_at:          { type: Date },
})

const ProjectSchema = new Schema<IProject>({
  title:        { type: String, required: true },
  description:  { type: String, required: true },
  requirements: [{ type: String }],
  lesson:       { type: Schema.Types.ObjectId, ref: 'Lesson', default: null },
  cohort:       { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
  due_date:     { type: Date },
  submissions:  [SubmissionSchema],
}, { timestamps: true })

ProjectSchema.index({ cohort: 1 })
ProjectSchema.index({ lesson: 1 })

export const Project = model<IProject>('Project', ProjectSchema)
