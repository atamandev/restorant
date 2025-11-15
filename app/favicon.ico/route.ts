import { NextRequest, NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { join } from 'path'

export async function GET(request: NextRequest) {
  try {
    // Try to read favicon from public folder first
    try {
      const publicPath = join(process.cwd(), 'public', 'favicon.ico')
      const file = await readFile(publicPath)
      return new NextResponse(file, {
        status: 200,
        headers: {
          'Content-Type': 'image/x-icon',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    } catch {
      // If file doesn't exist, return SVG icon
      const svg = `<svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect width="32" height="32" rx="6" fill="#10b981"/>
        <path d="M16 8C14.9 8 14 8.9 14 10V14C14 15.1 14.9 16 16 16C17.1 16 18 15.1 18 14V10C18 8.9 17.1 8 16 8Z" fill="white"/>
        <path d="M12 20V22C12 23.1 12.9 24 14 24H18C19.1 24 20 23.1 20 22V20H12Z" fill="white"/>
        <path d="M20 12H24C25.1 12 26 12.9 26 14V18C26 19.1 25.1 20 24 20H20V12Z" fill="white"/>
        <path d="M8 12H12V20H8C6.9 20 6 19.1 6 18V14C6 12.9 6.9 12 8 12Z" fill="white"/>
      </svg>`

      return new NextResponse(svg, {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml',
          'Cache-Control': 'public, max-age=31536000, immutable',
        },
      })
    }
  } catch (error) {
    console.error('Favicon error:', error)
    // Return empty response with 200 status to prevent errors
    return new NextResponse('', { 
      status: 200,
      headers: {
        'Content-Type': 'image/x-icon',
      },
    })
  }
}

