import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';

import { required } from '../common/config/env.config.js';

export const RedisProvider = {
  provide: 'REDIS_CLIENT',
  useFactory: async (): Promise<Redis> => {
    const Redis = await import('ioredis');
    const url = process.env.REDIS_URL;
    const explicitTls = process.env.REDIS_TLS;
    const schemeIsRediss = url?.startsWith('rediss://') ?? false;
    const schemeIsRedis = url?.startsWith('redis://') ?? false;
    const disableTls = explicitTls === 'false' || schemeIsRedis;
    const useTls = !disableTls && (explicitTls === 'true' || schemeIsRediss);
    const commonOptions: Partial<RedisOptions> = {
      lazyConnect: true,
      enableReadyCheck: false,
      maxRetriesPerRequest: null,
      retryStrategy: (times: number) => Math.min(times * 500, 10_000),
      connectTimeout: 15_000,
      commandTimeout: 15_000,
      keepAlive: 10_000,
    };

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
