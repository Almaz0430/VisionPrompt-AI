export type Goal = 'image_generation' | 'image_editing' | 'video_generation'

export interface PromptFormValues {
  userQuery: string
  goals: Goal[]
  image: File | null
}

export interface PromptRequestPayload {
  user_query: string
  goals: Goal[]
  image?: File | null
}

export type PromptResult = Record<string, unknown>

export interface PromptApiError {
  detail?: string
  message?: string
  [key: string]: unknown
}
