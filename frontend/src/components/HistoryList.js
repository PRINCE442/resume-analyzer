import HistoryRounded from '@mui/icons-material/HistoryRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import { scoreTone } from './ScoreRing';

function timeAgo(iso) {
  const seconds = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function HistoryList({ items, activeId, onSelect, onRemove, onClear, disabled }) {
  if (!items.length) return null;

  return (
    <section className="panel history">
      <div className="history-head">
        <h2 className="panel-title">
          <HistoryRounded fontSize="small" /> Recent
        </h2>
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear} disabled={disabled}>
          Clear all
        </button>
      </div>

      <ul className="history-list">
        {items.map((item) => {
          const r = item.result;
          return (
            <li key={item.id} className={`history-item ${item.id === activeId ? 'is-active' : ''}`}>
              <button
                type="button"
                className="history-main"
                onClick={() => onSelect(item)}
                disabled={disabled}
                aria-current={item.id === activeId ? 'true' : undefined}
              >
                <span className={`history-score tone-${scoreTone(r.score)}`}>{r.score}</span>
                <span className="history-text">
                  <span className="history-name">{r.name}</span>
                  <span className="history-meta">
                    {item.fileName} · {timeAgo(item.createdAt)}
                    {r.job_match ? ` · ${r.job_match.match_score}% match` : ''}
                  </span>
                </span>
              </button>
              <button
                type="button"
                className="icon-btn icon-btn-sm history-remove"
                onClick={() => onRemove(item.id)}
                aria-label={`Remove ${r.name} from history`}
                title="Remove"
                disabled={disabled}
              >
                <CloseRounded fontSize="inherit" />
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
