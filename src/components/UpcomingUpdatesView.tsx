import React, { useState } from 'react';
import { 
  Rocket, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  ThumbsUp, 
  Search, 
  Layers, 
  Bot, 
  BellRing, 
  QrCode, 
  BarChart3,
  Calendar,
  Zap,
  LayoutGrid,
  GitCommit,
  ShieldCheck,
  Wand2,
  ArrowRight,
  TrendingUp
} from 'lucide-react';
import { UpcomingUpdate, OrganizationConfig, RoadmapStatus } from '../types';

interface UpcomingUpdatesViewProps {
  upcomingList: UpcomingUpdate[];
  config: OrganizationConfig;
}

export const UpcomingUpdatesView: React.FC<UpcomingUpdatesViewProps> = ({
  upcomingList,
  config
}) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [upvotes, setUpvotes] = useState<Record<string, number>>({});
  const [votedMap, setVotedMap] = useState<Record<string, boolean>>({});

  const handleUpvote = (id: string, initialCount: number) => {
    const isVoted = votedMap[id];
    const currentCount = upvotes[id] !== undefined ? upvotes[id] : initialCount;

    if (isVoted) {
      setUpvotes({ ...upvotes, [id]: currentCount - 1 });
      setVotedMap({ ...votedMap, [id]: false });
    } else {
      setUpvotes({ ...upvotes, [id]: currentCount + 1 });
      setVotedMap({ ...votedMap, [id]: true });
    }
  };

  const getStatusBadge = (status: RoadmapStatus) => {
    switch (status) {
      case 'Segera Hadir':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-1.5 shrink-0 shadow-xs">
            <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
            <span>Segera Hadir</span>
          </span>
        );
      case 'Dalam Pengembangan':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-blue-500/20 to-indigo-500/20 text-blue-300 border border-blue-500/40 flex items-center space-x-1.5 shrink-0 shadow-xs">
            <Clock className="w-3.5 h-3.5 text-blue-400" />
            <span>Dalam Pengembangan</span>
          </span>
        );
      case 'Direncanakan':
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-300 border border-purple-500/40 flex items-center space-x-1.5 shrink-0 shadow-xs">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Direncanakan</span>
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 rounded-full text-xs font-black bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1.5 shrink-0 shadow-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Beta Test</span>
          </span>
        );
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Mobilitas & Notifikasi':
        return <BellRing className="w-4 h-4 text-amber-500" />;
      case 'UI/UX':
        return <BarChart3 className="w-4 h-4 text-blue-500" />;
      case 'Fitur Baru':
        return <QrCode className="w-4 h-4 text-emerald-500" />;
      case 'Integrasi AI':
        return <Wand2 className="w-4 h-4 text-purple-500" />;
      default:
        return <Rocket className="w-4 h-4 text-indigo-500" />;
    }
  };

  const filteredList = upcomingList.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.versionTarget.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalVotesAcrossAll = upcomingList.reduce((sum, item) => {
    const count = upvotes[item.id] !== undefined ? upvotes[item.id] : item.upvotesCount;
    return sum + count;
  }, 0);

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* ─── ELEGANT HERO HEADER BANNER ────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-8 sm:p-10 rounded-3xl text-white shadow-2xl relative overflow-hidden border border-indigo-500/30">
        
        {/* Glowing Mesh Blur Background Orbs */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-20 -top-20 w-96 h-96 bg-gradient-to-br from-indigo-500/30 to-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-1/2 -translate-y-1/2 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
          
          <div className="space-y-4 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-black bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center space-x-2 shadow-inner">
                <Rocket className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="tracking-wide">SYSTEM ROADMAP & FEATURE PIPELINE</span>
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/10 text-slate-300 border border-white/10 backdrop-blur-md">
                ✨ Official OSIS Release Target
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              List Update & Roadmap Masa Depan
            </h1>

            <p className="text-sm sm:text-base text-slate-300/90 leading-relaxed font-normal">
              Selamat datang di portal inovasi terpadu **{config.shortName}**. Di sini seluruh rencana fitur baru, peningkatan keamanan, dan rilis versi mendatang dirancang dengan transparan. Berikan dukungan pada fitur impianmu!
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-4 text-xs font-semibold text-slate-400">
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Terverifikasi Tim Pengembang BPH</span>
              </div>
              <div className="flex items-center space-x-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span>{totalVotesAcrossAll} Total Dukungan Suara Pengurus</span>
              </div>
            </div>
          </div>

          {/* Right Stat Cards */}
          <div className="grid grid-cols-2 gap-3 shrink-0 lg:w-72">
            <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/15 text-center shadow-lg hover:border-amber-400/40 transition-colors">
              <span className="block text-3xs font-black uppercase tracking-wider text-slate-400">Target Versi Baru</span>
              <span className="text-2xl font-black text-amber-400 font-mono mt-1 block">{upcomingList.length} Release</span>
              <span className="text-3xs text-slate-400 mt-1 block">v4.5.0 s.d. v6.0.0</span>
            </div>
            <div className="bg-white/10 backdrop-blur-xl p-4 rounded-2xl border border-white/15 text-center shadow-lg hover:border-indigo-400/40 transition-colors">
              <span className="block text-3xs font-black uppercase tracking-wider text-slate-400">Dukungan Pengurus</span>
              <span className="text-2xl font-black text-emerald-400 font-mono mt-1 block">{totalVotesAcrossAll}</span>
              <span className="text-3xs text-slate-400 mt-1 block">Upvotes Masuk</span>
            </div>
          </div>

        </div>
      </div>

      {/* ─── CONTROLS, SEARCH, FILTER & VIEW TOGGLE BAR ────────────────────── */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/90 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4.5 h-4.5 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Cari fitur, versi target, atau kata kunci roadmap..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-semibold focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all shadow-inner"
          />
        </div>

        {/* Filters & View Mode */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          
          {/* Category Filter Dropdown */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
          >
            <option value="all">🌐 Semua Kategori</option>
            <option value="Mobilitas & Notifikasi">📱 Notifikasi & WA</option>
            <option value="UI/UX">📊 UI & Analytics</option>
            <option value="Fitur Baru">💳 QRIS & Pass ID</option>
            <option value="Integrasi AI">🤖 Kecerdasan AI</option>
          </select>

          {/* View Mode Toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'grid'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Grid Kartu</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                viewMode === 'timeline'
                  ? 'bg-white text-indigo-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <GitCommit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Timeline Release</span>
            </button>
          </div>

        </div>

      </div>

      {/* ─── MAIN CONTENT: GRID CARDS OR TIMELINE PIPELINE ─────────────────── */}
      {viewMode === 'grid' ? (
        
        /* ── GRID LAYOUT ─────────────────────────────────────────────────── */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredList.map((item, idx) => {
            const currentUpvotes = upvotes[item.id] !== undefined ? upvotes[item.id] : item.upvotesCount;
            const isVoted = !!votedMap[item.id];

            return (
              <div 
                key={item.id}
                className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all duration-300 space-y-5 flex flex-col justify-between group relative overflow-hidden"
              >
                {/* Subtle Hover Gradient Accent Line */}
                <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />

                <div className="space-y-4">
                  
                  {/* Card Top Badges */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center space-x-2">
                      <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-indigo-900 text-white border border-indigo-950 font-mono shadow-sm">
                        {item.versionTarget}
                      </span>
                      <span className="px-2.5 py-1 rounded-xl text-2xs font-bold bg-amber-50 text-amber-800 border border-amber-200/70 flex items-center">
                        <Calendar className="w-3 h-3 mr-1 text-amber-600" />
                        {item.targetDate}
                      </span>
                    </div>

                    {getStatusBadge(item.status)}
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1.5">
                    <div className="flex items-center space-x-2">
                      <div className="p-1.5 rounded-xl bg-slate-100 group-hover:bg-indigo-50 transition-colors">
                        {getCategoryIcon(item.category)}
                      </div>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 group-hover:text-indigo-900 transition-colors leading-snug">
                        {item.title}
                      </h3>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed pt-1">
                      {item.description}
                    </p>
                  </div>

                  {/* Planned Features List Box */}
                  <div className="bg-slate-50/80 p-4 rounded-2xl border border-slate-200/70 space-y-2.5">
                    <span className="text-3xs font-extrabold uppercase tracking-wider text-slate-400 block">
                      📋 Fitur Utama yang Direncanakan:
                    </span>
                    <div className="space-y-2">
                      {item.featuresPlanned.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-start space-x-2.5 text-xs text-slate-700">
                          <div className="w-4 h-4 rounded-md bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          </div>
                          <span className="font-semibold leading-tight">{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                </div>

                {/* Card Footer Action */}
                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-2xs font-bold px-3 py-1 rounded-xl bg-slate-100 text-slate-700 uppercase tracking-wider border border-slate-200/60">
                    {item.category}
                  </span>

                  <button
                    type="button"
                    onClick={() => handleUpvote(item.id, item.upvotesCount)}
                    className={`px-4 py-2 rounded-2xl text-xs font-bold transition-all duration-200 flex items-center space-x-2 shadow-xs border ${
                      isVoted
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white border-emerald-600 shadow-emerald-500/20 scale-105'
                        : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50 hover:border-indigo-300'
                    }`}
                  >
                    <ThumbsUp className={`w-4 h-4 ${isVoted ? 'fill-white' : 'text-indigo-600'}`} />
                    <span>{isVoted ? 'Didukung!' : 'Dukung Fitur Ini'}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-2xs font-mono font-black ${
                      isVoted ? 'bg-white/20 text-white' : 'bg-indigo-100 text-indigo-900'
                    }`}>
                      {currentUpvotes}
                    </span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* ── TIMELINE EXECUTIVE PIPELINE LAYOUT ───────────────────────────── */
        <div className="relative pl-6 sm:pl-10 space-y-8 before:absolute before:left-3 sm:before:left-5 before:top-3 before:bottom-3 before:w-1 before:bg-gradient-to-b before:from-indigo-600 before:via-purple-500 before:to-amber-500 before:rounded-full">
          {filteredList.map((item, idx) => {
            const currentUpvotes = upvotes[item.id] !== undefined ? upvotes[item.id] : item.upvotesCount;
            const isVoted = !!votedMap[item.id];

            return (
              <div key={item.id} className="relative group">
                
                {/* Glowing Node Marker */}
                <div className="absolute -left-6 sm:-left-10 top-6 w-6 h-6 rounded-full bg-white border-4 border-indigo-600 group-hover:border-amber-500 transition-colors shadow-md flex items-center justify-center -translate-x-1/2">
                  <div className="w-2 h-2 rounded-full bg-indigo-600 group-hover:bg-amber-500 transition-colors" />
                </div>

                <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm hover:shadow-xl transition-all duration-300 space-y-4">
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center space-x-3">
                      <span className="px-3.5 py-1 rounded-xl text-xs font-black bg-indigo-900 text-white font-mono shadow-xs">
                        {item.versionTarget}
                      </span>
                      <h3 className="text-lg font-black text-slate-900">
                        {item.title}
                      </h3>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className="text-xs font-bold text-slate-500 flex items-center bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                        <Calendar className="w-3.5 h-3.5 mr-1.5 text-slate-400" />
                        Target: {item.targetDate}
                      </span>
                      {getStatusBadge(item.status)}
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {item.description}
                  </p>

                  {/* Planned Checklist */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
                    {item.featuresPlanned.map((feat, fIdx) => (
                      <div key={fIdx} className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 flex items-start space-x-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="text-xs font-semibold text-slate-800 leading-tight">{feat}</span>
                      </div>
                    ))}
                  </div>

                  <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                    <span className="text-2xs font-bold text-slate-400 uppercase tracking-wider">
                      Kategori: {item.category}
                    </span>

                    <button
                      type="button"
                      onClick={() => handleUpvote(item.id, item.upvotesCount)}
                      className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 border ${
                        isVoted
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-white text-indigo-900 border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      <ThumbsUp className="w-3.5 h-3.5" />
                      <span>{isVoted ? 'Didukung' : 'Dukung'} ({currentUpvotes})</span>
                    </button>
                  </div>

                </div>

              </div>
            );
          })}
        </div>

      )}

    </div>
  );
};
