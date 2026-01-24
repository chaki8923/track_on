import json
import base64
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
import time

def lambda_handler(event, context):
    """
    Lambda関数のエントリーポイント
    競合サイトをスクレイピングしてHTMLとスクリーンショットを返す
    """
    try:
        # リクエストボディから情報を取得
        body = json.loads(event.get('body', '{}'))
        url = body.get('url')
        take_screenshot = body.get('takeScreenshot', True)
        
        if not url:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'URL is required'})
            }
        
        print(f'🌐 スクレイピング開始: {url}')
        
        # Chromeオプション設定
        chrome_options = Options()
        chrome_options.binary_location = '/opt/chrome/chrome'
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--disable-gpu')
        chrome_options.add_argument('--disable-features=NetworkService')
        chrome_options.add_argument('--window-size=1920x1080')
        chrome_options.add_argument('--single-process')
        chrome_options.add_argument('--disable-dev-tools')
        chrome_options.add_argument('--no-zygote')
        chrome_options.add_argument('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36')
        
        # WebDriverの起動
        service = Service('/opt/chromedriver')
        driver = webdriver.Chrome(service=service, options=chrome_options)
        
        try:
            # ページにアクセス
            print(f'📥 ページ読み込み中...')
            driver.set_page_load_timeout(60)
            driver.get(url)
            
            # JavaScriptの実行を待つ
            time.sleep(2)
            
            # レイジーロード画像を読み込むためにスクロール
            print('📜 ページをスクロール中...')
            driver.execute_script("""
                const scrollHeight = document.body.scrollHeight;
                const distance = 300;
                let scrolled = 0;
                
                function scrollStep() {
                    window.scrollBy(0, distance);
                    scrolled += distance;
                    if (scrolled < scrollHeight) {
                        setTimeout(scrollStep, 100);
                    } else {
                        window.scrollTo(0, 0);
                    }
                }
                scrollStep();
            """)
            time.sleep(3)
            
            # 画像の読み込み完了を待つ
            print('🖼️ 画像読み込み待機中...')
            driver.execute_script("""
                return Promise.all(
                    Array.from(document.images)
                        .filter(img => !img.complete)
                        .map(img => new Promise(resolve => {
                            img.onload = img.onerror = resolve;
                            setTimeout(resolve, 10000);
                        }))
                );
            """)
            time.sleep(1)
            
            # HTMLとタイトルを取得
            html = driver.page_source
            title = driver.title
            
            print(f'✅ HTML取得完了: {len(html)} bytes')
            
            # スクリーンショット撮影
            screenshot_base64 = None
            if take_screenshot:
                print('📸 スクリーンショット撮影中...')
                screenshot_bytes = driver.get_screenshot_as_png()
                screenshot_base64 = base64.b64encode(screenshot_bytes).decode('utf-8')
                print(f'✅ スクリーンショット完了: {len(screenshot_base64)} chars')
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'html': html,
                    'title': title,
                    'screenshot': screenshot_base64,
                    'timestamp': int(time.time() * 1000)
                })
            }
        
        finally:
            driver.quit()
            print('🔚 ブラウザをクローズしました')
    
    except Exception as e:
        print(f'❌ エラー: {str(e)}')
        import traceback
        traceback.print_exc()
        
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'type': type(e).__name__
            })
        }
