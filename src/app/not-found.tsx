import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-50 via-gray-50 to-yellow-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 text-center relative overflow-hidden">
      {/* Sporty Background Elements */}
      <div className="absolute inset-0 opacity-5 dark:opacity-10">
        <div className="absolute top-10 left-10 text-9xl">🏆</div>
        <div className="absolute top-20 right-20 text-8xl">⚽</div>
        <div className="absolute bottom-20 left-20 text-7xl">🏀</div>
        <div className="absolute bottom-10 right-10 text-9xl">🏅</div>
        <div className="absolute top-1/2 left-1/4 text-6xl">🎯</div>
        <div className="absolute top-1/3 right-1/3 text-7xl">🏐</div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 space-y-6">
        {/* Animated Trophy */}
        <div className="text-8xl mb-4 animate-bounce">🏆</div>
        
        <h1 className="text-9xl font-extrabold text-monument-green dark:text-green-400 drop-shadow-lg">
          404
        </h1>
        
        <div className="space-y-2">
          <h2 className="text-4xl font-bold text-gray-800 dark:text-gray-100">
            Out of Bounds!
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Looks like this play didn&apos;t go as planned. The page you&apos;re looking for is off the field! 🏃‍♂️
          </p>
        </div>

        {/* Score Display */}
        <div className="flex gap-4 justify-center items-center my-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-monument-green dark:border-green-500">
            <div className="text-4xl font-bold text-monument-green dark:text-green-400">0</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pages Found</div>
          </div>
          <div className="text-3xl font-bold text-gray-400 dark:text-gray-500">VS</div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-lg border-2 border-red-500">
            <div className="text-4xl font-bold text-red-500">404</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Error Code</div>
          </div>
        </div>

        {/* Call to Action Button */}
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-8 py-4 bg-monument-green !text-white font-bold text-lg rounded-lg shadow-xl hover:bg-green-700 hover:scale-105 dark:bg-green-600 dark:hover:bg-green-700 transition-all duration-300 transform"
        >
          <span>🏠</span>
          Back to Home Base
        </Link>

        {/* Motivational Quote */}
        <p className="text-sm text-gray-500 dark:text-gray-400 italic mt-8 max-w-md mx-auto">
          &quot;Every champion was once a contender that refused to give up.&quot;
        </p>
      </div>
    </div>
  );
}