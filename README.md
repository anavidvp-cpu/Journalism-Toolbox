# Journalism-Toolbox
## ساختار پرتابل

- `whisper\Runtime\whisper-local.cmd`
- `whisper\Runtime\venv\`
- `whisper\Runtime\ffmpeg\`
- `whisper\Models\large-v2.pt`
- `whisper\Transcriptions\`
- `data\settings.json`

## نصب Whisper به صورت محلی

اسکریپت زیر همه چیز را داخل پوشه `whisper` می‌سازد:

```powershell
powershell -ExecutionPolicy Bypass -File "C:\Users\ANA-VP\Desktop\Journalism Toolbox\install-whisper-local.ps1"
```

این اسکریپت:

- Python را در `whisper\python` نصب می‌کند
- یک venv ایزوله در `whisper\Runtime\venv` می‌سازد
- `openai-whisper` را فقط در همان venv نصب می‌کند
- FFmpeg را داخل `whisper\Runtime\ffmpeg` قرار می‌دهد
- wrapper محلی `whisper\Runtime\whisper-local.cmd` را می‌سازد

## اجرای برنامه

```powershell
npm.cmd install
npm.cmd run dev
```

## موتور نگارش

بخش‌های تیتر و لید، مولد پرامپت، ویرایش متن و اصلاح رونویسی از طریق Ollama OpenAI-compatible endpoint روی `http://127.0.0.1:11434/v1` کار می‌کنند.

مدل پیش‌فرض در تنظیمات:

- `gpt-oss:20b`

می‌توانید نام مدل را از داخل تنظیمات برنامه تغییر دهید.
