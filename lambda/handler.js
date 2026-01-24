const chromium = require('@sparticuz/chromium-min');
const puppeteer = require('puppeteer-core');

exports.handler = async (event, context) => {
  let browser = null;

  try {
    // リクエストボディをパース
    const body = JSON.parse(event.body || '{}');
    const url = body.url;
    const takeScreenshot = body.takeScreenshot !== false;

    if (!url) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    console.log(`🌐 スクレイピング開始: ${url}`);

    // Puppeteerでブラウザを起動
    browser = await puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    // User-Agent設定
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    // ページにアクセス
    console.log('📥 ページ読み込み中...');
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    // ネットワークアイドルを待つ
    try {
      await page.waitForNetworkIdle({ timeout: 20000, idleTime: 500 });
    } catch (e) {
      console.log('⚠️ ネットワークアイドル待機がタイムアウト');
    }

    await new Promise(resolve => setTimeout(resolve, 1000));

    // 自動スクロール
    console.log('📜 ページをスクロール中...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
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

    await new Promise(resolve => setTimeout(resolve, 1500));

    // 画像の読み込み完了を待つ
    console.log('🖼️ 画像読み込み待機中...');
    try {
      await page.evaluate(async () => {
        const images = Array.from(document.images);
        await Promise.all(
          images
            .filter(img => !img.complete)
            .map(img => new Promise(resolve => {
              img.onload = img.onerror = resolve;
              setTimeout(resolve, 10000);
            }))
        );
      });
    } catch (e) {
      console.log('⚠️ 画像読み込み待機でエラー');
    }

    // HTMLとタイトルを取得
    const html = await page.content();
    const title = await page.title();

    console.log(`✅ HTML取得完了: ${html.length} bytes`);

    // スクリーンショット撮影
    let screenshotBase64 = null;
    if (takeScreenshot) {
      console.log('📸 スクリーンショット撮影中...');
      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'jpeg',
        quality: 80,
      });
      screenshotBase64 = screenshotBuffer.toString('base64');
      console.log(`✅ スクリーンショット完了: ${screenshotBase64.length} chars`);
    }

    await browser.close();
    browser = null;
    console.log('🔚 ブラウザをクローズしました');

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        html,
        title,
        screenshot: screenshotBase64,
        timestamp: Date.now()
      })
    };

  } catch (error) {
    console.error('❌ エラー:', error);
    
    if (browser) {
      await browser.close();
    }

    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        type: error.name
      })
    };
  }
};
