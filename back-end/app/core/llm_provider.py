import os, requests
from app.config import LLM_PROVIDER, GROQ_API_KEY

def get_llm_response(prompt: str) -> str:
    if LLM_PROVIDER == "groq":
        return _call_groq(prompt)
    return _call_ollama(prompt)

def _call_groq(prompt: str) -> str:
    from groq import Groq
    client = Groq(api_key=GROQ_API_KEY)
    res = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        max_tokens=2048,        # ← add this, default is often 1024
        temperature=0.7,        # ← slightly creative for storytelling
    )
    return res.choices[0].message.content

def _call_ollama(prompt: str) -> str:
    res = requests.post(
        "http://localhost:11434/api/generate",
        json={"model": "llama3.2", "prompt": prompt, "stream": False}
    )
    return res.json()["response"]
