import { NextRequest, NextResponse } from 'next/server';
import { PaymentVerifier } from '@/lib/ai/payment-verifier';
import { rateLimit, getClientIp } from '@/lib/rate-limit';

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const rl = await rateLimit(`slip_verify:${ip}`, 'upload');
  if (!rl.allowed) {
    return NextResponse.json(
      { error: rl.error || 'Too many verification attempts. Please wait.' },
      { status: rl.reason === 'UNCONFIGURED' ? 503 : 429 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { slipBase64, expectedAmount, paymentMethod, selectedBank, orderId } = body;

    if (!slipBase64) {
      return NextResponse.json({ error: 'Slip image is required' }, { status: 400 });
    }

    const audit = await PaymentVerifier.verifyScreenshot({
      orderId: orderId || 'STANDALONE_AUDIT',
      screenshotUrlOrBase64: slipBase64,
      expectedAmount: Number(expectedAmount || 0),
      paymentMethod: paymentMethod || 'ONLINE_BANK',
      selectedBank: selectedBank || 'Meezan Bank',
    });

    return NextResponse.json({ success: true, audit });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : 'Slip verification failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

