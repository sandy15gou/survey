const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memperbarui data survey UIN ke database PostgreSQL...');

  const surveyData = {
    title: "Survey Kepuasan Mahasiswa & Evaluasi Layanan Kampus UIN",
    description: "Kuesioner evaluasi akademik, sistem informasi SIAKAD, dan fasilitas kampus demi peningkatan mutu dan pengalaman belajar mahasiswa.",
    isActive: true,
  };

  const newQuestions = [
    {
      text: "Apakah kamu bangga menyebutkan nama kampus ini saat ditanya kuliah di mana?",
      type: "CHOICE",
      options: JSON.stringify(["Iya", "Tidak"]),
      isRequired: true,
      order: 1
    },
    {
      text: "Apakah kamu mengikuti organisasi yang ada di kampus?",
      type: "CHOICE",
      options: JSON.stringify(["Iya", "Tidak"]),
      isRequired: true,
      order: 2
    },
    {
      text: "Berapa persentase untuk kemudahan akses pada sistem SIAKAD (Sistem Informasi Akademik) saat masa pengisian KRS?",
      type: "CHOICE",
      options: JSON.stringify(["100%", "75%", "50%", "25%"]),
      isRequired: true,
      order: 3
    },
    {
      text: "Berapa persentase untuk kualitas materi dan metode pengajaran yang diberikan oleh dosen saat mengajar?",
      type: "CHOICE",
      options: JSON.stringify(["100%", "75%", "50%", "25%"]),
      isRequired: true,
      order: 4
    },
    {
      text: "Berdasarkan pengalaman kamu selama berkuliah di UIN, layanan atau fasilitas apa yang saat ini paling mengecewakan dan harus segera diperbaiki oleh pihak kampus? Jelaskan alasannya secara singkat!",
      type: "TEXT",
      options: null,
      isRequired: true,
      order: 5
    }
  ];

  const existing = await prisma.survey.findFirst();
  if (existing) {
    // Hapus pertanyaan lama
    await prisma.question.deleteMany({ where: { surveyId: existing.id } });
    
    // Update survey title & description
    const updated = await prisma.survey.update({
      where: { id: existing.id },
      data: {
        ...surveyData,
        questions: {
          create: newQuestions
        }
      },
      include: { questions: true }
    });
    console.log(`✅ Berhasil memperbarui survey ID: ${updated.id} dengan ${updated.questions.length} pertanyaan.`);
  } else {
    const created = await prisma.survey.create({
      data: {
        ...surveyData,
        questions: {
          create: newQuestions
        }
      },
      include: { questions: true }
    });
    console.log(`✅ Berhasil membuat survey baru ID: ${created.id} dengan ${created.questions.length} pertanyaan.`);
  }
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
