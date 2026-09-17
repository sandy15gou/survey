'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, HelpCircle, RefreshCw } from 'lucide-react';

interface Question {
  id: string;
  text: string;
  type: 'RATING' | 'CHOICE' | 'TEXT';
  options?: string;
  isRequired: boolean;
  order: number;
}

interface SurveyData {
  id: string;
  title: string;
  description: string | null;
  isActive: boolean;
  questions: Question[];
}

export default function SurveyPage() {
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [info, setInfo] = useState('');
  const [answers, setAnswers] = useState<Record<string, any>>({});

  useEffect(() => {
    fetchSurvey();
  }, []);

  const fetchSurvey = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const res = await fetch('/api/survey');
      const data = await res.json();
      if (data.success) {
        setSurvey(data.data);
      } else {
        setErrorMsg(data.message || 'Gagal memuat kuesioner.');
      }
    } catch (err: any) {
      setErrorMsg('Tidak dapat terhubung ke server/database. Pastikan koneksi database aktif.');
    } finally {
      setLoading(false);
    }
  };

  const handleRating = (questionId: string, rating: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: rating }));
  };

  const handleChoice = (questionId: string, choice: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: choice }));
  };

  const handleText = (questionId: string, text: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!survey) return;

    // Validasi pertanyaan wajib
    for (const q of survey.questions) {
      if (q.isRequired && (answers[q.id] === undefined || answers[q.id] === '')) {
        alert(`Pertanyaan nomor ${q.order} wajib diisi!`);
        return;
      }
    }

    try {
      setSubmitting(true);
      const payloadAnswers = Object.entries(answers).map(([questionId, value]) => ({
        questionId,
        value,
      }));

      const res = await fetch('/api/survey', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: survey.id,
          name,
          info,
          answers: payloadAnswers,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSubmitted(true);
      } else {
        alert(resData.message || 'Gagal mengirim jawaban.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengirim jawaban. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Progress hitung
  const totalQuestions = survey?.questions.length || 0;
  const answeredCount = survey?.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center p-8">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-slate-600 font-medium">Menghubungkan ke server kuesioner...</p>
        </div>
      </div>
    );
  }

  if (errorMsg || !survey) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-slate-100">
          <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Pemberitahuan</h2>
          <p className="text-slate-600 mb-6 text-sm leading-relaxed">{errorMsg || 'Survey saat ini tidak tersedia atau sedang dinonaktifkan oleh administrator.'}</p>
          <div className="space-y-3">
            <button 
              onClick={fetchSurvey}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
            >
              <RefreshCw size={16} /> Coba Muat Ulang
            </button>
            <Link 
              href="/admin" 
              className="block w-full py-2 px-4 text-xs text-slate-500 hover:text-slate-800 transition"
            >
              Masuk sebagai Admin (Passkey) &rarr;
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-slate-50 to-indigo-50">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 text-center border border-slate-100 animate-in fade-in zoom-in duration-300">
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle2 size={44} />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 mb-3">
            <Sparkles size={14} /> Berhasil Disimpan
          </span>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Terima Kasih!</h2>
          <p className="text-slate-600 text-sm leading-relaxed mb-8">
            Jawaban dan saran yang Anda berikan telah tersimpan secara aman di server kami dan sangat berharga untuk evaluasi ke depan.
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setAnswers({});
                setName('');
                setInfo('');
              }}
              className="w-full py-3 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-semibold transition shadow-md"
            >
              Isi Respon Baru
            </button>
            <Link 
              href="/admin" 
              className="py-2 text-xs text-slate-400 hover:text-slate-700 transition"
            >
              Akses Admin Portal
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50/40 pb-20">
      {/* Top Header */}
      <header className="sticky top-0 z-20 backdrop-blur-md bg-white/80 border-b border-slate-200/80">
        <div className="max-w-3xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold shadow-md shadow-blue-500/20">
              S
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-900 leading-tight">Portal Survey</h1>
              <p className="text-[11px] text-slate-500">Kuesioner Resmi</p>
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs font-semibold text-slate-600">Progress: {progressPercent}%</span>
            <div className="w-28 h-2 bg-slate-100 rounded-full overflow-hidden mt-1 border border-slate-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-3xl mx-auto px-4 pt-6">
        {/* Banner Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 mb-6">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 mb-3 border border-blue-100">
            Form Kuesioner
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-3 tracking-tight">
            {survey.title}
          </h1>
          {survey.description && (
            <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
              {survey.description}
            </p>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Identitas Responden (Opsional / Fleksibel) */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
            <h3 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <span>👤</span> Identitas Responden <span className="text-xs font-normal text-slate-400">(Opsional / Boleh Dikosongkan)</span>
            </h3>
            <p className="text-xs text-slate-500 mb-4">Anda dapat mengisi nama atau membiarkannya kosong untuk tetap anonim.</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder="Contoh: Budi Santoso (atau kosongkan)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Kategori / Kelas / Keterangan</label>
                <input
                  type="text"
                  placeholder="Contoh: Kelas XII IPA 1 / Guru / Siswa"
                  value={info}
                  onChange={(e) => setInfo(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                />
              </div>
            </div>
          </div>

          {/* List Pertanyaan */}
          {survey.questions.map((q, idx) => {
            let optionsList: string[] = [];
            if (q.type === 'CHOICE' && q.options) {
              try {
                optionsList = JSON.parse(q.options);
              } catch {
                optionsList = [];
              }
            }

            return (
              <div 
                key={q.id}
                className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80 transition hover:border-slate-300"
              >
                <div className="flex items-start gap-3 mb-4">
                  <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-base font-semibold text-slate-900 leading-snug">
                      {q.text}
                      {q.isRequired && <span className="text-rose-500 ml-1 font-bold">*</span>}
                    </p>
                  </div>
                </div>

                {/* Question Type: RATING (1-5 Star) */}
                {q.type === 'RATING' && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 sm:gap-3">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const current = answers[q.id] || 0;
                        const isSelected = star <= current;
                        return (
                          <button
                            key={star}
                            type="button"
                            onClick={() => handleRating(q.id, star)}
                            className="p-2 sm:p-3 rounded-2xl hover:bg-amber-50 transition transform active:scale-95 group focus:outline-none"
                            title={`Beri nilai ${star} dari 5`}
                          >
                            <Star 
                              size={32} 
                              className={`transition-colors ${
                                isSelected 
                                  ? 'text-amber-400 fill-amber-400' 
                                  : 'text-slate-300 group-hover:text-amber-300'
                              }`}
                            />
                          </button>
                        );
                      })}
                      <span className="ml-3 text-sm font-bold text-slate-700">
                        {answers[q.id] ? `${answers[q.id]} / 5 Bintang` : <span className="text-xs font-normal text-slate-400">Pilih penilaian</span>}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-400 mt-2 px-1 max-w-xs">
                      <span>1 = Sangat Kurang</span>
                      <span>5 = Sangat Baik</span>
                    </div>
                  </div>
                )}

                {/* Question Type: CHOICE */}
                {q.type === 'CHOICE' && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    {optionsList.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleChoice(q.id, opt)}
                          className={`text-left p-3.5 rounded-2xl border text-sm font-medium transition flex items-center justify-between ${
                            isSelected 
                              ? 'bg-blue-50/70 border-blue-500 text-blue-800 shadow-sm ring-2 ring-blue-500/10' 
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span>{opt}</span>
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition ${
                            isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Question Type: TEXT */}
                {q.type === 'TEXT' && (
                  <div className="pt-2">
                    <textarea
                      rows={3}
                      placeholder="Tuliskan jawaban atau pendapat Anda di sini..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleText(q.id, e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition resize-y"
                    />
                  </div>
                )}
              </div>
            );
          })}

          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 transition transform active:scale-[0.99] flex items-center justify-center gap-2.5 disabled:opacity-50 text-base"
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim Jawaban...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Kirim Jawaban Survey</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Footer Admin Link */}
        <footer className="mt-16 text-center text-xs text-slate-400">
          <p>© {new Date().getFullYear()} Sistem Evaluasi & Survey Sekolah</p>
          <div className="mt-2">
            <Link 
              href="/admin" 
              className="inline-flex items-center gap-1.5 py-1 px-3 rounded-full hover:bg-slate-200/60 transition text-slate-500"
            >
              <Lock size={12} /> Halaman Pengelola (Admin Passkey)
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
