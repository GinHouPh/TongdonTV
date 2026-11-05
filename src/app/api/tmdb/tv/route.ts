import { NextRequest, NextResponse } from 'next/server'
import { getTvShowDetails } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'TV show ID is required' }, { status: 400 })
    }

    const data = await getTvShowDetails(parseInt(id))
    return NextResponse.json(data)
  } catch (error) {
    console.error('TMDb TV show details error:', error)
    return NextResponse.json({ error: 'Failed to fetch TV show details' }, { status: 500 })
  }
}