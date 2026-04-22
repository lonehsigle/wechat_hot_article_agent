import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { ipPlans } from '@/lib/db/schema';
import { eq, desc } from 'drizzle-orm';
import { verifyAuth, unauthorizedResponse } from '@/lib/auth';

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null;
  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  const searchParams = request.nextUrl.searchParams;
  const action = searchParams.get('action');

  try {
    if (action === 'list') {
      const plans = await db()
        .select()
        .from(ipPlans)
        .orderBy(desc(ipPlans.createdAt));

      return NextResponse.json({
        success: true,
        plans: plans.map(p => ({
          ...p,
          industryAnalysis: safeJsonParse(p.industryAnalysis),
          personaTraits: safeJsonParse(p.personaTraits),
          executionPlan: safeJsonParse(p.executionPlan),
          contentCalendar: safeJsonParse(p.contentCalendar),
          milestones: safeJsonParse(p.milestones),
          monetizationPath: safeJsonParse(p.monetizationPath),
          revenueModel: safeJsonParse(p.revenueModel),
          pricingStrategy: safeJsonParse(p.pricingStrategy),
        })),
      });
    }

    if (action === 'detail') {
      const id = parseInt(searchParams.get('id') || '0');
      if (!id) {
        return NextResponse.json({ success: false, error: '缺少方案ID' }, { status: 400 });
      }
      const [plan] = await db()
        .select()
        .from(ipPlans)
        .where(eq(ipPlans.id, id));

      if (!plan) {
        return NextResponse.json({ success: false, error: '方案不存在' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        plan: {
          ...plan,
          industryAnalysis: safeJsonParse(plan.industryAnalysis),
          personaTraits: safeJsonParse(plan.personaTraits),
          executionPlan: safeJsonParse(plan.executionPlan),
          contentCalendar: safeJsonParse(plan.contentCalendar),
          milestones: safeJsonParse(plan.milestones),
          monetizationPath: safeJsonParse(plan.monetizationPath),
          revenueModel: safeJsonParse(plan.revenueModel),
          pricingStrategy: safeJsonParse(plan.pricingStrategy),
        },
      });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('[IP方案] API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authenticated) {
    return unauthorizedResponse();
  }

  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'create') {
      const { name, industry, industryAnalysis, accountName, accountAvatar, accountBio, accountStyle, personaName, personaTraits, personaStory, personaVoice, executionPlan, contentCalendar, milestones, monetizationPath, revenueModel, pricingStrategy } = body;

      if (!name) {
        return NextResponse.json({ success: false, error: '方案名称不能为空' }, { status: 400 });
      }

      const result = await db()
        .insert(ipPlans)
        .values({
          name,
          industry: industry || '',
          industryAnalysis: industryAnalysis ? JSON.stringify(industryAnalysis) : null,
          accountName: accountName || '',
          accountAvatar: accountAvatar || '',
          accountBio: accountBio || '',
          accountStyle: accountStyle || '',
          personaName: personaName || '',
          personaTraits: personaTraits ? JSON.stringify(personaTraits) : null,
          personaStory: personaStory || '',
          personaVoice: personaVoice || '',
          executionPlan: executionPlan ? JSON.stringify(executionPlan) : null,
          contentCalendar: contentCalendar ? JSON.stringify(contentCalendar) : null,
          milestones: milestones ? JSON.stringify(milestones) : null,
          monetizationPath: monetizationPath ? JSON.stringify(monetizationPath) : null,
          revenueModel: revenueModel ? JSON.stringify(revenueModel) : null,
          pricingStrategy: pricingStrategy ? JSON.stringify(pricingStrategy) : null,
          status: 'active',
        })
        .returning({ id: ipPlans.id });

      return NextResponse.json({
        success: true,
        id: result[0].id,
        message: 'IP方案创建成功',
      });
    }

    if (action === 'update') {
      const { id, ...updateData } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: '缺少方案ID' }, { status: 400 });
      }

      const fieldsToUpdate: Record<string, unknown> = { updatedAt: new Date() };
      const jsonFields = ['industryAnalysis', 'personaTraits', 'executionPlan', 'contentCalendar', 'milestones', 'monetizationPath', 'revenueModel', 'pricingStrategy'];
      const textFields = ['name', 'industry', 'accountName', 'accountAvatar', 'accountBio', 'accountStyle', 'personaName', 'personaStory', 'personaVoice', 'status'];

      for (const field of textFields) {
        if (updateData[field] !== undefined) {
          fieldsToUpdate[field] = updateData[field];
        }
      }

      for (const field of jsonFields) {
        if (updateData[field] !== undefined) {
          fieldsToUpdate[field] = updateData[field] ? JSON.stringify(updateData[field]) : null;
        }
      }

      await db()
        .update(ipPlans)
        .set(fieldsToUpdate)
        .where(eq(ipPlans.id, id));

      return NextResponse.json({
        success: true,
        message: 'IP方案更新成功',
      });
    }

    if (action === 'delete') {
      const { id } = body;
      if (!id) {
        return NextResponse.json({ success: false, error: '缺少方案ID' }, { status: 400 });
      }

      await db()
        .delete(ipPlans)
        .where(eq(ipPlans.id, id));

      return NextResponse.json({
        success: true,
        message: 'IP方案删除成功',
      });
    }

    return NextResponse.json({ success: false, error: '未知操作' }, { status: 400 });
  } catch (error) {
    console.error('[IP方案] API错误:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
