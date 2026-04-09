import { NextRequest, NextResponse } from 'next/server';
import { getWritingTechniques, getWritingTechniqueById, createWritingTechnique, updateWritingTechnique, deleteWritingTechnique, getTechniqueCategories, createTechniqueCategory } from '@/lib/db/queries';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const category = searchParams.get('category');
  const stage = searchParams.get('stage');
  const categories = searchParams.get('categories');

  try {
    if (categories === 'true') {
      const result = await getTechniqueCategories();
      return successResponse(result);
    }

    if (id) {
      const result = await getWritingTechniqueById(parseInt(id));
      return successResponse(result);
    }

    const result = await getWritingTechniques(category || undefined, stage || undefined);
    return successResponse(result);
  } catch (error) {
    console.error('Failed to fetch writing techniques:', error);
    return errorResponse('Failed to fetch writing techniques');
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.type === 'category') {
      const result = await createTechniqueCategory(body);
      return successResponse(result);
    }

    const result = await createWritingTechnique(body);
    return successResponse(result);
  } catch (error) {
    console.error('Failed to create writing technique:', error);
    return errorResponse('Failed to create writing technique');
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ...data } = body;
    const result = await updateWritingTechnique(id, data);
    return successResponse(result);
  } catch (error) {
    console.error('Failed to update writing technique:', error);
    return errorResponse('Failed to update writing technique');
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return errorResponse('ID is required', 400);
  }

  try {
    const result = await deleteWritingTechnique(parseInt(id));
    return successResponse(result);
  } catch (error) {
    console.error('Failed to delete writing technique:', error);
    return errorResponse('Failed to delete writing technique');
  }
}
