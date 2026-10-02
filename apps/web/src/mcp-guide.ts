import { MAX_INPUTS, MAX_INPUT_LENGTH, MAX_SUBTRACTION_INPUTS, MAX_SUBTRACTION_OUTPUTS, MCP_PATH, PACKETROVE_VERSION, tools } from '@packetrove/contracts';
import workerManifest from '../../worker/package.json' with { type: 'json' };
import { createInstance } from 'i18next';
import type {} from './i18n/i18next';
import { resources } from './i18n/resources';
import type { Locale } from './i18n/locales';
import { mcpExamples, type McpExampleTool } from './mcp-examples';

const translations = new Map<Locale, ReturnType<typeof createInstance>>();

function guideTranslator(locale: Locale) {
  let instance = translations.get(locale);
  if (!instance) {
    instance = createInstance();
    void instance.init({
      resources, lng: locale, fallbackLng: 'en', load: 'currentOnly',
      initAsync: false, enableSelector: true, interpolation: { escapeValue: false },
    });
    translations.set(locale, instance);
  }
  return instance.t;
}

export function getMcpToolContent(tool: McpExampleTool, locale: Locale) {
  const t = guideTranslator(locale);
  const example = mcpExamples[tool];
  return {
    tool, example,
    title: t($ => $.discovery[tool].mcpTitle),
    purpose: t($ => $.discovery[tool].purpose),
    inputs: t($ => $.discovery[tool].inputs, {
      maximumInputs: new Intl.NumberFormat(locale).format(tool === 'subtract' ? MAX_SUBTRACTION_INPUTS : MAX_INPUTS),
      maximumLength: MAX_INPUT_LENGTH, maximumOutputs: new Intl.NumberFormat(locale).format(MAX_SUBTRACTION_OUTPUTS),
    }),
    result: t($ => $.discovery[tool].result, {
      maximumOutputs: new Intl.NumberFormat(locale).format(MAX_SUBTRACTION_OUTPUTS),
    }),
    boundary: t($ => $.discovery[tool].boundary),
    expansion: tool === 'cidr' ? t($ => $.cidr.exampleResult, {
      cidr: mcpExamples.cidr.result.cidr, covered: mcpExamples.cidr.result.coveredAddressCount,
      additional: mcpExamples.cidr.result.additionalAddressCount,
    }) : undefined,
    openTool: t($ => $.discovery[tool].openTool),
  };
}

export function getMcpSdkExample(serverUrl: string, productVersion = PACKETROVE_VERSION) {
  const example = mcpExamples.cidr;
  return `import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const client = new Client(
  { name: 'packetrove-example', version: ${JSON.stringify(productVersion)} },
  { versionNegotiation: { mode: 'auto' } },
);
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(${JSON.stringify(serverUrl)})));
  const { tools } = await client.listTools();
  const result = await client.callTool({
    name: ${JSON.stringify(example.name)},
    arguments: ${JSON.stringify(example.arguments)},
  });
  if (result.isError) throw new Error(JSON.stringify(result.content));
  console.log(tools.map(tool => tool.name), result.structuredContent);
} finally {
  await client.close();
}`;
}

// Both the localized website and the generated repository guide consume this content.
export function getMcpGuide(locale: Locale, serverUrl: string, productVersion = PACKETROVE_VERSION) {
  const t = guideTranslator(locale);
  const toolContent = tools.map(tool => getMcpToolContent(tool.page, locale));
  const sdkVersion = workerManifest.dependencies['@modelcontextprotocol/client'];
  return {
    title: t($ => $.mcp.title),
    explanation: t($ => $.mcp.explanation),
    connection: t($ => $.mcp.connection),
    serverUrl,
    clients: [
      { name: 'Claude Code', command: `claude mcp add --transport http --scope user packetrove \\\n  ${serverUrl}`, url: 'https://code.claude.com/docs/en/mcp', label: t($ => $.mcp.clientGuide, { client: 'Claude Code' }) },
      { name: 'Codex', command: `codex mcp add packetrove \\\n  --url ${serverUrl}`, url: 'https://developers.openai.com/codex/mcp/', label: t($ => $.mcp.clientGuide, { client: 'Codex' }) },
    ],
    connectTitle: t($ => $.mcp.connectTitle),
    connectDescription: t($ => $.mcp.connectDescription),
    check: t($ => $.mcp.check, { tools: toolContent.map(tool => tool.example.name).join(', ') }),
    discovery: t($ => $.mcp.discovery),
    tools: toolContent,
    labels: {
      toolName: t($ => $.mcp.toolName), serverAddress: t($ => $.home.serverAddress),
      arguments: t($ => $.mcp.arguments), exampleResult: t($ => $.mcp.exampleResult),
      website: t($ => $.home.mcpGuide), api: t($ => $.home.apiGuide),
      source: t($ => $.common.source), technicalGuide: t($ => $.mcp.technicalGuide),
    },
    errorsTitle: t($ => $.mcp.errorsTitle),
    results: t($ => $.mcp.results),
    errors: t($ => $.mcp.errors),
    httpErrors: t($ => $.mcp.httpErrors),
    sdk: {
      title: t($ => $.mcp.sdkTitle), description: t($ => $.mcp.sdkDescription, { version: sdkVersion }),
      code: getMcpSdkExample(serverUrl, productVersion),
      command: `npm init -y\nnpm install @modelcontextprotocol/client@${sdkVersion}\nnode packetrove-example.mjs`,
      local: t($ => $.mcp.sdkLocal, { localUrl: new URL(MCP_PATH, 'http://localhost:8787').href }),
    },
    deployment: {
      title: t($ => $.mcp.deploymentTitle),
      paragraphs: [t($ => $.mcp.serverBehavior), t($ => $.mcp.connectionPrivacy),
        t($ => $.mcp.toolMigration, { ipTool: mcpExamples.ip.name }), t($ => $.mcp.endpointMigration, { serverUrl })],
      label: t($ => $.mcp.deploymentGuide),
    },
  };
}
