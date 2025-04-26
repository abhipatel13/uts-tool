import { NextRequest, NextResponse } from 'next/server';
import { tacticsApi } from '@/services/tacticsApi';

interface ApiError extends Error {
  status?: number;
}

// Helper function to handle errors
const handleError = (error: ApiError | unknown, message: string) => {
  console.error(message, error);
  const status = error instanceof Error && 'status' in error ? (error as ApiError).status : 500;
  return NextResponse.json(
    { error: message },
    { status }
  );
};

// GET all tactics
export async function GET() {
  try {
    const response = await tacticsApi.getAll();
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, 'Failed to fetch tactics');
  }
}

// POST new tactic
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await tacticsApi.create(body);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    return handleError(error, 'Failed to create tactic');
  }
}

// PUT update tactic
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await tacticsApi.update(body.id, body);
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, 'Failed to update tactic');
  }
}

// DELETE tactic
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'ID is required' },
        { status: 400 }
      );
    }

    const response = await tacticsApi.delete(id);
    return NextResponse.json(response);
  } catch (error) {
    return handleError(error, 'Failed to delete tactic');
  }
} 