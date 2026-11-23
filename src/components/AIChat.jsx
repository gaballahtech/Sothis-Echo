import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { useActiveSection } from '../utils/useActiveSection';
import { localized } from '../data/localized';
import { API_BASE } from '../services/sarApi';

/**
 * Lightweight, dependency-free markdown renderer for chat messages.
 * Supports: **bold**, `code`, - bullets, 1. numbered lists, paragraphs.
 * Renders to React elements (no dangerouslySetInnerHTML) to stay XSS-safe.
 */
function renderInline(text) {
  const parts = [];
  const regex = /(\*\*[^*]+\*\*|`[^`]+`)/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) parts.push(text.slice(lastIndex, match.index));
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(<strong key={`b${match.index}`}>{token.slice(2, -2)}</strong>);
    } else {
      parts.push(<code key={`c${match.index}`}>{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts.length ? parts : [text];
}

function MarkdownText({ text }) {
  const blocks = String(text).split(/\n\n+/);
  return blocks.map((block, i) => {
    const lines = block.split('\n').filter((l) => l.trim());
    if (!lines.length) return null;
    const isUl = lines.every((l) => /^[-*]\s+/.test(l));
    const isOl = lines.every((l) => /^\d+\.\s+/.test(l));
    if (isUl) {
      return (
        <ul key={i} className="ai-chat-md-ul">
          {lines.map((l, j) => <li key={j}>{renderInline(l.replace(/^[-*]\s+/, ''))}</li>)}
        </ul>
      );
    }
    if (isOl) {
      return (
        <ol key={i} className="ai-chat-md-ol">
          {lines.map((l, j) => <li key={j}>{renderInline(l.replace(/^\d+\.\s+/, ''))}</li>)}
        </ol>
      );
    }
    return <p key={i} className="ai-chat-md-p">{renderInline(block)}</p>;
  });
}

const SECTION_IDS = [
  'home', 'demo', 'mission', 'see-through', 'sites', 'atlas', 'lenses',
  'explain', 'rapid-response', 'sound', 'timeseries', 'recovery', 'game', 'data', 'team',
];

const SUGGESTIONS = {
  en: [
    'What changed here?',
    'Why did the backscatter change?',
    'What does the coherence map show?',
    'How much of the area changed?',
    'Compare this to the other site',
  ],
  ar: [
    'إيه اللي اتغيّر هنا؟',
    'ليه الارتداد اتغيّر؟',
    'الـ coherence مبيّن إيه؟',
    'إيه نسبة التغيّر؟',
    'قارن بالموقع التاني',
  ],
};

export default function AIChat() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { selectedSiteId, sites } = useSiteData();
  const activeSection = useActiveSection(SECTION_IDS);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState('learner');
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const lastRef = useRef(null);

  const site = useMemo(
    () => sites.find((item) => item.id === selectedSiteId) || null,
    [sites, selectedSiteId],
  );

  useEffect(() => {
    if (open && inputRef.current) inputRef.current.focus();
  }, [open]);

  useEffect(() => {
    if (lastRef.current) lastRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open]);

  // Open the chat pre-focused on a question (used by "Ask the radar" shortcut).
  useEffect(() => {
    const handler = (e) => {
      const prefill = e?.detail?.question;
      setOpen(true);
      if (typeof prefill === 'string' && prefill.trim()) {
        setInput(prefill);
      }
    };
    window.addEventListener('sothis:ask', handler);
    return () => window.removeEventListener('sothis:ask', handler);
  }, []);

  const send = async (text) => {
    const question = (text ?? input).trim();
    if (!question || loading) return;
    const lang = language;
    const history = messages.slice(-6).map((m) => ({ role: m.role, text: m.text }));
    setMessages((m) => [...m, { role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question, lang, site: selectedSiteId, mode, history,
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      const answer = data?.data?.answer;
      const sources = Array.isArray(data?.data?.sources) ? data.data.sources : [];
      if (answer) {
        setMessages((m) => [...m, { role: 'assistant', text: answer, sources }]);
      } else {
        setMessages((m) => [...m, { role: 'assistant', text: t('aiChat.fallback') }]);
      }
    } catch {
      setMessages((m) => [...m, { role: 'assistant', text: t('aiChat.error') }]);
    } finally {
      setLoading(false);
    }
  };

  const jumpTo = (sectionId) => {
    const el = document.getElementById(sectionId);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const sourceSection = (id) => {
    if (id === 'amp' || id === 'change') return 'lenses';
    if (id === 'coh') return 'lenses';
    return 'lenses';
  };

  const suggestions = SUGGESTIONS[language] || SUGGESTIONS.en;
  const siteName = site ? localized(site.name, language) : t('aiChat.generalContext');

  return (
    <div className="ai-chat-root">
      {!open ? (
        <button
          className="ai-chat-toggle"
          onClick={() => setOpen(true)}
          aria-label={t('aiChat.open')}
          title={t('aiChat.open')}
        >
          {t('aiChat.title')}
        </button>
      ) : (
        <div className="ai-chat-panel" ref={panelRef} role="dialog" aria-label={t('aiChat.title')}>
          <div className="ai-chat-head">
            <span className="ai-chat-head-title">{t('aiChat.title')}</span>
            <div className="ai-chat-head-actions">
              <div className="ai-chat-mode" role="group" aria-label={t('aiChat.modeLabel')}>
                <button
                  type="button"
                  className={`ai-chat-mode-btn${mode === 'learner' ? ' is-active' : ''}`}
                  onClick={() => setMode('learner')}
                  aria-pressed={mode === 'learner'}
                >
                  {t('aiChat.modeLearner')}
                </button>
                <button
                  type="button"
                  className={`ai-chat-mode-btn${mode === 'researcher' ? ' is-active' : ''}`}
                  onClick={() => setMode('researcher')}
                  aria-pressed={mode === 'researcher'}
                >
                  {t('aiChat.modeResearcher')}
                </button>
              </div>
              <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label={t('common.close')}>
                &times;
              </button>
            </div>
          </div>

          <div className="ai-chat-context" aria-live="polite">
            <span className="ai-chat-context-dot" aria-hidden="true" />
            {t('aiChat.contextLabel')} {siteName}
          </div>

          <div className="ai-chat-body">
            {messages.length === 0 && (
              <div className="ai-chat-suggestions">
                <p className="ai-chat-hint">{t('aiChat.hint')}</p>
                {suggestions.map((s) => (
                  <button
                    key={s}
                    className="ai-chat-suggestion"
                    onClick={() => send(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`ai-chat-msg ai-chat-msg-${msg.role}`}
              >
                {msg.role === 'assistant' ? <MarkdownText text={msg.text} /> : msg.text}
                {msg.role === 'assistant' && msg.sources?.length > 0 && (
                  <div className="ai-chat-sources">
                    {msg.sources.map((src) => (
                      <button
                        key={src.id}
                        type="button"
                        className="ai-chat-source"
                        onClick={() => jumpTo(sourceSection(src.id))}
                        title={t('aiChat.sourceLabel')}
                      >
                        {src.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="ai-chat-msg ai-chat-msg-assistant ai-chat-loading">
                <span className="ai-chat-dot" />
                <span className="ai-chat-dot" />
                <span className="ai-chat-dot" />
              </div>
            )}
            <div ref={lastRef} />
          </div>
          <div className="ai-chat-input-row">
            <input
              ref={inputRef}
              className="ai-chat-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t('aiChat.placeholder')}
              aria-label={t('aiChat.inputLabel')}
            />
            <button
              className="ai-chat-send"
              onClick={() => send()}
              disabled={loading || !input.trim()}
              aria-label={t('aiChat.send')}
              title={t('aiChat.send')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="22" y1="2" x2="11" y2="13" />
                <polygon points="22 2 15 22 11 13 2 9 22 2" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}