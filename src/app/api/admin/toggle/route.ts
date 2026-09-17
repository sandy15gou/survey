import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/auth';

export async function POST(req: Request) {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { surveyId, isActive } = await req.json();
    const updated = await prisma.survey.update({
      where: { id: surveyId },
      data: { isActive: Boolean(isActive) }
    });

    return NextResponse.json({ success: true, isActive: updated.isActive });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
