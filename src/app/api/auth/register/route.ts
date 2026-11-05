import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 })
    }

    const existingAdmin = await prisma.admin.findUnique({ where: { email } })
    if (existingAdmin) {
      return NextResponse.json({ error: 'Admin already exists' }, { status: 400 })
    }

    const hashedPassword = await hashPassword(password)
    const admin = await prisma.admin.create({
      data: { email, password: hashedPassword }
    })

    return NextResponse.json({ success: true, admin: { id: admin.id, email: admin.email } })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Failed to register' }, { status: 500 })
  }
}