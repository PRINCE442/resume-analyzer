import io
import logging
from pathlib import Path
from typing import List, Optional

from fastapi import APIRouter, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.staticfiles import StaticFiles
from langchain_core.prompts import PromptTemplate
from pydantic import BaseModel, Field
from pypdf import PdfReader
from pypdf.errors import PdfReadError

from connect import llmconnect

app = FastAPI()
api = APIRouter(prefix="/api")  # every backend route lives under /api

logger = logging.getLogger("uvicorn.error")

FRONTEND_BUILD = Path(__file__).parent / "frontend" / "build"
MAX_JOB_DESCRIPTION_CHARS = 10_000


class JobMatch(BaseModel):
    match_score: int = Field(
        description="0-100: how well the candidate fits this specific job"
    )
    matched_skills: List[str] = Field(
        description="Skills/requirements from the job description that the resume shows"
    )
    missing_skills: List[str] = Field(
        description="Important skills/requirements from the job description that the resume does NOT show"
    )
    verdict: str = Field(
        description="One or two sentences summarising how well the candidate fits the job"
    )


class ResumeAnalysis(BaseModel):
    name: str = Field(description="Full name of the candidate")
    headline: str = Field(
        description="Short professional headline, e.g. 'Senior Backend Engineer'"
    )
    experience: int = Field(description="Total years of professional experience")
    domain_expertise: List[str] = Field(description="Main domains / skill areas")
    score: int = Field(description="Overall resume quality score from 0 to 100")
    strengths: List[str] = Field(
        description="3-5 specific things this resume does well"
    )
    improvements: List[str] = Field(
        description="3-5 specific, actionable suggestions to improve this resume"
    )
    job_match: Optional[JobMatch] = Field(
        default=None,
        description="Only fill this in if a job description was provided",
    )
    cover_letter: Optional[str] = Field(
        default=None,
        description="A cover letter for the candidate, only if one was requested",
    )


prompt_template = PromptTemplate(
    template="""You are an expert resume reviewer and career coach.

Read the resume below and extract:
- the candidate's full name and a short professional headline
- their total years of professional experience (as a whole number)
- a list of their main domains of expertise

Then review the resume:
- score: rate the overall resume quality from 0 to 100. Consider clarity, structure,
  measurable achievements (numbers, impact), relevant skills, and how professional it reads.
  Be honest: 90+ is exceptional, 70-89 is good, 50-69 needs work, below 50 is weak.
- strengths: 3-5 specific things the resume does well.
- improvements: 3-5 specific, actionable suggestions (e.g. "Add numbers to the Acme
  Corp role, such as how much you improved performance"), not generic advice.

Job description (may be empty):
<job>
{job}
</job>
If a job description is given above, fill in job_match: compare the resume to the job,
give a 0-100 match_score, list matched_skills and missing_skills, and a short verdict.
If it is empty, leave job_match empty.

Generate cover letter: {gen}
If "Generate cover letter" is True, write a short, professional cover letter based on
the resume. If a job description is given, tailor the letter to that job.
Separate paragraphs with a blank line. If it is False, leave cover_letter empty.

Resume:
<resume>
{cv}
</resume>
""",
    input_variables=["cv", "gen", "job"],
)


def _clamp_score(value: int) -> int:
    return max(0, min(100, value))


@api.get("/health")
def health():
    return {"response": "Resume analyzer is running"}


@api.post("/analyze-cv")
async def analyze_cv(
    resume: UploadFile = File(...),
    cover_letter: bool = Form(...),
    job_description: str = Form(""),
):
    is_pdf = resume.content_type == "application/pdf" or (
        resume.filename or ""
    ).lower().endswith(".pdf")
    if not is_pdf:
        raise HTTPException(status_code=400, detail="Please upload a PDF file")

    job_description = job_description.strip()
    if len(job_description) > MAX_JOB_DESCRIPTION_CHARS:
        raise HTTPException(
            status_code=400,
            detail=f"Job description is too long (max {MAX_JOB_DESCRIPTION_CHARS:,} characters)",
        )

    content = await resume.read()
    await resume.close()

    try:
        reader = PdfReader(io.BytesIO(content))
        texts = [page.extract_text() or "" for page in reader.pages]
    except PdfReadError:
        raise HTTPException(status_code=400, detail="Could not read the PDF file")

    cv_text = "\n".join(texts).strip()
    if not cv_text:
        raise HTTPException(
            status_code=400,
            detail="No text found in the PDF (it may be a scanned image)",
        )

    chain = prompt_template | llmconnect(ResumeAnalysis)
    try:
        response = await chain.ainvoke(
            {"cv": cv_text, "gen": cover_letter, "job": job_description}
        )
    except Exception:
        # Print the real error in the backend terminal, show a friendly one to the user
        logger.exception("AI analysis failed")
        raise HTTPException(
            status_code=503,
            detail="The AI service is busy right now. Please try again in a minute.",
        )

    # Keep the AI's answer consistent with what the user actually asked for
    response.score = _clamp_score(response.score)
    if not job_description:
        response.job_match = None
    elif response.job_match:
        response.job_match.match_score = _clamp_score(response.job_match.match_score)
    if not cover_letter:
        response.cover_letter = None

    return {
        "filename": resume.filename,
        "generate_cover_letter": cover_letter,
        "model_response": response.model_dump(),
    }


@api.get("/llm")
async def call_llm():
    try:
        response = await llmconnect().ainvoke("Hello, how are you?")
    except Exception:
        logger.exception("LLM connection test failed")
        raise HTTPException(status_code=503, detail="Could not reach the AI service")
    return {"response": "LLM connected successfully", "model_response": response.text}


app.include_router(api)

# Serve the built React app (after `npm run build`) at "/".
# This must come AFTER the API routes so /api/... is not swallowed by it.
if FRONTEND_BUILD.exists():
    app.mount("/", StaticFiles(directory=FRONTEND_BUILD, html=True), name="frontend")
