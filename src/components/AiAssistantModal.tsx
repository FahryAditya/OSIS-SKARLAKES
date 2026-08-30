import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, 
  Bot, 
  X, 
  Send, 
  TrendingUp, 
  UserCheck, 
  Lightbulb, 
  MessageSquare, 
  Copy, 
  Check, 
  RefreshCw,
  CornerDownLeft
} from 'lucide-react';
import { 
  AiMessage, 
  defaultAiPrompts, 
  getAiAssistantResponse, 
  SystemStateData 
} from '../services/aiService';

interface AiAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemData: SystemStateData;
  apiKey?: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  isOpen,
  onClose,
  systemData,
  apiKey
}) => {
  const [messages, setMessages] = useState<AiMessage[]>([
    {
      id: 'm-init',
      sender: 'ai',
      text: `### 👋 Halo Pengurus **${systemData.config.shortName}**!

Saya adalah **OSIS AI Intelligence** — Asisten Pintar Organisasi yang terhubung *real-time* dengan data kas, presensi, & 10 Sekbid.

Pilih rekomendasi analisis di bawah ini atau ketik pertanyaan Anda!`,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (promptText: string, category?: string) => {
    if (!promptText.trim() || isLoading) return;

    const userMsgId = `m-${Date.now()}`;
    const userMsg: AiMessage = {
      id: userMsgId,
      sender: 'user',
      text: promptText,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      category
    };

    setMessages(prev => [...prev, userMsg]);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await getAiAssistantResponse(promptText, systemData, apiKey);
      const aiMsg: AiMessage = {
        id: `m-ai-${Date.now()}`,
        sender: 'ai',
        text: response.text,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        actionCard: response.actionCard
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `m-err-${Date.now()}`,
          sender: 'ai',
          text: 'Maaf, terjadi kendala saat merespon. Silakan coba lagi.',
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getIconComponent = (iconName: string) => {
    switch (iconName) {
      case 'TrendingUp': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'UserCheck': return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'Lightbulb': return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'MessageSquare': return <MessageSquare className="w-4 h-4 text-purple-600" />;
      default: return <Sparkles className="w-4 h-4 text-indigo-600" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      
      {/* AI Modal Drawer Card */}
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full h-[85vh] max-h-[680px] flex flex-col overflow-hidden border border-slate-200 my-auto animate-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="px-5 py-3.5 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white flex items-center justify-between shrink-0 border-b border-indigo-500/20">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-sm sm:text-base font-black tracking-tight">OSIS AI Intelligence</h2>
                <span className="px-2 py-0.5 rounded-full text-3xs font-extrabold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center space-x-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping mr-1"></span>
                  Active
                </span>
              </div>
              <p className="text-3xs text-slate-300">Asisten Cerdas Keuangan, Presensi, & Proker Sekbid</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 p-4 sm:p-5 overflow-y-auto space-y-4 bg-slate-50/50">
          
          {/* Quick Action Prompt Chips */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2">
            {defaultAiPrompts.map(p => (
              <button
                key={p.id}
                type="button"
                onClick={() => handleSendMessage(p.promptText, p.category)}
                className="p-2.5 bg-white hover:bg-indigo-50/80 border border-slate-200 hover:border-indigo-300 rounded-2xl text-left transition-all shadow-2xs group flex flex-col justify-between"
              >
                <div className="w-7 h-7 rounded-xl bg-slate-100 group-hover:bg-indigo-100 flex items-center justify-center mb-1.5 transition-colors">
                  {getIconComponent(p.iconName)}
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 group-hover:text-indigo-900 leading-snug">{p.title}</p>
                  <p className="text-3xs text-slate-500 line-clamp-1 mt-0.5">{p.subtitle}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Messages Thread */}
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
            >
              <div className="flex items-end space-x-2 max-w-[90%] sm:max-w-[85%]">
                {msg.sender === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center shrink-0 mb-1 shadow-2xs">
                    <Sparkles className="w-4 h-4" />
                  </div>
                )}

                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-2xs ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none font-medium'
                      : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'
                  }`}
                >
                  <div className="prose prose-xs max-w-none text-inherit space-y-2">
                    {msg.text.split('\n').map((line, idx) => {
                      if (line.startsWith('### ')) {
                        return <h3 key={idx} className="text-sm font-black text-indigo-900 border-b border-indigo-100 pb-1 mt-1 mb-2">{line.replace('### ', '')}</h3>;
                      }
                      if (line.startsWith('#### ')) {
                        return <h4 key={idx} className="text-xs font-bold text-indigo-800 mt-2 mb-1">{line.replace('#### ', '')}</h4>;
                      }
                      if (line.startsWith('* ')) {
                        return <li key={idx} className="ml-3 list-disc text-xs">{line.replace('* ', '')}</li>;
                      }
                      if (line.startsWith('1. ') || line.startsWith('2. ') || line.startsWith('3. ')) {
                        return <p key={idx} className="font-semibold text-xs text-slate-800 mt-1">{line}</p>;
                      }
                      return <p key={idx} className="text-xs">{line}</p>;
                    })}
                  </div>

                  {/* Action Card (e.g. WhatsApp Draft / Stat) */}
                  {msg.actionCard && (
                    <div className="mt-3 p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-2xs font-bold uppercase tracking-wider text-indigo-900">{msg.actionCard.title}</span>
                        {msg.actionCard.whatsappText && (
                          <button
                            type="button"
                            onClick={() => handleCopyText(msg.actionCard!.whatsappText!, msg.id)}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-3xs font-bold flex items-center space-x-1 transition-colors shadow-2xs"
                          >
                            {copiedId === msg.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedId === msg.id ? 'Tersalin!' : 'Salin Pesan WA'}</span>
                          </button>
                        )}
                      </div>
                      <p className="text-xs font-mono text-indigo-950 bg-white p-2 rounded-lg border border-indigo-100">
                        {msg.actionCard.content}
                      </p>
                    </div>
                  )}

                  <span className={`text-3xs block mt-1.5 text-right ${msg.sender === 'user' ? 'text-indigo-200' : 'text-slate-400'}`}>
                    {msg.timestamp}
                  </span>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center space-x-2 text-indigo-600 font-bold text-xs p-2">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>OSIS AI sedang menganalisis data...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputPrompt);
          }}
          className="p-3 sm:p-4 bg-white border-t border-slate-200 flex items-center space-x-2 shrink-0"
        >
          <input
            type="text"
            placeholder="Tanyakan analisis kas, presensi, proker, atau draf WA..."
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            disabled={isLoading}
            className="flex-1 px-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-xs sm:text-sm font-medium focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputPrompt.trim() || isLoading}
            className="p-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white rounded-2xl shadow-md transition-all shrink-0 flex items-center justify-center cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>
  );
};
