'use client';

export default function OfflineClient() {
  return (
    <div className="min-h-screen bg-theme-bg flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Logo */}
        <div className="mb-8">
          <span
            className="text-theme-accent text-5xl font-bold tracking-widest"
            style={{ fontFamily: 'Georgia, serif' }}
          >
            FA
          </span>
          <p className="text-theme-muted text-xs tracking-[0.4em] uppercase mt-1">
            Interior
          </p>
        </div>

        {/* Icon */}
          <div className="w-20 h-20 mx-auto mb-6 rounded-full border border-theme-border flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-9 h-9 text-theme-muted"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-theme-dark mb-3" style={{ fontFamily: 'Georgia, serif' }}>
          You're Offline
        </h1>

        <p className="text-theme-muted text-sm leading-relaxed mb-8">
          It looks like you've lost your internet connection. Some pages may still
          be available from your cache.
        </p>

        {/* Try again */}
        <button
          onClick={() => window.location.reload()}
          className="px-8 py-3 bg-theme-accent text-[#2C1E18] text-sm font-semibold tracking-widest uppercase hover:bg-[#b8954f] transition-colors"
        >
          Try Again
        </button>

        <p className="text-theme-muted text-xs mt-6">
          Fahad Ali Interior — Premium Furniture, Lahore
        </p>
      </div>
    </div>
  );
}
