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

  const content = (
    <div className="term-pop" dir={language === 'ar' ? 'rtl' : 'ltr'} onClick={(e) => e.stopPropagation()}>
      <div className="term-pop-name">{name}</div>
      <p className="term-pop-def">{def}</p>
      {language !== 'en' ? <div className="term-pop-original">EN: {entry.en}</div> : null}
      {entry.url ? (
        <a className="term-pop-source" href={entry.url} target="_blank" rel="noopener noreferrer">
          {t('glossary.source')}: {entry.label || name}
        </a>
      ) : null}
    </div>
  );

  return (
    <Popover
      interactionKind="click"
      position={Position.BOTTOM}
      boundary="viewport"
      portalClassName="term-pop-portal"
      content={content}
    >
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