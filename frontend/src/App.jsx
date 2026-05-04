import { useState, useEffect } from 'react';
import ReceiptUpload from './components/ReceiptUpload';
import ItemList from './components/ItemList';
import Charts from './components/Charts';

// localStorageのキー
const STORAGE_KEY = 'kakeibo_receipts';

const TABS = [
  { id: 'upload', label: 'アップロード' },
  { id: 'list',   label: '明細一覧' },
  { id: 'charts', label: 'グラフ' },
];

export default function App() {
  const [receipts, setReceipts] = useState([]);
  const [activeTab, setActiveTab] = useState('upload');

  // 起動時にlocalStorageからデータを復元
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setReceipts(JSON.parse(saved));
      } catch {
        // 壊れたデータは無視
      }
    }
  }, []);

  // レシートが変わるたびにlocalStorageへ保存
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(receipts));
  }, [receipts]);

  // 新しいレシートを先頭に追加
  const handleAdd = (receipt) => {
    setReceipts((prev) => [receipt, ...prev]);
    setActiveTab('list');
  };

  // レシート全体を削除
  const handleDeleteReceipt = (id) => {
    setReceipts((prev) => prev.filter((r) => r.id !== id));
  };

  // レシート内の特定アイテムを削除し、合計を再計算
  const handleDeleteItem = (receiptId, itemId) => {
    setReceipts((prev) =>
      prev.map((r) => {
        if (r.id !== receiptId) return r;
        const items = r.items.filter((i) => i.id !== itemId);
        return { ...r, items, total: items.reduce((s, i) => s + i.price, 0) };
      })
    );
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1>レシート家計簿</h1>
        <nav className="tab-nav">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="app-main">
        {activeTab === 'upload' && (
          <ReceiptUpload onAdd={handleAdd} />
        )}
        {activeTab === 'list' && (
          <ItemList
            receipts={receipts}
            onDeleteReceipt={handleDeleteReceipt}
            onDeleteItem={handleDeleteItem}
          />
        )}
        {activeTab === 'charts' && (
          <Charts receipts={receipts} />
        )}
      </main>
    </div>
  );
}
