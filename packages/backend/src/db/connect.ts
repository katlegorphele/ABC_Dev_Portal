import mongoose from 'mongoose'

export async function connectDb() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI not set in .env')

  mongoose.connection.on('connected',    () => console.log('✅ MongoDB connected'))
  mongoose.connection.on('disconnected', () => console.log('⚠️  MongoDB disconnected'))
  mongoose.connection.on('error',  err  => console.error('❌ MongoDB error:', err))

  await mongoose.connect(uri, { dbName: process.env.MONGODB_DB || 'abc_portal' })
}
