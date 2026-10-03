import type { TranslationResource } from '../translation-resource';

export const fr = {
  languageSuggestion: {
    title: 'Voulez-vous lire cette page en français ?',
    switch: 'Passer au français', dismiss: 'Pas maintenant',
  },
  common: {
    pageLoading: "Chargement de la page…", pageLoadFailure: "Cette page n’a pas pu être chargée. Veuillez réessayer.", retryPage: "Réessayer",
    home: 'Accueil', homeLabel: 'Accueil de Packetrove', navigation: 'Navigation principale',
    language: 'Langue', tools: 'OUTILS POUR ADRESSES IP', copied: 'Copié', dismissCopy: 'Fermer l’erreur de copie',
    tagline: 'Des outils réseau pour les utilisateurs et les agents IA',
    source: 'Voir Packetrove sur GitHub', sourceCommit: 'Voir le code du commit {{commit}} sur GitHub', sourceLicense: 'Code source : MIT',
    feedbackPrompt: 'Un problème ou une idée ? Faites-nous en part sur GitHub.', reportBug: 'Signaler un problème', requestFeature: 'Proposer une fonctionnalité',
    notFound: 'Page introuvable', notFoundDescription: 'La page demandée n’existe pas.', returnHome: 'Retour à l’accueil',
  },
  "support": {
    "title": "Assistance",
    "introduction": "Obtenez de l’aide pour le site Packetrove, la Web API, la CLI et la connexion MCP distante. Aucun compte ni clé API n’est nécessaire.",
    "contactTitle": "Contacter le responsable",
    "contactBody": "La personne qui maintient le projet lit les messages envoyés à l’adresse ci-dessous. Utilisez le courrier électronique pour les demandes privées, de confidentialité ou de sécurité. L’aide dépend du temps disponible, sans délai de réponse garanti.",
    "publicTitle": "Retours publics",
    "publicBody": "Signalez des bugs reproductibles ou proposez des fonctionnalités sur GitHub. Les signalements et pièces jointes sont publics. N’incluez pas d’identifiants, de résultats réels de recherche d’IP publique ni de données de réseau privées.",
    "detailsTitle": "Nous aider à reproduire le problème",
    "detailsBody": "Indiquez l’outil et l’interface, la version du navigateur ou du client, les étapes, le résultat attendu et le résultat obtenu ou code d’erreur. Utilisez des données fictives et retirez les informations confidentielles des journaux et captures.",
    "guidesTitle": "Guides de connexion et confidentialité",
    "guidesBody": "Les guides API et MCP expliquent la connexion et les entrées. Le guide CLI est en anglais. La politique de confidentialité décrit le traitement distant et les échanges d’assistance."
  },
  "terms": {
    "title": "Conditions d’utilisation",
    "updated": "Dernière mise à jour : 4 octobre 2026.",
    "introduction": "Ces conditions s’appliquent au site hébergé, à la Web API et au service MCP distant de Packetrove, exploités par la personne qui maintient le projet. En les utilisant, vous acceptez ces conditions.",
    "sections": {
      "use": {
        "title": "Utilisation autorisée",
        "body": "Utilisez le service légalement et uniquement avec des données que vous êtes autorisé à traiter. Respectez les limites documentées. Ne perturbez pas le service, ne contournez pas les contrôles de sécurité et n’envoyez pas d’identifiants ou de secrets comme entrées."
      },
      "results": {
        "title": "Vérifier les résultats avant utilisation",
        "body": "Vous devez vérifier les résultats avant de les appliquer à un réseau. Un CIDR englobant peut ajouter des adresses ; les plages libres calculées ne prouvent pas une disponibilité réelle. La recherche d’IP publique observe la connexion appelante, qui peut être la sortie d’un client AI. Packetrove ne configure pas les réseaux ou pare-feu."
      },
      "availability": {
        "title": "Disponibilité et responsabilité",
        "body": "Le service hébergé est fourni en l’état et selon sa disponibilité, sans garantie de disponibilité, d’exactitude ou d’adéquation. Il peut changer, être limité ou cesser. Dans la mesure permise par la loi, le responsable n’est pas tenu des pertes liées à son utilisation. Les droits et responsabilités que la loi interdit d’exclure restent applicables."
      },
      "license": {
        "title": "Licence open source",
        "body": "Le code source de Packetrove, y compris la CLI, reste disponible sous licence MIT. Ces conditions ne modifient ni les permissions ni les mentions de cette licence. Les composants tiers conservent leurs propres licences."
      },
      "privacy": {
        "title": "Confidentialité et autres services",
        "body": "La politique de confidentialité explique le traitement des données par Packetrove. Les clients AI, GitHub et les autres services que vous choisissez ont leurs propres conditions et politiques de confidentialité."
      },
      "changes": {
        "title": "Modification des conditions",
        "body": "Les révisions sont publiées ici avec une date actualisée et s’appliquent à l’utilisation ultérieure du service hébergé. Si vous n’acceptez pas une révision, cessez d’utiliser le service hébergé."
      }
    },
    "contactTitle": "Questions",
    "contactBody": "Contactez le responsable de Packetrove pour toute question sur ces conditions ou consultez la page d’assistance."
  },
  privacy: {
    "title": "Politique de confidentialité",
    "updated": "Dernière mise à jour : 4 octobre 2026.",
    "introduction": "Cette politique couvre le site web, la Web API, la CLI et le service MCP distant de Packetrove, y compris leur utilisation via des plugins d’IA. Packetrove est maintenu par Liu Yue. Aucun compte ni clé d’API n’est nécessaire.",
    "cloudflarePolicy": "Politique de confidentialité de Cloudflare",
    "sections": {
        "correspondence": {
          "title": "Correspondance d’assistance",
          "body": "Si vous nous écrivez, nous recevons votre adresse électronique, le nom éventuellement fourni et votre message. La personne qui maintient le projet utilise ces données pour répondre et suivre votre demande. Les échanges d’assistance sont généralement conservés à long terme, sans échéance fixe ; contactez-nous pour demander leur suppression. Les courriers sont stockés dans le service de messagerie. Les signalements GitHub et leur historique public sont conservés par GitHub selon ses contrôles de conservation."
        },
        "local": {
            "title": "Calculs locaux et stockage du navigateur",
            "body": "Les calculs du navigateur et les calculs hors ligne de la CLI conservent les entrées et résultats sur votre appareil. Les brouillons restent dans la mémoire de la page. Le site stocke uniquement dans sessionStorage un indicateur de suggestion de langue déjà traitée pour l’onglet courant, sans adresses ni résultats. Copier un résultat le place dans le presse-papiers du système."
        },
        "remote": {
            "title": "Entrées et résultats des outils distants",
            "body": "Les calculs via API et MCP distant envoient à Packetrove les adresses IP, CIDR ou bornes de plage fournies. Nous les traitons en mémoire pour renvoyer le résultat, sans base de données ni historique de calcul conservé. Nous ne demandons ni historique de conversation ni identifiants de compte. Le client appelant reçoit le résultat et peut le conserver selon ses propres politiques."
        },
        "connection": {
            "title": "Vérifications de l’IP publique",
            "body": "Une vérification lit les informations de connexion fournies par Cloudflare et renvoie une adresse observée. L’application ne conserve pas d’historique et ne journalise pas l’IP renvoyée. Un client d’IA hébergé peut observer sa propre adresse de sortie ; utilisez votre navigateur ou une CLI locale pour examiner la connexion de votre appareil."
        },
        "logs": {
            "title": "Journaux opérationnels de l’application",
            "body": "À la fin d’une fonction d’outil MCP, un événement opérationnel indique un nom d’événement fixe, le nom de l’outil, le succès ou l’erreur et, en cas d’échec, un code d’erreur contrôlé. Ces événements servent à compter les exécutions et à diagnostiquer les erreurs. Chaque nouvelle tentative compte séparément ; la découverte et les demandes rejetées avant la fonction sont exclues. Les échecs HTTP inattendus produisent un événement et un code fixes. Ces événements de l’application ne contiennent ni entrées, résultats, adresses IP retournées, en-têtes ni détails d’exception bruts. Nous ne créons pas de profils, ne suivons pas les utilisateurs entre sites et ne vendons ni n’utilisons les données des outils pour la publicité ou l’entraînement de modèles."
        },
        "providers": {
            "title": "Hébergement, destinataires et conservation",
            "body": "Cloudflare héberge le service et traite les requêtes, notamment les adresses de connexion, les en-têtes et les arguments des outils distants. Les journaux de plateforme peuvent ajouter des horodatages, URL, identifiants de requêtes et métadonnées techniques. Lorsqu’ils sont activés, les Workers Logs accessibles à l’opérateur restent consultables jusqu’à sept jours : actuellement trois jours avec Free, et sept jours annoncés à partir du 1er décembre 2026. Cela ne garantit pas la suppression de tous les enregistrements réseau ou de sécurité de Cloudflare en sept jours. Le traitement d’infrastructure de Cloudflare suit sa propre politique et peut avoir lieu hors de votre pays. Les responsables de Packetrove peuvent accéder aux journaux opérationnels activés pour diagnostiquer le service."
        },
        "controls": {
            "title": "Vos choix",
            "body": "Utilisez les calculs du navigateur ou de la CLI hors ligne pour éviter d’envoyer vos entrées de calcul à distance. Les vérifications d’IP publique nécessitent toujours une requête réseau. Désactivez le plugin ou supprimez la connexion MCP pour arrêter les futurs appels ; cela ne supprime pas les résultats déjà détenus par votre client d’IA. Nous ne proposons ni historique d’appels lié à un compte ni désactivation des journaux pour un appel individuel."
        },
        "contact": {
            "title": "Questions et demandes de confidentialité",
            "body": "Contactez le responsable à l’adresse ci-dessous pour les questions de confidentialité et les demandes d’accès ou de suppression applicables. Les appels n’étant pas liés à un compte, nous pourrions ne pas identifier un appel individuel. Les échanges facultatifs par courriel et GitHub restent dans ces services et utilisent leurs contrôles de conservation. Les issues GitHub publiques ne doivent contenir ni données réseau privées ni secrets. Les modifications de cette politique sont publiées sur cette page."
        }
    }
},
  footer: {
    project: 'Ressources du projet', integrations: 'Intégrations', contact: 'Contact et commentaires',
    apiDocumentation: 'Documentation de l’API', cliGuide: 'Guide CLI (en anglais)', sendEmail: 'Envoyer un e-mail',
  },
  home: {
    rangeDescription: "Convertissez des bornes IP inclusives en une liste CIDR minimale exacte. Calculez localement et copiez tous les blocs sans ajouter d’adresses.",
    rangeLink: "Ouvrir le convertisseur de plages IP",
    galleryTitle: "Découvrez les outils",
    galleryDescription: "Utilisez les flèches ou faites glisser les cartes pour voir les exemples, puis ouvrez l’outil souhaité.",
    galleryPrevious: "Outil précédent",
    galleryNext: "Outil suivant",
    galleryPosition: "{{current}} sur {{total}}",
    previewLabel: "Exemple",
    previewInputs: "Entrées d’exemple",
    ipPreview: "Adresse de documentation uniquement. Ouvrez l’outil pour vérifier votre connexion.",
    integrationsTitle: "Intégrez Packetrove à votre travail",
    apiIntroduction: "Appelez les outils depuis un client HTTP avec des contrats JSON communs.",
    cliIntroduction: "Calculez des CIDR englobants localement ou vérifiez la connexion depuis votre terminal.",
    description: 'Des outils réseau open source pour votre navigateur, votre terminal et vos agents IA. Ouvrez un outil depuis la navigation ou suivez les instructions ci-dessous pour intégrer Packetrove à votre travail.',
    openSource: 'Open source', anonymous: 'Aucun compte ni clé API nécessaire',
    cidrDescription: 'Trouvez le plus petit CIDR unique qui englobe des adresses et des plages IPv4 ou IPv6. Calculez dans votre navigateur avec des nombres d’adresses exacts et une explication claire de la couverture supplémentaire.',
    cidrLink: 'Ouvrir le calculateur CIDR',
    subtractDescription: 'Retirez les réseaux exclus de votre espace d’adresses inclus. Copiez une liste exacte de CIDR pour les exceptions WireGuard ou examinez les espaces restants après les allocations connues, sans envoyer vos entrées.',
    subtractLink: 'Ouvrir la soustraction de CIDR',
    ipDescription: 'Vérifiez l’IP publique de votre connexion. Avec un VPN ou un proxy, le résultat indique son adresse de sortie, sans révéler votre adresse locale privée.',
    ipLink: 'Vérifier mon IP publique',
    apiTitle: 'API web', apiDescription: 'Appelez Packetrove depuis n’importe quel client HTTP. Par exemple, obtenez votre IP publique actuelle avec curl :',
    apiResponse: 'La réponse contient l’adresse IP suivie d’un saut de ligne, avec <code>Content-Type: text/plain</code>.', apiGuide: 'Lire le guide de l’API',
    cliTitle: 'Interface en ligne de commande', cliDescription: 'Installez depuis le code source avec Node.js et pnpm :',
    cliExample: 'Affichez ensuite votre IP publique actuelle :', cliGuide: 'Lire le guide CLI (en anglais)',
    mcpTitle: 'Model Context Protocol (MCP)', mcpDescription: 'Connectez votre agent IA à Packetrove via Streamable HTTP. Aucune authentification ni serveur local n’est nécessaire.',
    serverAddress: 'Adresse du serveur', mcpExample: 'Une fois le client installé, ajoutez le serveur :',
    mcpCheck: 'Utilisez <code>/mcp</code> dans votre client pour vérifier la connexion. La recherche d’IP publique indique l’adresse de la connexion utilisée par l’agent.', mcpGuide: "Lire le guide de connexion MCP",
  },
  cidr: {
    title: 'CIDR englobant minimal', description: 'Regroupez des adresses et des plages IPv4 ou IPv6 dans le plus petit CIDR unique qui les englobe toutes.',
    local: 'Calculé dans votre navigateur · Aucune requête API', addresses: 'Vos adresses', inputLabel: 'Adresses IP ou plages CIDR',
    inputHelp: 'Séparez les entrées par des virgules, des espaces, des tabulations ou des sauts de ligne. Utilisez une seule famille d’adresses par calcul. Jusqu’à {{maximum}} entrées.',
    entryCount_one: '{{total}} entrée', entryCount_other: '{{total}} entrées', entryCount_many: '{{total}} entrées',
    clear: 'Effacer', example: 'Essayer un exemple', calculate: 'Calculer le CIDR englobant',
    result: 'Résultat de couverture', resultLabel: 'CIDR ENGLOBANT MINIMAL', copy: 'Copier le CIDR',
    copySuccess: 'CIDR copié.', copyFailure: 'Le presse-papiers est indisponible. Sélectionnez et copiez le CIDR ci-dessus.',
    first: 'Première adresse', last: 'Dernière adresse', unique: 'Adresses uniques en entrée', covered: 'Adresses couvertes', additional: 'Adresses supplémentaires',
    exact: 'Couverture exacte : ce CIDR n’ajoute aucune adresse.',
    expansion: 'L’application de ce CIDR élargit les adresses autorisées ou bloquées par votre liste.',
    normalized: 'Entrées normalisées ({{total}})', emptyTitle: 'Votre résultat apparaîtra ici',
    emptyDescription: 'Saisissez vos adresses pour voir le CIDR qui les englobe, sa plage d’adresses et la couverture supplémentaire.',
    explanationTitle: 'Comprendre la couverture',
    explanation: 'Le préfixe le plus long possible donne la plus petite plage unique englobant toutes les entrées. Cette plage peut inclure des adresses absentes des entrées initiales. Les adresses qui se chevauchent ne sont comptées qu’une fois et les CIDR dont les bits hôte sont non nuls sont normalisés.',
    countExplanation: 'Les nombres incluent toutes les adresses d’une plage, y compris les adresses réseau et de diffusion. Vérifiez la couverture supplémentaire avant d’utiliser le résultat dans une liste d’adresses autorisées ou bloquées.',
    examplesTitle: 'Exemples de calcul CIDR', exactExample: 'Couverture IPv4 exacte', expandedExample: 'IPv4 avec couverture supplémentaire', ipv6Example: 'Couverture IPv6 exacte',
    limits: 'Saisissez des adresses individuelles ou des plages CIDR, jusqu’à {{maximum}} entrées. IPv4 et IPv6 ne peuvent pas être mélangés dans un même calcul. Les nombres d’adresses IPv6 restent exacts, même pour de très grandes plages.',
    exampleResult: '{{cidr}} couvre {{covered}} adresses et en ajoute {{additional}}.',
    line: 'Ligne {{line}} : {{message}}',
    lineEntry: 'Ligne {{line}}, élément {{entry}} : {{message}}',
  },
  subtract: {
    normalizedInclude: "Entrées à inclure normalisées ({{total}})",
    normalizedExclude: "Entrées à exclure normalisées ({{total}})",
    normalizedHelp: "Chaque entrée est normalisée séparément. L’ordre de saisie, les entrées répétées et les plages imbriquées sont conservés.",
    noExcludedInputs: "Aucune entrée à exclure.",
    title: 'Soustraction de CIDR', description: 'Retirez les réseaux IPv4 ou IPv6 exclus de votre espace d’adresses inclus. Obtenez la plus petite liste exacte de CIDR, sans ajouter d’adresses.',
    inputs: 'Vos listes d’adresses', include: 'Inclure', exclude: 'Exclure',
    includeLabel: 'Adresses IP ou CIDR à inclure', excludeLabel: 'Adresses IP ou CIDR à exclure',
    includeHelp: 'Séparez les entrées par des virgules, des espaces, des tabulations ou des sauts de ligne. Incluez au moins une adresse ou une plage.',
    excludeHelp: 'Séparez les entrées par des virgules, des espaces, des tabulations ou des sauts de ligne. Laissez vide pour simplifier la liste incluse sans retirer d’adresses.',
    calculate: 'Soustraire les CIDR', result: 'Espace d’adresses restant', output: 'CIDR restants',
    included: 'Adresses incluses', removed: 'Adresses retirées', remaining: 'Adresses restantes', blocks: 'CIDR du résultat',
    completed: 'Calcul terminé. Adresses restantes : {{addresses}}. CIDR : {{cidrs}}.',
    copyList: 'Copier avec des sauts de ligne', copyAllowed: 'Copier avec des virgules', copySuccess: 'Copié avec des sauts de ligne.', allowedSuccess: 'Copié avec des virgules.',
    copyFailure: 'La copie est indisponible. Sélectionnez et copiez la liste ci-dessus.',
    formats: 'Un saut de ligne place chaque CIDR sur sa propre ligne. Le format avec virgules sépare les CIDR par une virgule et un espace.',
    emptyTitle: 'Aucune adresse restante', emptyDescription: 'Les exclusions ont retiré toutes les adresses incluses. Il n’y a aucune liste de CIDR à copier.',
    pendingTitle: 'Votre résultat apparaîtra ici', pendingDescription: 'Saisissez une liste à inclure et des exclusions facultatives pour calculer le reste exact.',
    explanationTitle: 'Ce que signifie le résultat',
    explanation: 'Le calcul soustrait l’union des exclusions de l’union des plages incluses. Les chevauchements ne comptent qu’une fois, les bits d’hôte sont normalisés et aucune adresse n’est ajoutée. Toutes les adresses d’une plage comptent, y compris les adresses réseau et de diffusion.',
    review: 'Utilisez le résultat pour les exceptions WireGuard ou pour examiner les espaces restants après les allocations connues. Ces espaces dépendent de vos entrées ; ils ne prouvent pas que les adresses sont inutilisées sur le réseau réel. Vérifiez la liste avant de l’appliquer.',
    limits: 'Utilisez une seule famille d’adresses et au maximum {{inputs}} entrées au total dans les deux listes, avec au maximum {{length}} caractères par entrée. Le résultat peut contenir jusqu’à {{outputs}} CIDR ; au-delà, une erreur est renvoyée sans liste partielle.',
    examplesTitle: 'Exemples de soustraction', example: 'Retirer {{exclude}} de {{include}} :',
    line: '{{list}}, ligne {{line}} : {{message}}', listIssue: '{{list}} : {{message}}',
    lineEntry: '{{list}}, ligne {{line}}, élément {{entry}} : {{message}}',
    outputLimitTitle: 'Le résultat contient trop de CIDR.',
  },
  range: {
    "title": "Plage IP en CIDR",
    "description": "Convertissez une plage IPv4 ou IPv6 inclusive en la plus petite liste CIDR exacte, sans ajouter d’adresses.",
    "inputs": "Votre plage IP",
    "start": "IP de début",
    "end": "IP de fin",
    "startHelp": "Première adresse incluse. Saisissez une adresse IPv4 ou IPv6 sans préfixe CIDR, jusqu’à 64 caractères.",
    "endHelp": "Dernière adresse incluse. Même famille, égale ou postérieure à l’IP de début, jusqu’à 64 caractères.",
    "calculate": "Convertir la plage en CIDR",
    "result": "Résultat exact de la plage",
    "output": "Liste CIDR exacte",
    "addresses": "Adresses dans la plage",
    "completed": "Calcul terminé. Adresses : {{addresses}}. CIDR : {{cidrs}}.",
    "pendingDescription": "Saisissez les deux bornes inclusives pour voir la liste CIDR exacte et le nombre d’adresses.",
    "explanation": "Les deux bornes sont incluses. Le résultat est la liste CIDR minimale triée couvrant exactement la plage, sans trous, chevauchements ni adresses supplémentaires. Un CIDR de couverture unique peut inclure des adresses extérieures. Toutes les adresses comptent, y compris les adresses réseau et de diffusion IPv4, avec des nombres exacts même pour de grandes plages IPv6.",
    "examplesTitle": "Exemples de plages IP",
    "example": "Plage inclusive : de {{start}} à {{end}}.",
    "issue": "{{field}} : {{message}}",
    "emptyEndpoint": "Saisissez une adresse IPv4 ou IPv6.",
    "invalidEndpoint": "Utilisez une adresse IPv4 ou IPv6 standard sans préfixe CIDR. Les identifiants de zone et les zéros initiaux IPv4 ne sont pas pris en charge.",
    "endpointCidr": "Saisissez une adresse IP sans préfixe CIDR.",
    "reversedRange": "L’IP de fin doit être égale ou postérieure à l’IP de début. Les bornes ne sont pas permutées automatiquement.",
    "expectedFamily": "Utilisez {{family}} comme pour l’IP de début."
  },
  ip: {
    title: 'Mon IP publique', description: 'Consultez l’adresse IP publique utilisée par votre connexion actuelle à Packetrove.',
    online: 'Vérification en ligne · Résultat non enregistré par l’application', connection: 'Votre connexion actuelle', checking: 'Vérification de votre IP publique…',
    resultLabel: 'ADRESSE IP PUBLIQUE', copy: 'Copier l’IP', copySuccess: 'Adresse IP copiée.',
    copyFailure: 'Le presse-papiers est indisponible. Sélectionnez et copiez l’adresse IP ci-dessus.', checkingButton: 'Vérification…', retry: 'Réessayer', refresh: 'Actualiser l’IP',
    explanationTitle: 'Ce que cette adresse indique',
    explanation: 'Il s’agit de l’adresse observée par Packetrove pour cette requête. Avec un VPN ou un proxy, c’est son adresse de sortie. Votre navigateur et vos outils en ligne de commande peuvent emprunter des chemins réseau différents.',
    familyExplanation: 'Une connexion utilise IPv4 ou IPv6. Cette vérification affiche cette adresse ; elle ne recherche ni les deux familles ni votre adresse locale privée. Actualisez après un changement de réseau ou de configuration du proxy.',
  },
  api: {
    examplesTitle: 'Résumés des endpoints et exemples',
    rangeSummary: "Envoyez start et end de la même famille. Les deux bornes sont incluses. Renvoie les bornes canoniques, la liste CIDR minimale exacte, le nombre de CIDR et le nombre d’adresses en chaîne décimale. Cette requête envoie les entrées au serveur.",
    rangeResponse: "Cet exemple renvoie {{cidrs}}, représentant exactement {{addresses}} adresses.",
    title: 'Documentation de l’API', loading: 'Chargement de la documentation de l’API…', specification: 'Spécification OpenAPI',
    unavailableTitle: 'La documentation de l’API est indisponible',
    unavailableDescription: 'La documentation n’a pas pu être chargée ou affichée. Vous pouvez revenir au calculateur en conservant vos entrées, le résultat ou les erreurs de validation.',
    returnToCalculator: 'Revenir au calculateur',
    description: 'Explorez les points d’accès, copiez des exemples de requêtes et essayez l’API sans compte ni clé API. L’envoi d’une requête transmet ses données à l’API. Les recherches d’IP publique indiquent la connexion de votre navigateur.',
    englishReference: 'La référence interactive et la spécification sont en anglais.',
    cidrSummary: 'Envoyez des adresses IPv4 ou IPv6 et des plages CIDR en JSON. La réponse contient le CIDR englobant minimal, les entrées normalisées et les nombres exacts d’adresses sous forme de chaînes décimales. Cette requête API envoie vos entrées au serveur.',
    cidrResponse: 'Cet exemple renvoie {{cidr}} avec {{additional}} adresses supplémentaires. Vérifiez additionalAddressCount avant d’utiliser le résultat dans une liste d’adresses autorisées ou bloquées.',
    ipSummary: 'Renvoie l’IP publique observée pour cette connexion HTTP. Demandez text/plain pour une adresse suivie d’un saut de ligne ou application/json pour une adresse et sa famille. Les réponses ne sont pas mises en cache. Un VPN ou un proxy modifie l’adresse de sortie observée.',
    subtractSummary: "Soustrayez exactement exclude de include. Renvoie une liste minimale de CIDR canoniques et des nombres d’adresses exacts sous forme de chaînes décimales. Cet appel envoie les données au serveur.",
    subtractResponse: "Cet exemple renvoie {{cidrs}}, avec {{remaining}} adresses restantes et aucune couverture supplémentaire.",
  },
  discovery: {
    range: {
      "title": "Questions sur la conversion de plages IP",
      "mcpTitle": "Convertir des plages IP via MCP",
      "purpose": "Demandez à un agent IA de représenter une plage IP inclusive par sa liste CIDR minimale exacte.",
      "inputs": "Transmettez start et end comme adresses IPv4 ou IPv6 de même famille, sans préfixes CIDR, avec {{maximumLength}} caractères maximum chacune. end doit être égale ou postérieure à start.",
      "result": "Lisez range.first et range.last canoniques, cidrs triés, cidrCount et addressCount sous forme de chaîne décimale exacte. Des bornes égales produisent /32 ou /128 ; un espace complet produit /0. Les erreurs indiquent start ou end.",
      "boundary": "Le navigateur calcule localement. L’API et le MCP distant envoient les bornes au serveur. L’outil ne vérifie pas les allocations réelles et ne modifie ni pare-feu, ni routage, ni VPN. La CLI ne propose pas cette conversion.",
      "openTool": "Ouvrir la conversion dans le navigateur",
      "questions": {
        "exact": {
          "question": "Quelle différence avec un CIDR de couverture unique ?",
          "answer": "Cette liste contient exactement la plage inclusive, sans adresses supplémentaires. Un CIDR unique peut inclure des adresses avant le début ou après la fin. Utilisez la conversion exacte pour une liste d’autorisation correspondant précisément à la plage."
        },
        "order": {
          "question": "Puis-je utiliser des bornes égales ou inversées ?",
          "answer": "Des bornes égales renvoient un CIDR d’hôte : /32 pour IPv4 ou /128 pour IPv6. Les bornes inversées sont rejetées, jamais permutées silencieusement. Les deux adresses doivent être de la même famille, sans préfixes CIDR."
        },
        "counts": {
          "question": "Quelles adresses sont comptées ?",
          "answer": "Chaque adresse entre les bornes compte, y compris les bornes et les adresses réseau et de diffusion IPv4. Les nombres restent exacts pour tout l’espace IPv6 ; les adresses ne sont pas énumérées une par une."
        },
        "privacy": {
          "question": "Où vont mes bornes ?",
          "answer": "Les calculs du navigateur restent en mémoire sur votre appareil, sans transfert, persistance, journalisation ni entrées dans les URL. La Web API et le MCP distant envoient les bornes au serveur. Cette opération existe sur le site, la Web API et le MCP."
        }
      }
    },
    subtract: {
      title: "Questions sur la soustraction de CIDR",
      mcpTitle: "Utiliser la soustraction via MCP",
      purpose: "Demandez à un agent IA de soustraire les réseaux exclus de l’espace inclus et de renvoyer les CIDR restants exacts.",
      inputs: "Passez des tableaux include et exclude d’une même famille. include ne peut pas être vide ; exclude peut l’être. Limite totale de {{maximumInputs}} entrées, avec {{maximumLength}} caractères chacune.",
      result: "Lisez cidrs et les nombres décimaux exacts includedAddressCount, removedAddressCount et remainingAddressCount. Une suppression complète renvoie une liste vide. Au-delà de {{maximumOutputs}} CIDR, une erreur est renvoyée sans liste partielle.",
      boundary: "Les appels API et MCP distants envoient les données au serveur ; le navigateur calcule localement. Les plages restantes dépendent des entrées et ne prouvent pas leur disponibilité réelle. Aucun réglage WireGuard ni règle de pare-feu n’est modifié.",
      openTool: "Ouvrir la soustraction dans le navigateur",
      questions: {
        wireguard: {
          question: "Comment préparer les exceptions AllowedIPs de WireGuard ?",
          answer: "Placez les plages souhaitées du tunnel dans Inclure et les exceptions dans Exclure. Utilisez Copier avec des virgules pour copier les CIDR restants exacts comme valeur du paramètre AllowedIPs de WireGuard. Vérifiez-la avant de l’appliquer ; Packetrove ne configure pas WireGuard et ne modifie pas les routes."
        },
        remaining: {
          question: "Les plages restantes prouvent-elles que les adresses sont inutilisées ?",
          answer: "Elles montrent des espaces libres par rapport à vos listes d’inclusion et d’exclusion. L’outil ne vérifie pas l’utilisation réelle du réseau et ne recherche pas de sous-réseaux d’une taille demandée."
        },
        outside: {
          question: "Que deviennent les exclusions qui se chevauchent ou sont hors de la plage incluse ?",
          answer: "Les chevauchements de chaque liste comptent une fois. Seules les adresses également incluses sont retirées ; les exclusions extérieures ne retirent rien. Une suppression complète réussit avec une liste CIDR vide et zéro adresse restante."
        },
        covering: {
          question: "Quelle différence avec un CIDR englobant ?",
          answer: "La soustraction conserve exactement l’union des inclusions moins l’union des exclusions, y compris les intervalles vides. Elle renvoie une liste minimale et triée de CIDR canoniques sans ajouter d’adresses. Un CIDR englobant unique peut inclure des adresses supplémentaires."
        },
        access: {
          question: "Puis-je appeler la soustraction via MCP, l’API web ou la CLI ?",
          answer: "La soustraction est disponible sur le site, via l’API web et MCP. Les données du navigateur restent locales ; API et MCP les envoient au serveur. La CLI ne propose pas encore la soustraction."
        }
      }
    },
    cidr: {
      title: "Questions sur les CIDR englobants",
      mcpTitle: "Utiliser ce calculateur via MCP",
      purpose: "Demandez à un agent IA de calculer un CIDR unique pour un groupe choisi d’entrées autorisées ou bloquées par le pare-feu et d’expliquer la couverture supplémentaire.",
      inputs: "Accepte de 1 à {{maximumInputs}} adresses IPv4 ou IPv6 ou plages CIDR, avec {{maximumLength}} caractères au maximum par entrée. Utilisez une seule famille par appel.",
      result: "Les champs cidr et range décrivent le réseau couvert. Vérifiez additionalAddressCount avant d’utiliser le résultat dans les règles du pare-feu. Tous les nombres d’adresses sont des chaînes décimales pour conserver la précision d’IPv6.",
      boundary: "Les appels MCP distants envoient vos entrées au serveur. Le calculateur web fonctionne localement. Cet outil calcule un CIDR unique ; choisir plusieurs regroupements pour respecter la limite d’une liste entière nécessite de définir un autre objectif. Il ne modifie pas les règles du pare-feu.",
      openTool: "Ouvrir le calculateur dans le navigateur",
      questions: {
        firewall: {
          question: "Comment réduire les entrées d’une liste IP de pare-feu ?",
          answer: "Regroupez les entrées choisies dans un CIDR englobant. Vérifiez d’abord les adresses supplémentaires : elles seront autorisées par une liste d’autorisation ou bloquées par une liste de blocage."
        },
        covering: {
          question: "Un CIDR unique conserve-t-il exactement les adresses d’origine ?",
          answer: "Seulement si l’union d’origine remplit tout ce CIDR. Sinon, même le plus petit CIDR unique ajoute des adresses. Packetrove montre cette extension ; il ne choisit pas la meilleure combinaison de regroupements pour une liste entière."
        },
        overlap: {
          question: "Comment les chevauchements et les doublons sont-ils comptés ?",
          answer: "Chaque adresse de l’union d’origine compte une fois. Les CIDR avec des bits hôte sont normalisés vers l’adresse réseau. normalizedInputs conserve les entrées en double, sans augmenter les nombres d’adresses."
        },
        counts: {
          question: "Les nombres d’adresses restent-ils exacts pour les grandes plages IPv6 ?",
          answer: "Oui. Le navigateur utilise des entiers exacts et l’API et MCP renvoient des chaînes décimales. Les comptes incluent toutes les adresses couvertes par les règles, y compris les adresses réseau et de diffusion IPv4. Utilisez une seule famille par calcul."
        },
        privacy: {
          question: "Où vont mes entrées de calcul ?",
          answer: "Le calculateur web fonctionne dans votre navigateur sans envoyer les entrées à l’API. Les saisies restent en mémoire dans cet onglet. La CLI locale calcule hors ligne ; l’API web et les appels MCP distants envoient les entrées au serveur."
        }
      }
    },
    ip: {
      title: "Questions sur votre IP publique",
      mcpTitle: "Examiner une connexion via MCP",
      purpose: "Demandez à un agent IA de vérifier l’IP publique observée pour la connexion qui effectue son appel MCP.",
      inputs: "Passez un objet vide, {}. L’outil observe la connexion de la requête ; il n’accepte pas une adresse IP à rechercher.",
      result: "L’exemple utilise une adresse réservée à la documentation. Un appel réel renvoie les champs ip et family, avec ipv4 ou ipv6, observés pour cette requête.",
      boundary: "Un client IA hébergé peut renvoyer sa propre adresse de sortie. Utilisez cet outil web pour vérifier la connexion du navigateur, ou la CLI sur votre ordinateur pour celle du terminal. Un appel ne découvre pas les deux familles, les adresses locales privées ni une adresse avant un proxy. Le résultat ne prouve pas une identité.",
      openTool: "Vérifier l’IP publique de mon navigateur",
      questions: {
        address: {
          question: "Quelle adresse IP cette page affiche-t-elle ?",
          answer: "L’adresse publique observée pour la requête actuelle de votre navigateur à Packetrove. Ce n’est pas votre adresse locale privée et elle n’identifie pas votre appareil."
        },
        vpn: {
          question: "Que change l’utilisation d’un VPN ou d’un proxy ?",
          answer: "Le résultat montre l’adresse de sortie de cette connexion. Actualisez après un changement de réseau, de VPN ou de proxy. Il ne révèle pas l’adresse avant le proxy."
        },
        family: {
          question: "Une vérification découvre-t-elle IPv4 et IPv6 ?",
          answer: "Non. Une requête observe une seule famille. Une vérification réussie ne démontre pas la connectivité en IPv4 et en IPv6."
        },
        client: {
          question: "Pourquoi un agent IA ou la CLI peut-il indiquer une autre IP ?",
          answer: "Chaque interface observe la connexion qui effectue sa requête. Un client MCP hébergé peut utiliser un autre réseau que votre navigateur. Lancez l’outil web ou la CLI sur le chemin réseau que vous voulez examiner."
        },
        privacy: {
          question: "Les résultats IP sont-ils enregistrés ou mis en cache ?",
          answer: "L’application garde le résultat actuel en mémoire pour l’afficher, sans historique ni journalisation des adresses. Les résultats et les erreurs ne sont pas mis en cache. La plateforme d’hébergement traite toujours la requête selon ses paramètres."
        }
      }
    }
  },
  mcp: {
    identityTitle: "Identité du serveur",
    identityExplanation: "Le serveur fournit l’identité de service suivante, avec sa version publiée. Les noms, descriptions et schémas de chaque outil sont répertoriés séparément via tools/list.",
    identityPresentation: "Les clients décident d’afficher ou non le titre, la description, le site web ou l’icône et peuvent ignorer les champs facultatifs. Une découverte réussie du protocole ne prouve pas qu’un client affiche ces informations. L’icône PNG mesure 32×32 et n’a aucune restriction de thème.",
    navigation: "Guide MCP",
    sdkTitle: "Exécuter un exemple Node.js",
    sdkDescription: "Dans un nouveau dossier, enregistre le code dans <code>packetrove-example.mjs</code>, puis exécute les commandes. L’exemple utilise <code>@modelcontextprotocol/client@{{version}}</code>, découvre les outils et appelle l’outil CIDR avec des adresses de documentation.",
    sdkLocal: "Pour le développement local, lance <code>pnpm dev:api</code> et remplace l’URL du serveur par <code>{{localUrl}}</code>.",
    httpErrors: "Les erreurs métier utilisent le JSON d’erreur partagé. Le SDK MCP valide le protocole. Les données JSON invalides, les types de contenu non pris en charge et les corps trop volumineux sont rejetés au niveau HTTP.",
    deploymentTitle: "Déploiement et limites de connexion",
    serverBehavior: "Le serveur accepte les requêtes modernes sans état ainsi que l’initialisation, la découverte et les appels de l’ancien transport Streamable HTTP. Il ne fournit ni sessions persistantes ni flux d’événements serveur autonomes.",
    operationalLogging: "Nous comptons les exécutions avec des événements opérationnels contenant le nom de l’outil, le succès ou l’erreur et un code d’erreur contrôlé. Les entrées, résultats et adresses consultées sont exclus. Cloudflare peut ajouter des métadonnées ; consultez la politique de confidentialité pour le traitement et la conservation.",
    connectionPrivacy: "Les métadonnées de l’IP publique sont lues pour chaque appel, avec des instances isolées entre clients simultanés. Les résultats et erreurs MCP utilisent Cache-Control: no-store, no-transform. L’application ne conserve ni ne journalise les adresses consultées.",
    toolMigration: "Les anciens noms n’ont pas d’alias de compatibilité : {{toolRenames}}. Actualise la découverte des outils et les appels enregistrés.",
    endpointMigration: "Le chemin <code>/mcp</code> du site n’est pas le service : GET renvoie 404 et POST 405, sans proxy ni redirection des appels. Configure les clients avec <code>{{serverUrl}}</code>. Pour ton déploiement, adapte les domaines et les listes exactes distinctes de Host et d’Origin du navigateur ; les clients sans en-tête Origin sont acceptés.",
    deploymentGuide: "Déploiement, auto-hébergement et vérification en production",
    registryGuide: "Publication dans MCP Registry et politique de versions",
    title: "Connecter Packetrove à un agent IA",
    explanation: "Connectez un client MCP compatible pour utiliser les outils réseau Packetrove. Commencez par la configuration ci-dessous, puis consultez les exemples.",
    connection: "Streamable HTTP · Aucun compte ni clé API nécessaire",
    connectTitle: "Connecter votre client",
    connectDescription: "Avec Claude Code ou Codex installé, ajoutez ce serveur distant. Ces commandes configurent le client ; elles n’installent pas de serveur Packetrove local.",
    clientGuide: "Documentation MCP de {{client}}",
    check: "Utilisez <code>/mcp</code> dans votre client pour vérifier la connexion. Confirmez la disponibilité de ces outils : <code>{{tools}}</code>.",
    discovery: "Après configuration, le client découvre les outils avec tools/list. Les descriptions et les schémas guident le choix et les arguments. Lire une page web ne configure pas un client et ne lui donne pas accès aux outils.",
    toolName: "Nom de l’outil",
    arguments: "Exemple d’arguments",
    exampleResult: "Exemple de résultat avec des adresses de documentation",
    errorsTitle: "Lire les résultats et traiter les erreurs",
    results: "Lisez <code>structuredContent</code> ou le JSON du bloc de texte. Conservez les nombres d’adresses sous forme de chaînes décimales ou d’entiers de précision arbitraire ; convertir de grands comptes IPv6 en nombres à virgule flottante perd de la précision.",
    resourceLinkLabel: "Lien facultatif vers l’outil dans les réponses réussies",
    resultLinks: "Les réponses réussies conservent le résultat dans <code>structuredContent</code> et dans le premier bloc de texte JSON, puis ajoutent un <code>resource_link</code> facultatif vers la page anglaise de l’outil. Les liens ne contiennent ni entrées ni résultats et ne restaurent pas le calcul. Chaque client décide d’afficher, d’ignorer ou d’ouvrir les liens ; leur affichage ou citation automatique n’est pas garanti. Ouvrir la page d’IP publique vérifie une nouvelle connexion du navigateur, qui peut différer de celle du client MCP. Les erreurs ne comportent pas de lien vers l’outil.",
    errors: "Si <code>isError</code> vaut true, lisez le JSON d’erreur avant de réessayer. Corrigez <code>INVALID_INPUT</code> et <code>MIXED_ADDRESS_FAMILIES</code> à partir des informations de l’utilisateur. <code>CLIENT_IP_UNAVAILABLE</code> indique l’absence de métadonnées de connexion fiables ; n’inventez pas d’adresse.",
    technicalGuide: "Lire le guide technique MCP du dépôt (en anglais)"
  },
  errors: {
    invalidInput: 'Les données du calcul sont invalides.', mixedFamilies: 'Utilisez uniquement IPv4 ou uniquement IPv6 dans un même calcul.',
    invalidJson: 'La requête doit contenir du JSON valide.', payloadTooLarge: 'La requête est trop volumineuse.', unsupportedMediaType: 'Le type de contenu de la requête n’est pas pris en charge.',
    notFound: 'La ressource demandée n’existe pas.', methodNotAllowed: 'Cette méthode de requête n’est pas prise en charge.',
    internal: 'Impossible de terminer cette opération. Veuillez réessayer.', ipUnavailable: 'Les métadonnées de connexion sont indisponibles. Veuillez réessayer.',
    network: 'Impossible de joindre le service de recherche d’IP. Vérifiez votre connexion et réessayez.', invalidResponse: 'Le service de recherche d’IP a renvoyé une réponse invalide. Veuillez réessayer.',
    invalidAddress: 'Utilisez une adresse IPv4 ou IPv6 standard, avec un préfixe CIDR valide facultatif. Les identifiants de zone et les zéros initiaux en IPv4 ne sont pas pris en charge.',
    emptyInputs: 'Saisissez au moins une adresse IP ou une plage CIDR.', tooManyInputs: 'Utilisez au maximum {{limit}} entrées par calcul.',
    inputTooLong: 'Chaque entrée doit contenir au maximum {{limit}} caractères.', expectedFamily: 'Utilisez {{family}}, comme la première entrée.',
    tooManyOutputs: 'Le résultat complet dépasse {{limit}} CIDR. Réduisez les exclusions ou les plages incluses. Aucun résultat partiel n’est renvoyé.',
  },
  meta: {
    support: {"title":"Packetrove Assistance","description":"Contactez le responsable de Packetrove, signalez des problèmes sans divulguer de données privées et trouvez les guides API, MCP, CLI et de confidentialité."},
    terms: {"title":"Packetrove Conditions d’utilisation","description":"Lisez les conditions du service hébergé Packetrove : utilisation, limites des résultats, disponibilité, confidentialité et licence MIT."},
    privacy: {"title": "Politique de confidentialité de Packetrove", "description": "Découvrez le traitement des calculs locaux, entrées distantes, adresses de connexion, journaux opérationnels et données d’hébergement de Packetrove, ainsi que leur conservation et vos choix."},
    range: {
      "title": "Convertisseur de plage IP en CIDR — Packetrove",
      "description": "Convertissez localement des bornes IPv4 ou IPv6 inclusives en une liste CIDR minimale exacte. Copiez tous les blocs et vérifiez les nombres sans couverture supplémentaire."
    },
    mcp: {"title": "Guide MCP de Packetrove", "description": "Connectez des clients IA compatibles à Packetrove via MCP. Découvrez la configuration, la découverte des outils, les arguments, les résultats structurés et les erreurs, sans clé API."},
    home: { title: 'Packetrove — Des outils réseau pour les utilisateurs et les agents IA', description: 'Des outils réseau open source pour les développeurs et les agents IA. Utilisez Packetrove sur le web ou dans vos workflows via API, CLI et MCP, sans compte.' },
    cidr: { title: 'Calculateur de CIDR englobant minimal — Packetrove', description: 'Trouvez le plus petit CIDR unique englobant des adresses et plages IPv4 ou IPv6. Calculez dans votre navigateur avec des nombres exacts, la couverture supplémentaire et des exemples.' },
    subtract: { title: 'Calculateur de soustraction de CIDR — Packetrove', description: 'Soustrayez des listes de CIDR IPv4 ou IPv6 localement dans votre navigateur. Copiez une liste minimale exacte pour AllowedIPs de WireGuard ou examinez l’espace restant après les allocations connues.' },
    ip: { title: 'Quelle est mon IP ? Recherche d’IP publique — Packetrove', description: 'Vérifiez l’adresse IPv4 ou IPv6 publique de votre connexion et comprenez les adresses de sortie des VPN et des proxies, sans compte.' },
    api: { title: 'Documentation API de Packetrove', description: 'Intégrez les outils réseau de Packetrove via une API HTTP publique. Explorez les endpoints, les exemples, les réponses structurées et OpenAPI, sans clé API.' },
    notFound: { title: 'Page introuvable — Packetrove', description: 'Cette page de Packetrove n’existe pas. Revenez à l’accueil pour utiliser les outils réseau.' },
    imageAlt: 'Logo cubique de Packetrove à côté du nom du projet et du slogan anglais Network tools for humans and agents.',
  },
} satisfies TranslationResource;
