# mcp-audit-wrapper

> Transparent audit logging for any async operation.

[![CI](https://github.com/protectyr-labs/mcp-audit-wrapper/actions/workflows/ci.yml/badge.svg)](https://github.com/protectyr-labs/mcp-audit-wrapper/actions)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)

Wraps any async function with automatic audit logging. Sanitizes parameters (redacts secrets, truncates large values), summarizes results, and logs success or failure. Storage-agnostic -- bring your own logger.

## Quick Start

```bash
npm install @protectyr-labs/mcp-audit-wrapper
```

```typescript
import { executeWithAudit, createConsoleLogger } from '@protectyr-labs/mcp-audit-wrapper';

const logger = createConsoleLogger();

const result = await executeWithAudit(
  logger,
  'user-123',          // userId
  'get_customer',      // toolName
  { customerId: 'c-1' },
  async () => db.customers.findOne('c-1')
);
// Logs: { userId, toolName, parameters, result: { success: true, data: {...} }, timestamp }
```

## Why This?

- **One HOF, zero boilerplate** -- wrap any handler in one line, get full audit trail
- **Smart sanitization** -- redacts keys containing `password`, `token`, `secret`; truncates strings > 500 chars; summarizes arrays > 10 items
- **Errors logged, then rethrown** -- audit is observability, not control flow
- **Storage-agnostic** -- implement `AuditLogger` interface for your backend (Postgres, file, console)

## Use Cases

**Compliance and regulated industries** — Healthcare, finance, legal —
any system handling sensitive data needs audit trails. Wrap your data
access functions to log who accessed what, when, without storing the
actual sensitive content in audit logs.

**Incident response and forensics** — When investigating a security
incident, every analyst action must be traceable. This wrapper creates
an automatic chain of custody: who ran which tool, with what parameters,
and whether it succeeded or failed.

**MCP server observability** — You've built an MCP server with 10+ tools.
Users are calling them via Claude. You need to know which tools are used
most, which fail, and what parameters people pass — without reading
every conversation.

**Multi-tenant SaaS** — Multiple organizations share the same tools.
Audit logs track which user from which org performed each action.
The userId parameter ties every operation to an identity.

**PII-safe logging** — Standard logging captures everything, including
passwords and tokens in parameters. This wrapper automatically redacts
sensitive fields so your logs are safe to store, search, and share
with auditors.

## API

| Export | Description |
|--------|-------------|
| `executeWithAudit(logger, userId, toolName, params, handler)` | Wrap an async handler with audit logging |
| `sanitizeParameters(params)` | Redact secrets and truncate large values |
| `summarizeResult(result)` | Compact summary for storage (arrays, objects, primitives) |
| `createConsoleLogger()` | Dev-mode console logger; implement `AuditLogger` for production |

## Custom Logger

```typescript
import type { AuditLogger, AuditEntry } from '@protectyr-labs/mcp-audit-wrapper';

const pgLogger: AuditLogger = {
  async log(entry: AuditEntry) {
    await db.query(
      'INSERT INTO audit_log (user_id, tool, params, success, error, ts) VALUES ($1,$2,$3,$4,$5,$6)',
      [entry.userId, entry.toolName, JSON.stringify(entry.parameters),
       entry.result.success, entry.result.error, entry.timestamp]
    );
  },
};
```

## Limitations

- No async timeout on audit writes (slow storage blocks the handler)
- Parameter sanitization is shallow (does not recurse into nested objects)
- Redaction by key name only -- values are not inspected

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions.

Used by [mcp-exec-team](https://github.com/protectyr-labs/mcp-exec-team) for debate audit trails.

## License

MIT
