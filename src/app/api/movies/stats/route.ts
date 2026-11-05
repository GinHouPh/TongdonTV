import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET() {
  try {
    const [totalMovies, totalTvShows, totalPublished, totalDrafts, moviesWithGenres, languageStats, recentImports] = await Promise.all([
      prisma.movie.count({ where: { type: 'MOVIE', deletedAt: null } }),
      prisma.movie.count({ where: { type: 'TV_SHOW', deletedAt: null } }),
      prisma.movie.count({ where: { status: 'PUBLISHED', deletedAt: null } }),
      prisma.movie.count({ where: { status: 'DRAFT', deletedAt: null } }),
      prisma.movie.findMany({
        where: { deletedAt: null },
        select: { genres: { select: { name: true } } }
      }),
      prisma.movie.groupBy({
        by: ['language'],
        where: { deletedAt: null, language: { not: null } },
        _count: true
      }),
      prisma.movie.findMany({
        where: { source: 'TMDB', deletedAt: null },
        include: { genres: true },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ])

    const genreCountMap: Record<string, number> = {}
    moviesWithGenres.forEach(movie => {
      movie.genres.forEach(genre => {
        genreCountMap[genre.name] = (genreCountMap[genre.name] || 0) + 1
      })
    })

    const genreBreakdown = Object.entries(genreCountMap)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    const languageBreakdown = languageStats
      .filter(l => l.language)
      .map(l => ({ name: l.language || 'Unknown', count: l._count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return NextResponse.json({
      totalMovies,
      totalTvShows,
      totalPublished,
      totalDrafts,
      genreBreakdown,
      languageBreakdown,
      recentImports
    })
  } catch (error) {
    console.error('Stats error:', error)
    return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 })
  }
}