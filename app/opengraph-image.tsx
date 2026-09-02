import { ImageResponse } from 'next/og'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

export const runtime = 'nodejs'
export const alt = 'Abdul-Quddus Inda avatar'
export const size = { width: 1200, height: 1200 }
export const contentType = 'image/png'

export default function Image() {
  try {
    const avatar = readFileSync(join(process.cwd(), 'public', 'avatar.png'))
    const src = `data:image/png;base64,${avatar.toString('base64')}`

    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
          }}
        >
          <img
            src={src}
            alt="avatar"
            style={{
              display: 'block',
              width: '100%',
              height: '100%',
              objectFit: 'contain',
            }}
          />
        </div>
      ),
      { ...size }
    )
  } catch {
    return new ImageResponse(
      (
        <div
          style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#ffffff',
            color: '#111111',
            fontSize: 64,
            fontWeight: 700,
            fontFamily: 'sans-serif',
          }}
        >
          inda.dev
        </div>
      ),
      { ...size }
    )
  }
}
