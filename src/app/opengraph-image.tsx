import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export const alt = 'The Gen Z Mama - Childcare Reimagined'
export const size = {
    width: 1200,
    height: 630,
}

export const contentType = 'image/png'

export default async function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    fontSize: 128,
                    background: '#FAF9F6', // off-white
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontFamily: 'sans-serif',
                    color: '#5C4033', // warm brown
                    textAlign: 'center',
                    border: '20px solid #C17C59', // terracotta border
                }}
            >
                <div style={{ marginTop: 40 }}>The Gen Z Mama</div>
                <div style={{ fontSize: 48, marginTop: 20, fontFamily: 'sans-serif', color: '#78716C' }}>
                    Childcare in Wharton, NJ
                </div>
                <div style={{
                    position: 'absolute',
                    bottom: 40,
                    fontSize: 32,
                    fontFamily: 'sans-serif',
                    color: '#A8A29E'
                }}>
                    thegenzmama.com
                </div>
            </div>
        ),
        {
            ...size,
        }
    )
}
