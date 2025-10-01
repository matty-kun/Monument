"use client";

import Image from "next/image";

export default function NotAuthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center p-8">
      <Image
        src="https://placehold.co/400x200?text=Meme+Here"
        alt="Not authorized meme"
        width={400}
        height={200}
        className="mb-6 rounded shadow"
      />
      <h1 className="text-3xl font-bold text-red-600 mb-4">🚫 Not Authorized</h1>
      <p className="text-gray-700 mb-4">You do not have permission to view this page.</p>
      <a href="/" className="text-monument-green underline">Go back to home</a>
    </div>
  );
}
