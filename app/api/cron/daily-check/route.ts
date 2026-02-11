import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Cron用エンドポイント（GitHub Actions用）
 * SUPABASE_SERVICE_ROLE_KEY で認証
 * 
 * 実行戦略:
 * - 1回の実行で最大10サイトまでチェック
 * - ユーザーのプランと daily_check_limit を考慮
 * - Proユーザーを優先
 * - 最終チェック時刻が古い順に優先
 */
export async function POST(request: Request) {
  // 認証チェック
  const authHeader = request.headers.get('authorization');
  const expectedToken = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!authHeader || authHeader !== `Bearer ${expectedToken}`) {
    console.error('[CRON] Unauthorized access attempt');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  console.log('[CRON] Daily check started at', new Date().toISOString());

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // 1. アクティブな監視サイトを取得
    const { data: sites, error: sitesError } = await supabase
      .from('monitored_sites')
      .select('id, name, url, is_active, last_checked_at, user_id')
      .eq('is_active', true)
      .order('last_checked_at', { ascending: true, nullsFirst: true });

    if (sitesError) {
      throw sitesError;
    }

    console.log(`[CRON] Found ${sites?.length || 0} active sites`);

    if (!sites || sites.length === 0) {
      return NextResponse.json({
        success: true,
        checkedCount: 0,
        results: [],
        message: 'No active sites to check',
        timestamp: new Date().toISOString(),
      });
    }

    // 2. ユニークなuser_idを抽出
    const userIds = [...new Set(sites.map(s => s.user_id))];

    // 3. ユーザーのプラン情報を取得
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, plan')
      .in('id', userIds);

    if (profilesError) {
      console.error('[CRON] Error fetching profiles:', profilesError);
      // プラン情報が取れない場合はfreeとして扱う
    }

    // 4. user_id -> plan のマップを作成
    const userPlanMap: Record<string, string> = {};
    if (profiles) {
      for (const profile of profiles) {
        userPlanMap[profile.id] = profile.plan || 'free';
      }
    }

    // 5. プラン別の daily_check_limit を定義
    const DAILY_CHECK_LIMITS: Record<string, number> = {
      free: 1,
      pro: 5,
      business: 999,
    };

    // 6. 今日のチェック回数をユーザーごとに集計
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: todayChecks } = await supabase
      .from('site_check_history')
      .select('site_id')
      .gte('created_at', today.toISOString());

    const checkCountByUser: Record<string, number> = {};
    
    if (todayChecks) {
      for (const check of todayChecks) {
        const site = sites.find(s => s.id === check.site_id);
        if (site) {
          checkCountByUser[site.user_id] = (checkCountByUser[site.user_id] || 0) + 1;
        }
      }
    }

    // 7. チェック可能なサイトをフィルタリング + 優先順位付け
    const eligibleSites = sites
      .map(site => {
        const plan = userPlanMap[site.user_id] || 'free';
        const limit = DAILY_CHECK_LIMITS[plan] || 1;
        const userCheckCount = checkCountByUser[site.user_id] || 0;
        const canCheck = userCheckCount < limit;

        // 優先度スコア: Proユーザー > 古いチェック
        const planPriority = plan === 'business' ? 3 : plan === 'pro' ? 2 : 1;
        const ageInHours = site.last_checked_at 
          ? (Date.now() - new Date(site.last_checked_at).getTime()) / (1000 * 60 * 60)
          : 999;

        return {
          ...site,
          plan,
          limit,
          userCheckCount,
          canCheck,
          priority: planPriority * 1000 + ageInHours,
        };
      })
      .filter(site => site.canCheck)
      .sort((a, b) => b.priority - a.priority);

    console.log(`[CRON] Eligible sites after plan filtering: ${eligibleSites.length}`);

    // 8. 最大10サイトに制限（タイムアウト回避）
    const BATCH_SIZE = 10;
    const sitesToCheck = eligibleSites.slice(0, BATCH_SIZE);

    console.log(`[CRON] Checking ${sitesToCheck.length} sites (batch size: ${BATCH_SIZE})`);

    const results = [];

    // 9. 各サイトをチェック
    for (const site of sitesToCheck) {
      try {
        // 内部APIを呼び出す（絶対URLが必要）
        const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.VERCEL_URL 
          ? `https://${process.env.VERCEL_URL}`
          : 'http://localhost:3000';
        
        const response = await fetch(
          `${appUrl}/api/sites/${site.id}/check`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            },
          }
        );

        const data = await response.json();

        results.push({
          siteId: site.id,
          siteName: site.name,
          userPlan: site.plan,
          success: response.ok,
          hasChanges: data.hasChanges || false,
        });

        console.log(
          `[CRON] Checked ${site.name} (${site.plan}): ${
            response.ok ? 'OK' : 'FAILED'
          }, Changes: ${data.hasChanges || false}`
        );

        // レート制限対策（2秒待機）
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        console.error(`[CRON] Error checking ${site.name}:`, err);
        results.push({
          siteId: site.id,
          siteName: site.name,
          userPlan: site.plan,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checkedCount: sitesToCheck.length,
      totalActiveSites: sites.length,
      eligibleSites: eligibleSites.length,
      batchSize: BATCH_SIZE,
      results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('[CRON] Daily check error:', error);
    return NextResponse.json(
      { error: error.message, timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}

// GETでも呼び出せるようにする（手動テスト用）
export async function GET(request: Request) {
  return POST(request);
}

