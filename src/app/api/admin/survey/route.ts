import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/auth';

// PUT: Update Metadata Survey (Judul & Deskripsi)
export async function PUT(req: Request) {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Sesi admin tidak valid.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, title, description } = body;

    if (!id || !title?.trim()) {
      return NextResponse.json({ success: false, message: 'ID dan Judul Kuesioner wajib diisi.' }, { status: 400 });
    }

    const updated = await prisma.survey.update({
      where: { id },
      data: {
        title: title.trim(),
        description: description?.trim() || null,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Informasi kuesioner berhasil diperbarui!',
      data: updated
    });
  } catch (error: any) {
    console.error('Failed to update survey info:', error);
    return NextResponse.json({ success: false, message: error.message || 'Gagal memperbarui info survei.' }, { status: 500 });
  }
}
