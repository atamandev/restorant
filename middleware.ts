import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-here'

// Simple token validation (just checks if token exists and has basic structure)
// Full verification happens in API routes where we can use async
function isValidTokenFormat(token: string): boolean {
  if (!token || token.length < 10) {
    return false
  }
  
  // JWT tokens have 3 parts separated by dots
  const parts = token.split('.')
  if (parts.length !== 3) {
    return false
  }
  
  return true
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip middleware for static files and Next.js internals - MUST BE FIRST
  // This includes all _next routes, static assets, and file extensions
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/static/') ||
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map|json)$/i)
  ) {
    return NextResponse.next()
  }

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/placeholder',
    '/uploads'
  ]

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // Get token from cookie (primary method for browser requests)
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  // If no token, require authentication
  if (!token) {
    if (pathname.startsWith('/api/')) {
      // API routes return 401
      return NextResponse.json(
        { success: false, message: 'احراز هویت لازم است' },
        { status: 401 }
      )
    }
    
    // Pages redirect to login with redirect parameter
    try {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    } catch (error) {
      console.error('Error creating login URL:', error)
      // Fallback: redirect to login without redirect param
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Basic token format validation
  // Full verification happens in API routes where we can use async/await
  if (!isValidTokenFormat(token)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      )
    }
    
    // Clear invalid token and redirect to login
    try {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      const response = NextResponse.redirect(loginUrl)
      response.cookies.delete('token')
      return response
    } catch (error) {
      console.error('Error creating login URL:', error)
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete('token')
      return response
    }
  }

  // Token format is valid, allow access
  // Full verification will happen in API routes if needed
  const response = NextResponse.next()
  
  // Set user info in headers for API routes (optional, for convenience)
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-token-present', 'true')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (webpack hot module replacement)
     * - favicon.ico (favicon file)
     * - Static file extensions
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|_next/data|favicon.ico|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map|json)$).*)',
  ],
}
