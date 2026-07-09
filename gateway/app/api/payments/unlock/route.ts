import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase';
import { createDestinationChargeOrder } from '@/lib/razorpay';
import { getChapterTeaser } from '@/lib/chapter';

/**
 * POST /api/payments/unlock
 * Creates a Razorpay Order with Route destination charge (40% platform / 60% creator).
 * Requires authenticated reader (session cookie / bearer from Supabase Auth).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { story_slug, chapter_number, chapter_id, story_id } = body;

    if (!story_slug || !chapter_number || !chapter_id || !story_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const authHeader = req.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '') || req.cookies.get('sb-access-token')?.value;

    const supabase = createServiceClient();

    let readerId: string | null = null;
    if (token) {
      const { data: { user } } = await supabase.auth.getUser(token);
      readerId = user?.id ?? null;
    }

    if (!readerId) {
      return NextResponse.json({ error: 'Sign in to unlock this chapter' }, { status: 401 });
    }

    const teaser = await getChapterTeaser(story_slug, Number(chapter_number));
    if (!teaser || teaser.chapter.id !== chapter_id) {
      return NextResponse.json({ error: 'Chapter not found' }, { status: 404 });
    }

    const { data: existingUnlock } = await supabase
      .from('chapter_unlocks')
      .select('id')
      .eq('reader_id', readerId)
      .eq('chapter_id', chapter_id)
      .maybeSingle();

    if (existingUnlock) {
      const { data: fullChapter } = await supabase
        .from('chapters')
        .select('content')
        .eq('id', chapter_id)
        .eq('status', 'published')
        .single();

      return NextResponse.json({
        already_unlocked: true,
        content: fullChapter?.content ?? null,
      });
    }

    const { data: story } = await supabase
      .from('stories')
      .select('id, author_id')
      .eq('id', story_id)
      .single();

    if (!story) {
      return NextResponse.json({ error: 'Story not found' }, { status: 404 });
    }

    const { data: creator } = await supabase
      .from('creators')
      .select('id, razorpay_linked_account_id, razorpay_route_status')
      .eq('id', story.author_id)
      .single();

    if (!creator?.razorpay_linked_account_id || creator.razorpay_route_status !== 'activated') {
      return NextResponse.json(
        { error: 'This chapter is not available for purchase yet' },
        { status: 503 },
      );
    }

    const amountPaise = teaser.chapter.unlock_price_paise;
    const idempotencyKey = `unlock:${readerId}:${chapter_id}`;

    const { data: pendingTx } = await supabase
      .from('transactions')
      .select('id, razorpay_order_id, status, total_amount_paise')
      .eq('idempotency_key', idempotencyKey)
      .in('status', ['created', 'authorized'])
      .maybeSingle();

    if (pendingTx?.razorpay_order_id) {
      return NextResponse.json({
        transaction_id: pendingTx.id,
        order_id: pendingTx.razorpay_order_id,
        amount_paise: pendingTx.total_amount_paise,
        currency: 'INR',
        razorpay_key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      });
    }

    const { order, split } = await createDestinationChargeOrder({
      amount_paise: amountPaise,
      receipt: `ch_${chapter_id.slice(0, 8)}_${Date.now()}`,
      linked_account_id: creator.razorpay_linked_account_id,
      notes: {
        reader_id: readerId,
        creator_id: creator.id,
        story_id,
        chapter_id,
        story_slug,
        chapter_number: String(chapter_number),
        type: 'chapter_unlock',
      },
    });

    const { data: transaction, error: txError } = await supabase
      .from('transactions')
      .insert({
        reader_id: readerId,
        creator_id: creator.id,
        story_id,
        chapter_id,
        total_amount_paise: split.total_amount_paise,
        platform_fee_paise: split.platform_fee_paise,
        creator_payout_paise: split.creator_payout_paise,
        platform_fee_pct: split.platform_fee_pct,
        currency: 'INR',
        razorpay_order_id: order.id,
        status: 'created',
        idempotency_key: idempotencyKey,
        metadata: {
          story_slug,
          chapter_number,
          razorpay_linked_account_id: creator.razorpay_linked_account_id,
        },
      })
      .select('id')
      .single();

    if (txError || !transaction) {
      return NextResponse.json({ error: txError?.message || 'Transaction record failed' }, { status: 500 });
    }

    return NextResponse.json({
      transaction_id: transaction.id,
      order_id: order.id,
      amount_paise: split.total_amount_paise,
      platform_fee_paise: split.platform_fee_paise,
      creator_payout_paise: split.creator_payout_paise,
      currency: 'INR',
      razorpay_key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (err) {
    console.error('[unlock]', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Payment initialization failed' },
      { status: 500 },
    );
  }
}