export type PromptTemplates = {
  transcriptPolish: string
  newsGenerator: string
  imagePromptBuilder: string
}

export type AppSettings = {
  ollamaBaseUrl: string
  ollamaModel: string
  whisperExecutablePath: string
  whisperModelPath: string
  transcriptionDirectory: string
  promptTemplates: PromptTemplates
}

export type PortablePaths = {
  appRoot: string
  dataDirectory: string
  settingsPath: string
  whisperDirectory: string
  whisperRuntimeDirectory: string
  whisperModelDirectory: string
  whisperExecutablePath: string
  whisperModelPath: string
  transcriptionDirectory: string
}

export type TranscriptionRequest = {
  filePath: string
  postProcess: boolean
}

export type TranscriptionResult = {
  jobId: string
  rawText: string
  polishedText: string
  outputDirectory: string
  rawTextPath: string
  polishedTextPath?: string
}

export type HealthStatus = {
  ollama: boolean
  ollamaMessage: string
  whisper: boolean
  whisperMessage: string
  whisperModel: boolean
  whisperModelMessage: string
}

export type PromptBuildOptions = {
  subject: string
  style: string[]
  aspectRatio: string
  cameraAngle: string[]
  framing: string[]
  lighting: string[]
  negativePrompt: string
}

export type NewsGenerationRequest = {
  inputText: string
  tone: string
  count: number
}

export type NewsGenerationResult = {
  output: string
}

export type PersianEditRequest = {
  text: string
  mode: 'cleanup' | 'formal' | 'summary'
}
