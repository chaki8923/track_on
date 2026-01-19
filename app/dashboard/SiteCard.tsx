"use client";

import { useState } from "react";
import CheckingModal from "./CheckingModal";
import CheckResultModal from "./CheckResultModal";

type Site = {
  id: string;
  url: string;
  name: string;
  last_checked_at: string | null;
  is_active: boolean;
  created_at: string;
};

type Props = {
  site: Site;
  onUpdate: () => void;
};

export default function SiteCard({ site, onUpdate }: Props) {
  const [showMenu, setShowMenu] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkProgress, setCheckProgress] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [checkResult, setCheckResult] = useState<any>(null);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [limitInfo, setLimitInfo] = useState<any>(null);

  const handleToggleActive = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ is_active: !site.is_active }),
      });

      if (!response.ok) {
        throw new Error("更新に失敗しました");
      }

      onUpdate();
    } catch (err) {
      console.error(err);
      alert("更新に失敗しました");
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("本当に削除しますか？")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${site.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("削除に失敗しました");
      }

      onUpdate();
    } catch (err) {
      console.error(err);
      alert("削除に失敗しました");
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  };

  const handleCheckNow = async () => {
    setChecking(true);
    setShowMenu(false);
    setCheckProgress(0);
    
    try {
      // プログレスアニメーション
      const progressInterval = setInterval(() => {
        setCheckProgress((prev) => {
          if (prev >= 95) return prev;
          const increment = Math.random() * 15;
          return Math.min(prev + increment, 95);
        });
      }, 500);

      const response = await fetch(`/api/sites/${site.id}/check`, {
        method: "POST",
      });

      clearInterval(progressInterval);
      setCheckProgress(100);

      const data = await response.json();

      if (!response.ok) {
        // 制限超過の場合は専用モーダルを表示
        if (response.status === 429 && data.needsUpgrade) {
          clearInterval(progressInterval);
          setChecking(false);
          setLimitInfo(data);
          setShowLimitModal(true);
          return;
        }
        throw new Error(data.error || "チェックに失敗しました");
      }

      // 結果を保存してモーダル表示
      setCheckResult(data);
      
      // 少し待ってから結果を表示
      setTimeout(() => {
        setChecking(false);
        setShowResult(true);
        onUpdate();
      }, 500);
    } catch (err: any) {
      console.error(err);
      setChecking(false);
      alert(err.message || "チェックに失敗しました");
    }
  };

  return (
    <>
      <div className="p-6 hover:bg-gray-50 transition">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <a href={`/dashboard/sites/${site.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-primary-600 transition">
                {site.name}
              </h3>
            </a>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:underline mt-1 inline-block"
            >
              {site.url} ↗
            </a>
            <p className="text-xs text-gray-500 mt-2">
              {site.last_checked_at
                ? `最終チェック: ${new Date(
                    site.last_checked_at
                  ).toLocaleDateString("ja-JP")} ${new Date(
                    site.last_checked_at
                  ).toLocaleTimeString("ja-JP")}`
                : "未チェック"}
            </p>
          </div>
          <div className="flex items-center space-x-3">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${
              site.is_active
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-700"
            }`}
          >
            {site.is_active ? "監視中" : "停止中"}
          </span>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              disabled={loading}
              className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                />
              </svg>
            </button>

            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border z-20">
                  <button
                    onClick={() => handleCheckNow()}
                    disabled={loading || checking}
                    className="w-full text-left px-4 py-2 text-sm text-primary-600 hover:bg-primary-50 disabled:opacity-50 border-b"
                  >
                    {checking ? "チェック中..." : "今すぐチェック"}
                  </button>
                  <button
                    onClick={handleToggleActive}
                    disabled={loading || checking}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {site.is_active ? "監視を停止" : "監視を開始"}
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={loading || checking}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    削除
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
        </div>
      </div>

      {/* チェック中モーダル */}
      <CheckingModal
        isOpen={checking}
        siteName={site.name}
        progress={checkProgress}
      />

      {/* 結果表示モーダル */}
      {checkResult && (
        <CheckResultModal
          isOpen={showResult}
          onClose={() => {
            setShowResult(false);
            setCheckResult(null);
          }}
          result={checkResult}
          siteName={site.name}
          siteId={site.id}
        />
      )}


      {/* 制限超過モーダル */}
      {showLimitModal && limitInfo && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                本日のチェック上限に達しました
              </h3>
              <p className="text-gray-600 mb-4">
                {limitInfo.plan === 'free' 
                  ? `無料プランでは1日${limitInfo.dailyLimit}回までチェック可能です。`
                  : `Proプランでは1日${limitInfo.dailyLimit}回までチェック可能です。`}
              </p>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>本日の利用状況:</strong> {limitInfo.currentCount} / {limitInfo.dailyLimit}回
                </p>
              </div>
              <div className="space-y-3">
                {limitInfo.plan === 'free' && (
                  <button
                    onClick={() => {
                      setShowLimitModal(false);
                      window.location.href = '/dashboard#pricing';
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all font-semibold shadow-lg"
                  >
                    🚀 Proにアップグレード（20回/日）
                  </button>
                )}
                {limitInfo.plan === 'pro' && (
                  <button
                    onClick={() => {
                      setShowLimitModal(false);
                      window.location.href = '/dashboard#pricing';
                    }}
                    className="w-full px-6 py-3 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-lg hover:from-primary-600 hover:to-primary-700 transition-all font-semibold shadow-lg"
                  >
                    🚀 Businessにアップグレード（無制限）
                  </button>
                )}
                <button
                  onClick={() => setShowLimitModal(false)}
                  className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-all font-medium"
                >
                  閉じる
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-4">
                💡 制限は毎日0時にリセットされます
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

