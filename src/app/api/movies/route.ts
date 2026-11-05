import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MediaType, PublishStatus, Category } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const search = searchParams.get('search') || ''
    const genres = searchParams.get('genres')?.split(',').filter(Boolean) || []
    const languages = searchParams.get('languages')?.split(',').filter(Boolean) || []
    const minRating = parseFloat(searchParams.get('minRating') || '0')
    const maxRating = parseFloat(searchParams.get('maxRating') || '10')
    const minYear = parseInt(searchParams.get('minYear') || '1900')
    const maxYear = parseInt(searchParams.get('maxYear') || '2100')
    const categories = searchParams.get('categories')?.split(',').filter(Boolean) as Category[] || []
    const types = searchParams.get('types')?.split(',').filter(Boolean) as MediaType[] || []
    const status = searchParams.get('status') as PublishStatus || null
    const includeDeleted = searchParams.get('includeDeleted') === 'true'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    const where: Record<string, unknown> = {}

    if (!includeDeleted) {
      where.deletedAt = null
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { actors: { contains: search, mode: 'insensitive' } },
        { director: { contains: search, mode: 'insensitive' } }
      ]
    }

    if (genres.length > 0) {
      where.genres = { some: { id: { in: genres } } }
    }

    if (languages.length > 0) {
      where.language = { in: languages }
    }

    if (minRating > 0 || maxRating < 10) {
      where.voteAverage = { gte: minRating, lte: maxRating }
    }

    if (minYear > 1900 || maxYear < 2100) {
      where.releaseDate = {
        gte: new Date(`${minYear}-01-01`),
        lte: new Date(`${maxYear}-12-31`)
      }
    }

    if (categories.length > 0) {
      where.categories = { hasSome: categories }
    }

    if (types.length > 0) {
      where.type = { in: types }
    }

    if (status) {
      where.status = status
    }

    const orderBy: Record<string, string> = {}
    orderBy[sortBy] = sortOrder

    const [movies, total] = await Promise.all([
      prisma.movie.findMany({
        where,
        include: { genres: true },
        orderBy,
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.movie.count({ where })
    ])

    return NextResponse.json({
      movies,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Get movies error:', error)
    return NextResponse.json({ error: 'Failed to fetch movies' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json()

    const movie = await prisma.movie.create({
      data: {
        title: data.title,
        originalTitle: data.originalTitle,
        overview: data.overview,
        posterUrl: data.posterUrl,
        backdropUrl: data.backdropUrl,
        trailerUrl: data.trailerUrl,
        duration: data.duration,
        language: data.language,
        releaseDate: data.releaseDate ? new Date(data.releaseDate) : null,
        popularity: data.popularity,
        voteAverage: data.voteAverage,
        voteCount: data.voteCount,
        actors: data.actors,
        director: data.director,
        type: data.type || 'MOVIE',
        source: data.source || 'MANUAL',
        status: data.status || 'DRAFT',
        categories: data.categories || [],
        genres: data.genreIds ? { connect: data.genreIds.map((id: string) => ({ id })) } : undefined
      },
      include: { genres: true }
    })

    return NextResponse.json(movie)
  } catch (error) {
    console.error('Create movie error:', error)
    return NextResponse.json({ error: 'Failed to create movie' }, { status: 500 })
  }
}