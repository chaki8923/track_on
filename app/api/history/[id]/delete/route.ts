import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { deleteScreenshot } from '@/lib/r2';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  console.log('🔍 DELETE APIが呼ばれました');
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.error('❌ 履歴削除: 未認証');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const historyId = params.id;
  console.log(`🗑️ 履歴削除開始: historyId=${historyId}, userId=${session.user.id}`);

  try {

    // 履歴レコードを取得（サイトの所有者確認とスクリーンショットURL取得）
    console.log('📥 履歴レコード取得中...');
    const { data: history, error: fetchError } = await supabase
      .from('site_check_history')
      .select(`
        *,
        monitored_sites (
          user_id
        )
      `)
      .eq('id', historyId)
      .single();

    if (fetchError) {
      console.error('❌ 履歴取得エラー:', {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code
      });
      return NextResponse.json({ error: `履歴取得エラー: ${fetchError.message}` }, { status: 404 });
    }

    if (!history) {
      console.error('❌ 履歴が見つかりません');
      return NextResponse.json({ error: 'History not found' }, { status: 404 });
    }

    console.log('✅ 履歴レコード取得成功:', {
      historyId: history.id,
      siteId: history.site_id,
      siteOwner: history.monitored_sites?.user_id,
      currentUser: session.user.id,
      screenshotUrl: history.screenshot_url,
      screenshotBeforeUrl: history.screenshot_before_url
    });

    // ユーザーが所有者であることを確認
    if (history.monitored_sites?.user_id !== session.user.id) {
      console.error('❌ 履歴削除: 権限なし', {
        siteOwner: history.monitored_sites?.user_id,
        currentUser: session.user.id
      });
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('✅ 所有者確認OK');

    // R2からスクリーンショットを削除
    const deletePromises = [];
    
    if (history.screenshot_url) {
      console.log(`🗑️ R2画像削除: ${history.screenshot_url}`);
      deletePromises.push(deleteScreenshot(history.screenshot_url));
    }
    
    if (history.screenshot_before_url) {
      console.log(`🗑️ R2画像削除: ${history.screenshot_before_url}`);
      deletePromises.push(deleteScreenshot(history.screenshot_before_url));
    }

    // 並行して削除
    if (deletePromises.length > 0) {
      console.log(`🔄 R2画像削除処理実行中 (${deletePromises.length}件)...`);
      await Promise.all(deletePromises);
      console.log('✅ R2画像削除処理完了');
    } else {
      console.log('ℹ️ 削除するR2画像なし');
    }

    // DBから履歴を削除
    console.log('🗃️ DB削除開始...');
    const { error: deleteError, count } = await supabase
      .from('site_check_history')
      .delete({ count: 'exact' })
      .eq('id', historyId);

    if (deleteError) {
      console.error('❌ 履歴DB削除エラー:', {
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint,
        code: deleteError.code
      });
      return NextResponse.json({ error: `DB削除エラー: ${deleteError.message}` }, { status: 500 });
    }

    console.log(`✅ 履歴DB削除成功: historyId=${historyId}, 削除件数=${count}`);
    return NextResponse.json({ 
      message: 'History deleted successfully',
      deleted: true,
      historyId: historyId
    });
  } catch (error: any) {
    console.error('❌ 履歴削除APIエラー:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete history' }, { status: 500 });
  }
}
