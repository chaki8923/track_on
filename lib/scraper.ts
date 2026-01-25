import { parse } from 'node-html-parser';

export type ScrapedContent = {
  html: string;
  cleanedHtml: string;
  title: string;
  timestamp: Date;
  screenshot?: Buffer; // 開発環境用
  screenshotUrl?: string; // Lambda経由の場合（R2に直接アップロード済み）
};

/**
 * サイトをスクレイピング
 * 本番環境ではAWS Lambdaを使用、開発環境ではPuppeteerを使用
 */
export async function scrapeSite(
  url: string,
  options: { takeScreenshot?: boolean; siteId?: string } = {}
): Promise<ScrapedContent> {
  const lambdaUrl = process.env.LAMBDA_SCRAPER_URL;
  const isProduction = process.env.VERCEL && lambdaUrl;

  if (isProduction) {
    console.log('🚀 Using AWS Lambda for scraping');
    return await scrapeWithLambda(url, options);
  } else {
    console.log('🚀 Using local Puppeteer for scraping');
    return await scrapeWithPuppeteer(url, options);
  }
}

/**
 * AWS Lambdaでスクレイピング（本番環境用）
 * Lambda内でR2に直接アップロードするため、screenshotUrlを返す
 */
async function scrapeWithLambda(
  url: string,
  options: { takeScreenshot?: boolean; siteId?: string }
): Promise<ScrapedContent> {
  const lambdaUrl = process.env.LAMBDA_SCRAPER_URL;
  
  if (!lambdaUrl) {
    throw new Error('LAMBDA_SCRAPER_URL環境変数が設定されていません');
  }

  console.log(`📡 Lambda呼び出し: ${lambdaUrl}`);

  try {
    const response = await fetch(lambdaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url,
        takeScreenshot: options.takeScreenshot,
        siteId: options.siteId, // R2アップロード用
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Lambda error: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();

    console.log('🔍 Lambda response:', {
      hasHtml: !!data.html,
      htmlLength: data.html?.length,
      hasScreenshotUrl: !!data.screenshotUrl,
      screenshotUrl: data.screenshotUrl,
      title: data.title
    });

    // HTMLをクリーニング
    const cleanedHtml = cleanHtml(data.html);

    return {
      html: data.html,
      cleanedHtml,
      title: data.title,
      timestamp: new Date(data.timestamp),
      screenshotUrl: data.screenshotUrl || undefined, // Lambda内でR2にアップロード済み
    };
  } catch (error) {
    console.error('❌ Lambda呼び出しエラー:', error);
    throw error;
  }
}

/**
 * Puppeteerでスクレイピング（開発環境用）
 */
async function scrapeWithPuppeteer(
  url: string,
  options: { takeScreenshot?: boolean }
): Promise<ScrapedContent> {
  const puppeteerFull = await import('puppeteer');
  
  const browser = await puppeteerFull.default.launch({
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
    ],
    headless: true,
  });

  try {
    const page = await browser.newPage();
    
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    await page.setViewport({ width: 1920, height: 1080 });
    
    console.log(`🌐 ページにアクセス中: ${url}`);
    
    await page.goto(url, { 
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    try {
      await page.waitForNetworkIdle({ 
        timeout: 20000,
        idleTime: 500 
      });
    } catch (e) {
      console.log('⚠️ ネットワークアイドル待機がタイムアウト');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 自動スクロール
    try {
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
              window.scrollTo(0, 0);
              resolve();
            }
          }, 100);
          setTimeout(() => {
            clearInterval(timer);
            window.scrollTo(0, 0);
            resolve();
          }, 10000);
        });
      });
    } catch (e) {
      console.log('⚠️ スクロールエラー');
    }

    await new Promise(resolve => setTimeout(resolve, 1500));

    const html = await page.content();
    const title = await page.title();

    let screenshot: Buffer | undefined;
    if (options.takeScreenshot) {
      try {
        const screenshotData = await page.screenshot({
          fullPage: true,
          type: 'jpeg',
          quality: 80,
        });
        screenshot = Buffer.from(screenshotData as Uint8Array);
        console.log('📸 スクリーンショット撮影完了');
      } catch (e) {
        console.error('⚠️ スクリーンショット撮影失敗');
      }
    }

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
 */
function cleanHtml(html: string): string {
  const root = parse(html);

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

  root.querySelectorAll('*').forEach(el => {
    const attributes = el.attributes;
    Object.keys(attributes).forEach(attr => {
      if (
        attr.startsWith('data-') ||
        attr.startsWith('on') ||
        ['style', 'class', 'id'].includes(attr)
      ) {
        el.removeAttribute(attr);
      }
    });
  });

  return root.text
    .replace(/\s+/g, ' ')
    .trim();
}
