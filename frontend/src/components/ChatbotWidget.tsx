import React, { useState, useEffect, useRef } from 'react';
import { MessageSquare, Send, X, Bot, HelpCircle } from 'lucide-react';

interface Message {
  sender: 'user' | 'bot';
  text: string;
  time: string;
}

interface ChatbotWidgetProps {
  token: string | null;
}

export function ChatbotWidget({ token }: ChatbotWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "I’m **BhuSetu Sahayak**, your friendly, read-only guide to the BhuSetu Land Records system.\n\n" +
            "I can help you look up **parcel owner shares**, check **litigation status**, or define concepts like **RoR, Mutation, GIS, and Khatauni**.\n\n" +
            "How can I assist you today?",
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages window
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || !token) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    // Add user message
    const userMsg: Message = { sender: 'user', text: textToSend, time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ message: textToSend })
      });

      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: data.response,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      } else {
        setMessages(prev => [...prev, {
          sender: 'bot',
          text: "I'm sorry, I'm having trouble connecting to the verification database right now.",
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }]);
      }
    } catch (e) {
      setMessages(prev => [...prev, {
        sender: 'bot',
        text: "Connection failed. Please ensure the backend server is running.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }]);
    } finally {
      setLoading(false);
    }
  };

  // Helper formatter to convert markdown bold/bullets to React elements safely
  const formatMessageText = (text: string) => {
    return text.split('\n').map((line, i) => {
      let processed = line;
      
      const isBullet = processed.startsWith('* ') || processed.startsWith('- ');
      if (isBullet) {
        processed = processed.substring(2);
      }

      // Format bold text (**word**)
      const parts = processed.split('**');
      const content = parts.map((part, j) => {
        if (j % 2 === 1) {
          return <strong key={j} className="font-bold text-slate-900">{part}</strong>;
        }
        return part;
      });

      if (isBullet) {
        return (
          <li key={i} className="list-disc ml-4 my-0.5 pl-0.5 text-slate-700">
            {content}
          </li>
        );
      }

      return (
        <p key={i} className="my-1 leading-relaxed text-slate-700">
          {content}
        </p>
      );
    });
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage(input);
    }
  };

  const presetQueries = [
    { label: '🔍 Khasra 142/3', text: 'Tell me about parcel 142/3' },
    { label: '❓ What is Mutation?', text: 'What is mutation?' },
    { label: '🗺️ What is GIS?', text: 'What is GIS mapping?' }
  ];

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col items-end">
      
      {/* CHAT WINDOW DRAW PANEL */}
      {isOpen && (
        <div className="w-[360px] h-[480px] bg-white border border-slate-200 rounded-xl shadow-2xl overflow-hidden mb-4 flex flex-col animate-slide-up">
          
          {/* Header */}
          <div className="bg-slate-900 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-slate-800 rounded text-sm">🤖</span>
              <div>
                <h3 className="font-bold text-xs tracking-wide">BhuSetu Sahayak</h3>
                <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider block">
                  Virtual Assistant
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-white transition-colors"
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages list */}
          <div className="flex-1 overflow-y-auto p-4 bg-slate-50 space-y-3 text-xs">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex flex-col max-w-[85%] ${
                  msg.sender === 'user' ? 'ml-auto items-end' : 'items-start'
                }`}
              >
                <div 
                  className={`p-3 rounded-lg border shadow-sm leading-relaxed ${
                    msg.sender === 'user' 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : 'bg-white border-slate-200 text-slate-800'
                  }`}
                >
                  {msg.sender === 'user' ? msg.text : formatMessageText(msg.text)}
                </div>
                <span className="text-[9px] text-slate-400 mt-1 font-mono">{msg.time}</span>
              </div>
            ))}
            
            {loading && (
              <div className="flex items-center gap-2 text-slate-400 italic">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-75"></span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce delay-150"></span>
                <span>Sahayak is thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Preset Chips */}
          <div className="px-3 py-2 bg-slate-100 border-t border-slate-200 flex gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {presetQueries.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q.text)}
                className="px-2 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full text-[10px] text-slate-600 font-semibold whitespace-nowrap transition-colors"
              >
                {q.label}
              </button>
            ))}
          </div>

          {/* Input field */}
          <div className="p-3 border-t border-slate-200 bg-white flex gap-2 shrink-0">
            <input
              type="text"
              placeholder="Ask Sahayak about plots or terms..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyPress}
              className="flex-1 border border-slate-200 rounded px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleSendMessage(input)}
              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
            >
              <Send size={14} />
            </button>
          </div>
        </div>
      )}

      {/* FLOATING ACTION ACTION BUBBLE */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-12 h-12 bg-slate-900 text-white hover:bg-slate-800 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 transform hover:scale-105"
      >
        {isOpen ? <X size={20} /> : <MessageSquare size={20} />}
      </button>

    </div>
  );
}
export default ChatbotWidget;
