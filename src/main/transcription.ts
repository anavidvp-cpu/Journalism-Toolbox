import { BrowserWindow } from 'electron'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import type { TranscriptionRequest, TranscriptionResult } from '../shared/types'
import { polishPersianTranscript } from './ollama'
import { getPortablePaths } from './portable-paths'
import { loadSettings } from './settings'

const createJobId = (): string => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  return `transcription-${stamp}`
}

const sendLog = (window: BrowserWindow | null, message: string): void => {
  window?.webContents.send('job-log', message)
}

const ensureFileExists = (filePath: string, label: string): void => {
  if (!existsSync(filePath)) {
    throw new Error(`${label} پیدا نشد: ${filePath}`)
  }
}

const runWhisperCommand = (
  executablePath: string,
  args: string[],
  cwd: string,
  window: BrowserWindow | null
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const extension = path.extname(executablePath).toLowerCase()
    const child = spawn(executablePath, args, {
      cwd,
      windowsHide: true,
      shell: extension === '.cmd' || extension === '.bat'
    })

    child.stdout.on('data', (chunk: Buffer) => sendLog(window, chunk.toString('utf8').trim()))
    child.stderr.on('data', (chunk: Buffer) => sendLog(window, chunk.toString('utf8').trim()))

    child.on('error', (error) => {
      reject(new Error(`اجرای Whisper ناموفق بود: ${error.message}`))
    })

    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }
      reject(new Error(`Whisper با کد ${code} متوقف شد`))
    })
  })
}

const findRawTextFile = (outputDirectory: string, inputPath: string): string => {
  const inputName = path.parse(inputPath).name
  const expected = path.join(outputDirectory, `${inputName}.txt`)
  ensureFileExists(expected, 'فایل خروجی رونویسی')
  return expected
}

export const transcribePersian = async (
  request: TranscriptionRequest,
  window: BrowserWindow | null
): Promise<TranscriptionResult> => {
  const settings = loadSettings()
  const portablePaths = getPortablePaths()
  const jobId = createJobId()
  const outputDirectory = path.join(settings.transcriptionDirectory, jobId)

  ensureFileExists(settings.whisperExecutablePath, 'فایل اجرایی Whisper')
  ensureFileExists(settings.whisperModelPath, 'مدل Whisper Large V2')

  if (!existsSync(outputDirectory)) {
    mkdirSync(outputDirectory, { recursive: true })
  }

  sendLog(window, `شروع رونویسی از مسیر ایزوله: ${settings.whisperExecutablePath}`)
  sendLog(window, `مدل فعال: ${settings.whisperModelPath}`)
  sendLog(window, `پوشه خروجی ثابت: ${portablePaths.transcriptionDirectory}`)

  await runWhisperCommand(
    settings.whisperExecutablePath,
    [
      request.filePath,
      '--model',
      settings.whisperModelPath,
      '--language',
      'Persian',
      '--task',
      'transcribe',
      '--output_format',
      'txt',
      '--output_dir',
      outputDirectory
    ],
    outputDirectory,
    window
  )

  const rawTextPath = findRawTextFile(outputDirectory, request.filePath)
  const rawText = readFileSync(rawTextPath, 'utf8').trim()
  let polishedText = ''
  let polishedTextPath: string | undefined

  if (request.postProcess) {
    sendLog(window, 'شروع اصلاح نگارشی با موتور محلی...')
    polishedText = await polishPersianTranscript(rawText)
    polishedTextPath = path.join(outputDirectory, 'polished-fa.txt')
    writeFileSync(polishedTextPath, polishedText, 'utf8')
  }

  sendLog(window, 'رونویسی و ذخیره فایل متنی کامل شد.')

  return {
    jobId,
    rawText,
    polishedText,
    outputDirectory,
    rawTextPath,
    polishedTextPath
  }
}

export const checkWhisper = async (): Promise<string> => {
  const settings = loadSettings()
  ensureFileExists(settings.whisperExecutablePath, 'فایل اجرایی Whisper')
  return 'فایل اجرایی Whisper ایزوله شناسایی شد'
}

export const checkWhisperModel = async (): Promise<string> => {
  const settings = loadSettings()
  ensureFileExists(settings.whisperModelPath, 'مدل Whisper Large V2')
  return 'مدل Whisper Large V2 در پوشه داخلی موجود است'
}
