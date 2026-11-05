'use client'

import { useEffect, useState, useCallback } from 'react'
import { Search, Filter, Grid, List, Plus, Edit2, Trash2, RotateCcw, Upload, X, Star, ChevronDown } from 'lucide-react'
import { Button, Input, Badge, Card, Skeleton, Checkbox, Select, Accordion, MultiSelect, Chip, Pagination, ConfirmDialog, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { useAppStore } from '@/store'
import { formatDate, formatDuration, formatRating, cn } from '@/lib/utils'
import { Category, MediaType, PublishStatus } from '@prisma/client'

interface Genre {
  id: string
  name: string
}

interface Movie {
  id: string
  title: string
  originalTitle: string | null
  overview: string | null
  posterUrl: string | null
  duration: number | null
  language: string | null
  releaseDate: string | null
  voteAverage: number | null
  popularity: number | null
  type: MediaType
  status: PublishStatus
  categories: Category[]
  genres: Genre[]
  source: string
  actors: string | null
  director: string | null
}

interface PaginationData {
  page: number
  limit: number
  total: number
  totalPages: number
}

const LANGUAGES = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'fr', label: 'French' },
  { value: 'de', label: 'German' },
  { value: 'ja', label: 'Japanese' },
  { value: 'ko', label: 'Korean' },
  { value: 'zh', label: 'Chinese' },
  { value: 'hi', label: 'Hindi' }
]

const CATEGORIES = [
  { value: 'TRENDING', label: 'Trending' },
  { value: 'LATEST', label: 'Latest' },
  { value: 'TOP_RATED', label: 'Top Rated' }
]

const SORT_OPTIONS = [
  { value: 'createdAt-desc', label: 'Newest First' },
  { value: 'createdAt-asc', label: 'Oldest First' },
  { value: 'title-asc', label: 'Title A-Z' },
  { value: 'title-desc', label: 'Title Z-A' },
  { value: 'popularity-desc', label: 'Popularity (High to Low)' },
  { value: 'popularity-asc', label: 'Popularity (Low to High)' },
  { value: 'voteAverage-desc', label: 'Rating (High to Low)' },
  { value: 'voteAverage-asc', label: 'Rating (Low to High)' }
]

export default function CataloguePage() {
  const { addToast } = useToast()
  const { filters, setFilters, resetFilters, selectedMovies, toggleMovieSelection, selectAllMovies, clearSelection, setSelectedMovies } = useAppStore()

  const [movies, setMovies] = useState<Movie[]>([])
  const [genres, setGenres] = useState<Genre[]>([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState<PaginationData>({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; ids: string[] }>({ open: false, ids: [] })
  const [editModal, setEditModal] = useState<{ open: boolean; movie: Movie | null }>({ open: false, movie: null })

  const fetchMovies = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (filters.search) params.set('search', filters.search)
      if (filters.genres.length > 0) params.set('genres', filters.genres.join(','))
      if (filters.languages.length > 0) params.set('languages', filters.languages.join(','))
      if (filters.minRating > 0) params.set('minRating', filters.minRating.toString())
      if (filters.maxRating < 10) params.set('maxRating', filters.maxRating.toString())
      if (filters.categories.length > 0) params.set('categories', filters.categories.join(','))
      if (filters.types.length > 0) params.set('types', filters.types.join(','))
      if (filters.status !== 'ALL') params.set('status', filters.status)
      if (filters.sortBy) {
        params.set('sortBy', filters.sortBy)
        params.set('sortOrder', filters.sortOrder)
      }

      const res = await fetch(`/api/movies?${params}`)
      const data = await res.json()
      setMovies(data.movies)
      setPagination(prev => ({ ...prev, ...data.pagination }))
    } catch {
      addToast('error', 'Failed to fetch movies')
    } finally {
      setLoading(false)
    }
  }, [pagination.page, filters, addToast])

  useEffect(() => {
    fetchMovies()
  }, [fetchMovies])

  useEffect(() => {
    fetch('/api/genres')
      .then(res => res.json())
      .then(setGenres)
      .catch(console.error)
  }, [])

  const handleDelete = async () => {
    try {
      await fetch('/api/movies/bulk-delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: deleteDialog.ids })
      })
      addToast('success', `Deleted ${deleteDialog.ids.length} movie(s)`)
      clearSelection()
      fetchMovies()
    } catch {
      addToast('error', 'Failed to delete movies')
    }
    setDeleteDialog({ open: false, ids: [] })
  }

  const handleBulkPublish = async (status: PublishStatus) => {
    try {
      await fetch('/api/movies/bulk-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: selectedMovies, status })
      })
      addToast('success', `Updated ${selectedMovies.length} movie(s)`)
      clearSelection()
      fetchMovies()
    } catch {
      addToast('error', 'Failed to update movies')
    }
  }

  const handleUpdateMovie = async (data: Partial<Movie>) => {
    try {
      await fetch(`/api/movies/${editModal.movie?.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      addToast('success', 'Movie updated successfully')
      setEditModal({ open: false, movie: null })
      fetchMovies()
    } catch {
      addToast('error', 'Failed to update movie')
    }
  }

  const handleRestore = async (id: string) => {
    try {
      await fetch(`/api/movies/${id}/restore`, { method: 'POST' })
      addToast('success', 'Movie restored successfully')
      fetchMovies()
    } catch {
      addToast('error', 'Failed to restore movie')
    }
  }

  const activeFiltersCount = [
    filters.genres.length > 0,
    filters.languages.length > 0,
    filters.minRating > 0 || filters.maxRating < 10,
    filters.categories.length > 0,
    filters.types.length > 0,
    filters.status !== 'ALL'
  ].filter(Boolean).length

  const selectAll = (ids: string[]) => {
    if (selectedMovies.length === ids.length) {
      clearSelection()
    } else {
      selectAllMovies(ids)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Movie Catalogue</h1>
          <p className="text-gray-600 dark:text-gray-400">{pagination.total} items</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="secondary" onClick={() => setShowFilters(!showFilters)}>
            <Filter className="w-4 h-4" />
            Filters
            {activeFiltersCount > 0 && (
              <span className="ml-1 px-2 py-0.5 text-xs bg-blue-600 text-white rounded-full">{activeFiltersCount}</span>
            )}
          </Button>
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
            <button onClick={() => setViewMode('grid')} className={cn('p-2', viewMode === 'grid' ? 'bg-gray-200 dark:bg-gray-700' : '')}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={cn('p-2', viewMode === 'table' ? 'bg-gray-200 dark:bg-gray-700' : '')}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by title, actor, director..."
            value={filters.search}
            onChange={(e) => setFilters({ search: e.target.value })}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
        <Select
          options={SORT_OPTIONS}
          value={`${filters.sortBy}-${filters.sortOrder}`}
          onChange={(e) => {
            const [sortBy, sortOrder] = e.target.value.split('-')
            setFilters({ sortBy: sortBy as typeof filters.sortBy, sortOrder: sortOrder as typeof filters.sortOrder })
          }}
          className="w-48"
        />
      </div>

      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Active filters:</span>
          {filters.genres.map(id => {
            const genre = genres.find(g => g.id === id)
            return genre && (
              <Chip
                key={id}
                label={genre.name}
                onRemove={() => setFilters({ genres: filters.genres.filter(g => g !== id) })}
              />
            )
          })}
          {filters.languages.map(code => {
            const lang = LANGUAGES.find(l => l.value === code)
            return lang && (
              <Chip
                key={code}
                label={lang.label}
                variant="primary"
                onRemove={() => setFilters({ languages: filters.languages.filter(l => l !== code) })}
              />
            )
          })}
          {filters.categories.map(cat => (
            <Chip
              key={cat}
              label={cat.replace('_', ' ')}
              variant="success"
              onRemove={() => setFilters({ categories: filters.categories.filter(c => c !== cat) })}
            />
          ))}
          <button onClick={resetFilters} className="text-sm text-blue-600 hover:underline">
            Clear all
          </button>
        </div>
      )}

      {showFilters && (
        <Card className="p-4">
          <Accordion title="Filters" defaultOpen>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <MultiSelect
                label="Genres"
                options={genres.map(g => ({ value: g.id, label: g.name }))}
                selected={filters.genres}
                onChange={(values) => setFilters({ genres: values })}
              />
              <MultiSelect
                label="Languages"
                options={LANGUAGES}
                selected={filters.languages}
                onChange={(values) => setFilters({ languages: values })}
              />
              <MultiSelect
                label="Categories"
                options={CATEGORIES}
                selected={filters.categories}
                onChange={(values) => setFilters({ categories: values as Category[] })}
              />
            </div>
            <div className="mt-4 flex items-center gap-4">
              <Select
                label="Media Type"
                options={[{ value: '', label: 'All' }, { value: 'MOVIE', label: 'Movies' }, { value: 'TV_SHOW', label: 'TV Shows' }]}
                value={filters.types[0] || ''}
                onChange={(e) => setFilters({ types: e.target.value ? [e.target.value as MediaType] : [] })}
                className="w-40"
              />
              <Select
                label="Status"
                options={[{ value: 'ALL', label: 'All' }, { value: 'PUBLISHED', label: 'Published' }, { value: 'DRAFT', label: 'Draft' }]}
                value={filters.status}
                onChange={(e) => setFilters({ status: e.target.value as PublishStatus | 'ALL' })}
                className="w-40"
              />
            </div>
          </Accordion>
        </Card>
      )}

      {selectedMovies.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selectedMovies.length} selected
            </span>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => handleBulkPublish('PUBLISHED')}>
                Publish
              </Button>
              <Button size="sm" variant="secondary" onClick={() => handleBulkPublish('DRAFT')}>
                Unpublish
              </Button>
              <Button size="sm" variant="danger" onClick={() => setDeleteDialog({ open: true, ids: selectedMovies })}>
                <Trash2 className="w-4 h-4" />
                Delete
              </Button>
              <Button size="sm" variant="ghost" onClick={clearSelection}>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {loading ? (
        <div className={cn('grid gap-6', viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1')}>
          {[...Array(8)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-64" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-16" />
                  <Skeleton className="h-6 w-16" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : movies.length === 0 ? (
        <Card className="p-12 text-center">
          <Film className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No movies found</h3>
          <p className="text-gray-500 mt-1">Try adjusting your filters or import some movies from TMDb</p>
          <Button className="mt-4" onClick={() => window.location.href = '/dashboard/import'}>
            <Upload className="w-4 h-4" />
            Import from TMDb
          </Button>
        </Card>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {movies.map(movie => (
            <MovieCard
              key={movie.id}
              movie={movie}
              selected={selectedMovies.includes(movie.id)}
              onSelect={() => toggleMovieSelection(movie.id)}
              onEdit={() => setEditModal({ open: true, movie })}
              onDelete={() => setDeleteDialog({ open: true, ids: [movie.id] })}
            />
          ))}
        </div>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left">
                    <Checkbox
                      checked={selectedMovies.length === movies.length && movies.length > 0}
                      onChange={() => selectAll(movies.map(m => m.id))}
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Title</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Type</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Genres</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Rating</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Status</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {movies.map(movie => (
                  <tr key={movie.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                    <td className="px-4 py-3">
                      <Checkbox
                        checked={selectedMovies.includes(movie.id)}
                        onChange={() => toggleMovieSelection(movie.id)}
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {movie.posterUrl ? (
                          <img src={movie.posterUrl} alt="" className="w-10 h-14 object-cover rounded" />
                        ) : (
                          <div className="w-10 h-14 bg-gray-200 dark:bg-gray-700 rounded flex items-center justify-center">
                            <Film className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{movie.title}</p>
                          <p className="text-sm text-gray-500">{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={movie.type === 'MOVIE' ? 'info' : 'default'}>
                        {movie.type === 'MOVIE' ? 'Movie' : 'TV Show'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {movie.genres.slice(0, 2).map(g => (
                          <Badge key={g.id} variant="default">{g.name}</Badge>
                        ))}
                        {movie.genres.length > 2 && (
                          <Badge variant="default">+{movie.genres.length - 2}</Badge>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{formatRating(movie.voteAverage)}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={movie.status === 'PUBLISHED' ? 'success' : 'warning'}>
                        {movie.status === 'PUBLISHED' ? 'Published' : 'Draft'}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setEditModal({ open: true, movie })} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Edit2 className="w-4 h-4 text-gray-500" />
                        </button>
                        <button onClick={() => setDeleteDialog({ open: true, ids: [movie.id] })} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Pagination
        currentPage={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={(page) => setPagination(prev => ({ ...prev, page }))}
      />

      <ConfirmDialog
        isOpen={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, ids: [] })}
        onConfirm={handleDelete}
        title="Delete Movies"
        message={`Are you sure you want to delete ${deleteDialog.ids.length} movie(s)? This action can be undone.`}
        confirmText="Delete"
        variant="danger"
      />

      <Modal
        isOpen={editModal.open}
        onClose={() => setEditModal({ open: false, movie: null })}
        title="Edit Movie"
        size="lg"
      >
        {editModal.movie && (
          <MovieForm
            movie={editModal.movie}
            genres={genres}
            onSubmit={handleUpdateMovie}
            onCancel={() => setEditModal({ open: false, movie: null })}
          />
        )}
      </Modal>
    </div>
  )
}

import { Film } from 'lucide-react'

function MovieCard({ movie, selected, onSelect, onEdit, onDelete }: {
  movie: Movie
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <Card className="overflow-hidden group">
      <div className="relative">
        {movie.posterUrl ? (
          <img src={movie.posterUrl} alt={movie.title} className="w-full h-64 object-cover" />
        ) : (
          <div className="w-full h-64 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            <Film className="w-16 h-16 text-gray-400" />
          </div>
        )}
        <div className="absolute top-2 right-2">
          <Checkbox checked={selected} onChange={onSelect} />
        </div>
        {movie.status === 'DRAFT' && (
          <div className="absolute top-2 left-2">
            <Badge variant="warning">Draft</Badge>
          </div>
        )}
        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <button onClick={onEdit} className="p-2 bg-white rounded-full hover:bg-gray-100">
            <Edit2 className="w-5 h-5" />
          </button>
          <button onClick={onDelete} className="p-2 bg-red-600 text-white rounded-full hover:bg-red-700">
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{movie.title}</h3>
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-500">
          <span>{movie.releaseDate ? new Date(movie.releaseDate).getFullYear() : 'N/A'}</span>
          {movie.duration && <span>{formatDuration(movie.duration)}</span>}
          {movie.voteAverage && (
            <span className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              {formatRating(movie.voteAverage)}
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-1 mt-2">
          {movie.genres.slice(0, 3).map(g => (
            <Badge key={g.id} variant="default">{g.name}</Badge>
          ))}
        </div>
      </div>
    </Card>
  )
}

function MovieForm({ movie, genres, onSubmit, onCancel }: {
  movie: Movie
  genres: Genre[]
  onSubmit: (data: Partial<Movie>) => void
  onCancel: () => void
}) {
  const [form, setForm] = useState({
    title: movie.title,
    overview: movie.overview || '',
    posterUrl: movie.posterUrl || '',
    duration: movie.duration || 0,
    language: movie.language || '',
    releaseDate: movie.releaseDate ? new Date(movie.releaseDate).toISOString().split('T')[0] : '',
    voteAverage: movie.voteAverage || 0,
    popularity: movie.popularity || 0,
    director: movie.director || '',
    actors: movie.actors || '',
    status: movie.status,
    categories: movie.categories,
    genreIds: movie.genres.map(g => g.id)
  })

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(form) }} className="space-y-4">
      <Input
        label="Title"
        value={form.title}
        onChange={(e) => setForm({ ...form, title: e.target.value })}
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Overview</label>
        <textarea
          value={form.overview}
          onChange={(e) => setForm({ ...form, overview: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Poster URL"
          value={form.posterUrl}
          onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
        />
        <Input
          label="Duration (minutes)"
          type="number"
          value={form.duration}
          onChange={(e) => setForm({ ...form, duration: parseInt(e.target.value) })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Language"
          value={form.language}
          onChange={(e) => setForm({ ...form, language: e.target.value })}
        />
        <Input
          label="Release Date"
          type="date"
          value={form.releaseDate}
          onChange={(e) => setForm({ ...form, releaseDate: e.target.value })}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Rating"
          type="number"
          step="0.1"
          max="10"
          value={form.voteAverage}
          onChange={(e) => setForm({ ...form, voteAverage: parseFloat(e.target.value) })}
        />
        <Input
          label="Popularity"
          type="number"
          step="0.01"
          value={form.popularity}
          onChange={(e) => setForm({ ...form, popularity: parseFloat(e.target.value) })}
        />
      </div>
      <Input
        label="Director"
        value={form.director}
        onChange={(e) => setForm({ ...form, director: e.target.value })}
      />
      <Input
        label="Actors"
        value={form.actors}
        onChange={(e) => setForm({ ...form, actors: e.target.value })}
        placeholder="Comma-separated names"
      />
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Genres</label>
        <div className="flex flex-wrap gap-2">
          {genres.map(g => (
            <label key={g.id} className="flex items-center gap-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <Checkbox
                checked={form.genreIds.includes(g.id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm({ ...form, genreIds: [...form.genreIds, g.id] })
                  } else {
                    setForm({ ...form, genreIds: form.genreIds.filter(id => id !== g.id) })
                  }
                }}
              />
              <span className="text-sm">{g.name}</span>
            </label>
          ))}
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Categories</label>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(cat => (
            <label key={cat.value} className="flex items-center gap-1 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
              <Checkbox
                checked={form.categories.includes(cat.value as Category)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setForm({ ...form, categories: [...form.categories, cat.value as Category] })
                  } else {
                    setForm({ ...form, categories: form.categories.filter(c => c !== cat.value) })
                  }
                }}
              />
              <span className="text-sm">{cat.label}</span>
            </label>
          ))}
        </div>
      </div>
      <Select
        label="Status"
        value={form.status}
        onChange={(e) => setForm({ ...form, status: e.target.value as PublishStatus })}
        options={[{ value: 'PUBLISHED', label: 'Published' }, { value: 'DRAFT', label: 'Draft' }]}
      />
      <div className="flex justify-end gap-3 pt-4">
        <Button variant="secondary" type="button" onClick={onCancel}>Cancel</Button>
        <Button type="submit">Save Changes</Button>
      </div>
    </form>
  )
}