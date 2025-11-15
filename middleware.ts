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

  // CRITICAL: Skip middleware for ALL Next.js internal files FIRST
  // This MUST be the first check to prevent any interference
  if (
    // Next.js internal routes
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/next/') ||
    pathname.startsWith('/static/') ||
    // Static file extensions
    pathname.match(/\.(ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map|json|webp|avif)$/i) ||
    // Common static files
    pathname === '/favicon.ico' ||
    pathname === '/icon.svg' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml'
  ) {
    return NextResponse.next()
  }

  // TEMPORARY: Allow all routes to pass through to debug 404 issues
  // TODO: Re-enable authentication after fixing routing issues
  return NextResponse.next()

  // Public routes that don't require authentication
  const publicRoutes = [
    '/login',
    '/order',
    '/test-menu',
    '/api/auth/login',
    '/api/auth/logout',
    '/api/placeholder',
    '/api/menu-items',
    '/api/menu-items/add-test-items',
    '/uploads'
  ]

  // Check if route is public
  const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route))

  if (isPublicRoute) {
    return NextResponse.next()
  }

  // For protected routes, check authentication
  const token = request.cookies.get('token')?.value ||
    request.headers.get('authorization')?.replace('Bearer ', '')

  // If no token, redirect to login (but allow the page to load first)
  if (!token) {
    if (pathname.startsWith('/api/')) {
      // API routes return 401
      return NextResponse.json(
        { success: false, message: 'احراز هویت لازم است' },
        { status: 401 }
      )
    }
    
    // For pages, redirect to login
    try {
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    } catch (error) {
      console.error('Error creating login URL:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  // Validate token format
  if (!isValidTokenFormat(token)) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json(
        { success: false, message: 'توکن نامعتبر است' },
        { status: 401 }
      )
    }
    
    // Clear invalid token and redirect
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

  // Token is valid, allow access
  const response = NextResponse.next()
  
  if (pathname.startsWith('/api/')) {
    response.headers.set('x-token-present', 'true')
  }
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT Next.js internals and static files
     * This is the simplest and most reliable pattern
     */
    '/((?!_next|next|static|favicon\\.ico|icon\\.svg|robots\\.txt|sitemap\\.xml|.*\\.(?:ico|png|jpg|jpeg|gif|svg|css|js|woff|woff2|ttf|eot|map|json|webp|avif)$).*)',
  ],
}
