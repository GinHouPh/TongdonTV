import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest) {
  try {
    const { ids } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 })
    }

    await prisma.movie.updateMany({
      where: { id: { in: ids } },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Bulk delete error:', error)
    return NextResponse.json({ error: 'Failed to delete movies' }, { status: 500 })
  }
}