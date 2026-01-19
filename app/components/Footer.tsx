import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 py-12 mt-auto">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8">
          {/* ブランド */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Competitive Watcher</h3>
            <p className="text-sm text-gray-400">
              競合サイトの変更を自動監視し、マーケティング施策を提案するSaaSツール
            </p>
          </div>

          {/* サービス */}
          <div>
            <h4 className="text-white font-semibold mb-4">サービス</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/dashboard" className="hover:text-white transition">
                  ダッシュボード
                </Link>
              </li>
              <li>
                <Link href="/dashboard/history" className="hover:text-white transition">
                  履歴
                </Link>
              </li>
              <li>
                <Link href="/dashboard/settings" className="hover:text-white transition">
                  設定
                </Link>
              </li>
            </ul>
          </div>

          {/* 料金プラン */}
          <div>
            <h4 className="text-white font-semibold mb-4">料金プラン</h4>
            <ul className="space-y-2 text-sm">
              <li className="text-gray-400">Free：無料</li>
              <li className="text-gray-400">Pro：¥4,800/月</li>
              <li className="text-gray-400">Business：¥9,800/月</li>
            </ul>
          </div>

          {/* 法的情報 */}
          <div>
            <h4 className="text-white font-semibold mb-4">法的情報</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/terms" className="hover:text-white transition">
                  利用規約
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white transition">
                  プライバシーポリシー
                </Link>
              </li>
              <li>
                <Link href="/legal" className="hover:text-white transition">
                  特定商取引法に基づく表記
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; 2026 Competitive Watcher. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
