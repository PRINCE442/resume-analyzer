import os

from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    raise RuntimeError(
        "GEMINI_API_KEY is missing. Add GEMINI_API_KEY=your-gemini-key to the .env file."
    )

# Tried in order: if the first model is overloaded or down, LangChain
# automatically moves on to the next one.
MODELS = ["gemini-3.6-flash", "gemini-3.5-flash-lite", "gemini-3.1-flash-lite"]


def _make_model(name):
    return ChatGoogleGenerativeAI(
        model=name,
        api_key=GEMINI_API_KEY,
        max_retries=1,  # retry once, then let the fallback model take over
        timeout=60,     # never hang forever waiting on Google
    )


def llmconnect(schema=None):
    """Return a Gemini model with fallbacks.

    Pass a Pydantic class as `schema` to get structured output (a Python object)
    instead of plain text.
    """
    models = [_make_model(name) for name in MODELS]
    if schema is not None:
        models = [m.with_structured_output(schema) for m in models]

    primary, *backups = models
    return primary.with_fallbacks(backups)
