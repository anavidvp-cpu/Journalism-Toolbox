import type {
  NewsGenerationRequest,
  NewsGenerationResult,
  PersianEditRequest,
  PromptBuildOptions
} from '../shared/types'
import { loadSettings } from './settings'

type ChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string
    }
  }>
  error?: {
    message?: string
  }
}

const interpolateTemplate = (
  template: string,
  values: Record<string, string | number | undefined>
): string => {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => String(values[key] ?? ''))
}

const createChatCompletion = async (prompt: string, systemPrompt?: string): Promise<string> => {
  const settings = loadSettings()
  const baseUrl = settings.ollamaBaseUrl.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: 'Bearer ollama'
    },
    body: JSON.stringify({
      model: settings.ollamaModel,
      temperature: 0.2,
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt }
      ]
    })
  })

  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}: ${response.statusText}`)
  }

  const data = (await response.json()) as ChatCompletionResponse
  if (data.error?.message) {
    throw new Error(data.error.message)
  }

  const content = data.choices?.[0]?.message?.content?.trim()
  if (!content) {
    throw new Error('پاسخ معتبری از Ollama دریافت نشد')
  }

  return content
}

export const polishPersianTranscript = async (rawText: string): Promise<string> => {
  const settings = loadSettings()
  const prompt = interpolateTemplate(settings.promptTemplates.transcriptPolish, { text: rawText })
  return createChatCompletion(prompt, 'You are a careful Persian transcription editor.')
}

export const editPersianText = async (request: PersianEditRequest): Promise<string> => {
  const modeInstruction = {
    cleanup: 'فقط متن را از نظر نگارش فارسی، نیم فاصله، علائم و پاراگراف بندی اصلاح کن.',
    formal: 'متن را رسمی تر، دقیق تر و مناسب انتشار خبری بازنویسی کن، بدون افزودن اطلاعات جدید.',
    summary: 'متن را خلاصه و منسجم کن و نکات اصلی را حفظ کن.'
  }[request.mode]

  return createChatCompletion(
    `${modeInstruction}

فقط خروجی نهایی را برگردان.

متن:
${request.text}`,
    'You are a Persian newsroom writing assistant.'
  )
}

export const generateNewsContent = async (
  request: NewsGenerationRequest
): Promise<NewsGenerationResult> => {
  const settings = loadSettings()
  const prompt = interpolateTemplate(settings.promptTemplates.newsGenerator, {
    count: request.count,
    tone: request.tone,
    input: request.inputText
  })
  const output = await createChatCompletion(prompt, 'You are a Persian headline and lead generation assistant.')

  return { output }
}

export const buildImagePrompt = async (options: PromptBuildOptions): Promise<string> => {
  const settings = loadSettings()
  const prompt = interpolateTemplate(settings.promptTemplates.imagePromptBuilder, {
    subject: options.subject,
    style: options.style.join(', '),
    aspectRatio: options.aspectRatio,
    cameraAngle: options.cameraAngle.join(', '),
    framing: options.framing.join(', '),
    lighting: options.lighting.join(', '),
    negativePrompt: options.negativePrompt
  })

  return createChatCompletion(
    `${prompt}

فقط پرامپت نهایی را برگردان و هیچ توضیح اضافه‌ای ننویس.`,
    'You write compact high-quality image prompts for journalistic visuals.'
  )
}

export const checkOllama = async (): Promise<string> => {
  const settings = loadSettings()
  const baseUrl = settings.ollamaBaseUrl.replace(/\/$/, '')
  const response = await fetch(`${baseUrl}/models`, {
    headers: {
      Authorization: 'Bearer ollama'
    }
  })
  if (!response.ok) {
    throw new Error(`Ollama HTTP ${response.status}`)
  }
  return `Ollama v1 آماده است: ${settings.ollamaModel}`
}
