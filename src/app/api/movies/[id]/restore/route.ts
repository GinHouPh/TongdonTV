import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.movie.update({
      where: { id },
      data: { deletedAt: null }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Restore movie error:', error)
    return NextResponse.json({ error: 'Failed to restore movie' }, { status: 500 })
  }
}