import { NextRequest, NextResponse } from 'next/server';
import { getWritingTechniques, getWritingTechniqueById, createWritingTechnique, updateWritingTechnique, deleteWritingTechnique, getTechniqueCategories, createTechniqueCategory } from '@/lib/db/queries';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const stage = searchParams.get('stage');
  const categories = searchParams.get('categories');

  try {
    if (categories === 'true') {
      const result = await getTechniqueCategories();
      return NextResponse.json(result);
    }

    if (id) {
      const result = await getWritingTechniqueById(parseInt(id));
      return NextResponse.json(result);
    }

    const result = await getWritingTechniques(category || undefined, stage || undefined);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to fetch writing techniques:', error);
    return NextResponse.json({ error: 'Failed to fetch writing techniques' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === 'category') {
      const result = await createTechniqueCategory(body);
      return NextResponse.json(result);
    }

    const result = await createWritingTechnique(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to create writing technique:', error);
    return NextResponse.json({ error: 'Failed to create writing technique' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const result = await updateWritingTechnique(id, data);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Failed to update writing technique:', error);
    return NextResponse.json({ error: 'Failed to update writing technique' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  try {
    const result = await deleteWritingTechnique(parseInt(id));
    return NextResponse.json({ success: result });
  } catch (error) {
    console.error('Failed to delete writing technique:', error);
    return NextResponse.json({ error: 'Failed to delete writing technique' }, { status: 500 });
  }
}
