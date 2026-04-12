# mcp-audit-wrapper

Transparent audit logging HOF for MCP tool calls. Storage-agnostic, zero dependencies.

## Why This Exists

When building MCP servers, every tool call should be logged for debugging and compliance.
But scattering `await log(...)` calls in every handler is error-prone and clutters business
logic. This higher-order function wraps any async handler with automatic audit logging —
success or failure, with sanitized parameters and summarized results.


## Demo

Run the example to see audit logging in action:

```bash
npx tsx examples/basic.ts
```

```
--- Successful call ---
{
  "userId": "user-42",
  "toolName": "get_user",
  "parameters": {
    "userId": "u-123",
    "includeProfile": true
  },
  "result": {
    "success": true,
    "data": {
      "type": "object",
      "keys": ["id", "name", "email"]
    }
  },
  "timestamp": "2026-04-12T14:30:00.000Z"
}
Result: { id: 'u-123', name: 'Alice', email: 'alice@example.com' }

--- Failed call ---
{
  "userId": "user-42",
  "toolName": "delete_user",
  "parameters": {
    "userId": "u-999"
  },
  "result": {
    "success": false,
    "error": "User not found"
  },
  "timestamp": "2026-04-12T14:30:00.001Z"
}
Caught error: User not found

--- Sanitization ---
Sanitized: {
  "username": "alice",
  "apiToken": "[REDACTED]",
  "password": "[REDACTED]",
  "bio": "xxxxxxxxxxxxxxxxxxxx...[truncated]",
  "tags": "[Array with 15 items]"
}

--- Summarization ---
Array: { type: 'array', count: 5 }
Object: { type: 'object', keys: [ 'id', 'name', 'data' ] }
Primitive: 42
Null: null
```

Sensitive parameters (`apiToken`, `password`) are automatically redacted. Long strings are
truncated. Large arrays are summarized. Results are compacted for storage efficiency.

## Custom Logger Example

Implement `AuditLogger` to persist records to any storage backend:

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
