# Architecture

## Problem Context

In a production MCP server with 12+ tools, every tool call must be logged for
debugging and compliance. Each tool has different parameter shapes — some contain
secrets (API keys), some have large payloads (file contents), and failures must
be logged without suppressing the error.

## Approach

A higher-order function that wraps any async handler. The caller provides a
storage-agnostic `AuditLogger` interface — the wrapper handles timing, parameter
sanitization, result summarization, and error logging.

## Alternatives Considered

| Option | Pros | Cons | Why Not |
|--------|------|------|---------|
| Middleware pattern | Familiar to Express/Koa users | Requires framework, doesn't compose with arbitrary handlers | MCP servers don't use HTTP middleware |
| Decorator pattern | Clean syntax in languages with decorators | TypeScript decorators are stage 3, not stable | Stability concern for a library |
| Manual logging in each handler | Maximum control | Boilerplate, easy to forget, inconsistent | The exact problem we're solving |
| AOP (aspect-oriented) | Powerful cross-cutting | Heavy, complex setup, hard to debug | Overkill for a single concern |

## Key Design Decisions

### Why HOF over middleware?
- **Decision:** Use a function wrapper, not a middleware chain.
- **Rationale:** Composes with any async function. No framework dependency. Works in MCP servers, API routes, queue handlers, or plain scripts.
- **Consequence:** Caller wraps each handler explicitly. More explicit than middleware but zero magic.

### Why rethrow errors after logging?
- **Decision:** Catch errors, log them, then rethrow.
- **Rationale:** Audit is observability, not control flow. The caller must still handle the error. Swallowing errors would change application behavior.
- **Consequence:** Error appears in both audit log and caller's catch block.

### Why truncate at 500 chars?
- **Decision:** Truncate string parameters longer than 500 characters.
- **Rationale:** Audit logs are for debugging, not data storage. A 50KB file content parameter would blow up log storage. 500 chars gives enough context to identify the issue.
- **Consequence:** Full parameter values are not recoverable from audit logs. Use application-level logging for full payloads.

### Why redact by key name pattern?
- **Decision:** Redact any key containing "password", "token", "secret", "key", or "credential".
- **Rationale:** Simple pattern matching catches most sensitive fields without configuration. No false negatives on common naming conventions.
- **Consequence:** May over-redact (e.g., "keyboard" contains "key"). Acceptable trade-off for security.

## Known Limitations

- No async timeout on the audit log write (if storage is slow, it blocks)
- Parameter sanitization is shallow (doesn't recurse into nested objects)
- Redaction patterns are English-only
- No batching — each call produces one log entry
