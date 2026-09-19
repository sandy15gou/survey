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
    const headers = ['No', 'Waktu Submit', 'Nama Mahasiswa', 'NIM', 'Program Studi', 'Semester'];
    survey.questions.forEach((q, idx) => {
      const escapedText = q.text.split('"').join('""');
      headers.push(`"Q${idx + 1}: ${escapedText}"`);
    });

    const rows: string[] = [headers.join(',')];

    // Susun Data Rows
    survey.respondents.forEach((resp, index) => {
      const cleanName = (resp.name || 'Anonim').split('"').join('""');
      const cleanNim = (resp.nim || '-').split('"').join('""');
      const cleanProdi = (resp.prodi || resp.info || '-').split('"').join('""');
      const cleanSemester = (resp.semester || '-').split('"').join('""');
      const dateStr = new Date(resp.submittedAt).toLocaleString('id-ID');

      const row = [
        index + 1,
        `"${dateStr}"`,
        `"${cleanName}"`,
        `"${cleanNim}"`,
        `"${cleanProdi}"`,
        `"${cleanSemester}"`
      ];

      survey.questions.forEach((q) => {
        const ans = resp.answers.find(a => a.questionId === q.id);
        const val = ans ? ans.value.split('"').join('""').replace(/\r?\n/g, ' ') : '-';
        row.push(`"${val}"`);
      });

      rows.push(row.join(','));
    });

    const csvData = '\uFEFF' + rows.join('\r\n'); // Dengan BOM UTF-8 agar Excel membaca karakter dengan benar

    const dateTag = new Date().toISOString().slice(0, 10);
    return new Response(csvData, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="survey-rekap-uin-${dateTag}.csv"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
