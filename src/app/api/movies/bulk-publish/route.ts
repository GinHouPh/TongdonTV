import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { PublishStatus } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    const { ids, status } = await request.json()

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: 'IDs array is required' }, { status: 400 })
    }

    if (!status || !['PUBLISHED', 'DRAFT'].includes(status)) {
      return NextResponse.json({ error: 'Valid status is required' }, { status: 400 })
    }

    await prisma.movie.updateMany({
      where: { id: { in: ids } },
      data: { status: status as PublishStatus }
    })

    return NextResponse.json({ success: true, count: ids.length })
  } catch (error) {
    console.error('Bulk publish error:', error)
    return NextResponse.json({ error: 'Failed to update movies' }, { status: 500 })
  }
}