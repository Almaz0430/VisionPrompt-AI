import {
  type ChangeEvent,
  type DragEvent,
  useCallback,
  useId,
  useState,
} from 'react'

interface UploadZoneProps {
  file: File | null
  onFileChange: (file: File | null) => void
  disabled?: boolean
}

const formatBytes = (bytes: number): string => {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return '0 B'
  }

  const units = ['B', 'KB', 'MB', 'GB']
  const exponent = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1,
  )

  const value = bytes / Math.pow(1024, exponent)
  return `${value.toFixed(value >= 10 || exponent === 0 ? 0 : 1)} ${
    units[exponent]
  }`
}

export const UploadZone = ({
  file,
  onFileChange,
  disabled = false,
}: UploadZoneProps) => {
  const [isDragging, setIsDragging] = useState(false)
  const inputId = useId()

  const resetDragState = useCallback(() => setIsDragging(false), [])

  const handleDrop = useCallback(
    (event: DragEvent<HTMLLabelElement>) => {
      event.preventDefault()
      event.stopPropagation()

      if (disabled) {
        resetDragState()
        return
      }

      const droppedFile = event.dataTransfer.files?.[0]
      if (droppedFile) {
        onFileChange(droppedFile)
      }
      resetDragState()
    },
    [disabled, onFileChange, resetDragState],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    if (!disabled) {
      setIsDragging(true)
    }
  }, [disabled])

  const handleDragLeave = useCallback((event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    event.stopPropagation()
    resetDragState()
  }, [resetDragState])

  const handleFileInput = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextFile = event.target.files?.[0] ?? null
      onFileChange(nextFile)
    },
    [onFileChange],
  )

  const handleClear = useCallback(() => onFileChange(null), [onFileChange])

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        className={`relative flex w-full cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-700/70 bg-slate-900/40 px-6 py-8 transition-all hover:border-accent-400/80 hover:bg-slate-900/70 ${
          isDragging ? 'border-accent-400 bg-slate-900 shadow-glow' : ''
        } ${disabled ? 'cursor-not-allowed opacity-60' : ''}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          id={inputId}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileInput}
          disabled={disabled}
        />

        <div className="flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent-500/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              className="h-6 w-6 text-accent-300"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 16V4m0 0-3.5 3.5M12 4l3.5 3.5M6 13v5a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-5"
              />
            </svg>
          </div>
          <div className="space-y-1">
            <p className="text-base font-medium text-slate-200">
              Drop an image or click to upload
            </p>
            <p className="text-sm text-slate-400">
              Supported formats: PNG, JPG, WEBP — up to 10MB
            </p>
          </div>
        </div>
      </label>

      {file ? (
        <div className="flex items-center justify-between rounded-xl border border-slate-800/80 bg-slate-900/70 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-slate-100">{file.name}</p>
            <p className="text-xs text-slate-500">{formatBytes(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={handleClear}
            className="text-sm font-semibold text-accent-300 transition hover:text-accent-200"
          >
            Remove
          </button>
        </div>
      ) : null}
    </div>
  )
}
