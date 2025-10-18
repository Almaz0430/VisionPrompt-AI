import { useCallback, useMemo, useState } from 'react'
import type { FormEvent } from 'react'

import type { Goal, PromptFormValues } from '../types'
import { UploadZone } from './UploadZone'

const GOAL_OPTIONS: Array<{ value: Goal; label: string; description: string }> =
  [
    {
      value: 'image_generation',
      label: 'Image Generation',
      description: 'Create new visuals from scratch with Higgsfield AI.',
    },
    {
      value: 'image_editing',
      label: 'Image Editing',
      description: 'Upload an image and request targeted edits or variations.',
    },
    {
      value: 'video_generation',
      label: 'Video Generation',
      description: 'Compose narrative video prompts and motion guidance.',
    },
  ]

interface PromptFormProps {
  onSubmit: (values: PromptFormValues) => Promise<void> | void
  isSubmitting: boolean
}

export const PromptForm = ({ onSubmit, isSubmitting }: PromptFormProps) => {
  const [userQuery, setUserQuery] = useState('')
  const [selectedGoals, setSelectedGoals] = useState<Goal[]>([
    'image_generation',
  ])
  const [image, setImage] = useState<File | null>(null)
  const [validationError, setValidationError] = useState<string | null>(null)

  const handleGoalToggle = useCallback(
    (goal: Goal) => {
      setSelectedGoals((prev) =>
        prev.includes(goal) ? prev.filter((value) => value !== goal) : [...prev, goal],
      )
    },
    [],
  )

  const goalBadges = useMemo(
    () =>
      selectedGoals.map((goal) => (
        <span
          key={goal}
          className="rounded-full bg-accent-500/20 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-accent-200"
        >
          {goal.replace('_', ' ')}
        </span>
      )),
    [selectedGoals],
  )

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault()
      setValidationError(null)

      if (!userQuery.trim()) {
        setValidationError('Add a short creative brief to continue.')
        return
      }

      if (selectedGoals.length === 0) {
        setValidationError('Pick at least one generation goal.')
        return
      }

      const payload: PromptFormValues = {
        userQuery,
        goals: selectedGoals,
        image,
      }

      await onSubmit(payload)
    },
    [image, onSubmit, selectedGoals, userQuery],
  )

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-8 rounded-3xl border border-slate-800/80 bg-slate-950/70 p-8 shadow-lg shadow-slate-950/60 backdrop-blur"
    >
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <label
            htmlFor="user-query"
            className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300"
          >
            Creative Brief
          </label>
          <div className="flex flex-wrap items-center gap-2">{goalBadges}</div>
        </div>
        <textarea
          id="user-query"
          name="user_query"
          required
          rows={5}
          value={userQuery}
          onChange={(event) => setUserQuery(event.target.value)}
          placeholder="Describe your vision — context, style, mood, references, constraints..."
          className="w-full rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-3 text-base text-slate-100 shadow-inner shadow-slate-950/70 outline-none transition placeholder:text-slate-500 focus:border-accent-400 focus:ring-2 focus:ring-accent-500/50"
        />
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Generation Goals
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          {GOAL_OPTIONS.map((goalOption) => {
            const isChecked = selectedGoals.includes(goalOption.value)
            return (
              <label
                key={goalOption.value}
                className={`group relative flex cursor-pointer flex-col gap-2 rounded-2xl border px-4 py-4 transition ${
                  isChecked
                    ? 'border-accent-400 bg-accent-500/15 shadow-glow'
                    : 'border-slate-800 bg-slate-900/40 hover:border-accent-500/40 hover:bg-slate-900/70'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-slate-100">
                    {goalOption.label}
                  </span>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded border-slate-700 text-accent-400 focus:ring-accent-400"
                    checked={isChecked}
                    onChange={() => handleGoalToggle(goalOption.value)}
                  />
                </div>
                <span className="text-xs text-slate-400">
                  {goalOption.description}
                </span>
              </label>
            )
          })}
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-300">
          Reference Image (optional)
        </p>
        <UploadZone
          file={image}
          onFileChange={setImage}
          disabled={isSubmitting}
        />
      </div>

      {validationError ? (
        <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
          {validationError}
        </p>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs uppercase tracking-[0.3em] text-slate-500">
          powered by VisionPrompt AI
        </span>
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center gap-2 rounded-full bg-accent-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-accent-400 disabled:cursor-not-allowed disabled:bg-accent-500/40"
        >
          {isSubmitting ? (
            <>
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
              Generating...
            </>
          ) : (
            'Generate Prompts'
          )}
        </button>
      </div>
    </form>
  )
}
