import { NextRequest } from 'next/server'
import { readFile, stat } from 'fs/promises'
import path from 'path'

const MIME_TYPES: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.bmp': 'image/bmp',
  '.stl': 'application/octet-stream',
  '.obj': 'application/octet-stream',
  '.3mf': 'application/octet-stream',
  '.step': 'application/octet-stream',
  '.stp': 'application/octet-stream',
  '.gcode': 'application/octet-stream',
  '.zip': 'application/zip',
  '.rar': 'application/x-rar-compressed',
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path: segments } = await params
  const relativePath = segments.join('/')

  // Prevent directory traversal
  if (relativePath.includes('..') || relativePath.includes('\0')) {
    return new Response('Forbidden', { status: 403 })
  }

  const filePath = path.join(process.cwd(), 'public', 'uploads', relativePath)

  try {
    const fileStat = await stat(filePath)
    if (!fileStat.isFile()) {
      return new Response('Not Found', { status: 404 })
    }

    const buffer = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType = MIME_TYPES[ext] || 'application/octet-stream'

    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch {
    return new Response('Not Found', { status: 404 })
  }
}
