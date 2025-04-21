import { NextRequest, NextResponse } from 'next/server';
import { tacticsApi } from '@/services/tacticsApi';

interface Tactic {
  id?: number;
  name: string;
  description: string;
  companyId: number;
  createdBy: number;
  updatedBy: number;
}

// GET all tactics
export async function GET() {
  try {
    const response = await tacticsApi.getAll();
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching tactics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch tactics' },
      { status: 500 }
    );
  }
}

// POST new tactic
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await tacticsApi.create(body);
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating tactic:', error);
    return NextResponse.json(
      { error: 'Failed to create tactic' },
      { status: 500 }
    );
  }
}

// PUT update tactic
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const response = await tacticsApi.update(body.id, body);
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating tactic:', error);
    return NextResponse.json(
      { error: 'Failed to update tactic' },
      { status: 500 }
    );
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

    const response = await tacticsApi.delete(Number(id));
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error deleting tactic:', error);
    return NextResponse.json(
      { error: 'Failed to delete tactic' },
      { status: 500 }
    );
  }
} 