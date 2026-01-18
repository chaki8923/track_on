import Link from "next/link";

export default function LegalPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Competitive Watcher
          </Link>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-6">
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ 重要：</strong> 以下の情報は必ず正確に記入してください。法律で定められた必須項目です。
            </p>
          </div>

          <div className="space-y-6">
            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">販売事業者</h3>
              <p className="text-gray-700">
                {/* TODO: 運営者名（会社名または個人名）を記入 */}
                <span className="bg-yellow-100 px-2 py-1">[運営者名（会社名または個人名）を記入してください]</span>
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">運営責任者</h3>
              <p className="text-gray-700">
                {/* TODO: 代表者名を記入 */}
                <span className="bg-yellow-100 px-2 py-1">[代表者名を記入してください]</span>
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">所在地</h3>
              <p className="text-gray-700">
                {/* TODO: 事業所の住所を記入 */}
                <span className="bg-yellow-100 px-2 py-1">[郵便番号]</span>
                <br />
                <span className="bg-yellow-100 px-2 py-1">[都道府県市区町村以下の住所]</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ※個人事業主で自宅住所を非公開にしたい場合は、請求があった場合に遅滞なく開示する旨を記載することも可能です
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">お問い合わせ</h3>
              <p className="text-gray-700">
                メールアドレス：<span className="bg-yellow-100 px-2 py-1">[お問い合わせ用メールアドレス]</span>
                <br />
                電話番号：<span className="bg-yellow-100 px-2 py-1">[電話番号]</span>
              </p>
              <p className="text-sm text-gray-500 mt-2">
                ※営業時間：平日 10:00〜18:00（土日祝日を除く）
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">販売価格</h3>
              <div className="text-gray-700 space-y-2">
                <p><strong>Freeプラン：</strong> 無料</p>
                <p><strong>Proプラン：</strong> 月額 4,800円（税込）</p>
                <p><strong>Businessプラン：</strong> 月額 9,800円（税込）</p>
                <p className="text-sm text-gray-500 mt-2">
                  ※表示価格は全て税込価格です
                </p>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">サービスの対価以外に必要な費用</h3>
              <p className="text-gray-700">
                インターネット接続料金、通信費用等は、お客様のご負担となります。
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">支払方法</h3>
              <p className="text-gray-700">
                クレジットカード決済（Stripe経由）
                <br />
                <span className="text-sm text-gray-500">対応カード：Visa、Mastercard、American Express、JCB 等</span>
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">支払時期</h3>
              <p className="text-gray-700">
                サブスクリプション開始時および毎月の更新時に、登録されたクレジットカードから自動的に決済されます。
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">サービス提供時期</h3>
              <p className="text-gray-700">
                決済完了後、直ちにサービスをご利用いただけます。
              </p>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">返品・キャンセル・中途解約について</h3>
              <div className="text-gray-700 space-y-2">
                <p>
                  <strong>デジタルコンテンツという性質上、お客様都合による返金は承っておりません。</strong>
                </p>
                <p>
                  ただし、以下の場合は返金対応いたします：
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>当社のシステム障害により、サービスが正常に提供できなかった場合</li>
                  <li>決済エラー等により、二重請求が発生した場合</li>
                </ul>
                <p className="mt-3">
                  <strong>解約について：</strong>
                </p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>いつでも解約可能です</li>
                  <li>解約手続きは、ダッシュボード内の「サブスクリプション管理」から行えます</li>
                  <li>解約後も、次回請求日までサービスをご利用いただけます</li>
                  <li>日割り計算による返金は行いません</li>
                </ul>
              </div>
            </div>

            <div className="border-b pb-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">動作環境</h3>
              <div className="text-gray-700 space-y-2">
                <p><strong>推奨ブラウザ：</strong></p>
                <ul className="list-disc list-inside ml-4 space-y-1">
                  <li>Google Chrome（最新版）</li>
                  <li>Safari（最新版）</li>
                  <li>Microsoft Edge（最新版）</li>
                  <li>Firefox（最新版）</li>
                </ul>
                <p className="text-sm text-gray-500 mt-2">
                  ※上記以外のブラウザでは、正常に動作しない場合があります
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">その他</h3>
              <p className="text-gray-700">
                サービスの詳細な利用条件については、
                <Link href="/terms" className="text-primary-600 hover:underline">利用規約</Link>
                をご確認ください。
              </p>
            </div>
          </div>

          <div className="pt-8 mt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">掲載日：2026年1月18日</p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-primary-600 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    </div>
  );
}
