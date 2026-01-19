import { chromium } from 'playwright';
import { parse } from 'node-html-parser';

export type ScrapedContent = {
  html: string;
  cleanedHtml: string;
  title: string;
  timestamp: Date;
  screenshot?: Buffer;
};

/**
 * Playwrightでサイトをスクレイピング
 * @param url スクレイピング対象のURL
 * @param options スクレイピングオプション
 */
export async function scrapeSite(
  url: string,
  options: { takeScreenshot?: boolean } = {}
): Promise<ScrapedContent> {
  const browser = await chromium.launch({
    headless: true,
  });

  try {
    const context = await browser.newContext({
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      viewport: { width: 1920, height: 1080 },
    });

    const page = await context.newPage();
    
    // ページ読み込み（ネットワークアイドルまで待機）
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // JavaScriptの実行を待つ
    await page.waitForTimeout(1000);

    // レイジーロード画像を読み込むためにスクロール
    await autoScroll(page);

    // すべての画像が読み込まれるまで待機
    await waitForImages(page);

    // 追加の待機時間（アニメーションなどの完了を待つ）
    await page.waitForTimeout(2000);

    // HTMLを取得
    const html = await page.content();
    const title = await page.title();

    // スクリーンショットを撮影（オプション）
    let screenshot: Buffer | undefined;
    if (options.takeScreenshot) {
      screenshot = await page.screenshot({
        fullPage: true,
        type: 'jpeg',
        quality: 80, // 圧縮してストレージを節約
      });
      console.log('📸 スクリーンショット撮影完了');
    }

    await context.close();

    // HTMLをクリーニング
    const cleanedHtml = cleanHtml(html);

    return {
      html,
      cleanedHtml,
      title,
      timestamp: new Date(),
      screenshot,
    };
  } finally {
    await browser.close();
  }
}

/**
 * ページを自動スクロールしてレイジーロード画像を読み込む
 */
async function autoScroll(page: any): Promise<void> {
  await page.evaluate(async () => {
    await new Promise<void>((resolve) => {
      let totalHeight = 0;
      const distance = 300;
      const timer = setInterval(() => {
        const scrollHeight = document.body.scrollHeight;
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= scrollHeight) {
          clearInterval(timer);
          // スクロール後、トップに戻す
          window.scrollTo(0, 0);
          resolve();
        }
      }, 100);
    });
  });
}

/**
 * すべての画像が読み込まれるまで待機
 */
async function waitForImages(page: any): Promise<void> {
  try {
    await page.evaluate(async () => {
      const images = Array.from(document.images);
      
      await Promise.all(
        images.map((img) => {
          // 既に読み込まれている場合
          if (img.complete) {
            return Promise.resolve();
          }
          
          // 読み込みを待つ
          return new Promise<void>((resolve) => {
            img.addEventListener('load', () => resolve());
            img.addEventListener('error', () => resolve()); // エラーでも続行
            
            // タイムアウト（10秒）
            setTimeout(() => resolve(), 10000);
          });
        })
      );
    });
    
    console.log('✅ すべての画像の読み込みが完了しました');
  } catch (error) {
    console.warn('⚠️ 画像の読み込み待機中にエラーが発生しましたが、続行します:', error);
    // エラーが発生しても続行
  }
}

/**
 * HTMLから不要な要素を除去
 * （広告、トラッキング、日時など変化しやすい要素）
 */
function cleanHtml(html: string): string {
  const root = parse(html);

  // 削除する要素
  const selectorsToRemove = [
    'script',
    'style',
    'noscript',
    'iframe',
    '[class*="ad"]',
    '[class*="advertisement"]',
    '[id*="ad"]',
    '[class*="tracking"]',
    '[class*="analytics"]',
    '[class*="cookie"]',
    'meta',
    'link',
  ];

  selectorsToRemove.forEach(selector => {
    root.querySelectorAll(selector).forEach(el => el.remove());
  });

  // 属性を削除（data-*など）
  root.querySelectorAll('*').forEach(el => {
    const attributes = el.attributes;
    Object.keys(attributes).forEach(attr => {
      if (
        attr.startsWith('data-') ||
        attr.startsWith('on') || // イベントハンドラ
        ['style', 'class', 'id'].includes(attr)
      ) {
        el.removeAttribute(attr);
      }
    });
  });

  // テキストのみを返す（よりシンプルに）
  return root.text
    .replace(/\s+/g, ' ') // 複数の空白を1つに
    .trim();
}

