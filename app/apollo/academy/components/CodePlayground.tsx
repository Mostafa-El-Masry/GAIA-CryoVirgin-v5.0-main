"use client";

import { useEffect, useState } from "react";

type CodePlaygroundResult = {
  ok: boolean;
  message?: string;
};

type CodePlaygroundProps = {
  initialCode?: string;
  language?: "html" | "css" | "js";
  onValidate?: (code: string) => CodePlaygroundResult;
};

const buildPreviewDocument = (language: "html" | "css" | "js", code: string) => {
  if (language === "html") {
    return code;
  }
  if (language === "css") {
    return `<!DOCTYPE html>
<html>
  <head>
    <style>
${code}
    </style>
  </head>
  <body>
    <div class="preview-target">
      This is your CSS preview area.
    </div>
  </body>
</html>`;
  }
  // language === "js"
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="UTF-8" />
    <title>JS practice</title>
  </head>
  <body>
    <pre id="console"></pre>
    <script>
      const log = (...args) => {
        const el = document.getElementById('console');
        if (el) {
          el.textContent += args.join(' ') + '\n';
        }
      };
      console.log = log;
      try {
${code}
      } catch (err) {
        log('Error:', err && err.message ? err.message : String(err));
      }
    </script>
  </body>
</html>`;
};

const CodePlayground = ({
  initialCode = "",
  language = "html",
  onValidate,
}: CodePlaygroundProps) => {
  const [code, setCode] = useState(initialCode);
  const [previewDoc, setPreviewDoc] = useState("");
  const [result, setResult] = useState<CodePlaygroundResult | null>(null);
  const [hasPreview, setHasPreview] = useState(false);

  useEffect(() => {
    setCode(initialCode);
    setResult(null);
    setHasPreview(false);
  }, [initialCode, language]);

  const handleRun = () => {
    const doc = buildPreviewDocument(language, code);
    setPreviewDoc(doc);
    setHasPreview(true);

    if (onValidate) {
      const res = onValidate(code);
      setResult(res);
    } else {
      setResult({
        ok: true,
        message: "Preview updated. There is no automatic check for this task yet.",
      });
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-2 rounded-2xl border gaia-border bg-[var(--gaia-surface-soft)] p-4 sm:p-5 shadow-sm">
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <p className="text-[11px] sm:text-xs gaia-muted">Code</p>
          <button
            type="button"
            onClick={handleRun}
            className="inline-flex items-center justify-center rounded-full border gaia-border px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-[var(--gaia-foreground)] hover:bg-[var(--gaia-surface)] transition"
          >
            Run &amp; check
          </button>
        </div>
        <textarea
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="mt-1 w-full rounded-xl border gaia-border bg-[var(--gaia-surface)] px-3 py-2 text-xs sm:text-sm font-mono leading-relaxed outline-none focus:border-info focus:ring-2 focus:ring-info/30 min-h-[480px]"
          spellCheck={false}
        />
        {result && (
          <p
            className={`text-[11px] sm:text-xs ${
              result.ok ? "text-emerald-700" : "text-[var(--gaia-text-muted)]"
            }`}
          >
            {result.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <p className="text-[11px] sm:text-xs gaia-muted">Preview</p>
        <div className="h-[32rem] w-full overflow-hidden rounded-xl border gaia-border gaia-ink-soft bg-[var(--gaia-surface)]">
          {hasPreview ? (
            <iframe
              title="Code preview"
              className="h-full w-full border-0"
              srcDoc={previewDoc}
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[11px] sm:text-xs text-[var(--gaia-text-muted)] px-4 text-center">
              Run your code to see the preview here.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodePlayground;
