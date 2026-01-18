import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* ヘッダー */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="text-2xl font-bold text-primary-600">
            Competitive Watcher
          </div>
          <div className="space-x-4">
            <Link
              href="/login"
              className="text-gray-600 hover:text-gray-900 transition"
            >
              ログイン
            </Link>
            <Link
              href="/signup"
              className="bg-primary-600 text-white px-6 py-2 rounded-lg hover:bg-primary-700 transition"
            >
              無料で始める
            </Link>
          </div>
        </nav>
      </header>

      {/* ヒーローセクション */}
      <main className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            競合サイトの変化を
            <br />
            <span className="text-primary-600">自動で追いかける</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            毎日自動で競合サイトをチェック。変更点をAIが要約し、
            <br />
            次に打つべき施策まで提案します。
          </p>
          <Link
            href="/signup"
            className="inline-block bg-primary-600 text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-primary-700 transition shadow-lg"
          >
            14日間無料トライアル
          </Link>
          <p className="text-sm text-gray-500 mt-4">
            クレジットカード登録不要
          </p>
        </div>

        {/* 課題セクション */}
        <div className="max-w-5xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            こんな悩みありませんか？
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                title: "競合チェックの時間がない",
                description: "毎日手動で確認するのは非効率。他の業務に時間を使いたい。",
              },
              {
                title: "変更に気づけない",
                description: "競合が新機能や価格変更をしても、数週間後に気づく。",
              },
              {
                title: "施策の根拠がない",
                description: "上司に「なぜこの施策？」と聞かれても説明できない。",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 機能セクション */}
        <div className="max-w-5xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Competitive Watcherができること
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                title: "🔍 自動監視",
                description: "毎日自動で競合サイトをチェック。JavaScriptで動的に変わるコンテンツも検知。",
              },
              {
                title: "📊 AI要約",
                description: "何が変わったか、その意図は何かをAIが自動で要約。専門用語なしで分かりやすく。",
              },
              {
                title: "💡 施策提案",
                description: "変更内容をもとに、あなたが取るべき施策を最大3つ提案。",
              },
              {
                title: "📧 即時通知",
                description: "重要度付きでメール・Slack通知。見逃しゼロ。",
              },
            ].map((item, i) => (
              <div key={i} className="bg-white p-8 rounded-lg shadow-md">
                <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                  {item.title}
                </h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* 料金セクション */}
        <div className="max-w-5xl mx-auto mt-24">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            シンプルな料金プラン
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                name: "Free",
                price: "¥0",
                features: ["1サイトまで", "週1回チェック", "メール通知"],
              },
              {
                name: "Pro",
                price: "¥4,800",
                features: ["5サイトまで", "毎日チェック", "Slack通知", "優先サポート"],
                recommended: true,
              },
              {
                name: "Business",
                price: "¥9,800",
                features: ["20サイトまで", "毎日チェック", "Slack通知", "専任サポート"],
              },
            ].map((plan, i) => (
              <div
                key={i}
                className={`bg-white p-8 rounded-lg shadow-md relative ${
                  plan.recommended ? "ring-2 ring-primary-600" : ""
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary-600 text-white px-4 py-1 rounded-full text-sm">
                    おすすめ
                  </div>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  {plan.name}
                </h3>
                <div className="text-4xl font-bold text-primary-600 mb-6">
                  {plan.price}
                  <span className="text-lg text-gray-500">/月</span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-center text-gray-600">
                      <svg
                        className="w-5 h-5 text-green-500 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  href="/signup"
                  className={`block text-center py-3 rounded-lg font-semibold transition ${
                    plan.recommended
                      ? "bg-primary-600 text-white hover:bg-primary-700"
                      : "bg-gray-100 text-gray-900 hover:bg-gray-200"
                  }`}
                >
                  始める
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* CTAセクション */}
        <div className="max-w-3xl mx-auto mt-24 text-center bg-primary-600 text-white p-12 rounded-2xl">
          <h2 className="text-3xl font-bold mb-4">
            今すぐ競合分析を自動化しませんか？
          </h2>
          <p className="text-xl mb-8 opacity-90">
            14日間無料トライアル。クレジットカード登録不要。
          </p>
          <Link
            href="/signup"
            className="inline-block bg-white text-primary-600 px-8 py-4 rounded-lg text-lg font-semibold hover:bg-gray-100 transition"
          >
            無料で始める
          </Link>
        </div>
      </main>
    </div>
  );
}

