import { NextResponse } from 'next/server';
import mysql from 'mysql2/promise';
import { getPool } from '../../../lib/db';
import { GuestbookEntry } from '../../../types';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawPage  = Number(searchParams.get('page')  ?? 1);
    const rawLimit = Number(searchParams.get('limit') ?? 20);

    if (!Number.isInteger(rawPage) || !Number.isInteger(rawLimit)) {
      return NextResponse.json(
        { error: 'page와 limit은 정수여야 합니다' },
        { status: 400 }
      );
    }

    const page  = Math.max(1, rawPage);
    const limit = Math.min(50, Math.max(1, rawLimit));
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
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: '잘못된 요청 형식입니다' },
        { status: 400 }
      );
    }
    const { message } = body as { message?: unknown };

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
    const [result] = await pool.execute<mysql.ResultSetHeader>(
      `INSERT INTO guestbook (nickname, message, ip_hash)
       VALUES ('익명의 방문자', ?, ?)`,
      [sanitized, ipHash || null]
    );

    // Fetch the inserted row by its exact id (avoids race with concurrent inserts)
    const [[inserted]] = await pool.execute<mysql.RowDataPacket[]>(
      `SELECT id, nickname, message,
              DATE_FORMAT(created_at, '%Y-%m-%dT%T.000Z') AS createdAt
       FROM guestbook WHERE id = ?`,
      [result.insertId]
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

