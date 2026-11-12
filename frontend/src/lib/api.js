// Talks to the FastAPI backend.
// The URL is relative: in development the React dev server forwards /api/...
// to FastAPI (see "proxy" in package.json); in production FastAPI serves both.

export async function analyzeResume({ file, coverLetter, jobDescription }) {
  const form = new FormData();
  form.append('resume', file);
  form.append('cover_letter', coverLetter);
  form.append('job_description', jobDescription || '');

  let resp;
  try {
    resp = await fetch('/api/analyze-cv', { method: 'POST', body: form });
  } catch {
    throw new Error('Could not reach the server. Is the backend running?');
  }

  const data = await resp.json().catch(() => ({}));

  if (!resp.ok) {
    // FastAPI puts its error message in "detail" (a string for our own errors,
    // a list for validation errors)
    const message =
      typeof data.detail === 'string'
        ? data.detail
        : `Something went wrong (error ${resp.status})`;
    throw new Error(message);
  }

  return data.model_response;
}
