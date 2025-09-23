export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-br from-emerald-50 to-violet-50 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center space-y-8 animate-fade-in">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-xl rounded-3xl p-12 max-w-2xl mx-auto border border-white/20">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-emerald-600 to-violet-600 bg-clip-text text-transparent mb-6">
            ZenFocus
          </h1>
          <p className="text-2xl text-gray-600 dark:text-gray-300 mb-8 font-light">
            Minimalistic Focus & Wellness
          </p>
          <div className="space-y-4">
            <p className="text-gray-500 dark:text-gray-400">
              Your focus timer application is being set up...
            </p>
            <div className="flex justify-center space-x-4 flex-wrap gap-2">
              <div className="mode-study px-4 py-2 rounded-xl font-medium border">
                🎓 Study
              </div>
              <div className="mode-deepwork px-4 py-2 rounded-xl font-medium border">
                💻 Deep Work
              </div>
              <div className="mode-yoga px-4 py-2 rounded-xl font-medium border">
                🧘 Yoga
              </div>
              <div className="mode-zen px-4 py-2 rounded-xl font-medium border">
                🌌 Zen
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}