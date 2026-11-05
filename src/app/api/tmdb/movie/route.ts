import { NextRequest, NextResponse } from 'next/server'
import { getMovieDetails } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Movie ID is required' }, { status: 400 })
    }

    const data = await getMovieDetails(parseInt(id))
    return NextResponse.json(data)
  } catch (error) {
    console.error('TMDb movie details error:', error)
    return NextResponse.json({ error: 'Failed to fetch movie details' }, { status: 500 })
  }
}