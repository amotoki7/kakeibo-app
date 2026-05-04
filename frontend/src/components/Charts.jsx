import { Pie, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from 'chart.js';

// 使用するChart.jsモジュールを登録
ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

// カテゴリと対応する色
const CATEGORY_COLORS = {
  食費:   '#FF6384',
  外食:   '#FF9F40',
  日用品: '#FFCD56',
  交通費: '#4BC0C0',
  医療:   '#36A2EB',
  衣料:   '#9966FF',
  娯楽:   '#FF63A5',
  その他: '#C9CBCF',
};

export default function Charts({ receipts }) {
  // 全アイテムをフラット化
  const allItems = receipts.flatMap((r) => r.items);

  if (allItems.length === 0) {
    return (
      <div className="empty-state">
        <p>グラフを表示するにはレシートを登録してください。</p>
      </div>
    );
  }

  // カテゴリ別集計
  const categoryTotals = {};
  allItems.forEach((item) => {
    const cat = item.category in CATEGORY_COLORS ? item.category : 'その他';
    categoryTotals[cat] = (categoryTotals[cat] || 0) + item.price;
  });

  // 月別集計（YYYY-MM 単位で集計後、昇順ソート）
  const monthlyTotals = {};
  receipts.forEach((r) => {
    const month = r.date.substring(0, 7);
    monthlyTotals[month] = (monthlyTotals[month] || 0) + r.total;
  });
  const sortedMonths = Object.keys(monthlyTotals).sort();

  // 合計計算
  const grandTotal   = allItems.reduce((s, i) => s + i.price, 0);
  const activeCats   = Object.keys(categoryTotals);

  // 円グラフ用データ
  const pieData = {
    labels: activeCats,
    datasets: [{
      data: activeCats.map((c) => categoryTotals[c]),
      backgroundColor: activeCats.map((c) => CATEGORY_COLORS[c] || '#C9CBCF'),
      borderWidth: 2,
      borderColor: '#fff',
    }],
  };

  // 棒グラフ用データ
  const barData = {
    labels: sortedMonths,
    datasets: [{
      label: '月別支出',
      data: sortedMonths.map((m) => monthlyTotals[m]),
      backgroundColor: '#60A5FA',
      borderRadius: 4,
    }],
  };

  const barOptions = {
    responsive: true,
    plugins: { legend: { display: false } },
    scales: {
      y: {
        ticks: { callback: (v) => `¥${Number(v).toLocaleString()}` },
      },
    },
  };

  return (
    <div>
      {/* サマリー統計 */}
      <div className="summary-bar">
        <div className="summary-stat">
          <div className="label">総支出</div>
          <div className="value">¥{grandTotal.toLocaleString()}</div>
        </div>
        <div className="summary-stat">
          <div className="label">登録レシート</div>
          <div className="value">{receipts.length} 枚</div>
        </div>
        <div className="summary-stat">
          <div className="label">登録商品数</div>
          <div className="value">{allItems.length} 点</div>
        </div>
      </div>

      {/* グラフ */}
      <div className="charts-grid">
        {/* カテゴリ別円グラフ */}
        <div className="chart-card">
          <h3>カテゴリ別支出</h3>
          <div className="chart-wrap">
            <Pie data={pieData} options={{ responsive: true, maintainAspectRatio: true }} />
          </div>
          <div className="cat-legend">
            {activeCats.map((cat) => (
              <div key={cat} className="legend-row">
                <span className="legend-dot" style={{ background: CATEGORY_COLORS[cat] || '#C9CBCF' }} />
                <span className="legend-name">{cat}</span>
                <span className="legend-amount">¥{categoryTotals[cat].toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 月別棒グラフ */}
        <div className="chart-card">
          <h3>月別支出</h3>
          <Bar data={barData} options={barOptions} />
        </div>
      </div>
    </div>
  );
}
