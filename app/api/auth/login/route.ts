import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({
        success: false,
        message: 'نام کاربری و رمز عبور الزامی است'
      }, { status: 400 })
    }

    // Simple hardcoded admin check for now
    if (username === 'admin' && password === '123456') {
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

      return NextResponse.json({
        success: true,
        message: 'ورود موفقیت‌آمیز',
        data: {
          token,
          user: {
            id: 'admin-id',
            username: 'admin',
            email: 'admin@restaurant.com',
            role: 'ADMIN',
            firstName: 'مدیر',
            lastName: 'سیستم'
          }
        }
      })
    }

    return NextResponse.json({
      success: false,
      message: 'نام کاربری یا رمز عبور اشتباه است'
    }, { status: 401 })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({
      success: false,
      message: 'خطا در ورود به سیستم',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
