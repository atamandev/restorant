import { jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

// Convert secret to Uint8Array for jose
const getJwtSecret = () => {
  return new TextEncoder().encode(JWT_SECRET)
}

export async function verifyToken(token: string): Promise<{ userId: string; username: string; role: string } | null> {
  try {
    const secret = getJwtSecret()
    const { payload } = await jwtVerify(token, secret)
    
    return {
      userId: payload.userId as string || payload.id as string || '',
      username: payload.username as string || '',
      role: payload.role as string || ''
    }
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

