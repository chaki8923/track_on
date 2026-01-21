import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { deleteScreenshot } from '@/lib/r2'

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await request.json()
  const { url, name, is_active } = body

  // 所有権確認
  const { data: site } = await supabase
    .from('monitored_sites')
    .select('user_id')
    .eq('id', params.id)
    .single()

  if (!site || site.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 更新
  const updateData: any = {}
  if (url !== undefined) updateData.url = url
  if (name !== undefined) updateData.name = name
  if (is_active !== undefined) updateData.is_active = is_active

  const { data: updatedSite, error } = await supabase
    .from('monitored_sites')
    .update(updateData)
    .eq('id', params.id)
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ site: updatedSite })
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const supabase = createClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 所有権確認
  const { data: site } = await supabase
    .from('monitored_sites')
    .select('user_id, name')
    .eq('id', params.id)
    .single()

  if (!site || site.user_id !== session.user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    console.log(`🗑️ サイト削除開始: ${site.name} (ID: ${params.id})`);

    // 1. このサイトに関連する全てのスクリーンショットURLを取得
    const { data: snapshots } = await supabase
      .from('site_snapshots')
      .select('screenshot_url')
      .eq('site_id', params.id);

    const { data: checkHistory } = await supabase
      .from('site_check_history')
      .select('screenshot_url, screenshot_before_url')
      .eq('site_id', params.id);

    // 2. R2から全てのスクリーンショットを削除
    const screenshotUrls = new Set<string>();
    
    // スナップショットのスクショURL
    snapshots?.forEach(snap => {
      if (snap.screenshot_url) {
        screenshotUrls.add(snap.screenshot_url);
      }
    });

    // チェック履歴のスクショURL
    checkHistory?.forEach(history => {
      if (history.screenshot_url) {
        screenshotUrls.add(history.screenshot_url);
      }
      if (history.screenshot_before_url) {
        screenshotUrls.add(history.screenshot_before_url);
      }
    });

    console.log(`📸 削除するスクリーンショット数: ${screenshotUrls.size}`);

    // R2から削除（並列実行）
    const deletePromises = Array.from(screenshotUrls).map(async (url) => {
      try {
        await deleteScreenshot(url);
        console.log(`✅ R2から削除: ${url}`);
      } catch (error) {
        console.error(`⚠️ R2削除失敗（続行）: ${url}`, error);
      }
    });

    await Promise.all(deletePromises);

    // 3. データベースから削除（ON DELETE CASCADEで関連データも自動削除）
    // 削除される関連テーブル:
    // - site_snapshots
    // - site_changes
    // - site_check_history
    const { error } = await supabase
      .from('monitored_sites')
      .delete()
      .eq('id', params.id)

    if (error) {
      throw new Error(`データベース削除エラー: ${error.message}`);
    }

    console.log(`✅ サイトとすべての関連データを削除しました: ${site.name}`);

    return NextResponse.json({ 
      success: true,
      message: 'サイトとすべての関連データを削除しました',
      deletedScreenshots: screenshotUrls.size,
    });
  } catch (error: any) {
    console.error('❌ サイト削除エラー:', error);
    return NextResponse.json(
      { error: error.message || 'サイトの削除に失敗しました' },
      { status: 500 }
    );
  }
}

