import Redis from 'ioredis';

export let redis;

export async function connectRedis() {
  redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: 3,
    lazyConnect: true,
  });
  await redis.connect();
  redis.on('error', err => console.error('[Redis] Error:', err.message));
}
