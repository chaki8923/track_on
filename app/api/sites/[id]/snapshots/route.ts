import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

/**
 * サイトの過去のスナップショット一覧を取得
 */
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // サイトの所有者確認
  const { data: site, error: siteError } = await supabase
    .from('monitored_sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  // 過去のスナップショットを取得（最新50件）
  const { data: snapshots, error: snapshotsError } = await supabase
    .from('site_snapshots')
    .select('id, created_at')
    .eq('site_id', params.id)
    .order('created_at', { ascending: false })
    .limit(50);

  if (snapshotsError) {
    return NextResponse.json(
      { error: 'Failed to fetch snapshots' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    snapshots: snapshots || [],
    count: snapshots?.length || 0,
  });
}
