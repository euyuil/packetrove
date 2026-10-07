import { MCP_PATH, PACKETROVE_VERSION, getServiceIdentity, getToolResultLink, toolCatalog, tools, operationCatalog,
  MAX_FEEDBACK_SUMMARY, MAX_FEEDBACK_DESCRIPTION, MAX_FEEDBACK_REPRODUCTION,
  FEEDBACK_IP_LIMIT, FEEDBACK_DAILY_LIMIT, type ToolPage } from '@packetrove/contracts';
import { getWebsiteOrigin } from './i18n/page-metadata';
import workerManifest from '../../worker/package.json' with { type: 'json' };
import { createInstance } from 'i18next';
import type {} from './i18n/i18next';
import { getLocaleResources } from './i18n/locale-resources';
import type { TranslationResource } from './i18n/translation-resource';
import type { Locale } from './i18n/locales';
import { getToolDocumentation } from './tool-documentation';

const translations = new Map<Locale, ReturnType<typeof createInstance>>();

function guideTranslator(locale: Locale, translation?: TranslationResource) {
  let instance = translations.get(locale);
  if (!instance) {
    instance = createInstance();
    void instance.init({
      resources: translation ? { [locale]: { translation } } : getLocaleResources(locale),
      lng: locale, fallbackLng: 'en', load: 'currentOnly',
      initAsync: false, enableSelector: true, interpolation: { escapeValue: false },
    });
    translations.set(locale, instance);
  }
  return instance.t;
}

export function getMcpToolContent(tool: ToolPage, locale: Locale, translation?: TranslationResource,
  websiteOrigin = getWebsiteOrigin()) {
  const t = guideTranslator(locale, translation);
  const definition = toolCatalog[tool];
  const documentation = getToolDocumentation(tool);
  const example = {
    name: definition.mcp.name, arguments: definition.example.request, result: definition.example.result,
  };
  return {
    tool, example, resourceLink: getToolResultLink(definition, websiteOrigin),
    title: t($ => $.discovery[tool].mcpTitle),
    purpose: t($ => $.discovery[tool].purpose),
    inputs: documentation.mcpInputs(t, locale),
    result: documentation.mcpResult(t, locale),
    boundary: t($ => $.discovery[tool].boundary),
    exampleNote: documentation.mcpExampleNote?.(t),
    openTool: t($ => $.discovery[tool].openTool),
  };
}

function getMcpSdkExample(serverUrl: string, productVersion = PACKETROVE_VERSION) {
  const definition = toolCatalog.cidr;
  return `import { Client, StreamableHTTPClientTransport } from '@modelcontextprotocol/client';

const client = new Client(
  { name: 'packetrove-example', version: ${JSON.stringify(productVersion)} },
  { versionNegotiation: { mode: 'auto' } },
);
try {
  await client.connect(new StreamableHTTPClientTransport(new URL(${JSON.stringify(serverUrl)})));
  const serverInfo = client.getServerVersion();
  const { tools } = await client.listTools();
  const result = await client.callTool({
    name: ${JSON.stringify(definition.mcp.name)},
    arguments: ${JSON.stringify(definition.example.request)},
  });
  if (result.isError) throw new Error(JSON.stringify(result.content));
  console.log(serverInfo, tools.map(tool => tool.name), result.structuredContent);
  const links = result.content?.filter(content => content.type === 'resource_link') ?? [];
  console.log(links); // Optional links; opening or presenting them is the client's choice.
} finally {
  await client.close();
}`;
}

// Both the localized website and the generated repository guide consume this content.
export function getMcpGuide(locale: Locale, serverUrl: string, productVersion = PACKETROVE_VERSION,
  translation?: TranslationResource, websiteOrigin = getWebsiteOrigin()) {
  const t = guideTranslator(locale, translation);
  const toolContent = tools.map(tool => getMcpToolContent(tool.page, locale, translation, websiteOrigin));
  const sdkVersion = workerManifest.dependencies['@modelcontextprotocol/client'];
  const toolRenames = tools.flatMap(tool => tool.removedInterfaces.mcpNames.map(name =>
    `<code>${name}</code> → <code>${tool.mcp.name}</code>`)).join(', ');
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
    identity: {
      title: t($ => $.mcp.identityTitle),
      explanation: t($ => $.mcp.identityExplanation),
      metadata: { ...getServiceIdentity(websiteOrigin), version: productVersion },
      presentation: t($ => $.mcp.identityPresentation),
    },
    tools: toolContent,
    support: {
      title: t($ => $.feedback.title),
      availability: t($ => $.feedback.availability, { name: operationCatalog.feedback.id }),
      authorization: t($ => $.feedback.authorization),
      inputs: t($ => $.feedback.inputs, { summaryLimit: MAX_FEEDBACK_SUMMARY,
        descriptionLimit: MAX_FEEDBACK_DESCRIPTION, reproductionLimit: MAX_FEEDBACK_REPRODUCTION }),
      limits: t($ => $.feedback.limits, { ipLimit: FEEDBACK_IP_LIMIT,
        dailyLimit: FEEDBACK_DAILY_LIMIT }),
      delivery: t($ => $.feedback.delivery),
      privacy: t($ => $.privacy.sections.feedback.body),
      example: { name: operationCatalog.feedback.id, arguments: operationCatalog.feedback.examples[0].request,
        result: operationCatalog.feedback.examples[0].result },
    },
    labels: {
      toolName: t($ => $.mcp.toolName), serverAddress: t($ => $.home.serverAddress),
      arguments: t($ => $.mcp.arguments), exampleResult: t($ => $.mcp.exampleResult),
      resourceLink: t($ => $.mcp.resourceLinkLabel),
      website: t($ => $.home.mcpGuide), api: t($ => $.home.apiGuide),
      source: t($ => $.common.source), technicalGuide: t($ => $.mcp.technicalGuide),
    },
    errorsTitle: t($ => $.mcp.errorsTitle),
    results: t($ => $.mcp.results),
    resultLinks: t($ => $.mcp.resultLinks),
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
        t($ => $.mcp.operationalLogging),
        t($ => $.mcp.toolMigration, { toolRenames }), t($ => $.mcp.endpointMigration, { serverUrl })],
      label: t($ => $.mcp.deploymentGuide),
      registryLabel: t($ => $.mcp.registryGuide),
      privacyLabel: t($ => $.privacy.title),
    },
  };
}
