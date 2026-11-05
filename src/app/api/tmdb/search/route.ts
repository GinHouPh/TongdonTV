import { NextRequest, NextResponse } from 'next/server'
import { searchMovies, searchTvShows } from '@/lib/tmdb'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const query = searchParams.get('q')
    const type = searchParams.get('type') || 'all'
    const page = parseInt(searchParams.get('page') || '1')

    if (!query) {
      return NextResponse.json({ error: 'Query parameter "q" is required' }, { status: 400 })
    }

    const results: { movies: unknown[]; tvShows: unknown[]; totalResults: number; totalPages: number } = {
      movies: [],
      tvShows: [],
      totalResults: 0,
      totalPages: 0
    }

    if (type === 'all' || type === 'movie') {
      const moviesResponse = await searchMovies(query, page)
      results.movies = moviesResponse.results
      results.totalResults += moviesResponse.total_results
      results.totalPages = Math.max(results.totalPages, moviesResponse.total_pages)
    }

    if (type === 'all' || type === 'tv') {
      const tvResponse = await searchTvShows(query, page)
      results.tvShows = tvResponse.results
      results.totalResults += tvResponse.total_results
      results.totalPages = Math.max(results.totalPages, tvResponse.total_pages)
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('TMDb search error:', error)
    return NextResponse.json({ error: 'Failed to search TMDb' }, { status: 500 })
  }
}