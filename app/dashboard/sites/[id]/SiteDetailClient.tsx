"use client";

import Link from "next/link";
import { useState } from "react";

type Site = {
  id: string;
  url: string;
  name: string;
  last_checked_at: string | null;
  is_active: boolean;
  created_at: string;
};

type Change = {
  id: string;
  diff_summary: any;
  ai_summary: string;
  ai_intent: string;
  ai_suggestions: string;
  importance: string;
  created_at: string;
};

type Props = {
  site: Site;
  changes: Change[];
};

export default function SiteDetailClient({ site, changes }: Props) {
  const [selectedChange, setSelectedChange] = useState<Change | null>(null);

  const importanceColors = {
    high: "bg-red-100 text-red-700 border-red-200",
    medium: "bg-yellow-100 text-yellow-700 border-yellow-200",
    low: "bg-green-100 text-green-700 border-green-200",
  };

  const importanceLabels = {
    high: "🔴 高",
    medium: "🟡 中",
    low: "🟢 低",
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link
            href="/dashboard"
            className="text-2xl font-bold text-primary-600"
          >
            Competitive Watcher
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Link
            href="/dashboard"
            className="text-primary-600 hover:underline text-sm"
          >
            ← ダッシュボードに戻る
          </Link>
        </div>

        {/* サイト情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{site.name}</h1>
          <a
            href={site.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            {site.url} ↗
          </a>
          <div className="mt-4 flex items-center space-x-4 text-sm text-gray-600">
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                site.is_active
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-700"
              }`}
            >
              {site.is_active ? "監視中" : "停止中"}
            </span>
            {site.last_checked_at && (
              <span>
                最終チェック:{" "}
                {new Date(site.last_checked_at).toLocaleString("ja-JP")}
              </span>
            )}
          </div>
        </div>

        {/* 変更履歴 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">変更履歴</h2>
            <p className="text-sm text-gray-600 mt-1">
              過去20件の変更を表示
            </p>
          </div>

          {changes.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">まだ変更が検出されていません</p>
            </div>
          ) : (
            <div className="divide-y">
              {changes.map((change) => (
                <div key={change.id} className="p-6 hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium border ${
                            importanceColors[
                              change.importance as keyof typeof importanceColors
                            ]
                          }`}
                        >
                          {
                            importanceLabels[
                              change.importance as keyof typeof importanceLabels
                            ]
                          }
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(change.created_at).toLocaleString("ja-JP")}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* AI要約 */}
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        📝 変更点
                      </h3>
                      <div className="text-sm text-gray-600 whitespace-pre-line bg-gray-50 p-3 rounded">
                        {change.ai_summary}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        🎯 マーケ意図
                      </h3>
                      <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded">
                        {change.ai_intent}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-semibold text-gray-700 mb-2">
                        💡 推奨施策
                      </h3>
                      <div className="text-sm text-gray-600 whitespace-pre-line bg-green-50 p-3 rounded">
                        {change.ai_suggestions}
                      </div>
                    </div>
                  </div>

                  {/* 詳細ボタン */}
                  {change.diff_summary && (
                    <button
                      onClick={() => setSelectedChange(change)}
                      className="mt-4 text-sm text-primary-600 hover:underline"
                    >
                      差分の詳細を表示 →
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 差分詳細モーダル */}
      {selectedChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">
                  差分の詳細
                </h2>
                <button
                  onClick={() => setSelectedChange(null)}
                  className="text-gray-400 hover:text-gray-600"
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
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">
                  📊 変更箇所
                </h3>
                <p className="text-2xl font-bold text-blue-700">
                  {selectedChange.diff_summary.changesCount}
                  <span className="text-sm font-normal text-blue-600 ml-2">箇所の変更を検出</span>
                </p>
              </div>

              {selectedChange.diff_summary.addedLines?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-green-700 mb-2">
                    追加されたコンテンツ
                  </h3>
                  <div className="bg-green-50 p-4 rounded text-sm space-y-1">
                    {selectedChange.diff_summary.addedLines.map(
                      (line: string, i: number) => (
                        <div key={i} className="text-gray-700">
                          + {line}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {selectedChange.diff_summary.removedLines?.length > 0 && (
                <div>
                  <h3 className="font-semibold text-red-700 mb-2">
                    削除されたコンテンツ
                  </h3>
                  <div className="bg-red-50 p-4 rounded text-sm space-y-1">
                    {selectedChange.diff_summary.removedLines.map(
                      (line: string, i: number) => (
                        <div key={i} className="text-gray-700">
                          - {line}
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

