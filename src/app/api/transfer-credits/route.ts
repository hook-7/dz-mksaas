import { transferCreditsAction } from '@/actions/transfer-credits';
import { NextResponse } from 'next/server';

/**
 * API route for transferring credits between users (admin only)
 *
 * POST /api/transfer-credits
 * Body: {
 *   fromUserId: string,
 *   toUserId: string,
 *   amount: number,
 *   description?: string
 * }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = await transferCreditsAction({
      fromUserId: body.fromUserId,
      toUserId: body.toUserId,
      amount: body.amount,
      description: body.description,
    });

    if (!result?.data?.success) {
      return NextResponse.json(
        {
          success: false,
          error: result?.data?.error || 'Failed to transfer credits',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Credits transferred successfully',
    });
  } catch (error) {
    console.error('Transfer credits API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
