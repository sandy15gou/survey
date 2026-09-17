import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Ambil survey aktif beserta pertanyaan
export async function GET() {
  try {
    const survey = await prisma.survey.findFirst({
      where: { isActive: true },
      include: {
        questions: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!survey) {
      return NextResponse.json({ 
        success: false, 
        message: 'Saat ini belum ada survey yang aktif.' 
      }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: survey });
  } catch (error: any) {
    console.error('Failed to fetch survey:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Gagal menghubungkan ke database: ' + (error.message || error) 
    }, { status: 500 });
  }
}

// POST: Responden submit jawaban
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { surveyId, name, info, answers } = body;

    if (!surveyId || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ 
        success: false, 
        message: 'Format data respon tidak valid.' 
      }, { status: 400 });
    }

    // Pastikan survey masih aktif
    const survey = await prisma.survey.findUnique({
      where: { id: surveyId }
    });

    if (!survey || !survey.isActive) {
      return NextResponse.json({ 
        success: false, 
        message: 'Mohon maaf, survey ini telah ditutup oleh admin.' 
      }, { status: 400 });
    }

    // Simpan responden dan jawabannya secara atomic transaction
    const result = await prisma.$transaction(async (tx) => {
      const respondent = await tx.respondent.create({
        data: {
          surveyId,
          name: name?.trim() || 'Anonim',
          info: info?.trim() || null,
        }
      });

      const answerData = answers
        .filter((ans: any) => ans.questionId && ans.value !== undefined && ans.value !== null && ans.value !== '')
        .map((ans: any) => ({
          respondentId: respondent.id,
          questionId: ans.questionId,
          value: String(ans.value),
        }));

      if (answerData.length > 0) {
        await tx.answer.createMany({
          data: answerData
        });
      }

      return respondent;
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Terima kasih, jawaban survey Anda berhasil disimpan!',
      respondentId: result.id 
    });
  } catch (error: any) {
    console.error('Failed to submit response:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Gagal menyimpan jawaban: ' + (error.message || error) 
    }, { status: 500 });
  }
}
