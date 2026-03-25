import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs'

const execAsync = promisify(exec)
const cwd = () => process.cwd()

async function safeExec(cmd: string): Promise<{ stdout: string; stderr: string }> {
  try {
    return await execAsync(cmd, { cwd: cwd(), timeout: 15_000 })
  } catch (err: unknown) {
    const e = err as { stdout?: string; stderr?: string }
    return { stdout: e.stdout ?? '', stderr: e.stderr ?? '' }
  }
}

/** GET /api/admin/update – compare local HEAD with remote origin/main */
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session?.user || session.user.role !== 'ADMIN') {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Try to fetch latest refs from remote (may fail without network)
    const fetchResult = await safeExec('git fetch origin --quiet')
    const fetchFailed = fetchResult.stderr.includes('fatal') || fetchResult.stderr.includes('error')

    const branchRaw = await safeExec('git rev-parse --abbrev-ref HEAD')
    const branch = branchRaw.stdout.trim() || 'main'

    const localRaw = await safeExec('git rev-parse HEAD')
    const currentSha = localRaw.stdout.trim()
    const localMsgRaw = await safeExec('git log -1 --pretty=format:%s HEAD')

    // For remote, try FETCH_HEAD first, then origin/<branch>
    let latestSha = currentSha
    let latestMessage = localMsgRaw.stdout.trim()

    if (!fetchFailed) {
      // Try FETCH_HEAD
      const remoteRaw = await safeExec('git rev-parse FETCH_HEAD')
      const remoteSha = remoteRaw.stdout.trim()
      if (remoteSha && !remoteRaw.stderr.includes('unknown revision')) {
        latestSha = remoteSha
        const remoteMsgRaw = await safeExec('git log -1 --pretty=format:%s FETCH_HEAD')
        latestMessage = remoteMsgRaw.stdout.trim()
      } else {
        // Fallback: try origin/<branch>
        const remoteBranchRaw = await safeExec(`git rev-parse origin/${branch}`)
        const remoteBranchSha = remoteBranchRaw.stdout.trim()
        if (remoteBranchSha && !remoteBranchRaw.stderr.includes('unknown revision')) {
          latestSha = remoteBranchSha
          const remoteMsgRaw = await safeExec(`git log -1 --pretty=format:%s origin/${branch}`)
          latestMessage = remoteMsgRaw.stdout.trim()
        }
      }
    }

    const pkgPath = path.join(cwd(), 'package.json')
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8')) as { version?: string }

    return Response.json({
      currentVersion: pkg.version ?? '0.1.0',
      currentSha: currentSha.substring(0, 7),
      latestSha: latestSha.substring(0, 7),
      currentMessage: localMsgRaw.stdout.trim(),
      latestMessage,
      branch,
      updateAvailable: currentSha !== latestSha,
      fetchFailed,
    })
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    return Response.json(
      { error: `Failed to check for updates: ${msg}` },
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
    const scriptPath = path.join(cwd(), 'update.sh')

    if (!fs.existsSync(scriptPath)) {
      return Response.json({ error: 'update.sh not found in project root' }, { status: 404 })
    }

    fs.chmodSync(scriptPath, 0o755)

    const { stdout, stderr } = await execAsync(`bash "${scriptPath}"`, {
      timeout: 600_000, // 10 minutes
      cwd: cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    })

    return Response.json({
      success: true,
      output: stdout + (stderr ? '\nWarnings:\n' + stderr : ''),
      message: 'Update applied successfully. Restart the application to activate the new version.',
    })
  } catch (err: unknown) {
    const e = err as { message?: string; stdout?: string; stderr?: string; code?: number }
    // Even if the script exits non-zero, it may have partially succeeded
    const output = (e.stdout ?? '') + (e.stderr ? '\nDetails:\n' + e.stderr : '')
    return Response.json(
      {
        error: 'Update encountered issues',
        details: e.message,
        output: output || 'No output captured. Check server logs for details.',
      },
      { status: 500 },
    )
  }
}
