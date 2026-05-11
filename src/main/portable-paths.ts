import { app } from 'electron'
import { existsSync, mkdirSync } from 'node:fs'
import path from 'node:path'
import type { PortablePaths } from '../shared/types'

const ensureDirectory = (directoryPath: string): string => {
  if (!existsSync(directoryPath)) {
    mkdirSync(directoryPath, { recursive: true })
  }
  return directoryPath
}

export const getAppRoot = (): string => {
  return app.isPackaged ? path.dirname(process.execPath) : process.cwd()
}

export const getPortablePaths = (): PortablePaths => {
  const appRoot = getAppRoot()
  const dataDirectory = ensureDirectory(path.join(appRoot, 'data'))
  const whisperDirectory = ensureDirectory(path.join(appRoot, 'whisper'))
  const whisperRuntimeDirectory = ensureDirectory(path.join(whisperDirectory, 'Runtime'))
  const whisperModelDirectory = ensureDirectory(path.join(whisperDirectory, 'Models'))
  const transcriptionDirectory = ensureDirectory(path.join(whisperDirectory, 'Transcriptions'))

  return {
    appRoot,
    dataDirectory,
    settingsPath: path.join(dataDirectory, 'settings.json'),
    whisperDirectory,
    whisperRuntimeDirectory,
    whisperModelDirectory,
    whisperExecutablePath: path.join(whisperRuntimeDirectory, 'whisper-local.cmd'),
    whisperModelPath: path.join(whisperModelDirectory, 'large-v2.pt'),
    transcriptionDirectory
  }
}
