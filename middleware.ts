import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next()
  
  // ⚠️ 重要: ミドルウェアでgetSession()を呼び出さない
  // これがレート制限エラーの原因です
  // セッション確認はCookieで行われ、必要に応じてページ側で自動リフレッシュされます
  const supabase = createMiddlewareClient({ req, res })

  // Cookieの更新のみ行う（getSession()は呼ばない）
  // これによりセッションCookieが適切に管理されます
  
  return res
}

export const config = {
  // 静的ファイルとNext.jsの内部パスを除外
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}

