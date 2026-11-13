# ADR 0008: TypeScript on Node everywhere

Status: accepted

Bot, backend and companion app are TypeScript on Node (20+), with discord.js for the bot, zod for validating untrusted input (GSI payloads, env config) and pino for logs. One language keeps the codebase small for a solo owner and lets the companion app reuse the same schema and adapter code.
