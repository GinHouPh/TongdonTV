'use client'

import { useState, useEffect, useCallback } from 'react'
import { Search, Film, Tv, Plus, Check, Loader2, Star, Calendar, Clock, Globe, X, AlertCircle } from 'lucide-react'
import { Button, Input, Badge, Card, Checkbox, Select } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { formatDate, formatDuration, cn } from '@/lib/utils'

interface TMDbMovie {
  id: number
  title: string
  original_title?: string
  name?: string
  original_name?: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date?: string
  first_air_date?: string
  vote_average: number
  vote_count: number
  popularity: number
  original_language: string
  genre_ids: number[]
}

interface ImportItem {
  tmdbId: number
  title: string
  type: 'MOVIE' | 'TV_SHOW'
  data: TMDbMovie
}

const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export default function ImportPage() {
  const { addToast } = useToast()
  const [query, setQuery] = useState('')
  const [type, setType] = useState<'all' | 'movie' | 'tv'>('all')
  const [searching, setSearching] = useState(false)
  const [movies, setMovies] = useState<TMDbMovie[]>([])
  const [tvShows, setTvShows] = useState<TMDbMovie[]>([])
  const [selected, setSelected] = useState<ImportItem[]>([])
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null)

  const search = useCallback(async () => {
    if (!query.trim()) return
    setSearching(true)
    setMovies([])
    setTvShows([])
    setImportResult(null)

    try {
      const res = await fetch(`/api/tmdb/search?q=${encodeURIComponent(query)}&type=${type}`)
      const data = await res.json()

      if (type === 'all') {
        setMovies(data.movies || [])
        setTvShows(data.tvShows || [])
      } else if (type === 'movie') {
        setMovies(data.results || [])
      } else {
        setTvShows(data.results || [])
      }
    } catch {
      addToast('error', 'Failed to search TMDb')
    } finally {
      setSearching(false)
    }
  }, [query, type, addToast])

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (query.length >= 2) search()
    }, 500)
    return () => clearTimeout(debounce)
  }, [query, search])

  const toggleSelect = (item: TMDbMovie, mediaType: 'MOVIE' | 'TV_SHOW') => {
    const exists = selected.find(s => s.tmdbId === item.id && s.type === mediaType)
    if (exists) {
      setSelected(selected.filter(s => !(s.tmdbId === item.id && s.type === mediaType)))
    } else {
      setSelected([...selected, { tmdbId: item.id, title: mediaType === 'MOVIE' ? item.title : item.name || '', type: mediaType, data: item }])
    }
  }

  const selectAllMovies = () => {
    const all = movies.map(m => ({ tmdbId: m.id, title: m.title, type: 'MOVIE' as const, data: m }))
    setSelected(prev => {
      const filtered = prev.filter(s => s.type !== 'MOVIE')
      return [...filtered, ...all.filter(a => !prev.some(p => p.tmdbId === a.tmdbId && p.type === 'MOVIE'))]
    })
  }

  const selectAllTv = () => {
    const all = tvShows.map(t => ({ tmdbId: t.id, title: t.name || '', type: 'TV_SHOW' as const, data: t }))
    setSelected(prev => {
      const filtered = prev.filter(s => s.type !== 'TV_SHOW')
      return [...filtered, ...all.filter(a => !prev.some(p => p.tmdbId === a.tmdbId && p.type === 'TV_SHOW'))]
    })
  }

  const handleImport = async () => {
    if (selected.length === 0) return
    setImporting(true)
    setImportResult(null)

    try {
      const res = await fetch('/api/movies/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: selected })
      })

      const result = await res.json()
      setImportResult(result)

      if (result.success > 0) {
        addToast('success', `Successfully imported ${result.success} item(s)`)
      }
      if (result.failed > 0) {
        addToast('warning', `Failed to import ${result.failed} item(s)`)
      }

      setSelected([])
    } catch {
      addToast('error', 'Import failed')
    } finally {
      setImporting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import from TMDb</h1>
        <p className="text-gray-600 dark:text-gray-400">Search and import movies or TV shows from The Movie Database</p>
      </div>

      <Card className="p-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by title, actor, or director..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>
          <Select
            options={[
              { value: 'all', label: 'All' },
              { value: 'movie', label: 'Movies' },
              { value: 'tv', label: 'TV Shows' }
            ]}
            value={type}
            onChange={(e) => setType(e.target.value as typeof type)}
            className="w-32"
          />
          <Button onClick={search} loading={searching} disabled={!query.trim()}>
            Search
          </Button>
        </div>
      </Card>

      {importResult && (
        <Card className={cn('p-4', importResult.failed > 0 ? 'border-yellow-500' : 'border-green-500')}>
          <div className="flex items-center gap-3">
            <Check className="w-5 h-5 text-green-500" />
            <div className="flex-1">
              <p className="font-medium text-gray-900 dark:text-white">
                Import complete: {importResult.success} success, {importResult.failed} failed
              </p>
              {importResult.errors.length > 0 && (
                <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                  {importResult.errors.slice(0, 5).map((err, i) => (
                    <p key={i} className="flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {err}
                    </p>
                  ))}
                  {importResult.errors.length > 5 && (
                    <p className="text-yellow-600">...and {importResult.errors.length - 5} more</p>
                  )}
                </div>
              )}
            </div>
            <button onClick={() => setImportResult(null)}>
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>
        </Card>
      )}

      {selected.length > 0 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {selected.length} item(s) selected
            </span>
            <div className="flex items-center gap-2">
              <Button onClick={handleImport} loading={importing}>
                <Plus className="w-4 h-4" />
                Import Selected
              </Button>
              <Button variant="ghost" onClick={() => setSelected([])}>
                Clear
              </Button>
            </div>
          </div>
        </Card>
      )}

      {searching ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : movies.length === 0 && tvShows.length === 0 && query.length >= 2 ? (
        <Card className="p-12 text-center">
          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No results found</h3>
          <p className="text-gray-500 mt-1">Try a different search term</p>
        </Card>
      ) : (
        <div className="space-y-8">
          {movies.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Film className="w-5 h-5" />
                  Movies ({movies.length})
                </h2>
                <Button variant="ghost" size="sm" onClick={selectAllMovies}>
                  Select All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {movies.map(movie => (
                  <TMDbCard
                    key={`movie-${movie.id}`}
                    item={movie}
                    type="MOVIE"
                    selected={selected.some(s => s.tmdbId === movie.id && s.type === 'MOVIE')}
                    onToggle={() => toggleSelect(movie, 'MOVIE')}
                  />
                ))}
              </div>
            </div>
          )}

          {tvShows.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Tv className="w-5 h-5" />
                  TV Shows ({tvShows.length})
                </h2>
                <Button variant="ghost" size="sm" onClick={selectAllTv}>
                  Select All
                </Button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {tvShows.map(show => (
                  <TMDbCard
                    key={`tv-${show.id}`}
                    item={show}
                    type="TV_SHOW"
                    selected={selected.some(s => s.tmdbId === show.id && s.type === 'TV_SHOW')}
                    onToggle={() => toggleSelect(show, 'TV_SHOW')}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function TMDbCard({ item, type, selected, onToggle }: {
  item: TMDbMovie
  type: 'MOVIE' | 'TV_SHOW'
  selected: boolean
  onToggle: () => void
}) {
  const posterUrl = item.poster_path ? `${TMDB_IMAGE_BASE}/w500${item.poster_path}` : null
  const releaseDate = type === 'MOVIE' ? item.release_date : item.first_air_date

  return (
    <Card className={cn('overflow-hidden cursor-pointer transition-all', selected && 'ring-2 ring-blue-500')}>
      <div className="relative" onClick={onToggle}>
        {posterUrl ? (
          <img src={posterUrl} alt={item.title || item.name} className="w-full h-56 object-cover" />
        ) : (
          <div className="w-full h-56 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
            {type === 'MOVIE' ? <Film className="w-12 h-12 text-gray-400" /> : <Tv className="w-12 h-12 text-gray-400" />}
          </div>
        )}
        <div className="absolute top-2 right-2">
          <div className={cn('w-6 h-6 rounded-full border-2 flex items-center justify-center', selected ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-gray-300')}>
            {selected && <Check className="w-4 h-4 text-white" />}
          </div>
        </div>
        <Badge variant={type === 'MOVIE' ? 'info' : 'default'} className="absolute top-2 left-2">
          {type === 'MOVIE' ? 'Movie' : 'TV Show'}
        </Badge>
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 dark:text-white truncate">{item.title || item.name}</h3>
        <div className="flex items-center gap-3 mt-1 text-sm text-gray-500">
          {releaseDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {releaseDate.split('-')[0]}
            </span>
          )}
          {item.vote_average > 0 && (
            <span className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              {item.vote_average.toFixed(1)}
            </span>
          )}
        </div>
        {item.overview && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{item.overview}</p>
        )}
      </div>
    </Card>
  )
}