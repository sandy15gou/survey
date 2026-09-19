import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { isAuthenticatedAdmin } from '@/lib/auth';

// POST: Tambah Pertanyaan Baru
export async function POST(req: Request) {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Sesi admin tidak valid.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { surveyId, text, type, options, isRequired } = body;

    if (!surveyId || !text?.trim() || !type) {
      return NextResponse.json({ success: false, message: 'Parameter tidak lengkap (surveyId, text, type wajib diisi).' }, { status: 400 });
    }

    // Cari urutan terakhir
    const lastQuestion = await prisma.question.findFirst({
      where: { surveyId },
      orderBy: { order: 'desc' }
    });
    const nextOrder = lastQuestion ? lastQuestion.order + 1 : 0;

    const formattedOptions = type === 'CHOICE' && Array.isArray(options) ? JSON.stringify(options) : (type === 'CHOICE' && typeof options === 'string' ? options : null);

    const question = await prisma.question.create({
      data: {
        surveyId,
        text: text.trim(),
        type,
        options: formattedOptions,
        isRequired: isRequired ?? true,
        order: nextOrder,
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Pertanyaan baru berhasil ditambahkan!',
      data: question
    });
  } catch (error: any) {
    console.error('Failed to create question:', error);
    return NextResponse.json({ success: false, message: error.message || 'Gagal menambahkan pertanyaan.' }, { status: 500 });
  }
}

// PUT: Update Pertanyaan yang Ada
export async function PUT(req: Request) {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Sesi admin tidak valid.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { id, text, type, options, isRequired, order } = body;

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID Pertanyaan wajib disertakan.' }, { status: 400 });
    }

    const updateData: any = {};
    if (text !== undefined) updateData.text = text.trim();
    if (type !== undefined) updateData.type = type;
    if (isRequired !== undefined) updateData.isRequired = Boolean(isRequired);
    if (order !== undefined) updateData.order = Number(order);

    if (type === 'CHOICE') {
      if (Array.isArray(options)) {
        updateData.options = JSON.stringify(options);
      } else if (typeof options === 'string') {
        updateData.options = options;
      }
    } else if (type === 'RATING' || type === 'TEXT') {
      updateData.options = null;
    }

    const updated = await prisma.question.update({
      where: { id },
      data: updateData
    });

    return NextResponse.json({
      success: true,
      message: 'Pertanyaan berhasil diperbarui!',
      data: updated
    });
  } catch (error: any) {
    console.error('Failed to update question:', error);
    return NextResponse.json({ success: false, message: error.message || 'Gagal memperbarui pertanyaan.' }, { status: 500 });
  }
}

// DELETE: Hapus Pertanyaan
export async function DELETE(req: Request) {
  if (!isAuthenticatedAdmin()) {
    return NextResponse.json({ success: false, message: 'Akses ditolak. Sesi admin tidak valid.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, message: 'ID pertanyaan diperlukan.' }, { status: 400 });
    }

    await prisma.question.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'Pertanyaan berhasil dihapus.'
    });
  } catch (error: any) {
    console.error('Failed to delete question:', error);
    return NextResponse.json({ success: false, message: error.message || 'Gagal menghapus pertanyaan.' }, { status: 500 });
  }
}
