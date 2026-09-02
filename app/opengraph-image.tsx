import { ImageResponse } from 'next/og'
import type { NextRequest } from 'next/server'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { prisma } from '@/lib/prisma'

export const runtime = 'nodejs'
export const alt = 'inda.name.ng — Design, Build, Launch'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

function localLogo(): string {
  try {
    const buf = readFileSync(join(process.cwd(), 'public', 'logo.png'))
    return `data:image/png;base64,${buf.toString('base64')}`
  } catch {
    return ''
  }
}

export default async function Image({ _req }: { _req: NextRequest }) {
  let name = 'Abdul-Quddus Inda'
  let tagline = 'Design · Build · Launch'
  let profileImage: string | null = null
  let logo = localLogo()

  try {
    const profile = await prisma.profile.findFirst()
    if (profile) {
      name = profile.name
      tagline = profile.tagline
      profileImage = profile.profileImage
      if (profile.logoImage) logo = profile.logoImage
    }
  } catch {
    // fall back to defaults
  }

  const hasPhoto = !!profileImage

  return new ImageResponse(
    (
      <div
        style={{
          background: '#090a0a',
          color: '#f2f3ef',
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 64px',
          fontFamily: 'sans-serif',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 40,
            left: 64,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            color: '#10f0a0',
          }}
        >
          <img src={logo} width={34} height={34} style={{ objectFit: 'contain' }} />
          <span style={{ fontSize: 22, fontWeight: 700, letterSpacing: 2 }}>inda.name.ng</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 640 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, color: '#10f0a0', fontSize: 20, letterSpacing: 3, marginBottom: 28 }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: '#10f0a0' }} />
            FULL STACK DEVELOPER
          </div>
          <div style={{ fontSize: 72, fontWeight: 700, letterSpacing: -2, lineHeight: 0.95 }}>
            {name}
          </div>
          <div style={{ fontSize: 30, color: '#9a9e98', marginTop: 16, letterSpacing: 1 }}>
            {tagline}
          </div>
        </div>

        {hasPhoto ? (
          <img
            src={profileImage!}
            width={300}
            height={300}
            style={{ objectFit: 'cover', borderRadius: 12, border: '2px solid #10f0a0' }}
          />
        ) : (
          <div
            style={{
              width: 280,
              height: 280,
              borderRadius: 12,
              border: '2px solid rgba(16,240,160,.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#10f0a0',
              fontSize: 88,
              fontWeight: 700,
              background: 'rgba(16,240,160,.06)',
            }}
          >
            {name.split(' ').map(w => w[0]).join('')}
          </div>
        )}
      </div>
    ),
    { ...size }
  )
}
