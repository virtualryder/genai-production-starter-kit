# Security Guardrails

## Key Risks in GenAI

- Prompt injection
- Data leakage
- Hallucinations
- Unauthorized access

---

## Controls Implemented

### 1. Input Validation
- Reject suspicious prompts
- Detect injection patterns

### 2. PII Protection
- Mask emails, phone numbers
- Prevent sensitive data exposure

### 3. Grounding
- Only answer from retrieved context
- Avoid hallucinations

### 4. Output Filtering
- Validate response format
- Remove unsafe content

### 5. Audit Logging
- Log all requests/responses
- Enable traceability

---

## Principle

**Never trust raw user input. Always validate, constrain, and log.**
