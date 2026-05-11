import { readFileSync, writeFileSync } from 'node:fs'
import type { AppSettings, PromptTemplates } from '../shared/types'
import { getPortablePaths } from './portable-paths'

const defaultPromptTemplates = (): PromptTemplates => ({
  transcriptPolish: `متن زیر خروجی خام Whisper Large V2 از یک فایل فارسی است.

فقط این کارها را انجام بده:
- اصلاح علائم نگارشی فارسی
- اصلاح نیم فاصله
- یکسان سازی ی و ک فارسی
- پاراگراف بندی خوانا
- اصلاح خطاهای واضح شنیداری، فقط وقتی کاملا مشخص است

قوانین سخت:
- معنی، ترتیب و سبک جمله ها را تغییر نده.
- هیچ اطلاعات جدیدی اضافه نکن.
- متن را خلاصه نکن.
- فقط متن اصلاح شده را برگردان.

متن خام:
{{text}}`,
  newsGenerator: `بر اساس متن ورودی، {{count}} گزینه تیتر و لید فارسی تولید کن.

لحن: {{tone}}

قوانین:
- فقط بر اساس اطلاعات متن ورودی بنویس.
- ادعای جدید اضافه نکن.
- هر گزینه شامل "تیتر" و "لید" باشد.
- خروجی را خوانا و شماره گذاری شده بنویس.

متن ورودی:
{{input}}`,
  imagePromptBuilder: `A newsroom-focused visual prompt.
Subject: {{subject}}
Style: {{style}}
Aspect Ratio: {{aspectRatio}}
Camera Angle: {{cameraAngle}}
Framing: {{framing}}
Lighting: {{lighting}}
Negative Prompt: {{negativePrompt}}`
})

const defaultSettings = (): AppSettings => {
  const portablePaths = getPortablePaths()

  return {
    ollamaBaseUrl: 'http://127.0.0.1:11434/v1',
    ollamaModel: 'gpt-oss:20b',
    whisperExecutablePath: portablePaths.whisperExecutablePath,
    whisperModelPath: portablePaths.whisperModelPath,
    transcriptionDirectory: portablePaths.transcriptionDirectory,
    promptTemplates: defaultPromptTemplates()
  }
}

export const loadSettings = (): AppSettings => {
  const defaults = defaultSettings()
  const portablePaths = getPortablePaths()

  try {
    const parsed = JSON.parse(readFileSync(portablePaths.settingsPath, 'utf8')) as Partial<AppSettings>
    return {
      ...defaults,
      ...parsed,
      promptTemplates: {
        ...defaults.promptTemplates,
        ...parsed.promptTemplates
      }
    }
  } catch {
    saveSettings(defaults)
    return defaults
  }
}

export const saveSettings = (settings: AppSettings): AppSettings => {
  const defaults = defaultSettings()
  const portablePaths = getPortablePaths()
  const merged: AppSettings = {
    ...defaults,
    ...settings,
    promptTemplates: {
      ...defaults.promptTemplates,
      ...settings.promptTemplates
    }
  }

  writeFileSync(portablePaths.settingsPath, JSON.stringify(merged, null, 2), 'utf8')
  return merged
}
