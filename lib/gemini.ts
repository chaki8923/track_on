import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export type AIAnalysis = {
  summary: string;
  intent: string;
  suggestions: string[];
};

/**
 * Geminiで差分を分析して要約・施策提案
 */
export async function analyzeDiff(
  siteName: string,
  addedContent: string[],
  removedContent: string[]
): Promise<AIAnalysis> {
  const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

  const prompt = `
あなたはWebマーケティングの専門家です。

以下は競合サイト「${siteName}」の変更内容です。

【追加されたコンテンツ】
${addedContent.slice(0, 20).join('\n')}

【削除されたコンテンツ】
${removedContent.slice(0, 20).join('\n')}

以下の3つを分析してください：

1. **変更点の要約（3点以内）**
   - 何が変わったかを簡潔に箇条書きで
   - 専門用語は最小限に

2. **マーケティング上の意図の推測**
   - なぜこの変更を行ったと考えられるか
   - 1-2文で簡潔に

3. **当社が取るべき施策（最大3つ）**
   - 具体的なアクションを箇条書きで
   - すぐに実行できるものを優先

出力は以下のJSON形式で：
{
  "summary": "変更点1\n変更点2\n変更点3",
  "intent": "意図の推測",
  "suggestions": ["施策1", "施策2", "施策3"]
}
`.trim();

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    console.log('🤖 Gemini生テキスト（全体）:', text);

    // マークダウンコードブロックを除去
    text = text.replace(/```json\s*/g, '').replace(/```\s*/g, '');

    // JSONを抽出（最初の{から最後の}まで）
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ JSON抽出失敗。テキスト:', text);
      throw new Error('JSONの抽出に失敗しました');
    }

    let jsonString = jsonMatch[0];
    console.log('📦 抽出したJSON:', jsonString);

    // JSONパース試行（複数の方法でトライ）
    let analysis: AIAnalysis;
    
    try {
      // 方法1: そのままパース
      analysis = JSON.parse(jsonString);
    } catch (e1) {
      console.warn('⚠️ パース失敗（方法1）。制御文字のクリーンアップを試行...');
      
      try {
        // 方法2: 制御文字をクリーンアップしてパース
        // 文字列値内の改行などを安全に処理
        const cleaned = jsonString
          .replace(/\\n/g, '\\n')  // 既にエスケープされているものはそのまま
          .replace(/\\r/g, '\\r')
          .replace(/\\t/g, '\\t')
          .replace(/\r/g, '')  // 生の改行文字は削除
          .replace(/\n/g, '\\n')  // 生の改行をエスケープ
          .replace(/\t/g, ' ');  // タブはスペースに
        
        console.log('🧹 クリーンアップ後:', cleaned.substring(0, 200));
        analysis = JSON.parse(cleaned);
      } catch (e2) {
        console.error('❌ パース失敗（方法2）:', e2);
        throw new Error('JSONのパースに失敗しました');
      }
    }

    console.log('✅ パース成功:', analysis);
    return analysis;
  } catch (error) {
    console.error('Gemini API error:', error);
    
    // フォールバック
    return {
      summary: '変更を検知しましたが、詳細な分析に失敗しました。',
      intent: '分析できませんでした。',
      suggestions: ['競合サイトを直接確認してください。'],
    };
  }
}

