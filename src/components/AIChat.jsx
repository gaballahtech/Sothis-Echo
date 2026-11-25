import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { useCaseFile } from '../context/CaseFileContext';
import GlossaryText from './GlossaryText';
import { useActiveSection } from '../utils/useActiveSection';
import { localized } from '../data/localized';
import { API_BASE } from '../services/sarApi';
import { useTypewriter } from '../utils/useTypewriter';

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
    if (match.index > lastIndex) {
      parts.push(<GlossaryText key={`t${match.index}`} text={text.slice(lastIndex, match.index)} />);
    }
    const token = match[0];
    if (token.startsWith('**')) {
      parts.push(
        <strong key={`b${match.index}`}>
          <GlossaryText text={token.slice(2, -2)} />
        </strong>,
      );
    } else {
      parts.push(<code key={`c${match.index}`}>{token.slice(1, -1)}</code>);
    }
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push(<GlossaryText key={`t${lastIndex}`} text={text.slice(lastIndex)} />);
  }
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
    'Compare with another site',
  ],
  ar: [
    'إيه اللي اتغيّر هنا؟',
    'ليه الارتداد اتغيّر؟',
    'الـ coherence مبيّن إيه؟',
    'إيه نسبة التغيّر؟',
    'قارن بموقع آخر',
  ],
};

export default function AIChat() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { selectedSiteId, sites } = useSiteData();
  const { open: openCaseFile, setActiveSection, openSiteId, activeSection: caseSection } = useCaseFile();
  const activeSection = useActiveSection(SECTION_IDS);
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [streamingId, setStreamingId] = useState(null);
  const [reducedMotion] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
  const nextId = useRef(1);
  const panelRef = useRef(null);
  const inputRef = useRef(null);
  const lastRef = useRef(null);

  // Ground the assistant in the site the user is actually looking at: the open
  // case-file site (or the active compare pane) takes priority over the global
  // landing-page selection, so the answer always matches the visible scene.
  const activeSiteId = openSiteId ?? selectedSiteId;
  const site = useMemo(
    () => sites.find((item) => item.id === activeSiteId) || null,
    [sites, activeSiteId],
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
    const userId = nextId.current++;
    const assistantId = nextId.current++;
    setMessages((m) => [...m, { id: userId, role: 'user', text: question }]);
    setInput('');
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/ask`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question,
          lang,
          site: activeSiteId,
          section: caseSection,
          history,
        }),
        signal: AbortSignal.timeout(60000),
      });
      const data = await res.json();
      const answer = data?.data?.answer;
      const sources = Array.isArray(data?.data?.sources) ? data.data.sources : [];
      const text = answer || t('aiChat.fallback');
      setMessages((m) => [...m, { id: assistantId, role: 'assistant', text, sources: answer ? sources : [] }]);
      setStreamingId(assistantId);
    } catch {
      setMessages((m) => [...m, { id: assistantId, role: 'assistant', text: t('aiChat.error'), sources: [] }]);
      setStreamingId(assistantId);
    } finally {
      setLoading(false);
    }
  };

  const jumpTo = (sectionId) => {
    // Landing sections still scroll; per-site sections now live in the case file.
    const el = document.getElementById(sectionId);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (activeSiteId) {
      openCaseFile(activeSiteId);
      setActiveSection(sectionId === 'recovery' || sectionId === 'timeseries' || sectionId === 'sound' ? sectionId : 'lenses');
    }
  };

  const sourceSection = (id) => {
    if (id === 'amp' || id === 'change') return 'lenses';
    if (id === 'coh') return 'lenses';
    return 'lenses';
  };

  const suggestions = SUGGESTIONS[language] || SUGGESTIONS.en;
  const siteName = site ? localized(site.name, language) : t('aiChat.generalContext');

  // Progressively reveal the newest assistant answer (typewriter). The full text
  // is already in `streamingMsg.text`; we only animate how fast it is shown.
  const streamingMsg = streamingId != null ? messages.find((m) => m.id === streamingId) : null;
  const { displayed, isTyping, skip } = useTypewriter(streamingMsg?.text ?? '', {
    speed: 15,
    enabled: !reducedMotion && Boolean(streamingMsg),
  });

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
              <button className="ai-chat-close" onClick={() => setOpen(false)} aria-label={t('common.close')}>
                &times;
              </button>
            </div>
          </div>

          <div className="ai-chat-body" role="log" aria-label={t('aiChat.title')}>
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
            {messages.map((msg, i) => {
              const isStreaming = msg.id === streamingId && isTyping;
              const body = msg.id === streamingId ? displayed : msg.text;
              return (
                <div
                  key={msg.id ?? i}
                  className={`ai-chat-msg ai-chat-msg-${msg.role}`}
                  aria-busy={isStreaming || undefined}
                >
                  {msg.role === 'assistant' ? <MarkdownText text={body} /> : body}
                  {isStreaming ? <span className="ai-chat-caret" aria-hidden="true" /> : null}
                  {msg.role === 'assistant' && msg.sources?.length > 0 && (
                    <div className="ai-chat-sources">
                      <span className="ai-chat-sources-label">{t('aiChat.sourcesLabel')}:</span>
                      {msg.sources.slice(0, 3).map((src) =>
                        src.url ? (
                          <a
                            key={src.id}
                            className="ai-chat-source"
                            href={src.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t('aiChat.sourceLabel')}
                          >
                            {src.label}
                          </a>
                        ) : (
                          <button
                            key={src.id}
                            type="button"
                            className="ai-chat-source"
                            onClick={() => jumpTo(src.section || sourceSection(src.id))}
                            title={t('aiChat.sourceLabel')}
                          >
                            {src.label}
                          </button>
                        ),
                      )}
                    </div>
                  )}
                </div>
              );
            })}
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
            <textarea
              ref={inputRef}
              className="ai-chat-input"
              value={input}
              rows={1}
              onChange={(e) => {
                setInput(e.target.value);
                const el = e.target;
                el.style.height = 'auto';
                el.style.height = `${Math.min(el.scrollHeight, 72)}px`;
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder={t('aiChat.placeholder')}
              aria-label={t('aiChat.inputLabel')}
            />
            {isTyping ? (
              <button type="button" className="ai-chat-skip" onClick={skip} aria-label={t('aiChat.skip')}>
                {t('aiChat.skip')}
              </button>
            ) : null}
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
          <div className="sr-only" role="status" aria-live="polite">
            {isTyping ? t('aiChat.responding') : ''}
          </div>
        </div>
      )}
    </div>
  );
}