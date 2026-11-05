import { Category, MediaSource, MediaType, PublishStatus } from '@prisma/client'

export type { Category, MediaSource, MediaType, PublishStatus }

export interface Movie {
  id: string
  tmdbId: number | null
  title: string
  originalTitle: string | null
  overview: string | null
  posterUrl: string | null
  backdropUrl: string | null
  trailerUrl: string | null
  duration: number | null
  language: string | null
  releaseDate: Date | null
  popularity: number | null
  voteAverage: number | null
  voteCount: number | null
  actors: string | null
  director: string | null
  type: MediaType
  source: MediaSource
  status: PublishStatus
  categories: Category[]
  genres: Genre[]
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export interface Genre {
  id: string
  name: string
  tmdbId: number | null
}

export interface Admin {
  id: string
  email: string
  name: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}

export interface ExportTemplate {
  id: string
  name: string
  fields: string[]
  adminId: string
  createdAt: Date
  updatedAt: Date
}

export interface MovieFilters {
  search?: string
  genres?: string[]
  languages?: string[]
  minRating?: number
  maxRating?: number
  minYear?: number
  maxYear?: number
  categories?: Category[]
  types?: MediaType[]
  status?: PublishStatus
  includeDeleted?: boolean
}

export interface MovieStats {
  totalMovies: number
  totalTvShows: number
  totalPublished: number
  totalDrafts: number
  genreBreakdown: { name: string; count: number }[]
  languageBreakdown: { name: string; count: number }[]
  recentImports: Movie[]
}

export const EXPORT_FIELDS = [
  { key: 'title', label: 'Title' },
  { key: 'genres', label: 'Genre' },
  { key: 'duration', label: 'Duration' },
  { key: 'language', label: 'Language' },
  { key: 'releaseDate', label: 'Release Date' },
  { key: 'voteAverage', label: 'Rating' },
  { key: 'posterUrl', label: 'Poster URL' },
  { key: 'trailerUrl', label: 'Trailer URL' },
  { key: 'overview', label: 'Description' },
  { key: 'categories', label: 'Category' },
  { key: 'type', label: 'Type' },
  { key: 'status', label: 'Status' },
  { key: 'source', label: 'Source' },
  { key: 'director', label: 'Director' },
  { key: 'actors', label: 'Actors' },
  { key: 'popularity', label: 'Popularity' }
] as const

export type ExportFieldKey = typeof EXPORT_FIELDS[number]['key']