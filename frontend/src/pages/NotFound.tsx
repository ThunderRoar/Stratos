import { Link } from 'react-router-dom'

export function NotFound() {
  return (
    <div className="p-6 min-h-[60vh] flex items-center justify-center">
      <div className="text-center max-w-md">
        <div className="text-6xl font-mono font-semibold text-fg-3 mb-2">404</div>
        <h1 className="text-2xl font-semibold tracking-tight text-fg mb-3">Page not found</h1>
        <p className="text-sm text-fg-2 mb-6">
          That route doesn't exist. Try one of these instead.
        </p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <Link
            to="/"
            className="rounded-full bg-accent hover:bg-accent/90 px-4 py-2 text-sm font-semibold text-bg transition"
          >
            Home
          </Link>
          <Link
            to="/builder"
            className="rounded-full border border-line bg-surface hover:bg-surface-elev px-4 py-2 text-sm font-semibold text-fg transition"
          >
            Builder
          </Link>
          <Link
            to="/earn"
            className="rounded-full border border-line bg-surface hover:bg-surface-elev px-4 py-2 text-sm font-semibold text-fg transition"
          >
            Earn
          </Link>
        </div>
      </div>
    </div>
  )
}
