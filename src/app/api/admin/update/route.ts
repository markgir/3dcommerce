import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)

/** GET /api/admin/update – compare local HEAD with remote origin/main */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Fetch latest refs from remote (read-only, no checkout)
    await execAsync('git fetch origin --quiet', { cwd: process.cwd() })

    const [localRaw, remoteRaw, localMsgRaw, remoteMsgRaw, branchRaw] = await Promise.all([
      execAsync('git rev-parse HEAD', { cwd: process.cwd() }),
      execAsync('git rev-parse FETCH_HEAD', { cwd: process.cwd() }),
      execAsync('git log -1 --pretty=format:%s HEAD', { cwd: process.cwd() }),
      execAsync('git log -1 --pretty=format:%s FETCH_HEAD', { cwd: process.cwd() }),
      execAsync('git rev-parse --abbrev-ref HEAD', { cwd: process.cwd() }),
    ])

    const currentSha = localRaw.stdout.trim()
    const latestSha = remoteRaw.stdout.trim()

    const pkgPath = path.join(process.cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }

    return Response.json({
      currentVersion: pkg.version ?? '0.1.0',
      currentSha: currentSha.substring(0, 7),
      latestSha: latestSha.substring(0, 7),
      currentMessage: localMsgRaw.stdout.trim(),
      latestMessage: remoteMsgRaw.stdout.trim(),
      branch: branchRaw.stdout.trim(),
      updateAvailable: currentSha !== latestSha,
    })
  } catch {
    return Response.json(
      { error: 'Failed to check for updates. Ensure git is available on the server.' },
      { status: 500 },
    )
  }
}

/** POST /api/admin/update – run update.sh to pull & rebuild */
export async function POST() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const scriptPath = path.join(process.cwd(), 'update.sh')

    if (!fs.existsSync(scriptPath)) {
      return Response.json({ error: 'update.sh not found in project root' }, { status: 404 })
    }

    fs.chmodSync(scriptPath, 0o755)

    const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`, {
      timeout: 600_000, // 10 minutes
      cwd: process.cwd(),
    })

    return Response.json({
      success: true,
      output: stdout + (stderr ? '\nWarnings:\n' + stderr : ''),
      message: 'Update applied successfully. Restart the application to activate the new version.',
    })
  } catch (err: unknown) {
    const e = err as { message?: string; stdout?: string; stderr?: string }
    return Response.json(
      {
        error: 'Update failed',
        details: e.message,
        output: (e.stdout ?? '') + (e.stderr ? '\nErrors:\n' + e.stderr : ''),
      },
      { status: 500 },
    )
  }
}
