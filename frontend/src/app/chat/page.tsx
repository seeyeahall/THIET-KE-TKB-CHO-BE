'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Mic, Volume2, VolumeX, RefreshCw, Zap } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

const QUICK_QUESTIONS = [
  '🌟 Hôm nay mình làm gì vui?',
  '🎯 Gợi ý hoạt động cho mình',
  '📅 Đặt lịch giúp mình nhé!',
  '🍥 Naruto kể chuyện đi!',
];

const NARUTO_AVATAR = () => (
  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-yellow-400 flex items-center justify-center text-lg flex-shrink-0 shadow-md">
    🍥
  </div>
);

export default function ChatPage() {
  const router = useRouter();
  const { selectedChild } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.isSecureContext);
    }
  }, []);

  // Load lịch sử chat từ DB khi mở trang
  useEffect(() => {
    if (!selectedChild) {
      router.push('/select-child');
      return;
    }

    const loadHistory = async () => {
      setHistoryLoading(true);
      try {
        const history = await api.getChatHistory(selectedChild.id, 20);
        if (history.length > 0) {
          setMessages(history.map(h => ({
            id: h.id,
            role: h.role,
            content: h.message,
            created_at: h.created_at,
          })));
        } else {
          // Tin nhắn chào đầu tiên từ Naruto
          setMessages([{
            role: 'assistant',
            content: `Dattebayo! 🍥 Chào ${selectedChild.name}! Mình là Naruto — ninja mạnh nhất và là bạn đồng hành của bạn! Hôm nay chúng ta cùng lên kế hoạch phiêu lưu gì nào? ⚡`,
          }]);
        }
      } catch {
        // Fallback khi backend offline hoặc chưa có history
        setMessages([{
          role: 'assistant',
          content: `Dattebayo! 🍥 Chào ${selectedChild.name}! Mình là Naruto — ninja bạn đồng hành của bạn! Hôm nay bạn muốn làm gì nào? ⚡`,
        }]);
      } finally {
        setHistoryLoading(false);
      }
    };

    loadHistory();
  }, [selectedChild, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = useCallback((text: string) => {
    if (isMuted || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.05;
    utterance.pitch = 1.1;
    window.speechSynthesis.speak(utterance);
  }, [isMuted]);

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!');
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;

    let safetyTimer = setTimeout(() => {
      recognition.stop();
      setIsListening(false);
    }, 8000);

    recognition.onstart = () => {
      setIsListening(true);
      clearTimeout(safetyTimer);
      safetyTimer = setTimeout(() => {
        recognition.stop();
        setIsListening(false);
      }, 10000);
    };

    recognition.onresult = (event: any) => {
      clearTimeout(safetyTimer);
      const transcript = event.results[0][0].transcript;
      setInput(prev => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onend = () => {
      clearTimeout(safetyTimer);
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      clearTimeout(safetyTimer);
      console.error('Speech recognition error', e);
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const send = async (messageText?: string) => {
    const userMsg = (messageText ?? input).trim();
    if (!userMsg || !selectedChild || sending) return;
    setInput('');
    setMessages(m => [...m, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const result = await api.sendChat(selectedChild.id, userMsg);
      setMessages(m => [...m, { role: 'assistant', content: result.reply }]);
      speak(result.reply);
    } catch {
      const errorMsg = `Xin lỗi ${selectedChild.name}, mình đang nạp chakra lại! 😅 Thử lại sau nhé!`;
      setMessages(m => [...m, { role: 'assistant', content: errorMsg }]);
    } finally {
      setSending(false);
    }
  };

  if (!selectedChild) return null;

  return (
    <main
      className="flex flex-col bg-gradient-to-b from-orange-50 to-yellow-50"
      style={{ height: 'calc(100dvh - var(--nav-height, 4rem) - env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Header — Naruto style */}
      <div className="bg-gradient-to-r from-orange-500 to-yellow-400 px-5 py-4 flex items-center gap-3 shadow-lg">
        <div className="w-11 h-11 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl shadow-inner border-2 border-white/40">
          🍥
        </div>
        <div className="flex-1">
          <h2 className="font-black text-white text-base leading-tight">Naruto</h2>
          <p className="text-xs font-bold text-orange-100">Ninja bạn đồng hành của {selectedChild.name} ⚡</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => {
              if (!isMuted) window.speechSynthesis?.cancel();
              setIsMuted(!isMuted);
            }}
            className="w-9 h-9 rounded-full bg-white/20 text-white flex items-center justify-center hover:bg-white/30 transition-colors"
            title={isMuted ? 'Bật âm thanh' : 'Tắt âm thanh'}
          >
            {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
          </button>
        </div>
      </div>

      {/* Quick Questions */}
      <div className="flex gap-2 px-4 py-2.5 overflow-x-auto scrollbar-hide flex-shrink-0">
        {QUICK_QUESTIONS.map(q => (
          <button
            key={q}
            onClick={() => send(q.replace(/^[^\s]+\s/, ''))}
            disabled={sending}
            className="flex-shrink-0 text-xs font-bold px-3 py-1.5 bg-white rounded-full border-2 border-orange-200 text-orange-600 hover:border-orange-400 hover:bg-orange-50 active:scale-95 transition-all shadow-sm disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-2 space-y-3">
        {historyLoading ? (
          <div className="flex justify-center py-8">
            <div className="flex gap-1 items-center text-orange-400">
              <RefreshCw size={16} className="animate-spin" />
              <span className="text-sm font-bold">Đang tải lịch sử...</span>
            </div>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={msg.id ?? i}
              className={`flex gap-2 items-end ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {msg.role === 'assistant' && <NARUTO_AVATAR />}
              {msg.role === 'user' && (
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0 shadow-md"
                  style={{ background: `hsl(${selectedChild.id.split('').reduce((h, c) => h + c.charCodeAt(0), 0) % 360}, 70%, 60%)` }}
                >
                  {selectedChild.name[0].toUpperCase()}
                </div>
              )}
              <div
                className={`max-w-[78%] px-4 py-3 rounded-2xl text-sm font-bold leading-relaxed shadow-sm ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-br from-orange-400 to-yellow-400 text-white rounded-br-sm'
                    : 'bg-white text-gray-700 rounded-bl-sm border border-orange-100'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))
        )}

        {/* Typing indicator */}
        {sending && (
          <div className="flex gap-2 items-end">
            <NARUTO_AVATAR />
            <div className="bg-white border border-orange-100 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm">
              <div className="flex gap-1.5 items-center">
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-orange-400 animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="text-xs text-orange-400 font-bold ml-1">Naruto đang nghĩ...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} className="h-2" />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-orange-100 px-4 py-3 flex-shrink-0">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2 items-center">
            <button
              onClick={startListening}
              className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-all flex-shrink-0 ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse scale-110 shadow-lg'
                  : 'bg-orange-100 text-orange-500 hover:bg-orange-200'
              }`}
              title="Nói chuyện với Naruto"
            >
              <Mic size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
              placeholder={`Nhắn tin cho Naruto...`}
              className="flex-1 bg-orange-50 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 placeholder-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-300/60 min-w-0 border border-orange-100"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="bg-gradient-to-br from-orange-500 to-yellow-400 text-white w-11 h-11 rounded-2xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform disabled:opacity-50 flex-shrink-0 shadow-md"
            >
              {sending ? <Zap size={18} className="animate-pulse" /> : <Send size={18} />}
            </button>
          </div>
          {!isSecure && (
            <p className="text-[10px] text-orange-400 font-bold text-center mt-1.5">
              ⚠️ Ghi âm giọng nói yêu cầu kết nối HTTPS (hoặc localhost)
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
