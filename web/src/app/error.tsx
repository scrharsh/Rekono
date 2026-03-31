'use client';
 
import { useEffect } from 'react';
 
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);
 
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-slate-800 mb-4">500</h1>
        <p className="text-xl text-slate-600 mb-8">Something went wrong!</p>
        <button className="btn-primary" onClick={() => reset()}>
          Try again
        </button>
      </div>
    </div>
  );
}
