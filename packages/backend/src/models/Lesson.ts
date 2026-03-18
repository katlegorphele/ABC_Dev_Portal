import { Schema, model, Document, Types } from 'mongoose'

export interface IAttendance {
  student:  Types.ObjectId
  attended: boolean
}

export interface ILesson extends Document {
  title:          string
  week:           number
  description?:   string
  objectives:     string[]
  materials?:     string
  cohort:         Types.ObjectId | null
  scheduled_date?: Date
  status:         'scheduled' | 'delivered' | 'cancelled'
  attendance:     IAttendance[]
}

const AttendanceSchema = new Schema<IAttendance>({
  student:  { type: Schema.Types.ObjectId, ref: 'Student', required: true },
  attended: { type: Boolean, default: true },
}, { _id: false })

const LessonSchema = new Schema<ILesson>({
  title:          { type: String, required: true },
  week:           { type: Number, required: true },
  description:    { type: String },
  objectives:     [{ type: String }],
  materials:      { type: String },
  cohort:         { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
  scheduled_date: { type: Date },
  status:         { type: String, enum: ['scheduled','delivered','cancelled'], default: 'scheduled' },
  attendance:     [AttendanceSchema],
}, { timestamps: true })

LessonSchema.index({ cohort: 1, week: 1 })

export const Lesson = model<ILesson>('Lesson', LessonSchema)
