import { Schema, model, Document } from 'mongoose'

export interface ICohort extends Document {
  name:       string
  start_date: Date
  end_date?:  Date
  status:     'upcoming' | 'active' | 'completed'
}

const CohortSchema = new Schema<ICohort>({
  name:       { type: String, required: true },
  start_date: { type: Date,   required: true },
  end_date:   { type: Date },
  status:     { type: String, enum: ['upcoming','active','completed'], default: 'upcoming' },
}, { timestamps: true })

export const Cohort = model<ICohort>('Cohort', CohortSchema)
