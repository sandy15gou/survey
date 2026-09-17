import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Akses Ditolak. Silakan masukkan passkey admin.' }, { status: 401 });
  }

  try {
    const survey = await prisma.survey.findFirst({
      include: {
        questions: {
          orderBy: { order: 'asc' }
        },
        respondents: {
          orderBy: { submittedAt: 'desc' },
          include: {
            answers: true
          }
        }
      }
    });

    if (!survey) {
      return NextResponse.json({ success: true, data: null });
    }

    // Hitung statistik analitik
    const totalRespondents = survey.respondents.length;
    
    // Rata-rata rating dan distribusi pilihan ganda
    const stats: Record<string, any> = {};

    survey.questions.forEach((q) => {
      const qAnswers = survey.respondents.flatMap(r => 
        r.answers.filter(a => a.questionId === q.id)
      );

      if (q.type === 'RATING') {
        const numericValues = qAnswers.map(a => Number(a.value)).filter(v => !isNaN(v));
        const avg = numericValues.length > 0 
          ? (numericValues.reduce((acc, curr) => acc + curr, 0) / numericValues.length).toFixed(1)
          : '0.0';
        
        const counts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        numericValues.forEach(v => {
          if (counts[v] !== undefined) counts[v]++;
        });

        stats[q.id] = { type: 'RATING', average: avg, counts, total: numericValues.length };
      } else if (q.type === 'CHOICE') {
        const counts: Record<string, number> = {};
        let options: string[] = [];
        try {
          options = q.options ? JSON.parse(q.options) : [];
        } catch {
          options = [];
        }
        options.forEach(opt => counts[opt] = 0);

        qAnswers.forEach(a => {
          counts[a.value] = (counts[a.value] || 0) + 1;
        });

        stats[q.id] = { type: 'CHOICE', counts, total: qAnswers.length };
      } else {
        stats[q.id] = { type: 'TEXT', count: qAnswers.length };
      }
    });

    return NextResponse.json({
      success: true,
      data: {
        survey,
        totalRespondents,
        stats
      }
    });
  } catch (error: any) {
    console.error('Failed to load admin data:', error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
