import type { TranslationResource } from '../resources';

export const es = {
  languageSuggestion: {
    title: '¿Quieres leer esta página en español?',
    switch: 'Cambiar a español', dismiss: 'Ahora no',
  },
  common: {
    home: 'Inicio', homeLabel: 'Inicio de Packetrove', navigation: 'Navegación principal',
    language: 'Idioma', tools: 'HERRAMIENTAS DE DIRECCIONES IP', copied: 'Copiado', dismissCopy: 'Cerrar el error de copia',
    tagline: 'Herramientas de red para personas y agentes de IA',
    source: 'Ver Packetrove en GitHub', sourceCommit: 'Ver el código de la revisión {{commit}} en GitHub', sourceLicense: 'Código fuente: MIT',
    feedbackPrompt: '¿Encontraste un problema o tienes una idea? Cuéntanos en GitHub.', reportBug: 'Informar de un problema', requestFeature: 'Sugerir una función',
    notFound: 'Página no encontrada', notFoundDescription: 'La página solicitada no existe.', returnHome: 'Volver al inicio',
  },
  footer: { project: 'Proyecto', contact: 'Contacto y sugerencias', sendEmail: 'Enviar un correo' },
  home: {
    galleryTitle: "Explora las herramientas",
    galleryDescription: "Usa las flechas o desliza las tarjetas para ver ejemplos y abrir la herramienta que necesitas.",
    galleryPrevious: "Herramienta anterior",
    galleryNext: "Herramienta siguiente",
    galleryPosition: "{{current}} de {{total}}",
    previewLabel: "Ejemplo",
    previewInputs: "Entradas de ejemplo",
    ipPreview: "Solo es una dirección de documentación. Abre la herramienta para comprobar tu conexión.",
    integrationsTitle: "Integra Packetrove en tu flujo de trabajo",
    apiIntroduction: "Llama a las herramientas desde un cliente HTTP con contratos JSON compartidos.",
    cliIntroduction: "Calcula CIDR de cobertura localmente o comprueba la conexión desde tu terminal.",
    description: 'Herramientas de red de código abierto para tu navegador, terminal y agentes de IA. Abre una herramienta desde la navegación o conecta Packetrove a tu flujo de trabajo con las instrucciones siguientes.',
    openSource: 'Código abierto', anonymous: 'No requiere cuenta ni clave de API',
    cidrDescription: 'Encuentra el CIDR único más pequeño que cubre direcciones y rangos IPv4 o IPv6. Calcula en tu navegador con recuentos exactos y una explicación clara de la cobertura adicional.',
    cidrLink: 'Abrir la calculadora CIDR',
    subtractDescription: 'Elimina redes excluidas del espacio de direcciones incluido. Copia una lista CIDR exacta para las excepciones de WireGuard o examina los huecos tras las asignaciones conocidas, sin subir tus datos.',
    subtractLink: 'Abrir la resta de CIDR',
    ipDescription: 'Consulta la IP pública de tu conexión. Si usas una VPN o un proxy, el resultado muestra su dirección de salida, no tu dirección local privada.',
    ipLink: 'Consultar mi IP pública',
    apiTitle: 'API web', apiDescription: 'Llama a Packetrove desde cualquier cliente HTTP. Por ejemplo, consulta tu IP pública actual con curl:',
    apiResponse: 'La respuesta contiene la dirección IP seguida de un salto de línea, con <code>Content-Type: text/plain</code>.', apiGuide: 'Leer la guía de la API',
    cliTitle: 'Interfaz de línea de comandos', cliDescription: 'Instala desde el código fuente con Node.js y pnpm:',
    cliExample: 'Después, muestra tu IP pública actual:', cliGuide: 'Leer la guía de la CLI (en inglés)',
    mcpTitle: 'Model Context Protocol (MCP)', mcpDescription: 'Conecta tu agente de IA a Packetrove mediante Streamable HTTP. No requiere autenticación ni un servidor local.',
    serverAddress: 'Dirección del servidor', mcpExample: 'Una vez instalado el cliente, añade el servidor:',
    mcpCheck: 'Usa <code>/mcp</code> en tu cliente para comprobar la conexión. La consulta de IP pública muestra la dirección de la conexión utilizada por el agente.', mcpGuide: "Leer la guía de conexión MCP",
  },
  cidr: {
    title: 'CIDR mínimo de cobertura', description: 'Combina direcciones y rangos IPv4 o IPv6 en el CIDR único más pequeño que los cubre todos.',
    local: 'Calculado en tu navegador · Sin solicitudes a la API', addresses: 'Tus direcciones', inputLabel: 'Direcciones IP o rangos CIDR',
    inputHelp: 'Separa las entradas con comas, espacios, tabulaciones o saltos de línea. Usa una sola familia de direcciones por cálculo. Hasta {{maximum}} entradas.',
    entryCount_one: '{{total}} entrada', entryCount_other: '{{total}} entradas', entryCount_many: '{{total}} entradas',
    clear: 'Borrar', example: 'Probar un ejemplo', calculate: 'Calcular el CIDR de cobertura',
    result: 'Resultado de cobertura', resultLabel: 'CIDR MÍNIMO DE COBERTURA', copy: 'Copiar CIDR',
    copySuccess: 'CIDR copiado.', copyFailure: 'No se puede usar el portapapeles. Selecciona y copia el CIDR de arriba.',
    first: 'Primera dirección', last: 'Última dirección', unique: 'Direcciones únicas de entrada', covered: 'Direcciones cubiertas', additional: 'Direcciones adicionales',
    exact: 'Cobertura exacta: este CIDR no añade direcciones.',
    expansionOne: 'Este CIDR añade {{total}} dirección. Al aplicarlo, se amplía el conjunto de direcciones permitidas o bloqueadas por tu lista.',
    expansionOther: 'Este CIDR añade {{total}} direcciones. Al aplicarlo, se amplía el conjunto de direcciones permitidas o bloqueadas por tu lista.',
    normalized: 'Entradas normalizadas ({{total}})', emptyTitle: 'Tu resultado aparecerá aquí',
    emptyDescription: 'Introduce tus direcciones para ver el CIDR que las cubre, su rango y la cobertura adicional.',
    explanationTitle: 'Entender la cobertura',
    explanation: 'El prefijo más largo posible produce el rango único de cobertura más pequeño. Este rango puede incluir direcciones que no estaban en las entradas originales. Las direcciones superpuestas se cuentan una sola vez y los CIDR con bits de host se normalizan.',
    countExplanation: 'Los recuentos incluyen todas las direcciones del rango, también las de red y difusión. Revisa la cobertura adicional antes de usar el resultado en una lista de direcciones permitidas o bloqueadas.',
    examplesTitle: 'Ejemplos de cálculo CIDR', exactExample: 'Cobertura IPv4 exacta', expandedExample: 'IPv4 con cobertura adicional', ipv6Example: 'Cobertura IPv6 exacta',
    limits: 'Introduce direcciones individuales o rangos CIDR, hasta {{maximum}} entradas. No se pueden mezclar IPv4 e IPv6 en un mismo cálculo. Los recuentos IPv6 siguen siendo exactos, incluso para rangos muy grandes.',
    exampleResult: '{{cidr}} cubre {{covered}} direcciones y añade {{additional}}.',
    line: 'Línea {{line}}: {{message}}',
    lineEntry: 'Línea {{line}}, entrada {{entry}}: {{message}}',
  },
  subtract: {
    title: 'Resta de CIDR',
    description: 'Resta las redes IPv4 o IPv6 excluidas del espacio de direcciones incluido. Obtén la lista CIDR exacta más pequeña, sin añadir direcciones.',
    inputs: 'Tus listas de direcciones',
    include: 'Incluir',
    exclude: 'Excluir',
    includeLabel: 'Direcciones IP o CIDR incluidos',
    excludeLabel: 'Direcciones IP o CIDR excluidos',
    includeHelp: 'Separa las entradas con comas, espacios, tabulaciones o saltos de línea. Incluye al menos una dirección o un rango.',
    excludeHelp: 'Separa las entradas con comas, espacios, tabulaciones o saltos de línea. Déjalo vacío para simplificar la lista incluida sin eliminar direcciones.',
    calculate: 'Restar CIDR',
    result: 'Espacio de direcciones restante',
    output: 'CIDR restantes',
    included: 'Direcciones incluidas',
    removed: 'Direcciones eliminadas',
    remaining: 'Direcciones restantes',
    blocks: 'CIDR del resultado',
    completed: 'Cálculo completado. Direcciones restantes: {{addresses}}. CIDR: {{cidrs}}.',
    copyList: 'Copiar con saltos de línea',
    copyAllowed: 'Copiar con comas',
    copySuccess: 'Copiado con saltos de línea.',
    allowedSuccess: 'Copiado con comas.',
    copyFailure: 'No se puede copiar. Selecciona y copia la lista de arriba.',
    formats: 'Con saltos de línea, cada CIDR ocupa una línea. Con comas, los CIDR se separan por una coma y un espacio.',
    emptyTitle: 'No quedan direcciones',
    emptyDescription: 'Las exclusiones eliminaron todas las direcciones incluidas. No hay ninguna lista CIDR que copiar.',
    pendingTitle: 'Tu resultado aparecerá aquí',
    pendingDescription: 'Introduce una lista incluida y exclusiones opcionales para calcular el resto exacto.',
    explanationTitle: 'Qué significa el resultado',
    explanation: 'El cálculo resta la unión de las exclusiones de la unión de los rangos incluidos. Las direcciones superpuestas se cuentan una vez, los bits de host se normalizan y no se añaden direcciones. Se cuentan todas las direcciones de un rango, incluidas las de red y broadcast.',
    review: 'Usa el resultado para las excepciones de WireGuard o para examinar los huecos tras las asignaciones conocidas. Los huecos dependen de tus datos; no demuestran que las direcciones estén sin usar en la red real. Revisa la lista antes de aplicarla.',
    limits: 'Usa una sola familia de direcciones y como máximo {{inputs}} entradas entre ambas listas, con un máximo de {{length}} caracteres por entrada. El resultado admite hasta {{outputs}} CIDR; si lo supera, se devuelve un error sin una lista parcial.',
    examplesTitle: 'Ejemplos de resta',
    example: 'Restar {{exclude}} de {{include}}:',
    line: '{{list}}, línea {{line}}: {{message}}',
    lineEntry: '{{list}}, línea {{line}}, entrada {{entry}}: {{message}}',
    listIssue: '{{list}}: {{message}}',
    outputLimitTitle: 'El resultado contiene demasiados CIDR.',
  },
  ip: {
    title: 'Mi IP pública', description: 'Consulta la dirección IP pública utilizada por tu conexión actual a Packetrove.',
    online: 'Consulta en línea · La aplicación no guarda el resultado', connection: 'Tu conexión actual', checking: 'Consultando tu IP pública…',
    resultLabel: 'DIRECCIÓN IP PÚBLICA', copy: 'Copiar IP', copySuccess: 'Dirección IP copiada.',
    copyFailure: 'No se puede usar el portapapeles. Selecciona y copia la dirección IP de arriba.', checkingButton: 'Consultando…', retry: 'Reintentar', refresh: 'Actualizar IP',
    explanationTitle: 'Qué significa esta dirección',
    explanation: 'Es la dirección que Packetrove observa en esta solicitud. Si usas una VPN o un proxy, corresponde a su dirección de salida. El navegador y las herramientas de línea de comandos pueden utilizar rutas de red diferentes.',
    familyExplanation: 'Cada conexión utiliza IPv4 o IPv6. Esta consulta muestra esa dirección; no descubre ambas familias ni tu dirección local privada. Actualiza después de cambiar de red o de configurar el proxy.',
  },
  api: {
    title: 'Documentación de la API', loading: 'Cargando la documentación de la API…', specification: 'Especificación OpenAPI',
    unavailableTitle: 'La documentación de la API no está disponible',
    unavailableDescription: 'No se pudo cargar o mostrar la documentación. Puedes volver a la calculadora conservando las entradas, el resultado o los errores de validación.',
    returnToCalculator: 'Volver a la calculadora',
    description: 'Explora los endpoints, copia ejemplos de solicitudes y prueba la API sin cuenta ni clave de API. Al enviar una solicitud, sus entradas se transmiten a la API. Las consultas de IP pública muestran la conexión del navegador.',
    englishReference: 'La referencia interactiva y la especificación están en inglés.',
    cidrSummary: 'Envía direcciones IPv4 o IPv6 y rangos CIDR como JSON. La respuesta incluye el CIDR mínimo de cobertura, las entradas normalizadas y recuentos exactos de direcciones como cadenas decimales. Esta solicitud a la API envía tus entradas al servidor.',
    cidrResponse: 'Este ejemplo devuelve {{cidr}} con {{additional}} direcciones adicionales. Revisa additionalAddressCount antes de usar el resultado en una lista de direcciones permitidas o bloqueadas.',
    ipSummary: 'Devuelve la IP pública observada para esta conexión HTTP. Solicita text/plain para obtener una dirección seguida de un salto de línea, o application/json para obtener la dirección y su familia. Las respuestas no se almacenan en caché. Una VPN o un proxy cambia la dirección de salida observada.',
    subtractSummary: "Resta exactamente la lista exclude de include. Devuelve una lista mínima de CIDR canónicos y recuentos exactos como cadenas decimales. Esta petición envía datos al servidor.",
    subtractResponse: "Este ejemplo devuelve {{cidrs}}, con {{remaining}} direcciones restantes y sin cobertura adicional.",
  },
  discovery: {
    subtract: {
      title: "Preguntas sobre la resta de CIDR",
      mcpTitle: "Usar la resta mediante MCP",
      purpose: "Pide a un agente de IA que reste las redes excluidas del espacio incluido y devuelva los CIDR restantes exactos.",
      inputs: "Envía matrices include y exclude de una sola familia. include no puede estar vacía; exclude sí. Usa como máximo {{maximumInputs}} entradas en total, con {{maximumLength}} caracteres por entrada.",
      result: "Lee cidrs y los recuentos decimales exactos includedAddressCount, removedAddressCount y remainingAddressCount. Una eliminación completa devuelve una lista vacía. Más de {{maximumOutputs}} CIDR produce un error sin una lista parcial.",
      boundary: "Las llamadas remotas API y MCP envían datos al servidor; el navegador calcula localmente. Los rangos restantes dependen de tus datos y no demuestran disponibilidad real. No se configura WireGuard ni se cambian reglas del cortafuegos.",
      openTool: "Abrir la resta en el navegador",
      questions: {
        wireguard: {
          question: "¿Cómo preparo excepciones para AllowedIPs de WireGuard?",
          answer: "Introduce los rangos del túnel en Incluir y las excepciones en Excluir. Usa Copiar con comas para copiar los CIDR restantes exactos como valor de AllowedIPs de WireGuard. Revísalo antes de aplicarlo; Packetrove no configura WireGuard ni cambia rutas."
        },
        remaining: {
          question: "¿Los rangos restantes prueban que las direcciones están libres?",
          answer: "Muestran huecos relativos a tus listas de inclusión y exclusión. La herramienta no consulta el uso real de la red ni busca subredes de un tamaño solicitado."
        },
        outside: {
          question: "¿Qué pasa con exclusiones solapadas o fuera del rango incluido?",
          answer: "Los solapamientos de cada lista se cuentan una vez. Solo se eliminan direcciones presentes en Incluir; las exclusiones externas no eliminan nada. La eliminación completa devuelve correctamente una lista CIDR vacía y cero direcciones restantes."
        },
        covering: {
          question: "¿En qué se diferencia de un CIDR de cobertura?",
          answer: "La resta conserva exactamente la unión de inclusiones menos la unión de exclusiones, incluidos los huecos. Devuelve una lista mínima ordenada de CIDR canónicos sin añadir direcciones. Un único CIDR de cobertura puede incluir direcciones adicionales."
        },
        access: {
          question: "¿Puedo usar la resta mediante MCP, la API web o la CLI?",
          answer: "La resta está disponible en la web, la API web y MCP. Los datos del navegador permanecen locales; API y MCP los envían al servidor. La CLI aún no ofrece la resta."
        }
      }
    },
    cidr: {
      title: "Preguntas sobre CIDR de cobertura",
      mcpTitle: "Usar la calculadora mediante MCP",
      purpose: "Pide a un agente de IA que calcule un CIDR de cobertura para un grupo elegido de entradas permitidas o bloqueadas del cortafuegos y explique la cobertura adicional.",
      inputs: "Acepta de 1 a {{maximumInputs}} direcciones IPv4 o IPv6 o rangos CIDR, con hasta {{maximumLength}} caracteres por entrada. Usa una sola familia por llamada.",
      result: "Consulta cidr y range para conocer la red cubierta. Revisa additionalAddressCount antes de aplicar reglas. Todos los recuentos son cadenas decimales para conservar la precisión de IPv6.",
      boundary: "Las llamadas MCP remotas envían tus datos al servidor. La calculadora web funciona localmente. Esta herramienta calcula un CIDR; elegir varias combinaciones para cumplir el límite de una lista completa requiere definir otro objetivo. No modifica reglas del cortafuegos.",
      openTool: "Abrir la calculadora web",
      questions: {
        firewall: {
          question: "¿Cómo reduzco las entradas de una lista IP del cortafuegos?",
          answer: "Combina un grupo elegido en un CIDR de cobertura. Revisa primero las direcciones adicionales: se permitirán en una lista de permitidos o se bloquearán en una lista de bloqueados."
        },
        covering: {
          question: "¿Un solo CIDR conserva exactamente las direcciones originales?",
          answer: "Solo si la unión original ocupa todo ese CIDR. En otro caso, incluso el CIDR único más pequeño añade direcciones. Packetrove muestra esa ampliación; no elige la mejor combinación de fusiones para toda la lista."
        },
        overlap: {
          question: "¿Cómo se cuentan los solapamientos y los duplicados?",
          answer: "Cada dirección de la unión original se cuenta una vez. Los CIDR con bits de host se normalizan a la dirección de red. normalizedInputs conserva las entradas repetidas, pero no aumentan los recuentos."
        },
        counts: {
          question: "¿Los recuentos de rangos IPv6 muy grandes son exactos?",
          answer: "Sí. El navegador usa enteros exactos y la API y MCP devuelven cadenas decimales. Se cuentan todas las direcciones cubiertas por las reglas, incluidas las de red y difusión de IPv4. Usa una sola familia por cálculo."
        },
        privacy: {
          question: "¿Adónde se envían mis datos de cálculo?",
          answer: "La calculadora web funciona en el navegador sin enviar datos a la API. Los borradores permanecen en la memoria de esta pestaña. La CLI local calcula sin conexión; la API web y MCP remoto envían los datos al servidor."
        }
      }
    },
    ip: {
      title: "Preguntas sobre tu IP pública",
      mcpTitle: "Consultar una conexión mediante MCP",
      purpose: "Pide a un agente de IA que consulte la IP pública observada para la conexión que realiza su llamada MCP.",
      inputs: "Envía un objeto vacío, {}. La herramienta observa la conexión de la solicitud; no acepta una dirección IP para consultar.",
      result: "El ejemplo usa una dirección de documentación. Una llamada real devuelve ip y family, con el valor ipv4 o ipv6, para esa petición.",
      boundary: "Un cliente de IA alojado puede devolver su propia IP de salida. Para consultar tu navegador, usa esta herramienta web; para la conexión de la terminal, ejecuta la CLI en ese equipo. Una llamada no descubre ambas familias, direcciones privadas ni una IP anterior al proxy. El resultado no prueba la identidad.",
      openTool: "Consultar la IP pública del navegador",
      questions: {
        address: {
          question: "¿Qué dirección IP muestra esta página?",
          answer: "La dirección pública observada para la petición actual de tu navegador a Packetrove. No es tu dirección privada local ni identifica tu dispositivo."
        },
        vpn: {
          question: "¿Qué cambia al usar una VPN o un proxy?",
          answer: "El resultado muestra la dirección de salida usada por esa conexión. Actualiza al cambiar de red, VPN o proxy. No revela la dirección anterior al proxy."
        },
        family: {
          question: "¿Una consulta descubre IPv4 e IPv6 a la vez?",
          answer: "No. Una petición observa una sola familia. Una consulta correcta no demuestra conectividad con ambas familias."
        },
        client: {
          question: "¿Por qué un agente de IA o la CLI puede mostrar otra IP?",
          answer: "Cada interfaz observa la conexión que realiza su petición. Un cliente MCP alojado puede usar otra red distinta del navegador. Ejecuta la herramienta web o la CLI en la ruta de red que quieras consultar."
        },
        privacy: {
          question: "¿Se guardan los resultados IP o se almacenan en caché?",
          answer: "La aplicación mantiene el resultado actual en memoria para mostrarlo, sin historial ni registros de direcciones. Los resultados y errores no se almacenan en caché. La plataforma de alojamiento sigue procesando la petición según su configuración."
        }
      }
    }
  },
  mcp: {
    navigation: "Guía MCP",
    sdkTitle: "Ejecutar un ejemplo de Node.js",
    sdkDescription: "En un directorio nuevo, guarda el código como <code>packetrove-example.mjs</code> y ejecuta los comandos. El ejemplo usa <code>@modelcontextprotocol/client@{{version}}</code>, descubre herramientas e invoca la herramienta CIDR con direcciones de documentación.",
    sdkLocal: "Para el desarrollo local, inicia <code>pnpm dev:api</code> y cambia la URL del servidor del ejemplo por <code>{{localUrl}}</code>.",
    httpErrors: "Los errores de negocio usan el JSON de error compartido. El SDK de MCP valida el protocolo. El HTTP rechaza JSON inválido, tipos de contenido no admitidos y cuerpos demasiado grandes.",
    deploymentTitle: "Despliegue y límites de conexión",
    serverBehavior: "El servidor admite solicitudes modernas sin estado e inicialización, descubrimiento y llamadas del transporte Streamable HTTP anterior. No ofrece sesiones persistentes ni flujos de eventos independientes del servidor.",
    connectionPrivacy: "Los metadatos de la IP pública se leen en cada llamada y las instancias del servidor se aíslan entre clientes concurrentes. Los resultados y errores MCP usan Cache-Control: no-store, no-transform. La aplicación no conserva ni registra las direcciones consultadas.",
    toolMigration: "El nombre anterior <code>get_public_ip</code> no tiene un alias compatible. Actualiza el descubrimiento de herramientas y usa <code>{{ipTool}}</code> en las llamadas guardadas.",
    endpointMigration: "La ruta <code>/mcp</code> del sitio no es el servicio: GET devuelve 404 y POST 405, sin reenviar ni redirigir llamadas. Configura los clientes con <code>{{serverUrl}}</code>. En tu despliegue, actualiza los dominios y las listas exactas separadas de Host y Origin del navegador; se admiten clientes sin cabecera Origin.",
    deploymentGuide: "Despliegue, alojamiento propio y verificación de producción",
    title: "Conectar Packetrove a un agente de IA",
    explanation: "Conecta un cliente MCP compatible para usar las herramientas de red de Packetrove. Configúralo siguiendo estos pasos y utiliza los ejemplos.",
    connection: "Streamable HTTP · Sin cuenta ni clave de API",
    connectTitle: "Conectar tu cliente",
    connectDescription: "Con Claude Code o Codex instalado, añade este servidor remoto. Los comandos configuran el cliente; no instalan un servidor Packetrove local.",
    clientGuide: "Documentación MCP de {{client}}",
    check: "Usa <code>/mcp</code> en tu cliente para comprobar la conexión. Confirma que estas herramientas estén disponibles: <code>{{tools}}</code>.",
    discovery: "Tras configurarlo, el cliente descubre las herramientas con tools/list. Las descripciones y los esquemas orientan la selección y los argumentos. Leer una página web no configura un cliente ni le concede acceso a herramientas.",
    toolName: "Nombre de la herramienta",
    arguments: "Argumentos de ejemplo",
    exampleResult: "Resultado de ejemplo con direcciones de documentación",
    errorsTitle: "Leer resultados y gestionar errores",
    results: "Lee <code>structuredContent</code> o el JSON del bloque de texto. Conserva los recuentos como cadenas decimales o enteros de precisión arbitraria; convertir grandes recuentos IPv6 a números de coma flotante pierde precisión.",
    errors: "Si <code>isError</code> es true, lee el error JSON antes de reintentar. Corrige <code>INVALID_INPUT</code> y <code>MIXED_ADDRESS_FAMILIES</code> con la información del usuario. <code>CLIENT_IP_UNAVAILABLE</code> indica que faltan metadatos fiables de conexión; no inventes una dirección.",
    technicalGuide: "Leer la guía técnica MCP del repositorio (inglés)"
  },
  errors: {
    invalidInput: 'Las entradas del cálculo no son válidas.', mixedFamilies: 'Usa solo IPv4 o solo IPv6 en cada cálculo.',
    invalidJson: 'La solicitud debe contener JSON válido.', payloadTooLarge: 'La solicitud es demasiado grande.', unsupportedMediaType: 'El tipo de contenido de la solicitud no es compatible.',
    notFound: 'El recurso solicitado no existe.', methodNotAllowed: 'Este método de solicitud no es compatible.',
    internal: 'No se pudo completar la operación. Inténtalo de nuevo.', ipUnavailable: 'No están disponibles los metadatos de la conexión. Inténtalo de nuevo.',
    network: 'No se pudo conectar con el servicio de consulta de IP. Comprueba la conexión e inténtalo de nuevo.', invalidResponse: 'El servicio de consulta de IP devolvió una respuesta no válida. Inténtalo de nuevo.',
    invalidAddress: 'Usa una dirección IPv4 o IPv6 estándar, con un prefijo CIDR válido opcional. No se admiten identificadores de zona ni ceros iniciales en IPv4.',
    emptyInputs: 'Introduce al menos una dirección IP o un rango CIDR.', tooManyInputs: 'Usa como máximo {{limit}} entradas por cálculo.',
    inputTooLong: 'Cada entrada debe tener como máximo {{limit}} caracteres.', expectedFamily: 'Usa {{family}} para coincidir con la primera entrada.',
    tooManyOutputs: 'El resultado completo supera {{limit}} CIDR. Usa menos exclusiones o rangos incluidos más pequeños. No se devuelve ningún resultado parcial.',
  },
  meta: {
    mcp: {"title": "Guía MCP de Packetrove — Herramientas CIDR e IP pública", "description": "Conecta Claude Code o Codex a Packetrove mediante MCP. Consulta argumentos, resultados CIDR exactos, límites de la conexión IP y gestión de errores sin clave de API."},
    home: { title: 'Packetrove — Calculadora CIDR y consulta de IP pública', description: 'Calcula CIDR de cobertura en tu navegador y consulta tu IP pública. Herramientas IPv4 e IPv6 de código abierto para la web, API, CLI y MCP, sin cuenta.' },
    cidr: { title: 'Calculadora de CIDR mínimo de cobertura — Packetrove', description: 'Encuentra el CIDR único más pequeño que cubre direcciones y rangos IPv4 o IPv6. Calcula en tu navegador con recuentos exactos, cobertura adicional y ejemplos.' },
    subtract: { title: 'Calculadora de resta de CIDR — Packetrove', description: 'Resta listas CIDR IPv4 o IPv6 en tu navegador. Copia una lista mínima y exacta para AllowedIPs de WireGuard o examina el espacio restante tras las asignaciones conocidas.' },
    ip: { title: '¿Cuál es mi IP? Consulta de IP pública — Packetrove', description: 'Consulta la dirección IPv4 o IPv6 pública de tu conexión actual. Entiende las direcciones de salida de VPN y proxies, sin cuenta.' },
    api: { title: 'API de Packetrove — CIDR e IP pública', description: 'Usa la API de Packetrove para calcular CIDR de cobertura y consultar IP públicas. Copia ejemplos de curl y explora la referencia OpenAPI sin clave de API.' },
    notFound: { title: 'Página no encontrada — Packetrove', description: 'Esta página de Packetrove no existe. Vuelve al inicio para usar las herramientas de red.' },
    imageAlt: 'Logotipo cúbico de Packetrove junto al nombre del proyecto y el lema en inglés Network tools for humans and agents.',
  },
} satisfies TranslationResource & { cidr: { entryCount_many: string } };
