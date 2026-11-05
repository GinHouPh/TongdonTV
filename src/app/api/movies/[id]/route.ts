import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const movie = await prisma.movie.findUnique({
      where: { id },
      include: { genres: true }
    })

    if (!movie) {
      return NextResponse.json({ error: 'Movie not found' }, { status: 404 })
    }

    return NextResponse.json(movie)
  } catch (error) {
    console.error('Get movie error:', error)
    return NextResponse.json({ error: 'Failed to fetch movie' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const data = await request.json()

    const movie = await prisma.movie.update({
      where: { id },
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
        type: data.type,
        status: data.status,
        categories: data.categories,
        genres: data.genreIds ? { set: data.genreIds.map((gid: string) => ({ id: gid })) } : undefined
      },
      include: { genres: true }
    })

    return NextResponse.json(movie)
  } catch (error) {
    console.error('Update movie error:', error)
    return NextResponse.json({ error: 'Failed to update movie' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await prisma.movie.update({
      where: { id },
      data: { deletedAt: new Date() }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete movie error:', error)
    return NextResponse.json({ error: 'Failed to delete movie' }, { status: 500 })
  }
}