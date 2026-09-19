'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  KeyRound, ShieldCheck, LogOut, Download, Users, 
  BarChart3, CheckCircle, XCircle, ArrowLeft, Star, 
  Search, RefreshCw, MessageSquare, Eye, EyeOff, 
  Sparkles, ExternalLink, ChevronDown, Plus, Trash2, 
  Edit3, ArrowUp, ArrowDown, Settings, AlertTriangle, 
  Check, FileText, ListChecks
} from 'lucide-react';

export default function AdminPage() {
  // Auth State
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [passkeyInput, setPasskeyInput] = useState('');
  const [showPasskey, setShowPasskey] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [submittingKey, setSubmittingKey] = useState(false);

  // Tab State: 'analytics' | 'questions' | 'respondents' | 'settings'
  const [activeTab, setActiveTab] = useState<'analytics' | 'questions' | 'respondents' | 'settings'>('analytics');

  // Dashboard Data
  const [data, setData] = useState<any>(null);
  const [loadingData, setLoadingData] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toggling, setToggling] = useState(false);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  // Toast / Notification
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 4000);
  };

  // Question Modal State (Add / Edit)
  const [questionModalOpen, setQuestionModalOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<any | null>(null);
  const [qText, setQText] = useState('');
  const [qType, setQType] = useState<'RATING' | 'CHOICE' | 'TEXT'>('RATING');
  const [qOptions, setQOptions] = useState<string[]>(['Ya', 'Tidak']);
  const [qRequired, setQRequired] = useState(true);
  const [savingQuestion, setSavingQuestion] = useState(false);

  // Delete Confirm Modal State
  const [deleteQuestionId, setDeleteQuestionId] = useState<string | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState(false);

  // Respondent Delete / Reset State
  const [deleteRespondentId, setDeleteRespondentId] = useState<string | null>(null);
  const [deletingRespondent, setDeletingRespondent] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [resettingAll, setResettingAll] = useState(false);
  const [resetConfirmText, setResetConfirmText] = useState('');

  // Survey Settings Form State
  const [surveyTitle, setSurveyTitle] = useState('');
  const [surveyDesc, setSurveyDesc] = useState('');
  const [savingSettings, setSavingSettings] = useState(false);

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
        if (json.data?.survey) {
          setSurveyTitle(json.data.survey.title || '');
          setSurveyDesc(json.data.survey.description || '');
        }
      }
    } catch (err) {
      console.error(err);
      showToast('Gagal memuat data dari database', 'error');
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
        showToast('Selamat datang! Berhasil masuk ke Panel Admin.');
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
        showToast(json.isActive ? 'Kuesioner sekarang AKTIF (Menerima jawaban)' : 'Kuesioner sekarang DITUTUP.');
      }
    } catch {
      showToast('Gagal mengubah status survey', 'error');
    } finally {
      setToggling(false);
    }
  };

  // ----------------------------------------------------
  // QUESTION MANAGEMENT ACTIONS
  // ----------------------------------------------------
  const openAddQuestionModal = () => {
    setEditingQuestion(null);
    setQText('');
    setQType('RATING');
    setQOptions(['Ya', 'Tidak']);
    setQRequired(true);
    setQuestionModalOpen(true);
  };

  const openEditQuestionModal = (q: any) => {
    setEditingQuestion(q);
    setQText(q.text);
    setQType(q.type);
    let parsedOpts: string[] = ['Ya', 'Tidak'];
    if (q.options) {
      try {
        parsedOpts = JSON.parse(q.options);
      } catch {
        parsedOpts = ['Ya', 'Tidak'];
      }
    }
    setQOptions(parsedOpts);
    setQRequired(q.isRequired ?? true);
    setQuestionModalOpen(true);
  };

  const handleSaveQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qText.trim()) {
      showToast('Teks pertanyaan tidak boleh kosong!', 'error');
      return;
    }

    if (qType === 'CHOICE' && qOptions.filter(o => o.trim()).length < 2) {
      showToast('Pilihan ganda minimal harus memiliki 2 opsi!', 'error');
      return;
    }

    try {
      setSavingQuestion(true);
      const surveyId = data?.survey?.id;
      const filteredOptions = qOptions.filter(o => o.trim());

      if (editingQuestion) {
        // Update Existing Question
        const res = await fetch('/api/admin/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: editingQuestion.id,
            text: qText.trim(),
            type: qType,
            options: qType === 'CHOICE' ? filteredOptions : null,
            isRequired: qRequired,
          }),
        });
        const json = await res.json();
        if (json.success) {
          showToast('Pertanyaan berhasil diperbarui!');
          setQuestionModalOpen(false);
          fetchDashboardData();
        } else {
          showToast(json.message || 'Gagal memperbarui pertanyaan', 'error');
        }
      } else {
        // Create New Question
        const res = await fetch('/api/admin/questions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyId,
            text: qText.trim(),
            type: qType,
            options: qType === 'CHOICE' ? filteredOptions : null,
            isRequired: qRequired,
          }),
        });
        const json = await res.json();
        if (json.success) {
          showToast('Pertanyaan baru berhasil ditambahkan!');
          setQuestionModalOpen(false);
          fetchDashboardData();
        } else {
          showToast(json.message || 'Gagal menambahkan pertanyaan', 'error');
        }
      }
    } catch {
      showToast('Terjadi kesalahan saat menyimpan pertanyaan', 'error');
    } finally {
      setSavingQuestion(false);
    }
  };

  const handleDeleteQuestion = async () => {
    if (!deleteQuestionId) return;
    try {
      setDeletingQuestion(true);
      const res = await fetch(`/api/admin/questions?id=${deleteQuestionId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('Pertanyaan berhasil dihapus.');
        setDeleteQuestionId(null);
        fetchDashboardData();
      } else {
        showToast(json.message || 'Gagal menghapus pertanyaan', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat menghapus pertanyaan', 'error');
    } finally {
      setDeletingQuestion(false);
    }
  };

  const handleMoveQuestion = async (index: number, direction: 'up' | 'down') => {
    const questions = [...(data?.survey?.questions || [])];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= questions.length) return;

    const currentQ = questions[index];
    const targetQ = questions[targetIndex];

    try {
      // Swap order
      const tempOrder = currentQ.order;
      await Promise.all([
        fetch('/api/admin/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: currentQ.id, order: targetQ.order }),
        }),
        fetch('/api/admin/questions', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: targetQ.id, order: tempOrder }),
        }),
      ]);
      fetchDashboardData();
      showToast('Urutan pertanyaan berhasil diubah.');
    } catch {
      showToast('Gagal mengubah urutan pertanyaan', 'error');
    }
  };

  // ----------------------------------------------------
  // RESPONDENT ACTIONS (DELETE / RESET)
  // ----------------------------------------------------
  const handleDeleteRespondent = async () => {
    if (!deleteRespondentId) return;
    try {
      setDeletingRespondent(true);
      const res = await fetch(`/api/admin/responses?id=${deleteRespondentId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('Data respon berhasil dihapus.');
        setDeleteRespondentId(null);
        fetchDashboardData();
      } else {
        showToast(json.message || 'Gagal menghapus respon', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat menghapus respon', 'error');
    } finally {
      setDeletingRespondent(false);
    }
  };

  const handleResetAllResponses = async () => {
    if (resetConfirmText.trim().toUpperCase() !== 'RESET') {
      showToast('Ketik kata "RESET" dengan benar untuk konfirmasi.', 'error');
      return;
    }
    const surveyId = data?.survey?.id;
    if (!surveyId) return;

    try {
      setResettingAll(true);
      const res = await fetch(`/api/admin/responses?all=true&surveyId=${surveyId}`, {
        method: 'DELETE'
      });
      const json = await res.json();
      if (json.success) {
        showToast('Seluruh data respon berhasil dibersihkan!');
        setResetModalOpen(false);
        setResetConfirmText('');
        fetchDashboardData();
      } else {
        showToast(json.message || 'Gagal mereset respon', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat mereset data', 'error');
    } finally {
      setResettingAll(false);
    }
  };

  // ----------------------------------------------------
  // SURVEY SETTINGS ACTION
  // ----------------------------------------------------
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!surveyTitle.trim()) {
      showToast('Judul kuesioner tidak boleh kosong!', 'error');
      return;
    }
    const surveyId = data?.survey?.id;
    if (!surveyId) return;

    try {
      setSavingSettings(true);
      const res = await fetch('/api/admin/survey', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: surveyId,
          title: surveyTitle.trim(),
          description: surveyDesc.trim(),
        }),
      });
      const json = await res.json();
      if (json.success) {
        showToast('Pengaturan kuesioner berhasil disimpan!');
        fetchDashboardData();
      } else {
        showToast(json.message || 'Gagal menyimpan pengaturan', 'error');
      }
    } catch {
      showToast('Terjadi kesalahan saat memperbarui info survei', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // 1. Loading State
  if (authed === null) {
    return (
      <div className="min-h-screen zen-bg flex items-center justify-center text-white">
        <div className="text-center zen-glass-dark p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="relative w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full bg-emerald-500/30 animate-ping" />
            <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-emerald-200 text-xs font-bold tracking-wider uppercase">Memverifikasi Sesi Admin...</p>
        </div>
      </div>
    );
  }

  // 2. Passkey Gate Screen
  if (!authed) {
    return (
      <div className="min-h-screen zen-bg flex items-center justify-center p-4 text-slate-100">
        <div className="zen-glass-dark max-w-md w-full rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-2xl">
          <div className="relative">
            <div className="relative w-20 h-20 mx-auto mb-6 flex items-center justify-center">
              <div className="w-16 h-16 bg-gradient-to-tr from-emerald-700 to-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50 border border-emerald-400/30">
                <KeyRound size={30} />
              </div>
            </div>

            <div className="text-center mb-6">
              <span className="inline-flex items-center gap-1.5 py-1 px-3.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-black tracking-wider uppercase mb-2.5">
                <ShieldCheck size={13} className="text-teal-300" /> KONTROL TERPROTEKSI
              </span>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                Admin Passkey
              </h1>
              <p className="text-emerald-100/70 text-xs mt-2 leading-relaxed">
                Silakan masukkan passkey rahasia untuk membuka dashboard pengelola kuesioner.
              </p>
            </div>

            {authError && (
              <div className="mb-5 p-3.5 bg-rose-500/20 border border-rose-500/40 rounded-2xl text-rose-200 text-xs flex items-center gap-2.5">
                <XCircle size={16} className="flex-shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            /

            <form onSubmit={handleLoginPasskey} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-emerald-200 mb-2">
                  Passkey Pengelola
                </label>
                <div className="relative">
                  <input
                    type={showPasskey ? 'text' : 'password'}
                    placeholder="Masukkan passkey..."
                    value={passkeyInput}
                    onChange={(e) => setPasskeyInput(e.target.value)}
                    autoFocus
                    required
                    className="w-full pl-4 pr-11 py-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-700/60 text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-400 transition placeholder:text-emerald-200/30 shadow-inner"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasskey(!showPasskey)}
                    className="absolute right-3.5 top-3.5 text-emerald-300 hover:text-white transition"
                  >
                    {showPasskey ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                <div className="flex items-center justify-between text-[11px] text-emerald-200/60 mt-2 px-1">
                  <span>Default: <code className="text-emerald-300 font-mono bg-emerald-950/90 px-1.5 py-0.5 rounded border border-emerald-800">admin123#</code></span>
                  <span>Diatur di .env</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingKey}
                className="w-full py-4 px-4 zen-btn text-white font-black rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-wider"
              >
                {submittingKey ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Memverifikasi...</span>
                  </>
                ) : (
                  <span>Buka Dashboard Pengelola</span>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <Link 
                href="/" 
                className="inline-flex items-center gap-1.5 text-xs text-emerald-200/70 hover:text-white transition"
              >
                <ArrowLeft size={14} /> Kembali ke Halaman Kuesioner Mahasiswa
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 3. Main Dashboard View
  const survey = data?.survey;
  const questions = survey?.questions || [];
  const respondents = survey?.respondents || [];
  const stats = data?.stats || {};

  const filteredRespondents = respondents.filter((r: any) => {
    const q = searchTerm.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.nim && r.nim.toLowerCase().includes(q)) ||
      (r.prodi && r.prodi.toLowerCase().includes(q)) ||
      (r.semester && r.semester.toLowerCase().includes(q)) ||
      (r.info && r.info.toLowerCase().includes(q)) ||
      (r.answers && r.answers.some((a: any) => a.value && a.value.toLowerCase().includes(q)))
    );
  });

  return (
    <div className="min-h-screen zen-bg text-slate-900 pb-28">
      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 animate-bounce">
          <div className={`px-5 py-3.5 rounded-2xl shadow-2xl border flex items-center gap-3 text-xs font-bold text-white ${
            toast.type === 'success' 
              ? 'bg-emerald-900 border-emerald-500/50 shadow-emerald-950/40' 
              : 'bg-rose-900 border-rose-500/50 shadow-rose-950/40'
          }`}>
            {toast.type === 'success' ? <CheckCircle size={17} className="text-emerald-400" /> : <AlertTriangle size={17} className="text-rose-400" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Navbar */}
      <nav className="sticky top-0 z-40 bg-emerald-950/85 backdrop-blur-xl border-b border-white/10 px-4 py-3 shadow-md text-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center font-black text-sm flex-shrink-0 shadow-md shadow-emerald-900/40">
              S
            </div>
            <div className="truncate">
              <h2 className="text-sm font-black text-white flex items-center gap-2">
                <span>SURVEY CONTROL CENTER</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Admin Mode
                </span>
              </h2>
              <p className="text-[11px] text-emerald-200/70 truncate">PostgreSQL • Port 5433 (Aktif)</p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <Link
              href="/"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 text-xs font-bold text-emerald-100 hover:text-white px-3.5 py-2 rounded-xl bg-emerald-900/60 hover:bg-emerald-800/80 border border-emerald-700/50 transition"
            >
              <span>Halaman Kuesioner</span>
              <ExternalLink size={12} className="text-teal-300" />
            </Link>

            <button
              onClick={handleLogout}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-rose-300 hover:text-rose-100 px-3.5 py-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/30 transition shadow-sm"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main className="max-w-6xl mx-auto px-4 pt-6 sm:pt-8 space-y-6">
        {/* Header Banner & Quick Controls */}
        <div className="zen-glass-dark p-6 sm:p-8 rounded-3xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6 text-white shadow-xl">
          <div>
            <div className="inline-flex items-center gap-2 text-xs font-black text-emerald-300 uppercase tracking-wider mb-2">
              <Sparkles size={14} className="text-teal-300" />
              <span>PANEL KELOLA KUESIONER KAMPUS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {survey?.title || 'Kuesioner Mutu & Layanan Kampus'}
            </h1>
            <p className="text-xs text-emerald-200/80 mt-2 flex flex-wrap items-center gap-3 font-medium">
              <span>Pertanyaan: <strong className="text-white font-bold">{questions.length} item</strong></span>
              <span>•</span>
              <span>Total Respon: <strong className="text-white font-bold">{respondents.length} mahasiswa</strong></span>
              <span>•</span>
              <span>Status: <strong className={survey?.isActive ? "text-emerald-300 font-bold" : "text-amber-300 font-bold"}>{survey?.isActive ? "Buka (Online)" : "Tutup (Offline)"}</strong></span>
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap relative">
            {/* Toggle Status Button */}
            {survey && (
              <button
                onClick={handleToggleActive}
                disabled={toggling}
                className={`px-4 py-2.5 rounded-2xl text-xs font-extrabold transition flex items-center gap-2 border shadow-sm ${
                  survey.isActive 
                    ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30' 
                    : 'bg-amber-500/20 border-amber-500/40 text-amber-300 hover:bg-amber-500/30'
                }`}
              >
                {survey.isActive ? <CheckCircle size={15} /> : <XCircle size={15} />}
                <span>{survey.isActive ? 'Menerima Jawaban' : 'Survei Ditutup'}</span>
              </button>
            )}

            {/* Export CSV Button */}
            <a
              href="/api/admin/export"
              download
              className="px-4 py-2.5 zen-btn text-white rounded-2xl text-xs font-bold transition flex items-center gap-2 uppercase tracking-wider shadow-md"
            >
              <Download size={14} /> Unduh Excel / CSV
            </a>

            {/* Refresh Data */}
            <button
              onClick={fetchDashboardData}
              className="p-2.5 bg-emerald-950/80 hover:bg-emerald-900/80 text-emerald-200 hover:text-white rounded-2xl border border-emerald-700/60 transition shadow-sm"
              title="Perbarui Data"
            >
              <RefreshCw size={16} className={loadingData ? 'animate-spin text-teal-300' : ''} />
            </button>
          </div>
        </div>

        {/* 4 Tabs Navigation Bar */}
        <div className="flex items-center gap-2 border-b border-emerald-900/20 pb-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'zen-btn text-white shadow-lg'
                : 'bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80'
            }`}
          >
            <BarChart3 size={15} />
            <span>📊 Analitik & Statistik</span>
          </button>

          <button
            onClick={() => setActiveTab('questions')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'questions'
                ? 'zen-btn text-white shadow-lg'
                : 'bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80'
            }`}
          >
            <ListChecks size={15} />
            <span>📝 Kelola Pertanyaan ({questions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('respondents')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'respondents'
                ? 'zen-btn text-white shadow-lg'
                : 'bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80'
            }`}
          >
            <Users size={15} />
            <span>👥 Data Responden ({respondents.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-5 py-3 rounded-2xl text-xs font-black transition flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'zen-btn text-white shadow-lg'
                : 'bg-white/70 hover:bg-white text-slate-700 border border-slate-200/80'
            }`}
          >
            <Settings size={15} />
            <span>⚙️ Pengaturan Kuesioner</span>
          </button>
        </div>

        {/* ---------------------------------------------------- */}
        {/* TAB 1: ANALYTICS & STATS                             */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'analytics' && (
          <div className="space-y-6">
            {/* 3 KPI Metric Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="zen-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-t-emerald-600">
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">Total Responden</span>
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center border border-emerald-200">
                    <Users size={18} />
                  </div>
                </div>
                <p className="text-4xl font-black text-slate-900">
                  {data?.totalRespondents ?? 0}
                </p>
                <p className="text-xs text-slate-500 mt-2">Respon mahasiswa yang tersimpan di DB</p>
              </div>

              <div className="zen-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-t-teal-600">
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">Jumlah Pertanyaan</span>
                  <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center border border-teal-200">
                    <ListChecks size={18} />
                  </div>
                </div>
                <p className="text-4xl font-black text-slate-900">
                  {questions.length}
                </p>
                <p className="text-xs text-slate-500 mt-2">Item pertanyaan aktif dalam kuesioner</p>
              </div>

              <div className="zen-card p-6 rounded-3xl relative overflow-hidden border-t-2 border-t-slate-600">
                <div className="flex items-center justify-between text-slate-500 mb-3">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-600">Status Akses</span>
                  <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
                    <BarChart3 size={18} />
                  </div>
                </div>
                <div className="mt-1">
                  {survey?.isActive ? (
                    <div className="flex items-center gap-2 text-emerald-700 font-black text-2xl">
                      <span className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse shadow-md shadow-emerald-500/50" />
                      <span>Aktif (Online)</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-amber-600 font-black text-2xl">
                      <span>Ditutup</span>
                    </div>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-2">Dapat diatur buka/tutup kapan saja</p>
              </div>
            </div>

            {/* Analisis Statistik Pertanyaan */}
            <div className="zen-card p-6 sm:p-8 rounded-3xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                    <BarChart3 size={20} className="text-emerald-700" />
                    <span>Ringkasan Analitik Pertanyaan</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Distribusi jawaban otomatis dari {data?.totalRespondents ?? 0} responden
                  </p>
                </div>
                <button
                  onClick={() => setActiveTab('questions')}
                  className="hidden sm:inline-flex items-center gap-1 text-xs font-bold text-emerald-800 hover:text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition"
                >
                  <Plus size={13} /> Kelola Pertanyaan &rarr;
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {questions.map((q: any, qIdx: number) => {
                  const qStat = stats[q.id];
                  return (
                    <div key={q.id} className="bg-white/90 p-5 sm:p-6 rounded-2xl border border-slate-200/80 shadow-xs">
                      <div className="flex items-start gap-3 mb-4">
                        <span className="text-xs font-black text-emerald-800 bg-emerald-100 px-2.5 py-1 rounded-xl border border-emerald-200 flex-shrink-0">
                          Q{qIdx + 1}
                        </span>
                        <div className="flex-1">
                          <p className="text-sm font-bold text-slate-900 leading-snug">
                            {q.text}
                          </p>
                          <span className="inline-block mt-1 text-[10px] font-bold text-slate-500 uppercase">
                            Tipe: {q.type === 'RATING' ? 'Rating Bintang (1-5)' : q.type === 'CHOICE' ? 'Pilihan Ganda' : 'Esai Bebas'}
                          </span>
                        </div>
                      </div>

                      {/* Rating Type Analysis */}
                      {q.type === 'RATING' && qStat && (
                        <div>
                          <div className="flex items-baseline gap-2 mb-4 bg-amber-50/70 p-3.5 rounded-2xl border border-amber-200/80">
                            <span className="text-3xl font-black text-amber-600">
                              {qStat.average}
                            </span>
                            <span className="text-xs text-slate-600 font-semibold">/ 5.0 Rata-rata Skor Bintang</span>
                          </div>

                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = qStat.counts[star] || 0;
                              const pct = qStat.total > 0 ? Math.round((count / qStat.total) * 100) : 0;
                              return (
                                <div key={star} className="flex items-center gap-2 text-xs">
                                  <span className="w-14 text-slate-600 flex items-center gap-1 font-semibold">
                                    {star} <Star size={11} className="text-amber-500 fill-amber-500" />
                                  </span>
                                  <div className="flex-1 h-2.5 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                                    <div 
                                      className="h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full transition-all duration-300" 
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className="w-14 text-right text-slate-600 font-mono text-[11px]">
                                    {count} ({pct}%)
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Choice Type Analysis */}
                      {q.type === 'CHOICE' && qStat && (
                        <div className="space-y-2.5">
                          {Object.entries(qStat.counts || {}).map(([opt, count]: any) => {
                            const pct = qStat.total > 0 ? Math.round((count / qStat.total) * 100) : 0;
                            return (
                              <div key={opt} className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                                <div className="flex justify-between text-xs text-slate-800 mb-1.5 font-medium">
                                  <span>{opt}</span>
                                  <span className="font-mono text-emerald-700 font-bold">{count} ({pct}%)</span>
                                </div>
                                <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                  <div 
                                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-600 rounded-full transition-all duration-300" 
                                    style={{ width: `${pct}%` }}
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Text Type Analysis */}
                      {q.type === 'TEXT' && (
                        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600">
                          <p>Total masukan/saran: <strong className="text-emerald-800">{qStat?.count || 0} respon</strong>.</p>
                          <p className="text-[11px] text-slate-500 mt-1">Dapat dibaca lengkap pada tab Data Responden atau diunduh via Excel.</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 2: MANAGE QUESTIONS (CRUD)                       */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'questions' && (
          <div className="space-y-6">
            <div className="zen-card p-6 sm:p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                    <ListChecks size={20} className="text-emerald-700" />
                    <span>Daftar Pertanyaan Kuesioner</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola pertanyaan yang ditampilkan pada halaman kuesioner mahasiswa
                  </p>
                </div>

                <button
                  onClick={openAddQuestionModal}
                  className="px-4 py-2.5 zen-btn text-white rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-md uppercase tracking-wider"
                >
                  <Plus size={15} /> Tambah Pertanyaan Baru
                </button>
              </div>

              {questions.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <ListChecks size={36} className="mx-auto mb-2 opacity-30 text-emerald-700" />
                  <p className="font-bold text-slate-600 text-sm">Belum ada pertanyaan pada kuesioner ini.</p>
                  <p className="text-slate-400 mt-1">Klik tombol "Tambah Pertanyaan Baru" untuk mulai membuat pertanyaan.</p>
                </div>
              ) : (
                <div className="space-y-3.5">
                  {questions.map((q: any, idx: number) => {
                    let parsedOpts: string[] = [];
                    if (q.type === 'CHOICE' && q.options) {
                      try {
                        parsedOpts = JSON.parse(q.options);
                      } catch {
                        parsedOpts = [];
                      }
                    }

                    return (
                      <div 
                        key={q.id} 
                        className="p-5 rounded-2xl bg-white/95 border border-slate-200/90 hover:border-emerald-500/40 hover:shadow-md transition flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-1 flex-shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(idx, 'up')}
                              disabled={idx === 0}
                              title="Pindahkan ke atas"
                              className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                              <ArrowUp size={13} />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveQuestion(idx, 'down')}
                              disabled={idx === questions.length - 1}
                              title="Pindahkan ke bawah"
                              className="p-1 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-600 hover:text-emerald-800 disabled:opacity-30 disabled:pointer-events-none transition"
                            >
                              <ArrowDown size={13} />
                            </button>
                          </div>

                          {/* Index Badge */}
                          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-800 to-teal-700 text-white font-black text-xs flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm shadow-emerald-900/30">
                            {idx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap mb-1.5">
                              <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                                q.type === 'RATING'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                                  : q.type === 'CHOICE'
                                  ? 'bg-teal-50 text-teal-800 border-teal-300'
                                  : 'bg-blue-50 text-blue-800 border-blue-300'
                              }`}>
                                {q.type === 'RATING' ? '⭐ Rating 1-5 Bintang' : q.type === 'CHOICE' ? '🔘 Pilihan Ganda' : '💬 Esai / Teks'}
                              </span>

                              {q.isRequired && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold">
                                  Wajib Diisi
                                </span>
                              )}
                            </div>

                            <p className="text-sm font-black text-slate-900 leading-snug">
                              {q.text}
                            </p>

                            {/* Options Preview for CHOICE */}
                            {q.type === 'CHOICE' && parsedOpts.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2.5">
                                <span className="text-[11px] text-slate-500 mr-1 font-semibold">Opsi:</span>
                                {parsedOpts.map((opt: string, optIdx: number) => (
                                  <span key={optIdx} className="text-[11px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
                                    {opt}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 self-end md:self-center flex-shrink-0 border-t md:border-t-0 pt-2 md:pt-0 border-slate-100 w-full md:w-auto justify-end">
                          <button
                            type="button"
                            onClick={() => openEditQuestionModal(q)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteQuestionId(q.id)}
                            className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 hover:text-rose-900 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-rose-200"
                          >
                            <Trash2 size={13} /> Hapus
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 3: RESPONDENTS & ANSWERS DATA                   */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'respondents' && (
          <div className="space-y-6">
            <div className="zen-card p-6 sm:p-8 rounded-3xl">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5">
                    <Users size={20} className="text-emerald-700" />
                    <span>Daftar Respon Masuk</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Menampilkan {filteredRespondents.length} dari {respondents.length} total pengisi
                  </p>
                </div>

                <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                  <div className="relative w-full sm:w-64">
                    <Search size={15} className="absolute left-3.5 top-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Cari nama, NIM, prodi, jawaban..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl bg-white border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition"
                    />
                  </div>

                  {respondents.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setResetConfirmText('');
                        setResetModalOpen(true);
                      }}
                      className="px-3.5 py-2.5 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap shadow-xs"
                      title="Hapus seluruh data responden (Reset)"
                    >
                      <Trash2 size={14} /> Kosongkan Semua Respon
                    </button>
                  )}
                </div>
              </div>

              {filteredRespondents.length === 0 ? (
                <div className="text-center py-16 text-slate-400 text-xs">
                  <Users size={32} className="mx-auto mb-2 opacity-30 text-emerald-700" />
                  <p>Belum ada respon yang tercatat atau cocok dengan pencarian.</p>
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3.5 px-4 w-12 text-center">No</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Waktu</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Nama Mahasiswa</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">NIM</th>
                        <th className="py-3.5 px-4 whitespace-nowrap">Program Studi</th>
                        <th className="py-3.5 px-4 whitespace-nowrap text-center">Semester</th>
                        <th className="py-3.5 px-4">Jawaban</th>
                        <th className="py-3.5 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredRespondents.map((resp: any, index: number) => {
                        const isExpanded = expandedRow === resp.id;
                        return (
                          <tr key={resp.id} className="hover:bg-emerald-50/40 transition">
                            <td className="py-3 px-4 font-mono text-slate-500 text-center">{index + 1}</td>
                            <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                              {new Date(resp.submittedAt).toLocaleString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </td>
                            <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                              {resp.name ? (
                                resp.name
                              ) : (
                                <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 font-normal">
                                  Anonim
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 font-mono text-slate-700 whitespace-nowrap">
                              {resp.nim ? (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                                  {resp.nim}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                              {resp.prodi || resp.info ? (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200 font-semibold">
                                  {resp.prodi || resp.info}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center whitespace-nowrap">
                              {resp.semester ? (
                                <span className="text-[11px] px-2.5 py-0.5 rounded-lg bg-teal-50 text-teal-800 border border-teal-200 font-bold">
                                  Smtr {resp.semester}
                                </span>
                              ) : (
                                <span className="text-slate-400">-</span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-slate-700">
                              <button
                                type="button"
                                onClick={() => setExpandedRow(isExpanded ? null : resp.id)}
                                className="inline-flex items-center gap-1.5 py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-900 transition text-[11px] font-medium"
                              >
                                <span>Lihat {resp.answers?.length || 0} Jawaban</span>
                                <ChevronDown size={12} className={`transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                              </button>

                              {isExpanded && (
                                <div className="mt-3 p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2 text-xs">
                                  {resp.answers.map((a: any) => {
                                    const question = questions.find((q: any) => q.id === a.questionId);
                                    return (
                                      <div key={a.id} className="border-b border-slate-200 pb-1.5 last:border-0 last:pb-0">
                                        <p className="text-[11px] text-slate-500 font-medium">{question?.text || 'Pertanyaan Dihapus'}</p>
                                        <p className="text-slate-900 font-bold mt-0.5">{a.value}</p>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <button
                                type="button"
                                onClick={() => setDeleteRespondentId(resp.id)}
                                title="Hapus respon ini"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                              >
                                <Trash2 size={15} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* TAB 4: SURVEY SETTINGS                              */}
        {/* ---------------------------------------------------- */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="zen-card p-6 sm:p-8 rounded-3xl max-w-2xl">
              <h3 className="text-lg font-black text-slate-900 flex items-center gap-2.5 mb-2">
                <Settings size={20} className="text-emerald-700" />
                <span>Pengaturan Umum Kuesioner</span>
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Ubah judul kuesioner dan deskripsi instruksi yang dilihat oleh mahasiswa.
              </p>

              <form onSubmit={handleSaveSettings} className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Judul Kuesioner
                  </label>
                  <input
                    type="text"
                    value={surveyTitle}
                    onChange={(e) => setSurveyTitle(e.target.value)}
                    required
                    placeholder="Contoh: Survey Mahasiswa Kampus Uin"
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">Judul ini muncul sebagai teks utama di halaman depan survei mahasiswa.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Deskripsi / Petunjuk Pengisian
                  </label>
                  <textarea
                    rows={3}
                    value={surveyDesc}
                    onChange={(e) => setSurveyDesc(e.target.value)}
                    placeholder="Contoh: Sampaikan aspirasi dan evaluasi Anda secara objektif..."
                    className="w-full p-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-900 transition focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20 resize-y"
                  />
                </div>

                <div className="pt-2 flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-6 py-3.5 zen-btn text-white font-black rounded-2xl transition-all active:scale-[0.98] flex items-center gap-2 text-xs uppercase tracking-wider shadow-md disabled:opacity-50"
                  >
                    {savingSettings ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        <span>Menyimpan...</span>
                      </>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Simpan Perubahan Pengaturan</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ==================================================== */}
      {/* MODAL: ADD / EDIT QUESTION                           */}
      {/* ==================================================== */}
      {questionModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200 relative max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Plus size={18} className="text-emerald-700" />
                <span>{editingQuestion ? 'Edit Pertanyaan' : 'Tambah Pertanyaan Baru'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setQuestionModalOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 transition"
              >
                <XCircle size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveQuestion} className="space-y-4">
              {/* Teks Pertanyaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Teks Pertanyaan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={qText}
                  onChange={(e) => setQText(e.target.value)}
                  required
                  placeholder="Ketikkan bunyi pertanyaan yang ingin ditanyakan kepada mahasiswa..."
                  className="w-full p-3.5 rounded-2xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:border-emerald-600 focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Tipe Pertanyaan */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Jenis Format Jawaban
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setQType('RATING')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      qType === 'RATING'
                        ? 'bg-amber-50 border-amber-400 text-amber-900 ring-2 ring-amber-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <Star size={16} className={qType === 'RATING' ? 'text-amber-500 fill-amber-500' : 'text-slate-400'} />
                    <span>Rating Bintang</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQType('CHOICE')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      qType === 'CHOICE'
                        ? 'bg-teal-50 border-teal-400 text-teal-900 ring-2 ring-teal-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <ListChecks size={16} className={qType === 'CHOICE' ? 'text-teal-600' : 'text-slate-400'} />
                    <span>Pilihan Ganda</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setQType('TEXT')}
                    className={`p-3 rounded-2xl border text-xs font-bold transition flex flex-col items-center gap-1 ${
                      qType === 'TEXT'
                        ? 'bg-blue-50 border-blue-400 text-blue-900 ring-2 ring-blue-400/30'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <FileText size={16} className={qType === 'TEXT' ? 'text-blue-600' : 'text-slate-400'} />
                    <span>Esai / Teks</span>
                  </button>
                </div>
              </div>

              {/* Dynamic Options for CHOICE */}
              {qType === 'CHOICE' && (
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800">
                      Opsi Pilihan Jawaban
                    </span>
                    <button
                      type="button"
                      onClick={() => setQOptions([...qOptions, ''])}
                      className="text-[11px] text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                    >
                      <Plus size={13} /> Tambah Opsi
                    </button>
                  </div>

                  <div className="space-y-2">
                    {qOptions.map((opt, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="w-5 text-center text-xs font-mono text-slate-400">{i + 1}.</span>
                        <input
                          type="text"
                          value={opt}
                          onChange={(e) => {
                            const updated = [...qOptions];
                            updated[i] = e.target.value;
                            setQOptions(updated);
                          }}
                          placeholder={`Opsi ${i + 1}...`}
                          className="flex-1 px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-emerald-600"
                        />
                        {qOptions.length > 2 && (
                          <button
                            type="button"
                            onClick={() => {
                              const updated = qOptions.filter((_, idx) => idx !== i);
                              setQOptions(updated);
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <div className="pt-2 border-t border-slate-200/80 flex items-center gap-2 flex-wrap text-[11px] text-slate-500">
                    <span>Template Cepat:</span>
                    <button
                      type="button"
                      onClick={() => setQOptions(['Ya', 'Tidak'])}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 font-semibold"
                    >
                      Ya / Tidak
                    </button>
                    <button
                      type="button"
                      onClick={() => setQOptions(['Sangat Puas', 'Puas', 'Cukup', 'Kurang Puas', 'Tidak Puas'])}
                      className="px-2 py-0.5 rounded-md bg-white border border-slate-200 hover:bg-slate-100 font-semibold"
                    >
                      5 Tingkat Kepuasan
                    </button>
                  </div>
                </div>
              )}

              {/* Checkbox Wajib Diisi */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="q-required"
                  checked={qRequired}
                  onChange={(e) => setQRequired(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="q-required" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Wajib dijawab oleh responden (*Required*)
                </label>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setQuestionModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={savingQuestion}
                  className="px-5 py-2.5 zen-btn text-white rounded-xl text-xs font-black transition flex items-center gap-2 uppercase tracking-wider disabled:opacity-50"
                >
                  {savingQuestion ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Menyimpan...</span>
                    </>
                  ) : (
                    <span>{editingQuestion ? 'Simpan Perubahan' : 'Tambahkan Pertanyaan'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE QUESTION CONFIRMATION                 */}
      {/* ==================================================== */}
      {deleteQuestionId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 size={24} />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1.5">Hapus Pertanyaan?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Pertanyaan ini akan dihapus dari kuesioner. Seluruh jawaban terkait pertanyaan ini juga akan terhapus otomatis.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteQuestionId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteQuestion}
                disabled={deletingQuestion}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {deletingQuestion ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: DELETE RESPONDENT CONFIRMATION               */}
      {/* ==================================================== */}
      {deleteRespondentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center shadow-2xl border border-slate-200">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 size={24} />
            </div>
            <h4 className="text-sm font-black text-slate-900 mb-1.5">Hapus Respon Mahasiswa?</h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Data jawaban dari responden ini akan dihapus permanen dari database.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteRespondentId(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleDeleteRespondent}
                disabled={deletingRespondent}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm disabled:opacity-50"
              >
                {deletingRespondent ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================== */}
      {/* MODAL: RESET ALL RESPONSES (EMPTY SURVEY)           */}
      {/* ==================================================== */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-2xl border border-rose-200">
            <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-4 border border-rose-300">
              <AlertTriangle size={28} />
            </div>
            <h4 className="text-base font-black text-slate-900 mb-1 text-center">Kosongkan Semua Data Respon?</h4>
            <p className="text-xs text-rose-700 bg-rose-50 p-3 rounded-xl border border-rose-200 my-4 text-left leading-relaxed">
              <strong>PERHATIAN:</strong> Tindakan ini akan <strong>menghapus permanen seluruh ({respondents.length}) respon mahasiswa</strong> yang telah tersimpan di database. Pertanyaan kuesioner akan tetap ada. Tindakan ini tidak dapat dibatalkan!
            </p>

            <div className="text-left mb-5">
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Ketik kata <span className="font-mono font-black text-rose-600">RESET</span> di bawah untuk konfirmasi:
              </label>
              <input
                type="text"
                placeholder="Ketik RESET..."
                value={resetConfirmText}
                onChange={(e) => setResetConfirmText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 font-mono uppercase focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-400/20"
              />
            </div>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setResetModalOpen(false);
                  setResetConfirmText('');
                }}
                className="flex-1 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetAllResponses}
                disabled={resettingAll || resetConfirmText.trim().toUpperCase() !== 'RESET'}
                className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {resettingAll ? 'Membersihkan...' : 'Hapus Semua Data'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
