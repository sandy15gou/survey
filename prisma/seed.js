const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Menanam data survey contoh ke database PostgreSQL...');
  
  // Cek apakah sudah ada survey
  const existing = await prisma.survey.findFirst();
  if (existing) {
    console.log('Survey sudah ada, lewati penanaman data.');
    return;
  }

  const survey = await prisma.survey.create({
    data: {
      title: "Survey Kepuasan Fasilitas & Pembelajaran Sekolah",
      description: "Mohon luangkan waktu 1-2 menit untuk memberikan penilaian objektif demi peningkatan mutu sekolah kita.",
      isActive: true,
      questions: {
        create: [
          {
            text: "Seberapa puas Anda dengan kebersihan dan kenyamanan ruang kelas serta lingkungan sekolah?",
            type: "RATING",
            isRequired: true,
            order: 1
          },
          {
            text: "Bagaimana ketersediaan dan kestabilan fasilitas Wi-Fi/Internet di lingkungan sekolah?",
            type: "CHOICE",
            options: JSON.stringify(["Sangat Baik & Cepat", "Cukup Baik", "Kadang Lambat", "Sering Terputus"]),
            isRequired: true,
            order: 2
          },
          {
            text: "Bagaimana kejelasan materi dan metode mengajar para guru di kelas?",
            type: "RATING",
            isRequired: true,
            order: 3
          },
          {
            text: "Tuliskan kritik, saran, atau fasilitas apa yang paling mendesak untuk diperbaiki:",
            type: "TEXT",
            isRequired: false,
            order: 4
          }
        ]
      }
    }
  });

  console.log('✅ Berhasil menanam survey contoh dengan ID: ' + survey.id);
}

main()
  .catch((e) => {
    console.error('Error saat seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
