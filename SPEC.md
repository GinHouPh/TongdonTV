# Movie Management Web Application Specification

## Tech Stack
- **Frontend**: Next.js 14 (React), TypeScript, Tailwind CSS
- **Drag & Drop**: @dnd-kit/core, @dnd-kit/sortable
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT-based admin authentication
- **External API**: TMDb (The Movie Database) API
- **File Storage**: Cloudinary for posters/trailers
- **Charts**: Recharts

---

## 1. Project Structure
```
/app
  /api
    /auth - Authentication endpoints
    /movies - Movie CRUD endpoints
    /tmdb - TMDb API proxy
    /export - Export endpoints
    /templates - Export template endpoints
  /(auth)
    /login - Login page
  /(dashboard)
    /layout.tsx - Dashboard layout with sidebar
    /page.tsx - Dashboard
    /catalogue/page.tsx - Movie catalogue
    /import/page.tsx - TMDb import
    /export/page.tsx - Export management
    /settings/page.tsx - Settings
/components
  /ui - Reusable UI components
  /movies - Movie-specific components
  /export - Export-specific components
/lib
  /db.ts - Prisma client
  /auth.ts - JWT utilities
  /tmdb.ts - TMDb API client
/prisma
  schema.prisma - Database schema
```

---

## 2. Database Schema (Prisma)

### Admin Model
```prisma
model Admin {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String?
  role      String   @default("admin")
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Movie Model
```prisma
model Movie {
  id            String    @id @default(cuid())
  tmdbId        Int?      @unique
  title         String    @db.Text
  originalTitle String?
  overview      String?   @db.Text
  posterUrl     String?
  backdropUrl   String?
  trailerUrl    String?
  duration     Int?
  language     String?
  releaseDate   DateTime?
  genres        Genre[]
  popularity   Float?
  voteAverage  Float?
  voteCount    Int?
  categories   Category[]
  type          MediaType @default(MOVIE)
  source        MediaSource @default(MANUAL)
  status        PublishStatus @default(DRAFT)
  actors        String?   @db.Text
  director      String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  deletedAt     DateTime?
}

enum MediaType {
  MOVIE
  TV_SHOW
}

enum MediaSource {
  TMDB
  MANUAL
}

enum PublishStatus {
  PUBLISHED
  DRAFT
}

enum Category {
  TRENDING
  LATEST
  TOP_RATED
}

model Genre {
  id       String  @id @default(cuid())
  name     String
  tmdbId   Int?    @unique
  movies   Movie[]
}
```

### ExportTemplate Model
```prisma
model ExportTemplate {
  id          String   @id @default(cuid())
  name        String
  fields      String   @db.Text // JSON array of field names
  adminId     String
  createdAt   DateTime @default(now())
  updatedAt  DateTime @updatedAt
}
```

---

## 3. TMDb API Integration

### Endpoints
- `GET /api/tmdb/search?q=` - Search movies/TV shows
- `GET /api/tmdb/movie/:id` - Get movie details
- `GET /api/tmdb/tv/:id` - Get TV show details

### Supported Fields from TMDb
- title, original_title, overview
- poster_path, backdrop_path
- runtime (duration)
- original_language
- release_date
- genres (mapped to local genres)
- popularity, vote_average, vote_count
- videos (YouTube trailer key)
- credits (cast, crew with director)

---

## 4. API Endpoints

### Authentication
- `POST /api/auth/login` - Login with email/password
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current admin

### Movies
- `GET /api/movies` - List all movies (with filters, pagination)
- `GET /api/movies/:id` - Get single movie
- `POST /api/movies` - Create movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Soft delete movie
- `POST /api/movies/:id/restore` - Restore deleted movie
- `POST /api/movies/bulk-delete` - Bulk delete
- `POST /api/movies/bulk-publish` - Bulk publish
- `POST /api/movies/import` - Import from TMDb

### Dashboard Stats
- `GET /api/movies/stats` - Get dashboard statistics

### Export Templates
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template

### Export
- `POST /api/export` - Export movies (CSV, XLSX, JSON)

---

## 5. UI Components

### Layout
- Collapsible sidebar (280px expanded, 64px collapsed)
- Top header with user avatar, logout
- Toast notifications (bottom-right)
- Loading skeletons

### Pages

#### Login Page
- Email input
- Password input
- Login button
- Error messages

#### Dashboard
- Stats cards: Total Movies, Total TV Shows, Published, Drafts
- Genre breakdown chart (bar chart)
- Language breakdown chart (donut chart)
- Recent imports list
- Revenue placeholder widget

#### Catalogue
- Search bar (full-text search)
- Filter panel (collapsible):
  - Genre multi-select
  - Language multi-select
  - Rating range slider
  - Release year range
  - Category multi-select
- Sort dropdown
- View toggle (grid/table)
- Movie cards:
  - Poster thumbnail
  - Title
  - Genre badges
  - Rating star
  - Category chip
  - Edit/Delete actions
- Pagination or infinite scroll
- Bulk actions toolbar

#### Import Page
- Search input
- Search results list
- Select All / Individual select
- Import button
- Progress indicator
- Toast on completion

#### Export Page
- Template Builder:
  - Available fields (draggable chips)
  - Selected fields (drop zone, sortable)
  - Save template button
- Export Execution:
  - Search/Filter movies
  - Media type selection (Movies/TV Shows/Both)
  - Template selector
  - Format selector (CSV/XLSX/JSON)
  - Preview (first 5 rows)
  - Download button

#### Settings
- Profile settings (placeholder)
- App settings (placeholder)

---

## 6. State Management
- React Query for server state
- Zustand for UI state (sidebar, filters)
- React Hook Form for forms

---

## 7. Dark Mode
- Tailwind CSS dark mode with class strategy
- Toggle in header

---

## 8. Available Export Fields
- Title
- Genre (comma-separated)
- Duration
- Language
- Release Date
- Rating
- Poster URL
- Trailer URL
- Description
- Category (comma-separated)
- Type
- Status
- Source

---

## 9. Environment Variables

```env
# Database
DATABASE_URL=

# JWT
JWT_SECRET=
JWT_EXPIRES_IN=

# TMDb
TMDB_API_KEY=

# Cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# App
NEXT_PUBLIC_APP_URL=
```