import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the token from the request headers
    const token = request.headers.get('Authorization')?.replace('Bearer ', '')
    
    // Forward the request to the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    })

    // Get the response data
    const data = await response.json()

    // Create a response
    const nextResponse = NextResponse.json(data)
    
    // Clear auth cookies by setting them to expire
    nextResponse.cookies.delete('token')
    nextResponse.cookies.delete('user')
    
    // Return the response
    return nextResponse
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json(
      { success: false, message: "Error during logout" },
      { status: 500 }
    )
  }
} 