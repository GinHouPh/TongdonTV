import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { MediaType, PublishStatus, Category } from '@prisma/client'
import * as XLSX from 'xlsx'

export async function POST(request: NextRequest) {
  try {
    const { movieIds, fields, format, types, search } = await request.json()

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: 'Fields are required' }, { status: 400 })
    }

    if (!format || !['csv', 'xlsx', 'json'].includes(format)) {
      return NextResponse.json({ error: 'Valid format (csv, xlsx, json) is required' }, { status: 400 })
    }

    const where: Record<string, unknown> = { deletedAt: null }

    if (movieIds && movieIds.length > 0) {
      where.id = { in: movieIds }
    }

    if (types && types.length > 0) {
      where.type = { in: types as MediaType[] }
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { actors: { contains: search, mode: 'insensitive' } },
        { director: { contains: search, mode: 'insensitive' } }
      ]
    }

    const movies = await prisma.movie.findMany({
      where,
      include: { genres: true },
      orderBy: { title: 'asc' }
    })

    const transformValue = (movie: typeof movies[0], field: string): string => {
      switch (field) {
        case 'title':
          return movie.title
        case 'genres':
          return movie.genres.map(g => g.name).join(', ')
        case 'duration':
          return movie.duration ? `${movie.duration} min` : ''
        case 'language':
          return movie.language || ''
        case 'releaseDate':
          return movie.releaseDate ? new Date(movie.releaseDate).toLocaleDateString() : ''
        case 'voteAverage':
          return movie.voteAverage ? movie.voteAverage.toFixed(1) : ''
        case 'posterUrl':
          return movie.posterUrl || ''
        case 'trailerUrl':
          return movie.trailerUrl || ''
        case 'overview':
          return movie.overview || ''
        case 'categories':
          return movie.categories.join(', ')
        case 'type':
          return movie.type === 'MOVIE' ? 'Movie' : 'TV Show'
        case 'status':
          return movie.status === 'PUBLISHED' ? 'Published' : 'Draft'
        case 'source':
          return movie.source === 'TMDB' ? 'TMDb' : 'Manual'
        case 'director':
          return movie.director || ''
        case 'actors':
          return movie.actors || ''
        case 'popularity':
          return movie.popularity ? movie.popularity.toFixed(2) : ''
        default:
          return ''
      }
    }

    const headers = fields.map((f: string) => f.charAt(0).toUpperCase() + f.slice(1).replace(/([A-Z])/g, ' $1'))

    if (format === 'json') {
      const data = movies.map(movie => {
        const obj: Record<string, string> = {}
        fields.forEach((field: string, i: number) => {
          obj[headers[i]] = transformValue(movie, field)
        })
        return obj
      })

      return NextResponse.json({ data })
    }

    const rows = movies.map(movie => fields.map((field: string) => transformValue(movie, field)))

    if (format === 'csv') {
      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      ].join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="movies-export.csv"'
        }
      })
    }

    if (format === 'xlsx') {
      const wsData = [headers, ...rows]
      const ws = XLSX.utils.aoa_to_sheet(wsData)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Movies')

      const buffer = XLSX.write(wb, { bookType: 'xlsx', type: 'buffer' })

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': 'attachment; filename="movies-export.xlsx"'
        }
      })
    }

    return NextResponse.json({ error: 'Invalid format' }, { status: 400 })
  } catch (error) {
    console.error('Export error:', error)
    return NextResponse.json({ error: 'Failed to export movies' }, { status: 500 })
  }
}