import Link from 'next/link';

const PRIMARY = '#166534';

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="text-center space-y-6 px-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-2" style={{ background: PRIMARY }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 3v18h18" /><path d="M18 17V9" /><path d="M13 17V5" /><path d="M8 17v-3" />
          </svg>
        </div>
        <h1 className="text-4xl font-bold text-[#111827]">Voltex Performance Dashboard</h1>
        <p className="text-[#64748b] text-lg max-w-md mx-auto">
          E-Commerce operations dashboard — track orders, delivery performance, product lines, and regional insights in real-time.
        </p>
        <Link href="/dashboard"
          className="inline-block px-10 py-3 rounded-lg text-lg font-semibold text-white shadow-md hover:opacity-90 transition-opacity"
          style={{ background: PRIMARY }}>
          Xem Dashboard
        </Link>
      </div>
    </main>
  );
}
