import { useEffect, useRef, useState } from 'react';
import './App.css';
import Header from './components/Header';
import BackgroundFx from './components/BackgroundFx';
import UploadPanel from './components/UploadPanel';
import ResultsPanel from './components/ResultsPanel';
import HistoryList from './components/HistoryList';
import { analyzeResume } from './lib/api';
import { loadHistory, addToHistory, removeFromHistory, clearHistory } from './lib/history';

const MAX_FILE_BYTES = 10 * 1024 * 1024; // 10 MB

function initialTheme() {
  try {
    const saved = localStorage.getItem('resume-analyzer:theme');
    if (saved === 'dark' || saved === 'light') return saved === 'dark';
  } catch {
    // ignore, fall back to the system setting
  }
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
}

function isSmallScreen() {
  return window.matchMedia?.('(max-width: 960px)').matches ?? false;
}

function App() {
  // Appearance
  const [isDark, setIsDark] = useState(initialTheme);
  const [waves, setWaves] = useState(false);
  const [particles, setParticles] = useState(false);

  // Form inputs
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [coverLetter, setCoverLetter] = useState(false);

  // Request + results
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [history, setHistory] = useState(loadHistory);
  const [activeId, setActiveId] = useState(null);

  const resultsRef = useRef(null);

  // Apply + remember the theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    try {
      localStorage.setItem('resume-analyzer:theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore
    }
  }, [isDark]);

  // Free the memory used by the old PDF preview when it changes
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // If a file is dropped outside the drop zone, don't let the browser
  // navigate away from the app to open the PDF.
  useEffect(() => {
    const block = (e) => e.preventDefault();
    window.addEventListener('dragover', block);
    window.addEventListener('drop', block);
    return () => {
      window.removeEventListener('dragover', block);
      window.removeEventListener('drop', block);
    };
  }, []);

  function scrollToResults() {
    // On phones the results are below the form, so bring them into view
    if (isSmallScreen()) {
      requestAnimationFrame(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  }

  function handleFileSelected(f) {
    setError('');
    const isPdf = f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf');
    if (!isPdf) {
      setError('Only PDF files are allowed.');
      return;
    }
    if (f.size > MAX_FILE_BYTES) {
      setError('That file is over 10 MB. Please upload a smaller PDF.');
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
    setResult(null);
    setActiveId(null);
  }

  function handleRemoveFile() {
    setFile(null);
    setPreviewUrl('');
    setError('');
    setResult(null);
    setActiveId(null);
  }

  async function handleSubmit() {
    if (!file) {
      setError('Please upload a PDF resume first.');
      return;
    }
    setError('');
    setResult(null);
    setActiveId(null);
    setLoading(true);
    scrollToResults();

    try {
      const job = jobDescription.trim();
      const data = await analyzeResume({ file, coverLetter, jobDescription: job });
      setResult(data);
      const saved = addToHistory(history, { fileName: file.name, jobDescription: job, result: data });
      setHistory(saved.list);
      setActiveId(saved.entry.id);
    } catch (err) {
      setError(err.message || 'Failed to analyze the resume.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectHistory(item) {
    setError('');
    setResult(item.result);
    setActiveId(item.id);
    scrollToResults();
  }

  function handleRemoveHistory(id) {
    setHistory((list) => removeFromHistory(list, id));
    if (id === activeId) {
      setActiveId(null);
      setResult(null);
    }
  }

  function handleClearHistory() {
    setHistory(clearHistory());
    if (activeId) {
      setActiveId(null);
      setResult(null);
    }
  }

  return (
    <div className="app">
      <BackgroundFx waves={waves} particles={particles} />

      <Header
        isDark={isDark}
        onToggleTheme={() => setIsDark((d) => !d)}
        waves={waves}
        onToggleWaves={() => setWaves((w) => !w)}
        particles={particles}
        onToggleParticles={() => setParticles((p) => !p)}
      />

      <main className="main">
        <section className="hero">
          <span className="eyebrow">AI-powered · Powered by Gemini</span>
          <h1 className="hero-title">
            Land your next role, <span className="accent-text">faster.</span>
          </h1>
          <p className="hero-sub">
            Get an honest score, clear fixes, a job match check and a tailored cover letter in seconds.
          </p>
        </section>

        <div className="layout">
          <div className="col col-input">
            <UploadPanel
              file={file}
              onFileSelected={handleFileSelected}
              onRemoveFile={handleRemoveFile}
              jobDescription={jobDescription}
              onJobDescriptionChange={setJobDescription}
              coverLetter={coverLetter}
              onCoverLetterChange={setCoverLetter}
              loading={loading}
              error={error}
              onSubmit={handleSubmit}
            />
            <HistoryList
              items={history}
              activeId={activeId}
              onSelect={handleSelectHistory}
              onRemove={handleRemoveHistory}
              onClear={handleClearHistory}
              disabled={loading}
            />
          </div>

          <div className="col col-output" ref={resultsRef}>
            <ResultsPanel
              loading={loading}
              result={result}
              previewUrl={previewUrl}
              withJob={Boolean(jobDescription.trim())}
              withLetter={coverLetter}
            />
          </div>
        </div>
      </main>

      <footer className="footer">Built with React, FastAPI, LangChain &amp; Gemini</footer>
    </div>
  );
}

export default App;
