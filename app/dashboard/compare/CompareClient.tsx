"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { 
  MdCompareArrows, 
  MdViewColumn, 
  MdCompare,
  MdArrowBack,
  MdCalendarToday 
} from "react-icons/md";
import { HiCamera } from "react-icons/hi";
import { BiTargetLock } from "react-icons/bi";

type User = {
  id: string;
  email?: string;
};

type Site = {
  id: string;
  name: string;
  url: string;
};

type Snapshot = {
  id: string;
  site_id: string;
  created_at: string;
  screenshot_url: string;
  monitored_sites: {
    id: string;
    name: string;
    url: string;
  };
};

type Props = {
  user: User;
  sites: Site[];
};

export default function CompareClient({ user, sites }: Props) {
  const [selectedSite, setSelectedSite] = useState<string>("");
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [snapshot1, setSnapshot1] = useState<string>("");
  const [snapshot2, setSnapshot2] = useState<string>("");
  const [viewMode, setViewMode] = useState<"side-by-side" | "slider">("side-by-side");
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  
  const leftScrollRef = useRef<HTMLDivElement>(null);
  const rightScrollRef = useRef<HTMLDivElement>(null);

  // サイト選択時にスナップショットを取得
  useEffect(() => {
    if (!selectedSite) {
      setSnapshots([]);
      setSnapshot1("");
      setSnapshot2("");
      return;
    }

    const fetchSnapshots = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/sites/snapshots?site_id=${selectedSite}`);
        const data = await response.json();
        setSnapshots(data.snapshots || []);
        
        // デフォルトで最新2つを選択
        if (data.snapshots && data.snapshots.length >= 2) {
          setSnapshot1(data.snapshots[1].id); // 2番目に新しい
          setSnapshot2(data.snapshots[0].id); // 最新
        } else if (data.snapshots && data.snapshots.length === 1) {
          setSnapshot1(data.snapshots[0].id);
          setSnapshot2(data.snapshots[0].id);
        }
      } catch (error) {
        console.error('Error fetching snapshots:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSnapshots();
  }, [selectedSite]);

  // 同期スクロール
  const handleScroll = (source: 'left' | 'right') => {
    if (!leftScrollRef.current || !rightScrollRef.current) return;
    
    if (source === 'left') {
      rightScrollRef.current.scrollTop = leftScrollRef.current.scrollTop;
    } else {
      leftScrollRef.current.scrollTop = rightScrollRef.current.scrollTop;
    }
  };

  // スライダー操作
  const handleSliderDrag = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, percentage)));
  };

  const getSnapshotById = (id: string) => snapshots.find(s => s.id === id);
  const snap1 = getSnapshotById(snapshot1);
  const snap2 = getSnapshotById(snapshot2);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-slate-100">
      {/* ヘッダー */}
      <header className="bg-white border-b shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="text-2xl font-bold bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent hover:from-primary-700 hover:to-primary-600 transition"
              >
                Competitive Watcher
              </Link>
              <span className="text-gray-400">|</span>
              <div className="flex items-center space-x-2">
                <MdCompareArrows className="text-2xl text-gray-700" />
                <h1 className="text-xl font-semibold text-gray-800">スクショ比較</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">{user.email}</span>
              <Link
                href="/dashboard"
                className="text-sm text-gray-600 hover:text-gray-900 transition flex items-center space-x-1"
              >
                <MdArrowBack className="w-4 h-4" />
                <span>ダッシュボード</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* コントロールパネル */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8 border border-gray-200">
          <div className="grid md:grid-cols-3 gap-6">
            {/* サイト選択 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <BiTargetLock className="text-lg" />
                <span>比較するサイト</span>
              </label>
              <select
                value={selectedSite}
                onChange={(e) => setSelectedSite(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent transition"
              >
                <option value="">サイトを選択...</option>
                {sites.map((site) => (
                  <option key={site.id} value={site.id}>
                    {site.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 日付1選択 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <MdCalendarToday className="text-lg" />
                <span>比較元</span>
              </label>
              <select
                value={snapshot1}
                onChange={(e) => setSnapshot1(e.target.value)}
                disabled={!selectedSite || loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">日付を選択...</option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {new Date(snap.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </option>
                ))}
              </select>
            </div>

            {/* 日付2選択 */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2 flex items-center space-x-2">
                <MdCalendarToday className="text-lg" />
                <span>比較先</span>
              </label>
              <select
                value={snapshot2}
                onChange={(e) => setSnapshot2(e.target.value)}
                disabled={!selectedSite || loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">日付を選択...</option>
                {snapshots.map((snap) => (
                  <option key={snap.id} value={snap.id}>
                    {new Date(snap.created_at).toLocaleString('ja-JP', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 表示モード切替 */}
          {snapshot1 && snapshot2 && (
            <div className="mt-6 flex items-center justify-between pt-6 border-t border-gray-200">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-gray-700">表示モード:</span>
                <button
                  onClick={() => setViewMode("side-by-side")}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                    viewMode === "side-by-side"
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <MdViewColumn />
                  <span>並べて表示</span>
                </button>
                <button
                  onClick={() => setViewMode("slider")}
                  className={`px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                    viewMode === "slider"
                      ? "bg-primary-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  <MdCompare />
                  <span>スライダー表示</span>
                </button>
              </div>
              <div className="text-sm text-gray-600">
                {viewMode === "side-by-side" ? "同期スクロールで比較できます" : "スライダーをドラッグして比較できます"}
              </div>
            </div>
          )}
        </div>

        {/* 比較表示エリア */}
        {!selectedSite ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <BiTargetLock className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">サイトを選択してください</h3>
            <p className="text-gray-600">上のドロップダウンから比較したいサイトを選択してください</p>
          </div>
        ) : loading ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">スナップショットを読み込み中...</p>
          </div>
        ) : snapshots.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <HiCamera className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">スクショがありません</h3>
            <p className="text-gray-600 mb-4">このサイトのスクショがまだありません。</p>
            <Link
              href="/dashboard"
              className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
            >
              サイトチェックを実行
            </Link>
          </div>
        ) : !snapshot1 || !snapshot2 ? (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center border border-gray-200">
            <MdCalendarToday className="text-6xl text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">比較する日付を選択してください</h3>
            <p className="text-gray-600">上のドロップダウンから2つの日付を選択してください</p>
          </div>
        ) : viewMode === "side-by-side" ? (
          /* 並べて表示モード */
          <div className="grid md:grid-cols-2 gap-6">
            {/* 左側 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-gray-300">
              <div className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">比較元</h3>
                  <p className="text-sm text-gray-100">
                    {snap1 && new Date(snap1.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <HiCamera className="text-3xl" />
              </div>
              <div
                ref={leftScrollRef}
                onScroll={() => handleScroll('left')}
                className="overflow-y-auto max-h-[calc(100vh-300px)] bg-gray-50"
              >
                {snap1?.screenshot_url && (
                  <img
                    src={snap1.screenshot_url}
                    alt="Before"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>

            {/* 右側 */}
            <div className="bg-white rounded-2xl shadow-lg overflow-hidden border-2 border-primary-300">
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 text-white px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold">比較先</h3>
                  <p className="text-sm text-primary-100">
                    {snap2 && new Date(snap2.created_at).toLocaleString('ja-JP')}
                  </p>
                </div>
                <HiCamera className="text-3xl" />
              </div>
              <div
                ref={rightScrollRef}
                onScroll={() => handleScroll('right')}
                className="overflow-y-auto max-h-[calc(100vh-300px)] bg-gray-50"
              >
                {snap2?.screenshot_url && (
                  <img
                    src={snap2.screenshot_url}
                    alt="After"
                    className="w-full h-auto"
                  />
                )}
              </div>
            </div>
          </div>
        ) : (
          /* スライダー表示モード */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="bg-gradient-to-r from-gray-700 to-gray-800 text-white px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div>
                    <span className="text-xs text-gray-300">比較元</span>
                    <p className="text-sm font-medium">
                      {snap1 && new Date(snap1.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                  <MdCompareArrows className="text-2xl" />
                  <div>
                    <span className="text-xs text-gray-300">比較先</span>
                    <p className="text-sm font-medium">
                      {snap2 && new Date(snap2.created_at).toLocaleString('ja-JP')}
                    </p>
                  </div>
                </div>
                <MdCompare className="text-3xl" />
              </div>
            </div>
            <div
              className="relative overflow-hidden cursor-ew-resize"
              style={{ height: 'calc(100vh - 300px)' }}
              onMouseMove={handleSliderDrag}
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
            >
              {/* AFTER画像（背景・右側） */}
              <div 
                className="absolute top-0 right-0 bottom-0 overflow-auto bg-gray-50"
                style={{ width: `50%` }}
              >
                {snap2?.screenshot_url && (
                  <img
                    src={snap2.screenshot_url}
                    alt="After"
                    className="w-full absolute top-0 right-0 h-auto max-w-none"
                  />
                )}
              </div>

              {/* BEFORE画像（オーバーレイ） */}
              <div
                className="absolute inset-0 overflow-auto"
                style={{ width: `${sliderPosition}%` }}
              >
                {snap1?.screenshot_url && (
                  <img
                    src={snap1.screenshot_url}
                    alt="Before"
                    className="w-full h-auto"
                  />
                )}
              </div>

              {/* スライダーハンドル */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-white shadow-2xl cursor-ew-resize z-10"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-4 border-primary-500">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                  </svg>
                </div>
              </div>

              {/* ラベル */}
              <div className="absolute top-4 left-4 bg-gray-700 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                <HiCamera className="text-sm" />
                <span>比較元</span>
              </div>
              <div className="absolute top-4 right-4 bg-primary-600 text-white px-3 py-1 rounded-full text-xs font-bold shadow-lg flex items-center space-x-1">
                <HiCamera className="text-sm" />
                <span>比較先</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
