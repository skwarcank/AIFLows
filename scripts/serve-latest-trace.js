#!/usr/bin/env node

// Tiny tracer-bullet HTTP API for the latest local Hermes trace.
// Intentionally localhost-only and dependency-free.
//
// Run with:
//   node --experimental-sqlite --no-warnings scripts/serve-latest-trace.js

const http = require('node:http');
const { readLatestTrace, traceToGraphData } = require('./trace-reader');

const HOST = '127.0.0.1';
const DEFAULT_PORT = 3417;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

const INDEX_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>AIFlows Trace</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 860px; margin: 2rem auto; padding: 0 1rem; line-height: 1.45; }
    code, pre { background: #f4f4f4; padding: 0.15rem 0.3rem; border-radius: 4px; }
    .error { color: #9b1c1c; }
    .ok { color: #176b2c; }
    li { margin: 0.35rem 0; }
    .flow { list-style: none; padding: 0; }
    .flow li { border: 1px solid #ddd; border-radius: 8px; margin: 0 0 0.75rem 0; padding: 0.75rem; }
    .flow li::after { content: '↓'; display: block; color: #777; margin: 0.75rem 0 -1.2rem 1rem; }
    .flow li:last-child::after { content: ''; }
    .type { color: #555; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>AIFlows latest Hermes trace</h1>
  <p>Static tracer bullet: browser → localhost API → real Hermes trace.</p>

  <section>
    <h2>Health</h2>
    <p id="health">Loading…</p>
  </section>

  <section>
    <h2>Trace summary</h2>
    <dl>
      <dt>Source</dt><dd id="source">Loading…</dd>
      <dt>Prompt preview</dt><dd id="promptPreview">Loading…</dd>
      <dt>Final answer preview</dt><dd id="finalAnswerPreview">Loading…</dd>
      <dt>Event count</dt><dd id="eventCount">Loading…</dd>
    </dl>
  </section>

  <section>
    <h2>Graph flow</h2>
    <p>Rendered from <code>/api/latest-trace/graph</code>.</p>
    <ol id="graph" class="flow"><li>Loading…</li></ol>
  </section>

  <section>
    <h2>Events</h2>
    <ul id="events"><li>Loading…</li></ul>
  </section>

  <script>
    const text = (id, value) => {
      document.getElementById(id).textContent = value ?? '—';
    };

    async function fetchJson(path) {
      const response = await fetch(path);
      if (!response.ok) {
        throw new Error(path + ' returned HTTP ' + response.status);
      }
      return response.json();
    }

    async function loadHealth() {
      try {
        const health = await fetchJson('/health');
        const node = document.getElementById('health');
        node.textContent = health.ok ? 'OK' : 'Error: health response was not ok';
        node.className = health.ok ? 'ok' : 'error';
      } catch (error) {
        const node = document.getElementById('health');
        node.textContent = 'Error: ' + error.message;
        node.className = 'error';
      }
    }

    async function loadTrace() {
      try {
        const trace = await fetchJson('/api/latest-trace');
        text('source', trace.source);
        text('promptPreview', trace.promptPreview);
        text('finalAnswerPreview', trace.finalAnswerPreview);
        text('eventCount', Array.isArray(trace.events) ? String(trace.events.length) : '0');

        const list = document.getElementById('events');
        list.replaceChildren();
        for (const event of trace.events || []) {
          const item = document.createElement('li');
          const type = event.type || 'unknown';
          const title = event.title || 'Untitled event';
          item.textContent = type + ': ' + title;
          list.appendChild(item);
        }
        if (!list.children.length) {
          const item = document.createElement('li');
          item.textContent = 'No events returned.';
          list.appendChild(item);
        }
      } catch (error) {
        text('source', 'Error');
        text('promptPreview', 'Error: ' + error.message);
        text('finalAnswerPreview', '—');
        text('eventCount', '—');
        const list = document.getElementById('events');
        list.replaceChildren();
        const item = document.createElement('li');
        item.className = 'error';
        item.textContent = 'Error loading /api/latest-trace: ' + error.message;
        list.appendChild(item);
      }
    }

    async function loadGraph() {
      const list = document.getElementById('graph');
      try {
        const graph = await fetchJson('/api/latest-trace/graph');
        list.replaceChildren();
        for (const node of graph.nodes || []) {
          const item = document.createElement('li');
          const label = document.createElement('strong');
          const type = document.createElement('div');

          label.textContent = node.order + '. ' + node.label;
          type.className = 'type';
          type.textContent = node.type + ' · node ' + node.id;

          item.appendChild(label);
          item.appendChild(type);
          list.appendChild(item);
        }
        if (!list.children.length) {
          const item = document.createElement('li');
          item.textContent = 'No graph nodes returned.';
          list.appendChild(item);
        }
      } catch (error) {
        list.replaceChildren();
        const item = document.createElement('li');
        item.className = 'error';
        item.textContent = 'Error loading /api/latest-trace/graph: ' + error.message;
        list.appendChild(item);
      }
    }

    loadHealth();
    loadTrace();
    loadGraph();
  </script>
</body>
</html>`;

function sendHtml(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'text/html; charset=utf-8',
  });
  response.end(body);
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function notFound(response) {
  sendJson(response, 404, {
    error: 'Not found',
    endpoints: ['/', '/health', '/api/latest-trace', '/api/latest-trace/graph'],
  });
}

function handleRequest(request, response) {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Only GET is supported.' });
    return;
  }

  if (url.pathname === '/') {
    sendHtml(response, 200, INDEX_HTML);
    return;
  }

  if (url.pathname === '/health') {
    sendJson(response, 200, { ok: true });
    return;
  }

  if (url.pathname === '/api/latest-trace') {
    try {
      sendJson(response, 200, readLatestTrace());
    } catch (error) {
      sendJson(response, 500, {
        error: 'Failed to read latest Hermes trace.',
        message: error.message,
      });
    }
    return;
  }

  if (url.pathname === '/api/latest-trace/graph') {
    try {
      const trace = readLatestTrace();
      sendJson(response, 200, traceToGraphData(trace));
    } catch (error) {
      sendJson(response, 500, {
        error: 'Failed to build latest Hermes trace graph.',
        message: error.message,
      });
    }
    return;
  }

  notFound(response);
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`AIFlows trace API listening on http://${HOST}:${PORT}`);
});
