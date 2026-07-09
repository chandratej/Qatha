import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { verifyPaymentSignature, fetchPayment } from '@/lib/razorpay';

/**
 * POST /api/payments/unlock/confirm
 * Server-side validation after Razorpay checkout — grants chapter_unlock only on captured payment.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      transaction_id,
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
    } = body;

    if (!transaction_id || !razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return NextResponse.json({ error: 'Incomplete payment response' }, { status: 400 });
    }

    if (!await verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 });
    }

    const supabase = createServiceClient();

    const { data: tx } = await supabase
      .from('transactions')
      .select('*')
      .eq('id', transaction_id)
      .single();

    if (!tx) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 });
    }

    if (tx.status === 'captured') {
      const { data: unlock } = await supabase
        .from('chapter_unlocks')
        .select('chapter_id')
        .eq('transaction_id', transaction_id)
        .maybeSingle();

      if (unlock) {
        const { data: chapter } = await supabase
          .from('chapters')
          .select('content')
          .eq('id', unlock.chapter_id)
          .single();
        return NextResponse.json({ content: chapter?.content, unlocked: true });
      }
    }

    const payment = await fetchPayment(razorpay_payment_id);

    if (payment.status !== 'captured' || payment.amount !== tx.total_amount_paise) {
      await supabase.from('transactions').update({
        status: 'failed',
        razorpay_payment_id,
        failure_reason: `Payment status: ${payment.status}`,
      }).eq('id', transaction_id);

      return NextResponse.json({ error: 'Payment not captured' }, { status: 402 });
    }

    const transferId = (payment as { transfers?: { items?: Array<{ id: string }> } }).transfers?.items?.[0]?.id ?? null;

    await supabase.from('transactions').update({
      status: 'captured',
      razorpay_payment_id,
      razorpay_transfer_id: transferId,
      captured_at: new Date().toISOString(),
    }).eq('id', transaction_id);

    await supabase.from('chapter_unlocks').upsert({
      reader_id: tx.reader_id,
      chapter_id: tx.chapter_id,
      transaction_id: transaction_id,
    }, { onConflict: 'reader_id,chapter_id' });

    const { data: chapter } = await supabase
      .from('chapters')
      .select('content')
      .eq('id', tx.chapter_id)
      .eq('status', 'published')
      .single();

    return NextResponse.json({
      unlocked: true,
      content: chapter?.content ?? null,
      platform_fee_paise: tx.platform_fee_paise,
      creator_payout_paise: tx.creator_payout_paise,
    });
  } catch (err) {
    console.error('[unlock/confirm]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Confirmation failed' },
      { status: 500 },
    );
  }
}