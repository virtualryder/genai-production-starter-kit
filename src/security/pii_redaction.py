"""
PII Redaction

Masks personally identifiable information (email, phone, SSN)
before text is logged or passed to an LLM.
"""

import re


PII_PATTERNS = {
    "email": (r"[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}", "[REDACTED_EMAIL]"),
    "phone": (r"\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b", "[REDACTED_PHONE]"),
    "ssn": (r"\b\d{3}-\d{2}-\d{4}\b", "[REDACTED_SSN]"),
}


def redact_pii(text: str) -> str:
    """Replace known PII patterns with redaction placeholders."""
    for _, (pattern, replacement) in PII_PATTERNS.items():
        text = re.sub(pattern, replacement, text)
    return text


if __name__ == "__main__":
    sample = (
        "Please contact John at john.doe@example.com or call 555-867-5309. "
        "His SSN is 123-45-6789."
    )
    print("Original:", sample)
    print("Redacted:", redact_pii(sample))
