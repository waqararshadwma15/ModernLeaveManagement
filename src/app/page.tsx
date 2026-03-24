import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center p-4">
      <div className="text-center space-y-6 max-w-2xl">
        <h1 className="text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight">
          Modern <span className="text-indigo-600">Leave Management</span>
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400">
          Streamline your organization's time-off requests with real-time approvals and powerful analytics.
        </p>
        <div className="pt-8">
          <Link href="/login" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 px-8 rounded-full text-lg shadow-lg shadow-indigo-200 dark:shadow-none transition-transform hover:scale-105 inline-block">
            Login to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
