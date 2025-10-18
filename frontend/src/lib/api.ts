import axios from 'axios'

import type {
  PromptApiError,
  PromptRequestPayload,
  PromptResult,
} from '../types'

const api = axios.create({
  baseURL: '/api',
  headers: {
    Accept: 'application/json',
  },
  withCredentials: false,
})

const serializePayload = (payload: PromptRequestPayload) => {
  const formData = new FormData()
  formData.append('user_query', payload.user_query.trim())
  payload.goals.forEach((goal) => formData.append('goals', goal))
  if (payload.image) {
    formData.append('image', payload.image)
  }

  return formData
}

export const generatePrompt = async (
  payload: PromptRequestPayload,
): Promise<PromptResult> => {
  try {
    const response = await api.post<PromptResult>(
      '/generate-prompt/',
      serializePayload(payload),
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      },
    )

    return response.data
  } catch (error) {
    if (axios.isAxiosError<PromptApiError>(error)) {
      const message =
        error.response?.data?.detail ??
        error.response?.data?.message ??
        error.message ??
        'Unknown error'

      throw new Error(message)
    }

    throw error
  }
}
