// DeltaBroker — manages all WebSocket connections + broadcasts
import { WebSocket } from 'ws';
import jwt from 'jsonwebtoken';
import { getSnapshot, placeCells } from '../jobs/tick.js';
import { WS } from '@origo/core/src/constants.js';

export class DeltaBroker {
  constructor(wss) {
    this.wss     = wss;
    this.clients = new Map(); // ws → { factionId, userId }
  }

  async init() {
    this.wss.on('connection', (ws, req) => {
      this._handleConnect(ws, req);
    });
  }

  _handleConnect(ws, req) {
    // Authenticate via token in query string
    const url   = new URL(req.url, 'http://localhost');
    const token = url.searchParams.get('token');

    let payload;
    try {
      payload = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      ws.close(4001, 'Unauthorized');
      return;
    }

    const meta = { factionId: payload.factionId, userId: payload.userId };
    this.clients.set(ws, meta);

    console.log(`[WS] Connected: faction ${meta.factionId} (${this.clients.size} total)`);

    // Send full snapshot on connect
    const snap = getSnapshot();
    ws.send(JSON.stringify({ type: WS.SNAPSHOT, ...snap }));

    ws.on('message', (data) => this._handleMessage(ws, meta, data));

    ws.on('close', () => {
      this.clients.delete(ws);
      console.log(`[WS] Disconnected: faction ${meta.factionId} (${this.clients.size} total)`);
    });

    ws.on('error', (err) => {
      console.error('[WS] Client error:', err.message);
      this.clients.delete(ws);
    });
  }

  _handleMessage(ws, meta, data) {
    let msg;
    try { msg = JSON.parse(data); } catch { return; }

    switch (msg.type) {
      case 'place_cells':
        // Validate + place cells for this faction
        if (Array.isArray(msg.cells) && msg.cells.length <= 10) {
          placeCells(msg.cells, meta.factionId);
        }
        break;

      case WS.PING:
        ws.send(JSON.stringify({ type: WS.PONG }));
        break;

      default:
        // Ignore unknown message types
        break;
    }
  }

  broadcast(msg) {
    const payload = JSON.stringify(msg);
    let sent = 0;
    for (const [ws] of this.clients) {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(payload);
        sent++;
      }
    }
    return sent;
  }

  broadcastEvent(event, data) {
    this.broadcast({ type: WS.EVENT, event, data });
  }

  getConnectedCount() {
    return this.clients.size;
  }
}
