"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AddSiteModal from "./AddSiteModal";
import SiteCard from "./SiteCard";
import PricingModal from "./PricingModal";
import { MdCompareArrows } from "react-icons/md";

type User = {
  id: string;
  email?: string;
};

type Profile = {
  id: string;
  plan: string;
  created_at: string;
  daily_check_count?: number;
  last_check_date?: string;
} | null;

type Site = {
  id: string;
  url: string;
  name: string;
  last_checked_at: string | null;
  is_active: boolean;
  created_at: string;
};

type Props = {
  user: User;
  profile: Profile;
  sites: Site[];
};

export default function DashboardClient({ user, profile, sites }: Props) {
  const router = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPricingModal, setShowPricingModal] = useState(false);

  const handleLogout = async () => {
    setLoading(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  };

  const planLimits = {
    free: 1,
    pro: 5,
    business: 20,
  };

  const dailyCheckLimits = {
    free: 5,
    pro: 20,
    business: -1, // 無制限
  };

  const currentPlan = profile?.plan || "free";
  const siteLimit = planLimits[currentPlan as keyof typeof planLimits];
  const sitesCount = sites.length;

  // 日次チェック回数の計算
  const today = new Date().toISOString().split('T')[0];
  const isToday = profile?.last_check_date === today;
  const dailyCheckCount = isToday ? (profile?.daily_check_count || 0) : 0;
  const dailyCheckLimit = dailyCheckLimits[currentPlan as keyof typeof dailyCheckLimits];
  const remainingChecks = dailyCheckLimit === -1 ? -1 : Math.max(0, dailyCheckLimit - dailyCheckCount);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleManageSubscription = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/stripe/create-portal-session", {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error);
      }

      window.location.href = data.url;
    } catch (err: any) {
      alert(err.message || "エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="text-2xl font-bold text-primary-600">
              Competitive Watcher
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <a
                href="/dashboard/compare"
                className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center space-x-1"
              >
                <MdCompareArrows className="text-lg" />
                <span>スクショ比較</span>
              </a>
              <a
                href="/dashboard/history"
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                履歴
              </a>
              <a
                href="/dashboard/settings"
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                設定
              </a>
              <button
                onClick={handleLogout}
                disabled={loading}
                className="text-sm text-gray-600 hover:text-gray-900 transition"
              >
                ログアウト
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* プラン情報 */}
        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900">
                現在のプラン:{" "}
                <span className="text-primary-600">
                  {currentPlan.toUpperCase()}
                </span>
              </h2>
              <div className="flex items-center space-x-6 mt-2">
                <div>
                  <p className="text-sm text-gray-600">
                    監視サイト数: {sitesCount} / {siteLimit}
                  </p>
                </div>
                <div className="border-l border-gray-300 pl-6">
                  <p className="text-sm text-gray-600">
                    本日のチェック回数:{" "}
                    <span className={`font-semibold ${
                      remainingChecks === 0 ? 'text-red-600' : 
                      remainingChecks > 0 && remainingChecks <= 2 ? 'text-yellow-600' : 
                      'text-green-600'
                    }`}>
                      {dailyCheckCount} / {dailyCheckLimit === -1 ? '無制限' : dailyCheckLimit}
                    </span>
                  </p>
                  {remainingChecks !== -1 && (
                    <p className={`text-xs mt-1 ${
                      remainingChecks === 0 ? 'text-red-600' : 'text-gray-500'
                    }`}>
                      {remainingChecks === 0 
                        ? '❌ 本日の上限に達しました' 
                        : `✅ 残り${remainingChecks}回`}
                    </p>
                  )}
                </div>
              </div>
            </div>
            {currentPlan === "free" ? (
              <button
                onClick={() => setShowPricingModal(true)}
                className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
              >
                プランをアップグレード
              </button>
            ) : (
              <button
                onClick={handleManageSubscription}
                disabled={loading}
                className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-200 transition disabled:opacity-50"
              >
                サブスクリプション管理
              </button>
            )}
          </div>
        </div>

        {/* 監視サイト一覧 */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              監視中のサイト
            </h2>
            {sitesCount < siteLimit ? (
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition text-sm"
              >
                + サイトを追加
              </button>
            ) : (
              <p className="text-sm text-gray-500">
                サイト追加上限に達しています
              </p>
            )}
          </div>

          {sites.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <svg
                  className="w-16 h-16 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                監視サイトがありません
              </h3>
              <p className="text-gray-600 mb-6">
                競合サイトを登録して、自動監視を始めましょう
              </p>
              <button
                onClick={() => setShowAddModal(true)}
                className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition"
              >
                最初のサイトを追加
              </button>
            </div>
          ) : (
            <div className="divide-y">
              {sites.map((site) => (
                <SiteCard key={site.id} site={site} onUpdate={handleRefresh} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* サイト追加モーダル */}
      <AddSiteModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSuccess={handleRefresh}
      />

      {/* 価格プランモーダル */}
      <PricingModal
        isOpen={showPricingModal}
        onClose={() => setShowPricingModal(false)}
        currentPlan={currentPlan}
      />
    </div>
  );
}

