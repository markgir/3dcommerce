#!/bin/bash
# =============================================================================
# 3D Print Hub - Update Script
# Fetches the latest code from GitHub while preserving all user data
# =============================================================================

# Do NOT use set -e: we handle errors per-step so non-critical failures
# do not abort the entire update.
ERRORS=0

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="${SCRIPT_DIR}"
cd "$REPO_DIR"

echo "=== 3D Print Hub Update Script ==="
echo "Date: $(date)"
echo ""

# ---------------------------------------------------------------------------
# 0. Pre-flight checks
# ---------------------------------------------------------------------------
if ! command -v git &>/dev/null; then
  echo "❌ git is not installed. Cannot update without git."
  echo "   Install git and try again."
  exit 1
fi

if [ ! -d .git ]; then
  echo "❌ This directory is not a git repository."
  echo "   The update script must be run from the cloned 3D Print Hub directory."
  exit 1
fi

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

# Determine default branch – try multiple methods
DEFAULT_BRANCH=""
# Method 1: git symbolic-ref (fast, local only)
DEFAULT_BRANCH=$(git symbolic-ref refs/remotes/origin/HEAD 2>/dev/null | sed 's@^refs/remotes/origin/@@')
# Method 2: git remote show (requires network)
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH=$(git remote show origin 2>/dev/null | grep 'HEAD branch' | awk '{print $NF}')
fi
# Method 3: current branch
if [ -z "$DEFAULT_BRANCH" ]; then
  DEFAULT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null)
fi
# Fallback
DEFAULT_BRANCH="${DEFAULT_BRANCH:-main}"

echo "  Branch: $DEFAULT_BRANCH"

if git fetch origin 2>&1; then
  echo "  ✓ Fetched latest from remote"
else
  echo "  ⚠ Could not fetch from remote (network issue or remote not configured)"
  echo "  Continuing with local code..."
  ERRORS=$((ERRORS + 1))
fi

if git reset --hard "origin/${DEFAULT_BRANCH}" 2>&1; then
  echo "  ✓ Code updated to latest commit: $(git rev-parse --short HEAD)"
else
  echo "  ⚠ Could not reset to origin/${DEFAULT_BRANCH}"
  echo "  Continuing with current code..."
  ERRORS=$((ERRORS + 1))
fi

echo ""

# ---------------------------------------------------------------------------
# 3. Install / update dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing dependencies..."
if npm install 2>&1; then
  echo "  ✓ Dependencies installed"
else
  echo "  ⚠ npm install had issues, continuing..."
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ---------------------------------------------------------------------------
# 4. Ensure required directories exist
# ---------------------------------------------------------------------------
mkdir -p public/uploads/images public/uploads/files
[ -f public/uploads/images/.gitkeep ] || touch public/uploads/images/.gitkeep
[ -f public/uploads/files/.gitkeep ]  || touch public/uploads/files/.gitkeep
echo "  ✓ Upload directories verified"

# ---------------------------------------------------------------------------
# 5. Apply pending database migrations (safe – never deletes data)
# ---------------------------------------------------------------------------
echo "🗄️  Applying database migrations..."
if npx prisma generate 2>&1; then
  echo "  ✓ Prisma client generated"
else
  echo "  ⚠ Prisma generate had issues"
  ERRORS=$((ERRORS + 1))
fi

if npx prisma migrate deploy 2>&1 | tail -5; then
  echo "  ✓ Migrations applied"
else
  echo "  ℹ  No pending migrations or migration issue"
fi
echo ""

# ---------------------------------------------------------------------------
# 6. Build the application
# ---------------------------------------------------------------------------
echo "🏗️  Building the application..."
if npm run build 2>&1; then
  echo "  ✓ Build complete"
else
  echo "  ⚠ Build failed – the application may need a manual rebuild"
  echo "    Try running: npm run build"
  ERRORS=$((ERRORS + 1))
fi
echo ""

# ---------------------------------------------------------------------------
# 7. Read configured URL from .env
# ---------------------------------------------------------------------------
APP_URL="http://localhost:3000"
if [ -f .env ]; then
  ENV_URL=$(grep -E '^NEXTAUTH_URL=' .env 2>/dev/null | cut -d'=' -f2- | tr -d "\"' " || true)
  if [ -n "$ENV_URL" ]; then
    APP_URL="$ENV_URL"
  fi
fi

# ---------------------------------------------------------------------------
# 8. Summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================="
if [ "$ERRORS" -eq 0 ]; then
  echo "  ✅  UPDATE COMPLETE!"
else
  echo "  ⚠️  UPDATE COMPLETED WITH $ERRORS WARNING(S)"
fi
echo "============================================================="
echo ""
echo "  Your data has been preserved:"
echo "    • .env / .env.local – not modified by git"
echo "    • Database files    – not modified by git"
echo "    • Uploaded files    – not modified by git"
echo "    • Site settings     – stored in database (preserved)"
echo "    • Custom logo       – stored in uploads (preserved)"
echo ""
echo "  Backup saved at:"
echo "    $BACKUP_DIR"
echo ""
echo "  🌐 Application URL:  $APP_URL"
echo "  🔧 Admin Panel:      ${APP_URL}/admin"
echo ""
echo "  👤 Default accounts (if unchanged):"
echo "     Admin: admin@3dprinthub.com / admin123456"
echo "     User:  demo@3dprinthub.com  / demo123456"
echo ""
echo "  🔄 RESTART your application to apply the changes:"
echo "     • cPanel    : Node.js Selector → Restart"
echo "     • ISPmanager: Node.js → Restart"
echo "     • PM2       : pm2 restart 3dprinthub"
echo "     • Manual    : npm start"
echo "============================================================="
echo ""
