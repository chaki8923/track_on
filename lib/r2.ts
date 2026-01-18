import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';

/**
 * Cloudflare R2クライアント（S3互換）
 */
export const r2Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || '',
  },
});

/**
 * R2にスクリーンショットをアップロード
 * @param buffer 画像データ
 * @param siteId サイトID
 * @param timestamp タイムスタンプ
 * @returns アップロードされた画像の公開URL
 */
export async function uploadScreenshot(
  buffer: Buffer,
  siteId: string,
  timestamp: number
): Promise<string> {
  const fileName = `${siteId}/${timestamp}.jpg`;
  const bucketName = process.env.R2_BUCKET_NAME || '';
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  if (!bucketName || !publicUrl) {
    throw new Error('R2の設定が不完全です。R2_BUCKET_NAMEとR2_PUBLIC_URLを設定してください。');
  }

  const command = new PutObjectCommand({
    Bucket: bucketName,
    Key: fileName,
    Body: buffer,
    ContentType: 'image/jpeg',
    CacheControl: 'public, max-age=31536000', // 1年間キャッシュ
  });

  await r2Client.send(command);

  return `${publicUrl}/${fileName}`;
}

/**
 * R2から画像を削除
 * @param imageUrl 画像のURL
 */
export async function deleteScreenshot(imageUrl: string): Promise<void> {
  if (!isR2Configured()) {
    console.warn('⚠️ R2が設定されていないため、画像削除をスキップします。');
    return;
  }

  const bucketName = process.env.R2_BUCKET_NAME || '';
  const publicUrl = process.env.R2_PUBLIC_URL || '';

  // URLからファイル名を抽出
  const fileName = imageUrl.replace(`${publicUrl}/`, '');
  
  if (!fileName || fileName === imageUrl) {
    console.warn('⚠️ 無効なR2 URLです:', imageUrl);
    return;
  }

  try {
    const command = new DeleteObjectCommand({
      Bucket: bucketName,
      Key: fileName,
    });

    await r2Client.send(command);
    console.log(`✅ R2から画像を削除しました: ${fileName}`);
  } catch (error) {
    console.error(`❌ R2画像削除エラー (${fileName}):`, error);
    // エラーでも処理を続行（DB削除は行う）
  }
}

/**
 * R2の設定が完了しているかチェック
 */
export function isR2Configured(): boolean {
  return !!(
    process.env.R2_ACCOUNT_ID &&
    process.env.R2_ACCESS_KEY_ID &&
    process.env.R2_SECRET_ACCESS_KEY &&
    process.env.R2_BUCKET_NAME &&
    process.env.R2_PUBLIC_URL
  );
}
