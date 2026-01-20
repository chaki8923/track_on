import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * ユーザーの全サイトのスナップショット一覧を取得
 */
export async function GET(request: Request) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // URLパラメータからsite_idを取得（オプション）
  const { searchParams } = new URL(request.url);
  const siteId = searchParams.get('site_id');

  // ユーザーが所有するサイトのIDを取得
  const { data: sites, error: sitesError } = await supabase
    .from('monitored_sites')
    .select('id')
    .eq('user_id', session.user.id);

  if (sitesError || !sites || sites.length === 0) {
    return NextResponse.json({ snapshots: [] });
  }

  const siteIds = sites.map((s) => s.id);

  // site_check_historyからスクリーンショットを取得
  // これにより、履歴削除時にスクリーンショットも比較画面から消える
  let query = supabase
    .from('site_check_history')
    .select(`
      id,
      site_id,
      checked_at,
      screenshot_url,
      monitored_sites (
        id,
        name,
        url
      )
    `)
    .in('site_id', siteIds)
    .not('screenshot_url', 'is', null)
    .order('checked_at', { ascending: false })
    .limit(100);

  // site_idが指定されている場合はフィルタ
  if (siteId) {
    query = query.eq('site_id', siteId);
  }

  const { data: snapshots, error } = await query;

  if (error) {
    console.error('Error fetching snapshots:', error);
    return NextResponse.json({ error: 'Failed to fetch snapshots' }, { status: 500 });
  }

  return NextResponse.json({ snapshots: snapshots || [] });
}
