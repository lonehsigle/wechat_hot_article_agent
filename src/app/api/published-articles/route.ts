import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticles, getPublishedArticleById, createPublishedArticle, updatePublishedArticle, getArticleStats, createArticleStats } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const stats = searchParams.get('stats');
    
    if (id && stats === 'true') {
      const articleStats = await getArticleStats(parseInt(id));
      return NextResponse.json(articleStats);
    }
    
    if (id) {
      const article = await getPublishedArticleById(parseInt(id));
      return NextResponse.json(article);
    }
    
    const limit = parseInt(searchParams.get('limit') || '50');
    const articles = await getPublishedArticles(limit);
    return NextResponse.json(articles);
  } catch (error) {
    console.error('Error fetching published articles:', error);
    return NextResponse.json({ error: 'Failed to fetch published articles' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    
    if (body.stats) {
      const stats = await createArticleStats(body.stats);
      return NextResponse.json(stats);
    }
    
    const article = await createPublishedArticle(body);
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error creating published article:', error);
    return NextResponse.json({ error: 'Failed to create published article' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    initDatabase();
    const body = await request.json();
    const { id, ...data } = body;
    const article = await updatePublishedArticle(id, data);
    return NextResponse.json(article);
  } catch (error) {
    console.error('Error updating published article:', error);
    return NextResponse.json({ error: 'Failed to update published article' }, { status: 500 });
  }
}
