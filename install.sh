#!/bin/bash
# =============================================================================
# 3D Print Hub - One-Line Installation Script
# Usage:  bash install.sh
# Or:     curl -fsSL https://raw.githubusercontent.com/markgir/3dcommerce/main/install.sh | bash
# =============================================================================

set -e

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" 2>/dev/null)" && pwd 2>/dev/null || pwd)"

# If the script was piped via curl, clone the repository first
if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "📥 Cloning 3D Print Hub repository..."
  git clone https://github.com/markgir/3dcommerce.git 3dprinthub
  cd 3dprinthub
  REPO_DIR="$(pwd)"
fi

cd "$REPO_DIR"

echo "============================================="
echo "   3D Print Hub – Installation Script"
echo "============================================="
echo ""

# ---------------------------------------------------------------------------
# 1. Check prerequisites
# ---------------------------------------------------------------------------
echo "🔍 Checking prerequisites..."

# Check Node.js
if ! command -v node &>/dev/null; then
  echo "❌ Node.js is not installed."
  echo "   Please install Node.js 20+ from https://nodejs.org/"
  echo "   Or use: curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash - && sudo apt-get install -y nodejs"
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  echo "⚠️  Node.js version $(node -v) detected. Version 20+ is recommended."
  echo "   Continuing anyway..."
else
  echo "  ✓ Node.js $(node -v)"
fi

# Check npm
if ! command -v npm &>/dev/null; then
  echo "❌ npm is not installed. Please install Node.js which includes npm."
  exit 1
fi
echo "  ✓ npm $(npm -v)"

# Check git (optional, needed for updates)
if command -v git &>/dev/null; then
  echo "  ✓ git $(git --version | awk '{print $3}')"
else
  echo "  ⚠ git not found – update feature will not work"
fi

echo ""

# ---------------------------------------------------------------------------
# 2. Configure environment
# ---------------------------------------------------------------------------
echo "⚙️  Configuring environment..."

if [ ! -f .env ]; then
  if command -v openssl &>/dev/null; then
    SECRET=$(openssl rand -base64 32)
  else
    SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('base64'))")
  fi
  cat > .env <<EOF
# 3D Print Hub – Environment Configuration
# Generated on $(date)

# Authentication secret (auto-generated)
NEXTAUTH_SECRET=${SECRET}

# Application URL – change this to your domain in production
NEXTAUTH_URL=http://localhost:3000

# Database URL (SQLite)
DATABASE_URL=file:./prisma/dev.db

# Google AdSense (optional)
# NEXT_PUBLIC_ADSENSE_PUBLISHER_ID=ca-pub-xxxxx
EOF
  echo "  ✓ .env created with auto-generated secret"
else
  echo "  ✓ .env already exists (preserved)"
fi

echo ""

# ---------------------------------------------------------------------------
# 3. Install dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing dependencies..."
npm install
echo "  ✓ Dependencies installed"
echo ""

# ---------------------------------------------------------------------------
# 4. Set up the database
# ---------------------------------------------------------------------------
echo "🗄️  Setting up the database..."

# Generate Prisma client
npx prisma generate
echo "  ✓ Prisma client generated"

# Apply migrations
if npx prisma migrate deploy 2>&1; then
  echo "  ✓ Migrations applied"
else
  echo "  ℹ  No existing migrations to deploy, running initial migration..."
  if npx prisma migrate dev --name init 2>&1; then
    echo "  ✓ Initial migration created and applied"
  else
    echo "  ✓ Database ready"
  fi
fi

echo ""

# ---------------------------------------------------------------------------
# 5. Seed demo data
# ---------------------------------------------------------------------------
echo "🌱 Seeding demo data..."
npx tsx prisma/seed.ts 2>/dev/null && echo "  ✓ Demo data seeded" || echo "  ℹ  Seeding skipped (data may already exist)"
echo ""

# ---------------------------------------------------------------------------
# 6. Build the application
# ---------------------------------------------------------------------------
echo "🏗️  Building the application..."
npm run build
echo "  ✓ Build complete"
echo ""

# ---------------------------------------------------------------------------
# 7. Summary
# ---------------------------------------------------------------------------
echo "============================================="
echo "  ✅ Installation complete!"
echo "============================================="
echo ""
echo "Default accounts:"
echo "  📧 Admin: admin@3dprinthub.com / admin123456"
echo "  📧 User:  demo@3dprinthub.com  / demo123456"
echo ""
echo "Start the application:"
echo "  Development:  npm run dev"
echo "  Production:   npm start"
echo ""
echo "Open: http://localhost:3000"
echo ""
echo "Admin panel: http://localhost:3000/admin"
echo ""
echo "To update later: bash update.sh"
echo "============================================="
