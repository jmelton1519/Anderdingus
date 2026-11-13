# ADR 0011: AI runtime via the Anthropic API behind a model interface

Status: accepted (supersedes the "model choice is still open" note in ADR 0003)

Responders call a small model interface, with a mock model for tests and local dev and the Anthropic TypeScript SDK as the real provider. Haiku 5.5 handles routine queries; Sonnet 5.5 handles harder analysis. The static system prompt is cached, calls are rate-limited, `UsageTracker.overBudget` guards spend, and a monthly cap is set in the Anthropic Console. API credits are unavailable until about 2026-11-20, so build against the mock first. Never commit API keys. The model only reads and rephrases; slash commands keep working without it.
