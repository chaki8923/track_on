import { parse } from 'node-html-parser';

export type ScrapedContent = {
  html: string;
  cleanedHtml: string;
  title: string;
  timestamp: Date;
  screenshot?: Buffer;
};

/**
 * Puppeteerでサイトをスクレイピング（Vercel/Lambda対応）
 * @param url スクレイピング対象のURL
 * @param options スクレイピングオプション
 */
export async function scrapeSite(
  url: string,
  options: { takeScreenshot?: boolean } = {}
): Promise<ScrapedContent> {
  // Vercel環境判定
  const isProduction = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;

  let browser;
  
  if (isProduction) {
    // 本番環境: puppeteer-core + @sparticuz/chromium
    const puppeteerCore = await import('puppeteer-core');
    const chromium = await import('@sparticuz/chromium');
    
    console.log('🚀 Launching browser in production mode');
    
    browser = await puppeteerCore.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport,
      executablePath: await chromium.default.executablePath(),
      headless: chromium.default.headless,
      ignoreHTTPSErrors: true,
    });
  } else {
    // 開発環境: puppeteer (Chromium同梱版)
    const puppeteerFull = await import('puppeteer');
    
    browser = await puppeteerFull.default.launch({
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
      headless: true,
    });
  }

  try {
    const page = await browser.newPage();
    
    // ユーザーエージェント設定
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );
    
    // ビューポート設定
    await page.setViewport({ width: 1920, height: 1080 });
    
    // ページ読み込み（より柔軟な戦略）
    try {
      console.log(`🌐 ページにアクセス中: ${url}`);
      
      // まず domcontentloaded で待機（より早く完了する）
      await page.goto(url, { 
        waitUntil: 'domcontentloaded',
        timeout: 60000 // 60秒に延長
      });

      // ネットワークがアイドルになるまで待つ（タイムアウトしても続行）
      try {
        await page.waitForNetworkIdle({ 
          timeout: 20000,
          idleTime: 500 
        });
      } catch (networkIdleError) {
        console.log('⚠️ ネットワークアイドル待機がタイムアウトしましたが、続行します');
      }
    } catch (gotoError) {
      console.error('❌ ページ読み込みエラー:', gotoError);
      throw new Error(`サイトへのアクセスに失敗しました: ${url}`);
    }

    // JavaScriptの実行を待つ
    await new Promise(resolve => setTimeout(resolve, 1000));

    // レイジーロード画像を読み込むためにスクロール（タイムアウト付き）
    try {
      await Promise.race([
        autoScroll(page),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('AutoScroll timeout')), 10000)
        )
      ]);
    } catch (scrollError) {
      console.log('⚠️ 自動スクロールがタイムアウトしましたが、続行します');
    }

    // すべての画像が読み込まれるまで待機（タイムアウト付き）
    try {
      await waitForImages(page);
    } catch (imageError) {
      console.log('⚠️ 画像読み込み待機をスキップしました');
    }

    // 追加の待機時間（アニメーションなどの完了を待つ）
    await new Promise(resolve => setTimeout(resolve, 1500));

    // HTMLを取得
    const html = await page.content();
    const title = await page.title();

    // スクリーンショットを撮影（オプション）
    let screenshot: Buffer | undefined;
    if (options.takeScreenshot) {
      try {
        const screenshotData = await page.screenshot({
          fullPage: true,
          type: 'jpeg',
          quality: 80, // 圧縮してストレージを節約
        });
        screenshot = Buffer.from(screenshotData as Uint8Array);
        console.log('📸 スクリーンショット撮影完了');
      } catch (screenshotError) {
        console.error('⚠️ スクリーンショット撮影に失敗しましたが、続行します:', screenshotError);
        // スクリーンショット失敗してもチェックは続行
      }
    }

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
        images.map((img: HTMLImageElement) => {
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
