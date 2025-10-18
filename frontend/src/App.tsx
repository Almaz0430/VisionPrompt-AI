import { useCallback, useMemo, useState } from 'react'

import { PromptForm } from './components/PromptForm'
import { ResultView } from './components/ResultView'
import { generatePrompt } from './lib/api'
import type { PromptFormValues, PromptResult } from './types'

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  })

function App() {
  const [result, setResult] = useState<PromptResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const formattedUpdatedAt = useMemo(
    () => (lastUpdated ? formatTimestamp(lastUpdated) : null),
    [lastUpdated],
  )

  const handleSubmit = useCallback(
    async (values: PromptFormValues) => {
      setIsLoading(true)
      setError(null)
      setCopied(false)

      try {
        const payload = {
          user_query: values.userQuery,
          goals: values.goals,
          image: values.image ?? undefined,
        }
        const response = await generatePrompt(payload)
        setResult(response)
        setLastUpdated(new Date())
      } catch (submissionError) {
        if (submissionError instanceof Error) {
          setError(submissionError.message)
        } else {
          setError('Failed to generate prompts')
        }
        setResult(null)
      } finally {
        setIsLoading(false)
      }
    },
    [],
  )

  const handleCopy = useCallback(async () => {
    if (!result) {
      return
    }

    const text = JSON.stringify(result, null, 2)

    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (copyError) {
      console.error(copyError)
      setCopied(false)
    }
  }, [result])

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-slate-950 via-slate-950 to-slate-900" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute left-1/2 top-1/3 h-96 w-96 -translate-x-1/2 rounded-full bg-accent-500/30 blur-3xl" />
        <div className="absolute right-24 bottom-10 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
      </div>

      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-10 px-6 pb-20 pt-16 lg:gap-12">
        <header className="flex flex-col gap-6 text-center sm:text-left">
          <div className="inline-flex items-center gap-3 self-center rounded-full border border-accent-500/20 bg-accent-500/10 px-4 py-1 text-xs font-semibold uppercase tracking-[0.4em] text-accent-200 sm:self-start">
            VisionPrompt AI
          </div>
          <div className="space-y-3">
            <h1 className="text-4xl font-semibold text-white sm:text-5xl lg:text-6xl">
              Higgsfield prompt lab for image, edit & video pipelines
            </h1>
            <p className="max-w-3xl text-base text-slate-300 lg:text-lg">
              Describe your idea, select the generation targets, optionally add
              a reference image, and receive structured JSON prompts tailored to
              Higgsfield&apos;s multimodal APIs via our Django backend.
            </p>
          </div>
          {formattedUpdatedAt ? (
            <p className="text-xs uppercase tracking-[0.3em] text-slate-500">
              last generated · {formattedUpdatedAt}
            </p>
          ) : null}
        </header>

        <main className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] lg:gap-10">
          <PromptForm onSubmit={handleSubmit} isSubmitting={isLoading} />
          <ResultView
            result={result}
            isLoading={isLoading}
            error={error}
            onCopy={handleCopy}
            copied={copied}
          />
        </main>
      </div>
    </div>
  )
}

export default App
