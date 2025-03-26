import { NextResponse } from 'next/server';
import { z } from 'zod';

// Validation schema for geo fence settings
const geoFenceSettingsSchema = z.object({
  limit: z.number().min(0).max(1000).default(200),
});

export async function GET() {
  try {
    // For now, return default settings
    // In a real application, this would fetch from a database
    return NextResponse.json({
      success: true,
      data: {
        limit: 200,
      },
    });
  } catch (error) {
    console.error('Error fetching geo fence settings:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch geo fence settings',
    }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = geoFenceSettingsSchema.parse(body);
    
    // For now, just return the validated data
    // In a real application, this would update the database
    return NextResponse.json({
      success: true,
      data: validatedData,
    });
  } catch (error) {
    console.error('Error updating geo fence settings:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error: ' + error.errors.map(e => e.message).join(', '),
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Failed to update geo fence settings',
    }, { status: 500 });
  }
} 