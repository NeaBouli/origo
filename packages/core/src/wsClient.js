// OrigoWSClient — shared WebSocket client
// Used by both web and mobile, platform-agnostic

import { WS } from './constants.js';
import { applyDelta, deserializeGrid } from './grid.js';

export class OrigoWSClient {
  constructor({ url, onDelta, onSnapshot, onGHIFR, onEvent, onConnect, onDisconnect }) {
    this.url          = url;
    this.onDelta      = onDelta      || (() => {});
    this.onSnapshot   = onSnapshot   || (() => {});
    this.onGHIFR      = onGHIFR      || (() => {});
    this.onEvent      = onEvent      || (() => {});
    this.onConnect    = onConnect    || (() => {});
    this.onDisconnect = onDisconnect || (() => {});
    this.ws           = null;
    this.reconnectMs  = 2000;
    this._pingInterval = null;
  }

  connect(token) {
    this.token = token;
    this._open();
  }

  _open() {
    this.ws = new WebSocket(`${this.url}?token=${this.token}`);

    this.ws.onopen = () => {
      console.log('[WS] Connected');
      this.onConnect();
      this._pingInterval = setInterval(() => this._send({ type: WS.PING }), 25000);
    };

    this.ws.onmessage = (evt) => {
      const msg = JSON.parse(evt.data);
      switch (msg.type) {
        case WS.DELTA:    this.onDelta(msg.cells, msg.gen);   break;
        case WS.SNAPSHOT: this.onSnapshot(deserializeGrid(msg.grid), msg.gen); break;
        case WS.GHIFR:    this.onGHIFR(msg.balance, msg.delta); break;
        case WS.EVENT:    this.onEvent(msg.event, msg.data);  break;
        case WS.PONG:     /* heartbeat ok */ break;
        default: console.warn('[WS] Unknown message type:', msg.type);
      }
    };

    this.ws.onclose = () => {
      console.log('[WS] Disconnected — reconnecting in', this.reconnectMs, 'ms');
      clearInterval(this._pingInterval);
      this.onDisconnect();
      setTimeout(() => this._open(), this.reconnectMs);
    };

    this.ws.onerror = (err) => {
      console.error('[WS] Error:', err.message);
    };
  }

  _send(msg) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(msg));
    }
  }

  placeCells(cells) {
    // cells: [[row, col], ...]  — place for own faction
    this._send({ type: 'place_cells', cells });
  }

  requestVoucher(ghifrAmount) {
    this._send({ type: 'request_voucher', amount: ghifrAmount });
  }

  disconnect() {
    clearInterval(this._pingInterval);
    this.ws?.close();
  }
}
