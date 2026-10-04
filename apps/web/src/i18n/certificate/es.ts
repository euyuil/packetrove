export const certificateCopy = {
  "certificate": {
    "title": "Comprobador de certificados",
    "description": "Inspecciona certificados PEM, emisores candidatos y próximos pasos basados en evidencias.",
    "local": "Comprobación en el navegador · Certificados y resultados solo en la memoria de la página",
    "scopeTitle": "Alcance",
    "scope": "Comprueba formato, duplicados, vigencia, firmas candidatas, CA, keyCertSign y un nombre DNS opcional. No valida rutas RFC 5280 completas, confianza del cliente, revocación ni seguridad del despliegue.",
    "inputs": "Entrada de certificados",
    "samplesLabel": "Ejemplos de certificados sintéticos",
    "loadSample": "Cargar y comprobar",
    "pem": "Certificados PEM",
    "pemHelp": "Solo bloques CERTIFICATE y espacios; hasta {{maximum}} certificados y {{kib}} KiB. Se rechazan claves privadas.",
    "bytes": "{{current}} / {{maximum}} bytes",
    "hostname": "Nombre de host esperado (opcional)",
    "hostnameHelp": "Solo nombres DNS ASCII. Comprueba el DNS SAN del certificado final seleccionado, sin recurrir a Common Name.",
    "check": "Comprobar certificados",
    "result": "Resultados",
    "completed": "Comprobación terminada. Certificados: {{certificates}}. Hallazgos: {{findings}}.",
    "certificates": "Certificados",
    "verifiedLinks": "Firmas verificadas",
    "findingCount": "Hallazgos",
    "evaluation": "Hora de evaluación: {{time}} (reloj del dispositivo)",
    "selectLeaf": "Certificado final para comprobar el nombre",
    "selectPosition": "Selecciona una posición original",
    "hostnameTitle": "Nombre de host: {{hostname}}",
    "relationships": "Relaciones de emisión",
    "candidate": "Relación candidata",
    "constraints": "Restricciones del emisor",
    "constraintsFailed": "CA / Key Usage rechazado",
    "keyIdFailed": "Identificadores de clave distintos",
    "constraintsPassed": "Restricciones locales satisfechas",
    "findingsTitle": "Hallazgos y próximos pasos",
    "checking": "Analizando y verificando localmente…",
    "pending": "Introduce certificados y comprueba. Cambiar la entrada elimina el resultado anterior.",
    "details": "Detalles · Orden original",
    "explanationTitle": "Entender las comprobaciones",
    "explanation": "Los números indican posiciones originales; los índices JSON empiezan en cero. Se conservan duplicados. Los nombres candidatos se comparan de forma conservadora por su codificación. Un emisor ausente es informativo y un candidato fallido no invalida otras relaciones. Los borradores quedan en memoria al cambiar herramienta o idioma; recargar los borra.",
    "dnsRules": "DNS SAN ignora mayúsculas ASCII y el punto final del nombre. Un comodín completo en la etiqueta izquierda coincide con una sola etiqueta. Se rechazan URL, IP, puertos, comodines introducidos y nombres Unicode; convierte nombres internacionales a punycode. Common Name solo se muestra.",
    "examplesTitle": "Ejemplos sintéticos",
    "exampleNote": "Certificados públicos sintéticos. Hora documental: {{time}}. Tu comprobación usa el reloj actual del entorno.",
    "graphLabel": "Grafo de emisores; las flechas van del certificado al emisor candidato. Las posiciones originales figuran debajo.",
    "graphHelp": "Certificado → emisor candidato. Línea continua: firma y restricciones locales satisfechas. Discontinua: fallo o comprobación incompleta. Autofirmas en los detalles.",
    "noCommonName": "Sin CN",
    "ca": "Certificado CA",
    "nonCa": "Certificado no CA",
    "nextAction": "Próximo paso",
    "noFindings": "Sin hallazgos. Comprueba la confianza del cliente y el despliegue por separado.",
    "yes": "Sí",
    "no": "No",
    "notProvided": "No proporcionado",
    "originalPosition": "Posición original",
    "position": "Certificado #{{number}}, comienza en la línea {{line}}",
    "serial": "Número de serie",
    "selfSignature": "Comprobación de autofirma",
    "json": "Resultado JSON estructurado",
    "inputLine": "Línea {{line}}: {{message}}",
    "status": {
      "verified": "Verificada",
      "failed": "Fallida",
      "unsupported": "No compatible",
      "unavailable": "Incompleta"
    },
    "severity": {
      "error": "Error",
      "warning": "Advertencia",
      "info": "Información"
    },
    "hostnameStatus": {
      "matched": "DNS SAN coincide. La validez de la cadena y confianza del cliente se comprueban aparte.",
      "mismatched": "DNS SAN no coincide; revisa la evidencia.",
      "ambiguous": "Selecciona el certificado final antes de comprobar el nombre.",
      "no-leaf": "No hay certificado final no CA para comprobar el nombre."
    },
    "samples": {
      "normal": "Conjunto normal",
      "omittedRoot": "Raíz omitida",
      "missingIntermediate": "Intermedio ausente",
      "expired": "Certificado caducado",
      "future": "Certificado futuro",
      "hostnameMismatch": "Nombre incompatible",
      "multipleLeaves": "Varios certificados finales",
      "crossSigning": "Firma cruzada y orden arbitrario",
      "invalidCandidate": "Candidato del mismo nombre fallido",
      "duplicate": "Certificado duplicado"
    },
    "errors": {
      "EMPTY_INPUT": "Pega al menos un certificado PEM.",
      "INPUT_TOO_LARGE": "PEM supera 48 KiB UTF-8.",
      "INVALID_PEM": "PEM incorrecto. Solo se admiten CERTIFICATE, Base64 completo y espacios entre bloques.",
      "PRIVATE_KEY_REJECTED": "Clave privada rechazada. Elimínala e introduce solo certificados.",
      "UNSUPPORTED_PEM_BLOCK": "Bloque no compatible. Solo se admite CERTIFICATE.",
      "INVALID_CERTIFICATE": "El bloque no es un certificado DER X.509 correcto y compatible.",
      "TOO_MANY_CERTIFICATES": "Hasta 16 certificados; no se devuelven resultados parciales.",
      "INVALID_HOSTNAME": "Usa un nombre DNS ASCII sin URL, IP, puerto ni comodín; convierte Unicode a punycode.",
      "INVALID_LEAF_SELECTION": "Selecciona una posición original con un certificado no CA.",
      "CRYPTO_UNAVAILABLE": "No se completó la comprobación. Usa un navegador compatible en un contexto seguro u otra implementación.",
      "INVALID_INPUT": "Solicitud inválida. Revisa PEM, nombre y posición del certificado final.",
      "INVALID_TIME": "Hora de evaluación del entorno inválida."
    },
    "evidence": {
      "fingerprintSha256": "Huella SHA-256",
      "evaluatedAt": "Hora de evaluación",
      "notAfter": "Fin de vigencia",
      "notBefore": "Inicio de vigencia",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "Firma",
      "algorithm": "Algoritmo de firma",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints presente",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "Candidatos",
      "expectedHostname": "Nombre esperado",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "Certificado repetido en estas posiciones",
        "action": "Elimina duplicados si no son intencionados."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "Certificado caducado al evaluar",
        "action": "Renueva o sustituye el certificado y comprueba cuál se sirve realmente."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "Certificado aún no vigente",
        "action": "Comprueba el reloj del dispositivo y la fecha de activación."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "Firma verificada con su propia clave pública",
        "action": "Comprueba confianza del cliente y despliegue real por separado; esta observación no prueba ninguno."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "Autofirma fallida en certificado autoemitido",
        "action": "Inspecciona estas dos posiciones originales. Los demás candidatos se comprueban independientemente."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "Algoritmo de firma no compatible",
        "action": "Verifica con otra implementación compatible con el algoritmo. No compatible o incompleto no significa firma inválida."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "No se completó la comprobación de firma",
        "action": "Verifica con otra implementación compatible con el algoritmo. No compatible o incompleto no significa firma inválida."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "No se encontró el nombre codificado del emisor",
        "action": "Si el servidor sirve realmente este conjunto, revisa full-chain. Las raíces suelen omitirse; la ausencia por sí sola no prueba una cadena defectuosa."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "Firma del emisor candidato fallida",
        "action": "Inspecciona estas dos posiciones originales. Los demás candidatos se comprueban independientemente."
      },
      "ISSUER_NOT_CA": {
        "title": "El emisor candidato no declara CA=true",
        "action": "Confirma la CA emisora prevista, Key Usage e identificadores de clave; revisa alternativas."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "El emisor candidato no permite keyCertSign",
        "action": "Confirma la CA emisora prevista, Key Usage e identificadores de clave; revisa alternativas."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "Identificadores de autoridad y sujeto distintos",
        "action": "Confirma la CA emisora prevista, Key Usage e identificadores de clave; revisa alternativas."
      },
      "MULTIPLE_ISSUERS": {
        "title": "Varios candidatos cumplen restricciones locales",
        "action": "Inspecciona cada ruta candidata. La herramienta no elige una ruta de confianza autoritativa."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "Varios certificados finales requieren selección",
        "action": "Proporciona o selecciona explícitamente el certificado final no CA antes de comprobar el nombre."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "No se proporcionó certificado final no CA",
        "action": "Proporciona o selecciona explícitamente el certificado final no CA antes de comprobar el nombre."
      },
      "HOSTNAME_MATCH": {
        "title": "El nombre coincide con DNS SAN del certificado seleccionado",
        "action": "Comprueba confianza del cliente y despliegue real por separado; esta observación no prueba ninguno."
      },
      "HOSTNAME_MISMATCH": {
        "title": "El nombre no coincide con ningún DNS SAN seleccionado",
        "action": "Comprueba el nombre u obtén un certificado con el DNS SAN requerido. Common Name no sirve como alternativa."
      }
    }
  },
  "homepage": {
    "description": "Comprueba localmente firmas PEM, emisores candidatos e identidad DNS opcional.",
    "link": "Comprobar certificados"
  },
  "apiSummary": "Envía certificados PEM y un nombre DNS opcional al servidor. Recibe posiciones originales, firmas candidatas y hallazgos con evidencia y próximos pasos. Se rechazan claves privadas; el resultado no demuestra confianza del cliente.",
  "meta": {
    "title": "Comprobador de certificados — Packetrove",
    "description": "Inspecciona firmas PEM, vigencia, restricciones del emisor y DNS SAN localmente con próximos pasos. Sin subir datos ni validar toda la confianza."
  },
  "remotePrivacy": "API y MCP remoto envían IP, CIDR, extremos de rangos o certificados PEM y nombres opcionales a Packetrove. Se procesan en memoria sin base de datos ni historial. El contenido de certificados y detalles sensibles no se incluyen en registros ni telemetría de errores. No envíes claves privadas ni secretos. El cliente puede conservar resultados según sus políticas.",
  "discovery": {
    "title": "Preguntas sobre certificados",
    "mcpTitle": "Comprobar certificados mediante MCP",
    "purpose": "Pide a un cliente de IA inspeccionar certificados públicos y sugerir próximos pasos con evidencia.",
    "inputs": "Pasa pem (hasta 48 KiB UTF-8 y 16 bloques CERTIFICATE), hostname DNS ASCII y leafIndex original desde cero opcionales. Se rechazan claves privadas y otros bloques.",
    "result": "Lee certificates en orden original, relationships, leafIndexes, selectedLeafIndex, hostname, evaluatedAt y findings con code, severity, evidence y nextAction. Las comprobaciones no compatibles se distinguen de firmas fallidas.",
    "boundary": "El navegador comprueba localmente. API y MCP remoto envían certificados y nombres al servidor. No hay validación completa de rutas, confianza, revocación, sondeo ni operación CLI. El resultado no prueba seguridad de despliegue.",
    "openTool": "Abrir el comprobador en el navegador",
    "questions": {
      "trust": {
        "question": "¿Una relación verificada significa que es de confianza?",
        "answer": "Verifica una firma y restricciones locales. Almacenes de confianza, ruta completa, revocación y servicio desplegado son comprobaciones separadas."
      },
      "root": {
        "question": "¿Un emisor ausente prueba una cadena defectuosa?",
        "answer": "No. Solo describe la entrada. Los servidores suelen omitir raíces. Si este conjunto se sirve realmente, revisa full-chain y la confianza del cliente previsto."
      },
      "privacy": {
        "question": "¿Dónde se envían mis certificados?",
        "answer": "En el navegador, entradas y resultados quedan en memoria sin subir, persistir, registrar ni incluir en URL. API y MCP remoto los envían al servidor. Se rechazan claves privadas."
      }
    }
  }
} as const;
