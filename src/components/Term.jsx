import { Popover, Position } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { GLOSSARY } from '../data/glossary';

/**
 * Inline technical term. Renders a dotted-underlined button; clicking opens a
 * small popover with a plain definition (in the active language) and a
 * "Translate with Google" link. Terms come from the curated data/glossary.js.
 */
export default function Term({ id, children }) {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const entry = GLOSSARY[id];
  if (!entry) return <>{children}</>;

  const name = entry[language] || entry.en;
  const def = entry.def?.[language] || entry.def?.en || '';
  const target = language === 'ar' ? 'ar' : 'en';
  const googleUrl = `https://translate.google.com/?sl=auto&tl=${target}&text=${encodeURIComponent(`${name} — ${def}`)}&op=translate`;

  const content = (
    <div className="term-pop" dir={language === 'ar' ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
      <div className="term-pop-name">{name}</div>
      <p className="term-pop-def">{def}</p>
      <div className="term-pop-links">
        {entry.url ? (
          <a className="term-pop-source" href={entry.url} target="_blank" rel="noopener noreferrer">
            {t('glossary.source')}: {entry.label || name}
          </a>
        ) : null}
        <a className="term-pop-google" href={googleUrl} target="_blank" rel="noopener noreferrer">
          <span aria-hidden="true">🌐</span> {t('glossary.translate')}
        </a>
      </div>
    </div>
  );

  return (
    <Popover interactionKind="click" position={Position.BOTTOM} boundary="viewport" content={content}>
      <button
        type="button"
        className="term"
        aria-haspopup="dialog"
        aria-label={`${t('glossary.about')} ${name}`}
      >
        {children ?? name}
      </button>
    </Popover>
  );
}