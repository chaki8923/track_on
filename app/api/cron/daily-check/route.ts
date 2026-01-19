import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

/**
 * Cron用エンドポイント（GitHub Actions用）
 * SUPABASE_SERVICE_ROLE_KEY で認証
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
    // アクティブな監視サイトを取得
    const { data: sites, error } = await supabase
      .from('monitored_sites')
      .select('id, name, url, is_active')
      .eq('is_active', true);

    if (error) {
      throw error;
    }

    console.log(`[CRON] Found ${sites?.length || 0} active sites`);

    const results = [];

    // 各サイトをチェック
    for (const site of sites || []) {
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
          success: response.ok,
          hasChanges: data.hasChanges || false,
        });

        console.log(
          `[CRON] Checked ${site.name}: ${
            response.ok ? 'OK' : 'FAILED'
          }, Changes: ${data.hasChanges || false}`
        );

        // レート制限対策
        await new Promise((resolve) => setTimeout(resolve, 2000));
      } catch (err: any) {
        console.error(`[CRON] Error checking ${site.name}:`, err);
        results.push({
          siteId: site.id,
          siteName: site.name,
          success: false,
          error: err.message,
        });
      }
    }

    return NextResponse.json({
      success: true,
      checkedCount: sites?.length || 0,
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

