"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

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
  change_percentage?: number;
  ai_summary?: string;
  ai_intent?: string;
  has_error: boolean;
  error_message?: string;
  check_duration_ms?: number;
  screenshot_url?: string;
  screenshot_before_url?: string;
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
};

export default function HistoryClient({ user, sites, history }: Props) {
  const router = useRouter();
  const [filterSite, setFilterSite] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all"); // all, changes, no-changes, errors
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">チェック履歴</h1>
          <p className="text-gray-600">過去のサイトチェック結果を確認できます</p>
        </div>

        {/* フィルター */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="grid md:grid-cols-2 gap-4">
            {/* サイトフィルター */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                サイトで絞り込み
              </label>
              <select
                value={filterSite}
                onChange={(e) => setFilterSite(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                    <div className="flex items-center space-x-3 mb-2">
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
                    {(item.changes_count || item.change_percentage) && (
                      <div className="flex space-x-4 text-sm">
                        {item.changes_count && (
                          <span className="text-gray-600">
                            変更箇所: <strong>{item.changes_count}</strong>
                          </span>
                        )}
                        {item.change_percentage && (
                          <span className="text-gray-600">
                            変更率: <strong>{item.change_percentage}%</strong>
                          </span>
                        )}
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
                  </div>
                )}

                {/* スクリーンショット */}
                {item.screenshot_url && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">
                      📸 スクリーンショット
                    </h4>
                    <div className="flex gap-4 overflow-x-auto">
                      <div className="flex-shrink-0">
                        <p className="text-xs text-gray-600 mb-2">チェック時</p>
                        <img
                          src={item.screenshot_url}
                          alt="チェック時のスクリーンショット"
                          className="w-64 h-auto border border-gray-300 rounded-lg cursor-pointer hover:opacity-80 transition"
                          onClick={() => setSelectedImage(item.screenshot_url!)}
                        />
                      </div>
                      {item.screenshot_before_url && (
                        <div className="flex-shrink-0">
                          <p className="text-xs text-gray-600 mb-2">変更前</p>
                          <img
                            src={item.screenshot_before_url}
                            alt="変更前のスクリーンショット"
                            className="w-64 h-auto border border-gray-300 rounded-lg cursor-pointer hover:opacity-80 transition"
                            onClick={() => setSelectedImage(item.screenshot_before_url!)}
                          />
                        </div>
                      )}
                    </div>
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-7xl max-h-full">
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 bg-white text-gray-900 rounded-full w-10 h-10 flex items-center justify-center hover:bg-gray-100 transition z-10"
            >
              ✕
            </button>
            <img
              src={selectedImage}
              alt="スクリーンショット拡大"
              className="max-w-full max-h-[90vh] rounded-lg shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
}
