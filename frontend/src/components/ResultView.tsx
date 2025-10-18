import { useMemo } from 'react'

import type { PromptResult } from '../types'

interface ResultViewProps {
  result: PromptResult | null
  isLoading: boolean
  error: string | null
  onCopy: () => void
  copied: boolean
}

export const ResultView = ({
  result,
  isLoading,
  error,
  onCopy,
  copied,
}: ResultViewProps) => {
  const formattedJson = useMemo(
    () => (result ? JSON.stringify(result, null, 2) : ''),
    [result],
  )

  return (
    <section className="flex h-full flex-col overflow-hidden rounded-3xl border border-slate-800/80 bg-slate-950/40 p-8 shadow-lg shadow-slate-950/60 backdrop-blur">
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-slate-400">
            Structured Output
          </p>
          <h2 className="text-2xl font-semibold text-white">
            Higgsfield-ready prompt JSON
          </h2>
        </div>
        <button
          type="button"
          onClick={onCopy}
          disabled={!result || isLoading}
          className="inline-flex items-center gap-2 rounded-full border border-accent-400/30 bg-accent-500/10 px-5 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-accent-200 transition hover:border-accent-400 hover:bg-accent-500/20 disabled:cursor-not-allowed disabled:border-slate-700 disabled:bg-slate-800/60 disabled:text-slate-500"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="h-4 w-4"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 16h8m-6 0V8h2m2 8V8h-2m-1-4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm-3 4H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h10"
            />
          </svg>
          {copied ? 'Copied!' : 'Copy JSON'}
        </button>
      </header>

      <div className="relative flex-1 overflow-hidden rounded-2xl border border-slate-800/60 bg-slate-950/80">
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-accent-500/5 via-transparent to-emerald-500/5" />

        <div className="relative h-full overflow-auto">
          {isLoading ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-slate-300">
              <span className="h-12 w-12 animate-spin rounded-full border-2 border-accent-400/40 border-t-transparent" />
              <p className="text-sm uppercase tracking-[0.3em] text-slate-400">
                Generating prompts…
              </p>
            </div>
          ) : null}

          {!isLoading && error ? (
            <div className="px-6 py-5 text-sm text-red-300">
              <p className="font-semibold">Request failed</p>
              <p className="mt-1 text-red-200/80">{error}</p>
            </div>
          ) : null}

          {!isLoading && !error && result ? (
            <pre className="px-6 py-5 text-sm leading-relaxed text-slate-200">
              <code className="whitespace-pre-wrap break-words font-mono text-[13px] text-slate-100">
                {formattedJson}
              </code>
            </pre>
          ) : null}

          {!isLoading && !error && !result ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6 py-5 text-center text-slate-500">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                className="h-10 w-10 text-accent-300/50"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 8v8m0-8c3 0 6 1.344 6 4 0 2.657-3 4-6 4s-6-1.343-6-4c0-2.656 3-4 6-4Z"
                />
              </svg>
              <p className="max-w-sm text-sm">
                Submit a creative brief to see structured prompts optimised for
                Higgsfield’s image and video pipelines.
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
