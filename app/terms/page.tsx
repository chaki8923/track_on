import Link from "next/link";

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold text-gray-900 mb-8">利用規約</h1>
        
        <div className="bg-white rounded-lg shadow-sm p-8 space-y-8">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第1条（適用）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                本利用規約（以下「本規約」といいます）は、Competitive Watcher（以下「本サービス」といいます）の提供条件および本サービスの利用に関する当社とユーザーとの間の権利義務関係を定めることを目的とし、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されます。
              </p>
              <p>
                ユーザーは、本サービスを利用することにより、本規約に同意したものとみなされます。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第2条（定義）</h2>
            <div className="text-gray-700 space-y-3">
              <p>本規約において使用する用語の定義は、以下のとおりとします。</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>「本サービス」：当社が提供する「Competitive Watcher」という名称のウェブサービス</li>
                <li>「ユーザー」：本サービスを利用する個人または法人</li>
                <li>「登録情報」：ユーザーが本サービスの利用にあたって登録する情報</li>
                <li>「コンテンツ」：ユーザーが本サービスを通じて監視・取得する第三者のウェブサイト情報</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第3条（アカウント登録）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                本サービスの利用を希望する者は、本規約を遵守することに同意し、当社が定める方法により登録を申請し、当社がこれを承認することによって、本サービスのアカウント登録が完了するものとします。
              </p>
              <p>
                ユーザーは、登録情報について、真実かつ正確な情報を提供しなければなりません。登録情報に変更が生じた場合、速やかに変更内容を当社に通知するものとします。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第4条（料金および支払）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                ユーザーは、本サービスの有料プランの対価として、当社が別途定める料金を、当社が指定する方法により支払うものとします。
              </p>
              <p>
                料金は前払いとし、サブスクリプション期間の途中解約による日割り返金は行いません。
              </p>
              <p>
                ユーザーが料金の支払を遅滞した場合、当社は本サービスの提供を停止することができます。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第5条（解約・返金）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                ユーザーは、当社が定める方法により、いつでも本サービスの利用契約を解約することができます。
              </p>
              <p>
                解約した場合でも、既に支払われた料金の返金は行いません。ただし、サブスクリプション期間の終了までは本サービスを利用できます。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第6条（禁止事項）</h2>
            <div className="text-gray-700 space-y-3">
              <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>法令または公序良俗に違反する行為</li>
                <li>犯罪行為に関連する行為</li>
                <li>当社または第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
                <li>本サービスのネットワークまたはシステム等に過度な負荷をかける行為</li>
                <li>本サービスの運営を妨害するおそれのある行為</li>
                <li>不正アクセスをし、またはこれを試みる行為</li>
                <li>監視対象のウェブサイトに対して、過度なアクセスや攻撃的な行為を行うこと</li>
                <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
                <li>反社会的勢力に対する利益供与その他の協力行為</li>
                <li>その他、当社が不適切と判断する行為</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第7条（本サービスの停止等）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                当社は、以下のいずれかに該当する場合には、ユーザーに事前に通知することなく、本サービスの全部または一部の提供を停止または中断することができるものとします。
              </p>
              <ul className="list-decimal list-inside space-y-2 ml-4">
                <li>本サービスに係るコンピュータシステムの保守点検または更新を行う場合</li>
                <li>地震、落雷、火災、停電または天災などの不可抗力により本サービスの提供が困難となった場合</li>
                <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                <li>その他、当社が本サービスの提供が困難と判断した場合</li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第8条（免責事項）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                当社は、本サービスに関して、ユーザーと第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。
              </p>
              <p>
                本サービスを通じて取得した情報の正確性、完全性、有用性等について、当社は一切保証しません。
              </p>
              <p>
                本サービスの利用により、監視対象のウェブサイトとの間で発生したトラブルについて、当社は一切責任を負いません。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第9条（準拠法および管轄裁判所）</h2>
            <div className="text-gray-700 space-y-3">
              <p>本規約の解釈にあたっては、日本法を準拠法とします。</p>
              <p>
                本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。
              </p>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">第10条（規約の変更）</h2>
            <div className="text-gray-700 space-y-3">
              <p>
                当社は、ユーザーの承諾を得ることなく、いつでも本規約の内容を変更することができるものとします。変更後の本規約は、当社が別途定める場合を除き、本サービス上に表示した時点より効力を生じるものとします。
              </p>
            </div>
          </section>

          <div className="pt-8 mt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600">制定日：2026年1月18日</p>
            <p className="text-sm text-gray-600 mt-2">
              {/* TODO: 運営者情報を記載 */}
              運営者：[運営者名を記入してください]
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
