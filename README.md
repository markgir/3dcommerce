# 3D Print Hub

A free 3D printing models sharing platform similar to [Printables.com](https://www.printables.com/), built with Next.js 16, Prisma, and Tailwind CSS.

## Features

- 🔍 **Browse & Search** – Explore thousands of free 3D models with category filters, tags, and sorting
- 📥 **Free Downloads** – All models are available for free download
- 📤 **Upload Models** – Share your own 3D designs with the community
- 💬 **Community** – Comment on models, like your favorites
- 👤 **User Profiles** – Personal profiles with upload history and stats
- 🛠️ **Admin Dashboard** – Manage models, users, and advertisements
- 💰 **Monetization** – Built-in ad system supporting Google AdSense and custom ads

## Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: SQLite via Prisma 7 + better-sqlite3 adapter
- **Auth**: NextAuth.js v4 (credentials-based)
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

### 3. Set up the database

```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev
```

### 4. Seed with demo data

```bash
npx tsx prisma/seed.ts
```

Default accounts created by seed:
- **Admin**: `admin@3dprinthub.com` / `admin123456`
- **Demo User**: `demo@3dprinthub.com` / `demo123456`

### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
src/
├── app/
│   ├── api/           # API route handlers
│   │   ├── auth/      # NextAuth.js handler
│   │   ├── models/    # Model CRUD + like/download/comments
│   │   ├── upload/    # File upload handler
│   │   ├── categories/
│   │   ├── profile/
│   │   └── admin/     # Admin-only endpoints
│   ├── admin/         # Admin dashboard
│   ├── auth/          # Sign in / Sign up pages
│   ├── explore/       # Browse & search page
│   ├── models/[id]/   # Model detail page
│   ├── profile/       # User profile
│   └── upload/        # Upload form
├── components/
│   ├── ads/           # AdBanner, GoogleAdSense
│   ├── layout/        # Navbar, Footer
│   └── models/        # ModelCard
├── lib/
│   ├── auth.ts        # NextAuth configuration
│   ├── prisma.ts      # Prisma client singleton
│   └── session.ts     # Session helpers
└── types/
    └── next-auth.d.ts # Type extensions
```

## Advertising

The platform includes two types of ads:

1. **Google AdSense** – Set `NEXT_PUBLIC_ADSENSE_PUBLISHER_ID` in `.env`
2. **Custom Ads** – Manage via the admin dashboard at `/admin` → Ads tab

Ad placements are available in: header, sidebar, inline content, footer, and download modal.

## Admin Panel

Access at `/admin` (requires ADMIN role). Features:
- Overview stats (models, users, downloads, ads)
- Model management (feature/hide models)
- User management (promote/demote admin role)
- Advertisement management (create/toggle/delete ads)
- Seed demo data button

## License

MIT
