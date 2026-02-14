"use client";

import { useEffect, useState } from "react";

type Props = {
  isOpen: boolean;
  siteName: string;
  progress: number; // 0-100
};

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

const LOADING_VIDEOS = [
  `${R2_PUBLIC_URL}/circle_tra.mp4`,
  `${R2_PUBLIC_URL}/circle_search.mp4`,
  `${R2_PUBLIC_URL}/circle_sleep.mp4`
];

export default function CheckingModal({ isOpen, siteName, progress }: Props) {
  const [videoSrc, setVideoSrc] = useState<string>(LOADING_VIDEOS[0]);

  useEffect(() => {
    if (isOpen) {
      const randomIndex = Math.floor(Math.random() * LOADING_VIDEOS.length);
      setVideoSrc(LOADING_VIDEOS[randomIndex]);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center max-w-md px-8">
        {/* アニメーションアイコン（動画） */}
        <div className="relative w-48 h-48 mx-auto mb-8 overflow-hidden rounded-full">
          <video
            src={videoSrc}
            key={videoSrc}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>

        {/* テキスト */}
        <h2 className="text-3xl font-bold text-white mb-4 animate-pulse">
          サイトをチェック中...
        </h2>
        
        <p className="text-primary-200 text-lg mb-6">
          {siteName}
        </p>

        {/* プログレスバー */}
        <div className="w-full bg-gray-700 rounded-full h-2 mb-4 overflow-hidden">
          <div 
            className="bg-gradient-to-r from-primary-500 to-primary-400 h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ステータステキスト */}
        <div className="text-sm text-gray-400 space-y-2">
          {progress < 30 && (
            <p className="animate-fadeIn">🌐 ページを読み込んでいます...</p>
          )}
          {progress >= 30 && progress < 60 && (
            <p className="animate-fadeIn">📊 コンテンツを分析しています...</p>
          )}
          {progress >= 60 && progress < 90 && (
            <p className="animate-fadeIn">🤖 AIで差分を解析中...</p>
          )}
          {progress >= 90 && (
            <p className="animate-fadeIn">✨ もう少しで完了です...</p>
          )}
        </div>

        {/* 注意書き */}
        <div className="mt-8 text-xs text-gray-500">
          <p>このページを閉じないでください</p>
        </div>
      </div>
    </div>
  );
}
