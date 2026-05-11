import { app, BrowserWindow, dialog, ipcMain, shell } from 'electron'
import path from 'node:path'
import type {
  AppSettings,
  HealthStatus,
  NewsGenerationRequest,
  PersianEditRequest,
  PromptBuildOptions,
  TranscriptionRequest
} from '../shared/types'
import { buildImagePrompt, checkOllama, editPersianText, generateNewsContent } from './ollama'
import { loadSettings, saveSettings } from './settings'
import { checkWhisper, checkWhisperModel, transcribePersian } from './transcription'

let mainWindow: BrowserWindow | null = null
const isDev = Boolean(process.env.ELECTRON_RENDERER_URL)

const createWindow = (): void => {
  mainWindow = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 1080,
    minHeight: 720,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#102030',
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.mjs'),
      sandbox: false,
      contextIsolation: true
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (isDev && process.env.ELECTRON_RENDERER_URL) {
    mainWindow.loadURL(process.env.ELECTRON_RENDERER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  app.setAppUserModelId('com.local.journalism-toolbox')

  ipcMain.handle('settings:load', () => loadSettings())
  ipcMain.handle('settings:save', (_, settings: AppSettings) => saveSettings(settings))

  ipcMain.handle('file:selectMedia', async () => {
    const result = await dialog.showOpenDialog(mainWindow!, {
      properties: ['openFile'],
      filters: [
        {
          name: 'Media',
          extensions: ['mp3', 'wav', 'm4a', 'aac', 'flac', 'ogg', 'mp4', 'mkv', 'mov', 'avi', 'webm']
        }
      ]
    })

    return result.canceled ? undefined : result.filePaths[0]
  })

  ipcMain.handle('folder:open', async (_, folderPath: string) => {
    await shell.openPath(folderPath)
  })

  ipcMain.handle('health:check', async (): Promise<HealthStatus> => {
    const status: HealthStatus = {
      ollama: false,
      ollamaMessage: '',
      whisper: false,
      whisperMessage: '',
      whisperModel: false,
      whisperModelMessage: ''
    }

    try {
      status.whisperMessage = await checkWhisper()
      status.whisper = true
    } catch (error) {
      status.whisperMessage = error instanceof Error ? error.message : 'Whisper ایزوله در دسترس نیست'
    }

    try {
      status.whisperModelMessage = await checkWhisperModel()
      status.whisperModel = true
    } catch (error) {
      status.whisperModelMessage =
        error instanceof Error ? error.message : 'مدل Whisper Large V2 در مسیر داخلی پیدا نشد'
    }

    try {
      status.ollamaMessage = await checkOllama()
      status.ollama = true
    } catch (error) {
      status.ollamaMessage =
        error instanceof Error ? error.message : 'Ollama v1 برای پردازش متن در دسترس نیست'
    }

    return status
  })

  ipcMain.handle('transcription:start', (_, request: TranscriptionRequest) =>
    transcribePersian(request, mainWindow)
  )
  ipcMain.handle('persian:edit', (_, request: PersianEditRequest) => editPersianText(request))
  ipcMain.handle('news:generate', (_, request: NewsGenerationRequest) => generateNewsContent(request))
  ipcMain.handle('prompt:build', (_, options: PromptBuildOptions) => buildImagePrompt(options))

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
