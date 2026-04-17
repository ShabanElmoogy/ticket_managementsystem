/**
 * ExcelViewer — renders Excel/CSV files using SheetJS via WebView.
 *
 * Strategy: fetch the file from React Native (no CORS restrictions),
 * convert to base64, inject into WebView as a data URI so SheetJS
 * can parse it without any network calls from inside the WebView.
 */
import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { tokenManager } from '../../../../../services/api/tokenManager';

interface Props {
  url: string;
  width: number;
  height: number;
  isDark: boolean;
  onOpenExternal?: () => void;
}

const BASE_URL      = process.env.EXPO_PUBLIC_API_URL ?? 'https://localhost:3000/api';
const SERVER_ORIGIN = BASE_URL.replace(/\/api\/?$/, '');

// SheetJS CDN
const XLSX_CDN = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fetch file from RN side → base64 string (no CORS issues)
// ─────────────────────────────────────────────────────────────────────────────
async function fetchFileAsBase64(url: string): Promise<string> {
  const token      = tokenManager.getToken();
  const tenantSlug = tokenManager.getTenantSlug();

  const res = await fetch(url, {
    headers: {
      ...(token      ? { Authorization: `Bearer ${token}` }  : {}),
      ...(tenantSlug ? { 'X-Tenant-Slug': tenantSlug }       : {}),
    },
  });

  if (!res.ok) throw new Error(`HTTP ${res.status}`);

  const blob   = await res.blob();
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // result is "data:<mime>;base64,<data>" — extract just the base64 part
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Build HTML — receives base64 data, no network calls needed inside WebView
// ─────────────────────────────────────────────────────────────────────────────
function buildHtml(base64Data: string, isDark: boolean): string {
  const bg       = isDark ? '#1e293b' : '#ffffff';
  const fg       = isDark ? '#e2e8f0' : '#1e293b';
  const headerBg = isDark ? '#0f172a' : '#f1f5f9';
  const border   = isDark ? '#334155' : '#e2e8f0';
  const evenRow  = isDark ? '#1e293b' : '#f8fafc';
  const oddRow   = isDark ? '#273549' : '#ffffff';
  const thBg     = isDark ? '#1e3a5f' : '#dbeafe';
  const thFg     = isDark ? '#93c5fd' : '#1d4ed8';

  return `<!DOCTYPE html>
<html>
<head>
<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=3">
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;background:${bg};font-family:sans-serif;color:${fg};font-size:13px}
#toolbar{
  position:sticky;top:0;z-index:10;
  display:flex;align-items:center;gap:8px;
  padding:8px 10px;background:${headerBg};
  border-bottom:1px solid ${border};flex-wrap:wrap;
}
#sheet-tabs{display:flex;gap:5px;flex-wrap:wrap;flex:1}
.tab-btn{
  padding:4px 10px;border-radius:6px;border:1px solid ${border};
  background:${bg};color:${fg};font-size:12px;cursor:pointer;
}
.tab-btn.active{background:#16a34a;color:#fff;border-color:#16a34a}
#search-box{
  padding:4px 8px;border-radius:6px;border:1px solid ${border};
  background:${bg};color:${fg};font-size:12px;outline:none;width:100px;
}
#row-count{font-size:11px;color:#94a3b8;padding:3px 10px 6px}
#table-wrap{overflow:auto;padding:0 8px 12px}
table{border-collapse:collapse;min-width:100%;white-space:nowrap}
th{
  background:${thBg};color:${thFg};font-weight:700;
  padding:7px 12px;border:1px solid ${border};
  position:sticky;top:0;z-index:1;text-align:left;
}
td{padding:6px 12px;border:1px solid ${border}}
tr:nth-child(even) td{background:${evenRow}}
tr:nth-child(odd)  td{background:${oddRow}}
tr.highlight td{background:#fef08a!important;color:#713f12}
tr.hidden{display:none}
#err{
  display:none;flex-direction:column;align-items:center;
  justify-content:center;padding:40px 20px;gap:10px;
  color:#dc2626;text-align:center;
}
</style>
</head>
<body>
<div id="err">
  <div style="font-size:36px">⚠️</div>
  <div style="font-size:14px;font-weight:700">Could not parse file</div>
  <div id="err-msg" style="font-size:11px;color:#94a3b8;margin-top:4px"></div>
</div>
<div id="toolbar">
  <div id="sheet-tabs"></div>
  <input id="search-box" type="text" placeholder="Search…" oninput="doSearch(this.value)">
</div>
<div id="row-count"></div>
<div id="table-wrap"></div>

<script src="${XLSX_CDN}"></script>
<script>
var workbook = null;

function showErr(msg) {
  document.getElementById('toolbar').style.display = 'none';
  var e = document.getElementById('err');
  e.style.display = 'flex';
  document.getElementById('err-msg').textContent = msg || '';
}

function renderSheet(idx) {
  document.querySelectorAll('.tab-btn').forEach(function(b, i) {
    b.classList.toggle('active', i === idx);
  });
  var name = workbook.SheetNames[idx];
  var ws   = workbook.Sheets[name];
  var html = XLSX.utils.sheet_to_html(ws, { editable: false });
  html = html.replace('<table>', '<table id="dt">');
  document.getElementById('table-wrap').innerHTML = html;

  // Convert first row tds → ths
  var tbl = document.getElementById('dt');
  if (tbl) {
    var firstRow = tbl.querySelector('tr');
    if (firstRow) {
      Array.from(firstRow.querySelectorAll('td')).forEach(function(td) {
        var th = document.createElement('th');
        th.innerHTML = td.innerHTML;
        firstRow.replaceChild(th, td);
      });
    }
    var rows = tbl.querySelectorAll('tr');
    document.getElementById('row-count').textContent = Math.max(0, rows.length - 1) + ' rows';
  }
  document.getElementById('search-box').value = '';
}

function doSearch(q) {
  var tbl = document.getElementById('dt');
  if (!tbl) return;
  var lq = q.toLowerCase();
  Array.from(tbl.querySelectorAll('tr')).forEach(function(row, i) {
    if (i === 0) return;
    var match = !lq || row.textContent.toLowerCase().includes(lq);
    row.classList.toggle('hidden', !match);
    row.classList.toggle('highlight', !!lq && match);
  });
}

try {
  var b64 = '${base64Data}';
  workbook = XLSX.read(b64, { type: 'base64' });

  var tabsEl = document.getElementById('sheet-tabs');
  workbook.SheetNames.forEach(function(name, i) {
    var btn = document.createElement('button');
    btn.className = 'tab-btn';
    btn.textContent = name;
    btn.onclick = function() { renderSheet(i); };
    tabsEl.appendChild(btn);
  });

  renderSheet(0);
} catch(e) {
  showErr(e && e.message ? e.message : String(e));
}
</script>
</body>
</html>`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────
const ExcelViewer: React.FC<Props> = ({ url, width, height, isDark, onOpenExternal }) => {
  const [html,    setHtml]    = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    setHtml(null);
    setLoading(true);
    setError(null);

    fetchFileAsBase64(url)
      .then((base64) => {
        setHtml(buildHtml(base64, isDark));
        setLoading(false);
      })
      .catch((err) => {
        setError(err?.message ?? 'Could not load file');
        setLoading(false);
      });
  }, [url]);

  if (loading) {
    return (
      <View style={{
        width, height, alignItems: 'center', justifyContent: 'center', gap: 10,
        backgroundColor: isDark ? '#1e293b' : '#fff',
      }}>
        <ActivityIndicator color="#16a34a" size="large" />
        <Text style={{ fontSize: 12, color: isDark ? '#94a3b8' : '#64748b' }}>
          Loading spreadsheet…
        </Text>
      </View>
    );
  }

  if (error || !html) {
    return (
      <View style={{
        width, height, alignItems: 'center', justifyContent: 'center', gap: 10, padding: 20,
        backgroundColor: isDark ? '#1e293b' : '#fff',
      }}>
        <Text style={{ fontSize: 28 }}>⚠️</Text>
        <Text style={{ fontSize: 13, fontWeight: '700', color: '#dc2626', textAlign: 'center' }}>
          Could not load file
        </Text>
        <Text style={{ fontSize: 11, color: isDark ? '#94a3b8' : '#64748b', textAlign: 'center' }}>
          {error}
        </Text>
        {onOpenExternal && (
          <Pressable
            onPress={onOpenExternal}
            style={({ pressed }) => ({
              paddingHorizontal: 16, paddingVertical: 9, borderRadius: 8,
              backgroundColor: pressed ? '#15803d' : '#16a34a',
            })}
          >
            <Text style={{ fontSize: 13, color: '#fff', fontWeight: '700' }}>Open externally ↗</Text>
          </Pressable>
        )}
      </View>
    );
  }

  return (
    <View style={{ width, height, backgroundColor: isDark ? '#1e293b' : '#fff' }}>
      <WebView
        source={{ html, baseUrl: SERVER_ORIGIN }}
        style={{ flex: 1 }}
        javaScriptEnabled
        domStorageEnabled
        originWhitelist={['*']}
        mixedContentMode="always"
        scrollEnabled
      />
    </View>
  );
};

export default ExcelViewer;
