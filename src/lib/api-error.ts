import { NextResponse } from 'next/server';
import crypto from 'crypto';

/**
 * Safely logs internal errors server-side and returns a generic error message
 * with a unique requestId to the client, preventing internal exception/DB stack leaks.
 */
export function safeApiErrorResponse(
  error: unknown,
  genericMessage = 'An unexpected server error occurred',
  status = 500,
  request?: Request
): NextResponse {
  const requestId = request?.headers?.get('x-request-id') || crypto.randomUUID();
  console.error(`[API_ERROR][req:${requestId}] ${genericMessage}:`, error);
  return NextResponse.json(
    {
      error: genericMessage,
      requestId,
    },
    { status }
  );
}
