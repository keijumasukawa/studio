# Studio

動画のアップロード・管理（編集・削除）・共有ができるフルスタックの動画プラットフォームです。

## デモ

[https://studio-beta-rose-18.vercel.app](https://studio-beta-rose-18.vercel.app)

## 主な機能

- **動画アップロード** — Mux を利用したアップロード、リアルタイムでの処理状況反映
- **動画管理（編集・削除）** — タイトル編集・公開/非公開の切り替え・複数選択での一括削除
- **動画一覧** — 公開動画の一覧表示
- **動画再生** — Mux Player による動画再生
- **認証** — Clerk によるサインイン/サインアウト
- **テーマ切り替え** — ライト / ダーク / システム設定への自動追従
- **レスポンシブ対応** — モバイル・タブレット・デスクトップへの対応
- **レート制限** — Upstash Redis による API 保護

## 技術スタック

| カテゴリ       | 技術                            |
| -------------- | ------------------------------- |
| フレームワーク | Next.js 16 (App Router)         |
| 言語           | TypeScript                      |
| スタイリング   | Tailwind CSS v4 + shadcn/ui     |
| API            | tRPC v11 + TanStack Query       |
| データベース   | Drizzle ORM + Neon (PostgreSQL) |
| 認証           | Clerk                           |
| 動画           | Mux（アップロード・処理・再生） |
| レート制限     | Upstash Redis                   |
| デプロイ       | Vercel                          |

## ローカル開発

### 必要なもの

- Node.js 18 以上
- 各サービスのアカウント: [Clerk](https://clerk.com)・[Mux](https://mux.com)・[Neon](https://neon.tech)・[Upstash](https://upstash.com)

### インストール

```bash
git clone https://github.com/keijumasukawa/studio.git
cd studio
npm install
```

### 環境変数

ルートに `.env` ファイルを作成し、以下を設定してください。

```env
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
CLERK_WEBHOOK_SIGNING_SECRET=

# Database (Neon)
DATABASE_URL=

# Mux
MUX_TOKEN_ID=
MUX_TOKEN_SECRET=
MUX_WEBHOOK_SECRET=

# Upstash Redis
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

### データベースのセットアップ

```bash
npx drizzle-kit push
```

### 開発サーバーの起動

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000) をブラウザで開いてください。

## ディレクトリ構成

```
src/
├── app/
│   ├── (main)/          # メインレイアウト（サイドバー + ヘッダー）
│   │   ├── videos/      # 公開動画一覧
│   │   └── my-videos/   # 動画管理（認証必須）
│   ├── (player)/        # プレイヤーレイアウト
│   │   └── videos/      # 動画再生ページ
│   └── api/
│       ├── trpc/        # tRPC エンドポイント
│       └── webhooks/    # Mux Webhook ハンドラ
├── components/
│   ├── ui/              # shadcn/ui ベースコンポーネント
│   └── modules/ui/      # 機能コンポーネント
├── db/                  # Drizzle スキーマ・クライアント
├── trpc/                # tRPC ルーター・プロシージャ
└── lib/                 # Mux クライアント・レート制限・ユーティリティ
```
