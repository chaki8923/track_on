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
        '--window-size=1280,1080', // PCサイト用の幅1280pxを維持
        '--hide-scrollbars',
        '--disable-gpu',
        '--font-render-hinting=none',
        '--disable-dev-shm-usage',
        '--single-process',
      ],
      defaultViewport: {
        width: 1280, 
        height: 1080,
        deviceScaleFactor: 0.6, // エラー回避のため0.6倍
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
      console.log('📸 撮影準備: レイアウト調整【決定版：中央寄せ】...');

      await page.evaluate(() => {
        try {
          // ★★★ 勝利の方程式: Flexbox中央寄せ + 中身フィット ★★★
          
          // 1. HTML(大枠)をFlexboxにして、子要素(body)を「中央(center)」に配置する
          // 前回は flex-end(右) でしたが、これを center に変えるだけです
          document.documentElement.style.cssText = `
            display: flex !important;
            flex-direction: column !important;
            align-items: center !important; /* ここをCenterにする！ */
            width: 100% !important;
            background-color: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
          `;

          // 2. Bodyを「中身のサイズ」まで縮め、左右マージンを均等にする
          document.body.style.cssText = `
            margin: 0 auto !important; /* 左右中央 */
            width: fit-content !important; /* 中身のサイズにフィットさせる（重要） */
            min-width: auto !important;
            max-width: 100% !important;
            display: block !important;
            background-color: #ffffff !important;
            position: relative !important; /* absoluteの子要素を閉じ込める */
            left: auto !important;
            right: auto !important;
            transform: none !important;
          `;

          // 3. 邪魔な左固定(absolute/fixed)を解除して、親(body)に従わせる
          const allElements = document.querySelectorAll('*');
          for (const el of allElements) {
            const style = window.getComputedStyle(el);

            // 固定・絶対配置要素は relative に戻してフローに乗せる
            if (style.position === 'fixed' || style.position === 'sticky' || style.position === 'absolute') {
                if (el.parentElement === document.body) {
                   el.style.setProperty('position', 'relative', 'important');
                   el.style.setProperty('float', 'none', 'important');
                   // 左右位置の指定を無効化
                   el.style.setProperty('left', 'auto', 'important');
                   el.style.setProperty('right', 'auto', 'important');
                   el.style.setProperty('margin-left', 'auto', 'important');
                   el.style.setProperty('margin-right', 'auto', 'important');
                }
            }
            
            // 背景固定解除など
            if (style.backgroundAttachment === 'fixed') {
              el.style.setProperty('background-attachment', 'scroll', 'important');
            }
          }

        } catch (e) {
          console.log('Layout fix failed', e);
        }
      });

      console.log('⏳ 描画安定化...');
      await new Promise(r => setTimeout(r, 1000));

      console.log('📸 シャッターを切ります (Width 1280 / Scale 0.6)');
      
      const tempFilePath = `/tmp/screenshot-${Date.now()}.jpg`;
      
      await page.screenshot({
        path: tempFilePath,
        fullPage: true, 
        type: 'jpeg',
        quality: 85,
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