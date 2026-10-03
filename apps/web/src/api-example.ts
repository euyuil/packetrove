import type { ToolApiDefinition } from '@packetrove/contracts';

function shellQuote(value: string) {
  return "'" + value.replaceAll("'", "'\\''") + "'";
}

export function apiExampleCommand(tool: ToolApiDefinition, url: string) {
  if (tool.api.method === 'post') {
    return `curl -fsS ${url} \\\n  -H 'Content-Type: application/json' \\\n  -d ${shellQuote(JSON.stringify(tool.example.request))}`;
  }
  return `curl -fsS ${url}` + (tool.api.response.text ? " -H 'Accept: text/plain'" : '');
}
