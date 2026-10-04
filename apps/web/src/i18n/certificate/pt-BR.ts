export const certificateCopy = {
  "certificate": {
    "title": "Verificador de certificados",
    "description": "Inspecione certificados PEM, emissores candidatos e próximos passos baseados em evidências.",
    "local": "Verificação no navegador · Certificados e resultados apenas na memória da página",
    "scopeTitle": "Escopo",
    "scope": "Verifica formato, duplicatas, validade, assinaturas candidatas, CA, keyCertSign e nome DNS opcional. Não valida caminhos RFC 5280 completos, confiança do cliente, revogação ou segurança da implantação.",
    "inputs": "Entrada de certificados",
    "samplesLabel": "Exemplos de certificados sintéticos",
    "loadSample": "Carregar e verificar",
    "pem": "Certificados PEM",
    "pemHelp": "Somente blocos CERTIFICATE e espaços; até {{maximum}} certificados e {{kib}} KiB. Chaves privadas são rejeitadas.",
    "bytes": "{{current}} / {{maximum}} bytes",
    "hostname": "Nome de host esperado (opcional)",
    "hostnameHelp": "Somente nomes DNS ASCII. Verifica DNS SAN do certificado final selecionado, sem recorrer a Common Name.",
    "check": "Verificar certificados",
    "result": "Resultados",
    "completed": "Verificação concluída. Certificados: {{certificates}}. Constatações: {{findings}}.",
    "certificates": "Certificados",
    "verifiedLinks": "Assinaturas verificadas",
    "findingCount": "Constatações",
    "evaluation": "Hora da avaliação: {{time}} (relógio do dispositivo)",
    "selectLeaf": "Certificado final para o nome de host",
    "selectPosition": "Selecione uma posição original",
    "hostnameTitle": "Nome de host: {{hostname}}",
    "relationships": "Relações de emissão",
    "candidate": "Relação candidata",
    "constraints": "Restrições do emissor",
    "constraintsFailed": "CA / Key Usage rejeitado",
    "keyIdFailed": "Identificadores de chave diferentes",
    "constraintsPassed": "Restrições locais satisfeitas",
    "findingsTitle": "Constatações e próximos passos",
    "checking": "Analisando e verificando localmente…",
    "pending": "Insira certificados e verifique. Alterar a entrada limpa o resultado anterior.",
    "details": "Detalhes · Ordem original",
    "explanationTitle": "Entenda as verificações",
    "explanation": "Números indicam posições originais; índices JSON começam em zero. Duplicatas continuam visíveis. Nomes candidatos usam comparação conservadora da codificação. Emissor ausente é informativo; um candidato que falha não invalida outras relações. Rascunhos ficam na memória ao trocar ferramenta ou idioma; recarregar os apaga.",
    "dnsRules": "DNS SAN ignora maiúsculas ASCII e ponto final do nome. Um curinga completo no rótulo mais à esquerda corresponde a um único rótulo. URL, IP, portas, curingas de entrada e nomes Unicode são rejeitados; converta nomes internacionais para punycode. Common Name serve apenas para exibição.",
    "examplesTitle": "Exemplos sintéticos",
    "exampleNote": "Certificados públicos sintéticos. Hora documental: {{time}}. Sua verificação usa o relógio atual do ambiente.",
    "graphLabel": "Grafo de emissores; setas vão do certificado ao emissor candidato. Posições originais estão abaixo.",
    "graphHelp": "Certificado → emissor candidato. Linha contínua: assinatura e restrições locais satisfeitas. Tracejada: falha ou verificação incompleta. Autoassinaturas nos detalhes.",
    "noCommonName": "Sem CN",
    "ca": "Certificado CA",
    "nonCa": "Certificado não CA",
    "nextAction": "Próximo passo",
    "noFindings": "Sem constatações. Verifique confiança do cliente e implantação separadamente.",
    "yes": "Sim",
    "no": "Não",
    "notProvided": "Não fornecido",
    "originalPosition": "Posição original",
    "position": "Certificado #{{number}}, início na linha {{line}}",
    "serial": "Número de série",
    "selfSignature": "Verificação de autoassinatura",
    "json": "Resultado JSON estruturado",
    "inputLine": "Linha {{line}}: {{message}}",
    "status": {
      "verified": "Verificada",
      "failed": "Falhou",
      "unsupported": "Não compatível",
      "unavailable": "Incompleta"
    },
    "severity": {
      "error": "Erro",
      "warning": "Aviso",
      "info": "Informação"
    },
    "hostnameStatus": {
      "matched": "DNS SAN corresponde. Validade da cadeia e confiança do cliente precisam de verificações separadas.",
      "mismatched": "DNS SAN não corresponde; consulte as evidências.",
      "ambiguous": "Selecione o certificado final antes de verificar o nome.",
      "no-leaf": "Nenhum certificado final não CA para verificar o nome."
    },
    "samples": {
      "normal": "Conjunto normal",
      "omittedRoot": "Raiz omitida",
      "missingIntermediate": "Intermediário ausente",
      "expired": "Certificado expirado",
      "future": "Certificado futuro",
      "hostnameMismatch": "Nome incompatível",
      "multipleLeaves": "Vários certificados finais",
      "crossSigning": "Assinatura cruzada e ordem livre",
      "invalidCandidate": "Candidato de mesmo nome falhou",
      "duplicate": "Certificado duplicado"
    },
    "errors": {
      "EMPTY_INPUT": "Cole pelo menos um certificado PEM.",
      "INPUT_TOO_LARGE": "PEM excede o limite UTF-8 de 48 KiB.",
      "INVALID_PEM": "PEM inválido. Somente CERTIFICATE, Base64 completo e espaços entre blocos são aceitos.",
      "PRIVATE_KEY_REJECTED": "Chave privada rejeitada. Remova-a e envie somente certificados.",
      "UNSUPPORTED_PEM_BLOCK": "Bloco não compatível. Somente CERTIFICATE é aceito.",
      "INVALID_CERTIFICATE": "Este bloco não é um certificado DER X.509 correto e compatível.",
      "TOO_MANY_CERTIFICATES": "Até 16 certificados; nenhum resultado parcial.",
      "INVALID_HOSTNAME": "Use nome DNS ASCII sem URL, IP, porta ou curinga; converta Unicode em punycode.",
      "INVALID_LEAF_SELECTION": "Selecione uma posição original com certificado não CA.",
      "CRYPTO_UNAVAILABLE": "Verificação incompleta. Use navegador compatível em contexto seguro ou outra implementação.",
      "INVALID_INPUT": "Solicitação inválida. Revise PEM, nome e posição do certificado final.",
      "INVALID_TIME": "Hora de avaliação do ambiente inválida."
    },
    "evidence": {
      "fingerprintSha256": "Impressão digital SHA-256",
      "evaluatedAt": "Hora da avaliação",
      "notAfter": "Fim da validade",
      "notBefore": "Início da validade",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "Assinatura",
      "algorithm": "Algoritmo de assinatura",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints presente",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "Candidatos",
      "expectedHostname": "Nome esperado",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "Certificado repetido nestas posições",
        "action": "Remova duplicatas não intencionais."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "Certificado expirado na avaliação",
        "action": "Renove ou substitua o certificado e confira qual é realmente servido."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "Certificado ainda não válido",
        "action": "Confira o relógio do dispositivo e a data de ativação."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "Assinatura verificada com a própria chave pública",
        "action": "Verifique confiança do cliente e implantação real separadamente; essa observação não comprova nenhuma."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "Autoassinatura falhou no certificado autoemitido",
        "action": "Inspecione estas duas posições originais. Outros candidatos são verificados de forma independente."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "Algoritmo de assinatura não compatível",
        "action": "Use outra implementação compatível com o algoritmo. Incompleto ou não compatível não significa assinatura inválida."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "Verificação de assinatura incompleta",
        "action": "Use outra implementação compatível com o algoritmo. Incompleto ou não compatível não significa assinatura inválida."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "Nome codificado do emissor não encontrado",
        "action": "Se o servidor realmente serve este conjunto, confira full-chain. Raízes normalmente são omitidas; ausência por si só não prova cadeia quebrada."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "Assinatura do emissor candidato falhou",
        "action": "Inspecione estas duas posições originais. Outros candidatos são verificados de forma independente."
      },
      "ISSUER_NOT_CA": {
        "title": "Emissor candidato não declara CA=true",
        "action": "Confirme a CA prevista, Key Usage e identificadores de chave; examine alternativas."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "Emissor candidato não permite keyCertSign",
        "action": "Confirme a CA prevista, Key Usage e identificadores de chave; examine alternativas."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "Identificadores da autoridade e do sujeito diferentes",
        "action": "Confirme a CA prevista, Key Usage e identificadores de chave; examine alternativas."
      },
      "MULTIPLE_ISSUERS": {
        "title": "Vários candidatos satisfazem restrições locais",
        "action": "Inspecione cada caminho candidato. A ferramenta não escolhe um caminho de confiança autoritativo."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "Vários certificados finais exigem seleção",
        "action": "Forneça ou selecione explicitamente o certificado final não CA antes de verificar o nome."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "Nenhum certificado final não CA fornecido",
        "action": "Forneça ou selecione explicitamente o certificado final não CA antes de verificar o nome."
      },
      "HOSTNAME_MATCH": {
        "title": "Nome corresponde ao DNS SAN selecionado",
        "action": "Verifique confiança do cliente e implantação real separadamente; essa observação não comprova nenhuma."
      },
      "HOSTNAME_MISMATCH": {
        "title": "Nome não corresponde a nenhum DNS SAN selecionado",
        "action": "Confira o nome ou obtenha certificado com o DNS SAN necessário. Common Name não é alternativa."
      }
    }
  },
  "homepage": {
    "description": "Verifique localmente assinaturas PEM, emissores candidatos e identidade DNS opcional.",
    "link": "Verificar certificados"
  },
  "apiSummary": "Envie certificados PEM e nome DNS opcional ao servidor. Receba posições originais, assinaturas candidatas e constatações com evidências e próximos passos. Chaves privadas são rejeitadas; o resultado não prova confiança do cliente.",
  "meta": {
    "title": "Verificador de certificados — Packetrove",
    "description": "Inspecione assinaturas PEM, validade, restrições e DNS SAN localmente com próximos passos. Sem envio ou validação completa de confiança."
  },
  "remotePrivacy": "API e MCP remoto enviam IP, CIDR, limites de intervalos ou certificados PEM e nomes opcionais ao Packetrove. Processamento em memória, sem banco de dados ou histórico de resultados. Certificados e detalhes sensíveis ficam fora dos logs e da telemetria de erros. Não envie chaves privadas ou segredos. O cliente pode guardar resultados conforme suas políticas.",
  "discovery": {
    "title": "Perguntas sobre certificados",
    "mcpTitle": "Verificar certificados via MCP",
    "purpose": "Peça a um cliente de IA para inspecionar certificados públicos e indicar próximos passos com evidências.",
    "inputs": "Passe pem (até 48 KiB UTF-8 e 16 blocos CERTIFICATE), hostname DNS ASCII e leafIndex original a partir de zero opcionais. Chaves privadas e outros blocos são rejeitados.",
    "result": "Leia certificates na ordem original, relationships, leafIndexes, selectedLeafIndex, hostname, evaluatedAt e findings com code, severity, evidence e nextAction. Não compatível é separado de assinatura inválida.",
    "boundary": "O navegador verifica localmente. API e MCP remoto enviam certificados e nomes ao servidor. Não há validação completa de caminho, confiança, revogação, sondagem ou comando CLI. O resultado não comprova segurança da implantação.",
    "openTool": "Abrir o verificador no navegador",
    "questions": {
      "trust": {
        "question": "Uma relação verificada significa confiança?",
        "answer": "Verifica uma assinatura e restrições locais. Repositórios de confiança, caminho completo, revogação e serviço implantado precisam de verificações separadas."
      },
      "root": {
        "question": "Emissor ausente prova uma cadeia quebrada?",
        "answer": "Não. Descreve apenas a entrada. Servidores normalmente omitem raízes. Se este conjunto é realmente servido, confira full-chain e a confiança do cliente previsto."
      },
      "privacy": {
        "question": "Para onde vão os certificados?",
        "answer": "No navegador, entradas e resultados ficam em memória sem envio, persistência, logs ou dados na URL. API e MCP remoto os enviam ao servidor. Chaves privadas são rejeitadas."
      }
    }
  }
} as const;
