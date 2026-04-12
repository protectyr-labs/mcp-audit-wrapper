# mcp-audit-wrapper

Transparent audit logging HOF for MCP tool calls. Storage-agnostic, zero dependencies.

## Why This Exists

When building MCP servers, every tool call should be logged for debugging and compliance.
But scattering `await log(...)` calls in every handler is error-prone and clutters business
logic. This higher-order function wraps any async handler with automatic audit logging —
success or failure, with sanitized parameters and summarized results.

## Install

```bash
npm install @protectyr-labs/mcp-audit-wrapper
```

Or install from GitHub:
```bash
npm install github:protectyr-labs/mcp-audit-wrapper
```

## Quick Start

```typescript
import { executeWithAudit, createConsoleLogger } from '@protectyr-labs/mcp-audit-wrapper';

const logger = createConsoleLogger();

const result = await executeWithAudit(
  logger,
  'user-123',
  'get_customer',
  { customerId: 'cust-456' },
  async () => db.customers.findOne('cust-456')
);
// Logs: { userId, toolName, parameters, result: { success: true, data: {...} }, timestamp }
```

## API

### `executeWithAudit<T>(logger, userId, toolName, parameters, handler)`

Wraps an async handler with audit logging. Logs on success and failure. Rethrows errors after logging.

### `sanitizeParameters(params)`

Redacts sensitive keys (password, token, secret, key, credential). Truncates strings > 500 chars. Summarizes arrays > 10 items.

### `summarizeResult(result)`

Compact summaries for audit storage: arrays become `{ type: 'array', count: N }`, objects become `{ type: 'object', keys: [...] }`.

### `createConsoleLogger()`

Simple console logger for development. Implement `AuditLogger` interface for production storage.

### `AuditLogger` interface

```typescript
interface AuditLogger {
  log(entry: AuditEntry): Promise<void>;
}
```

Implement this to persist audit records to your database, file system, or logging service.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for design decisions.

## License

MIT — extracted from Protectyr's production MCP server.
