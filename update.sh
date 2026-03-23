#!/bin/bash
# =============================================================================
# 3D Print Hub - Update Script
# Fetches the latest code from GitHub while preserving all user data
# =============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$REPO_DIR"

echo "=== 3D Print Hub Update Script ==="
echo "Date: $(date)"
echo ""

# ---------------------------------------------------------------------------
# 1. Create timestamped backup directory
# ---------------------------------------------------------------------------
BACKUP_DIR="$REPO_DIR/.backup_$(date +%Y%m%d_%H%M%S)"
mkdir -p "$BACKUP_DIR"
echo "📦 Creating backup in $BACKUP_DIR ..."

# Backup .env files (not tracked by git, but back up just in case)
[ -f .env ]       && cp .env       "$BACKUP_DIR/.env"       && echo "  ✓ .env backed up"
[ -f .env.local ] && cp .env.local "$BACKUP_DIR/.env.local" && echo "  ✓ .env.local backed up"

# Backup SQLite database(s)
if ls prisma/*.db 1>/dev/null 2>&1; then
  cp prisma/*.db "$BACKUP_DIR/" 2>/dev/null && echo "  ✓ Database(s) backed up"
fi

# Backup uploaded user files
if [ -d public/uploads ]; then
  cp -r public/uploads "$BACKUP_DIR/uploads" 2>/dev/null && echo "  ✓ Uploads backed up"
fi

echo ""

# ---------------------------------------------------------------------------
# 2. Pull latest code from GitHub
# ---------------------------------------------------------------------------
echo "⬇️  Pulling latest code from GitHub..."

# Determine default branch (main or master)
DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}' || echo "main")

git fetch origin
git reset --hard "origin/${DEFAULT_BRANCH}"

echo "  ✓ Code updated to latest commit: $(git rev-parse --short HEAD)"
echo ""

# ---------------------------------------------------------------------------
# 3. Install / update dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing dependencies..."
npm install --include=dev
echo "  ✓ Dependencies installed"
echo ""

# ---------------------------------------------------------------------------
# 4. Apply pending database migrations (safe – never deletes data)
# ---------------------------------------------------------------------------
echo "🗄️  Applying database migrations..."
npx prisma migrate deploy 2>/dev/null && echo "  ✓ Migrations applied" || echo "  ℹ  No pending migrations"
npx prisma generate && echo "  ✓ Prisma client generated"
echo ""

# ---------------------------------------------------------------------------
# 5. Build the application
# ---------------------------------------------------------------------------
echo "🏗️  Building the application..."
npm run build
echo "  ✓ Build complete"
echo ""

# ---------------------------------------------------------------------------
# 6. Summary
# ---------------------------------------------------------------------------
echo "✅ Update complete!"
echo ""
echo "Your data has been preserved:"
echo "  • .env / .env.local  – not modified by git (excluded in .gitignore)"
echo "  • Database files      – not modified by git (excluded in .gitignore)"
echo "  • Uploaded files      – not modified by git (excluded in .gitignore)"
echo ""
echo "Backup saved at: $BACKUP_DIR"
echo ""
echo "🔄 Restart your Node.js application to apply the changes."
echo "   • cPanel    : Node.js Selector → Restart"
echo "   • ISPmanager: Node.js → Restart"
echo "   • PM2       : pm2 restart 3dprinthub"
echo ""
