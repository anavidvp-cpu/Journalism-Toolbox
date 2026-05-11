import React, { startTransition } from 'react'
import ReactDOM from 'react-dom/client'
import type { JSX } from 'react'
import {
  Bot,
  CheckCircle2,
  FileAudio,
  FileText,
  FolderOpen,
  Gauge,
  Newspaper,
  PenLine,
  Play,
  Save,
  Settings,
  SlidersHorizontal,
  Sparkles,
  Wand2,
  XCircle
} from 'lucide-react'
import type {
  AppSettings,
  HealthStatus,
  NewsGenerationResult,
  PersianEditRequest,
  TranscriptionResult
} from '../shared/types'
import './styles.css'

type Page = 'transcription' | 'editor' | 'news' | 'prompt' | 'settings'

const navItems: Array<{ id: Page; label: string; icon: React.ReactNode }> = [
  { id: 'transcription', label: 'رونویسی فارسی', icon: <FileAudio size={18} /> },
  { id: 'editor', label: 'ویرایشگر فارسی', icon: <PenLine size={18} /> },
  { id: 'news', label: 'تیتر و لید', icon: <Newspaper size={18} /> },
  { id: 'prompt', label: 'مولد پرامپت', icon: <SlidersHorizontal size={18} /> },
  { id: 'settings', label: 'تنظیمات', icon: <Settings size={18} /> }
]

const defaultSettings: AppSettings = {
  ollamaBaseUrl: 'http://127.0.0.1:11434/v1',
  ollamaModel: 'gpt-oss:20b',
  whisperExecutablePath: '',
  whisperModelPath: '',
  transcriptionDirectory: '',
  promptTemplates: {
    transcriptPolish: '',
    newsGenerator: '',
    imagePromptBuilder: ''
  }
}

function App(): JSX.Element {
  const [page, setPage] = React.useState<Page>('transcription')
  const [settings, setSettings] = React.useState<AppSettings>(defaultSettings)
  const [health, setHealth] = React.useState<HealthStatus | null>(null)
  const [busy, setBusy] = React.useState(false)
  const [logs, setLogs] = React.useState<string[]>([])

  React.useEffect(() => {
    void window.journalismToolbox.loadSettings().then((value) => {
      startTransition(() => setSettings(value))
    })

    return window.journalismToolbox.onJobLog((message) => {
      if (!message) return
      startTransition(() => {
        setLogs((current) => [message, ...current].slice(0, 80))
      })
    })
  }, [])

  const checkHealth = async (): Promise<void> => {
    setBusy(true)
    try {
      const next = await window.journalismToolbox.checkHealth()
      setHealth(next)
    } finally {
      setBusy(false)
    }
  }

  const saveSettings = async (next: AppSettings): Promise<void> => {
    const saved = await window.journalismToolbox.saveSettings(next)
    setSettings(saved)
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <Sparkles size={20} />
          </div>
          <div>
            <h1>Journalism Toolbox</h1>
            <p>نسخه پرتابل برای رونویسی فارسی و تولید محتوای خبری</p>
          </div>
        </div>

        <nav className="nav">
          {navItems.map((item) => (
            <button
              key={item.id}
              className={page === item.id ? 'nav-item active' : 'nav-item'}
              onClick={() => setPage(item.id)}
              type="button"
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="system-panel">
          <div className="panel-title">
            <Gauge size={17} />
            <span>وضعیت اجزای محلی</span>
          </div>
          <StatusLine label="Whisper Runtime" ok={health?.whisper} message={health?.whisperMessage} />
          <StatusLine
            label="Whisper Model"
            ok={health?.whisperModel}
            message={health?.whisperModelMessage}
          />
          <StatusLine
            label="Ollama v1"
            ok={health?.ollama}
            message={health?.ollamaMessage}
          />
          <button className="secondary-button full" onClick={checkHealth} disabled={busy} type="button">
            بررسی اجزا
          </button>
        </div>
      </aside>

      <section className="content">
        {page === 'transcription' && (
          <TranscriptionPage
            settings={settings}
            busy={busy}
            setBusy={setBusy}
            logs={logs}
            clearLogs={() => setLogs([])}
          />
        )}
        {page === 'editor' && <PersianEditorPage busy={busy} setBusy={setBusy} />}
        {page === 'news' && <NewsPage busy={busy} setBusy={setBusy} />}
        {page === 'prompt' && <PromptPage busy={busy} setBusy={setBusy} />}
        {page === 'settings' && (
          <SettingsPage settings={settings} setSettings={setSettings} saveSettings={saveSettings} />
        )}
      </section>
    </main>
  )
}

function StatusLine({
  label,
  ok,
  message
}: {
  label: string
  ok: boolean | undefined
  message?: string
}): JSX.Element {
  return (
    <div className="status-line" title={message}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      <span>{label}</span>
    </div>
  )
}

function TranscriptionPage({
  settings,
  busy,
  setBusy,
  logs,
  clearLogs
}: {
  settings: AppSettings
  busy: boolean
  setBusy: (busy: boolean) => void
  logs: string[]
  clearLogs: () => void
}): JSX.Element {
  const [filePath, setFilePath] = React.useState('')
  const [postProcess, setPostProcess] = React.useState(true)
  const [result, setResult] = React.useState<TranscriptionResult | null>(null)
  const [error, setError] = React.useState('')

  const selectFile = async (): Promise<void> => {
    const selected = await window.journalismToolbox.selectMediaFile()
    if (selected) setFilePath(selected)
  }

  const start = async (): Promise<void> => {
    if (!filePath) return
    setBusy(true)
    setError('')
    setResult(null)
    clearLogs()
    try {
      const next = await window.journalismToolbox.startTranscription({ filePath, postProcess })
      setResult(next)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'رونویسی انجام نشد')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <h2>رونویسی ایزوله فارسی</h2>
          <p>برنامه فقط از فایل اجرایی داخلی Whisper و مدل `large-v2` داخل پوشه پروژه استفاده می‌کند.</p>
        </div>
        <button className="primary-button" onClick={start} disabled={!filePath || busy} type="button">
          <Play size={18} />
          شروع رونویسی
        </button>
      </header>

      <section className="hero-panel">
        <div className="hero-copy">
          <strong>Whisper داخلی</strong>
          <p>{settings.whisperExecutablePath || 'whisper\\Runtime\\whisper.exe'}</p>
        </div>
        <div className="hero-copy">
          <strong>مدل فعال</strong>
          <p>{settings.whisperModelPath || 'whisper\\Models\\large-v2.pt'}</p>
        </div>
        <div className="hero-copy">
          <strong>پوشه ذخیره متن‌ها</strong>
          <p>{settings.transcriptionDirectory || 'whisper\\Transcriptions'}</p>
        </div>
        <div className="hero-copy">
          <strong>مدل نگارش</strong>
          <p>{settings.ollamaModel}</p>
        </div>
      </section>

      <section className="tool-panel">
        <label className="field-label">فایل صوتی یا ویدیویی</label>
        <div className="file-row">
          <input value={filePath} readOnly placeholder="فایل را انتخاب کنید" />
          <button className="icon-button" onClick={selectFile} title="انتخاب فایل" type="button">
            <FolderOpen size={19} />
          </button>
        </div>
        <label className="toggle-row">
          <input
            checked={postProcess}
            onChange={(event) => setPostProcess(event.target.checked)}
            type="checkbox"
          />
          <span>پس از رونویسی، متن با موتور نگارش محلی اصلاح شود</span>
        </label>
      </section>

      {error && <div className="error-box">{error}</div>}

      <section className="split-output">
        <TextOutput title="متن خام" text={result?.rawText ?? ''} />
        <TextOutput title="متن اصلاح‌شده" text={result?.polishedText ?? ''} />
      </section>

      <section className="log-panel">
        <div className="section-heading">
          <span>گزارش اجرا</span>
          <div className="button-row">
            <button
              className="secondary-button"
              onClick={() => window.journalismToolbox.openFolder(settings.transcriptionDirectory)}
              type="button"
            >
              <FolderOpen size={16} />
              پوشه متن‌ها
            </button>
            {result?.outputDirectory && (
              <button
                className="secondary-button"
                onClick={() => window.journalismToolbox.openFolder(result.outputDirectory)}
                type="button"
              >
                <FileText size={16} />
                خروجی این نوبت
              </button>
            )}
          </div>
        </div>
        <div className="log-list">
          {logs.length === 0 ? <p>هنوز عملیاتی شروع نشده است.</p> : logs.map((log, index) => <code key={index}>{log}</code>)}
        </div>
      </section>
    </div>
  )
}

function TextOutput({ title, text }: { title: string; text: string }): JSX.Element {
  return (
    <div className="text-output">
      <div className="section-heading">
        <span>{title}</span>
        <FileText size={17} />
      </div>
      <textarea value={text} readOnly placeholder="خروجی اینجا نمایش داده می‌شود" />
    </div>
  )
}

function PersianEditorPage({
  busy,
  setBusy
}: {
  busy: boolean
  setBusy: (busy: boolean) => void
}): JSX.Element {
  const [text, setText] = React.useState('')
  const [output, setOutput] = React.useState('')
  const [mode, setMode] = React.useState<PersianEditRequest['mode']>('cleanup')

  const run = async (): Promise<void> => {
    if (!text.trim()) return
    setBusy(true)
    try {
      setOutput(await window.journalismToolbox.editPersian({ text, mode }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <h2>ویرایشگر متن فارسی</h2>
          <p>برای پاکسازی نگارشی، رسمی‌سازی متن یا خلاصه‌سازی از همان موتور محلی استفاده می‌شود.</p>
        </div>
        <button className="primary-button" onClick={run} disabled={busy || !text.trim()} type="button">
          <Wand2 size={18} />
          اجرای ویرایش
        </button>
      </header>

      <section className="tool-panel">
        <div className="segmented">
          <button className={mode === 'cleanup' ? 'selected' : ''} onClick={() => setMode('cleanup')} type="button">
            پاکسازی
          </button>
          <button className={mode === 'formal' ? 'selected' : ''} onClick={() => setMode('formal')} type="button">
            رسمی‌سازی
          </button>
          <button className={mode === 'summary' ? 'selected' : ''} onClick={() => setMode('summary')} type="button">
            خلاصه
          </button>
        </div>
      </section>

      <section className="split-output tall">
        <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="متن اولیه" />
        <textarea value={output} readOnly placeholder="نتیجه" />
      </section>
    </div>
  )
}

function NewsPage({
  busy,
  setBusy
}: {
  busy: boolean
  setBusy: (busy: boolean) => void
}): JSX.Element {
  const [inputText, setInputText] = React.useState('')
  const [tone, setTone] = React.useState('رسمی و خبری')
  const [count, setCount] = React.useState(3)
  const [result, setResult] = React.useState<NewsGenerationResult | null>(null)

  const run = async (): Promise<void> => {
    if (!inputText.trim()) return
    setBusy(true)
    try {
      setResult(await window.journalismToolbox.generateNews({ inputText, tone, count }))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <h2>تولید تیتر و لید</h2>
          <p>الگوی نوشتن تیتر و لید از تنظیمات خوانده می‌شود و هر زمان بخواهید قابل ویرایش است.</p>
        </div>
        <button className="primary-button" onClick={run} disabled={busy || !inputText.trim()} type="button">
          <Bot size={18} />
          تولید خروجی
        </button>
      </header>

      <section className="tool-panel inline-controls">
        <label>
          لحن
          <input value={tone} onChange={(event) => setTone(event.target.value)} />
        </label>
        <label>
          تعداد گزینه
          <input
            min={1}
            max={8}
            value={count}
            onChange={(event) => setCount(Number(event.target.value))}
            type="number"
          />
        </label>
      </section>

      <section className="split-output tall">
        <textarea
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder="متن خبر یا اطلاعات خام"
        />
        <textarea value={result?.output ?? ''} readOnly placeholder="تیترها و لیدها" />
      </section>
    </div>
  )
}

function PromptPage({
  busy,
  setBusy
}: {
  busy: boolean
  setBusy: (busy: boolean) => void
}): JSX.Element {
  const [subject, setSubject] = React.useState('')
  const [aspectRatio, setAspectRatio] = React.useState('16:9')
  const [negativePrompt, setNegativePrompt] = React.useState('')
  const [selected, setSelected] = React.useState<Record<string, string[]>>({
    style: [],
    cameraAngle: [],
    framing: [],
    lighting: []
  })
  const [output, setOutput] = React.useState('')

  const toggle = (group: string, value: string): void => {
    setSelected((current) => {
      const values = current[group] ?? []
      return {
        ...current,
        [group]: values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
      }
    })
  }

  const run = async (): Promise<void> => {
    setBusy(true)
    try {
      setOutput(
        await window.journalismToolbox.buildPrompt({
          subject,
          aspectRatio,
          negativePrompt,
          style: selected.style,
          cameraAngle: selected.cameraAngle,
          framing: selected.framing,
          lighting: selected.lighting
        })
      )
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="page-grid">
      <header className="page-header">
        <div>
          <h2>مولد پرامپت</h2>
          <p>خروجی نهایی از الگوی قابل ویرایش تنظیمات و انتخاب پارامترهای بصری ساخته می‌شود.</p>
        </div>
        <button className="primary-button" onClick={run} disabled={busy} type="button">
          <Wand2 size={18} />
          ساخت پرامپت
        </button>
      </header>

      <section className="tool-panel">
        <label className="field-label">سوژه</label>
        <input
          value={subject}
          onChange={(event) => setSubject(event.target.value)}
          placeholder="مثلا: خبرنگار در اتاق خبر مدرن"
        />
        <div className="prompt-grid">
          <CheckboxGroup
            title="Style"
            values={['Editorial photo', 'Documentary', 'Cinematic', 'Realistic']}
            selected={selected.style}
            onToggle={(value) => toggle('style', value)}
          />
          <CheckboxGroup
            title="Camera Angle"
            values={['Eye level', 'Low angle', 'Top view', 'Close angle']}
            selected={selected.cameraAngle}
            onToggle={(value) => toggle('cameraAngle', value)}
          />
          <CheckboxGroup
            title="Framing"
            values={['Close-up', 'Medium shot', 'Wide shot', 'Rule of thirds']}
            selected={selected.framing}
            onToggle={(value) => toggle('framing', value)}
          />
          <CheckboxGroup
            title="Lighting"
            values={['Soft light', 'Natural light', 'Studio light', 'High contrast']}
            selected={selected.lighting}
            onToggle={(value) => toggle('lighting', value)}
          />
        </div>
        <div className="inline-controls">
          <label>
            نسبت تصویر
            <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
              <option>16:9</option>
              <option>9:16</option>
              <option>1:1</option>
              <option>4:3</option>
            </select>
          </label>
          <label>
            Negative Prompt
            <input value={negativePrompt} onChange={(event) => setNegativePrompt(event.target.value)} />
          </label>
        </div>
      </section>

      <textarea className="single-output" value={output} readOnly placeholder="پرامپت نهایی" />
    </div>
  )
}

function CheckboxGroup({
  title,
  values,
  selected,
  onToggle
}: {
  title: string
  values: string[]
  selected: string[]
  onToggle: (value: string) => void
}): JSX.Element {
  return (
    <div className="checkbox-group">
      <strong>{title}</strong>
      {values.map((value) => (
        <label key={value}>
          <input checked={selected.includes(value)} onChange={() => onToggle(value)} type="checkbox" />
          <span>{value}</span>
        </label>
      ))}
    </div>
  )
}

function SettingsPage({
  settings,
  setSettings,
  saveSettings
}: {
  settings: AppSettings
  setSettings: (settings: AppSettings) => void
  saveSettings: (settings: AppSettings) => Promise<void>
}): JSX.Element {
  const update = <K extends keyof AppSettings>(key: K, value: AppSettings[K]): void => {
    setSettings({ ...settings, [key]: value })
  }

  const updatePrompt = (key: keyof AppSettings['promptTemplates'], value: string): void => {
    setSettings({
      ...settings,
      promptTemplates: {
        ...settings.promptTemplates,
        [key]: value
      }
    })
  }

  return (
    <div className="page-grid wide-settings">
      <header className="page-header">
        <div>
          <h2>تنظیمات پرتابل</h2>
          <p>همه مسیرهای مهم و الگوهای پرامپت داخل خود پروژه نگهداری می‌شوند و با برنامه جابه‌جا می‌شوند.</p>
        </div>
        <button className="primary-button" onClick={() => saveSettings(settings)} type="button">
          <Save size={18} />
          ذخیره تنظیمات
        </button>
      </header>

      <section className="settings-layout">
        <div className="settings-form">
          <div className="form-block">
            <h3>مسیرهای داخلی</h3>
            <label>
              آدرس Ollama v1
              <input
                value={settings.ollamaBaseUrl}
                onChange={(event) => update('ollamaBaseUrl', event.target.value)}
              />
            </label>
            <label>
              مدل Ollama
              <input
                value={settings.ollamaModel}
                onChange={(event) => update('ollamaModel', event.target.value)}
              />
            </label>
            <label>
              فایل اجرایی Whisper
              <input
                value={settings.whisperExecutablePath}
                onChange={(event) => update('whisperExecutablePath', event.target.value)}
              />
            </label>
            <label>
              مدل Whisper
              <input value={settings.whisperModelPath} onChange={(event) => update('whisperModelPath', event.target.value)} />
            </label>
            <label>
              پوشه ذخیره رونویسی‌ها
              <input
                value={settings.transcriptionDirectory}
                onChange={(event) => update('transcriptionDirectory', event.target.value)}
              />
            </label>
          </div>
        </div>

        <div className="settings-form">
          <div className="form-block">
            <h3>پرامپت تیتر و لید</h3>
            <textarea
              className="settings-textarea"
              value={settings.promptTemplates.newsGenerator}
              onChange={(event) => updatePrompt('newsGenerator', event.target.value)}
            />
          </div>
          <div className="form-block">
            <h3>پرامپت مولد پرامپت</h3>
            <textarea
              className="settings-textarea"
              value={settings.promptTemplates.imagePromptBuilder}
              onChange={(event) => updatePrompt('imagePromptBuilder', event.target.value)}
            />
          </div>
          <div className="form-block">
            <h3>پرامپت اصلاح رونویسی</h3>
            <textarea
              className="settings-textarea"
              value={settings.promptTemplates.transcriptPolish}
              onChange={(event) => updatePrompt('transcriptPolish', event.target.value)}
            />
          </div>
        </div>
      </section>
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
