import { NextRequest, NextResponse } from 'next/server';
import { tacticsApi } from '@/services/tacticsApi';

// Helper function to handle errors
const handleError = (error: any, message: string) => {
  console.error(message, error);
  return NextResponse.json(
    { error: message },
    { status: error?.status || 500 }
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