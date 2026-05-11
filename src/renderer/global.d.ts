import type { JournalismToolboxApi } from '../preload'

declare global {
  interface Window {
    journalismToolbox: JournalismToolboxApi
  }
}
