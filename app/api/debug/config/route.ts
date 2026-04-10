/**
 * Debug endpoint to check current environment configuration
 * REMOVE THIS IN PRODUCTION - Only for development/troubleshooting
 */

import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    timestamp: new Date().toISOString(),
    appUrl: process.env.NEXT_PUBLIC_APP_URL || 'NOT_SET',
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 50) + '...' || 'NOT_SET',
    nodeEnv: process.env.NODE_ENV,
    vercelEnv: process.env.VERCEL_ENV,
    vercelUrl: process.env.VERCEL_URL,
  }, {
    headers: {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
    },
  });
}
