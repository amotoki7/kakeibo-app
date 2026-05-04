# kakeibo-app

レシート画像をアップロードすると Claude API が自動読み取りし、家計を管理できる Web アプリ。

## プロジェクト構成

```
kakeibo-app/
├── backend/              # Node.js/Express サーバー
│   ├── server.js         # API サーバー（Claude API 呼び出し）
│   ├── .env              # APIキー（.gitignore 対象 — コミット禁止）
│   └── .env.example      # .env のテンプレート
├── frontend/             # React（Vite）フロントエンド
│   ├── src/
│   │   ├── App.jsx       # メインコンポーネント・localStorage管理
│   │   ├── index.css     # グローバルスタイル
│   │   └── components/
│   │       ├── ReceiptUpload.jsx  # 画像アップロード・解析UI
│   │       ├── ItemList.jsx       # 明細一覧・削除
│   │       └── Charts.jsx         # カテゴリ円グラフ・月別棒グラフ
│   ├── vite.config.js    # /api → localhost:3001 プロキシ
│   └── index.html
└── package.json          # concurrently で両サーバーを同時起動
```

## 技術スタック

| レイヤー   | 技術                       |
|------------|----------------------------|
| フロントエンド | React 18 + Vite          |
| バックエンド   | Node.js + Express        |
| AI         | Claude API (claude-haiku-4-5-20251001) |
| グラフ     | Chart.js + react-chartjs-2 |
| 永続化     | localStorage               |

## セットアップ

```bash
# 1. 依存パッケージをインストール
npm run install:all

# 2. APIキーを設定
cp backend/.env.example backend/.env
# backend/.env を編集して ANTHROPIC_API_KEY を入力

# 3. 開発サーバーを起動（フロント: 5173、バック: 3001）
npm run dev
```

## コマンド

| コマンド                | 説明                                       |
|-------------------------|--------------------------------------------|
| `npm run dev`           | バックエンド + フロントエンドを同時起動      |
| `npm run dev:backend`   | バックエンドのみ起動 (port 3001)            |
| `npm run dev:frontend`  | フロントエンドのみ起動 (port 5173)          |
| `npm run install:all`   | backend/frontend の依存パッケージを一括インストール |

## Git 運用ルール

### 基本方針
- **コードを変更するたびに、必ずコミットして GitHub にプッシュする**
- main ブランチへの直接プッシュを基本とする
- 大きな機能追加・リファクタリングはブランチを切る

### コミット手順

```bash
git add <変更ファイル>       # ファイルを明示する（git add . は避ける）
git commit -m "変更内容"
git push origin main
```

### コミットメッセージ
- 日本語または英語どちらでもよい
- 変更の「なぜ」を中心に書く
- 例: `レシート解析のカテゴリ判定精度を向上`、`fix: 月別グラフが空のとき崩れる不具合を修正`

### プッシュのタイミング
- ファイルを編集・追加・削除したとき（どんな小さな変更でも）
- 作業を中断・終了するとき

### コミット禁止ファイル
- `backend/.env`（APIキーが含まれるため）
- `node_modules/`
- `frontend/dist/`
