import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, Callout, Tag } from '@blueprintjs/core';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '../context/LanguageContext';
import { useSiteData } from '../context/SiteDataContext';
import { localized } from '../data/localized';
import { buildDetectiveEvidence, detectiveRounds } from '../data/quiz';
import { SceneCanvas } from './SceneCanvas';
import { Meter, Panel, SectionHead } from './ui';

const ROUND_SECONDS = 30;

function playBeep(kind) {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.value = kind === 'correct' ? 660 : 220;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.18);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
    osc.onended = () => ctx.close();
  } catch {
    /* audio unavailable */
  }
}

export default function Detective() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const { sites } = useSiteData();
  const [roundIndex, setRoundIndex] = useState(0);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [finished, setFinished] = useState(false);
  const [shake, setShake] = useState(false);
  const [shuffled, setShuffled] = useState([]);
  const timerRef = useRef(null);

  const L = (value) => localized(value, language);
  const round = detectiveRounds[roundIndex];
  const site = useMemo(() => sites.find((item) => item.id === round?.siteId), [sites, round?.siteId]);

  useEffect(() => {
    if (!round) return;
    const arr = [...round.options];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffled(arr);
  }, [roundIndex, round]);
  const evidence = useMemo(() => buildDetectiveEvidence(round, site), [round, site]);

  if (!round || !site) return null;

  const total = detectiveRounds.length;
  const correct = selected === round.answer;
  const correctOption = round.options.find((option) => option.id === round.answer);
  const ratio = score / total;

  // countdown
  useEffect(() => {
    if (finished || revealed) return undefined;
    setTimeLeft(ROUND_SECONDS);
    timerRef.current = setInterval(() => {
      setTimeLeft((value) => {
        if (value <= 1) {
          clearInterval(timerRef.current);
          setSelected(null);
          setRevealed(true);
          setStreak(0);
          playBeep('wrong');
          return 0;
        }
        return value - 1;
      });
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [roundIndex, finished, revealed]);

  const choose = (optionId) => {
    if (revealed) return;
    clearInterval(timerRef.current);
    setSelected(optionId);
    setRevealed(true);
    if (optionId === round.answer) {
      setScore((value) => value + 1);
      setStreak((value) => {
        const next = value + 1;
        setBestStreak((best) => Math.max(best, next));
        return next;
      });
      playBeep('correct');
    } else {
      setStreak(0);
      setShake(true);
      setTimeout(() => setShake(false), 450);
      playBeep('wrong');
    }
  };

  const next = () => {
    if (roundIndex + 1 >= total) {
      setFinished(true);
      return;
    }
    setRoundIndex((value) => value + 1);
    setSelected(null);
    setRevealed(false);
    setShake(false);
  };

  const restart = () => {
    setRoundIndex(0);
    setSelected(null);
    setRevealed(false);
    setScore(0);
    setStreak(0);
    setBestStreak(0);
    setShake(false);
    setFinished(false);
    setTimeLeft(ROUND_SECONDS);
  };

  const tier = ratio >= 0.75 ? 'tierHigh' : ratio >= 0.5 ? 'tierMedium' : 'tierLow';
  const timerDanger = timeLeft <= 8;

  return (
    <section id="game" className={`content-section chapter chapter--teal ${shake ? 'detective-shake' : ''}`} aria-labelledby="game-title">
      <div className="section-inner" style={{ maxWidth: 980 }}>
        <SectionHead title={t('game.title')} subtitle={t('game.subtitle')} id="game-title" />

        <Panel
          title={finished ? `${t('game.finishedTitle')} · ${L(site.name)}` : `${t('game.round', { current: roundIndex + 1, total })} · ${L(round.title)}`}
          status={finished ? `${score}/${total}` : t('game.score', { score })}
          bodyClassName={finished ? '' : 'card-pad'}
        >
          {finished ? (
            <div className="game-result" data-testid="detective-result">
              <h3 style={{ margin: '0', fontSize: 20, fontWeight: 600 }}>{t('game.finishedTitle')}</h3>
              <p className="game-score" dir="ltr">{score} / {total}</p>
              <p className="body-copy-muted">{t('game.scoreLine', { score, total })}</p>
              {bestStreak > 1 ? (
                <p className="small muted" style={{ marginBottom: 8 }}>🔥 {bestStreak} streak best</p>
              ) : null}
              <div style={{ maxWidth: 260, margin: '0 auto 12px' }}>
                <Meter value={ratio} label={t('game.score', { score })} />
              </div>
              <p className="small muted" style={{ maxWidth: 460, margin: '0 auto 16px' }}>{t(`game.${tier}`)}</p>
              <Button intent="primary" icon="refresh" text={t('game.restart')} onClick={restart} />
            </div>
          ) : (
            <>
              <div className="row-between" style={{ marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                <p className="body-copy-muted" style={{ margin: 0, maxWidth: 520 }}>{L(round.brief)}</p>
                <div className="row" style={{ gap: 10, alignItems: 'center' }}>
                  <div className="row" style={{ gap: 4 }} aria-label="progress">
                    {detectiveRounds.map((_, i) => (
                      <span
                        key={i}
                        style={{
                          width: 10,
                          height: 10,
                          display: 'inline-block',
                          background: i < roundIndex ? 'var(--bp-intent-success-rest)' : i === roundIndex ? 'var(--bp-intent-primary-rest)' : 'var(--bp-surface-border-color-default)',
                        }}
                      />
                    ))}
                  </div>
                  {streak > 1 ? (
                    <span className="micro" style={{ color: 'var(--bp-intent-warning-rest)' }}>🔥 ×{streak}</span>
                  ) : null}
                  <span
                    className="micro numeric"
                    style={{ color: timerDanger ? 'var(--bp-intent-danger-rest)' : 'var(--bp-typography-color-muted)', minWidth: 28, textAlign: 'right' }}
                    data-testid="detective-timer"
                  >
                    {timeLeft}s
                  </span>
                  <div style={{ width: 70 }}>
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
                        imageUrl={item.key === 'before' ? site.states?.before?.imageUrl : site.states?.after?.imageUrl}
                        alt={t('sites.ariaScene', { site: L(site.name), state: item.label })}
                      />
                    </Panel>
                  );
                })}
              </div>

              <h3 style={{ marginBottom: 8, fontSize: 14, fontWeight: 600 }}>{t('game.question')}</h3>

              <div className="option-grid" role="group" aria-label={t('game.select')}>
                {shuffled.map((option) => {
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
                      className={revealed && isAnswer ? 'detective-correct-pop' : ''}
                    >
                      {L(option.label)}
                    </Button>
                  );
                })}
              </div>

              <div aria-live="polite">
                {revealed ? (
                  <div data-testid="detective-feedback" className={correct ? 'detective-confetti' : ''}>
                    <Callout
                      className={`feedback ${correct ? 'correct' : 'wrong'}`}
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
                  <p className="micro" style={{ marginTop: 10 }}>{t('game.hint')}</p>
                )}
              </div>
            </>
          )}
        </Panel>
      </div>
    </section>
  );
}