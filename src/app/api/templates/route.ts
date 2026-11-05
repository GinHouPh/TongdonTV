import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromSession } from '@/lib/auth'

export async function GET() {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const templates = await prisma.exportTemplate.findMany({
      where: { adminId: admin.id },
      orderBy: { createdAt: 'desc' }
    })

    return NextResponse.json(templates.map(t => ({
      ...t,
      fields: JSON.parse(t.fields)
    })))
  } catch (error) {
    console.error('Get templates error:', error)
    return NextResponse.json({ error: 'Failed to fetch templates' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { name, fields } = await request.json()

    if (!name || !fields || !Array.isArray(fields)) {
      return NextResponse.json({ error: 'Name and fields array are required' }, { status: 400 })
    }

    const template = await prisma.exportTemplate.create({
      data: {
        name,
        fields: JSON.stringify(fields),
        adminId: admin.id
      }
    })

    return NextResponse.json({
      ...template,
      fields: JSON.parse(template.fields)
    })
  } catch (error) {
    console.error('Create template error:', error)
    return NextResponse.json({ error: 'Failed to create template' }, { status: 500 })
  }
}