import type { AuditLogger, AuditEntry } from './types.js';

export type { AuditLogger, AuditEntry } from './types.js';

const SENSITIVE_KEYS = ['password', 'token', 'secret', 'key', 'credential'];
const MAX_STRING_LENGTH = 500;
const MAX_ARRAY_DISPLAY = 10;

export async function executeWithAudit<T>(
  logger: AuditLogger,
  userId: string,
  toolName: string,
  parameters: Record<string, unknown>,
  handler: () => Promise<T>,
): Promise<T> {
  const sanitized = sanitizeParameters(parameters);
  try {
    const result = await handler();
    await logger.log({
      userId, toolName, parameters: sanitized,
      result: { success: true, data: summarizeResult(result) },
      timestamp: new Date().toISOString(),
    });
    return result;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    await logger.log({
      userId, toolName, parameters: sanitized,
      result: { success: false, error: errorMessage },
      timestamp: new Date().toISOString(),
    });
    throw err;
  }
}

export function sanitizeParameters(params: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value == null) continue;
    if (SENSITIVE_KEYS.some((sk) => key.toLowerCase().includes(sk))) {
      sanitized[key] = '[REDACTED]';
      continue;
    }
    if (typeof value === 'string' && value.length > MAX_STRING_LENGTH) {
      sanitized[key] = value.substring(0, MAX_STRING_LENGTH) + '...[truncated]';
      continue;
    }
    if (Array.isArray(value) && value.length > MAX_ARRAY_DISPLAY) {
      sanitized[key] = `[Array with ${value.length} items]`;
      continue;
    }
    sanitized[key] = value;
  }
  return sanitized;
}

export function summarizeResult(result: unknown): unknown {
  if (result == null) return null;
  if (Array.isArray(result)) return { type: 'array', count: result.length };
  if (typeof result === 'object') return { type: 'object', keys: Object.keys(result) };
  return result;
}

export function createConsoleLogger(): AuditLogger {
  return {
    async log(entry: AuditEntry) {
      console.log(JSON.stringify(entry, null, 2));
    },
  };
}
