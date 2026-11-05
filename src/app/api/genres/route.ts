import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const genres = await prisma.genre.findMany({
      orderBy: { name: 'asc' }
    })

    return NextResponse.json(genres)
  } catch (error) {
    console.error('Get genres error:', error)
    return NextResponse.json({ error: 'Failed to fetch genres' }, { status: 500 })
  }
}