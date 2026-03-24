#!/bin/bash
# =============================================================================
# 3D Print Hub - One-Line Installation Script
# Usage:  bash install.sh
# Or:     curl -fsSL https://raw.githubusercontent.com/markgir/3dcommerce/main/install.sh | bash
# =============================================================================

set -e

# ---------------------------------------------------------------------------
# Helper: detect OS family
# ---------------------------------------------------------------------------
detect_os() {
  if [ -f /etc/os-release ]; then
    # shellcheck disable=SC1091
    . /etc/os-release
    OS_ID="${ID}"
    OS_FAMILY="${ID_LIKE:-$ID}"
  elif [ "$(uname)" = "Darwin" ]; then
    OS_ID="macos"
    OS_FAMILY="macos"
  else
    OS_ID="unknown"
    OS_FAMILY="unknown"
  fi
}

# ---------------------------------------------------------------------------
# Helper: install a package via the system package manager
# ---------------------------------------------------------------------------
pkg_install() {
  local pkg="$1"
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq && sudo apt-get install -y -qq "$pkg"
  elif command -v yum &>/dev/null; then
    sudo yum install -y "$pkg"
  elif command -v dnf &>/dev/null; then
    sudo dnf install -y "$pkg"
  elif command -v brew &>/dev/null; then
    brew install "$pkg"
  else
    return 1
  fi
}

# ---------------------------------------------------------------------------
# Helper: install Node.js 20 via NodeSource (Debian/RHEL) or Brew (macOS)
# ---------------------------------------------------------------------------
install_node() {
  detect_os
  echo "  → Attempting to install Node.js 20..."

  case "$OS_FAMILY" in
    *debian*|*ubuntu*)
      curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
      sudo apt-get install -y -qq nodejs
      ;;
    *rhel*|*fedora*|*centos*|almalinux|rocky)
      curl -fsSL https://rpm.nodesource.com/setup_20.x | sudo bash -
      sudo yum install -y nodejs || sudo dnf install -y nodejs
      ;;
    macos)
      if command -v brew &>/dev/null; then
        brew install node@20
      else
        echo "❌ Homebrew not found. Install Node.js 20+ manually: https://nodejs.org/"
        exit 1
      fi
      ;;
    *)
      echo "❌ Could not auto-install Node.js on this OS ($OS_ID)."
      echo "   Please install Node.js 20+ manually: https://nodejs.org/"
      exit 1
      ;;
  esac

  if ! command -v node &>/dev/null; then
    echo "❌ Node.js installation failed. Please install manually: https://nodejs.org/"
    exit 1
  fi
  echo "  ✓ Node.js $(node -v) installed"
}

# ---------------------------------------------------------------------------
# Resolve repository directory
# ---------------------------------------------------------------------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}" 2>/dev/null || echo ".")" && pwd)"
REPO_DIR="${SCRIPT_DIR}"

# If the script was piped via curl (no package.json nearby), clone first
if [ ! -f "$REPO_DIR/package.json" ]; then
  echo "📥 Cloning 3D Print Hub repository..."
  if ! command -v git &>/dev/null; then
    echo "  → git is required to clone the repository. Installing..."
    pkg_install git || { echo "❌ Could not install git. Please install it manually."; exit 1; }
  fi
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
# 1. Install system-level prerequisites
# ---------------------------------------------------------------------------
echo "🔍 Checking & installing system prerequisites..."

# --- Helper: batch-install a list of system packages ---
pkg_install_many() {
  if command -v apt-get &>/dev/null; then
    sudo apt-get update -qq
    # shellcheck disable=SC2068
    sudo apt-get install -y -qq $@
  elif command -v dnf &>/dev/null; then
    # shellcheck disable=SC2068
    sudo dnf install -y $@
  elif command -v yum &>/dev/null; then
    # shellcheck disable=SC2068
    sudo yum install -y $@
  elif command -v brew &>/dev/null; then
    # shellcheck disable=SC2068
    brew install $@
  else
    echo "❌ No supported package manager found (apt-get, dnf, yum, brew)."
    echo "   Please install the following manually: $*"
    exit 1
  fi
}

# Build the list of missing system packages
MISSING_PKGS=""

# --- git (required for updates) ---
if ! command -v git &>/dev/null; then
  MISSING_PKGS="$MISSING_PKGS git"
fi

# --- curl (required to install Node.js via NodeSource) ---
if ! command -v curl &>/dev/null; then
  MISSING_PKGS="$MISSING_PKGS curl"
fi

# --- openssl (used for secret generation & Prisma engine) ---
if ! command -v openssl &>/dev/null; then
  MISSING_PKGS="$MISSING_PKGS openssl"
fi

# --- Build tools (may be required for native Node.js modules) ---
detect_os
if ! command -v gcc &>/dev/null || ! command -v make &>/dev/null; then
  case "$OS_FAMILY" in
    *debian*|*ubuntu*)
      MISSING_PKGS="$MISSING_PKGS build-essential"
      ;;
    *rhel*|*fedora*|*centos*|almalinux|rocky)
      MISSING_PKGS="$MISSING_PKGS gcc make"
      ;;
    macos)
      # Xcode Command Line Tools provide gcc/make on macOS
      if ! xcode-select -p &>/dev/null; then
        echo "  → Xcode Command Line Tools are required for build tools."
        echo "    A system dialog will open – please follow the prompts."
        echo "    After installation completes, re-run this script if it fails."
        xcode-select --install 2>/dev/null || true
        # Wait briefly for the installer to register
        sleep 5
      fi
      ;;
  esac
fi

# --- Install everything that is missing in one pass ---
if [ -n "$MISSING_PKGS" ]; then
  echo "  → Installing missing system packages:$MISSING_PKGS"
  # shellcheck disable=SC2086
  pkg_install_many $MISSING_PKGS
  echo "  ✓ System packages installed"
else
  echo "  ✓ All system packages already present"
fi

# Verify critical tools after installation attempt
for tool in git curl; do
  if ! command -v "$tool" &>/dev/null; then
    echo "❌ $tool is still not available after installation attempt."
    echo "   Please install $tool manually and re-run this script."
    exit 1
  fi
done
echo "  ✓ git $(git --version)"
echo "  ✓ curl $(curl --version | head -1)"

# --- Node.js ---
if ! command -v node &>/dev/null; then
  echo "  ⚠ Node.js not found – installing automatically..."
  install_node
else
  NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
  if [ "$NODE_VERSION" -lt 20 ] 2>/dev/null; then
    echo "  ⚠ Node.js $(node -v) detected (version 20+ recommended). Continuing..."
  else
    echo "  ✓ Node.js $(node -v)"
  fi
fi

# --- npm (comes with Node.js) ---
if ! command -v npm &>/dev/null; then
  echo "❌ npm is not available. Please reinstall Node.js (it bundles npm)."
  exit 1
fi
echo "  ✓ npm $(npm -v)"

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
# 3. Create required directories
# ---------------------------------------------------------------------------
echo "📁 Creating required directories..."

mkdir -p public/uploads/images public/uploads/files
# Ensure .gitkeep files exist so git tracks the empty directories
[ -f public/uploads/images/.gitkeep ] || touch public/uploads/images/.gitkeep
[ -f public/uploads/files/.gitkeep ]  || touch public/uploads/files/.gitkeep

echo "  ✓ Upload directories ready"
echo ""

# ---------------------------------------------------------------------------
# 4. Install dependencies
# ---------------------------------------------------------------------------
echo "📦 Installing dependencies..."
npm install
echo "  ✓ Dependencies installed"
echo ""

# ---------------------------------------------------------------------------
# 5. Set up the database
# ---------------------------------------------------------------------------
echo "🗄️  Setting up the database..."

# Generate Prisma client
npx prisma generate
echo "  ✓ Prisma client generated"

# Apply migrations (deploy is non-interactive and safe for automation)
if npx prisma migrate deploy 2>&1 | tail -5; then
  echo "  ✓ Database migrations applied"
else
  echo "❌ Database migration failed. Check the output above for details."
  exit 1
fi

echo ""

# ---------------------------------------------------------------------------
# 6. Seed demo data
# ---------------------------------------------------------------------------
echo "🌱 Seeding demo data..."
if npx tsx prisma/seed.ts 2>&1 | tail -10; then
  echo "  ✓ Demo data seeded"
else
  echo "  ℹ  Seeding skipped or partially completed (data may already exist)"
fi
echo ""

# ---------------------------------------------------------------------------
# 7. Build the application
# ---------------------------------------------------------------------------
echo "🏗️  Building the application..."
npm run build
echo "  ✓ Build complete"
echo ""

# ---------------------------------------------------------------------------
# 8. Read configured URL from .env
# ---------------------------------------------------------------------------
APP_URL="http://localhost:3000"
if [ -f .env ]; then
  ENV_URL=$(grep -E '^NEXTAUTH_URL=' .env 2>/dev/null | cut -d'=' -f2- | tr -d "\"' " || true)
  if [ -n "$ENV_URL" ]; then
    APP_URL="$ENV_URL"
  fi
fi

# ---------------------------------------------------------------------------
# 9. Installation summary
# ---------------------------------------------------------------------------
echo ""
echo "============================================================="
echo "  ✅  INSTALLATION COMPLETE!"
echo "============================================================="
echo ""
echo "  🌐 Application URL:  $APP_URL"
echo "  🔧 Admin Panel:      ${APP_URL}/admin"
echo ""
echo "  👤 DEFAULT ACCOUNTS"
echo "  -----------------------------------------------------------"
echo "  🔑 Admin account:"
echo "     Email:    admin@3dprinthub.com"
echo "     Password: admin123456"
echo ""
echo "  🔑 Demo user account:"
echo "     Email:    demo@3dprinthub.com"
echo "     Password: demo123456"
echo ""
echo "  🚀 START THE APPLICATION"
echo "  -----------------------------------------------------------"
echo "  Development mode:   npm run dev"
echo "  Production mode:    npm start"
echo ""
echo "  Update later:       bash update.sh"
echo "============================================================="
echo ""
