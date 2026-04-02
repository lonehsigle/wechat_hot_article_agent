import { NextRequest, NextResponse } from 'next/server';
import { getMonitorCategories, getMonitorCategoryById, createMonitorCategory, updateMonitorCategory, deleteMonitorCategory } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (id) {
      const category = await getMonitorCategoryById(parseInt(id));
      return NextResponse.json(category);
    }
    
    const categories = await getMonitorCategories();
    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const category = await createMonitorCategory(body);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json({ error: 'Failed to create category' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { id, ...data } = body;
    const category = await updateMonitorCategory(id, data);
    return NextResponse.json(category);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    
    if (!id) {
      return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    }
    
    const success = await deleteMonitorCategory(parseInt(id));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
