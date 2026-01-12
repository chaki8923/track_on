import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import { scrapeSite } from '@/lib/scraper';
import { compareContent, calculateImportance } from '@/lib/differ';
import { analyzeDiff } from '@/lib/gemini';
import { notifyChange } from '@/lib/notifications';
import { uploadScreenshot, isR2Configured } from '@/lib/r2';

/**
 * 手動チェックエンドポイント（テスト用）
 */
export async function POST(
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

  // サイト情報を取得
  const { data: site, error: siteError } = await supabase
    .from('monitored_sites')
    .select('*')
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .single();

  if (siteError || !site) {
    return NextResponse.json({ error: 'Site not found' }, { status: 404 });
  }

  try {
    const startTime = Date.now();
    
    // R2が設定されている場合はスクリーンショットを撮影
    const takeScreenshot = isR2Configured();
    
    // スクレイピング実行
    const scrapedContent = await scrapeSite(site.url, { takeScreenshot });

    // 前回のスナップショットを取得
    const { data: lastSnapshot } = await supabase
      .from('site_snapshots')
      .select('*')
      .eq('site_id', site.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // スナップショットを保存
    const { data: newSnapshot, error: snapshotError } = await supabase
      .from('site_snapshots')
      .insert({
        site_id: site.id,
        html_content: scrapedContent.cleanedHtml,
      })
      .select()
      .single();

    if (snapshotError) {
      throw new Error(`スナップショット保存エラー: ${snapshotError.message}`);
    }

    // スクリーンショットをR2にアップロード
    let screenshotUrl: string | null = null;
    if (scrapedContent.screenshot && takeScreenshot) {
      try {
        screenshotUrl = await uploadScreenshot(
          scrapedContent.screenshot,
          site.id,
          Date.now()
        );
        console.log(`スクリーンショットをアップロード: ${screenshotUrl}`);
      } catch (uploadError) {
        console.error('スクリーンショットのアップロードに失敗:', uploadError);
        // アップロード失敗してもチェックは続行
      }
    }

    // 差分チェック
    let checkHistoryData: any = {
      site_id: site.id,
      has_changes: false,
      check_duration_ms: 0,
      screenshot_url: screenshotUrl,
    };

    if (lastSnapshot) {
      const diffResult = compareContent(
        lastSnapshot.html_content,
        scrapedContent.cleanedHtml
      );

      if (diffResult.hasChanges) {
        // AI分析
        const aiAnalysis = await analyzeDiff(
          site.name,
          diffResult.addedLines,
          diffResult.removedLines
        );

        const importance = calculateImportance(diffResult);

        // 変更を保存
        const { data: change } = await supabase.from('site_changes').insert({
          site_id: site.id,
          previous_snapshot_id: lastSnapshot.id,
          current_snapshot_id: newSnapshot.id,
          diff_summary: diffResult,
          ai_summary: aiAnalysis.summary,
          ai_intent: aiAnalysis.intent,
          ai_suggestions: aiAnalysis.suggestions.join('\n'),
          importance,
          notified: false,
        }).select().single();

        // 履歴データを更新
        checkHistoryData = {
          ...checkHistoryData,
          has_changes: true,
          change_id: change?.id,
          importance,
          changes_count: diffResult.changesCount,
          change_percentage: diffResult.changePercentage,
          ai_summary: aiAnalysis.summary,
          ai_intent: aiAnalysis.intent,
        };

        // 通知を送信
        if (change) {
          try {
            // ユーザー情報を取得
            const { data: user } = await supabase.auth.getUser();
            
            // プロフィールから通知設定を取得
            const { data: profile } = await supabase
              .from('profiles')
              .select('notification_email, notification_slack, slack_webhook_url')
              .eq('id', session.user.id)
              .single();

            if (profile && (profile.notification_email || profile.notification_slack)) {
              await notifyChange(
                user?.user?.email || '',
                profile.slack_webhook_url,
                {
                  siteName: site.name,
                  url: site.url,
                  importance,
                  summary: aiAnalysis.summary,
                  intent: aiAnalysis.intent,
                  suggestions: aiAnalysis.suggestions.join('\n'),
                }
              );

              // 通知済みフラグを更新
              await supabase
                .from('site_changes')
                .update({ notified: true })
                .eq('id', change.id);
            }
          } catch (notifyError) {
            console.error('Notification error:', notifyError);
            // 通知失敗してもエラーにはしない
          }
        }

        // 最終チェック時刻を更新
        await supabase
          .from('monitored_sites')
          .update({ last_checked_at: new Date().toISOString() })
          .eq('id', site.id);

        // チェック時間を計算
        const duration = Date.now() - startTime;
        checkHistoryData.check_duration_ms = duration;

        // チェック履歴を保存
        await supabase.from('site_check_history').insert(checkHistoryData);

        return NextResponse.json({
          hasChanges: true,
          diffResult,
          aiAnalysis,
          importance,
        });
      }
    }

    // 最終チェック時刻を更新
    await supabase
      .from('monitored_sites')
      .update({ last_checked_at: new Date().toISOString() })
      .eq('id', site.id);

    // チェック時間を計算
    const duration = Date.now() - startTime;
    checkHistoryData.check_duration_ms = duration;

    // チェック履歴を保存（変更なし）
    await supabase.from('site_check_history').insert(checkHistoryData);

    return NextResponse.json({
      hasChanges: false,
      message: '変更は検出されませんでした',
    });
  } catch (error: any) {
    console.error('Check error:', error);
    
    // エラーも履歴に記録
    try {
      await supabase.from('site_check_history').insert({
        site_id: params.id,
        has_changes: false,
        has_error: true,
        error_message: error.message,
        check_duration_ms: Date.now() - Date.now(), // エラー時は0
      });
    } catch (historyError) {
      console.error('Failed to save error history:', historyError);
    }
    
    return NextResponse.json(
      { error: error.message || 'チェックに失敗しました' },
      { status: 500 }
    );
  }
}

