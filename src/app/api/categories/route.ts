import { NextRequest, NextResponse } from 'next/server';
import { getMonitorCategories, getMonitorCategoryById, createMonitorCategory, updateMonitorCategory, deleteMonitorCategory } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

function parseId(value: string | number | null | undefined): number | null {
  const id = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function normalizeStringArray(value: unknown, fieldName: string): string[] | null | undefined {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (!Array.isArray(value)) {
    throw new Error(`${fieldName} must be an array`);
  }
  return Array.from(new Set(value.map(item => String(item).trim()).filter(Boolean)));
}

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const parsedId = parseId(id);
      if (!parsedId) return errorResponse('Invalid ID', 400);
      const category = await getMonitorCategoryById(parsedId);
      return successResponse(category);
    }

    const categories = await getMonitorCategories();
    return successResponse(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return errorResponse('Failed to fetch categories');
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    if (!body.name || typeof body.name !== 'string' || !body.name.trim()) {
      return errorResponse('Name is required', 400);
    }
    const category = await createMonitorCategory({
      name: body.name.trim(),
      platforms: normalizeStringArray(body.platforms, 'platforms'),
      keywords: normalizeStringArray(body.keywords, 'keywords'),
      creators: normalizeStringArray(body.creators, 'creators'),
    });
    return successResponse(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to create category');
  }
}

export async function PUT(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { id, ...data } = body;
    const parsedId = parseId(id);
    if (!parsedId) return errorResponse('Invalid ID', 400);

    const updateData: Parameters<typeof updateMonitorCategory>[1] = {};
    if (data.name !== undefined) {
      if (typeof data.name !== 'string' || !data.name.trim()) {
        return errorResponse('Name cannot be empty', 400);
      }
      updateData.name = data.name.trim();
    }
    updateData.platforms = normalizeStringArray(data.platforms, 'platforms');
    updateData.keywords = normalizeStringArray(data.keywords, 'keywords');
    updateData.creators = normalizeStringArray(data.creators, 'creators');

    const category = await updateMonitorCategory(parsedId, updateData);
    return successResponse(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return errorResponse(error instanceof Error ? error.message : 'Failed to update category');
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return errorResponse('ID is required', 400);
    }

    const parsedId = parseId(id);
    if (!parsedId) return errorResponse('Invalid ID', 400);

    const success = await deleteMonitorCategory(parsedId);
    return successResponse(success);
  } catch (error) {
    console.error('Error deleting category:', error);
    return errorResponse('Failed to delete category');
  }
}
