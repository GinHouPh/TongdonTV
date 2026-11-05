# Movie Management Web Application

A comprehensive movie and TV show management system built with Next.js, PostgreSQL, and TMDb API integration.

## Features

- **TMDb API Integration**: Search and import movies/TV shows from The Movie Database
- **Movie Catalogue Management**: Full CRUD operations with soft-delete and restore
- **Advanced Search & Filtering**: Filter by genre, language, rating, year, and category
- **Admin Dashboard**: Analytics with charts showing genre and language breakdown
- **Export System**: Custom field templates with drag-and-drop, export to CSV/Excel/JSON
- **Dark Mode Support**: Toggle between light and dark themes
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based admin authentication
- **Charts**: Recharts
- **Drag & Drop**: @dnd-kit
- **External API**: TMDb (The Movie Database)

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd movietondgon
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string for JWT signing
- `TMDB_API_KEY`: Get from [TMDb](https://www.themoviedb.org/settings/api)

4. Set up the database:
```bash
npx prisma generate
npx prisma db push
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) and create your admin account

### Database Commands

```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Get current user

### Movies
- `GET /api/movies` - List movies (with filters, pagination)
- `POST /api/movies` - Create movie
- `GET /api/movies/:id` - Get single movie
- `PUT /api/movies/:id` - Update movie
- `DELETE /api/movies/:id` - Soft delete
- `POST /api/movies/:id/restore` - Restore deleted
- `POST /api/movies/bulk-delete` - Bulk delete
- `POST /api/movies/bulk-publish` - Bulk publish
- `POST /api/movies/import` - Import from TMDb
- `GET /api/movies/stats` - Dashboard statistics

### TMDb
- `GET /api/tmdb/search?q=` - Search movies/TV shows
- `GET /api/tmdb/movie?id=` - Get movie details
- `GET /api/tmdb/tv?id=` - Get TV show details

### Templates & Export
- `GET /api/templates` - List templates
- `POST /api/templates` - Create template
- `PUT /api/templates/:id` - Update template
- `DELETE /api/templates/:id` - Delete template
- `POST /api/export` - Export movies (CSV/XLSX/JSON)

### Genres
- `GET /api/genres` - List all genres

## Project Structure

```
src/
├── app/
│   ├── api/              # API routes
│   ├── dashboard/        # Dashboard pages
│   ├── login/            # Login page
│   └── register/         # Register page
├── components/
│   ├── ui/               # Reusable UI components
│   ├── Sidebar.tsx
│   └── Header.tsx
├── lib/
│   ├── db.ts             # Prisma client
│   ├── auth.ts           # Authentication utilities
│   ├── tmdb.ts           # TMDb API client
│   └── utils.ts          # Utility functions
├── store/
│   └── index.ts          # Zustand store
└── types/
    └── index.ts          # TypeScript types
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret key for JWT signing | Yes |
| `TMDB_API_KEY` | TMDb API key | Yes |
| `CLOUDINARY_*` | Cloudinary credentials | No |

## Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## License

MIT