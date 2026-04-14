// BUG-001-D — Voucher API (GHIFR → IFR bridge)
import { Router } from 'express';
import { randomBytes } from 'crypto';
import { ethers } from 'ethers';
import { db } from '../db/client.js';
import { authenticateJWT } from './auth.js';
import { getBalance } from './ghifr.js';

export const voucherRouter = Router();

const GHIFR_TO_IFR_RATE = 1000n; // 1 GHIFR = 1000 IFR wei (configurable)
const MIN_GHIFR = 100;
const EXPIRY_HOURS = 24;

// POST /api/voucher/issue
voucherRouter.post('/issue', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.factionId) return res.status(404).json({ error: 'No faction' });

    const { ghifrAmount } = req.body;
    if (!ghifrAmount || ghifrAmount < MIN_GHIFR) {
      return res.status(400).json({ error: `Minimum ${MIN_GHIFR} GHIFR required` });
    }

    const balance = await getBalance(req.user.factionId);
    if (balance < ghifrAmount) {
      return res.status(400).json({ error: 'Insufficient GHIFR balance', balance });
    }

    const nonce = '0x' + randomBytes(32).toString('hex');
    const ifrAmount = BigInt(Math.floor(ghifrAmount)) * GHIFR_TO_IFR_RATE;
    const expiry = new Date(Date.now() + EXPIRY_HOURS * 3600_000);

    // EIP-712 signature
    const signerKey = process.env.VOUCHER_SIGNER_KEY;
    let signature = '0x00'; // placeholder if no signer configured
    if (signerKey) {
      const wallet = new ethers.Wallet(signerKey);
      const domain = {
        name: 'ORIGO',
        version: '1',
        chainId: 1, // mainnet
      };
      const types = {
        Voucher: [
          { name: 'nonce', type: 'bytes32' },
          { name: 'amount', type: 'uint256' },
          { name: 'expiry', type: 'uint256' },
        ],
      };
      const value = {
        nonce,
        amount: ifrAmount.toString(),
        expiry: Math.floor(expiry.getTime() / 1000),
      };
      signature = await wallet.signTypedData(domain, types, value);
    }

    // Deduct GHIFR
    await db.query(
      `INSERT INTO ghifr_ledger (faction_id, amount, type) VALUES ($1, $2, 'voucher_issued')`,
      [req.user.factionId, -ghifrAmount]
    );

    // Store voucher
    await db.query(
      `INSERT INTO vouchers (faction_id, nonce, ghifr_amount, ifr_amount, expiry, signature)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [req.user.factionId, nonce, ghifrAmount, ifrAmount.toString(), expiry, signature]
    );

    res.status(201).json({ nonce, ghifrAmount, ifrAmount: ifrAmount.toString(), expiry, signature });
  } catch (err) {
    console.error('[Voucher] Issue error:', err.message);
    res.status(500).json({ error: 'Failed to issue voucher' });
  }
});

// GET /api/voucher/list
voucherRouter.get('/list', authenticateJWT, async (req, res) => {
  try {
    if (!req.user.factionId) return res.status(404).json({ error: 'No faction' });
    const result = await db.query(
      `SELECT nonce, ghifr_amount, ifr_amount, expiry, status, created_at
       FROM vouchers WHERE faction_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.factionId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('[Voucher] List error:', err.message);
    res.status(500).json({ error: 'Failed to fetch vouchers' });
  }
});

// GET /api/voucher/status/:nonce
voucherRouter.get('/status/:nonce', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT nonce, ghifr_amount, ifr_amount, expiry, status FROM vouchers WHERE nonce = $1',
      [req.params.nonce]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Voucher not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('[Voucher] Status error:', err.message);
    res.status(500).json({ error: 'Failed to fetch voucher status' });
  }
});
