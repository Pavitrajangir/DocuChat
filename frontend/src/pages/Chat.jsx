import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import api, { API_BASE_URL } from '../api/axiosClient';

// Splits a raw streamed response into the plain answer text and the trailing
// __SOURCES__ / __ERROR__ marker, if present. The backend appends these after
// the natural-language answer finishes streaming (see chatController.js).
const splitStreamedPayload = (raw) => {
  const sourcesMarker = raw.indexOf('\n__SOURCES__');
  const errorMarker = raw.indexOf('\n__ERROR__');

  if (errorMarker !== -1) {
    return { text: raw.slice(0, errorMarker), sources: null, error: raw.slice(errorMarker + 10) };
  }
  if (sourcesMarker !== -1) {
    const text = raw.slice(0, sourcesMarker);
    try {
      const sources = JSON.parse(raw.slice(sourcesMarker + 12));
      return { text, sources, error: null };
    } catch {
      return { text, sources: null, error: null };
    }
  }
  return { text: raw, sources: null, error: null };
};

const MessageBubble = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className="max-w-lg">
        <div
          className={`rounded-sm px-4 py-2.5 text-sm ${
            isUser ? 'bg-sage text-ink' : 'bg-surface text-text border border-border'
          }`}
        >
          <p className="whitespace-pre-wrap">{message.content}</p>
        </div>

        {message.sources?.length > 0 && (
          <div className="mt-4 mb-2">
            <p className="catalog-number mb-2 pl-1">Evidence pulled</p>
            <div className="flex flex-wrap gap-3">
              {message.sources.map((s, i) => (
                <div key={i} className="evidence-card w-40">
                  <p className="line-clamp-4">{s.text}…</p>
                  <p className="mt-2 pt-1.5 border-t border-paper-ink/15 text-[10px] opacity-70">
                    excerpt #{s.chunkIndex} · match {(s.score * 100).toFixed(0)}%
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const Chat = () => {
  const { id } = useParams();
  const [title, setTitle] = useState('');
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const scrollRef = useRef(null);

  useEffect(() => {
    let ignore = false; // guards against a stale fetch resolving after newer state exists

    const fetchSession = async () => {
      const { data } = await api.get(`/chat/${id}`);
      if (!ignore) {
        setTitle(data.title);
        setMessages(data.messages);
        setLoading(false);
      }
    };
    fetchSession();

    return () => {
      ignore = true;
    };
  }, [id]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || streaming) return;

    const userMessage = { role: 'user', content: input };
    setMessages((prev) => [...prev, userMessage, { role: 'assistant', content: '' }]);
    setInput('');
    setStreaming(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_BASE_URL}/chat/${id}/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ message: userMessage.content }),
      });

      if (!response.ok || !response.body) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to get a response');
      }

      // Read the streamed response chunk by chunk and update the last
      // (assistant) message's content live, so tokens appear as they arrive
      // instead of waiting for the full answer.
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let rawAccumulated = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        rawAccumulated += decoder.decode(value, { stream: true });
        const { text, error: streamError } = splitStreamedPayload(rawAccumulated);

        if (streamError) {
          setError(streamError);
          break;
        }

        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: 'assistant', content: text };
          return updated;
        });
      }

      // Final parse to attach sources once the full stream (including the
      // trailing marker) has arrived.
      const { text: finalText, sources } = splitStreamedPayload(rawAccumulated);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = { role: 'assistant', content: finalText, sources };
        return updated;
      });
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setStreaming(false);
    }
  };

  if (loading) return <p className="text-center mt-10 text-text-muted font-mono text-sm">Opening the reading room…</p>;

  return (
    <div className="max-w-2xl mx-auto mt-6 px-4 flex flex-col h-[calc(100vh-100px)]">
      <p className="catalog-number mb-1">Reading Room</p>
      <h1 className="font-display text-2xl text-text mb-5 truncate">{title}</h1>

      <div className="flex-1 overflow-y-auto space-y-5 pb-4">
        {messages.length === 0 && (
          <div className="text-center mt-16">
            <p className="font-display text-lg text-text-muted mb-1">The room is quiet</p>
            <p className="text-sm text-text-muted">Ask a question about this document to begin.</p>
          </div>
        )}
        {messages.map((m, i) => (
          <MessageBubble key={i} message={m} />
        ))}
        <div ref={scrollRef} />
      </div>

      {error && <p className="text-red-400 text-sm mb-2 font-mono">{error}</p>}

      <form onSubmit={handleSend} className="flex gap-2 pb-6">
        <input
          className="flex-1 bg-surface border border-border rounded-sm px-3 py-2.5 text-sm text-text placeholder:text-text-muted/60 focus:border-brass outline-none"
          placeholder="Ask the stacks..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={streaming}
        />
        <button
          disabled={streaming || !input.trim()}
          className="bg-brass text-ink text-sm font-medium rounded-sm px-4 py-2.5 hover:bg-brass-light transition-colors disabled:opacity-50"
        >
          {streaming ? 'Searching…' : 'Ask'}
        </button>
      </form>
    </div>
  );
};

export default Chat;
