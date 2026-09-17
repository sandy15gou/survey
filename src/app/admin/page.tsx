'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  KeyRound, ShieldCheck, LogOut, Download, Users, 
  BarChart3, CheckCircle, XCircle, ArrowLeft, Star, 
  Search, RefreshCw, MessageSquare, ToggleLeft, ToggleRight
} from 'lucide-react';

export default function AdminPage() {
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState(false);

  // Dashboard Data
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch('/api/admin/auth');
      const json = await res.json();
      setAuthed(json.authenticated);
      if (json.authenticated) {
        fetchDashboardData();
      }
    } catch {
      setAuthed(false);
    }
  };

  const fetchDashboardData = async () => {
    try {
      setLoadingData(true);
      const res = await fetch('/api/admin/responses');
      if (res.status === 401) {
        setAuthed(false);
        return;
      }
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingData(false);
    }
  };

  const handleLoginPasskey = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    setSubmittingKey(true);

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passkey: passkeyInput }),
      });
      const json = await res.json();

      if (json.success) {
        setAuthed(true);
        setPasskeyInput('');
        fetchDashboardData();
      } else {
        setAuthError(json.message || 'Passkey salah!');
      }
    } catch {
      setAuthError('Gagal menghubungkan ke server verifikasi.');
    } finally {
      setSubmittingKey(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/auth', { method: 'DELETE' });
    setAuthed(false);
    setData(null);
  };

  const handleToggleActive = async () => {
    if (!data?.survey) return;
    try {
      setToggling(true);
      const newStatus = !data.survey.isActive;
      const res = await fetch('/api/admin/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          surveyId: data.survey.id,
          isActive: newStatus,
        }),
      });
      const json = await res.json();
      if (json.success) {
        setData((prev: any) => ({
          ...prev,
          survey: { ...prev.survey, isActive: json.isActive }
        }));
      }
    } catch (err) {
      alert('Gagal mengubah status survey');
    } finally {
      setToggling(false);
    }
  };

  // 1. Loading State
  if (authed === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-slate-400 text-sm">Memeriksa hak akses...</p>
        </div>
      </div>
    );
  }

  // 2. Passkey Gate Screen (Jika belum login passkey)
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950 text-slate-100">
        <div className="max-w-md w-full bg-slate-900/90 rounded-3xl p-8 border border-slate-800 shadow-2xl backdrop-blur-xl">
          <div className="w-16 h-16 bg-blue-500/10 text-blue-400 rounded-2xl flex items-center justify-center mx-auto mb-5 border border-blue-500/20">
            <KeyRound size={32} />
          </div>

          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-white mb-1.5 tracking-tight">Admin Passkey</h1>
            <p className="text-slate-400 text-xs leading-relaxed">
              Halaman ini terproteksi. Silakan masukkan passkey atau PIN rahasia untuk melihat data rekapitulasi responden.
            </p>
          </div>

          {authError && (
            <div className="mb-5 p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs flex items-center gap-2">
              <XCircle size={16} className="flex-shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          <form onSubmit={handleLoginPasskey} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Passkey Admin
              </label>
              <input
                type="password"
                placeholder="Masukkan passkey rahasia..."
                value={passkeyInput}
                onChange={(e) => setPasskeyInput(e.target.value)}
                autoFocus
                required
                className="w-full px-4 py-3 rounded-xl bg-slate-800/80 border border-slate-700 text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition"
              />
              <p className="text-[11px] text-slate-500 mt-1.5">
                Default: <code className="text-slate-400 bg-slate-800 px-1 py-0.5 rounded">admin123#</code> (dapat diubah di .env)
              </p>
            </div>

            <button
              type="submit"
              disabled={submittingKey}
              className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-50 text-sm"
            >
              {submittingKey ? 'Memverifikasi...' : 'Buka Dashboard'}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-800/80 text-center">
            <Link 
              href="/" 
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition"
            >
              <ArrowLeft size={14} /> Kembali ke Halaman Survey Responden
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Dashboard Screen (Sudah lolos Passkey)
  const survey = data?.survey;
  const respondents = survey?.respondents || [];
  const stats = data?.stats || {};

  // Filter respondents
  const filteredRespondents = respondents.filter((r: any) => {
    const q = searchTerm.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.info && r.info.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 pb-20">
      {/* Admin Top Navbar */}
      <nav className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-sm">
              S
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                Survey Admin Panel
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  Passkey Verified
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 transition"
            >
              Lihat Tampilan Siswa &rarr;
            </Link>
            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs text-rose-400 hover:text-rose-300 px-3 py-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 transition"
            >
              <LogOut size={14} /> Keluar
            </button>
          </div>
        </div>
      </nav>

      {/* Main Admin Content */}
      <main className="max-w-6xl mx-auto px-4 pt-6 space-y-6">
        {/* Header Title & Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60">
          <div>
            <span className="text-xs font-semibold text-blue-400 uppercase tracking-wider">Kuesioner Aktif</span>
            <h1 className="text-2xl font-black text-white mt-1">
              {survey?.title || 'Memuat Data...'}
            </h1>
            <p className="text-xs text-slate-400 mt-1">
              Database: <span className="text-emerald-400 font-mono">PostgreSQL Server</span> | Total Pertanyaan: {survey?.questions?.length || 0}
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Toggle Status Survey */}
            {survey && (
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border ${
                  survey.isActive 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20' 
                    : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                }`}
              >
                {survey.isActive ? <CheckCircle size={16} /> : <XCircle size={16} />}
                <span>Status: {survey.isActive ? 'Buka (Menerima Jawaban)' : 'Ditutup'}</span>
              </button>
            )}

            {/* Export CSV */}
            <a
              href="/api/admin/export"
              download
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-2 shadow-md shadow-blue-600/20"
            >
              <Download size={15} /> Export CSV / Excel
            </a>

            <button
              onClick={fetchDashboardData}
              className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-xl transition"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={loadingData ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Stats Metrics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Total Responden</span>
              <Users size={18} className="text-blue-400" />
            </div>
            <p className="text-3xl font-black text-white">{data?.totalRespondents ?? 0}</p>
            <p className="text-[11px] text-slate-500 mt-1">Siswa / Responden yang sudah submit</p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Status Pendaftaran</span>
              <BarChart3 size={18} className="text-emerald-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">
              {survey?.isActive ? (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse" /> Aktif
                </span>
              ) : (
                <span className="text-amber-400">Nonaktif</span>
              )}
            </p>
            <p className="text-[11px] text-slate-500 mt-2">Dapat diubah lewat tombol toggle di atas</p>
          </div>

          <div className="bg-slate-800/60 p-5 rounded-2xl border border-slate-700/60">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-medium">Format Jawaban</span>
              <MessageSquare size={18} className="text-purple-400" />
            </div>
            <p className="text-xl font-bold text-white mt-1">Rating & Pilihan Ganda</p>
            <p className="text-[11px] text-slate-500 mt-2">Disimpan di PostgreSQL DB Sebelah</p>
          </div>
        </div>

        {/* Visualisasi Grafik & Analisis Jawaban */}
        <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60">
          <h3 className="text-base font-bold text-white mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-blue-400" /> Ringkasan Analitik Pertanyaan
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {survey?.questions?.map((q: any, qIdx: number) => {
              const qStat = stats[q.id];
              return (
                <div key={q.id} className="bg-slate-900/70 p-5 rounded-2xl border border-slate-800">
                  <div className="flex items-start gap-2 mb-3">
                    <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded">
                      Q{qIdx + 1}
                    </span>
                    <p className="text-xs font-semibold text-slate-200 leading-snug">
                      {q.text}
                    </p>
                  </div>

                  {/* Rating Stats */}
                  {q.type === 'RATING' && qStat && (
                    <div>
                      <div className="flex items-baseline gap-2 mb-3">
                        <span className="text-2xl font-black text-amber-400">{qStat.average}</span>
                        <span className="text-xs text-slate-400">/ 5.0 Rata-rata Skor</span>
                      </div>
                      <div className="space-y-1.5">
                        {[5, 4, 3, 2, 1].map((star) => {
                          const count = qStat.counts[star] || 0;
                          const pct = qStat.total > 0 ? Math.round((count / qStat.total) * 100) : 0;
                          return (
                            <div key={star} className="flex items-center gap-2 text-xs">
                              <span className="w-12 text-slate-400 flex items-center gap-1">
                                {star} <Star size={11} className="text-amber-400 fill-amber-400" />
                              </span>
                              <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-amber-400 rounded-full transition-all" 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="w-12 text-right text-slate-400 font-mono text-[11px]">
                                {count} ({pct}%)
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Choice Stats */}
                  {q.type === 'CHOICE' && qStat && (
                    <div className="space-y-2">
                      {Object.entries(qStat.counts || {}).map(([opt, count]: any) => {
                        const pct = qStat.total > 0 ? Math.round((count / qStat.total) * 100) : 0;
                        return (
                          <div key={opt}>
                            <div className="flex justify-between text-xs text-slate-300 mb-1">
                              <span>{opt}</span>
                              <span className="font-mono text-slate-400">{count} ({pct}%)</span>
                            </div>
                            <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-blue-500 rounded-full transition-all" 
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Text Stats */}
                  {q.type === 'TEXT' && (
                    <p className="text-xs text-slate-400 mt-2">
                      Total masukan teks yang masuk: <span className="text-white font-bold">{qStat?.count || 0} saran</span> (dapat dilihat pada tabel di bawah atau file export CSV).
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tabel Rekapitulasi Responden */}
        <div className="bg-slate-800/60 p-6 rounded-3xl border border-slate-700/60">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users size={18} className="text-blue-400" /> Daftar Respon Masuk
              </h3>
              <p className="text-xs text-slate-400">Total {filteredRespondents.length} respon yang sesuai filter</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={15} className="absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama / kelas..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {filteredRespondents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs">
              Belum ada respon yang tercatat atau cocok dengan pencarian.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-700/80">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">No</th>
                    <th className="py-3 px-4">Waktu</th>
                    <th className="py-3 px-4">Nama</th>
                    <th className="py-3 px-4">Kategori/Info</th>
                    <th className="py-3 px-4">Ringkasan Jawaban</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 bg-slate-900/40">
                  {filteredRespondents.map((resp: any, index: number) => (
                    <tr key={resp.id} className="hover:bg-slate-800/50 transition">
                      <td className="py-3 px-4 font-mono text-slate-500">{index + 1}</td>
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        {new Date(resp.submittedAt).toLocaleString('id-ID', {
                          dateStyle: 'short',
                          timeStyle: 'short',
                        })}
                      </td>
                      <td className="py-3 px-4 font-bold text-white whitespace-nowrap">
                        {resp.name || 'Anonim'}
                      </td>
                      <td className="py-3 px-4 text-slate-300 whitespace-nowrap">
                        {resp.info || '-'}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        <div className="space-y-1">
                          {resp.answers.map((a: any) => {
                            const question = survey?.questions.find((q: any) => q.id === a.questionId);
                            return (
                              <div key={a.id} className="text-[11px] text-slate-400">
                                <span className="text-slate-500 font-medium">{question?.text.slice(0, 30)}... : </span>
                                <span className="text-slate-200 font-semibold">{a.value}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
