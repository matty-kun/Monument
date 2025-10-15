import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-64px)] bg-gradient-to-br from-green-50 via-gray-50 to-yellow-50 p-4 text-center">
      <h1 className="text-9xl font-extrabold text-monument-green">404</h1>
      <h2 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h2>
       <p className="text-lg text-gray-600 mb-8">
        Oops! The page you couldn&apos;t find the page you&apos;re looking for.
      </p>
      <Link href="/" className="px-6 py-3 bg-monument-green text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors duration-300">
        Go to Homepage
      </Link>
    </div>
  );
}