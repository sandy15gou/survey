'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { 
  Star, CheckCircle2, ShieldAlert, Sparkles, Send, Lock, 
  RefreshCw, Clock, ShieldCheck, Check, GraduationCap, X, ChevronDown, AlertCircle
} from 'lucide-react';

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

// 43 Program Studi Resmi Kampus UIN
const UIN_PRODI_LIST: string[] = [
  'Akuntansi Syariah',
  'Aqidah dan Filsafat Islam',
  'Arsitektur',
  'Bahasa dan Sastra Arab',
  'Biologi',
  'Bimbingan Penyuluhan Islam',
  'Ekonomi Syariah',
  'Fisika',
  'Hukum Ekonomi Syariah (Muamalah)',
  'Hukum Keluarga Islam (Ahwal Syakhshiyah)',
  'Hukum Pidana Islam (Jinayah)',
  'Hukum Tatanegara (Siyasah Syar\'iyyah)',
  'Ilmu Al-Qur\'an dan Tafsir',
  'Ilmu Hadis',
  'Ilmu Pemerintahan',
  'Ilmu Perpustakaan',
  'Jurnalistik Islam',
  'Kedokteran (Program Sarjana)',
  'Kimia',
  'Komunikasi dan Penyiaran Islam',
  'Manajemen Dakwah',
  'Manajemen Keuangan Syariah',
  'Manajemen Pendidikan Islam',
  'Pariwisata Syariah',
  'Pemikiran Politik Islam',
  'Pendidikan Agama Islam',
  'Pendidikan Bahasa Arab',
  'Pendidikan Guru Madrasah Ibtidaiyah',
  'Pendidikan Islam Anak Usia Dini',
  'Pendidikan Profesi Dokter (Program Profesi)',
  'Pendidikan Profesi Guru (PPG)',
  'Perbankan Syariah',
  'Perbandingan Mazhab',
  'Sains Informasi Geografi',
  'Sastra Inggris',
  'Sejarah Peradaban Islam',
  'Sistem Informasi',
  'Statistika',
  'Studi Agama-Agama',
  'Tadris Bahasa Inggris',
  'Tadris Biologi',
  'Tadris Fisika',
  'Tadris Matematika',
];

// Smooth Scroll-Triggered Reveal Component
function ScrollReveal({
  children,
  className = '',
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (ref.current) observer.unobserve(ref.current);
        }
      },
      {
        threshold: 0.05,
        rootMargin: '0px 0px 80px 0px',
      }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={`transition-all duration-500 ease-out ${
        isVisible
          ? 'opacity-100 translate-y-0'
          : 'opacity-0 translate-y-4'
      } ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

export default function SurveyPage() {
  const [survey, setSurvey] = useState<SurveyData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // State untuk memandu pertanyaan yang belum dijawab
  const [unansweredId, setUnansweredId] = useState<string | null>(null);
  const [validationWarning, setValidationWarning] = useState<string | null>(null);

  // Form State: Nama, NIM, Prodi
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [prodi, setProdi] = useState('');
  const [semester, setSemester] = useState('');

  // Autocomplete Prodi State
  const [showProdiSuggestions, setShowProdiSuggestions] = useState(false);
  const [selectedProdiIndex, setSelectedProdiIndex] = useState(-1);
  const prodiContainerRef = useRef<HTMLDivElement>(null);

  // Filter and prioritize matching Prodi
  const filteredProdi = useMemo(() => {
    const q = prodi.trim().toLowerCase();
    if (!q) return UIN_PRODI_LIST;
    return UIN_PRODI_LIST.filter(item => item.toLowerCase().includes(q)).sort((a, b) => {
      const aStarts = a.toLowerCase().startsWith(q);
      const bStarts = b.toLowerCase().startsWith(q);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      return a.localeCompare(b);
    });
  }, [prodi]);

  // Click outside to close Prodi suggestions
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (prodiContainerRef.current && !prodiContainerRef.current.contains(e.target as Node)) {
        setShowProdiSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [hoveredRating, setHoveredRating] = useState<Record<string, number>>({});

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

    // Periksa apakah SELURUH pertanyaan sudah dijawab
    for (let idx = 0; idx < survey.questions.length; idx++) {
      const q = survey.questions[idx];
      const val = answers[q.id];
      const isAnswered = val !== undefined && val !== null && String(val).trim() !== '';

      if (!isAnswered) {
        setUnansweredId(q.id);
        setValidationWarning(`Pertanyaan nomor ${idx + 1} belum dijawab! Mohon isi pertanyaan ini terlebih dahulu.`);

        const el = document.getElementById(`question-${q.id}`);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
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
          nim,
          prodi,
          semester,
          info: prodi,
          answers: payloadAnswers,
        }),
      });

      const resData = await res.json();
      if (resData.success) {
        setSubmitted(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        alert(resData.message || 'Gagal mengirim jawaban.');
      }
    } catch (err) {
      alert('Terjadi kesalahan saat mengirim jawaban. Silakan coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  const getRatingLabel = (score: number) => {
    switch (score) {
      case 1:
        return { text: '😞 Sangat Kurang', style: 'bg-rose-50 border-rose-200 text-rose-700' };
      case 2:
        return { text: '😕 Kurang Memuaskan', style: 'bg-amber-50 border-amber-200 text-amber-700' };
      case 3:
        return { text: '🙂 Cukup / Netral', style: 'bg-emerald-50/80 border-emerald-200 text-emerald-800' };
      case 4:
        return { text: '😊 Baik & Memuaskan', style: 'bg-teal-50 border-teal-300 text-teal-800 font-semibold' };
      case 5:
        return { text: '🌟 Sangat Memuaskan & Luar Biasa!', style: 'bg-gradient-to-r from-emerald-100 to-teal-100 border-emerald-400 text-emerald-900 font-bold shadow-xs' };
      default:
        return { text: 'Pilih Nilai 1 - 5 Bintang', style: 'bg-slate-100 border-slate-200 text-slate-500' };
    }
  };

  const totalQuestions = survey?.questions.length || 0;
  const answeredCount = survey?.questions.filter(q => answers[q.id] !== undefined && answers[q.id] !== '').length || 0;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  // 1. Loading State
  if (loading) {
    return (
      <div className="min-h-screen zen-bg flex items-center justify-center p-4">
        <div className="zen-card p-10 rounded-3xl max-w-sm w-full text-center shadow-2xl">
          <div className="relative w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
            <div className="w-14 h-14 rounded-full border-4 border-emerald-700 border-t-transparent animate-spin" />
          </div>
          <h3 className="text-base font-bold text-slate-900 tracking-tight">Memuat Kuesioner...</h3>
          <p className="text-xs text-slate-500 mt-1">Mengambil data dari server</p>
        </div>
      </div>
    );
  }

  // 2. Error State
  if (errorMsg || !survey) {
    return (
      <div className="min-h-screen zen-bg flex items-center justify-center p-4">
        <div className="zen-card max-w-md w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-amber-500/20">
            <ShieldAlert size={32} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mb-2">Pemberitahuan Sistem</h2>
          <p className="text-xs sm:text-sm text-slate-600 mb-6 leading-relaxed">
            {errorMsg || 'Survey saat ini tidak tersedia atau sedang dinonaktifkan oleh administrator.'}
          </p>
          <div className="space-y-3">
            <button 
              onClick={fetchSurvey}
              className="w-full py-3.5 px-5 zen-btn text-white rounded-2xl font-bold transition flex items-center justify-center gap-2 text-xs uppercase tracking-wider"
            >
              <RefreshCw size={15} /> Muat Ulang Halaman
            </button>
            
          </div>
        </div>
      </div>
    );
  }

  // 3. Submitted Success Screen
  if (submitted) {
    return (
      <div className="min-h-screen zen-bg flex items-center justify-center p-4">
        <div className="zen-card max-w-lg w-full rounded-3xl p-8 sm:p-10 text-center shadow-2xl">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
            <div className="relative w-20 h-20 bg-gradient-to-tr from-emerald-600 to-teal-500 text-white rounded-3xl flex items-center justify-center shadow-lg shadow-emerald-700/30">
              <CheckCircle2 size={42} strokeWidth={2.5} />
            </div>
          </div>

          <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold border border-emerald-200 mb-3 shadow-xs">
            <Sparkles size={14} className="text-emerald-600" /> Jawaban Tersimpan
          </span>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mb-2 tracking-tight">Terima Kasih Banyak!</h2>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
            Aspirasi dan penilaian Anda telah berhasil terekam ke sistem database. Masukan berharga Anda sangat berguna demi peningkatan mutu akademik, sistem SIAKAD, dan fasilitas kampus UIN.
          </p>

          

          <button
            onClick={() => {
              setSubmitted(false);
              setAnswers({});
              setName('');
              setNim('');
              setProdi('');
              setSemester('');
              setUnansweredId(null);
              setValidationWarning(null);
            }}
            className="w-full py-4 px-6 zen-btn text-white font-black rounded-2xl transition text-xs flex items-center justify-center gap-2 uppercase tracking-wider shadow-lg active:scale-[0.98]"
          >
            <RefreshCw size={15} /> Isi Respon Baru
          </button>
        </div>
      </div>
    );
  }

  // 4. Main Survey Form View
  return (
    <div className="min-h-screen zen-bg pb-28 text-slate-900 selection:bg-emerald-600 selection:text-white">
      {/* Sticky Header on Dark Ink Wash */}
      <header className="sticky top-0 z-40 bg-emerald-950/70 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-md text-white">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-emerald-900/40">
              U
            </div>
            <div className="truncate">
              <p className="text-xs font-black tracking-tight truncate flex items-center gap-2 text-white">
                <span>PORTAL EVALUASI KAMPUS UIN</span>
                <span className="hidden sm:inline text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SURVEY
                </span>
              </p>
              <p className="text-[11px] text-emerald-200/70 truncate">{survey.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="text-right hidden sm:block">
              <span className="text-xs font-black text-emerald-300">
                {progressPercent}%
              </span>
              <span className="text-[11px] text-emerald-200/60 ml-1">({answeredCount}/{totalQuestions})</span>
            </div>

            <div className="w-28 sm:w-36 h-3 bg-emerald-950/90 rounded-full overflow-hidden p-0.5 border border-emerald-700/50">
              <div 
                className="h-full bg-gradient-to-r from-teal-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(52,211,153,0.7)]"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-3xl mx-auto px-4 pt-10 sm:pt-14">
        <div className="text-center mb-10 animate-slide-down">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-500/30 text-emerald-200 text-xs font-black tracking-wider uppercase mb-4 backdrop-blur-md shadow-lg">
            <Sparkles size={13} className="text-amber-300" />
            <span>KUESIONER MUTU & LAYANAN KAMPUS UIN</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight mb-4 text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.6)]">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-100 via-teal-100 to-white">
              {survey.title}
            </span>
          </h1>

          {/* Spacing & Subtle Elegant Divider */}
          <div className="py-6 flex flex-col items-center justify-center gap-2.5">
            <div className="flex items-center justify-center gap-3 w-full max-w-xs">
              <div className="h-px flex-1 bg-gradient-to-r from-transparent via-emerald-400/30 to-emerald-400/60" />
              <div className="w-1.5 h-1.5 rotate-45 border border-emerald-400/80 bg-emerald-900/80" />
              <div className="h-px flex-1 bg-gradient-to-l from-transparent via-emerald-400/30 to-emerald-400/60" />
            </div>
            <p className="text-xs tracking-wider text-emerald-200/75 font-medium">
              Sampaikan aspirasi dan evaluasi Anda secara objektif
            </p>
          </div>
        </div>

        {/* Survey Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card: Identitas (Nama, NIM, Prodi) */}
          <div className={`zen-card rounded-3xl p-6 sm:p-8 relative transition-all duration-300 animate-slide-up ${showProdiSuggestions ? "z-40 shadow-2xl" : "z-20"}`} style={{ animationDelay: "150ms" }}>
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-emerald-900/20">
                <GraduationCap size={20} />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 tracking-tight">Identitas Mahasiswa</h2>
                
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Nama Lengkap</label>
                <input
                  type="text"
                  placeholder=""
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/95 text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">NIM</label>
                <input
                  type="text"
                  placeholder=""
                  value={nim}
                  onChange={(e) => setNim(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/95 text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-mono"
                />
              </div>

              <div className="relative" ref={prodiContainerRef}>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
                  <span>Program Studi (Prodi)</span>
                  {showProdiSuggestions && (
                    <span className="text-[10px] text-emerald-700 font-bold animate-pulse">
                      {filteredProdi.length} Prodi Cocok
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ketik huruf (misal: S)..."
                    value={prodi}
                    list="prodi-datalist"
                    autoComplete="off"
                    onChange={(e) => {
                      setProdi(e.target.value);
                      setShowProdiSuggestions(true);
                      setSelectedProdiIndex(-1);
                    }}
                    onFocus={() => setShowProdiSuggestions(true)}
                    onKeyDown={(e) => {
                      if (!showProdiSuggestions) {
                        if (e.key === 'ArrowDown') setShowProdiSuggestions(true);
                        return;
                      }
                      if (e.key === 'ArrowDown') {
                        e.preventDefault();
                        setSelectedProdiIndex(prev => (prev < filteredProdi.length - 1 ? prev + 1 : prev));
                      } else if (e.key === 'ArrowUp') {
                        e.preventDefault();
                        setSelectedProdiIndex(prev => (prev > 0 ? prev - 1 : -1));
                      } else if (e.key === 'Enter') {
                        if (selectedProdiIndex >= 0 && selectedProdiIndex < filteredProdi.length) {
                          e.preventDefault();
                          setProdi(filteredProdi[selectedProdiIndex]);
                          setShowProdiSuggestions(false);
                        }
                      } else if (e.key === 'Escape') {
                        setShowProdiSuggestions(false);
                      }
                    }}
                    className="w-full pl-4 pr-9 py-3 rounded-2xl border border-slate-200 bg-white/95 text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <datalist id="prodi-datalist">
                    {UIN_PRODI_LIST.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                  {prodi ? (
                    <button
                      type="button"
                      onClick={() => {
                        setProdi('');
                        setShowProdiSuggestions(true);
                      }}
                      className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-700 p-0.5 transition"
                      title="Bersihkan"
                    >
                      <X size={14} />
                    </button>
                  ) : (
                    <div className="absolute right-3.5 top-4 pointer-events-none text-slate-400">
                      <ChevronDown size={14} />
                    </div>
                  )}
                </div>

                {/* Floating Autocomplete Dropdown with Guaranteed High z-index */}
                {showProdiSuggestions && (
                  <div className="absolute left-0 right-0 top-full mt-1.5 bg-white border-2 border-emerald-500/40 rounded-2xl shadow-2xl z-[100] overflow-hidden max-h-64 flex flex-col">
                    <div className="px-3.5 py-2 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between text-[11px] font-bold text-emerald-900">
                      <span>Daftar Rekomendasi Prodi ({filteredProdi.length})</span>
                      {prodi && (
                        <span className="text-emerald-700 font-semibold truncate max-w-[130px]">
                          Awalan: "{prodi}"
                        </span>
                      )}
                    </div>

                    <div className="overflow-y-auto divide-y divide-slate-100 py-1 max-h-52">
                      {filteredProdi.length > 0 ? (
                        filteredProdi.map((item, idx) => {
                          const isSelected = idx === selectedProdiIndex;
                          const q = prodi.trim().toLowerCase();
                          const startsWithQ = q && item.toLowerCase().startsWith(q);
                          return (
                            <button
                              key={item}
                              type="button"
                              onClick={() => {
                                setProdi(item);
                                setShowProdiSuggestions(false);
                              }}
                              onMouseEnter={() => setSelectedProdiIndex(idx)}
                              className={`w-full text-left px-4 py-2.5 text-xs transition flex items-center justify-between ${
                                isSelected
                                  ? 'bg-emerald-100/80 text-emerald-950 font-bold'
                                  : 'text-slate-700 hover:bg-emerald-50 hover:text-emerald-900 font-medium'
                              }`}
                            >
                              <span className="truncate pr-2">{item}</span>
                              {startsWithQ && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-600 text-white font-bold flex-shrink-0 shadow-xs">
                                  Awalan {q.toUpperCase()}
                                </span>
                              )}
                            </button>
                          );
                        })
                      ) : (
                        <div className="p-4 text-center text-xs text-slate-400">
                          Tidak ditemukan prodi dengan kata kunci tersebut.
                          <div className="text-[11px] text-slate-500 mt-1">Anda tetap dapat mengetikkan prodi secara manual.</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Semester</label>
                <select
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/95 text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-medium"
                >
                  <option value="">Pilih Semester...</option>
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((s) => (
                    <option key={s} value={String(s)}>Semester {s}</option>
                  ))}
                  <option value=">8">Semester &gt; 8</option>
                </select>
              </div>
            </div>

            {/* 5+ Pilihan Rekomendasi Prodi Langsung Terbuka di Bawah Input */}
            {prodi.trim() ? (
              <div className="mt-4 pt-3.5 border-t border-slate-200/80 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Sparkles size={14} className="text-emerald-600" />
                    <span>Rekomendasi Pilihan Prodi untuk "{prodi}":</span>
                  </span>
                  <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {filteredProdi.length} prodi ditemukan • Klik salah satu
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {filteredProdi.slice(0, 8).map((item, i) => {
                    const isExact = prodi.toLowerCase() === item.toLowerCase();
                    const isPrefix = item.toLowerCase().startsWith(prodi.trim().toLowerCase());
                    return (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setProdi(item);
                          setShowProdiSuggestions(false);
                        }}
                        className={`text-xs px-3.5 py-2 rounded-xl border font-semibold transition-all flex items-center gap-2 ${
                          isExact
                            ? 'bg-emerald-700 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/30 scale-[1.02]'
                            : isPrefix
                            ? 'bg-emerald-50/90 text-emerald-950 border-emerald-300 hover:bg-emerald-100 hover:border-emerald-500 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400 hover:bg-slate-50 shadow-xs'
                        }`}
                      >
                        <span className="font-mono text-[10px] opacity-60">#{i + 1}</span>
                        <span>{item}</span>
                        {isPrefix && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-200 text-emerald-900 font-bold">
                            ✓
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              showProdiSuggestions && (
                <div className="mt-4 pt-3.5 border-t border-slate-200/80 animate-in fade-in duration-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <Sparkles size={14} className="text-emerald-600" />
                      <span>Ketik awalan huruf atau pilih salah satu prodi populer:</span>
                    </span>
                    <span className="text-[11px] text-slate-500">Klik untuk memilih</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Sistem Informasi',
                      'Teknik Informatika',
                      'Pendidikan Agama Islam',
                      'Ekonomi Syariah',
                      'Hukum Keluarga Islam (Ahwal Syakhshiyah)',
                      'Ilmu Al-Qur\'an dan Tafsir',
                      'Biologi',
                      'Statistika'
                    ].map((item) => (
                      <button
                        key={item}
                        type="button"
                        onClick={() => {
                          setProdi(item);
                          setShowProdiSuggestions(false);
                        }}
                        className="text-xs px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:border-emerald-500 hover:bg-emerald-50 text-slate-800 font-semibold transition shadow-xs"
                      >
                        {item}
                      </button>
                    ))}
                  </div>
                </div>
              )
            )}
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

            const currentAnswer = answers[q.id];
            const currentHover = hoveredRating[q.id] || 0;
            const activeStarScore = currentHover || currentAnswer || 0;
            const ratingInfo = getRatingLabel(activeStarScore);

            return (
              <ScrollReveal key={q.id} delay={Math.min(idx * 60, 150)}>
              <div 
                id={`question-${q.id}`}
                className={`zen-card rounded-3xl p-6 sm:p-8 relative z-10 transition-all duration-300 ${
                  unansweredId === q.id 
                    ? 'ring-4 ring-rose-500/60 border-2 border-rose-500 shadow-2xl shadow-rose-500/15 bg-rose-50/20' 
                    : 'hover:shadow-xl'
                }`}
              >
                {unansweredId === q.id && (
                  <div className="mb-4 p-3.5 rounded-2xl bg-rose-500/15 border border-rose-500/30 text-rose-800 text-xs font-bold flex items-center gap-2 animate-bounce">
                    <AlertCircle size={16} className="text-rose-600 flex-shrink-0" />
                    <span>⚠️ Pertanyaan nomor {idx + 1} ini wajib dijawab. Silakan tentukan pilihan Anda di bawah ini!</span>
                  </div>
                )}

                <div className="flex items-start gap-3.5 mb-5">
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm transition-colors duration-300 ${
                    unansweredId === q.id
                      ? 'bg-rose-600 text-white shadow-rose-900/30 ring-2 ring-rose-300'
                      : 'bg-gradient-to-tr from-emerald-800 to-teal-700 text-white shadow-emerald-900/30'
                  }`}>
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      {q.text}
                    </p>
                  </div>
                </div>

                {/* Question Type: RATING */}
                {q.type === 'RATING' && (
                  <div className="pt-2">
                    <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const isFilled = star <= activeStarScore;
                        return (
                          <button
                            key={star}
                            type="button"
                            onMouseEnter={() => setHoveredRating(prev => ({ ...prev, [q.id]: star }))}
                            onMouseLeave={() => setHoveredRating(prev => ({ ...prev, [q.id]: 0 }))}
                            onClick={() => handleRating(q.id, star)}
                            className="p-2 sm:p-2.5 rounded-2xl transition-all transform active:scale-90 hover:scale-120 group focus:outline-none"
                            title={`Nilai ${star} dari 5`}
                          >
                            <Star 
                              size={38} 
                              className={`transition-all duration-150 ${
                                isFilled 
                                  ? 'text-amber-400 fill-amber-400 drop-shadow-[0_2px_10px_rgba(245,158,11,0.6)] scale-105' 
                                  : 'text-slate-300 group-hover:text-amber-300'
                              }`}
                            />
                          </button>
                        );
                      })}

                      <div className="mt-2 sm:mt-0 sm:ml-2">
                        <span className={`inline-flex items-center text-xs px-3.5 py-1.5 rounded-xl border transition-all duration-200 ${ratingInfo.style}`}>
                          {ratingInfo.text}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-500 mt-3 px-2 max-w-sm font-medium">
                      <span>⭐ 1 = Sangat Kurang</span>
                      <span>⭐ 5 = Sangat Memuaskan</span>
                    </div>
                  </div>
                )}

                {/* Question Type: CHOICE */}
                {q.type === 'CHOICE' && (
                  <div className={`grid ${optionsList.length <= 2 ? 'grid-cols-2 max-w-md' : 'grid-cols-2 sm:grid-cols-4'} gap-3 pt-2`}>
                    {optionsList.map((opt, oIdx) => {
                      const isSelected = answers[q.id] === opt;
                      return (
                        <button
                          key={oIdx}
                          type="button"
                          onClick={() => handleChoice(q.id, opt)}
                          className={`group text-left p-4 rounded-2xl border text-sm font-bold transition-all duration-200 active:scale-[0.98] hover:scale-[1.01] flex items-center justify-between ${
                            isSelected 
                              ? 'bg-emerald-50/95 border-emerald-600 text-emerald-950 shadow-sm ring-2 ring-emerald-500/20' 
                              : 'bg-white/90 border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex-1 mr-2 text-center sm:text-left">{opt}</span>
                          <div className={`w-5 h-5 rounded-xl border flex items-center justify-center transition-all ${
                            isSelected 
                              ? 'border-emerald-600 bg-emerald-600 text-white shadow-sm scale-105' 
                              : 'border-slate-300 bg-white'
                          }`}>
                            {isSelected && <Check size={13} strokeWidth={3} />}
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
                      rows={4}
                      placeholder="Jelaskan secara singkat fasilitas atau layanan apa yang mengecewakan beserta alasannya..."
                      value={answers[q.id] || ''}
                      onChange={(e) => handleText(q.id, e.target.value)}
                      className="w-full p-4 rounded-2xl border border-slate-200 bg-white/95 text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 resize-y placeholder:text-slate-400"
                    />
                  </div>
                )}
              </div>
            </ScrollReveal>
          );
        })}

        {/* Submit Button */}
          <ScrollReveal delay={80} className="pt-4">
            <button
              type="submit"
              disabled={submitting}
              className={`w-full py-4 px-6 zen-btn text-white font-black rounded-2xl transition-all active:scale-[0.98] hover:scale-[1.01] hover:shadow-2xl flex items-center justify-center gap-2.5 disabled:opacity-50 text-base uppercase tracking-wider ${answeredCount === totalQuestions && totalQuestions > 0 ? "pulse-glow" : ""}`}
            >
              {submitting ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Mengirim Jawaban ke Sistem...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Kirim Jawaban Kuesioner Mahasiswa</span>
                </>
              )}
            </button>
          </ScrollReveal>
        </form>

        {/* Floating Validation Guide Banner */}
        {validationWarning && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 max-w-lg w-[92%] animate-in fade-in slide-in-from-bottom duration-300">
            <div className="p-4 rounded-2xl bg-rose-950/90 backdrop-blur-xl border border-rose-500/50 text-white shadow-2xl flex items-center justify-between gap-3 text-xs font-bold">
              <div className="flex items-center gap-2.5 min-w-0">
                <AlertCircle size={18} className="text-rose-400 flex-shrink-0 animate-pulse" />
                <span className="truncate">{validationWarning}</span>
              </div>
              <button 
                type="button" 
                onClick={() => setValidationWarning(null)} 
                className="p-1 text-rose-300 hover:text-white rounded-lg hover:bg-white/10 transition flex-shrink-0"
              >
                <X size={15} />
              </button>
            </div>
          </div>
        )}

          {/* Footer */}
          <footer className="mt-16 text-center text-xs text-slate-500">
          <p>© {new Date().getFullYear()} Sistem Evaluasi & Survei Mahasiswa Kampus UIN</p>
        </footer>
      </main>
    </div>
  );
}