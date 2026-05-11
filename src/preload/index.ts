import { contextBridge, ipcRenderer } from 'electron'
import type {
  AppSettings,
  HealthStatus,
  NewsGenerationRequest,
  NewsGenerationResult,
  PersianEditRequest,
  PromptBuildOptions,
  TranscriptionRequest,
  TranscriptionResult
} from '../shared/types'

const api = {
  loadSettings: (): Promise<AppSettings> => ipcRenderer.invoke('settings:load'),
  saveSettings: (settings: AppSettings): Promise<AppSettings> =>
    ipcRenderer.invoke('settings:save', settings),
  selectMediaFile: (): Promise<string | undefined> => ipcRenderer.invoke('file:selectMedia'),
  openFolder: (folderPath: string): Promise<void> => ipcRenderer.invoke('folder:open', folderPath),
  checkHealth: (): Promise<HealthStatus> => ipcRenderer.invoke('health:check'),
  startTranscription: (request: TranscriptionRequest): Promise<TranscriptionResult> =>
    ipcRenderer.invoke('transcription:start', request),
  editPersian: (request: PersianEditRequest): Promise<string> =>
    ipcRenderer.invoke('persian:edit', request),
  generateNews: (request: NewsGenerationRequest): Promise<NewsGenerationResult> =>
    ipcRenderer.invoke('news:generate', request),
  buildPrompt: (options: PromptBuildOptions): Promise<string> => ipcRenderer.invoke('prompt:build', options),
  onJobLog: (callback: (message: string) => void): (() => void) => {
    const listener = (_: Electron.IpcRendererEvent, message: string) => callback(message)
    ipcRenderer.on('job-log', listener)
    return () => ipcRenderer.removeListener('job-log', listener)
  }
}

contextBridge.exposeInMainWorld('journalismToolbox', api)

export type JournalismToolboxApi = typeof api
