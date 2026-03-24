import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import os from 'os'
import fs from 'fs'
import path from 'path'

const execAsync = promisify(exec)

async function safeExec(cmd: string): Promise<string> {
  try {
    const { stdout } = await execAsync(cmd, { timeout: 10_000, cwd: process.cwd() })
    return stdout.trim()
  } catch {
    return 'N/A'
  }
}

function getDirectorySize(dirPath: string): { files: number; totalBytes: number } {
  let files = 0
  let totalBytes = 0
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true, recursive: true })
    for (const entry of entries) {
      if (entry.isFile()) {
        files++
        try {
          const fullPath = path.join(entry.parentPath ?? entry.path, entry.name)
          totalBytes += fs.statSync(fullPath).size
        } catch { /* skip unreadable files */ }
      }
    }
  } catch { /* directory may not exist */ }
  return { files, totalBytes }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${units[i]}`
}

/** GET /api/admin/debug – collect system diagnostics */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Use turbopackIgnore to prevent Turbopack from tracing fs operations at build time;
  // process.cwd() must be evaluated at runtime to get the correct working directory.
  const projectRoot = /** @turbopackIgnore */ process.cwd()

  // Collect all diagnostics in parallel
  const [
    nodeVersion,
    npmVersion,
    gitVersion,
    gitBranch,
    gitCommit,
    gitStatus,
    gitRemote,
    diskUsage,
  ] = await Promise.all([
    safeExec('node -v'),
    safeExec('npm -v'),
    safeExec('git --version'),
    safeExec('git rev-parse --abbrev-ref HEAD'),
    safeExec('git log -1 --pretty=format:"%h – %s (%cr)"'),
    safeExec('git status --short'),
    safeExec('git remote -v'),
    safeExec('df -h . | tail -1'),
  ])

  // Read package.json
  let packageInfo: { name?: string; version?: string; dependencies?: Record<string, string>; devDependencies?: Record<string, string> } = {}
  try {
    const pkgPath = path.join(projectRoot, 'package.json')
    packageInfo = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'))
  } catch { /* ignore */ }

  // Check database file
  let dbInfo: { exists: boolean; size: string; path: string } = { exists: false, size: '0 B', path: '' }
  const dbFiles = ['prisma/dev.db', 'prisma/prod.db']
  for (const dbFile of dbFiles) {
    const dbPath = path.join(projectRoot, dbFile)
    if (fs.existsSync(dbPath)) {
      const stats = fs.statSync(dbPath)
      dbInfo = {
        exists: true,
        size: formatBytes(stats.size),
        path: dbFile,
      }
      break
    }
  }

  // Check uploads directory
  const uploadsImages = getDirectorySize(path.join(projectRoot, 'public/uploads/images'))
  const uploadsFiles = getDirectorySize(path.join(projectRoot, 'public/uploads/files'))

  // Check critical directories
  const nextBuildExists = fs.existsSync(path.join(projectRoot, '.next'))
  const nodeModulesExists = fs.existsSync(path.join(projectRoot, 'node_modules'))
  const envExists = fs.existsSync(path.join(projectRoot, '.env'))
  const envLocalExists = fs.existsSync(path.join(projectRoot, '.env.local'))

  // Check .env variables (only names, not values, for security)
  let envVars: string[] = []
  try {
    const envPath = envExists ? path.join(projectRoot, '.env') : path.join(projectRoot, '.env.local')
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf-8')
      envVars = envContent
        .split('\n')
        .filter((line) => line.trim() && !line.startsWith('#'))
        .map((line) => {
          const parts = line.split('=')
          const key = parts[0].trim()
          const value = parts.slice(1).join('=').trim()
          // Show variable name and whether it's set (mask actual values)
          return `${key}=${value ? '••••••' : '(empty)'}`
        })
    }
  } catch { /* ignore */ }

  // Prisma migrations
  let migrations: string[] = []
  try {
    const migrationsDir = path.join(projectRoot, 'prisma/migrations')
    if (fs.existsSync(migrationsDir)) {
      migrations = fs
        .readdirSync(migrationsDir, { withFileTypes: true })
        .filter((d) => d.isDirectory())
        .map((d) => d.name)
        .sort()
    }
  } catch { /* ignore */ }

  return Response.json({
    timestamp: new Date().toISOString(),
    system: {
      platform: `${os.platform()} ${os.arch()}`,
      release: os.release(),
      hostname: os.hostname(),
      uptime: `${Math.floor(os.uptime() / 3600)}h ${Math.floor((os.uptime() % 3600) / 60)}m`,
      cpus: os.cpus().length,
      totalMemory: formatBytes(os.totalmem()),
      freeMemory: formatBytes(os.freemem()),
      memoryUsage: `${Math.round(((os.totalmem() - os.freemem()) / os.totalmem()) * 100)}%`,
    },
    runtime: {
      nodeVersion,
      npmVersion,
      processUptime: `${Math.floor(process.uptime() / 3600)}h ${Math.floor((process.uptime() % 3600) / 60)}m`,
      pid: process.pid,
      cwd: projectRoot,
    },
    application: {
      name: packageInfo.name ?? 'N/A',
      version: packageInfo.version ?? 'N/A',
      nextBuild: nextBuildExists ? 'Present' : 'Missing – run npm run build',
      nodeModules: nodeModulesExists ? 'Present' : 'Missing – run npm install',
      envFile: envExists ? '.env' : envLocalExists ? '.env.local' : 'Missing',
      envVars,
    },
    git: {
      version: gitVersion,
      branch: gitBranch,
      lastCommit: gitCommit,
      uncommittedChanges: gitStatus || '(clean)',
      remote: gitRemote,
    },
    database: {
      ...dbInfo,
      migrations,
    },
    storage: {
      uploadedImages: `${uploadsImages.files} files (${formatBytes(uploadsImages.totalBytes)})`,
      uploadedFiles: `${uploadsFiles.files} files (${formatBytes(uploadsFiles.totalBytes)})`,
      disk: diskUsage,
    },
    dependencies: {
      production: packageInfo.dependencies ?? {},
      dev: packageInfo.devDependencies ?? {},
    },
    nodeEnv: process.env.NODE_ENV ?? 'not set',
  })
}
