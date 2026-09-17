import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/auth';

export async function GET() {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const survey = await prisma.survey.findFirst({
      include: {
        questions: { orderBy: { order: 'asc' } },
        respondents: {
          orderBy: { submittedAt: 'desc' },
          include: { answers: true }
        }
      }
    });

    if (!survey) {
      return new Response('No data found', { status: 404 });
    }

    // Susun Header CSV
    const headers = ['No', 'Waktu Submit', 'Nama Responden', 'Info/Kelas'];
    survey.questions.forEach((q, idx) => {
      headers.push(`"Q${idx + 1}: ${q.text.replace(/"/g, '""')}"`);
    });

    const rows: string[] = [headers.join(',')];

    // Susun Data Rows
    survey.respondents.forEach((resp, index) => {
      const row = [
        index + 1,
        `"${new Date(resp.submittedAt).toLocaleString('id-ID')}"`,
        `"${(resp.name || 'Anonim').replace(/"/g, '""')}"`,
        `"${(resp.info || '-').replace(/"/g, '""')}"`
      ];

      survey.questions.forEach((q) => {
        const ans = resp.answers.find(a => a.questionId === q.id);
        const val = ans ? ans.value.replace(/"/g, '""').replace(/\n/g, ' ') : '-';
        row.push(`"${val}"`);
      });

      rows.push(row.join(','));
    });

    const csvData = '\uFEFF' + rows.join('\r\n'); // Dengan BOM UTF-8 agar Excel membaca karakter dengan benar

    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="survey-rekap-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
