import React, { useState } from 'react';
import { 
  Sparkles, 
  PlusCircle, 
  History, 
  CheckCircle2, 
  Calendar, 
  User, 
  Tag, 
  Search, 
  Filter, 
  Trash2, 
  FileText, 
  Terminal, 
  Layers,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { SystemUpdate, UpdateCategory } from '../types';
import { formatDateIndo } from '../utils/formatters';

interface UpdatesViewProps {
  updates: SystemUpdate[];
  onAddUpdate: (newUpdate: Omit<SystemUpdate, 'id'>) => void;
  onDeleteUpdate?: (id: string) => void;
  isAdmin?: boolean;
}

export const UpdatesView: React.FC<UpdatesViewProps> = ({
  updates = [],
  onAddUpdate,
  onDeleteUpdate,
  isAdmin = true,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [version, setVersion] = useState('');
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState<UpdateCategory>('Fitur Baru');
  const [description, setDescription] = useState('');
  const [author, setAuthor] = useState('Admin OSIS');
  const [changesText, setChangesText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !version || !description) return;

    const changesList = changesText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    onAddUpdate({
      version,
      title,
      date,
      category,
      description,
      author,
      changesList: changesList.length > 0 ? changesList : [description],
    });

    // Reset Form
    setVersion('');
    setTitle('');
    setDescription('');
    setChangesText('');
    setIsModalOpen(false);
  };

  const categories: UpdateCategory[] = ['UI/UX', 'Fitur Baru', 'Perbaikan Bug', 'Database / Cloud', 'Lainnya'];

  const filteredUpdates = updates.filter(item => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.version.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const getCategoryBadgeClass = (cat: UpdateCategory) => {
    switch (cat) {
      case 'UI/UX':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Fitur Baru':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Perbaikan Bug':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      case 'Database / Cloud':
        return 'bg-sky-100 text-sky-800 border-sky-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const latestVersion = updates.length > 0 ? updates[0].version : 'v2.4.0';

  return (
    <div className="space-y-6 pb-12">
      
      {/* Top Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-7 text-white shadow-xl relative overflow-hidden border border-white/10">
        <div className="absolute right-0 top-0 w-96 h-96 bg-indigo-500/15 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Changelog & System History</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              Riwayat Update Sistem OSIS
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Catatan lengkap rekam jejak pengembangan fitur, pembaruan antarmuka (UI/UX), integrasi cloud, dan perbaikan pada web OSIS-SKARLAKES.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
            <div className="bg-white/10 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/15 text-center">
              <span className="text-[10px] uppercase tracking-wider font-bold text-indigo-200 block">Versi Terakhir</span>
              <span className="text-lg font-black text-amber-400 font-mono">{latestVersion}</span>
            </div>

            <button
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs sm:text-sm font-bold flex items-center justify-center space-x-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <PlusCircle className="w-4.5 h-4.5" />
              <span>Catat Update Baru</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari versi, fitur, atau rincian update..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors ${
              selectedCategory === 'all' 
                ? 'bg-indigo-600 text-white shadow-2xs' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Semua ({updates.length})
          </button>
          {categories.map((cat) => {
            const count = updates.filter(u => u.category === cat).length;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold shrink-0 transition-colors flex items-center space-x-1.5 ${
                  selectedCategory === cat 
                    ? 'bg-indigo-600 text-white shadow-2xs' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{cat}</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white/20">{count}</span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Timeline Feed Section */}
      <div className="space-y-6">
        {filteredUpdates.length === 0 ? (
          <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center space-y-3">
            <History className="w-12 h-12 text-slate-300 mx-auto" />
            <h3 className="text-base font-bold text-slate-800">Tidak ada data update ditemukan</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Cobalah untuk mengubah pencarian atau pilih kategori lain.
            </p>
          </div>
        ) : (
          filteredUpdates.map((item) => (
            <div 
              key={item.id} 
              className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md transition-all relative overflow-hidden group"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 pb-4 border-b border-slate-100">
                
                <div className="flex items-center space-x-3">
                  <span className="px-3 py-1 rounded-xl bg-slate-900 text-amber-400 font-mono font-black text-xs shadow-xs">
                    {item.version}
                  </span>
                  <div>
                    <h2 className="text-base sm:text-lg font-black text-slate-900 leading-tight">
                      {item.title}
                    </h2>
                    <div className="flex items-center space-x-2 text-2xs text-slate-500 mt-0.5">
                      <span className="flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-slate-400" />
                        {formatDateIndo(item.date)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center">
                        <User className="w-3 h-3 mr-1 text-slate-400" />
                        {item.author}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-start">
                  <span className={`px-2.5 py-1 rounded-lg text-2xs font-extrabold border ${getCategoryBadgeClass(item.category)}`}>
                    {item.category}
                  </span>
                  {onDeleteUpdate && isAdmin && (
                    <button
                      onClick={() => onDeleteUpdate(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors"
                      title="Hapus Log Update Ini"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm text-slate-600 my-4 leading-relaxed">
                {item.description}
              </p>

              {/* List of changes */}
              {item.changesList && item.changesList.length > 0 && (
                <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-100 space-y-2">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Rincian Pembaruan:</span>
                  <ul className="space-y-1.5">
                    {item.changesList.map((change, idx) => (
                      <li key={idx} className="flex items-start text-xs text-slate-700 space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{change}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

            </div>
          ))
        )}
      </div>

      {/* Modal Form Tambah Update Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center space-x-2">
                <Sparkles className="w-5 h-5 text-indigo-600" />
                <h2 className="text-lg font-black text-slate-900">Catat Log Update Baru</h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Versi Rilis *</label>
                  <input
                    type="text"
                    required
                    placeholder="misal: v2.5.0"
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Kategori *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as UpdateCategory)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Judul Pembaruan *</label>
                <input
                  type="text"
                  required
                  placeholder="misal: Redesain Tampilan & Integrasi Database"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tanggal Rilis</label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Pembuat Update</label>
                  <input
                    type="text"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ringkasan Singkat *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="Jelaskan secara singkat latar belakang atau tujuan update ini..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Poin Rincian Perubahan (1 baris per poin)</label>
                <textarea
                  rows={4}
                  placeholder="• Menambahkan kartu statistik Soft Pastel&#10;• Menambahkan grafik spline area gradient&#10;• Memperbaiki bug koneksi cloud"
                  value={changesText}
                  onChange={(e) => setChangesText(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-md"
                >
                  Simpan Log Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
