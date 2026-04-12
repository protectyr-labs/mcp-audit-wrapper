import { executeWithAudit, sanitizeParameters, summarizeResult, createConsoleLogger } from '../src/index';

async function main() {
  const logger = createConsoleLogger();

  // Successful operation
  console.log('--- Successful call ---');
  const user = await executeWithAudit(
    logger, 'user-42', 'get_user',
    { userId: 'u-123', includeProfile: true },
    async () => ({ id: 'u-123', name: 'Alice', email: 'alice@example.com' })
  );
  console.log('Result:', user);

  // Failed operation
  console.log('\n--- Failed call ---');
  try {
    await executeWithAudit(
      logger, 'user-42', 'delete_user',
      { userId: 'u-999' },
      async () => { throw new Error('User not found'); }
    );
  } catch (e) {
    console.log('Caught error:', (e as Error).message);
  }

  // Parameter sanitization demo
  console.log('\n--- Sanitization ---');
  const sanitized = sanitizeParameters({
    username: 'alice',
    apiToken: 'sk-secret-key-12345',
    password: 'hunter2',
    bio: 'x'.repeat(600),
    tags: Array.from({ length: 15 }, (_, i) => `tag-${i}`),
  });
  console.log('Sanitized:', JSON.stringify(sanitized, null, 2));

  // Result summarization demo
  console.log('\n--- Summarization ---');
  console.log('Array:', summarizeResult([1, 2, 3, 4, 5]));
  console.log('Object:', summarizeResult({ id: 1, name: 'test', data: [1, 2] }));
  console.log('Primitive:', summarizeResult(42));
  console.log('Null:', summarizeResult(null));
}

main().catch(console.error);
