import express from 'express';
import cors from 'cors';
import multer from 'multer';
import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { randomUUID } from 'crypto';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// メモリ上に画像を保持するmulter設定（10MB上限）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('対応形式: JPEG, PNG, GIF, WEBP'));
    }
  },
});

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json());

// レシート解析プロンプト（システム側 — プロンプトキャッシング対象）
const SYSTEM_PROMPT = `あなたはレシート解析の専門家です。
レシート画像から商品情報を正確に読み取り、指定されたJSONフォーマットのみで回答します。
余分なテキスト・説明文・マークダウンは一切含めないでください。`;

// ユーザープロンプトテンプレート
const buildUserPrompt = (today) => `このレシート画像を解析してください。
以下のJSON形式のみで回答してください（説明文や \`\`\`json\`\`\` などは不要です）:

{
  "date": "YYYY-MM-DD（レシートの日付。不明な場合は ${today}）",
  "items": [
    { "name": "商品名", "price": 金額（税込み整数）, "category": "カテゴリ" }
  ]
}

カテゴリは以下から必ず1つ選択してください:
食費, 外食, 日用品, 交通費, 医療, 衣料, 娯楽, その他

判断基準:
- 食費: スーパー・コンビニの食材・飲料・調味料
- 外食: レストラン・カフェ・ファストフード・デリバリー
- 日用品: 洗剤・掃除用品・トイレットペーパーなど生活消耗品
- 交通費: 電車・バス・タクシー・駐車場・ガソリン
- 医療: 薬・サプリ・病院・ドラッグストアの医薬品
- 衣料: 衣服・靴・バッグ・アクセサリー
- 娯楽: 書籍・映画・ゲーム・音楽・趣味用品
- その他: 上記に分類できないもの

注意: 合計金額行は含めず、個別商品のみを列挙してください。`;

// レシート画像を解析するエンドポイント
app.post('/api/analyze-receipt', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: '画像ファイルが必要です' });
    }

    const base64Image = req.file.buffer.toString('base64');
    const mimeType = req.file.mimetype;
    const today = new Date().toISOString().split('T')[0];

    const response = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      // システムプロンプトにキャッシュを適用（同一プロンプトの繰り返し呼び出しを高速化）
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: mimeType,
                data: base64Image,
              },
            },
            {
              type: 'text',
              text: buildUserPrompt(today),
            },
          ],
        },
      ],
    });

    // Claude の返答からJSONを抽出（コードブロックが含まれる場合も対応）
    const raw = response.content[0].text;
    const start = raw.indexOf('{');
    const end = raw.lastIndexOf('}');
    if (start === -1 || end === -1) {
      throw new Error('JSONが取得できませんでした。レシートを再度アップロードしてください。');
    }
    const parsed = JSON.parse(raw.substring(start, end + 1));

    // 各アイテムにIDを付与してレシートオブジェクトを構築
    const items = (parsed.items || []).map((item) => ({
      id: randomUUID(),
      name: String(item.name),
      price: Math.round(Number(item.price)) || 0,
      category: item.category || 'その他',
    }));

    const receipt = {
      id: randomUUID(),
      date: parsed.date || today,
      uploadedAt: new Date().toISOString(),
      items,
      total: items.reduce((sum, i) => sum + i.price, 0),
    };

    res.json(receipt);
  } catch (err) {
    console.error('レシート解析エラー:', err.message);
    res.status(500).json({ error: err.message || 'レシートの解析に失敗しました' });
  }
});

app.listen(PORT, () => {
  console.log(`バックエンドサーバー起動: http://localhost:${PORT}`);
});
