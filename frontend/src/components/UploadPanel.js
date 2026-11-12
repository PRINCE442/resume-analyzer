import { useRef, useState } from 'react';
import CloudUploadRounded from '@mui/icons-material/CloudUploadRounded';
import PictureAsPdfRounded from '@mui/icons-material/PictureAsPdfRounded';
import CloseRounded from '@mui/icons-material/CloseRounded';
import WorkOutlineRounded from '@mui/icons-material/WorkOutlineRounded';
import ExpandMoreRounded from '@mui/icons-material/ExpandMoreRounded';
import ArrowForwardRounded from '@mui/icons-material/ArrowForwardRounded';
import ErrorOutlineRounded from '@mui/icons-material/ErrorOutlineRounded';

const MAX_JOB_CHARS = 10000;

function formatSize(bytes) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function UploadPanel({
  file,
  onFileSelected,
  onRemoveFile,
  jobDescription,
  onJobDescriptionChange,
  coverLetter,
  onCoverLetterChange,
  loading,
  error,
  onSubmit,
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [jobOpen, setJobOpen] = useState(Boolean(jobDescription));

  function openFilePicker() {
    inputRef.current?.click();
  }

  function handleInputChange(e) {
    const picked = e.target.files?.[0];
    if (picked) onFileSelected(picked);
    e.target.value = ''; // allow picking the same file again later
  }

  function handleDrop(e) {
    e.preventDefault();
    setDragging(false);
    const dropped = e.dataTransfer.files?.[0];
    if (dropped) onFileSelected(dropped);
  }

  function handleDragLeave(e) {
    // Only stop highlighting when the pointer really leaves the drop zone,
    // not when it moves over a child element inside it.
    if (!e.currentTarget.contains(e.relatedTarget)) setDragging(false);
  }

  return (
    <form
      className="panel upload-panel"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <div className="panel-head">
        <h2 className="panel-title">Your resume</h2>
        <p className="panel-sub">PDF only, up to 10 MB</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept=".pdf,application/pdf"
        onChange={handleInputChange}
        hidden
      />

      {file ? (
        <div className="file-card">
          <span className="file-icon" aria-hidden="true">
            <PictureAsPdfRounded />
          </span>
          <div className="file-meta">
            <span className="file-name" title={file.name}>{file.name}</span>
            <span className="file-size">{formatSize(file.size)}</span>
          </div>
          <button type="button" className="btn btn-ghost btn-sm" onClick={openFilePicker} disabled={loading}>
            Replace
          </button>
          <button
            type="button"
            className="icon-btn icon-btn-sm"
            onClick={onRemoveFile}
            aria-label="Remove file"
            title="Remove file"
            disabled={loading}
          >
            <CloseRounded fontSize="small" />
          </button>
        </div>
      ) : (
        <div
          className={`dropzone ${dragging ? 'is-dragging' : ''}`}
          role="button"
          tabIndex={0}
          onClick={openFilePicker}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              openFilePicker();
            }
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <span className="dropzone-icon" aria-hidden="true">
            <CloudUploadRounded />
          </span>
          <span className="dropzone-title">
            {dragging ? 'Drop it here' : 'Drag & drop your resume'}
          </span>
          <span className="dropzone-sub">
            or <span className="link-text">browse files</span>
          </span>
        </div>
      )}

      <div className={`disclosure ${jobOpen ? 'is-open' : ''}`}>
        <button
          type="button"
          className="disclosure-toggle"
          onClick={() => setJobOpen((open) => !open)}
          aria-expanded={jobOpen}
          aria-controls="job-description"
        >
          <WorkOutlineRounded fontSize="small" />
          <span>
            Target a specific job <span className="muted">(optional)</span>
          </span>
          <ExpandMoreRounded className="disclosure-chevron" fontSize="small" />
        </button>
        {jobOpen && (
          <div className="disclosure-body">
            <textarea
              id="job-description"
              className="textarea"
              placeholder="Paste the job description here to get a match score, missing skills, and a tailored cover letter…"
              value={jobDescription}
              maxLength={MAX_JOB_CHARS}
              onChange={(e) => onJobDescriptionChange(e.target.value)}
              rows={6}
              disabled={loading}
            />
            <div className="char-count">
              {jobDescription.length.toLocaleString()} / {MAX_JOB_CHARS.toLocaleString()}
            </div>
          </div>
        )}
      </div>

      <label className="switch-row">
        <span className="switch-text">
          <span className="switch-label">Write a cover letter</span>
          <span className="switch-hint">
            {jobDescription.trim() ? 'Tailored to the job above' : 'Based on your resume'}
          </span>
        </span>
        <input
          type="checkbox"
          className="switch"
          checked={coverLetter}
          onChange={(e) => onCoverLetterChange(e.target.checked)}
          disabled={loading}
        />
      </label>

      {error && (
        <div className="alert" role="alert">
          <ErrorOutlineRounded fontSize="small" />
          <span>{error}</span>
        </div>
      )}

      <button type="submit" className="btn btn-primary btn-block" disabled={loading || !file}>
        {loading ? (
          <>
            <span className="btn-spinner" aria-hidden="true" />
            Analyzing…
          </>
        ) : (
          <>
            Analyze resume
            <ArrowForwardRounded fontSize="small" />
          </>
        )}
      </button>
    </form>
  );
}
