import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const size = { width: 180, height: 180 }
export const contentType = 'image/png'

export default function AppleIcon() {
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
          borderRadius: '40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            color: 'white',
            fontWeight: 800,
            fontSize: 76,
            letterSpacing: '-4px',
            fontFamily: 'sans-serif',
          }}
        >
          SA
        </div>
      </div>
    ),
    { ...size }
  )
}
