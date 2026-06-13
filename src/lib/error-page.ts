export function renderErrorPage(error?: Error | unknown): string {
  const errorMessage = error instanceof Error ? error.message : String(error || 'Unknown error');
  const errorStack = error instanceof Error ? error.stack : '';

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>This page didn't load</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 15px/1.5 system-ui, -apple-system, sans-serif; background: #fafafa; color: #111; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 40rem; width: 100%; text-align: left; padding: 2rem; background: #fff; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
      h1 { font-size: 1.25rem; margin: 0 0 0.5rem; text-align: center; }
      p { color: #4b5563; margin: 0 0 1.5rem; text-align: center; }
      .error-details { background: #fee2e2; color: #991b1b; padding: 1rem; border-radius: 4px; overflow-x: auto; font-family: monospace; font-size: 13px; white-space: pre-wrap; margin-bottom: 1.5rem; }
      .actions { display: flex; gap: 0.5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: 0.5rem 1rem; border-radius: 0.375rem; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #111; color: #fff; }
      .secondary { background: #fff; color: #111; border-color: #d1d5db; }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>This page didn't load</h1>
      <p>Something went wrong on our end. You can try refreshing or head back home.</p>
      
      <div class="error-details">
        <strong>Error:</strong> ${errorMessage}
        ${errorStack ? `\n\n<strong>Stack:</strong>\n${errorStack}` : ''}
      </div>

      <div class="actions">
        <button class="primary" onclick="location.reload()">Try again</button>
        <a class="secondary" href="/">Go home</a>
      </div>
    </div>
  </body>
</html>`;
}

