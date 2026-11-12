import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import ContentCopyRounded from '@mui/icons-material/ContentCopyRounded';
import CheckRounded from '@mui/icons-material/CheckRounded';
import RestartAltRounded from '@mui/icons-material/RestartAltRounded';
import EditNoteRounded from '@mui/icons-material/EditNoteRounded';
import { downloadAsDocx, downloadAsPdf } from '../lib/download';

export default function CoverLetter({ letter, candidateName, visible = true }) {
  const [draft, setDraft] = useState(letter);
  const [copied, setCopied] = useState(false);
  const [actionError, setActionError] = useState('');
  const textareaRef = useRef(null);
  const edited = draft !== letter;

  // A new analysis = a new letter: replace the draft.
  useEffect(() => {
    setDraft(letter);
  }, [letter]);

  // Grow the text box to fit the whole letter instead of scrolling inside it.
  // (Re-measured when the tab becomes visible: a hidden box measures as 0.)
  useLayoutEffect(() => {
    const el = textareaRef.current;
    if (!el || !visible) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight + 2}px`;
  }, [draft, visible]);

  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), 1800);
    return () => clearTimeout(timer);
  }, [copied]);

  async function copy() {
    setActionError('');
    try {
      await navigator.clipboard.writeText(draft);
      setCopied(true);
    } catch {
      setActionError('Could not copy. Select the text and copy it manually.');
    }
  }

  async function download(kind) {
    setActionError('');
    try {
      if (kind === 'docx') await downloadAsDocx(draft, candidateName);
      else await downloadAsPdf(draft, candidateName);
    } catch (err) {
      setActionError(`Download failed: ${err.message}`);
    }
  }

  return (
    <div className="letter">
      <div className="letter-toolbar">
        <span className="letter-hint">
          <EditNoteRounded fontSize="small" />
          {edited ? 'Edited. Downloads include your changes' : 'Click the letter to edit it'}
        </span>
        <div className="letter-actions">
          {edited && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDraft(letter)}>
              <RestartAltRounded fontSize="small" /> Reset
            </button>
          )}
          <button type="button" className="btn btn-secondary btn-sm" onClick={copy}>
            {copied ? <CheckRounded fontSize="small" /> : <ContentCopyRounded fontSize="small" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => download('docx')}>
            Word
          </button>
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => download('pdf')}>
            PDF
          </button>
        </div>
      </div>

      <textarea
        ref={textareaRef}
        className="letter-body"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        spellCheck
        aria-label="Cover letter"
      />

      {actionError && <p className="inline-error">{actionError}</p>}
    </div>
  );
}
