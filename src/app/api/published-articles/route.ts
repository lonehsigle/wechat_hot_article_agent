import { NextRequest, NextResponse } from 'next/server';
import { getPublishedArticles, getPublishedArticleById, createPublishedArticle, updatePublishedArticle, getArticleStats, createArticleStats } from '@/lib/db/queries';
import { initDatabase } from '@/lib/db';
import { successResponse, errorResponse } from '@/lib/utils/api-response';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    initDatabase();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const stats = searchParams.get('stats');

    if (id && stats === 'true') {
      const articleStats = await getArticleStats(parseInt(id));
      return successResponse(articleStats);
    }

    if (id) {
      const article = await getPublishedArticleById(parseInt(id));
      return successResponse(article);
    }

    const limit = parseInt(searchParams.get('limit') || '50');
    const articles = await getPublishedArticles(limit);
    return successResponse(articles);
  } catch (error) {
    console.error('Error fetching published articles:', error);
    return errorResponse('Failed to fetch published articles');
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    initDatabase();
    const body = await request.json();

    if (body.stats) {
      const stats = await createArticleStats(body.stats);
      return successResponse(stats);
    }

    const article = await createPublishedArticle(body);
    return successResponse(article);
  } catch (error) {
    console.error('Error creating published article:', error);
    return errorResponse('Failed to create published article');
  }
}

export async function PUT(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    initDatabase();
    const body = await request.json();
    const { id, ...data } = body;
    const article = await updatePublishedArticle(id, data);
    return successResponse(article);
  } catch (error) {
    console.error('Error updating published article:', error);
    return errorResponse('Failed to update published article');
  }
}
