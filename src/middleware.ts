import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // If accessing the root and there's a universal user token, redirect to universal portal
  if (pathname === '/') {
    const token = request.cookies.get('token')?.value
    const userData = request.cookies.get('user')?.value
    
    if (token && userData) {
      try {
        const user = JSON.parse(userData)
        if (user.role === 'universal_user') {
          return NextResponse.redirect(new URL('/universal-portal', request.url))
        }
      } catch (error) {
        // Invalid user data, continue to normal flow
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/']
} 