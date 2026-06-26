#!/usr/bin/env node

// Tiny tracer-bullet HTTP API for the latest local Hermes trace.
// Intentionally localhost-only and dependency-free.
//
// Run with:
//   node --experimental-sqlite --no-warnings scripts/serve-latest-trace.js

const http = require('node:http');
const { readLatestTrace } = require('./trace-reader');

const HOST = '127.0.0.1';
const DEFAULT_PORT = 3417;
const PORT = Number(process.env.PORT || DEFAULT_PORT);

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    'content-type': 'application/json; charset=utf-8',
  });
  response.end(`${JSON.stringify(body, null, 2)}\n`);
}

function notFound(response) {
  sendJson(response, 404, {
    error: 'Not found',
    endpoints: ['/health', '/api/latest-trace'],
  });
}

function handleRequest(request, response) {
  const url = new URL(request.url, `http://${HOST}:${PORT}`);

  if (request.method !== 'GET') {
    sendJson(response, 405, { error: 'Only GET is supported.' });
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

  notFound(response);
}

const server = http.createServer(handleRequest);

server.listen(PORT, HOST, () => {
  console.log(`AIFlows trace API listening on http://${HOST}:${PORT}`);
});
