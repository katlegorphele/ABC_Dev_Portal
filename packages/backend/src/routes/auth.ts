import { Router, Request, Response } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'

const router = Router()

const loginSchema = z.object({
  email:    z.string().email(),
  password: z.string().min(1),
})

router.post('/login', async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'Invalid input' })

  const { email, password } = parsed.data
  const adminEmail = process.env.ADMIN_EMAIL
  const adminPass  = process.env.ADMIN_PASSWORD

  if (email !== adminEmail) return res.status(401).json({ error: 'Invalid credentials' })

  // Support plain (dev) or bcrypt hash (prod)
  const valid = adminPass?.startsWith('$2')
    ? await bcrypt.compare(password, adminPass)
    : password === adminPass

  if (!valid) return res.status(401).json({ error: 'Invalid credentials' })

  const token = jwt.sign(
    { id: 'admin', email, role: 'admin' },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  )

  res.json({ token, email, role: 'admin' })
})

export default router
