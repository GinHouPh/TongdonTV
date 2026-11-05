import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Category, MediaType, PublishStatus } from '@prisma/client'

interface Filters {
  search: string
  genres: string[]
  languages: string[]
  minRating: number
  maxRating: number
  minYear: number
  maxYear: number
  categories: Category[]
  types: MediaType[]
  status: PublishStatus | 'ALL'
  sortBy: 'title' | 'popularity' | 'releaseDate' | 'voteAverage' | 'createdAt'
  sortOrder: 'asc' | 'desc'
}

interface AppState {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  darkMode: boolean
  toggleDarkMode: () => void
  filters: Filters
  setFilters: (filters: Partial<Filters>) => void
  resetFilters: () => void
  selectedMovies: string[]
  setSelectedMovies: (ids: string[]) => void
  toggleMovieSelection: (id: string) => void
  selectAllMovies: (ids: string[]) => void
  clearSelection: () => void
}

const defaultFilters: Filters = {
  search: '',
  genres: [],
  languages: [],
  minRating: 0,
  maxRating: 10,
  minYear: 1900,
  maxYear: new Date().getFullYear(),
  categories: [],
  types: [],
  status: 'ALL',
  sortBy: 'createdAt',
  sortOrder: 'desc'
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      darkMode: false,
      toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),

      filters: defaultFilters,
      setFilters: (newFilters) => set((state) => ({
        filters: { ...state.filters, ...newFilters }
      })),
      resetFilters: () => set({ filters: defaultFilters }),

      selectedMovies: [],
      setSelectedMovies: (ids) => set({ selectedMovies: ids }),
      toggleMovieSelection: (id) => set((state) => ({
        selectedMovies: state.selectedMovies.includes(id)
          ? state.selectedMovies.filter(m => m !== id)
          : [...state.selectedMovies, id]
      })),
      selectAllMovies: (ids) => set({ selectedMovies: ids }),
      clearSelection: () => set({ selectedMovies: [] })
    }),
    {
      name: 'movie-app-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        darkMode: state.darkMode
      })
    }
  )
)