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

---

## Installation

### Quick Install (One Line)

```bash
git clone https://github.com/markgir/3dcommerce.git 3dprinthub && cd 3dprinthub && bash install.sh
```

This single command clones the repository and runs the automated installer, which:
1. Installs system prerequisites (git, curl, openssl, build tools) if missing
2. Checks & installs Node.js 20+ and npm if missing
3. Creates a `.env` file with an auto-generated secret
4. Installs all npm dependencies
5. Sets up the SQLite database and applies migrations
6. Seeds demo data (admin + demo user accounts)
7. Builds the production application

After installation, start the app with `npm run dev` (development) or `npm start` (production).

### Local / VPS (General)

#### 1. Install dependencies

```bash
npm install
```

#### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your values
```

#### 3. Set up the database

```bash
DATABASE_URL="file:./prisma/dev.db" npx prisma migrate dev
```

#### 4. Seed with demo data

```bash
npx tsx prisma/seed.ts
```

Default accounts created by seed:
- **Admin**: `admin@3dprinthub.com` / `admin123456`
- **Demo User**: `demo@3dprinthub.com` / `demo123456`

#### 5. Start the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

### cPanel Installation

> Requires a cPanel hosting plan that supports **Node.js** (Node.js Selector).

1. **Create the application** in cPanel → *Node.js Selector*:
   - Node.js version: **20+**
   - Application mode: **Production**
   - Application root: e.g. `3dprinthub`
   - Application URL: your domain or subdomain
   - Application startup file: `server.js`

2. **Upload the project** files to the application root via *File Manager* or FTP.

3. **Create `.env`** (in the application root) with at minimum:
   ```
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=https://yourdomain.com
   DATABASE_URL=file:./prisma/prod.db
   ```

4. **Install dependencies** – in the *Node.js Selector*, click **Run NPM Install**, or open the cPanel terminal and run:
   ```bash
   npm install
   ```

5. **Run database migrations and build**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   ```

6. **Seed demo data** (optional):
   ```bash
   npx tsx prisma/seed.ts
   ```

7. **Start the app** in *Node.js Selector* → **Start Application** (or **Restart** if already running).

> **Note:** Make sure `public/uploads/` and `prisma/*.db` are writable by the Node.js process.

---

### ISPmanager Installation

> Requires ISPmanager 6 with the **Node.js** module enabled.

1. **Create a site** in ISPmanager → *Websites* if you haven't already.

2. **Clone / upload the project** to the document root (e.g. `/var/www/<user>/data/www/<domain>/`).

3. **Create `.env`** with at minimum:
   ```
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=https://yourdomain.com
   DATABASE_URL=file:./prisma/prod.db
   ```

4. **Install dependencies** via SSH:
   ```bash
   cd /var/www/<user>/data/www/<domain>
   npm install
   ```

5. **Run database migrations and build**:
   ```bash
   npx prisma migrate deploy
   npx prisma generate
   npm run build
   ```

6. **Seed demo data** (optional):
   ```bash
   npx tsx prisma/seed.ts
   ```

7. **Configure the Node.js application** in ISPmanager → *Node.js*:
   - Working directory: the project root
   - Start file: `server.js` (or configure the start command as `npm start`)
   - Click **Start**.

> **Tip:** Use a reverse proxy (nginx) in ISPmanager to forward traffic from port 80/443 to the Node.js port (default **3000**).

---

## Updating

The platform ships with `update.sh` and an in-app admin UI to keep itself up to date.

### Using the Admin Dashboard

1. Log in as **Admin** and go to `/admin`.
2. Click the **Update** tab.
3. Click **Check** – the dashboard compares your local commit with the latest remote commit.
4. If an update is available, click **Apply Update**.
   - The script pulls the latest code, installs any new dependencies, runs pending migrations, and rebuilds the app.
   - A log of the entire process is shown in the dashboard.
5. **Restart the application** after the update completes:
   - **cPanel**: Node.js Selector → Restart
   - **ISPmanager**: Node.js → Restart
   - **PM2**: `pm2 restart 3dprinthub`

### Using `update.sh` (SSH / CLI)

```bash
bash update.sh
```

The script:
1. Creates a timestamped backup of `.env`, the database, and uploaded files.
2. Pulls the latest code (`git fetch && git reset --hard origin/<branch>`).
3. Runs `npm install`.
4. Applies pending Prisma migrations (`prisma migrate deploy`).
5. Rebuilds the Next.js app (`npm run build`).

---

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
│   │   └── admin/     # Admin-only endpoints (models/users/ads/update)
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
- **Update management** – check for and apply updates from the GitHub repository
- **Debug / Diagnostics** – view system info, runtime, git status, database, storage, environment variables, and installed dependencies
- Seed demo data button

## License

MIT
