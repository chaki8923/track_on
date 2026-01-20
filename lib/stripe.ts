import Stripe from 'stripe';

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2025-02-24.acacia',
});

// プランIDを環境変数で管理
export const STRIPE_PLANS = {
  pro: {
    priceId: process.env.STRIPE_PRO_PRICE_ID || 'price_pro',
    name: 'Pro',
    price: 4800,
    sitesLimit: 5,
  },
  business: {
    priceId: process.env.STRIPE_BUSINESS_PRICE_ID || 'price_business',
    name: 'Business',
    price: 9800,
    sitesLimit: 20,
  },
};

/**
 * プランに応じた日次チェック制限を返す
 * @param plan ユーザーのプラン ('free', 'pro', 'business')
 * @returns 日次チェック制限数 (-1は無制限)
 */
export function getDailyCheckLimit(plan: string): number {
  switch (plan) {
    case 'free':
      return 3; // 無料プランは1日3回まで
    case 'pro':
      return 30; // Proプランは1日30回まで
    case 'business':
      return -1; // Businessプランは無制限
    default:
      return 3; // デフォルトは無料プラン
  }
}
