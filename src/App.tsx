import { useState, useRef, useEffect } from 'react';
import { Camera, Code2, Download, Copy, Check } from 'lucide-react';
import { toPng } from 'html-to-image';
import { createHighlighter, type Highlighter } from 'shiki';
import './App.css';

const THEMES = [
  { id: 'sunset', name: 'Sunset', bg: 'var(--grad-sunset)' },
  { id: 'ocean', name: 'Ocean', bg: 'var(--grad-ocean)' },
  { id: 'aurora', name: 'Aurora', bg: 'var(--grad-aurora)' },
  { id: 'midnight', name: 'Midnight', bg: 'var(--grad-midnight)' },
  { id: 'candy', name: 'Candy', bg: 'var(--grad-candy)' },
  { id: 'dark', name: 'Dark', bg: '#1f2937' },
  { id: 'forest', name: 'Forest', bg: 'linear-gradient(135deg, #134e5e 0%, #71b280 100%)' },
  { id: 'fire', name: 'Fire', bg: 'linear-gradient(135deg, #f12711 0%, #f5af19 100%)' },
  { id: 'purple', name: 'Purple Haze', bg: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
  { id: 'rose', name: 'Rose', bg: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
  { id: 'cyber', name: 'Cyberpunk', bg: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
  { id: 'matrix', name: 'Matrix', bg: 'linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%)' },
];

const SOCIAL_PRESETS = [
  { id: 'twitter', name: 'Twitter Card', width: 1200, height: 675 },
  { id: 'linkedin', name: 'LinkedIn', width: 1200, height: 627 },
  { id: 'instagram', name: 'Instagram', width: 1080, height: 1080 },
  { id: 'custom', name: 'Custom', width: 0, height: 0 },
];

// Simple language detection based on code patterns
function detectLanguage(code: string): string {
  if (code.includes('function') && code.includes('=>')) return 'typescript';
  if (code.includes('const') || code.includes('let') || code.includes('var')) return 'javascript';
  if (code.includes('def ') && code.includes(':')) return 'python';
  if (code.includes('package ') || code.includes('func ')) return 'go';
  if (code.includes('fn ') || code.includes('let mut')) return 'rust';
  if (code.includes('public class') || code.includes('public static')) return 'java';
  if (code.includes('<div') || code.includes('<html')) return 'html';
  if (code.includes('{') && code.includes('color:')) return 'css';
  return 'typescript'; // default
}

const DEFAULT_CODE = `function calculatePhysics(x: number, y: number) {
  const velocity = Math.sqrt(x * x + y * y);
  
  if (velocity > 100) {
    return "Too fast! 🚀";
  }
  
  return { status: "stable", velocity };
}`;

function App() {
  const [code, setCode] = useState(DEFAULT_CODE);
  const [themeId, setThemeId] = useState(THEMES[3].id);
  const [padding, setPadding] = useState(64);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [language, setLanguage] = useState('typescript');
  const [autoDetect, setAutoDetect] = useState(true);
  const [socialPreset, setSocialPreset] = useState('custom');
  const [copied, setCopied] = useState(false);
  const [windowTitle, setWindowTitle] = useState('code.ts');
  const [fontSize, setFontSize] = useState(14);

  const [htmlCode, setHtmlCode] = useState('');
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize Shiki
  useEffect(() => {
    async function init() {
      const hl = await createHighlighter({
        themes: ['vitesse-dark'],
        langs: ['typescript', 'javascript', 'python', 'rust', 'go', 'java', 'css', 'html', 'json', 'bash']
      });
      setHighlighter(hl);
    }
    init();
  }, []);

  // Auto-detect language when code changes
  useEffect(() => {
    if (autoDetect && code) {
      const detected = detectLanguage(code);
      setLanguage(detected);
    }
  }, [code, autoDetect]);

  // Update highlighted code when code or language changes
  useEffect(() => {
    if (highlighter && code) {
      const html = highlighter.codeToHtml(code, {
        lang: language as any,
        theme: 'vitesse-dark'
      });
      setHtmlCode(html);
    } else if (!code) {
      setHtmlCode('');
    }
  }, [code, highlighter, language]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        handleExport();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'c' && !window.getSelection()?.toString()) {
        // Only trigger if no text is selected
        if (document.activeElement?.tagName !== 'TEXTAREA' && document.activeElement?.tagName !== 'INPUT') {
          e.preventDefault();
          handleCopyImage();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [code, themeId, padding, language]);

  const activeTheme = THEMES.find((t) => t.id === themeId);
  const activePreset = SOCIAL_PRESETS.find((p) => p.id === socialPreset);

  const showToastMessage = (message: string) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleExport = async () => {
    if (!canvasRef.current) return;

    try {
      setShowToast(false);

      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: true,
        ...(socialPreset !== 'custom' && activePreset && {
          width: activePreset.width,
          height: activePreset.height,
        }),
      });

      const link = document.createElement('a');
      link.download = 'code-snap.png';
      link.href = dataUrl;
      link.click();

      showToastMessage('Downloaded code-snap.png ✨');
    } catch (err) {
      console.error('Failed to generate image', err);
      showToastMessage('Failed to export image ❌');
    }
  };

  const handleCopyImage = async () => {
    if (!canvasRef.current) return;

    try {
      setShowToast(false);

      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 2,
        skipFonts: true,
      });

      // Convert data URL to blob
      const response = await fetch(dataUrl);
      const blob = await response.blob();

      // Copy to clipboard
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);

      setCopied(true);
      showToastMessage('Copied to clipboard! 📋');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy image', err);
      showToastMessage('Failed to copy image ❌');
    }
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="header glass-panel">
        <h1>
          <Camera size={24} color="#00f2fe" />
          code-snap
        </h1>
      </header>

      {/* MAIN CONTENT */}
      <main className="main-content">

        {/* WORKSPACE / CANVAS */}
        <section className="workspace">

          <div
            ref={canvasRef}
            className="canvas-wrapper"
            style={{
              background: activeTheme?.bg,
              padding: `${padding}px`
            }}
          >
            <div className="mac-window">
              <div className="mac-window-header">
                <div className="mac-traffic-light close" />
                <div className="mac-traffic-light minimize" />
                <div className="mac-traffic-light maximize" />
                <span className="window-title">{windowTitle}</span>
              </div>

              <div
                className="shiki-container"
                style={{ fontSize: `${fontSize}px` }}
                dangerouslySetInnerHTML={{ __html: htmlCode || '<pre><code><span>Type your code...</span></code></pre>' }}
              />
            </div>
          </div>

          <div className={`toast ${showToast ? 'show' : ''}`}>
            {toastMessage}
          </div>
        </section>

        {/* SIDEBAR CONTROLS */}
        <aside className="sidebar">

          <div className="code-editor-section">
            <div className="control-group" style={{ height: '100%' }}>
              <label className="control-label flex items-center gap-2">
                <Code2 size={14} />
                Snippet
              </label>
              <textarea
                className="raw-code-input"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                spellCheck="false"
                placeholder="Paste your code here..."
              />
            </div>
          </div>

          <div className="controls-section glass-panel">

            <div className="control-group">
              <label className="control-label">Window Title</label>
              <input
                type="text"
                className="window-title-input"
                value={windowTitle}
                onChange={(e) => setWindowTitle(e.target.value)}
                placeholder="e.g. app.tsx"
              />
            </div>

            <div className="control-group">
              <label className="control-label">Language</label>
              <div className="flex gap-2 items-center">
                <select
                  className="language-select"
                  value={language}
                  onChange={(e) => {
                    setLanguage(e.target.value);
                    setAutoDetect(false);
                  }}
                  disabled={autoDetect}
                >
                  <option value="typescript">TypeScript</option>
                  <option value="javascript">JavaScript</option>
                  <option value="python">Python</option>
                  <option value="rust">Rust</option>
                  <option value="go">Go</option>
                  <option value="java">Java</option>
                  <option value="css">CSS</option>
                  <option value="html">HTML</option>
                  <option value="json">JSON</option>
                  <option value="bash">Bash</option>
                </select>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="checkbox"
                    checked={autoDetect}
                    onChange={(e) => setAutoDetect(e.target.checked)}
                  />
                  Auto
                </label>
              </div>
            </div>

            <div className="control-group">
              <label className="control-label">Background</label>
              <div className="theme-presets">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-btn ${themeId === t.id ? 'active' : ''}`}
                    style={{ background: t.bg }}
                    onClick={() => setThemeId(t.id)}
                    aria-label={`Select ${t.name} theme`}
                    title={t.name}
                  />
                ))}
              </div>
            </div>

            <div className="control-group">
              <div className="flex justify-between items-center">
                <label className="control-label">Font Size</label>
                <span className="control-label">{fontSize}px</span>
              </div>
              <input
                type="range"
                min="10"
                max="24"
                step="1"
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <div className="flex justify-between items-center">
                <label className="control-label">Padding</label>
                <span className="control-label">{padding}px</span>
              </div>
              <input
                type="range"
                min="16"
                max="128"
                step="8"
                value={padding}
                onChange={(e) => setPadding(Number(e.target.value))}
              />
            </div>

            <div className="control-group">
              <label className="control-label">Social Preset</label>
              <select
                className="language-select"
                value={socialPreset}
                onChange={(e) => setSocialPreset(e.target.value)}
              >
                {SOCIAL_PRESETS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.width > 0 && `(${p.width}×${p.height})`}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2">
              <button className="export-btn" onClick={handleCopyImage}>
                {copied ? <Check size={18} /> : <Copy size={18} />}
                Copy
              </button>
              <button className="export-btn" onClick={handleExport}>
                <Download size={18} />
                Save
              </button>
            </div>

            <div className="keyboard-shortcuts">
              <p className="text-xs" style={{ color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.5rem' }}>
                ⌘/Ctrl+S to save • ⌘/Ctrl+C to copy
              </p>
            </div>

          </div>

        </aside>
      </main>
    </div>
  );
}

export default App;
