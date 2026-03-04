import { useState, useRef, useEffect } from 'react';
import { Camera, Code2, Download } from 'lucide-react';
import { toPng } from 'html-to-image';
import { createHighlighter, type Highlighter } from 'shiki';
import './App.css';

const THEMES = [
  { id: 'sunset', bg: 'var(--grad-sunset)' },
  { id: 'ocean', bg: 'var(--grad-ocean)' },
  { id: 'aurora', bg: 'var(--grad-aurora)' },
  { id: 'midnight', bg: 'var(--grad-midnight)' },
  { id: 'candy', bg: 'var(--grad-candy)' },
  { id: 'dark', bg: '#1f2937' },
];

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

  const [htmlCode, setHtmlCode] = useState('');
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  const canvasRef = useRef<HTMLDivElement>(null);

  // Initialize Shiki
  useEffect(() => {
    async function init() {
      const hl = await createHighlighter({
        themes: ['vitesse-dark'],
        langs: ['typescript', 'javascript', 'css', 'html']
      });
      setHighlighter(hl);
    }
    init();
  }, []);

  // Update highlighted code when code changes
  useEffect(() => {
    if (highlighter && code) {
      const html = highlighter.codeToHtml(code, {
        lang: 'typescript',
        theme: 'vitesse-dark'
      });
      setHtmlCode(html);
    } else if (!code) {
      setHtmlCode('');
    }
  }, [code, highlighter]);

  const activeTheme = THEMES.find((t) => t.id === themeId);

  const handleExport = async () => {
    if (!canvasRef.current) return;

    try {
      // Temporarily hide the toast to ensure it doesn't get caught in the screenshot
      setShowToast(false);

      const dataUrl = await toPng(canvasRef.current, {
        quality: 1,
        pixelRatio: 2, // High resolution
        skipFonts: true, // Speeds up generation if fonts are loaded differently
      });

      const link = document.createElement('a');
      link.download = 'code-snap.png';
      link.href = dataUrl;
      link.click();

      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } catch (err) {
      console.error('Failed to generate image', err);
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
              </div>

              <div
                className="shiki-container"
                dangerouslySetInnerHTML={{ __html: htmlCode || '<pre><code><span>Type your code...</span></code></pre>' }}
              />
            </div>
          </div>

          <div className={`toast ${showToast ? 'show' : ''}`}>
            Downloaded code-snap.png ✨
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
              <label className="control-label">Background</label>
              <div className="theme-presets">
                {THEMES.map((t) => (
                  <button
                    key={t.id}
                    className={`theme-btn ${themeId === t.id ? 'active' : ''}`}
                    style={{ background: t.bg }}
                    onClick={() => setThemeId(t.id)}
                    aria-label={`Select ${t.id} theme`}
                  />
                ))}
              </div>
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

            <button className="export-btn" onClick={handleExport}>
              <Download size={18} />
              Export Image
            </button>

          </div>

        </aside>
      </main>
    </div>
  );
}

export default App;
