import { useState, useRef } from 'react';

export default function ReceiptUpload({ onAdd }) {
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile]             = useState(null);
  const [preview, setPreview]       = useState(null);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState(null);
  const [result, setResult]         = useState(null);
  const [warnings, setWarnings]     = useState([]);
  const inputRef = useRef(null);

  // ファイルを選択したときの共通処理
  const selectFile = (f) => {
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setError(null);
    setResult(null);
  };

  const handleDragOver  = (e) => { e.preventDefault(); setIsDragging(true);  };
  const handleDragLeave = ()  => setIsDragging(false);
  const handleDrop      = (e) => { e.preventDefault(); setIsDragging(false); selectFile(e.dataTransfer.files[0]); };
  const handleChange    = (e) => selectFile(e.target.files[0]);

  // 選択をリセット
  const handleClear = (e) => {
    e.stopPropagation();
    setFile(null);
    setPreview(null);
    setResult(null);
    setError(null);
    setWarnings([]);
    if (inputRef.current) inputRef.current.value = '';
  };

  // バックエンドへ送信してレシートを解析
  const handleAnalyze = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch('/api/analyze-receipt', { method: 'POST', body: formData });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '解析に失敗しました');
      }
      const receipt = await res.json();

      // 負の金額チェック
      const negativeItems = receipt.items.filter((i) => i.price < 0);
      const localWarnings = negativeItems.map(
        (i) => `「${i.name}」の金額が負の値です（¥${i.price.toLocaleString()}）`
      );

      // 重複チェック（App側で実施）
      const { warnings: duplicateWarnings } = onAdd(receipt);

      setWarnings([...localWarnings, ...duplicateWarnings]);
      setResult(receipt);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* ドロップゾーン */}
      <div
        className={`upload-area ${isDragging ? 'dragging' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !preview && inputRef.current?.click()}
      >
        {preview ? (
          <div className="preview-wrap">
            <img src={preview} alt="レシートプレビュー" className="preview-img" />
            <button className="clear-btn" onClick={handleClear} title="画像を削除">×</button>
          </div>
        ) : (
          <>
            <div className="upload-icon">🧾</div>
            <p>レシート画像をここにドロップ<br />またはクリックして選択</p>
            <p style={{ marginTop: '.5rem', fontSize: '.8rem', color: '#9CA3AF' }}>JPEG / PNG / WEBP (最大10MB)</p>
          </>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        style={{ display: 'none' }}
        onChange={handleChange}
      />

      {/* 解析ボタン */}
      {file && !result && (
        <button className="analyze-btn" onClick={handleAnalyze} disabled={loading}>
          {loading ? (
            <><span className="spinner" />解析中...</>
          ) : (
            'レシートを解析する'
          )}
        </button>
      )}

      {/* エラー表示 */}
      {error && <div className="error-msg">{error}</div>}

      {/* 警告表示（負の金額・重複） */}
      {warnings.length > 0 && (
        <div className="warning-msg">
          {warnings.map((w, i) => (
            <p key={i}>⚠️ {w}</p>
          ))}
        </div>
      )}

      {/* 解析結果プレビュー */}
      {result && (
        <div className="result-card">
          <h3>✅ 解析完了 — {result.date}</h3>
          <ul className="result-items">
            {result.items.map((item) => (
              <li key={item.id}>
                {item.name}：¥{item.price.toLocaleString()}（{item.category}）
              </li>
            ))}
          </ul>
          <p className="result-total">合計：¥{result.total.toLocaleString()}</p>
          <button
            style={{ marginTop: '.75rem', background: 'none', border: 'none', color: '#065F46', textDecoration: 'underline', cursor: 'pointer', fontSize: '.875rem' }}
            onClick={() => { setFile(null); setPreview(null); setResult(null); setWarnings([]); if (inputRef.current) inputRef.current.value = ''; }}
          >
            続けて別のレシートを追加
          </button>
        </div>
      )}
    </div>
  );
}
