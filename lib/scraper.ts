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
    
    // タイムアウト設定
    await page.goto(url, { 
      waitUntil: 'networkidle',
      timeout: 30000 
    });

    // JavaScriptの実行を待つ
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

