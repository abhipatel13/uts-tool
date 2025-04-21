import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      )
    }

    // Read the file as text
    const text = await file.text()
    
    // Parse CSV
    const lines = text.split('\n')
    const headers = lines[0].split(',')
    
    // Process the data to create tactics
    const tactics = lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        name: values[0] || '',
        location: values[1] || '',
        status: values[2]?.toLowerCase() || 'inactive',
        description: values[3] || ''
      }
    }).filter(tactic => tactic.name) // Remove empty rows

    // Create tactics in the database
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tactics`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(tactics),
    })

    if (!response.ok) {
      throw new Error('Failed to create tactics')
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
} 