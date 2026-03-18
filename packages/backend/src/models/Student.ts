import { Schema, model, Document, Types } from 'mongoose'

export interface IScore {
  technical:       number
  security:        number
  problem_solving: number
  professionalism: number
  notes?:          string
  recorded_at:     Date
}

export interface IStudent extends Document {
  name:                  string
  handle:                string
  email:                 string
  discord_handle:        string
  discord_id?:           string
  github_username:       string
  country:               string
  languages:             string[]
  blockchain_experience: 'none' | 'heard' | 'tried' | 'built'
  goals:                 string
  hours_per_week:        number
  level:                 'L1' | 'L2' | 'L3' | 'L4'
  status:                'pending' | 'active' | 'inactive' | 'alumni'
  cohort:                Types.ObjectId | null
  scores:                IScore[]
  notes?:                string
  last_active?:          Date
  joined_at:             Date
}

const ScoreSchema = new Schema<IScore>({
  technical:       { type: Number, min: 0, max: 10, default: 0 },
  security:        { type: Number, min: 0, max: 10, default: 0 },
  problem_solving: { type: Number, min: 0, max: 10, default: 0 },
  professionalism: { type: Number, min: 0, max: 10, default: 0 },
  notes:           { type: String },
  recorded_at:     { type: Date, default: Date.now },
}, { _id: true })

const StudentSchema = new Schema<IStudent>({
  name:                  { type: String, required: true },
  handle:                { type: String, required: true, unique: true },
  email:                 { type: String, required: true, unique: true, lowercase: true },
  discord_handle:        { type: String, required: true },
  discord_id:            { type: String },
  github_username:       { type: String, required: true },
  country:               { type: String, default: '' },
  languages:             [{ type: String }],
  blockchain_experience: { type: String, enum: ['none','heard','tried','built'], default: 'none' },
  goals:                 { type: String, default: '' },
  hours_per_week:        { type: Number, default: 10 },
  level:                 { type: String, enum: ['L1','L2','L3','L4'], default: 'L1' },
  status:                { type: String, enum: ['pending','active','inactive','alumni'], default: 'pending' },
  cohort:                { type: Schema.Types.ObjectId, ref: 'Cohort', default: null },
  scores:                [ScoreSchema],
  notes:                 { type: String },
  last_active:           { type: Date },
  joined_at:             { type: Date, default: Date.now },
}, { timestamps: true })

StudentSchema.index({ status: 1 })
StudentSchema.index({ cohort: 1 })
StudentSchema.index({ level: 1 })

export const Student = model<IStudent>('Student', StudentSchema)
