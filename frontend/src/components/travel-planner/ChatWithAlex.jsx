/**
 * ChatWithAlex.jsx - Chat aislado para evitar re-renders masivos
 * OPTIMIZADO: Estado del chat completamente aislado del componente padre
 */

import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import ReactMarkdown from 'react-markdown';
import { Loader2, Send, MessageCircle, User, Bot } from 'lucide-react';
import { toast } from 'sonner';

const ChatWithAlex = memo(({ travelData, formData, user, API_URL, initialMessage }) => {
  // Estado del chat completamente aislado - NO causa re-renders del padre
  const [chatHistory, setChatHistory] = useState([]);
  const [chatMessage, setChatMessage] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const hasInitializedRef = useRef(false);

  // Inicializar el chat con el mensaje inicial (solo una vez)
  useEffect(() => {
    if (initialMessage && !hasInitializedRef.current) {
      setChatHistory([
        {
          role: 'user',
          parts: initialMessage.userMessage
        },
        {
          role: 'model',
          parts: initialMessage.modelMessage
        }
      ]);
      hasInitializedRef.current = true;
    }
  }, [initialMessage]);

  // Scroll automático al final del chat cuando hay nuevos mensajes
  useEffect(() => {
    if (chatContainerRef.current && messagesEndRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [chatHistory, chatLoading]);

  // Handler para enviar mensaje - memoizado para evitar re-renders
  const handleChatSend = useCallback(async () => {
    if (!chatMessage.trim() || !travelData) return;

    const userMessage = chatMessage.trim();
    setChatMessage('');
    setChatLoading(true);

    const newUserMessage = { role: 'user', parts: userMessage };
    setChatHistory(prev => [...prev, newUserMessage]);

    try {
      // Verify user is authenticated
      if (!user) {
        toast.error('Debes iniciar sesión para usar el chat.');
        setChatHistory(prev => prev.slice(0, -1));
        setChatLoading(false);
        return;
      }

      // Get Firebase ID token - required for backend authentication
      let authHeader = '';
      try {
        const token = await user.getIdToken();
        if (!token) {
          throw new Error('No se pudo obtener el token de autenticación');
        }
        authHeader = `Bearer ${token}`;
      } catch (tokenError) {
        console.error('Error al obtener token de Firebase:', tokenError);
        toast.error('Error al obtener token de autenticación. Por favor, cierra sesión y vuelve a iniciar sesión.');
        setChatHistory(prev => prev.slice(0, -1));
        setChatLoading(false);
        return;
      }
      
      // Build headers object
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': authHeader, // Always include since we verified user exists
      };
      
      const apiResponse = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          destination: formData.destination.trim(),
          date: formData.date_start && formData.date_end 
            ? `${formData.date_start} a ${formData.date_end}` 
            : formData.date_start || formData.date_end || '',
          budget: formData.budget || '',
          style: formData.style || '',
          message: userMessage,
          history: chatHistory
        }),
      });

      if (apiResponse.status === 401) {
        const errorData = await apiResponse.json().catch(() => ({ detail: 'Token de autorización requerido. Por favor, inicia sesión.' }));
        const errorMsg = errorData.detail || 'Token de autorización requerido. Por favor, inicia sesión.';
        toast.error(errorMsg);
        setChatHistory(prev => prev.slice(0, -1));
        setChatLoading(false);
        return;
      }

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({ detail: 'Error al consultar la IA' }));
        throw new Error(errorData.detail || 'Error al consultar la IA');
      }

      const data = await apiResponse.json();
      
      if (data.finish_reason && data.finish_reason !== 'STOP') {
        toast.warning('Nota: La respuesta fue cortada por límite de longitud.', {
          duration: 5000,
        });
      }
      
      const newModelMessage = { role: 'model', parts: data.gemini_response };
      setChatHistory(prev => [...prev, newModelMessage]);

    } catch (err) {
      const errorMsg = err.message || 'Error al enviar mensaje';
      toast.error(errorMsg);
      setChatHistory(prev => prev.slice(0, -1));
    } finally {
      setChatLoading(false);
    }
  }, [chatMessage, travelData, formData, user, chatHistory, API_URL]);

  // Handler para teclas - prevenir submit de form
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!chatLoading && chatMessage.trim()) {
        handleChatSend();
      }
    }
  }, [chatLoading, chatMessage, handleChatSend]);

  return (
    <section className="bg-white rounded-[24px] shadow-lg h-[600px] flex flex-col overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-200/50 flex-shrink-0">
        <MessageCircle className="w-5 h-5 text-slate-400" />
        <h3 className="text-xl font-semibold tracking-tight text-slate-900">Chat con Alex</h3>
      </div>

      {/* Área de mensajes con scroll */}
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3 bg-white min-h-0"
        style={{ scrollbarWidth: 'thin', msOverflowStyle: 'auto' }}
      >
        <style>{`
          div[style*="scrollbarWidth"]::-webkit-scrollbar {
            width: 6px;
          }
          div[style*="scrollbarWidth"]::-webkit-scrollbar-track {
            background: #f1f5f9;
            border-radius: 10px;
          }
          div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb {
            background: #cbd5e1;
            border-radius: 10px;
          }
          div[style*="scrollbarWidth"]::-webkit-scrollbar-thumb:hover {
            background: #94a3b8;
          }
        `}</style>
        {chatHistory.map((msg, index) => (
          <div
            key={index}
            className={`flex items-end gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'model' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E9E9EB] flex items-center justify-center">
                <Bot className="w-4 h-4 text-slate-600" />
              </div>
            )}
            
            <div
              className={`max-w-[75%] ${
                msg.role === 'user'
                  ? 'bg-[#007AFF] text-white rounded-2xl rounded-br-sm px-4 py-2.5'
                  : 'bg-[#E9E9EB] text-black rounded-2xl rounded-bl-sm px-4 py-2.5'
              }`}
            >
              {msg.role === 'model' ? (
                <div className="text-sm leading-relaxed text-black
                  [&>h1]:text-xl [&>h1]:font-bold [&>h1]:text-black [&>h1]:mt-3 [&>h1]:mb-2 [&>h1]:pb-1 [&>h1]:border-b [&>h1]:border-slate-300
                  [&>h2]:text-lg [&>h2]:font-bold [&>h2]:text-black [&>h2]:mt-3 [&>h2]:mb-2 [&>h2]:pb-1 [&>h2]:border-b [&>h2]:border-slate-300
                  [&>h3]:text-base [&>h3]:font-bold [&>h3]:text-black [&>h3]:mt-2 [&>h3]:mb-1
                  [&>p]:my-2 [&>p]:leading-relaxed [&>p]:text-black
                  [&>strong]:text-black [&>strong]:font-semibold
                  [&>em]:text-black [&>em]:italic
                  [&>ul]:my-2 [&>ul]:pl-4 [&>ul]:list-disc [&>ul]:space-y-1
                  [&>ol]:my-2 [&>ol]:pl-4 [&>ol]:list-decimal [&>ol]:space-y-1
                  [&>li]:leading-relaxed [&>li]:text-black
                  [&>a]:text-[#007AFF] [&>a]:no-underline [&>a]:font-medium hover:[&>a]:underline
                  [&>code]:text-[#007AFF] [&>code]:bg-blue-50 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-xs [&>code]:font-mono
                  [&>blockquote]:border-l-4 [&>blockquote]:border-blue-300 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-black [&>blockquote]:my-2
                  [&>hr]:border-slate-300 [&>hr]:my-3">
                  <ReactMarkdown>{msg.parts}</ReactMarkdown>
                </div>
              ) : (
                <div className="text-sm leading-relaxed whitespace-pre-wrap text-white">
                  {msg.parts}
                </div>
              )}
            </div>
            
            {msg.role === 'user' && (
              <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-300 flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}
        {chatLoading && (
          <div className="flex items-end gap-2 justify-start">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#E9E9EB] flex items-center justify-center">
              <Bot className="w-4 h-4 text-slate-600" />
            </div>
            <div className="bg-[#E9E9EB] text-black rounded-2xl rounded-bl-sm px-4 py-2.5">
              <Loader2 className="w-5 h-5 animate-spin text-[#007AFF]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input fijo abajo */}
      <div className="bg-white/80 backdrop-blur-md border-t border-slate-200/50 px-4 py-3 flex gap-2 flex-shrink-0">
        <input
          type="text"
          value={chatMessage}
          onChange={(e) => setChatMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Pregunta algo sobre tu viaje..."
          disabled={chatLoading}
          className="flex-1 px-5 py-3 
                     bg-[#F5F5F7] border-transparent rounded-full
                     focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500/20
                     disabled:bg-slate-100 disabled:cursor-not-allowed
                     text-base text-slate-900 placeholder-slate-400
                     transition-all duration-300"
        />
        <button
          type="button"
          onClick={handleChatSend}
          disabled={chatLoading || !chatMessage.trim()}
          className="w-12 h-12 
                     bg-[#007AFF] text-white rounded-full
                     hover:bg-[#0051D5] disabled:bg-slate-300 disabled:cursor-not-allowed
                     transition-all duration-300
                     flex items-center justify-center
                     active:scale-95 transition-transform"
        >
          {chatLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Send className="w-5 h-5" />
          )}
        </button>
      </div>
    </section>
  );
}, (prevProps, nextProps) => {
  // Solo re-renderizar si cambian las props relevantes (no el estado interno del chat)
  return prevProps.travelData?.gemini_response === nextProps.travelData?.gemini_response &&
         prevProps.formData.destination === nextProps.formData.destination &&
         prevProps.formData.date_start === nextProps.formData.date_start &&
         prevProps.formData.date_end === nextProps.formData.date_end &&
         prevProps.formData.budget === nextProps.formData.budget &&
         prevProps.formData.style === nextProps.formData.style;
});

ChatWithAlex.displayName = 'ChatWithAlex';

export default ChatWithAlex;

