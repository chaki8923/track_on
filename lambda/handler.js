const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

// R2クライアント（S3互換）
const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  // ★重要: AWS SDK v3とR2の互換性問題を回避する設定
  // これがないとAccessDeniedやSignatureDoesNotMatchエラーになることがある
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

exports.handler = async (event, context) => {
  let browser = null;

  try {
    // リクエストボディをパース
    const body = JSON.parse(event.body || '{}');
    const url = body.url;
    const takeScreenshot = body.takeScreenshot !== false;
    const siteId = body.siteId; // R2アップロード用

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
      args: [
        ...chromium.args,
        '--window-size=1920,1080', // ★修正: ウィンドウサイズをフルHDに強制
        '--hide-scrollbars',       // スクロールバーを隠す
      ],
      defaultViewport: {
        width: 1920,
        height: 1080,
        deviceScaleFactor: 1,
      },
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

    // スクリーンショット撮影とR2アップロード
    let screenshotUrl = null;
    if (takeScreenshot && siteId) {
      console.log('📸 スクリーンショット撮影準備中...');

      // ★修正: 撮影直前にCSSを調整して「下切れ」を防ぐ
      // height: 100vh などのスタイルを強制解除し、コンテンツの高さに合わせる
      await page.evaluate(() => {
        try {
          document.documentElement.style.height = 'auto';
          document.body.style.height = 'auto';
          document.body.style.overflow = 'visible';
        } catch (e) {
          console.log('Style override failed', e);
        }
      });

      const screenshotBuffer = await page.screenshot({
        fullPage: true,
        type: 'jpeg',
        quality: 80,
        captureBeyondViewport: true, // ビューポート外もキャプチャ
      });
      console.log(`✅ スクリーンショット完了: ${screenshotBuffer.length} bytes`);

      // R2に直接アップロード
      try {
        const timestamp = Date.now();
        const fileName = `${siteId}/${timestamp}.jpg`;
        const bucketName = process.env.R2_BUCKET_NAME;
        const publicUrl = process.env.R2_PUBLIC_URL;

        if (!bucketName || !publicUrl) {
          console.warn('⚠️ R2設定が不完全です。スクリーンショットをスキップします。');
        } else {
          const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: fileName,
            Body: screenshotBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000',
          });

          await r2Client.send(command);
          screenshotUrl = `${publicUrl}/${fileName}`;
          console.log(`✅ R2にアップロード完了: ${screenshotUrl}`);
        }
      } catch (uploadError) {
        console.error('❌ R2アップロードエラー:', uploadError);
        // エラー詳細をログに出す
        console.error(JSON.stringify(uploadError, null, 2));
      }
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
        screenshotUrl, 
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