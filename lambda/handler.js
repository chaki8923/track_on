const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');

const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
  requestChecksumCalculation: 'WHEN_REQUIRED',
});

exports.handler = async (event, context) => {
  let browser = null;

  try {
    const body = JSON.parse(event.body || '{}');
    const url = body.url;
    const takeScreenshot = body.takeScreenshot !== false;
    const siteId = body.siteId;

    if (!url) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'URL is required' })
      };
    }

    console.log(`🌐 スクレイピング開始: ${url}`);

    browser = await puppeteer.launch({
      args: [
        ...chromium.args,
        // ★★★ 修正1: ウィンドウ幅を1280px(ノートPCサイズ)にする ★★★
        // 1920pxだと広すぎて余白ができるため、1280pxにしてコンテンツを充満させる
        '--window-size=1280,1080',
        '--hide-scrollbars',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-dev-shm-usage',
        '--single-process',
      ],
      defaultViewport: {
        width: 1280, // ここも1280pxに合わせる
        height: 1080,
        // ★★★ 修正2: 幅を狭めた分、画質を0.8まで上げる ★★★
        // 19000px * 0.8 = 15200px (限界の16384px以下なので安全かつ高画質)
        deviceScaleFactor: 0.8, 
      },
      executablePath: await chromium.executablePath(),
      headless: chromium.headless,
      ignoreHTTPSErrors: true,
    });

    const page = await browser.newPage();

    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
    );

    console.log('📥 ページ読み込み中...');
    await page.goto(url, {
      waitUntil: 'domcontentloaded',
      timeout: 60000
    });

    console.log('📜 コンテンツ読み込みスクロール...');
    await page.evaluate(async () => {
      await new Promise((resolve) => {
        let totalHeight = 0;
        const distance = 400;
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight;
          window.scrollBy(0, distance);
          totalHeight += distance;
          if (totalHeight >= scrollHeight || totalHeight > 30000) {
            clearInterval(timer);
            resolve();
          }
        }, 50);
      });
    });
    
    await page.evaluate(() => window.scrollTo(0, 0));
    await new Promise(r => setTimeout(r, 1000));

    const html = await page.content();
    const title = await page.title();

    let screenshotUrl = null;
    if (takeScreenshot && siteId) {
      console.log('📸 撮影準備: CSSハック適用...');

      await page.evaluate(() => {
        try {
          document.documentElement.style.height = 'auto';
          document.body.style.height = 'auto';
          document.body.style.overflow = 'visible';
          
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            const style = window.getComputedStyle(el);
            if (style.position === 'fixed' || style.position === 'sticky') {
              el.style.position = 'absolute';
              const rect = el.getBoundingClientRect();
              el.style.top = rect.top + window.scrollY + 'px';
              el.style.left = rect.left + window.scrollX + 'px';
              el.style.width = rect.width + 'px';
              el.style.zIndex = '9999';
            }
            if (style.backgroundAttachment === 'fixed') {
              el.style.backgroundAttachment = 'scroll';
            }
            if (style.animation) el.style.animation = 'none';
            if (style.transition) el.style.transition = 'none';
          }
          document.body.style.backgroundAttachment = 'scroll';
        } catch (e) {
          console.log('Layout fix failed', e);
        }
      });

      console.log('⏳ 描画安定化...');
      await new Promise(r => setTimeout(r, 1000));

      console.log('📸 シャッターを切ります (Width 1280 / Scale 0.8)');
      
      const tempFilePath = `/tmp/screenshot-${Date.now()}.jpg`;
      
      await page.screenshot({
        path: tempFilePath,
        fullPage: true, 
        type: 'jpeg',
        quality: 85, // 画質さらにアップ
      });

      const fileBuffer = fs.readFileSync(tempFilePath);
      console.log(`✅ 撮影成功: ${fileBuffer.length} bytes`);

      try {
        const timestamp = Date.now();
        const fileName = `${siteId}/${timestamp}.jpg`;
        if (process.env.R2_BUCKET_NAME) {
          await r2Client.send(new PutObjectCommand({
            Bucket: process.env.R2_BUCKET_NAME,
            Key: fileName,
            Body: fileBuffer,
            ContentType: 'image/jpeg',
            CacheControl: 'public, max-age=31536000',
          }));
          screenshotUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;
          console.log(`✅ Uploaded: ${screenshotUrl}`);
        }
        
        fs.unlinkSync(tempFilePath);
        
      } catch (uploadError) {
        console.error('❌ Upload failed:', uploadError);
      }
    }

    await browser.close();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ html, title, screenshotUrl, timestamp: Date.now() })
    };

  } catch (error) {
    console.error('❌ Error:', error);
    if (browser) await browser.close();
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message })
    };
  }
};