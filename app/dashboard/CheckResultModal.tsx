"use client";

import { useState } from 'react';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  result: {
    hasChanges: boolean;
    importance?: 'high' | 'medium' | 'low';
    aiAnalysis?: {
      summary: string;
      intent: string;
      suggestions: string[];
    };
    diffResult?: {
      changesCount: number;
    };
    screenshotUrl?: string;
    screenshotBeforeUrl?: string;
  };
  siteName: string;
  siteId: string;
};

export default function CheckResultModal({ isOpen, onClose, result, siteName, siteId }: Props) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  
  if (!isOpen) return null;

  const importanceConfig = {
    high: {
      color: 'from-red-500 to-red-600',
      bgColor: 'bg-red-50',
      textColor: 'text-red-700',
      borderColor: 'border-red-200',
      icon: '🔴',
      label: '重要',
    },
    medium: {
      color: 'from-yellow-500 to-yellow-600',
      bgColor: 'bg-yellow-50',
      textColor: 'text-yellow-700',
      borderColor: 'border-yellow-200',
      icon: '🟡',
      label: '中',
    },
    low: {
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-700',
      borderColor: 'border-green-200',
      icon: '🟢',
      label: '軽微',
    },
  };

  const config = result.importance ? importanceConfig[result.importance] : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden animate-slideUp">
        {/* ヘッダー */}
        <div className={`p-6 ${result.hasChanges ? `bg-gradient-to-r ${config?.color}` : 'bg-gradient-to-r from-gray-400 to-gray-500'} text-white relative overflow-hidden`}>
          <div className="absolute inset-0 bg-black opacity-10" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                {result.hasChanges ? (
                  <>
                    <span className="text-4xl">{config?.icon}</span>
                    <h2 className="text-3xl font-bold">変更を検知しました！</h2>
                  </>
                ) : (
                  <>
                    <span className="text-4xl">✅</span>
                    <h2 className="text-3xl font-bold">変更なし</h2>
                  </>
                )}
              </div>
              <p className="text-white text-opacity-90 text-lg">{siteName}</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* コンテンツ */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {result.hasChanges && result.aiAnalysis ? (
            <div className="space-y-6">
              {/* 統計情報 */}
              {result.diffResult && (
                <div className="mb-6">
                  <div className={`p-6 rounded-xl border-2 ${config?.borderColor} ${config?.bgColor} text-center`}>
                    <div className="text-sm text-gray-600 mb-2">変更箇所</div>
                    <div className={`text-4xl font-bold ${config?.textColor}`}>
                      {result.diffResult.changesCount}
                    </div>
                    <div className="text-sm text-gray-500 mt-2">箇所が変更されました</div>
                  </div>
                </div>
              )}

              {/* 変更点の要約 */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">📝</span>
                  <h3 className="text-xl font-bold text-gray-900">変更点</h3>
                </div>
                <div className="text-gray-700 whitespace-pre-line leading-relaxed">
                  {result.aiAnalysis.summary}
                </div>
              </div>

              {/* マーケ意図 */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border-2 border-purple-200">
                <div className="flex items-center space-x-2 mb-3">
                  <span className="text-2xl">🎯</span>
                  <h3 className="text-xl font-bold text-gray-900">マーケティング意図</h3>
                </div>
                <p className="text-gray-700 leading-relaxed">
                  {result.aiAnalysis.intent}
                </p>
              </div>

              {/* 推奨施策 */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                <div className="flex items-center space-x-2 mb-4">
                  <span className="text-2xl">💡</span>
                  <h3 className="text-xl font-bold text-gray-900">推奨施策</h3>
                </div>
                <div className="space-y-3">
                  {result.aiAnalysis.suggestions.map((suggestion, i) => (
                    <div key={i} className="flex items-start space-x-3 bg-white rounded-lg p-4 shadow-sm">
                      <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold">
                        {i + 1}
                      </div>
                      <p className="text-gray-700 flex-1 pt-1">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* スクリーンショット */}
              {(result.screenshotUrl || result.screenshotBeforeUrl) && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl">📸</span>
                    <h3 className="text-xl font-bold text-gray-900">スクリーンショット比較</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.screenshotBeforeUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">前回チェック</p>
                          <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded">BEFORE</span>
                        </div>
                        <div 
                          className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-red-300 hover:border-red-500 transition-all"
                          onClick={() => setSelectedImage(result.screenshotBeforeUrl!)}
                        >
                          <img
                            src={result.screenshotBeforeUrl}
                            alt="前回チェック時のスクリーンショット"
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.screenshotUrl && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-700">
                            {result.screenshotBeforeUrl ? '今回チェック' : '現在'}
                          </p>
                          {result.screenshotBeforeUrl && (
                            <span className="text-xs bg-green-200 text-green-700 px-2 py-1 rounded">AFTER</span>
                          )}
                        </div>
                        <div 
                          className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-green-300 hover:border-green-500 transition-all"
                          onClick={() => setSelectedImage(result.screenshotUrl!)}
                        >
                          <img
                            src={result.screenshotUrl}
                            alt="今回チェック時のスクリーンショット"
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    クリックで拡大表示
                  </p>
                  {!result.screenshotBeforeUrl && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 text-center">
                        💡 次回のチェックから、前回との比較ができるようになります
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-center py-8">
                <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg className="w-12 h-12 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-3">
                  変更は検出されませんでした
                </h3>
                <p className="text-gray-600 text-lg mb-6">
                  前回のチェックから、{siteName}に変更はありませんでした。
                </p>
                <p className="text-sm text-gray-500">
                  定期的に自動チェックを行っています。<br />
                  変更があった場合は通知でお知らせします。
                </p>
              </div>

              {/* スクリーンショット（変更なしの場合） */}
              {(result.screenshotUrl || result.screenshotBeforeUrl) && (
                <div className="bg-gradient-to-br from-gray-50 to-slate-50 rounded-xl p-6 border-2 border-gray-200">
                  <div className="flex items-center space-x-2 mb-4">
                    <span className="text-2xl">📸</span>
                    <h3 className="text-xl font-bold text-gray-900">スクリーンショット比較</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.screenshotBeforeUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">前回チェック</p>
                        <div 
                          className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-gray-300 hover:border-primary-500 transition-all"
                          onClick={() => setSelectedImage(result.screenshotBeforeUrl!)}
                        >
                          <img
                            src={result.screenshotBeforeUrl}
                            alt="前回チェック時のスクリーンショット"
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                    {result.screenshotUrl && (
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-700">
                          {result.screenshotBeforeUrl ? '今回チェック' : '現在'}
                        </p>
                        <div 
                          className="relative group cursor-pointer overflow-hidden rounded-lg border-2 border-gray-300 hover:border-primary-500 transition-all"
                          onClick={() => setSelectedImage(result.screenshotUrl!)}
                        >
                          <img
                            src={result.screenshotUrl}
                            alt="今回チェック時のスクリーンショット"
                            className="w-full h-auto group-hover:scale-105 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity" />
                          <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <svg className="w-5 h-5 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    クリックで拡大表示
                  </p>
                  {!result.screenshotBeforeUrl && (
                    <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs text-blue-700 text-center">
                        💡 次回のチェックから、前回との比較ができるようになります
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* フッター */}
        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <a
            href={`/dashboard/history?site=${siteId}`}
            className="text-primary-600 hover:text-primary-700 font-medium transition flex items-center space-x-1"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>このサイトの履歴を見る</span>
          </a>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium shadow-lg"
          >
            閉じる
          </button>
        </div>
      </div>

      {/* 画像拡大モーダル */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-[60] bg-black bg-opacity-95 animate-fadeIn overflow-auto"
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
    </div>
  );
}
