# ADR 0003: Observability

Status: accepted

Local-first and free. Structured JSON logs via pino to stdout (redirect to a file when running), with secret fields redacted. Uncaught errors are logged and the process exits for a supervisor to restart. No hosted error tracker for now, because that needs a cloud account; revisit when hosting moves off the owner's PC. Model usage (calls, tokens, latency, optional cost) is tracked by a provider-agnostic `UsageTracker`, so it works for a local model as well as a paid API, and `overBudget` guards any paid provider. The model choice itself is still open.
