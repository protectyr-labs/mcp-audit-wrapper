import { describe, it, expect, vi } from 'vitest';
import { executeWithAudit, sanitizeParameters, summarizeResult } from '../src/index.js';
import type { AuditLogger, AuditEntry } from '../src/types.js';

function createMockLogger(): AuditLogger & { entries: AuditEntry[] } {
  const entries: AuditEntry[] = [];
  return { entries, log: vi.fn(async (entry: AuditEntry) => { entries.push(entry); }) };
}

describe('executeWithAudit', () => {
  it('logs successful execution', async () => {
    const logger = createMockLogger();
    const result = await executeWithAudit(logger, 'user-1', 'get_item', { id: '123' },
      async () => ({ name: 'Widget' }));
    expect(result).toEqual({ name: 'Widget' });
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0].result.success).toBe(true);
  });

  it('logs failed execution and rethrows', async () => {
    const logger = createMockLogger();
    await expect(
      executeWithAudit(logger, 'user-1', 'fail_tool', {},
        async () => { throw new Error('boom'); })
    ).rejects.toThrow('boom');
    expect(logger.entries).toHaveLength(1);
    expect(logger.entries[0].result.success).toBe(false);
    expect(logger.entries[0].result.error).toBe('boom');
  });
});

describe('sanitizeParameters', () => {
  it('redacts sensitive keys', () => {
    const result = sanitizeParameters({ name: 'test', apiToken: 'secret-123', password: 'hunter2' });
    expect(result.name).toBe('test');
    expect(result.apiToken).toBe('[REDACTED]');
    expect(result.password).toBe('[REDACTED]');
  });

  it('truncates long strings', () => {
    const result = sanitizeParameters({ content: 'x'.repeat(600) });
    expect((result.content as string).length).toBeLessThan(520);
    expect((result.content as string)).toContain('...[truncated]');
  });

  it('summarizes large arrays', () => {
    const result = sanitizeParameters({ items: Array.from({ length: 20 }, (_, i) => i) });
    expect(result.items).toBe('[Array with 20 items]');
  });
});

describe('summarizeResult', () => {
  it('summarizes arrays', () => {
    expect(summarizeResult([1, 2, 3])).toEqual({ type: 'array', count: 3 });
  });
  it('summarizes objects', () => {
    expect(summarizeResult({ a: 1, b: 2 })).toEqual({ type: 'object', keys: ['a', 'b'] });
  });
  it('passes through primitives', () => {
    expect(summarizeResult(42)).toBe(42);
    expect(summarizeResult('hello')).toBe('hello');
    expect(summarizeResult(null)).toBe(null);
  });
});
