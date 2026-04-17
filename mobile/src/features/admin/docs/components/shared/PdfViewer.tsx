/**
 * PdfViewer — renders a PDF inline using PDF.js via WebView.
 * Uses the server origin as baseUrl so Android WebView allows cross-origin fetches.
 */
import React, { useState } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

interface Props {
  url: string;       // full resolved https:// URL
  width: number;
  height: number;
  isDark: boolean;
  onOpenExternal?: () => void;
}

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

// PDF.js from CDN
const PDFJS_VERSION = '3.11.174';
const PDFJS_URL     = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.min.js`;
const WORKER_URL    = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/pdf.worker.min.js`;

function buildHtml(pdfUrl: string, isDark: boolean): string {
  const bg      = isDark ? '#1e293b' : '#f8fafc';
  const fg      = isDark ? '#e2e8f0' : '#1e293b';
  const toolBg  = isDark ? '#0f172a' : '#f1f5f9';
  const btnBg   = isDark ? '#334155' : '#e2e8f0';
  const divLine = isDark ? '#334155' : '#e2e8f0';

  // Escape the URL for safe embedding in JS string
  const safeUrl = pdfUrl.replace(/\\/g, '\\\\').replace(/'/g, "\\'");

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:${bg};font-family:sans-serif;overflow-x:hidden}
#toolbar{
  position:sticky;top:0;z-index:10;
  display:none;align-items:center;justify-content:center;gap:10px;
  padding:8px 12px;background:${toolBg};
  border-bottom:1px solid ${divLine};
}
#toolbar button{
  background:${btnBg};color:${fg};border:none;border-radius:6px;
  padding:6px 16px;font-size:14px;cursor:pointer;
}
#toolbar button:disabled{opacity:0.35}
#page-info{font-size:13px;color:${fg};min-width:70px;text-align:center}
#pages{display:flex;flex-direction:column;align-items:center;padding:10px 6px;gap:10px}
canvas{max-width:100%;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.25)}
#loading{
  display:flex;flex-direction:column;align-items:center;
  justify-content:center;padding:60px 20px;gap:10px;color:${fg};
}
#err{
  display:none;flex-direction:column;align-items:center;
  justify-content:center;padding:40px 20px;gap:10px;
  color:#dc2626;text-align:center;
}
</style>
</head>
<body>
<div id="loading"><div style="font-size:36px">📄</div><div>Loading PDF…</div></div>
<div id="err">
  <div style="font-size:36px">⚠️</div>
  <div style="font-size:14px;font-weight:700">Could not load PDF</div>
  <div id="err-msg" style="font-size:11px;color:#94a3b8;margin-top:4px"></div>
</div>
<div id="toolbar">
  <button id="btn-prev" onclick="go(-1)">‹ Prev</button>
  <span id="page-info"></span>
  <button id="btn-next" onclick="go(1)">Next ›</button>
</div>
<div id="pages"></div>

<script src="${PDFJS_URL}"></script>
<script>
pdfjsLib.GlobalWorkerOptions.workerSrc = '${WORKER_URL}';

var pdf = null, cur = 1, total = 0;
var elLoad = document.getElementById('loading');
var elErr  = document.getElementById('err');
var elBar  = document.getElementById('toolbar');
var elPages = document.getElementById('pages');
var elInfo  = document.getElementById('page-info');

function showErr(msg) {
  elLoad.style.display = 'none';
  elErr.style.display  = 'flex';
  document.getElementById('err-msg').textContent = msg || '';
}

function updateBar() {
  elInfo.textContent = cur + ' / ' + total;
  document.getElementById('btn-prev').disabled = cur <= 1;
  document.getElementById('btn-next').disabled = cur >= total;
}

async function renderPage(n) {
  var page = await pdf.getPage(n);
  var scale = (window.innerWidth - 12) / page.getViewport({scale:1}).width;
  var vp = page.getViewport({scale: scale});
  var canvas = document.createElement('canvas');
  canvas.width  = vp.width;
  canvas.height = vp.height;
  elPages.innerHTML = '';
  elPages.appendChild(canvas);
  await page.render({canvasContext: canvas.getContext('2d'), viewport: vp}).promise;
}

function go(d) {
  var n = cur + d;
  if (n < 1 || n > total) return;
  cur = n;
  updateBar();
  renderPage(cur);
}

pdfjsLib.getDocument({
  url: '${safeUrl}',
  withCredentials: false,
  cMapUrl: 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${PDFJS_VERSION}/cmaps/',
  cMapPacked: true,
}).promise.then(function(doc) {
  pdf   = doc;
  total = doc.numPages;
  elLoad.style.display  = 'none';
  elBar.style.display   = 'flex';
  elPages.style.display = 'flex';
  updateBar();
  return renderPage(1);
}).catch(function(e) {
  showErr(e && e.message ? e.message : String(e));
});
</script>
</body>
</html>`;
}

const PdfViewer: React.FC<Props> = ({ url, width, height, isDark, onOpenExternal }) => {
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(false);

  const html = buildHtml(url, isDark);

  return (
    <View style={{ width, height, backgroundColor: isDark ? '#1e293b' : '#f8fafc' }}>
      {/* Native loading overlay — shown until WebView fires onLoadEnd */}
      {loading && !error && (
        <View style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          alignItems: 'center', justifyContent: 'center', zIndex: 1,
          backgroundColor: isDark ? '#1e293b' : '#f8fafc', gap: 8,
        }}>
          <ActivityIndicator color="#dc2626" size="large" />
          <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
            Loading PDF…
          </Text>
        </View>
      )}

      {error ? (
        <View style={{
          flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20,
        }}>
          <Text style={{ fontSize: 28 }}>⚠️</Text>
          <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626', textAlign: 'center' }}>
            Could not load PDF
          </Text>
          {onOpenExternal && (
            <Pressable
              onPress={onOpenExternal}
              style={({ pressed }) => ({
                paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8,
                backgroundColor: pressed ? '#b91c1c' : '#dc2626',
              })}
            >
              <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>Open externally ↗</Text>
            </Pressable>
          )}
        </View>
      ) : (
        <WebView
          // baseUrl = server origin → Android allows fetching from same host
          source={{ html, baseUrl: SERVER_ORIGIN }}
          style={{ flex: 1 }}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
          // Allow mixed content (http PDF on https page) — needed for some setups
          mixedContentMode="always"
          // Allow universal access so PDF.js can fetch the PDF URL
          allowUniversalAccessFromFileURLs
          allowFileAccessFromFileURLs
          onLoadStart={() => { setLoading(true); setError(false); }}
          onLoadEnd={() => setLoading(false)}
          onError={() => { setLoading(false); setError(true); }}
        />
      )}
    </View>
  );
};

export default PdfViewer;
