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
    
    // Process the data to create asset hierarchy
    const assets = lines.slice(1).map(line => {
      const values = line.split(',')
      return {
        id: values[0] || '',
        name: values[1] || '',
        description: values[2] || '',
        level: parseInt(values[3] || '0'),
        parent: values[4] || null,
        fmea: parseInt(values[5] || '0'),
        actions: parseInt(values[6] || '0'),
        criticalityAssessment: parseInt(values[7] || '0'),
        inspectionPoints: parseInt(values[8] || '0'),
      }
    }).filter(asset => asset.id) // Remove empty rows

    // Return the processed data
    return NextResponse.json({ assets })
  } catch (error) {
    console.error('Error processing file:', error)
    return NextResponse.json(
      { error: 'Failed to process file' },
      { status: 500 }
    )
  }
} 