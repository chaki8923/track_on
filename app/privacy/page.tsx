import Link from "next/link";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white border-b">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="text-2xl font-bold text-primary-600">
            Track On
          </Link>
        </div>
      </header>

      {/* コンテンツ */}
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">プライバシーポリシー</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <p className="text-gray-700">
              Track On（以下「当社」といいます）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下「本ポリシー」といいます）を定めます。
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（収集する情報）</h2>
            <div className="text-gray-700 space-y-3">
              <p>当社は、本サービスの提供にあたり、以下の情報を取得します。</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>
                  <strong>登録情報</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>メールアドレス</li>
                    <li>パスワード（暗号化して保存）</li>
                  </ul>
                </li>
                <li>
                  <strong>決済情報</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>Stripe経由での決済情報（当社はクレジットカード情報を直接保持しません）</li>
                    <li>サブスクリプションステータス</li>
                  </ul>
                </li>
                <li>
                  <strong>利用情報</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>監視対象として登録されたURL</li>
                    <li>サービス利用履歴</li>
                    <li>通知設定（メールアドレス、Slack Webhook URL）</li>
                  </ul>
                </li>
                <li>
                  <strong>アクセス情報</strong>
                  <ul className="list-disc list-inside ml-6 mt-2 space-y-1">
                    <li>IPアドレス</li>
                    <li>アクセス日時</li>
                    <li>ブラウザ情報</li>
                  </ul>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（利用目的）</h2>
            <div className="text-gray-700 space-y-3">
              <p>当社は、取得した個人情報を以下の目的で利用します。</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>本サービスの提供、維持、保護および改善のため</li>
                <li>ユーザー認証および本人確認のため</li>
                <li>監視結果の通知および関連する情報の提供のため</li>
                <li>料金の請求および決済処理のため</li>
                <li>お問い合わせへの対応のため</li>
                <li>本サービスに関する重要なお知らせや規約変更等の通知のため</li>
                <li>利用規約違反行為の調査および対応のため</li>
                <li>本サービスの利用状況の分析および改善のため</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（第三者提供）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                当社は、以下の場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。
              </p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>法令に基づく場合</li>
                <li>人の生命、身体または財産の保護のために必要がある場合であって、ユーザーの同意を得ることが困難である場合</li>
                <li>国の機関もしくは地方公共団体またはその委託を受けた者が法令の定める事務を遂行することに対して協力する必要がある場合</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（外部サービスの利用）</h2>
            <div className="text-gray-700 space-y-3">
              <p>本サービスでは、以下の外部サービスを利用しています。</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>
                  <strong>Supabase</strong>：認証およびデータベース管理
                  <br />
                  <span className="text-sm text-gray-600">
                    <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Supabaseのプライバシーポリシー
                    </a>
                  </span>
                </li>
                <li>
                  <strong>Stripe</strong>：決済処理
                  <br />
                  <span className="text-sm text-gray-600">
                    <a href="https://stripe.com/jp/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Stripeのプライバシーポリシー
                    </a>
                  </span>
                </li>
                <li>
                  <strong>Cloudflare R2</strong>：スクリーンショット画像の保存
                  <br />
                  <span className="text-sm text-gray-600">
                    <a href="https://www.cloudflare.com/privacypolicy/" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Cloudflareのプライバシーポリシー
                    </a>
                  </span>
                </li>
                <li>
                  <strong>Google Gemini API</strong>：AI分析機能
                  <br />
                  <span className="text-sm text-gray-600">
                    <a href="https://policies.google.com/privacy" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                      Googleのプライバシーポリシー
                    </a>
                  </span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（個人情報の開示・訂正・削除）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                ユーザーは、自己の個人情報について、開示、訂正、削除を求めることができます。
              </p>
              <p>
                個人情報の開示、訂正、削除をご希望の場合は、本サービス内の設定画面から変更いただくか、下記お問い合わせ窓口までご連絡ください。
              </p>
              <p>
                アカウントを削除した場合、登録された個人情報および監視データは削除されます。ただし、法令により保存が義務付けられている情報は、その定められた期間保管します。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（セキュリティ）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                当社は、個人情報の漏洩、滅失または毀損を防止するため、適切な安全管理措置を講じます。
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>通信の暗号化（SSL/TLS）</li>
                <li>パスワードのハッシュ化</li>
                <li>アクセス制御およびログ管理</li>
                <li>定期的なセキュリティ監査</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第7条（Cookie等の利用）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                本サービスでは、ユーザーの利便性向上およびサービス改善のため、Cookie等の技術を使用することがあります。
              </p>
              <p>
                ユーザーは、ブラウザの設定によりCookieの受け入れを拒否することができますが、その場合、本サービスの一部機能が利用できなくなる可能性があります。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（プライバシーポリシーの変更）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                当社は、法令の変更や本サービスの機能追加等に伴い、本ポリシーを変更することがあります。変更後のプライバシーポリシーは、本ページに掲載した時点で効力を生じるものとします。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（お問い合わせ窓口）</h2>
            <div className="text-gray-700 space-y-3">
              <p>本ポリシーに関するお問い合わせは、以下の窓口までお願いいたします。</p>
              <div className="bg-gray-50 p-4 rounded-lg mt-4">
                <p className="font-semibold">Track On 運営事務局</p>
                <p className="mt-2">
                  {/* TODO: 実際のメールアドレスを記入 */}
                  <span className="text-primary-600"><a href="https://forms.gle/BWwo3Mz9nMNFQoB48" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">お問い合わせフォーム</a></span>
                </p>
              </div>
            </div>
          </section>

          <div className="pt-8 mt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">制定日：2026年1月18日</p>
            <p className="text-sm text-gray-600 mt-2">
              {/* TODO: 運営者情報を記載 */}
              運営者：茶木 涼
            </p>
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
