export default function ItemList({ receipts, onDeleteReceipt, onDeleteItem }) {
  if (receipts.length === 0) {
    return (
      <div className="empty-state">
        <p>まだレシートが登録されていません。</p>
        <p style={{ marginTop: '.5rem', fontSize: '.85rem' }}>「アップロード」タブから画像を追加してください。</p>
      </div>
    );
  }

  return (
    <div className="item-list">
      {receipts.map((receipt) => (
        <div key={receipt.id} className="receipt-card">
          {/* レシートヘッダー */}
          <div className="receipt-header">
            <h3>{receipt.date}</h3>
            <span className="receipt-total">¥{receipt.total.toLocaleString()}</span>
            <button className="del-btn" onClick={() => onDeleteReceipt(receipt.id)}>
              レシートを削除
            </button>
          </div>

          {/* アイテム一覧テーブル */}
          <table className="items-table">
            <thead>
              <tr>
                <th>商品名</th>
                <th className="price-cell">金額</th>
                <th>カテゴリ</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {receipt.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.name}</td>
                  <td className="price-cell">¥{item.price.toLocaleString()}</td>
                  <td>
                    <span className={`badge badge-${item.category}`}>{item.category}</span>
                  </td>
                  <td>
                    <button className="del-btn" onClick={() => onDeleteItem(receipt.id, item.id)}>×</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}
