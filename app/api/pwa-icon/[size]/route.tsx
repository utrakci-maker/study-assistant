import { ImageResponse } from 'next/og'
import { NextRequest } from 'next/server'

export const runtime = 'edge'

const ALLOWED_SIZES = new Set([192, 512])

// Maskable icons must fill the full square with no baked-in rounding — the OS
// applies its own mask shape — and keep content inside the ~80% safe zone so
// it isn't clipped.
export async function GET(_request: NextRequest, { params }: { params: { size: string } }) {
  const size = parseInt(params.size, 10)
  if (!ALLOWED_SIZES.has(size)) {
    return new Response('Not found', { status: 404 })
  }

  const fontSize = Math.round(size * 0.32)

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #1d4ed8 0%, #3b82f6 100%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontWeight: 800,
            fontSize,
            letterSpacing: '-4px',
            fontFamily: 'sans-serif',
          }}
        >
          SA
        </div>
      </div>
    ),
    { width: size, height: size }
  )
}
