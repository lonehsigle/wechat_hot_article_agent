import { NextRequest, NextResponse } from 'next/server';
import { getMonitorCategories, getMonitorCategoryById, createMonitorCategory, updateMonitorCategory, deleteMonitorCategory } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const category = await getMonitorCategoryById(parseInt(id));
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
    const category = await createMonitorCategory(body);
    return successResponse(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return errorResponse('Failed to create category');
  }
}

export async function PUT(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { id, ...data } = body;
    const category = await updateMonitorCategory(id, data);
    return successResponse(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return errorResponse('Failed to update category');
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

    const success = await deleteMonitorCategory(parseInt(id));
    return successResponse(success);
  } catch (error) {
    console.error('Error deleting category:', error);
    return errorResponse('Failed to delete category');
  }
}
