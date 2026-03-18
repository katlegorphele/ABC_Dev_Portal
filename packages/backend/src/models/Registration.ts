import { Schema, model, Document } from 'mongoose'

export interface IRegistration extends Document {
  name:                  string
  email:                 string
  handle:                string
  discord_handle:        string
  github_username:       string
  country:               string
  languages:             string[]
  blockchain_experience: 'none' | 'heard' | 'tried' | 'built'
  goals:                 string
  hours_per_week:        number
  status:                'pending' | 'approved' | 'rejected'
  submitted_at:          Date
  reviewed_at?:          Date
  rejection_reason?:     string
}

const RegistrationSchema = new Schema<IRegistration>({
  name:                  { type: String, required: true },
  email:                 { type: String, required: true, lowercase: true },
  handle:                { type: String, required: true },
  discord_handle:        { type: String, required: true },
  github_username:       { type: String, required: true },
  country:               { type: String, default: '' },
  languages:             [{ type: String }],
  blockchain_experience: { type: String, enum: ['none','heard','tried','built'], default: 'none' },
  goals:                 { type: String, default: '' },
  hours_per_week:        { type: Number, default: 10 },
  status:                { type: String, enum: ['pending','approved','rejected'], default: 'pending' },
  submitted_at:          { type: Date, default: Date.now },
  reviewed_at:           { type: Date },
  rejection_reason:      { type: String },
}, { timestamps: true })

RegistrationSchema.index({ status: 1 })
RegistrationSchema.index({ email: 1 })

export const Registration = model<IRegistration>('Registration', RegistrationSchema)
