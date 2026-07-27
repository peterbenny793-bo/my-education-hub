"""XSS protection — sanitize all incoming user input."""

import bleach

ALLOWED_TAGS = []
ALLOWED_ATTRS = {}

def clean(text: str, max_length: int = 1000) -> str:
    if text is None:
        return ""
    text = str(text)[:max_length]
    return bleach.clean(text, tags=ALLOWED_TAGS, attributes=ALLOWED_ATTRS, strip=True)