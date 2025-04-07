import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    // Get the request body
    const body = await request.json()
    const { email, password } = body

    // Forward the request to the backend API
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    })

    // Get the response data
    const data = await response.json()

    // If the backend returns an error, return it to the client
    if (!response.ok) {
      return NextResponse.json(
        { error: data.error || 'Authentication failed' },
        { status: response.status }
      )
    }

    // Return the successful response from the backend
    return NextResponse.json(data)
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
} 