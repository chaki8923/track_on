"use client";

import { useState } from "react";
import CheckingModal from "./CheckingModal";
import CheckResultModal from "./CheckResultModal";
import DateSelectModal from "./DateSelectModal";

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
  const [showDateSelect, setShowDateSelect] = useState(false);

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

  const handleCheckNow = async (snapshotId?: string) => {
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: snapshotId ? JSON.stringify({ snapshot_id: snapshotId }) : undefined,
      });

      clearInterval(progressInterval);
      setCheckProgress(100);

      const data = await response.json();

      if (!response.ok) {
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

  const handleDateSelect = (snapshotId: string, date: string) => {
    handleCheckNow(snapshotId);
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
                    onClick={() => {
                      setShowMenu(false);
                      setShowDateSelect(true);
                    }}
                    disabled={loading || checking}
                    className="w-full text-left px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50 border-b flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>日付を指定してチェック</span>
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

      {/* 日付選択モーダル */}
      <DateSelectModal
        isOpen={showDateSelect}
        onClose={() => setShowDateSelect(false)}
        siteId={site.id}
        siteName={site.name}
        onSelectDate={handleDateSelect}
      />
    </>
  );
}

