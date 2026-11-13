import { useMemo, useState } from 'react';
import { Button, Callout, Icon, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { buildDetectiveEvidence, detectiveRounds } from '../data/quiz';
import { SceneCanvas } from './SceneCanvas';
import { Meter, Panel, SectionHead } from './ui';

export default function Detective() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const L = (value) => localized(value, language);
  const round = detectiveRounds[roundIndex];
  const site = useMemo(() => sites.find((item) => item.id === round?.siteId), [sites, round?.siteId]);
  const evidence = useMemo(() => buildDetectiveEvidence(round, site), [round, site]);

  if (!round || !site) return null;

  const total = detectiveRounds.length;
  const correct = selected === round.answer;
  const correctOption = round.options.find((option) => option.id === round.answer);
  const ratio = score / total;

  const choose = (optionId) => {
    if (revealed) return;
    setSelected(optionId);
    setRevealed(true);
    if (optionId === round.answer) setScore((value) => value + 1);
  };

  const next = () => {
    if (roundIndex + 1 >= total) {
      setFinished(true);
      return;
    }
    setRoundIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
  };

  const restart = () => {
    setRoundIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setFinished(false);
  };

  const tier = ratio >= 0.75 ? 'tierHigh' : ratio >= 0.5 ? 'tierMedium' : 'tierLow';

  return (
    <section id="game" className="content-section chapter chapter--teal" aria-labelledby="game-title">
      <div className="section-inner" style={{ maxWidth: 980 }}>
        <SectionHead kicker={t('game.kicker')} title={t('game.title')} subtitle={t('game.subtitle')} id="game-title" />

        <Panel
          title={finished ? `${t('game.finishedTitle')} · ${L(site.name)}` : `${t('game.round', { current: roundIndex + 1, total })} · ${L(round.title)}`}
          icon="search"
          status={finished ? `${score}/${total}` : t('game.score', { score })}
          bodyClassName={finished ? '' : 'card-pad'}
        >
          {finished ? (
            <div className="game-result" data-testid="detective-result">
              <Icon icon="search" size={24} style={{ color: 'var(--bp-intent-primary-rest)' }} aria-hidden="true" />
              <h3 style={{ margin: '8px 0 0', fontSize: 20, fontWeight: 600 }}>{t('game.finishedTitle')}</h3>
              <p className="game-score" dir="ltr">{score} / {total}</p>
              <p className="body-copy-muted">{t('game.scoreLine', { score, total })}</p>
              <div style={{ maxWidth: 260, margin: '0 auto 12px' }}>
                <Meter value={ratio} label={t('game.score', { score })} />
              </div>
              <p className="small muted" style={{ maxWidth: 460, margin: '0 auto 16px' }}>{t(`game.${tier}`)}</p>
              <Button intent="primary" icon="refresh" text={t('game.restart')} onClick={restart} />
            </div>
          ) : (
            <>
              <div className="row-between" style={{ marginBottom: 10 }}>
                <p className="body-copy-muted" style={{ margin: 0, maxWidth: 640 }}>{L(round.brief)}</p>
                <div className="row" style={{ gap: 6, minWidth: 140 }}>
                  <span className="micro">{t('game.progress')}</span>
                  <div style={{ width: 80 }}>
                    <Meter value={(roundIndex + (revealed ? 1 : 0)) / total} label={t('game.progress')} />
                  </div>
                </div>
              </div>

              <div className="scene-pair">
                {[
                  { key: 'before', label: t('game.before') },
                  { key: 'after', label: t('game.after') },
                ].map((item) => {
                  const state = round[item.key];
                  return (
                    <Panel key={item.key} title={item.label} icon="camera" status={state.date}>
                      <SceneCanvas
                        site={site}
                        params={state.params}
                        channel="radar"
                        alt={t('sites.ariaScene', { site: L(site.name), state: item.label })}
                      />
                    </Panel>
                  );
                })}
              </div>

              <p className="micro" style={{ marginBottom: 8, textAlign: 'center' }}>{t('game.simulated')}</p>

              <h3 className="row" style={{ marginBottom: 8, fontSize: 14, fontWeight: 600, gap: 6 }}>
                <Icon icon="help" size={14} style={{ color: 'var(--bp-intent-primary-rest)' }} aria-hidden="true" />
                {t('game.question')}
              </h3>

              <div className="option-grid" role="group" aria-label={t('game.select')}>
                {round.options.map((option) => {
                  const isSelected = selected === option.id;
                  const isAnswer = option.id === round.answer;
                  const intent = revealed && isAnswer ? 'success' : revealed && isSelected ? 'danger' : undefined;
                  return (
                    <Button
                      key={option.id}
                      fill
                      alignText="start"
                      variant={revealed && !isAnswer && !isSelected ? 'minimal' : 'outlined'}
                      intent={intent}
                      onClick={() => choose(option.id)}
                      disabled={revealed}
                      aria-pressed={isSelected}
                      data-testid={`detective-option-${option.id}`}
                      icon={revealed && isAnswer ? 'tick' : revealed && isSelected ? 'cross' : undefined}
                    >
                      {L(option.label)}
                    </Button>
                  );
                })}
              </div>

              <div aria-live="polite">
                {revealed ? (
                  <div data-testid="detective-feedback">
                    <Callout
                      className="feedback"
                      intent={correct ? 'success' : 'danger'}
                      icon={correct ? 'tick' : 'error'}
                      title={correct ? t('game.correct') : t('game.wrong')}
                      style={{ marginTop: 12 }}
                    >
                      {!correct ? (
                        <p className="small" style={{ marginBottom: 6 }}>
                          {t('game.answerWas', { answer: L(correctOption?.label) })}
                        </p>
                      ) : null}
                      <p className="body-copy" style={{ marginBottom: 8 }}>{L(round.explanation)}</p>
                      {evidence.length > 0 ? (
                        <div className="row" style={{ paddingTop: 8, borderTop: '1px solid var(--bp-surface-border-color-default)' }}>
                          <span className="micro">{t('game.evidence')}:</span>
                          {evidence.map((item) => (
                            <Tag key={item.id} minimal>
                              {L(item.label)} <span className="numeric">{item.value}</span>
                            </Tag>
                          ))}
                        </div>
                      ) : null}
                    </Callout>
                    <div className="row" style={{ justifyContent: 'flex-end', marginTop: 10 }}>
                      <Button
                        intent="primary"
                        icon="arrow-right"
                        text={roundIndex + 1 >= total ? t('game.finish') : t('game.next')}
                        onClick={next}
                        data-testid="detective-next"
                      />
                    </div>
                  </div>
                ) : (
                  <p className="micro" style={{ marginTop: 10 }}>
                    <Icon icon="info-sign" size={12} aria-hidden="true" /> {t('game.hint')}
                  </p>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>
    </section>
  );
}
