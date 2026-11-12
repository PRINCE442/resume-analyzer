import { useEffect, useState } from 'react';

export function scoreTone(score) {
  if (score >= 75) return 'good';
  if (score >= 50) return 'ok';
  return 'bad';
}

export function scoreLabel(score) {
  if (score >= 85) return 'Excellent';
  if (score >= 75) return 'Good';
  if (score >= 50) return 'Needs work';
  return 'Weak';
}

// Same colour thresholds as scoreTone, but words that fit a job match
export function matchLabel(score) {
  if (score >= 75) return 'Strong fit';
  if (score >= 50) return 'Partial fit';
  return 'Low fit';
}

// Counts a number up from 0 to `target` for a nice "reveal" effect.
function useCountUp(target, duration = 900) {
  const [value, setValue] = useState(0);

  useEffect(() => {
    const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    if (reduceMotion) {
      setValue(target);
      return;
    }
    let frame;
    const start = performance.now();
    const tick = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out
      setValue(Math.round(target * eased));
      if (progress < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [target, duration]);

  return value;
}

export default function ScoreRing({ score, label, caption, describe = scoreLabel }) {
  const size = 112;
  const stroke = 9;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const shown = useCountUp(score);
  const offset = circumference * (1 - shown / 100);

  return (
    <div className={`score tone-${scoreTone(score)}`}>
      <div className="score-ring" role="img" aria-label={`${label}: ${score} out of 100`}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle className="score-track" cx={size / 2} cy={size / 2} r={radius} strokeWidth={stroke} />
          <circle
            className="score-bar"
            cx={size / 2}
            cy={size / 2}
            r={radius}
            strokeWidth={stroke}
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </svg>
        <span className="score-value">{shown}</span>
      </div>
      <div className="score-text">
        <span className="score-label">{label}</span>
        <span className="score-verdict">{describe(score)}</span>
        {caption && <span className="score-caption">{caption}</span>}
      </div>
    </div>
  );
}
