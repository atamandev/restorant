import { NextRequest, NextResponse } from 'next/server'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

// یوزرنیم و پسورد پیش‌فرض
const DEFAULT_USERNAME = 'admin'
const DEFAULT_PASSWORD = '123456'

export async function POST(request: NextRequest) {
  try {
    console.log('Login API: Request received')
    const body = await request.json()
    const { username, password } = body

    console.log('Login API: Credentials received', { username, hasPassword: !!password })

    // Validate input
    if (!username || !password) {
      console.log('Login API: Missing username or password')
      return NextResponse.json(
        {
          success: false,
          message: 'نام کاربری و رمز عبور الزامی است'
        },
        { status: 400 }
      )
    }

    // Check credentials
    if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
      console.log('Login API: Credentials match, generating token')
      
      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: 'admin-id', 
          username: 'admin', 
          role: 'ADMIN' 
        },
        JWT_SECRET,
        { expiresIn: '24h' }
      )

      const userData = {
        id: 'admin-id',
        username: 'admin',
        email: 'admin@restaurant.com',
        role: 'ADMIN',
        firstName: 'مدیر',
        lastName: 'سیستم'
      }

      console.log('Login API: Token generated, creating response')

      // Create response
      const response = NextResponse.json({
        success: true,
        message: 'ورود موفقیت‌آمیز',
        data: {
          token,
          user: userData
        }
      })

      // Set token in HTTP-only cookie
      // This is critical for security and middleware authentication
      response.cookies.set('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24, // 24 hours in seconds
        path: '/'
      })

      console.log('Login API: Cookie set, returning success response')
      return response
    }

    // Invalid credentials
    console.log('Login API: Invalid credentials')
    return NextResponse.json(
      {
        success: false,
        message: 'نام کاربری یا رمز عبور اشتباه است'
      },
      { status: 401 }
    )
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      {
        success: false,
        message: 'خطا در ورود به سیستم',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
