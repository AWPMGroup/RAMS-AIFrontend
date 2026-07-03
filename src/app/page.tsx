import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-[#0B3D2E] text-white flex items-center justify-center">
      <div className="text-center max-w-2xl px-6">
        <h1 className="text-6xl font-bold mb-6 tracking-tight">
          RAMS.AI
        </h1>

        <p className="text-xl text-gray-200 mb-10 max-w-xl">
          Professional RAMS Review — Clear. Reliable. Fast.
        </p>

        <Link href="/review">
          <button className="bg-[#2ECC71] text-black px-8 py-4 rounded-xl font-semibold text-lg hover:scale-105 transition-all duration-200 shadow-lg">
            Start Review
          </button>
        </Link>
      </div>
    </main>
  );
}