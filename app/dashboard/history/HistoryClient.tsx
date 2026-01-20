"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { MdCompareArrows } from "react-icons/md";

type Site = {
  id: string;
  name: string;
  url: string;
};

type HistoryItem = {
  id: string;
  site_id: string;
  checked_at: string;
  has_changes: boolean;
  importance?: 'high' | 'medium' | 'low';
  changes_count?: number;
  ai_summary?: string;
  ai_intent?: string;
  ai_suggestions?: string;
  has_error: boolean;
  error_message?: string;
  check_duration_ms?: number;
  screenshot_url?: string;
  screenshot_before_url?: string;
  compared_snapshot_created_at?: string; // 比較対象の日時
  monitored_sites: {
    id: string;
    name: string;
    url: string;
  };
};

type Props = {
  user: any;
  sites: Site[];
  history: HistoryItem[];
  plan: string;
};

export default function HistoryClient({ user, sites, history, plan }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [filterSite, setFilterSite] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all"); // all, changes, no-changes, errors
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // URLパラメータからsite_idを取得して初期フィルタを設定
  useEffect(() => {
    const siteParam = searchParams.get('site');
    if (siteParam && sites.some(s => s.id === siteParam)) {
      setFilterSite(siteParam);
    }
  }, [searchParams, sites]);

  // スクロール位置を監視して「トップに戻る」ボタンの表示を制御
  useEffect(() => {
    const handleScroll = () => {
      // 300px以上スクロールしたらボタンを表示
      setShowScrollTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // トップにスムーズスクロール
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  const filteredHistory = history.filter((item) => {
    if (filterSite !== "all" && item.site_id !== filterSite) return false;
    if (filterType === "changes" && !item.has_changes) return false;
    if (filterType === "no-changes" && item.has_changes) return false;
    if (filterType === "errors" && !item.has_error) return false;
    return true;
  });

  const importanceConfig = {
    high: { color: "bg-red-100 text-red-700 border-red-200", icon: "🔴", label: "高" },
    medium: { color: "bg-yellow-100 text-yellow-700 border-yellow-200", icon: "🟡", label: "中" },
    low: { color: "bg-green-100 text-green-700 border-green-200", icon: "🟢", label: "低" },
  };

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!deleteTargetId) return;

    console.log('🗑️ クライアント: 削除開始 -', deleteTargetId);
    setIsDeleting(true);
    
    try {
      console.log('🗑️ クライアント: APIリクエスト送信中...');
      const response = await fetch(`/api/history/${deleteTargetId}/delete`, {
        method: 'DELETE',
      });

      console.log('🗑️ クライアント: APIレスポンス受信 -', response.status, response.ok);

      if (response.ok) {
        console.log('✅ クライアント: 削除成功 - ページリフレッシュ開始');
        // モーダルを閉じる
        setDeleteTargetId(null);
        setIsDeleting(false);
        // ページをリフレッシュして最新の履歴を表示
        router.refresh();
        // 少し遅延させてから完全リロード
        setTimeout(() => {
          window.location.reload();
        }, 100);
      } else {
        const data = await response.json();
        console.error('❌ クライアント: 削除失敗 -', data);
        alert(`削除に失敗しました: ${data.error || '不明なエラー'}`);
        setIsDeleting(false);
        setDeleteTargetId(null);
      }
    } catch (error: any) {
      console.error('❌ クライアント: 削除エラー -', error);
      alert(`削除に失敗しました: ${error.message || '不明なエラー'}`);
      setIsDeleting(false);
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" className="text-2xl font-bold text-primary-600">
              Competitive Watcher
            </Link>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link href="/dashboard/compare" className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center space-x-1 relative">
                <MdCompareArrows className="text-lg" />
                <span>スクショ比較</span>
                {plan === "free" && (
                  <span className="ml-1 px-1.5 py-0.5 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs font-bold rounded">
                    PRO
                  </span>
                )}
              </Link>
              <Link href="/dashboard/settings" className="text-sm text-gray-600 hover:text-gray-900">
                設定
              </Link>
              <button onClick={handleLogout} className="text-sm text-gray-600 hover:text-gray-900">
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* パンくず */}
        <div className="mb-6">
          <Link href="/dashboard" className="text-primary-600 hover:underline text-sm">
            ← ダッシュボードに戻る
          </Link>
        </div>

        {/* ヘッダー */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">チェック履歴</h1>
              <p className="text-gray-600">過去のサイトチェック結果を確認できます</p>
            </div>
            {filterSite !== "all" && (
              <button
                onClick={() => setFilterSite("all")}
                className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
              >
                フィルタをクリア
              </button>
            )}
          </div>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* サイトフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center">
                サイトで絞り込み
                {filterSite !== "all" && (
                  <span className="ml-2 px-2 py-0.5 bg-primary-100 text-primary-700 text-xs rounded-full">
                    フィルタ適用中
                  </span>
                )}
              </label>
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              >
                <option value="all">すべてのサイト</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 結果フィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                結果で絞り込み
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent text-gray-900"
              >
                <option value="all">すべて</option>
                <option value="changes">変更あり</option>
                <option value="no-changes">変更なし</option>
                <option value="errors">エラー</option>
              </select>
            </div>
          </div>

          <div className="mt-4 text-sm text-gray-600">
            {filteredHistory.length}件の履歴
          </div>
        </div>

        {/* 履歴リスト */}
        <div className="space-y-4">
          {filteredHistory.length === 0 ? (
            <div className="bg-white rounded-lg shadow p-12 text-center">
              <p className="text-gray-500">履歴がありません</p>
            </div>
          ) : (
            filteredHistory.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg shadow hover:shadow-md transition p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2 justify-between">
                      <div className="flex items-center space-x-3">
                        <Link
                          href={`/dashboard/sites/${item.site_id}`}
                          className="text-lg font-semibold text-gray-900 hover:text-primary-600"
                        >
                          {item.monitored_sites.name}
                        </Link>
                        {item.has_error ? (
                          <span className="px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                            ❌ エラー
                          </span>
                        ) : item.has_changes ? (
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-medium border ${
                              item.importance
                                ? importanceConfig[item.importance].color
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {item.importance
                              ? `${importanceConfig[item.importance].icon} 変更あり（${importanceConfig[item.importance].label}）`
                              : "変更あり"}
                          </span>
                        ) : (
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">
                            ✅ 変更なし
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => setDeleteTargetId(item.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="削除"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="text-sm text-gray-600 space-x-4">
                      <span>
                        📅 {new Date(item.checked_at).toLocaleString("ja-JP")}
                      </span>
                      {item.check_duration_ms && (
                        <span>⏱️ {(item.check_duration_ms / 1000).toFixed(1)}秒</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* エラーメッセージ */}
                {item.has_error && item.error_message && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <p className="text-sm text-red-700">{item.error_message}</p>
                  </div>
                )}

                {/* 変更内容 */}
                {item.has_changes && !item.has_error && (
                  <div className="space-y-3">
                    {/* 統計 */}
                    {item.changes_count && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 inline-block">
                        <span className="text-sm text-blue-700">
                          📊 変更箇所: <strong className="text-lg">{item.changes_count}</strong> 箇所
                        </span>
                      </div>
                    )}

                    {/* AI要約 */}
                    {item.ai_summary && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          📝 変更点
                        </h4>
                        <p className="text-sm text-gray-700 whitespace-pre-line">
                          {item.ai_summary}
                        </p>
                      </div>
                    )}

                    {/* マーケ意図 */}
                    {item.ai_intent && (
                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-2">
                          🎯 マーケ意図
                        </h4>
                        <p className="text-sm text-gray-700">{item.ai_intent}</p>
                      </div>
                    )}

                    {/* 推奨施策 */}
                    {item.ai_suggestions && (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                          <span className="mr-2">💡</span>
                          推奨施策
                        </h4>
                        <div className="space-y-2">
                          {item.ai_suggestions.split('\n').filter(s => s.trim()).map((suggestion, idx) => (
                            <div key={idx} className="flex items-start space-x-2 bg-white rounded p-3">
                              <div className="flex-shrink-0 w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                {idx + 1}
                              </div>
                              <p className="text-sm text-gray-700 flex-1">{suggestion}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* スクリーンショット比較 */}
                {item.screenshot_url && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                      <span className="text-lg mr-2">📸</span>
                      スクリーンショット比較
                      {item.screenshot_before_url && (
                        <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                          BEFORE/AFTER
                        </span>
                      )}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.screenshot_before_url && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="text-xs font-medium text-gray-700">
                              {item.compared_snapshot_created_at
                                ? new Date(item.compared_snapshot_created_at).toLocaleString('ja-JP', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })
                                : '前回チェック'}
                            </p>
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">BEFORE</span>
                          </div>
                          <div
                            className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-red-300 hover:border-red-500 transition-all"
                            onClick={() => setSelectedImage(item.screenshot_before_url!)}
                          >
                            <img
                              src={item.screenshot_before_url}
                              alt="前回チェック時のスクリーンショット"
                              className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                            />
                            <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                            <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-medium text-gray-700">
                            {item.screenshot_before_url 
                              ? new Date(item.checked_at).toLocaleString('ja-JP', {
                                  year: 'numeric',
                                  month: 'short',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })
                              : 'チェック時'}
                          </p>
                          {item.screenshot_before_url && (
                            <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">AFTER</span>
                          )}
                        </div>
                        <div
                          className={`relative group cursor-pointer overflow-hidden rounded-lg border-2 ${
                            item.screenshot_before_url ? 'border-green-300 hover:border-green-500' : 'border-gray-300 hover:border-gray-500'
                          } transition-all`}
                          onClick={() => setSelectedImage(item.screenshot_url!)}
                        >
                          <img
                            src={item.screenshot_url}
                            alt="今回チェック時のスクリーンショット"
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-3 text-center">
                      クリックで拡大表示
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-95 overflow-auto"
          onClick={() => setSelectedImage(null)}
        >
          <div className="min-h-full flex flex-col">
            {/* 閉じるボタン */}
            <div className="sticky top-0 z-10 p-4 flex justify-end bg-gradient-to-b from-black to-transparent">
              <button
                onClick={() => setSelectedImage(null)}
                className="bg-white text-gray-900 rounded-full w-12 h-12 flex items-center justify-center hover:bg-gray-200 transition shadow-lg"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 画像表示エリア */}
            <div className="flex-1 px-4 pb-4">
              <img
                src={selectedImage}
                alt="スクリーンショット拡大"
                className="w-full h-auto rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </div>
            
            {/* スクロールヒント */}
            <div className="sticky bottom-0 p-4 text-center bg-gradient-to-t from-black to-transparent">
              <p className="text-white text-sm opacity-75">
                スクロールして全体を確認できます
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 削除確認モーダル */}
      {deleteTargetId && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-slideUp">
            {/* ヘッダー */}
            <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 text-white">
              <div className="flex items-center space-x-3">
                <div className="bg-white bg-opacity-20 rounded-full p-3">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-2xl font-bold">履歴を削除</h3>
                  <p className="text-red-100 text-sm mt-1">この操作は取り消せません</p>
                </div>
              </div>
            </div>

            {/* コンテンツ */}
            <div className="p-6">
              <p className="text-gray-700 mb-4">
                このチェック履歴を完全に削除します。
              </p>
              <ul className="space-y-2 text-sm text-gray-600 bg-gray-50 rounded-lg p-4 mb-6">
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>チェック結果とAI分析が削除されます</span>
                </li>
                <li className="flex items-start">
                  <svg className="w-5 h-5 mr-2 text-red-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span>スクリーンショットが削除されます</span>
                </li>
              </ul>

              {/* ボタン */}
              <div className="flex space-x-3">
                <button
                  onClick={() => setDeleteTargetId(null)}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium disabled:opacity-50"
                >
                  キャンセル
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all font-medium shadow-lg disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      削除中...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      削除する
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* トップに戻るボタン */}
      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 left-8 bg-primary-600 text-white p-4 rounded-full shadow-lg hover:bg-primary-700 transition-all duration-300 z-40 animate-fadeIn"
          aria-label="トップに戻る"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M5 10l7-7m0 0l7 7m-7-7v18"
            />
          </svg>
        </button>
      )}
    </div>
  );
}
