import { Redis } from 'ioredis';

import { required } from '../common/config/env.config.js';

export const RedisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: async (): Promise<Redis> => {
    const Redis = await import('ioredis');
    const url = process.env.REDIS_URL;
    const useTls = process.env.REDIS_TLS === 'true' || (url?.startsWith('rediss://') ?? false);
    const commonOptions = {
      lazyConnect: false,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => Math.min(times * 500, 5_000),
      connectTimeout: 10_000,
    } satisfies Partial<Redis.RedisOptions>;

    if (url) {
      const tlsOptions = useTls ? { tls: { rejectUnauthorized: false } } : {};
      return new Redis.default(url, { ...commonOptions, ...tlsOptions });
    }

    const host = required('REDIS_HOST');
    const port = Number(process.env.REDIS_PORT ?? (useTls ? '6380' : '6379'));
    const password = process.env.REDIS_PASSWORD;

    return new Redis.default({
      host,
      port,
      ...(useTls ? { tls: { servername: host, rejectUnauthorized: false } } : {}),
      ...(password ? { password } : {}),
      ...commonOptions,
    });
  },
};
