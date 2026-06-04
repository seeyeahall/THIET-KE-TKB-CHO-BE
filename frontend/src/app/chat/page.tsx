'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send, Sparkles, User, Mic, Volume2, VolumeX } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { api } from '@/lib/api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function ChatPage() {
  const router = useRouter();
  const { selectedChild } = useAppStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isSecure, setIsSecure] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSecure(window.isSecureContext);
    }
  }, []);

  useEffect(() => {
    if (!selectedChild) {
      router.push('/select-child');
      return;
    }
    // Welcome message
    setMessages([
      {
        role: 'assistant',
        content: `Chào ${selectedChild.name}! Hôm nay con muốn tìm hiểu điều gì? 🔬🎨🌱`,
      },
    ]);
  }, [selectedChild, router]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const speak = (text: string) => {
    if (isMuted || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'vi-VN';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const startListening = () => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Trình duyệt của bạn không hỗ trợ nhận diện giọng nói!");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    
    // Watchdog timer to prevent hanging in "listening" state on some test/headless environments
    let safetyTimer = setTimeout(() => {
      console.warn('Speech recognition safety timeout triggered.');
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
      setInput((prev) => (prev ? prev + ' ' + transcript : transcript));
    };

    recognition.onend = () => {
      clearTimeout(safetyTimer);
      setIsListening(false);
    };

    recognition.onerror = (e: any) => {
      clearTimeout(safetyTimer);
      console.error('Speech recognition error', e);
      alert('Lỗi nhận diện giọng nói: ' + (e.error || 'không rõ') + '. Vui lòng kiểm tra quyền micro hoặc kết nối HTTPS.');
      setIsListening(false);
    };

    try {
      recognition.start();
    } catch (err) {
      clearTimeout(safetyTimer);
      setIsListening(false);
    }
  };

  const send = async () => {
    if (!input.trim() || !selectedChild || sending) return;
    const userMsg = input.trim();
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: userMsg }]);
    setSending(true);

    try {
      const result = await api.sendChat(selectedChild.id, userMsg);
      setMessages((m) => [...m, { role: 'assistant', content: result.reply }]);
      speak(result.reply);
    } catch {
      const errorMsg = 'Xin lỗi, AI đang nghỉ tí. Con thử lại sau nhé! 😅';
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: errorMsg },
      ]);
      speak(errorMsg);
    } finally {
      setSending(false);
    }
  };

  if (!selectedChild) return null;

  return (
    <main
      className="flex flex-col"
      style={{ height: 'calc(100dvh - var(--nav-height, 4rem) - env(safe-area-inset-bottom, 0px))' }}
    >
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3">
        <div className="bg-kid-orange text-white w-10 h-10 rounded-full flex items-center justify-center">
          <Sparkles size={20} />
        </div>
        <div className="flex-1">
          <h2 className="font-black text-gray-800">AI Companion</h2>
          <p className="text-xs font-bold text-gray-400">Luôn sẵn sàng trò chuyện</p>
        </div>
        <button
          onClick={() => {
            if (!isMuted) window.speechSynthesis?.cancel();
            setIsMuted(!isMuted);
          }}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isMuted ? 'bg-gray-100 text-gray-400' : 'bg-kid-green/10 text-kid-green'
          }`}
        >
          {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                msg.role === 'user'
                  ? 'bg-kid-yellow text-kid-orange'
                  : 'bg-kid-blue text-white'
              }`}
            >
              {msg.role === 'user' ? (
                <User size={14} />
              ) : (
                <Sparkles size={14} />
              )}
            </div>
            <div
              className={`max-w-[75%] px-4 py-3 rounded-2xl text-sm font-bold leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-kid-yellow text-kid-orange rounded-br-md'
                  : 'bg-gray-100 text-gray-700 rounded-bl-md'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex gap-2">
            <div className="w-8 h-8 rounded-full bg-kid-blue text-white flex items-center justify-center">
              <Sparkles size={14} />
            </div>
            <div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-100 p-4 flex-shrink-0">
        <div className="max-w-lg mx-auto">
          <div className="flex gap-2">
            <button
              onClick={startListening}
              className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${
                isListening
                  ? 'bg-red-500 text-white animate-pulse'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
              }`}
            >
              <Mic size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Nhắn tin cho AI..."
              className="flex-1 bg-gray-100 rounded-2xl px-4 py-3 text-sm font-bold text-gray-700 focus:outline-none focus:ring-2 focus:ring-kid-yellow/50 min-w-0"
            />
            <button
              onClick={send}
              disabled={sending || !input.trim()}
              className="bg-kid-orange text-white w-12 h-12 rounded-2xl flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-50"
            >
              <Send size={18} />
            </button>
          </div>
          {!isSecure && (
            <p className="text-[10px] text-red-500 font-bold text-center mt-1">
              ⚠️ Ghi âm giọng nói yêu cầu kết nối bảo mật HTTPS (hoặc localhost)
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
