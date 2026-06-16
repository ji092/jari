import { NextResponse } from 'next/server';
import { getPool } from '../../../lib/db';
import { GuestbookEntry } from '../../../types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page  = Math.max(1, Number(searchParams.get('page')  ?? 1));
    const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? 20)));
    const offset = (page - 1) * limit;

    const pool = getPool();

    // Fetch paginated rows (latest first)
    // limit/offset are safe integers (validated above via Math.min/max/Number)
    const [rows] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, nickname, message,
              DATE_FORMAT(created_at, '%Y-%m-%dT%T.000Z') AS createdAt
       FROM guestbook
       ORDER BY created_at DESC
       LIMIT ${limit} OFFSET ${offset}`
    );

    // Total count for pagination info
    const [[countRow]] = await pool.execute<mysql.RowDataPacket[]>(
      'SELECT COUNT(*) AS total FROM guestbook'
    );

    return NextResponse.json({
      data:  rows as GuestbookEntry[],
      total: (countRow as mysql.RowDataPacket).total as number,
    });
  } catch (error) {
    console.error('[GET /api/guestbook]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { message } = body;

    // ── Validation ────────────────────────────────────────────────────────────
    if (
      !message ||
      typeof message !== 'string' ||
      message.trim().length === 0 ||
      message.length > 200
    ) {
      return NextResponse.json(
        { error: 'message는 1~200자 이내여야 합니다' },
        { status: 400 }
      );
    }

    // ── Sanitize (basic XSS prevention) ────────────────────────────────────────
    const sanitized = message
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;');

    // ── Optional: store hashed IP for abuse prevention ─────────────────────────
    const forwarded = request.headers.get('x-forwarded-for');
    const rawIp     = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    // Simple non-reversible hash — no crypto import needed in Edge/Node
    let ipHash = '';
    for (let i = 0; i < rawIp.length; i++) {
      ipHash = ((ipHash.charCodeAt(0) || 0) ^ rawIp.charCodeAt(i)).toString(16);
    }

    const pool = getPool();

    // ── Insert ──────────────────────────────────────────────────────────────────
    await pool.execute<mysql.ResultSetHeader>(
      `INSERT INTO guestbook (nickname, message, ip_hash)
       VALUES ('익명의 방문자', ?, ?)`,
      [sanitized, ipHash || null]
    );

    // Fetch the inserted row to return consistent shape
    const [[inserted]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, nickname, message,
              DATE_FORMAT(created_at, '%Y-%m-%dT%T.000Z') AS createdAt
       FROM guestbook
       WHERE id = (SELECT id FROM guestbook ORDER BY created_at DESC LIMIT 1)
       LIMIT 1`
    );

    return NextResponse.json(inserted as GuestbookEntry, { status: 201 });
  } catch (error) {
    console.error('[POST /api/guestbook]', error);
    return NextResponse.json(
      { error: 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// mysql2 types — re-export for convenience
import mysql from 'mysql2/promise';
