import { NextResponse } from 'next/server';
import { TaskHazardResponse } from '@/types/task-hazard';
import { z } from 'zod';

// Validation schema for the request
const riskSchema = z.object({
  riskDescription: z.string(),
  riskType: z.string(),
  asIsLikelihood: z.enum(['Very Unlikely', 'Unlikely', 'Likely', 'Very Likely']),
  asIsConsequence: z.enum(["Minor", "Moderate", "Serious", "Critical"]),
  mitigatingAction: z.string(),
  mitigatingActionType: z.string(),
  mitigatedLikelihood: z.enum(['Very Unlikely', 'Unlikely', 'Likely', 'Very Likely']),
  mitigatedConsequence: z.enum(["Minor", "Moderate", "Serious", "Critical"]),
  requiresSupervisorSignature: z.boolean(),
});

const taskHazardSchema = z.object({
  id: z.string().min(1, 'ID is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  time: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, 'Time must be in HH:MM format'),
  scopeOfWork: z.string().min(1, 'Scope of work is required'),
  assetSystem: z.string().min(1, 'Asset system is required'),
  systemLockoutRequired: z.boolean(),
  trainedWorkforce: z.string().min(1, 'Trained workforce is required'),
  individual: z.string().min(1, 'Individual is required'),
  supervisor: z.string().min(1, 'Supervisor is required'),
  location: z.string().min(1, 'Location is required'),
  risks: z.array(riskSchema).min(1, 'At least one risk is required'),
  geoFenceLimit: z.number().optional().default(200),
});

export async function POST(request: Request): Promise<NextResponse<TaskHazardResponse>> {
  try {
    const body = await request.json();
    
    // Validate the request body
    const validatedData = taskHazardSchema.parse(body);
        
    return NextResponse.json({
      success: true,
      data: validatedData,
    });
    
  } catch (error) {
    console.error('Error processing task hazard:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        success: false,
        error: 'Validation error: ' + error.errors.map(e => e.message).join(', '),
      }, { status: 400 });
    }
    
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
    }, { status: 500 });
  }
} 