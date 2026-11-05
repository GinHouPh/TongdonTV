'use client'

import { useState, useEffect } from 'react'
import { Download, Save, Plus, Trash2, GripVertical, ChevronDown, Search as SearchIcon, FileJson, FileSpreadsheet, FileText, Eye, X } from 'lucide-react'
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Input, Card, Checkbox, Select, Badge, Modal } from '@/components/ui'
import { useToast } from '@/components/ui/Toast'
import { cn } from '@/lib/utils'
import { EXPORT_FIELDS } from '@/types'

interface Template {
  id: string
  name: string
  fields: string[]
  createdAt: string
}

interface ExportMovie {
  id: string
  title: string
  genres: { name: string }[]
  duration: number | null
  language: string | null
  releaseDate: string | null
  voteAverage: number | null
  posterUrl: string | null
  trailerUrl: string | null
  overview: string | null
  categories: string[]
  type: string
  status: string
  source: string
  director: string | null
  actors: string | null
  popularity: number | null
}

const AVAILABLE_FIELDS = [
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
]

const FORMAT_OPTIONS = [
  { value: 'csv', label: 'CSV', icon: FileText },
  { value: 'xlsx', label: 'Excel (XLSX)', icon: FileSpreadsheet },
  { value: 'json', label: 'JSON', icon: FileJson }
]

export default function ExportPage() {
  const { addToast } = useToast()
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedFields, setSelectedFields] = useState<string[]>(['title', 'genres', 'duration', 'language', 'releaseDate', 'voteAverage', 'status'])
  const [templateName, setTemplateName] = useState('')
  const [saving, setSaving] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [previewData, setPreviewData] = useState<ExportMovie[]>([])
  const [previewLoading, setPreviewLoading] = useState(false)
  const [exporting, setExporting] = useState(false)

  const [movies, setMovies] = useState<ExportMovie[]>([])
  const [selectedMovies, setSelectedMovies] = useState<string[]>([])
  const [typeFilter, setTypeFilter] = useState<'all' | 'MOVIE' | 'TV_SHOW'>('all')
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const [format, setFormat] = useState('csv')
  const [selectAll, setSelectAll] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchTemplates()
    fetchMovies()
  }, [])

  const fetchTemplates = async () => {
    try {
      const res = await fetch('/api/templates')
      const data = await res.json()
      setTemplates(data)
    } catch {
      addToast('error', 'Failed to load templates')
    }
  }

  const fetchMovies = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('limit', '1000')
      if (typeFilter !== 'all') params.set('types', typeFilter)
      if (search) params.set('search', search)

      const res = await fetch(`/api/movies?${params}`)
      const data = await res.json()
      setMovies(data.movies || [])
    } catch {
      addToast('error', 'Failed to load movies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const debounce = setTimeout(fetchMovies, 300)
    return () => clearTimeout(debounce)
  }, [typeFilter, search])

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      setSelectedFields((items) => {
        const oldIndex = items.indexOf(active.id as string)
        const newIndex = items.indexOf(over.id as string)
        return arrayMove(items, oldIndex, newIndex)
      })
    }
  }

  const removeField = (field: string) => {
    setSelectedFields(selectedFields.filter(f => f !== field))
    setSelectedTemplate(null)
  }

  const addField = (field: string) => {
    if (!selectedFields.includes(field)) {
      setSelectedFields([...selectedFields, field])
      setSelectedTemplate(null)
    }
  }

  const saveTemplate = async () => {
    if (!templateName.trim()) {
      addToast('error', 'Please enter a template name')
      return
    }
    if (selectedFields.length === 0) {
      addToast('error', 'Please select at least one field')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: templateName, fields: selectedFields })
      })

      if (res.ok) {
        addToast('success', 'Template saved successfully')
        setTemplateName('')
        fetchTemplates()
      } else {
        addToast('error', 'Failed to save template')
      }
    } catch {
      addToast('error', 'Failed to save template')
    } finally {
      setSaving(false)
    }
  }

  const loadTemplate = (template: Template) => {
    setSelectedFields(template.fields)
    setSelectedTemplate(template.id)
  }

  const deleteTemplate = async (id: string) => {
    try {
      await fetch(`/api/templates/${id}`, { method: 'DELETE' })
      addToast('success', 'Template deleted')
      setTemplates(templates.filter(t => t.id !== id))
      if (selectedTemplate === id) setSelectedTemplate(null)
    } catch {
      addToast('error', 'Failed to delete template')
    }
  }

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMovies([])
    } else {
      setSelectedMovies(movies.map(m => m.id))
    }
    setSelectAll(!selectAll)
  }

  const toggleMovie = (id: string) => {
    setSelectedMovies(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  const handleExport = async () => {
    if (selectedFields.length === 0) {
      addToast('error', 'Please select at least one field')
      return
    }

    setExporting(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieIds: selectedMovies.length > 0 ? selectedMovies : undefined,
          fields: selectedFields,
          format,
          types: typeFilter !== 'all' ? [typeFilter] : undefined,
          search: search || undefined
        })
      })

      if (format === 'json') {
        const data = await res.json()
        setPreviewData(data.data || [])
        setPreviewOpen(true)
      } else {
        const blob = await res.blob()
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `movies-export.${format}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
        addToast('success', 'Export completed')
      }
    } catch {
      addToast('error', 'Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handlePreview = async () => {
    setPreviewLoading(true)
    setPreviewOpen(true)
    try {
      const res = await fetch('/api/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          movieIds: selectedMovies.length > 0 ? selectedMovies : undefined,
          fields: selectedFields,
          format: 'json',
          types: typeFilter !== 'all' ? [typeFilter] : undefined,
          search: search || undefined
        })
      })
      const data = await res.json()
      setPreviewData(data.data || [])
    } catch {
      addToast('error', 'Failed to load preview')
    } finally {
      setPreviewLoading(false)
    }
  }

  const getFieldLabel = (key: string) => {
    return AVAILABLE_FIELDS.find(f => f.key === key)?.label || key
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Export</h1>
          <p className="text-gray-600 dark:text-gray-400">Export your movie catalogue with custom templates</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-6">
          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Available Fields</h3>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_FIELDS.filter(f => !selectedFields.includes(f.key)).map(field => (
                <button
                  key={field.key}
                  onClick={() => addField(field.key)}
                  className="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  + {field.label}
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Selected Fields (Drag to reorder)</h3>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={selectedFields} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {selectedFields.map(field => (
                    <SortableField key={field} id={field} label={getFieldLabel(field)} onRemove={() => removeField(field)} />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Save as Template</h3>
            <div className="flex gap-2">
              <Input
                placeholder="Template name..."
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                className="flex-1"
              />
              <Button onClick={saveTemplate} loading={saving}>
                <Save className="w-4 h-4" />
              </Button>
            </div>
          </Card>

          {templates.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Saved Templates</h3>
              <div className="space-y-2">
                {templates.map(template => (
                  <div
                    key={template.id}
                    className={cn(
                      'flex items-center justify-between p-2 rounded-lg cursor-pointer',
                      selectedTemplate === template.id ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                    onClick={() => loadTemplate(template)}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{template.name}</p>
                      <p className="text-xs text-gray-500">{template.fields.length} fields</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); deleteTemplate(template.id) }} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded">
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2 space-y-6">
          <Card className="p-4">
            <div className="flex flex-wrap items-center gap-4 mb-4">
              <Select
                label="Media Type"
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'MOVIE', label: 'Movies' },
                  { value: 'TV_SHOW', label: 'TV Shows' }
                ]}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as typeof typeFilter)}
                className="w-40"
              />
              <div className="flex-1">
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search movies..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-9 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Checkbox
                  checked={selectAll}
                  onChange={handleSelectAll}
                  label={`Select All (${movies.length})`}
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedMovies.length > 0 ? `${selectedMovies.length} selected` : 'No selection = export all'}
                </span>
              </div>
            </div>
            <div className="overflow-x-auto max-h-96">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                  <tr>
                    <th className="px-4 py-3 text-left"></th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Title</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Genres</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center">Loading...</td>
                    </tr>
                  ) : movies.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-500">No movies found</td>
                    </tr>
                  ) : movies.map(movie => (
                    <tr key={movie.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                      <td className="px-4 py-3">
                        <Checkbox
                          checked={selectedMovies.includes(movie.id)}
                          onChange={() => toggleMovie(movie.id)}
                        />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {movie.posterUrl ? (
                            <img src={movie.posterUrl} alt="" className="w-8 h-12 object-cover rounded" />
                          ) : (
                            <div className="w-8 h-12 bg-gray-200 dark:bg-gray-700 rounded" />
                          )}
                          <span className="font-medium text-gray-900 dark:text-white">{movie.title}</span>
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
                            <Badge key={g.name} variant="default">{g.name}</Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {movie.voteAverage ? movie.voteAverage.toFixed(1) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-4">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Export Options</h3>
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex gap-2">
                {FORMAT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => setFormat(opt.value)}
                    className={cn(
                      'flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors',
                      format === opt.value
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-600'
                        : 'border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                    )}
                  >
                    <opt.icon className="w-4 h-4" />
                    {opt.label}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <Button variant="secondary" onClick={handlePreview} disabled={selectedFields.length === 0}>
                <Eye className="w-4 h-4" />
                Preview
              </Button>
              <Button onClick={handleExport} loading={exporting} disabled={selectedFields.length === 0}>
                <Download className="w-4 h-4" />
                Export {selectedMovies.length > 0 ? `(${selectedMovies.length})` : `(${movies.length})`}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      <Modal isOpen={previewOpen} onClose={() => setPreviewOpen(false)} title="Export Preview" size="xl">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Showing first 5 rows of {previewData.length} total records
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border border-gray-200 dark:border-gray-700 rounded-lg">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  {selectedFields.map(field => (
                    <th key={field} className="px-4 py-2 text-left text-sm font-medium text-gray-600 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      {getFieldLabel(field)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {previewLoading ? (
                  <tr>
                    <td colSpan={selectedFields.length} className="px-4 py-8 text-center">Loading...</td>
                  </tr>
                ) : previewData.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {selectedFields.map(field => (
                      <td key={field} className="px-4 py-2 text-sm text-gray-900 dark:text-white">
                        {(row as unknown as Record<string, string>)[getFieldLabel(field)] || 'N/A'}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Modal>
    </div>
  )
}

function SortableField({ id, label, onRemove }: { id: string; label: string; onRemove: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'flex items-center gap-2 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg',
        isDragging && 'opacity-50'
      )}
    >
      <button {...attributes} {...listeners} className="cursor-grab">
        <GripVertical className="w-4 h-4 text-gray-400" />
      </button>
      <span className="flex-1 text-sm text-gray-900 dark:text-white">{label}</span>
      <button onClick={onRemove} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
        <X className="w-4 h-4 text-gray-400" />
      </button>
    </div>
  )
}