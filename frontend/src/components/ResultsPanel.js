import { useEffect, useState } from 'react';
import InsightsRounded from '@mui/icons-material/InsightsRounded';
import TrackChangesRounded from '@mui/icons-material/TrackChangesRounded';
import DescriptionRounded from '@mui/icons-material/DescriptionRounded';
import CheckCircleRounded from '@mui/icons-material/CheckCircleRounded';
import TipsAndUpdatesRounded from '@mui/icons-material/TipsAndUpdatesRounded';
import HighlightOffRounded from '@mui/icons-material/HighlightOffRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import AutoAwesomeRounded from '@mui/icons-material/AutoAwesomeRounded';
import ScoreRing, { matchLabel } from './ScoreRing';
import CoverLetter from './CoverLetter';

function initials(name) {
  return (name || '?')
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

/* ---------- Before anything is uploaded ---------- */
function EmptyState() {
  const features = [
    { icon: <InsightsRounded fontSize="small" />, title: 'Resume score', text: 'A 0–100 score with strengths and fixes' },
    { icon: <TrackChangesRounded fontSize="small" />, title: 'Job match', text: 'Paste a job ad to see missing skills' },
    { icon: <DescriptionRounded fontSize="small" />, title: 'Cover letter', text: 'Editable, ready for Word or PDF' },
  ];
  return (
    <div className="empty">
      <span className="empty-icon" aria-hidden="true">
        <AutoAwesomeRounded />
      </span>
      <h2 className="empty-title">Your analysis will appear here</h2>
      <p className="empty-sub">Upload a resume on the left and press Analyze.</p>
      <ul className="feature-list">
        {features.map((f) => (
          <li key={f.title} className="feature">
            <span className="feature-icon" aria-hidden="true">{f.icon}</span>
            <span>
              <strong>{f.title}</strong>
              <span className="feature-text">{f.text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ---------- While Gemini is working ---------- */
function LoadingState({ withJob, withLetter }) {
  const steps = [
    'Reading your resume',
    'Identifying skills and experience',
    'Scoring and writing feedback',
    withJob && 'Comparing with the job description',
    withLetter && 'Writing your cover letter',
  ].filter(Boolean);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    // The backend doesn't report progress, so we advance through the steps on a
    // timer and stay on the last one until the answer arrives.
    const timer = setInterval(() => {
      setCurrent((c) => Math.min(c + 1, steps.length - 1));
    }, 1600);
    return () => clearInterval(timer);
  }, [steps.length]);

  return (
    <div className="loading" aria-live="polite">
      <ol className="steps">
        {steps.map((step, i) => (
          <li key={step} className={`step ${i < current ? 'is-done' : ''} ${i === current ? 'is-current' : ''}`}>
            <span className="step-dot" aria-hidden="true">
              {i < current ? <CheckRounded fontSize="inherit" /> : i === current ? <span className="mini-spinner" /> : null}
            </span>
            {step}
          </li>
        ))}
      </ol>
      <div className="skeleton-group" aria-hidden="true">
        <div className="skeleton skeleton-row">
          <span className="skeleton-circle" />
          <span className="skeleton-lines">
            <span className="skeleton-line w-60" />
            <span className="skeleton-line w-40" />
          </span>
        </div>
        <span className="skeleton-line w-90" />
        <span className="skeleton-line w-75" />
        <span className="skeleton-line w-80" />
      </div>
    </div>
  );
}

/* ---------- File chosen, not analyzed yet ---------- */
function PreviewState({ url }) {
  return (
    <div className="preview">
      <div className="preview-head">Preview</div>
      <iframe title="Resume preview" src={url} />
    </div>
  );
}

/* ---------- The actual results ---------- */
function BulletList({ items, tone, icon }) {
  if (!items?.length) return <p className="muted">Nothing to show.</p>;
  return (
    <ul className={`bullets tone-${tone}`}>
      {items.map((item, i) => (
        <li key={i}>
          <span className="bullet-icon" aria-hidden="true">{icon}</span>
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

function Results({ data }) {
  const match = data.job_match;
  const tabs = [
    { id: 'feedback', label: 'Feedback' },
    match && { id: 'match', label: 'Job match' },
    data.cover_letter && { id: 'letter', label: 'Cover letter' },
  ].filter(Boolean);
  const [tab, setTab] = useState('feedback');

  useEffect(() => setTab('feedback'), [data]);
  const activeTab = tabs.some((t) => t.id === tab) ? tab : 'feedback';
  const years = data.experience === 1 ? 'year' : 'years';

  return (
    <div className="results">
      <section className="profile">
        <span className="avatar" aria-hidden="true">{initials(data.name)}</span>
        <div className="profile-text">
          <h2 className="profile-name">{data.name}</h2>
          <p className="profile-headline">{data.headline}</p>
        </div>
        <span className="pill">
          {data.experience} {years} experience
        </span>
      </section>

      <section className={`scores ${match ? 'has-two' : ''}`}>
        <ScoreRing score={data.score} label="Resume score" caption="Overall quality" />
        {match && (
          <ScoreRing score={match.match_score} label="Job match" caption="Fit for this role" describe={matchLabel} />
        )}
      </section>

      <section className="section">
        <h3 className="section-title">Skills & expertise</h3>
        <div className="chips">
          {data.domain_expertise.map((skill) => (
            <span key={skill} className="chip">{skill}</span>
          ))}
        </div>
      </section>

      {tabs.length > 1 && (
        <div className="tabs" role="tablist" aria-label="Analysis sections">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={activeTab === t.id}
              aria-controls={`panel-${t.id}`}
              className={`tab ${activeTab === t.id ? 'is-active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {/* All tabs stay mounted (just hidden) so cover-letter edits survive tab switches */}
      <div className="tab-panel" role="tabpanel" id="panel-feedback" aria-labelledby="tab-feedback" hidden={activeTab !== 'feedback'}>
          <div className="feedback-grid">
            <section className="section">
              <h3 className="section-title">Strengths</h3>
              <BulletList items={data.strengths} tone="good" icon={<CheckCircleRounded fontSize="inherit" />} />
            </section>
            <section className="section">
              <h3 className="section-title">How to improve</h3>
              <BulletList items={data.improvements} tone="ok" icon={<TipsAndUpdatesRounded fontSize="inherit" />} />
            </section>
          </div>
      </div>

      {match && (
        <div className="tab-panel" role="tabpanel" id="panel-match" aria-labelledby="tab-match" hidden={activeTab !== 'match'}>
          <div className="match">
            <p className="verdict">{match.verdict}</p>
            <section className="section">
              <h3 className="section-title">You have</h3>
              <div className="chips">
                {match.matched_skills.length ? (
                  match.matched_skills.map((s) => (
                    <span key={s} className="chip chip-good">
                      <CheckRounded fontSize="inherit" /> {s}
                    </span>
                  ))
                ) : (
                  <span className="muted">No clear matches found.</span>
                )}
              </div>
            </section>
            <section className="section">
              <h3 className="section-title">Missing from your resume</h3>
              <div className="chips">
                {match.missing_skills.length ? (
                  match.missing_skills.map((s) => (
                    <span key={s} className="chip chip-bad">
                      <HighlightOffRounded fontSize="inherit" /> {s}
                    </span>
                  ))
                ) : (
                  <span className="muted">Nothing important missing. Nice!</span>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {data.cover_letter && (
        <div className="tab-panel" role="tabpanel" id="panel-letter" aria-labelledby="tab-letter" hidden={activeTab !== 'letter'}>
          <CoverLetter letter={data.cover_letter} candidateName={data.name} visible={activeTab === 'letter'} />
        </div>
      )}
    </div>
  );
}

export default function ResultsPanel({ loading, result, previewUrl, withJob, withLetter }) {
  let content;
  if (loading) content = <LoadingState withJob={withJob} withLetter={withLetter} />;
  else if (result) content = <Results data={result} />;
  else if (previewUrl) content = <PreviewState url={previewUrl} />;
  else content = <EmptyState />;

  return <section className="panel results-panel">{content}</section>;
}
