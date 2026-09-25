/**
 * Tests must not open a developer database.
 * A test that intentionally talks to Postgres sets ALLOW_PG_POOL_IN_TEST=1 first.
 */
import pg from 'pg';

const DB_URL_VARS = [
  'DATABASE_URL',
  'LOCAL_DATABASE_URL',
  'TEST_DATABASE_URL',
  'UAT_DATABASE_URL',
  'POSTGRES_URL',
];

if (process.env.ALLOW_PG_POOL_IN_TEST !== '1') {
  for (const name of DB_URL_VARS) {
    process.env[name] = '';
  }
}

const OriginalPool = pg.Pool;

class GuardedPool extends OriginalPool {
  constructor(config?: ConstructorParameters<typeof OriginalPool>[0]) {
    if (process.env.ALLOW_PG_POOL_IN_TEST !== '1') {
      throw new Error(
        'pg.Pool was constructed during tests. Set ALLOW_PG_POOL_IN_TEST=1 before opening a database.'
      );
    }
    super(config);
  }
}

(pg as { Pool: typeof pg.Pool }).Pool = GuardedPool;
