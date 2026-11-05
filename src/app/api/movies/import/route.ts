import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getMovieDetails, getTvShowDetails, getYouTubeTrailerKey, getImageUrl } from '@/lib/tmdb'

export async function POST(request: NextRequest) {
  try {
    const { items } = await request.json()

    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Items array is required' }, { status: 400 })
    }

    const results = { success: 0, failed: 0, errors: [] as string[] }

    for (const item of items) {
      try {
        const existingMovie = await prisma.movie.findFirst({
          where: { tmdbId: item.tmdbId }
        })

        if (existingMovie) {
          results.failed++
          results.errors.push(`"${item.title}" already exists`)
          continue
        }

        if (item.type === 'MOVIE') {
          const { details, videos, credits } = await getMovieDetails(item.tmdbId)

          const director = credits.crew.find(c => c.job === 'Director')?.name || null
          const actors = credits.cast.slice(0, 10).map(c => c.name).join(', ')
          const trailerKey = getYouTubeTrailerKey(videos)

          const genreNames = details.genres?.map(g => g.name) || []
          const genreConnections = await Promise.all(
            genreNames.map(async (name) => {
              let genre = await prisma.genre.findFirst({ where: { name } })
              if (!genre) {
                const tmdbGenre = details.genres?.find(g => g.name === name)
                genre = await prisma.genre.create({
                  data: { name, tmdbId: tmdbGenre?.id || null }
                })
              }
              return genre.id
            })
          )

          await prisma.movie.create({
            data: {
              tmdbId: details.id,
              title: details.title,
              originalTitle: details.original_title,
              overview: details.overview,
              posterUrl: getImageUrl(details.poster_path),
              backdropUrl: getImageUrl(details.backdrop_path, 'original'),
              trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
              duration: details.runtime || null,
              language: details.original_language,
              releaseDate: details.release_date ? new Date(details.release_date) : null,
              popularity: details.popularity,
              voteAverage: details.vote_average,
              voteCount: details.vote_count,
              actors,
              director,
              type: 'MOVIE',
              source: 'TMDB',
              status: 'DRAFT',
              categories: [],
              genres: { connect: genreConnections.map(id => ({ id })) }
            }
          })

          results.success++
        } else {
          const { details, videos, credits } = await getTvShowDetails(item.tmdbId)

          const creator = credits.crew.find(c => c.job === 'Creator' || c.job === 'Executive Producer')?.name || null
          const actors = credits.cast.slice(0, 10).map(c => c.name).join(', ')
          const trailerKey = getYouTubeTrailerKey(videos)

          const genreNames = details.genres?.map(g => g.name) || []
          const genreConnections = await Promise.all(
            genreNames.map(async (name) => {
              let genre = await prisma.genre.findFirst({ where: { name } })
              if (!genre) {
                const tmdbGenre = details.genres?.find(g => g.name === name)
                genre = await prisma.genre.create({
                  data: { name, tmdbId: tmdbGenre?.id || null }
                })
              }
              return genre.id
            })
          )

          await prisma.movie.create({
            data: {
              tmdbId: details.id,
              title: details.name,
              originalTitle: details.original_name,
              overview: details.overview,
              posterUrl: getImageUrl(details.poster_path),
              backdropUrl: getImageUrl(details.backdrop_path, 'original'),
              trailerUrl: trailerKey ? `https://www.youtube.com/watch?v=${trailerKey}` : null,
              duration: details.episode_run_time?.[0] || null,
              language: details.original_language,
              releaseDate: details.first_air_date ? new Date(details.first_air_date) : null,
              popularity: details.popularity,
              voteAverage: details.vote_average,
              voteCount: details.vote_count,
              actors,
              director: creator,
              type: 'TV_SHOW',
              source: 'TMDB',
              status: 'DRAFT',
              categories: [],
              genres: { connect: genreConnections.map(id => ({ id })) }
            }
          })

          results.success++
        }
      } catch (itemError) {
        results.failed++
        results.errors.push(`Failed to import "${item.title}": ${itemError instanceof Error ? itemError.message : 'Unknown error'}`)
      }
    }

    return NextResponse.json(results)
  } catch (error) {
    console.error('Import error:', error)
    return NextResponse.json({ error: 'Failed to import movies' }, { status: 500 })
  }
}