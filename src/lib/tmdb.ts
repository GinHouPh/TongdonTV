const TMDB_API_KEY = process.env.TMDB_API_KEY || ''
const TMDB_BASE_URL = 'https://api.themoviedb.org/3'
const TMDB_IMAGE_BASE = 'https://image.tmdb.org/t/p'

export function getImageUrl(path: string | null, size: 'w500' | 'original' = 'w500'): string | null {
  if (!path) return null
  return `${TMDB_IMAGE_BASE}/${size}${path}`
}

export interface TMDbMovieResult {
  id: number
  title: string
  original_title: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  release_date: string
  vote_average: number
  vote_count: number
  popularity: number
  original_language: string
  genre_ids: number[]
}

export interface TMDbTvResult {
  id: number
  name: string
  original_name: string
  overview: string
  poster_path: string | null
  backdrop_path: string | null
  first_air_date: string
  vote_average: number
  vote_count: number
  popularity: number
  original_language: string
  genre_ids: number[]
}

export interface TMDbSearchResponse<T> {
  page: number
  results: T[]
  total_pages: number
  total_results: number
}

export interface TMDbGenre {
  id: number
  name: string
}

export interface TMDbVideo {
  id: string
  key: string
  name: string
  site: string
  type: string
}

export interface TMDbCredits {
  cast: Array<{
    id: number
    name: string
    character: string
  }>
  crew: Array<{
    id: number
    name: string
    job: string
  }>
}

export async function searchMovies(query: string, page = 1): Promise<TMDbSearchResponse<TMDbMovieResult>> {
  const res = await fetch(
    `${TMDB_BASE_URL}/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error('Failed to search movies')
  return res.json()
}

export async function searchTvShows(query: string, page = 1): Promise<TMDbSearchResponse<TMDbTvResult>> {
  const res = await fetch(
    `${TMDB_BASE_URL}/search/tv?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${page}`,
    { next: { revalidate: 0 } }
  )
  if (!res.ok) throw new Error('Failed to search TV shows')
  return res.json()
}

export async function getMovieDetails(tmdbId: number): Promise<{
  details: TMDbMovieResult & { runtime: number; genres: TMDbGenre[] }
  videos: TMDbVideo[]
  credits: TMDbCredits
}> {
  const [detailsRes, videosRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}?api_key=${TMDB_API_KEY}`, { next: { revalidate: 0 } }),
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/videos?api_key=${TMDB_API_KEY}`, { next: { revalidate: 0 } }),
    fetch(`${TMDB_BASE_URL}/movie/${tmdbId}/credits?api_key=${TMDB_API_KEY}`, { next: { revalidate: 0 } })
  ])

  if (!detailsRes.ok) throw new Error('Failed to fetch movie details')

  const details = await detailsRes.json()
  const videos = videosRes.ok ? (await videosRes.json()).results : []
  const credits = creditsRes.ok ? await creditsRes.json() : { cast: [], crew: [] }

  return { details, videos, credits }
}

export async function getTvShowDetails(tmdbId: number): Promise<{
  details: TMDbTvResult & { episode_run_time: number[]; genres: TMDbGenre[] }
  videos: TMDbVideo[]
  credits: TMDbCredits
}> {
  const [detailsRes, videosRes, creditsRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/tv/${tmdbId}?api_key=${TMDB_API_KEY}`, { next: { revalidate: 0 } }),
    fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/videos?api_key=${TMDB_API_KEY}`, { next: { revalidate: 0 } }),
    fetch(`${TMDB_BASE_URL}/tv/${tmdbId}/credits?api_key=${TMDB_API_KEY}`, { next: { revalidate: 0 } })
  ])

  if (!detailsRes.ok) throw new Error('Failed to fetch TV show details')

  const details = await detailsRes.json()
  const videos = videosRes.ok ? (await videosRes.json()).results : []
  const credits = creditsRes.ok ? await creditsRes.json() : { cast: [], crew: [] }

  return { details, videos, credits }
}

export async function getGenres(): Promise<{ movie: TMDbGenre[]; tv: TMDbGenre[] }> {
  const [movieRes, tvRes] = await Promise.all([
    fetch(`${TMDB_BASE_URL}/genre/movie/list?api_key=${TMDB_API_KEY}`, { next: { revalidate: 3600 } }),
    fetch(`${TMDB_BASE_URL}/genre/tv/list?api_key=${TMDB_API_KEY}`, { next: { revalidate: 3600 } })
  ])

  const movie = movieRes.ok ? (await movieRes.json()).genres : []
  const tv = tvRes.ok ? (await tvRes.json()).genres : []

  return { movie, tv }
}

export function getYouTubeTrailerKey(videos: TMDbVideo[]): string | null {
  const trailer = videos.find(v => v.site === 'YouTube' && v.type === 'Trailer')
  return trailer?.key || null
}

export function formatRuntime(minutes: number): number {
  return minutes
}

export function getLanguageName(code: string): string {
  const languages: Record<string, string> = {
    en: 'English', es: 'Spanish', fr: 'French', de: 'German', it: 'Italian',
    pt: 'Portuguese', ru: 'Russian', ja: 'Japanese', ko: 'Korean',
    hi: 'Hindi', ar: 'Arabic', nl: 'Dutch', pl: 'Polish', tr: 'Turkish',
    sv: 'Swedish', da: 'Danish', no: 'Norwegian', fi: 'Finnish', th: 'Thai',
    vi: 'Vietnamese', id: 'Indonesian', ms: 'Malay', tl: 'Tagalog', he: 'Hebrew',
    cs: 'Czech', hu: 'Hungarian', ro: 'Romanian', uk: 'Ukrainian', el: 'Greek',
    zh: 'Mandarin Chinese', yue: 'Cantonese', mr: 'Marathi', te: 'Telugu', ta: 'Tamil',
    ml: 'Malayalam', kn: 'Kannada', bn: 'Bengali', pa: 'Punjabi', gu: 'Gujarati'
  }
  return languages[code] || code.toUpperCase()
}