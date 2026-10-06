export const certificateCopy = {
  "certificate": {
    "title": "Vérification de certificats",
    "description": "Inspectez les certificats PEM, les émetteurs possibles et les étapes suivantes étayées par des faits.",
    "local": "Vérification dans le navigateur · Certificats et résultats en mémoire de page uniquement",
    "scopeTitle": "Portée des vérifications",
    "scope": "Vérifie le format, les doublons, la validité, les signatures candidates, CA, keyCertSign et un nom DNS facultatif. Pas de validation complète RFC 5280, de confiance client, de révocation ou de sécurité du déploiement.",
    "inputs": "Certificats à vérifier",
    "samplesLabel": "Exemples de certificats synthétiques",
    "loadSample": "Essayer un exemple",
    "samplesHelp": "Choisissez un lot de certificats synthétiques publics pour remplir les champs. Lancez ensuite la vérification avec le bouton prévu à cet effet.",
    "closeExamples": "Fermer les exemples",
    "evidenceTitle": "Éléments observés",
    "file": {
      "status": "Importation du fichier",
      "choose": "Choisir un fichier PEM",
      "help": "Collez du texte PEM ou déposez ici un fichier de certificats. Les fichiers sont lus uniquement dans votre navigateur.",
      "reading": "Lecture du fichier…",
      "imported": "Fichier importé. Vérifiez le contenu, puis lancez la vérification du paquet.",
      "errorTitle": "Impossible d’importer le fichier",
      "errors": {
        "FILE_COUNT": "Choisissez un fichier contenant le paquet de certificats.",
        "FILE_ENCODING": "Utilisez un fichier texte UTF-8 contenant des certificats PEM.",
        "FILE_READ_FAILED": "Impossible de lire le fichier. Choisissez-le à nouveau ou collez son contenu."
      }
    },
    "pem": "Certificats PEM",
    "pemHelp": "Blocs CERTIFICATE et espaces uniquement ; au plus {{maximum}} certificats et {{kib}} KiB. Les clés privées sont refusées.",
    "bytes": "{{current}} / {{maximum}} octets",
    "hostname": "Nom d’hôte attendu (facultatif)",
    "hostnameHelp": "Noms DNS ASCII uniquement. Vérifie le DNS SAN du certificat final sélectionné, sans repli sur Common Name.",
    "check": "Vérifier les certificats",
    "result": "Résultats",
    "completed": "Vérification terminée. Certificats : {{certificates}}. Constats : {{findings}}.",
    "certificates": "Certificats",
    "verifiedLinks": "Signatures vérifiées",
    "findingCount": "Constats",
    "evaluation": "Date d’évaluation : {{time}} (horloge locale)",
    "selectLeaf": "Certificat final à examiner",
    "selectPosition": "Choisir une position d’origine",
    "hostnameTitle": "Nom d’hôte : {{hostname}}",
    "relationships": "Relations d’émission",
    "candidate": "Relation candidate",
    "constraints": "Contraintes de l’émetteur",
    "constraintsFailed": "CA / Key Usage refusé",
    "keyIdFailed": "Identifiants de clé différents",
    "constraintsPassed": "Contraintes locales satisfaites",
    "findingsTitle": "Constats et prochaines étapes",
    "checking": "Analyse et vérification locales…",
    "pending": "Saisissez les certificats puis vérifiez. Modifier la saisie efface les résultats précédents.",
    "details": "Détails · Ordre d’origine",
    "explanationTitle": "Comprendre les vérifications",
    "explanation": "Les numéros indiquent les positions d'origine ; les indices JSON commencent à zéro. Les doublons restent visibles. Les noms d'émetteur sont comparés prudemment selon leur encodage. L'absence d'émetteur pour le certificat final sélectionné produit un avertissement ; les autres absences sont informatives. L'échec d'un candidat n'invalide pas les autres liens. Les brouillons restent en mémoire lors des changements d'outil ou de langue ; recharger les efface.",
    "dnsRules": "DNS SAN ignore la casse ASCII et le point final du nom d’hôte. Le joker doit occuper tout le premier label et correspond à un seul label. URL, IP, ports, jokers saisis et noms Unicode sont refusés ; convertissez les noms internationaux en punycode. Common Name sert seulement à l’affichage.",
    "examplesTitle": "Exemples synthétiques",
    "exampleNote": "Certificats publics synthétiques. Date documentaire : {{time}}. Votre vérification utilise l’horloge actuelle de l’environnement.",
    "graphLabel": "Graphe des émetteurs ; les flèches vont du certificat vers un émetteur possible. Les positions d’origine figurent dessous.",
    "graphHelp": "Certificat → émetteur possible. Trait plein : signature et contraintes locales satisfaites. Pointillés : échec ou vérification incomplète. Autosignatures dans les détails.",
    "noCommonName": "Sans CN",
    "ca": "Certificat CA",
    "nonCa": "Certificat non CA",
    "nextAction": "Étape suivante",
    "noFindings": "Aucun constat. Vérifiez séparément la confiance client et le déploiement.",
    "yes": "Oui",
    "no": "Non",
    "notProvided": "Non fourni",
    "originalPosition": "Position d’origine",
    "position": "Certificat #{{number}}, début à la ligne {{line}}",
    "serial": "Numéro de série",
    "selfSignature": "Vérification avec sa propre clé publique",
    "json": "Résultat JSON structuré",
    "inputLine": "Ligne {{line}} : {{message}}",
    "status": {
      "verified": "Vérifiée",
      "failed": "Échec",
      "unsupported": "Non pris en charge",
      "unavailable": "Incomplète"
    },
    "severity": {
      "error": "Erreur",
      "warning": "Avertissement",
      "info": "Information"
    },
    "hostnameStatus": {
      "matched": "DNS SAN correspond. La validité de chaîne et la confiance client restent à vérifier.",
      "mismatched": "DNS SAN ne correspond pas ; consultez les faits du constat.",
      "ambiguous": "Choisissez le certificat final avant de vérifier le nom.",
      "no-leaf": "Aucun certificat final non CA pour vérifier le nom."
    },
    "samples": {
      "normal": "Ensemble normal",
      "omittedRoot": "Racine omise",
      "missingIntermediate": "Certificat intermédiaire absent",
      "expired": "Certificat expiré",
      "future": "Certificat futur",
      "hostnameMismatch": "Nom d’hôte incompatible",
      "multipleLeaves": "Plusieurs certificats finaux",
      "crossSigning": "Signature croisée et ordre quelconque",
      "invalidCandidate": "Échec d’un candidat de même nom",
      "duplicate": "Certificat dupliqué"
    },
    "errors": {
      "EMPTY_INPUT": "Saisissez ou importez au moins un certificat PEM.",
      "INPUT_TOO_LARGE": "PEM dépasse la limite UTF-8 de 48 KiB.",
      "INVALID_PEM": "PEM incorrect. Seuls CERTIFICATE, Base64 complet et espaces entre blocs sont permis.",
      "PRIVATE_KEY_REJECTED": "Clé privée refusée. Retirez-la et saisissez seulement des certificats.",
      "UNSUPPORTED_PEM_BLOCK": "Bloc non pris en charge. Seul CERTIFICATE est accepté.",
      "INVALID_CERTIFICATE": "Ce bloc n’est pas un certificat DER X.509 correct et pris en charge.",
      "TOO_MANY_CERTIFICATES": "Au plus 16 certificats ; aucun résultat partiel.",
      "INVALID_HOSTNAME": "Utilisez un nom DNS ASCII sans URL, IP, port ou joker ; convertissez Unicode en punycode.",
      "INVALID_LEAF_SELECTION": "Choisissez une position d’origine avec un certificat non CA.",
      "CRYPTO_UNAVAILABLE": "Vérification incomplète. Utilisez un navigateur compatible en contexte sécurisé ou une autre implémentation.",
      "INVALID_INPUT": "Requête invalide. Vérifiez PEM, nom d’hôte et position du certificat final.",
      "INVALID_TIME": "Date d’évaluation de l’environnement invalide."
    },
    "graphScrollHelp": "Sur un écran étroit, faites défiler le diagramme horizontalement pour lire chaque certificat.",
    "evidence": {
      "fingerprintSha256": "Empreinte SHA-256",
      "evaluatedAt": "Date d’évaluation",
      "notAfter": "Fin de validité",
      "notBefore": "Début de validité",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "Signature",
      "algorithm": "Algorithme de signature",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints présent",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "Candidats",
      "expectedHostname": "Nom d’hôte attendu",
      "dnsSubjectAlternativeNames": "DNS SAN",
      "failedSignatureCount": "Échecs de signature",
      "rejectedIssuerCount": "Rejets CA / Key Usage"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "Même certificat à ces positions",
        "action": "Supprimez les doublons involontaires."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "Certificat expiré à la date d’évaluation",
        "action": "Si ce certificat est utilisé dans le déploiement prévu, renouvelez-le ou remplacez-le. Son expiration n'invalide pas tous les chemins alternatifs ; les règles temporelles des ancres de confiance dépendent du client."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "Certificat pas encore valide",
        "action": "Vérifiez l'heure d'évaluation et la date d'activation de ce certificat. D'autres chemins peuvent rester valides ; les règles temporelles des ancres de confiance dépendent du client."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "Signature vérifiée avec sa propre clé publique",
        "action": "Vérifiez séparément la confiance client et le déploiement réel ; ce constat ne prouve ni l’un ni l’autre."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "Échec de la vérification avec sa propre clé publique",
        "action": "Vérifiez ce certificat et l'émetteur prévu avec une autre implémentation. Des noms Subject et Issuer identiques n'exigent pas une autosignature."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "Algorithme de signature non pris en charge",
        "action": "Utilisez une autre implémentation prenant en charge cet algorithme. Incomplet ou non pris en charge ne signifie pas une signature invalide."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "Vérification de signature incomplète",
        "action": "Utilisez une autre implémentation prenant en charge cet algorithme. Incomplet ou non pris en charge ne signifie pas une signature invalide."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "Aucun nom d’émetteur encodé trouvé",
        "action": "Si le serveur présente réellement cet ensemble, vérifiez sa configuration full-chain. Les racines sont généralement omises ; leur absence seule ne prouve pas une chaîne défectueuse."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "Échec de signature de l’émetteur candidat",
        "action": "Inspectez ces deux positions d’origine. Les autres candidats sont vérifiés indépendamment."
      },
      "ISSUER_NOT_CA": {
        "title": "Le candidat ne déclare pas CA=true",
        "action": "Confirmez la CA prévue, Key Usage et les identifiants de clé ; examinez les autres candidats."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "Le candidat ne permet pas keyCertSign",
        "action": "Confirmez la CA prévue, Key Usage et les identifiants de clé ; examinez les autres candidats."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "Identifiants de clé d’autorité et de sujet différents",
        "action": "Confirmez la CA prévue, Key Usage et les identifiants de clé ; examinez les autres candidats."
      },
      "MULTIPLE_ISSUERS": {
        "title": "Plusieurs candidats satisfont les contraintes locales",
        "action": "Examinez chaque chemin candidat. Cet outil ne choisit pas un chemin de confiance faisant autorité."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "Plusieurs certificats finaux nécessitent un choix",
        "action": "Sélectionnez le certificat final non-CA prévu pour examiner ses émetteurs candidats et le nom d'hôte facultatif."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "Aucun certificat final non CA fourni",
        "action": "Fournissez un certificat final non-CA pour examiner sa signature ou son nom d'hôte."
      },
      "HOSTNAME_MATCH": {
        "title": "Le nom correspond au DNS SAN sélectionné",
        "action": "Vérifiez séparément la confiance client et le déploiement réel ; ce constat ne prouve ni l’un ni l’autre."
      },
      "HOSTNAME_MISMATCH": {
        "title": "Le nom ne correspond à aucun DNS SAN sélectionné",
        "action": "Vérifiez le nom ou obtenez un certificat avec le DNS SAN requis. Common Name ne sert pas de repli."
      },
      "SELF_ISSUED_CERTIFICATE": {
        "title": "Subject et Issuer sont identiques ; un autre certificat vérifie la signature",
        "action": "Examinez les liens d'émetteur vérifiés. Il peut s'agir d'une rotation normale de clé d'AC ; des noms identiques n'exigent pas une autosignature et ne prouvent pas la confiance du client."
      },
      "LEAF_ISSUER_NOT_IN_BUNDLE": {
        "title": "L'émetteur du certificat final sélectionné manque dans cette entrée",
        "action": "Fournissez son émetteur pour vérifier la signature du certificat final sélectionné. L'acceptation dépend aussi des certificats et des paramètres de confiance du client."
      },
      "LEAF_ISSUER_CANDIDATES_REJECTED": {
        "title": "Tous les émetteurs candidats fournis pour le certificat final sélectionné sont rejetés",
        "action": "Remplacez ou corrigez les certificats d'émetteur. Cette erreur concerne les candidats de cette entrée, pas tous les chemins de confiance possibles du client."
      }
    },
    "severityHelp": "Les erreurs concernent les certificats indiqués ou les émetteurs candidats fournis pour le certificat final sélectionné. Les avertissements demandent une intervention ou signalent des vérifications incomplètes ; les informations décrivent des observations. Les niveaux ne prouvent pas la confiance du client."
  },
  "homepage": {
    "description": "Vérifiez localement signatures, émetteurs possibles et identité DNS facultative des certificats PEM.",
    "link": "Vérifier des certificats"
  },
  "apiSummary": "Envoyez les certificats PEM et un nom DNS facultatif au serveur. Recevez positions d’origine, signatures candidates, faits et prochaines étapes. Les clés privées sont refusées ; les résultats ne prouvent pas la confiance client.",
  "meta": {
    "title": "Vérification de certificats — Packetrove",
    "description": "Vérifiez localement signatures PEM, validité, contraintes et DNS SAN avec des constats exploitables. Sans envoi ni validation complète de confiance."
  },
  "remotePrivacy": "Les appels API et MCP distants envoient IP, CIDR, bornes de plage ou certificats PEM et noms d’hôte facultatifs à Packetrove. Ces entrées de calcul et de recherche sont traitées en mémoire, sans base de données ni historique de résultats. Les certificats et leurs détails sensibles sont exclus des journaux applicatifs et de la télémétrie d’erreur. N’envoyez aucune clé privée ni secret. Le client peut conserver les résultats selon ses propres règles.",
  "discovery": {
    "title": "Questions sur les certificats",
    "mcpTitle": "Vérifier des certificats via MCP",
    "purpose": "Demandez à un client IA d’inspecter des certificats publics et de proposer des étapes étayées.",
    "inputs": "Passez pem (48 KiB UTF-8 et 16 blocs CERTIFICATE maximum), un hostname DNS ASCII et un leafIndex d’origine à base zéro facultatifs. Clés privées et autres blocs refusés.",
    "result": "Lisez certificates dans l’ordre d’origine, relationships, leafIndexes, selectedLeafIndex, hostname, evaluatedAt et findings avec code, severity, evidence et nextAction. Les vérifications non prises en charge diffèrent des signatures invalides.",
    "boundary": "La vérification navigateur reste locale. API et MCP distant envoient certificats et noms au serveur. Pas de validation complète de chemin, confiance, révocation, sondage réseau ou commande CLI. Aucun résultat ne prouve la sécurité du déploiement.",
    "openTool": "Ouvrir la vérification dans le navigateur",
    "questions": {
      "trust": {
        "question": "Une relation vérifiée signifie-t-elle une chaîne fiable ?",
        "answer": "Elle vérifie une signature et des contraintes locales. Magasins de confiance, chemin complet, révocation et service déployé restent à vérifier séparément."
      },
      "root": {
        "question": "Un émetteur absent prouve-t-il une chaîne défectueuse ?",
        "answer": "Non. Cela décrit uniquement la saisie. Les serveurs omettent généralement les racines. Si cet ensemble est réellement présenté, vérifiez full-chain et la confiance client prévue."
      },
      "privacy": {
        "question": "Où vont mes certificats ?",
        "answer": "Dans le navigateur, saisies et résultats restent en mémoire sans envoi, persistance, journalisation ou URL contenant la saisie. API et MCP distant les envoient au serveur. Les clés privées sont refusées."
      }
    }
  }
} as const;
