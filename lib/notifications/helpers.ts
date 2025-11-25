// Notification utilities for common notification scenarios

/**
 * Send notification when receipt is successfully processed
 */
export async function notifyReceiptProcessed(
  userId: string,
  receiptData: {
    totalAmount: number;
    pointsEarned: number;
    businessName: string;
  }
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        userId,
        title: 'Receipt Processed! 🎉',
        message: `You earned ${receiptData.pointsEarned} points from ${receiptData.businessName}!`,
        data: {
          type: 'receipt_processed',
          amount: receiptData.totalAmount.toString(),
          points: receiptData.pointsEarned.toString(),
        },
      }),
    });

    if (!response.ok) {
      console.error('[Notifications] Failed to send receipt processed notification');
    }
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
  }
}

/**
 * Send notification when points are awarded
 */
export async function notifyPointsAwarded(
  userId: string,
  points: number,
  reason: string
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        userId,
        title: 'Points Earned! ⭐',
        message: `You earned ${points} points: ${reason}`,
        data: {
          type: 'points_awarded',
          points: points.toString(),
          reason,
        },
      }),
    });

    if (!response.ok) {
      console.error('[Notifications] Failed to send points awarded notification');
    }
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
  }
}

/**
 * Send notification when a reward is available
 */
export async function notifyRewardAvailable(
  userId: string,
  rewardName: string,
  pointsRequired: number
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        userId,
        title: 'New Reward Available! 🎁',
        message: `You can now redeem ${rewardName} for ${pointsRequired} points`,
        data: {
          type: 'reward_available',
          reward: rewardName,
          points: pointsRequired.toString(),
          url: '/dashboard/customer/rewards',
        },
      }),
    });

    if (!response.ok) {
      console.error('[Notifications] Failed to send reward available notification');
    }
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
  }
}

/**
 * Send notification about new deals nearby
 */
export async function notifyDealsNearby(
  userId: string,
  dealCount: number,
  businessName: string
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'user',
        userId,
        title: 'New Deals Nearby! 🔥',
        message: `${businessName} has ${dealCount} new ${dealCount === 1 ? 'deal' : 'deals'} available`,
        data: {
          type: 'deals_nearby',
          count: dealCount.toString(),
          business: businessName,
          url: '/dashboard/customer',
        },
      }),
    });

    if (!response.ok) {
      console.error('[Notifications] Failed to send deals nearby notification');
    }
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
  }
}

/**
 * Send notification to multiple users (topic-based)
 */
export async function notifyTopic(
  topic: string,
  title: string,
  message: string,
  data?: Record<string, string>
) {
  try {
    const response = await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'topic',
        topic,
        title,
        message,
        data,
      }),
    });

    if (!response.ok) {
      console.error('[Notifications] Failed to send topic notification');
    }
  } catch (error) {
    console.error('[Notifications] Error sending notification:', error);
  }
}
