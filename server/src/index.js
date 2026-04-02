// ORIGO Server — entry point
import 'dotenv/config';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import express from 'express';
import { connectDB }    from './db/client.js';
import { connectRedis } from './cache/redis.js';
import { DeltaBroker }  from './ws/broker.js';
import { startTick }    from './jobs/tick.js';
import { startFossilJob } from './jobs/fossil.js';
import { startPoolJob }   from './jobs/pool.js';
import { authRouter }     from './api/auth.js';
import { factionRouter }  from './api/faction.js';
import { ghifrRouter }    from './api/ghifr.js';
import { voucherRouter }  from './api/voucher.js';

const PORT = process.env.PORT || 3000;

async function main() {
  console.log('🌌 ORIGO Server starting...');

  // Connect dependencies
  await connectDB();
  console.log('✓ PostgreSQL connected');

  await connectRedis();
  console.log('✓ Redis connected');

  // HTTP + WS server
  const app = express();
  app.use(express.json());

  // REST API routes
  app.use('/api/auth',    authRouter);
  app.use('/api/faction', factionRouter);
  app.use('/api/ghifr',   ghifrRouter);
  app.use('/api/voucher', voucherRouter);

  app.get('/health', (req, res) => res.json({ status: 'ok', ts: Date.now() }));

  const httpServer = createServer(app);
  const wss = new WebSocketServer({ server: httpServer });

  // WebSocket broker
  const broker = new DeltaBroker(wss);
  await broker.init();
  console.log('✓ WebSocket broker ready');

  // Start Conway tick loop
  startTick(broker);
  console.log('✓ Conway tick started');

  // Scheduled jobs
  startFossilJob();
  startPoolJob(broker);
  console.log('✓ Background jobs started');

  httpServer.listen(PORT, () => {
    console.log(`🚀 ORIGO Server live on port ${PORT}`);
  });
}

main().catch(err => {
  console.error('Fatal startup error:', err);
  process.exit(1);
});
