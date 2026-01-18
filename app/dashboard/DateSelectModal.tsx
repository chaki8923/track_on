"use client";

import { useState, useEffect } from "react";

type Snapshot = {
  id: string;
  created_at: string;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  siteId: string;
  siteName: string;
  onSelectDate: (snapshotId: string, date: string) => void;
};

export default function DateSelectModal({ isOpen, onClose, siteId, siteName, onSelectDate }: Props) {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  useEffect(() => {
    if (isOpen) {
      fetchSnapshots();
    }
  }, [isOpen, siteId]);

  const fetchSnapshots = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/sites/${siteId}/snapshots`);
      const data = await response.json();
      
      if (response.ok) {
        setSnapshots(data.snapshots || []);
      }
    } catch (error) {
      console.error("スナップショット取得エラー:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = () => {
    if (!selectedId) return;
    
    const selected = snapshots.find(s => s.id === selectedId);
    if (selected) {
      onSelectDate(selectedId, selected.created_at);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* ヘッダー */}
        <div className="p-6 bg-gradient-to-r from-blue-500 to-blue-600 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-black opacity-10" />
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-4xl">📅</span>
                <h2 className="text-3xl font-bold">日付を指定してチェック</h2>
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
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-200px)]">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">読み込み中...</p>
            </div>
          ) : snapshots.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-3">
                過去のデータがありません
              </h3>
              <p className="text-gray-600">
                まだチェックを実行していないため、比較できる過去のデータがありません。
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-sm text-blue-800">
                  <strong>💡 ヒント：</strong> 比較したい過去の日付を選択してください。選択した日付のデータと現在のサイトの状態を比較します。
                </p>
              </div>

              {snapshots.map((snapshot) => {
                const date = new Date(snapshot.created_at);
                const isSelected = selectedId === snapshot.id;
                
                return (
                  <button
                    key={snapshot.id}
                    onClick={() => setSelectedId(snapshot.id)}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-primary-600 bg-primary-50 shadow-md'
                        : 'border-gray-200 hover:border-primary-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-primary-600 bg-primary-600'
                            : 'border-gray-300'
                        }`}>
                          {isSelected && (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div>
                          <p className={`text-lg font-semibold ${
                            isSelected ? 'text-primary-700' : 'text-gray-900'
                          }`}>
                            {date.toLocaleDateString('ja-JP', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </p>
                          <p className="text-sm text-gray-600">
                            {date.toLocaleTimeString('ja-JP', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      {isSelected && (
                        <div className="text-primary-600">
                          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* フッター */}
        {snapshots.length > 0 && (
          <div className="p-6 bg-gray-50 border-t flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-all font-medium"
            >
              キャンセル
            </button>
            <button
              onClick={handleSelect}
              disabled={!selectedId}
              className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all font-medium shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              この日付で比較する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
