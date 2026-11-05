import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getAdminFromSession } from '@/lib/auth'

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const { name, fields } = await request.json()

    const existing = await prisma.exportTemplate.findUnique({ where: { id } })
    if (!existing || existing.adminId !== admin.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    const template = await prisma.exportTemplate.update({
      where: { id },
      data: {
        name: name || existing.name,
        fields: fields ? JSON.stringify(fields) : existing.fields
      }
    })

    return NextResponse.json({
      ...template,
      fields: JSON.parse(template.fields)
    })
  } catch (error) {
    console.error('Update template error:', error)
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const admin = await getAdminFromSession()
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const existing = await prisma.exportTemplate.findUnique({ where: { id } })
    if (!existing || existing.adminId !== admin.id) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    await prisma.exportTemplate.delete({ where: { id } })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete template error:', error)
    return NextResponse.json({ error: 'Failed to delete template' }, { status: 500 })
  }
}