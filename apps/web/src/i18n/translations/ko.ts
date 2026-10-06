import { certificateCopy } from '../certificate/ko';
import { feedbackCopy } from '../feedback/ko';
import type { TranslationResource } from '../translation-resource';

export const ko = {
  languageSuggestion: {
    title: '이 페이지를 한국어로 보시겠어요?',
    switch: '한국어로 전환', dismiss: '나중에',
  },
  certificate: certificateCopy.certificate,
  feedback: feedbackCopy,
  common: {
    environment: {
      development: { label: 'DEV', description: '개발 환경' },
      staging: { label: 'STAGING', description: '스테이징 환경' },
    },
    pageLoading: "페이지를 불러오는 중…", pageLoadFailure: "페이지를 불러오지 못했습니다. 다시 시도해 주세요.", retryPage: "다시 시도",
    home: '홈', homeLabel: 'Packetrove 홈', navigation: '주 탐색 메뉴',
    language: '언어', tools: 'IP 주소 도구', copied: '복사됨', dismissCopy: '복사 오류 닫기',
    tagline: '사용자와 AI 에이전트를 위한 네트워크 도구',
    source: 'GitHub에서 Packetrove 보기', sourceCommit: 'GitHub에서 커밋 {{commit}}의 소스 코드 보기', sourceLicense: '소스 코드: MIT',
    feedbackPrompt: '오류를 발견했거나 아이디어가 있나요? GitHub에서 알려 주세요.', reportBug: '오류 신고', requestFeature: '기능 제안',
    notFound: '페이지를 찾을 수 없습니다', notFoundDescription: '요청한 페이지가 존재하지 않습니다.', returnHome: '홈으로 돌아가기',
  },
  "support": {
    "title": "지원",
    "introduction": "Packetrove 웹사이트, Web API, CLI 및 원격 MCP 연결에 대한 도움을 받을 수 있습니다. 계정이나 API 키는 필요하지 않습니다.",
    "contactTitle": "관리자에게 연락하기",
    "contactBody": "개인 관리자가 아래 주소로 온 이메일을 확인합니다. 비공개 지원, 개인정보 요청 또는 보안 문제는 이메일로 연락하세요. 지원은 시간이 허용하는 범위에서 제공되며 답변 기한은 보장하지 않습니다.",
    "publicTitle": "공개 의견",
    "publicBody": "재현 가능한 오류나 기능 제안은 GitHub에 등록하세요. 게시물과 첨부 파일은 공개됩니다. 인증 정보, 실제 공인 IP 조회 결과 또는 비공개 네트워크 데이터를 포함하지 마세요.",
    "detailsTitle": "문제를 재현하는 데 필요한 정보",
    "detailsBody": "도구와 인터페이스, 브라우저나 클라이언트 버전, 실행 단계, 예상 결과와 실제 결과 또는 오류 코드를 알려주세요. 가상의 예제 입력을 사용하고 로그와 화면에서 기밀 정보를 제거하세요.",
    "guidesTitle": "연결 가이드와 개인정보",
    "guidesBody": "API 및 MCP 가이드에서 연결 방법과 입력 조건을 확인할 수 있습니다. CLI 가이드는 영어로 제공됩니다. 개인정보 처리방침은 원격 처리와 지원 메시지의 처리 방식을 설명합니다."
  },
  "terms": {
    "title": "서비스 이용약관",
    "updated": "최종 업데이트: 2026년 10월 4일.",
    "introduction": "이 약관은 개인 관리자가 운영하는 Packetrove 호스팅 웹사이트, Web API 및 원격 MCP 서비스에 적용됩니다. 이 서비스를 이용하면 이 약관에 동의하는 것으로 봅니다.",
    "sections": {
      "use": {
        "title": "허용되는 이용",
        "body": "서비스를 적법하게 이용하고 처리 권한이 있는 데이터만 사용하세요. 문서에 명시된 입력 제한을 지키세요. 서비스를 방해하거나 보안 조치를 우회하거나 인증 정보와 비밀 정보를 도구 입력으로 보내지 마세요."
      },
      "results": {
        "title": "사용 전 결과 확인",
        "body": "네트워크에 적용하기 전에 결과를 확인할 책임은 이용자에게 있습니다. 포함 CIDR은 주소를 추가할 수 있으며 계산된 빈 범위가 실제 사용 가능성을 입증하지는 않습니다. 공인 IP 조회는 호출 연결을 관찰하므로 AI 클라이언트의 출구 주소일 수 있습니다. Packetrove는 네트워크나 방화벽 규칙을 설정하지 않습니다."
      },
      "availability": {
        "title": "가용성과 책임",
        "body": "호스팅 서비스는 현재 상태와 이용 가능한 범위에서 제공되며 가용성, 정확성 또는 적합성을 보장하지 않습니다. 서비스는 변경, 제한 또는 중단될 수 있습니다. 법이 허용하는 범위에서 관리자는 이용으로 인한 손실에 책임을 지지 않습니다. 관련 법이 배제를 허용하지 않는 권리와 책임은 이 약관으로 배제되지 않습니다."
      },
      "license": {
        "title": "오픈 소스 라이선스",
        "body": "CLI를 포함한 Packetrove 소스 코드는 계속 MIT 라이선스로 제공됩니다. 이 약관은 해당 라이선스의 허용 사항이나 고지를 변경하지 않습니다. 타사 구성 요소에는 각각의 라이선스가 유지됩니다."
      },
      "privacy": {
        "title": "개인정보와 다른 서비스",
        "body": "개인정보 처리방침은 Packetrove의 데이터 처리를 설명합니다. 이용자가 선택한 AI 클라이언트, GitHub 및 다른 서비스에는 각각의 약관과 개인정보 처리방침이 적용됩니다."
      },
      "changes": {
        "title": "약관 변경",
        "body": "변경 사항은 업데이트 날짜와 함께 이 페이지에 게시되며 이후의 호스팅 서비스 이용에 적용됩니다. 변경에 동의하지 않으면 호스팅 서비스 이용을 중단하세요."
      }
    },
    "contactTitle": "문의",
    "contactBody": "이 약관에 대한 문의는 Packetrove 관리자에게 연락하세요. 사용 방법은 지원 페이지에서 확인할 수 있습니다."
  },
  privacy: {
    "title": "개인정보 처리방침",
    "updated": "최종 업데이트: 2026년 10월 5일.",
    "introduction": "이 방침은 AI 플러그인을 통한 사용을 포함하여 Packetrove 웹사이트, Web API, CLI 및 원격 MCP 서비스에 적용됩니다. Packetrove는 Liu Yue가 관리합니다. 계정이나 API 키가 필요하지 않습니다.",
    "cloudflarePolicy": "Cloudflare 개인정보 처리방침",
    "sections": {
        "correspondence": {
          "title": "지원 메시지",
          "body": "이메일을 보내면 이메일 주소, 제공한 이름 및 메시지를 받습니다. 개인 관리자는 이를 답변과 후속 처리에 사용합니다. 지원 메시지는 일반적으로 고정된 만료 기한 없이 장기간 보관하며, 삭제를 원하면 연락할 수 있습니다. 이메일은 메일 서비스에 보관됩니다. GitHub 문제와 공개 기록은 GitHub에 보관되며 해당 서비스의 보관 관리 방식을 따릅니다."
        },
        "local": {
            "title": "로컬 계산과 브라우저 저장소",
            "body": "브라우저 계산과 오프라인 CLI 계산의 입력 및 결과는 기기에 남습니다. 계산 초안은 페이지 메모리에 유지됩니다. 웹사이트는 현재 탭의 sessionStorage에 언어 제안을 처리했다는 표시만 저장하며, 주소나 결과는 저장하지 않습니다. 결과를 복사하면 시스템 클립보드에 들어갑니다."
        },
        "feedback": {
            "title": feedbackCopy.privacyTitle,
            "body": feedbackCopy.privacyBody
        },
        "remote": {
            "title": "원격 도구 입력과 결과",
            "body": certificateCopy.remotePrivacy
        },
        "connection": {
            "title": "공인 IP 조회",
            "body": "공인 IP 조회는 Cloudflare가 제공하는 연결 정보를 읽고 관찰된 주소 하나를 반환합니다. 애플리케이션은 조회 기록을 보관하거나 반환된 IP를 로그에 기록하지 않습니다. 클라우드 AI 클라이언트는 자신의 출구 주소를 관찰할 수 있습니다. 기기의 연결은 해당 기기의 브라우저나 로컬 CLI로 확인하세요."
        },
        "logs": {
            "title": "애플리케이션 운영 로그",
            "body": "MCP 도구 콜백이 끝나면 고정 이벤트 이름, 도구 이름, 성공 또는 오류 상태와 실패 시 제어된 오류 코드를 포함하는 운영 이벤트가 생성됩니다. 이 이벤트로 실행 횟수를 집계하고 오류를 진단합니다. 재시도는 각각 집계하며 도구 검색과 콜백 전에 거부된 요청은 포함하지 않습니다. 예기치 않은 HTTP 오류는 고정 이벤트 이름과 오류 코드를 생성합니다. 애플리케이션이 생성하는 이 이벤트에는 입력, 결과, 반환된 IP 주소, 원시 요청 헤더, 자동 검사 토큰 또는 원래 예외의 상세 정보가 포함되지 않습니다. 사용자 프로필 생성, 사이트 간 추적, 도구 데이터 판매, 광고 활용 또는 모델 학습 활용은 하지 않습니다. 이벤트는 검증된 자동 검사와 그 밖의 공개 호출을 구분합니다. 검증된 검사에는 유효한 형식의 자동 검사 실행 식별자가 기록될 수도 있습니다."
        },
        "providers": {
            "title": "호스팅, 수신자 및 보관 기간",
            "body": "Cloudflare는 서비스를 호스팅하고 연결 주소, 헤더 및 원격 도구 인수를 포함한 요청을 처리합니다. 플랫폼 로그에는 시간, URL, 요청 식별자 및 기술 메타데이터가 추가될 수 있습니다. 활성화된 운영자용 Workers Logs는 최대 7일 동안 조회할 수 있습니다. 현재 Free에서는 3일이며, 2026년 12월 1일부터 7일로 변경된다고 발표되었습니다. 이는 Cloudflare의 모든 네트워크 또는 보안 기록이 7일 이내에 삭제된다는 약속이 아닙니다. Cloudflare 인프라 처리는 자체 방침을 따르며 거주 국가 밖에서 이루어질 수 있습니다. Packetrove 관리자는 서비스 진단을 위해 활성화된 운영 로그에 접근할 수 있습니다."
        },
        "controls": {
            "title": "사용자의 선택",
            "body": "계산 입력을 원격으로 보내지 않으려면 브라우저 계산이나 오프라인 CLI 계산을 사용하세요. 공인 IP 조회에는 여전히 네트워크 요청이 필요합니다. 플러그인을 비활성화하거나 MCP 연결을 제거하면 이후 호출을 중지할 수 있지만 AI 클라이언트가 이미 보관한 결과는 삭제되지 않습니다. 계정에 연결된 호출 기록이나 호출별 로그 수집 거부 기능은 제공하지 않습니다."
        },
        "contact": {
            "title": "개인정보 문의 및 요청",
            "body": "개인정보 관련 질문과 적용 가능한 접근 또는 삭제 요청은 아래 이메일로 관리자에게 문의하세요. 도구 호출은 계정에 연결되지 않으므로 개별 호출을 식별하지 못할 수 있습니다. 선택적인 이메일 및 GitHub 소통은 해당 서비스에 남으며 각 서비스의 보관 제어를 따릅니다. 공개 GitHub issue에 비공개 네트워크 데이터나 비밀 정보를 포함하지 마세요. 이 방침의 변경 사항은 이 페이지에 게시합니다."
        }
    }
},
  footer: {
    project: '프로젝트 자료', integrations: '연동', contact: '문의 및 의견',
    apiDocumentation: 'API 문서', cliGuide: 'CLI 안내 (영어)', sendEmail: '이메일 보내기',
  },
  home: {
    certificateDescription: certificateCopy.homepage.description, certificateLink: certificateCopy.homepage.link,
    rangeDescription: "양 끝을 포함하는 시작 및 끝 IP를 최소의 정확한 CIDR 목록으로 변환하세요. 로컬에서 계산하고 추가 주소 없이 모든 블록을 복사합니다.",
    rangeLink: "IP 범위 변환 열기",
    galleryTitle: "도구 둘러보기",
    galleryDescription: "좌우 화살표를 누르거나 카드를 스와이프해 예제를 살펴본 다음 필요한 도구를 여세요.",
    galleryPrevious: "이전 도구",
    galleryNext: "다음 도구",
    galleryPosition: "{{total}}개 중 {{current}}번째",
    previewLabel: "예제",
    previewInputs: "예제 입력",
    ipPreview: "문서용 주소입니다. 연결을 확인하려면 도구를 여세요.",
    integrationsTitle: "작업 흐름에 Packetrove 연결하기",
    apiIntroduction: "공통 JSON 계약을 사용해 HTTP 클라이언트에서 도구를 호출하세요.",
    cliIntroduction: "터미널에서 포함 CIDR을 로컬로 계산하거나 연결을 확인하세요.",
    description: '브라우저, 터미널, AI 에이전트에서 사용할 수 있는 오픈 소스 네트워크 도구입니다. 탐색 메뉴에서 도구를 열거나 아래 안내에 따라 Packetrove를 작업 흐름에 연결하세요.',
    openSource: '오픈 소스', anonymous: '계정이나 API 키가 필요 없습니다',
    cidrDescription: 'IPv4 또는 IPv6 주소와 범위를 모두 포함하는 가장 작은 단일 CIDR을 찾으세요. 브라우저에서 계산하며 정확한 주소 수와 추가로 포함되는 범위에 대한 설명을 제공합니다.',
    cidrLink: 'CIDR 계산기 열기',
    subtractDescription: '포함할 주소 공간에서 제외할 네트워크를 빼세요. 입력을 업로드하지 않고 WireGuard 예외 설정에 사용할 정확한 CIDR 목록을 복사하거나 알려진 할당을 제외한 나머지 공간을 확인할 수 있습니다.',
    subtractLink: 'CIDR 빼기 도구 열기',
    ipDescription: '현재 연결의 공인 IP를 확인하세요. VPN이나 프록시를 사용하면 해당 출구 주소가 표시되며 로컬 사설 주소는 표시되지 않습니다.',
    ipLink: '내 공인 IP 확인',
    apiTitle: '웹 API', apiDescription: '모든 HTTP 클라이언트에서 Packetrove를 호출할 수 있습니다. 예를 들어 curl로 현재 공인 IP를 조회하세요:',
    apiResponse: '응답에는 IP 주소와 줄 바꿈이 포함되며 <code>Content-Type: text/plain</code> 형식으로 반환됩니다.', apiGuide: 'API 가이드 읽기',
    cliTitle: '명령줄 인터페이스', cliDescription: 'Node.js와 pnpm으로 소스 코드에서 설치하세요:',
    cliExample: '그런 다음 현재 공인 IP를 출력하세요:', cliGuide: 'CLI 가이드 읽기 (영어)',
    mcpTitle: 'Model Context Protocol (MCP)', mcpDescription: 'Streamable HTTP로 AI 에이전트를 Packetrove에 연결하세요. 인증이나 로컬 서버가 필요 없습니다.',
    serverAddress: '서버 주소', mcpExample: '클라이언트를 설치한 후 서버를 추가하세요:',
    mcpCheck: '클라이언트에서 <code>/mcp</code>로 연결을 확인하세요. 공인 IP 조회 결과는 에이전트가 사용하는 연결의 주소입니다.', mcpGuide: 'MCP 연결 가이드 읽기',
  },
  cidr: {
    title: '최소 포괄 CIDR', description: 'IPv4 또는 IPv6 주소와 범위를 모두 포함하는 가장 작은 단일 CIDR로 합치세요.',
    local: '브라우저에서 계산 · API 요청 없음', addresses: '입력 주소', inputLabel: 'IP 주소 또는 CIDR 범위',
    inputHelp: '쉼표, 공백, 탭 또는 줄 바꿈으로 항목을 구분하세요. 한 번의 계산에는 한 종류의 주소 체계만 사용하세요. 최대 {{maximum}}개 항목을 입력할 수 있습니다.',
    entryCount_other: '{{total}}개 항목', clear: '지우기', example: '예제 사용', calculate: '포괄 CIDR 계산',
    result: '포함 범위 결과', resultLabel: '최소 포괄 CIDR', copy: 'CIDR 복사',
    copySuccess: 'CIDR을 복사했습니다.', copyFailure: '클립보드를 사용할 수 없습니다. 위의 CIDR을 선택하여 복사하세요.',
    first: '첫 번째 주소', last: '마지막 주소', unique: '중복을 제외한 입력 주소 수', covered: '포함된 주소 수', additional: '추가 주소 수',
    exact: '정확한 범위: 이 CIDR은 주소를 추가하지 않습니다.',
    expansion: '이 CIDR을 적용하면 목록에서 허용하거나 차단하는 주소 범위가 넓어집니다.',
    normalized: '정규화된 입력 ({{total}})', emptyTitle: '결과가 여기에 표시됩니다',
    emptyDescription: '주소를 입력하면 모든 입력을 포함하는 CIDR, 주소 범위, 추가로 포함되는 범위를 확인할 수 있습니다.',
    explanationTitle: '포함 범위 이해하기',
    explanation: '가능한 가장 긴 접두사가 모든 입력을 포함하는 가장 작은 단일 범위를 만듭니다. 이 범위에는 원래 입력에 없던 주소가 포함될 수 있습니다. 겹치는 주소는 한 번만 세며 호스트 비트가 0이 아닌 CIDR은 네트워크 주소로 정규화합니다.',
    countExplanation: '주소 수에는 네트워크 주소와 브로드캐스트 주소를 포함한 범위 내 모든 주소가 포함됩니다. 허용 목록이나 차단 목록에 결과를 사용하기 전에 추가로 포함되는 범위를 확인하세요.',
    examplesTitle: 'CIDR 계산 예제', exactExample: '정확한 IPv4 범위', expandedExample: '추가 주소가 포함된 IPv4', ipv6Example: '정확한 IPv6 범위',
    limits: '개별 주소 또는 CIDR 범위를 최대 {{maximum}}개 항목까지 입력하세요. 한 번의 계산에서 IPv4와 IPv6를 섞을 수 없습니다. 매우 큰 범위에서도 IPv6 주소 수는 정확하게 유지됩니다.',
    exampleResult: '{{cidr}}은 주소 {{covered}}개를 포함하며 {{additional}}개를 추가합니다.',
    line: '{{line}}행: {{message}}',
    lineEntry: '{{line}}행, {{entry}}번째 항목: {{message}}',
  },
  subtract: {
    normalizedInclude: "정규화된 포함 입력 ({{total}})",
    normalizedExclude: "정규화된 제외 입력 ({{total}})",
    normalizedHelp: "각 항목을 개별적으로 정규화합니다. 입력 순서, 중복 항목, 중첩 범위가 유지됩니다.",
    noExcludedInputs: "제외 입력이 없습니다.",
    title: 'CIDR 빼기', description: '포함할 주소 공간에서 제외할 IPv4 또는 IPv6 네트워크를 빼세요. 추가 주소 없이 정확한 범위를 나타내는 최소 CIDR 목록을 얻을 수 있습니다.',
    inputs: '주소 목록', include: '포함', exclude: '제외',
    includeLabel: '포함할 IP 주소 또는 CIDR', excludeLabel: '제외할 IP 주소 또는 CIDR',
    includeHelp: '쉼표, 공백, 탭 또는 줄 바꿈으로 항목을 구분하세요. 주소 또는 범위를 하나 이상 포함하세요.',
    excludeHelp: '쉼표, 공백, 탭 또는 줄 바꿈으로 항목을 구분하세요. 비워 두면 주소를 제거하지 않고 포함 목록을 간소화합니다.',
    calculate: 'CIDR 빼기 계산', result: '남은 주소 공간', output: '남은 CIDR',
    included: '포함된 주소 수', removed: '제거된 주소 수', remaining: '남은 주소 수', blocks: '결과 CIDR 수',
    completed: '계산이 완료되었습니다. 남은 주소 수: {{addresses}}. CIDR 수: {{cidrs}}.',
    copyList: '줄 바꿈으로 구분해 복사', copyAllowed: '쉼표로 구분해 복사', copySuccess: '줄 바꿈으로 구분하여 복사했습니다.', allowedSuccess: '쉼표로 구분하여 복사했습니다.',
    copyFailure: '클립보드를 사용할 수 없습니다. 위의 목록을 선택하여 복사하세요.',
    formats: '줄 바꿈으로 구분하면 각 CIDR이 한 줄에 표시됩니다. 쉼표로 구분하면 CIDR 사이에 쉼표와 공백 한 칸을 넣습니다.',
    emptyTitle: '남은 주소가 없습니다', emptyDescription: '제외 목록이 포함된 모든 주소를 제거했습니다. 복사할 CIDR 목록이 없습니다.',
    pendingTitle: '결과가 여기에 표시됩니다', pendingDescription: '포함 목록과 선택적인 제외 목록을 입력하여 정확한 나머지 범위를 계산하세요.',
    explanationTitle: '결과의 의미',
    explanation: '포함 범위의 합집합에서 제외 범위의 합집합을 뺍니다. 겹치는 주소는 한 번만 세며 호스트 비트는 정규화하고 주소를 추가하지 않습니다. 네트워크 주소와 브로드캐스트 주소를 포함한 범위 내 모든 주소를 셉니다.',
    review: '결과를 WireGuard 예외 설정에 사용하거나 알려진 할당을 제외한 나머지 공간을 확인하세요. 남은 공간은 입력을 기준으로 하며 실제 네트워크에서 주소가 사용되지 않는다는 뜻은 아닙니다. 적용하기 전에 목록을 확인하세요.',
    limits: '한 종류의 주소 체계를 사용하고 두 목록을 합쳐 최대 {{inputs}}개 항목, 항목당 최대 {{length}}자를 입력하세요. 결과는 최대 {{outputs}}개의 CIDR을 포함할 수 있으며 이를 초과하면 부분 목록 없이 오류를 반환합니다.',
    examplesTitle: '빼기 계산 예제', example: '{{include}}에서 {{exclude}} 빼기:',
    line: '{{list}}, {{line}}행: {{message}}', listIssue: '{{list}}: {{message}}',
    lineEntry: '{{list}}, {{line}}행, {{entry}}번째 항목: {{message}}',
    outputLimitTitle: '결과에 CIDR이 너무 많습니다.',
  },
  range: {
    "title": "IP 범위를 CIDR로 변환",
    "description": "양 끝을 포함한 IPv4 또는 IPv6 범위를 추가 주소 없이 가장 작은 정확한 CIDR 목록으로 변환합니다.",
    "inputs": "IP 주소 범위",
    "start": "시작 IP",
    "end": "끝 IP",
    "startHelp": "처음 포함할 주소입니다. CIDR 접두사 없는 IPv4 또는 IPv6 주소 하나를 최대 64자로 입력하세요.",
    "endHelp": "마지막으로 포함할 주소입니다. 시작 IP와 같은 주소 체계이며 시작 IP 이상인 주소를 최대 64자로 입력하세요.",
    "calculate": "범위를 CIDR로 변환",
    "result": "정확한 범위 결과",
    "output": "정확한 CIDR 목록",
    "addresses": "범위의 주소 수",
    "completed": "계산 완료. 주소: {{addresses}}. CIDR: {{cidrs}}.",
    "pendingDescription": "양 끝 주소를 입력하면 정확한 CIDR 목록과 주소 수가 표시됩니다.",
    "explanation": "양 끝 주소를 모두 포함합니다. 결과는 해당 범위만 정확히 덮는 최소 CIDR 목록이며 네트워크 주소순으로 정렬되고 빈틈, 중복, 추가 주소가 없습니다. 단일 포함 CIDR은 범위 밖 주소를 포함할 수 있습니다. IPv4 네트워크 및 브로드캐스트 주소도 계산하며 큰 IPv6 범위에서도 수는 정확합니다.",
    "examplesTitle": "IP 범위 예제",
    "example": "양 끝을 포함하는 범위: {{start}}부터 {{end}}까지.",
    "issue": "{{field}}: {{message}}",
    "emptyEndpoint": "IPv4 또는 IPv6 주소 하나를 입력하세요.",
    "invalidEndpoint": "CIDR 접두사 없는 표준 IPv4 또는 IPv6 주소를 사용하세요. 영역 식별자와 IPv4 앞자리 0은 지원하지 않습니다.",
    "endpointCidr": "CIDR 접두사 없는 IP 주소를 입력하세요.",
    "reversedRange": "끝 IP는 시작 IP 이상이어야 합니다. 양 끝은 자동으로 바뀌지 않습니다.",
    "expectedFamily": "시작 IP와 같은 {{family}}를 사용하세요."
  },
  ip: {
    title: '내 공인 IP', description: '현재 Packetrove 연결에서 사용하는 공인 IP 주소를 확인하세요.',
    online: '온라인 조회 · 앱에서 결과를 저장하지 않음', connection: '현재 연결', checking: '공인 IP 확인 중…',
    resultLabel: '공인 IP 주소', copy: 'IP 복사', copySuccess: 'IP 주소를 복사했습니다.',
    copyFailure: '클립보드를 사용할 수 없습니다. 위의 IP 주소를 선택하여 복사하세요.', checkingButton: '확인 중…', retry: '다시 시도', refresh: 'IP 새로고침',
    explanationTitle: '이 주소의 의미',
    explanation: '이 요청에서 Packetrove가 관찰한 주소입니다. VPN이나 프록시를 사용하면 해당 출구 주소가 표시됩니다. 브라우저와 명령줄 도구는 서로 다른 네트워크 경로를 사용할 수 있습니다.',
    familyExplanation: '한 연결은 IPv4 또는 IPv6를 사용합니다. 이 조회는 해당 연결의 주소를 표시하며 두 종류의 주소나 로컬 사설 주소를 모두 찾는 기능은 아닙니다. 네트워크나 프록시 설정을 바꾼 후에는 새로고침하세요.',
  },
  api: {
    certificateSummary: certificateCopy.apiSummary,
    examplesTitle: '엔드포인트 개요 및 예제',
    rangeSummary: "같은 주소 체계의 start와 end를 제출합니다. 양 끝을 포함하며 정규화된 끝점, 최소의 정확한 CIDR 목록, CIDR 수, 십진 문자열 주소 수를 반환합니다. 이 요청은 입력을 서버로 보냅니다.",
    rangeResponse: "이 예제는 {{cidrs}}를 반환하며 정확히 {{addresses}}개 주소를 나타냅니다.",
    title: 'API 문서', loading: 'API 문서 불러오는 중…', specification: 'OpenAPI 명세',
    unavailableTitle: 'API 문서를 표시할 수 없습니다',
    unavailableDescription: '문서를 불러오거나 표시하지 못했습니다. 계산기로 돌아가도 입력, 결과, 검증 오류는 유지됩니다.',
    returnToCalculator: '계산기로 돌아가기',
    description: '계정이나 API 키 없이 엔드포인트를 살펴보고 요청 예제를 복사하거나 API를 사용해 보세요. 요청을 보내면 입력 데이터가 API로 전송됩니다. 공인 IP 조회는 브라우저 연결을 기준으로 합니다.',
    englishReference: '대화형 참조 문서와 명세는 영어로 제공됩니다.',
    cidrSummary: 'IPv4 또는 IPv6 주소와 CIDR 범위를 JSON으로 보내세요. 응답에는 최소 포괄 CIDR, 정규화된 입력, 10진수 문자열로 표현된 정확한 주소 수가 포함됩니다. 이 API 요청은 입력을 서버로 전송합니다.',
    cidrResponse: '이 예제는 {{cidr}}을 반환하며 주소 {{additional}}개를 추가로 포함합니다. 허용 목록이나 차단 목록에 결과를 사용하기 전에 additionalAddressCount를 확인하세요.',
    ipSummary: '현재 HTTP 연결에서 관찰한 공인 IP를 반환합니다. 주소와 줄 바꿈을 받으려면 text/plain을, 주소와 주소 체계를 받으려면 application/json을 요청하세요. 응답은 캐시되지 않습니다. VPN이나 프록시를 사용하면 관찰되는 출구 주소가 달라집니다.',
    subtractSummary: "include에서 exclude를 정확히 뺍니다. 최소 정규 CIDR 목록과 정확한 십진 문자열 주소 수를 반환합니다. 이 API는 입력을 서버로 보냅니다.",
    subtractResponse: "이 예시는 {{cidrs}}를 반환하며 {{remaining}}개의 주소가 남습니다. 추가 범위는 포함하지 않습니다.",
  },
  discovery: {
    certificate: certificateCopy.discovery,
    range: {
      "title": "IP 범위 변환 질문",
      "mcpTitle": "MCP로 IP 범위 변환",
      "purpose": "AI 에이전트에게 양 끝을 포함하는 IP 범위를 최소의 정확한 CIDR 목록으로 나타내도록 요청하세요.",
      "inputs": "같은 주소 체계의 IPv4 또는 IPv6 주소를 start와 end로 전달하세요. CIDR 접두사 없이 각각 최대 {{maximumLength}}자이며 end는 start 이상이어야 합니다.",
      "result": "정규화된 range.first와 range.last, 정렬된 cidrs, cidrCount, 정확한 십진 문자열 addressCount를 읽으세요. 같은 끝점은 /32 또는 /128, 전체 주소 공간은 /0을 반환합니다. 오류는 start 또는 end를 표시합니다.",
      "boundary": "브라우저는 로컬에서 계산합니다. API와 원격 MCP는 끝점을 서버로 보냅니다. 도구는 실제 할당을 조사하거나 방화벽, 라우팅, VPN 설정을 변경하지 않습니다. CLI에서는 범위 변환을 제공하지 않습니다.",
      "openTool": "브라우저 범위 변환 열기",
      "questions": {
        "exact": {
          "question": "단일 포함 CIDR과 어떻게 다른가요?",
          "answer": "이 목록은 양 끝을 포함하는 범위만 나타내며 추가 주소가 없습니다. 단일 포함 CIDR은 시작 전이나 끝 이후 주소를 포함할 수 있습니다. 허용 목록이 주어진 범위와 정확히 일치해야 할 때 정확한 변환을 사용하세요."
        },
        "order": {
          "question": "같거나 역순인 끝점을 사용할 수 있나요?",
          "answer": "같은 끝점은 호스트 CIDR 하나를 반환합니다. IPv4는 /32, IPv6는 /128입니다. 역순 끝점은 거부하며 자동으로 바꾸지 않습니다. 둘 다 같은 주소 체계의 주소여야 하고 CIDR 접두사가 없어야 합니다."
        },
        "counts": {
          "question": "어떤 주소를 계산하나요?",
          "answer": "양 끝과 IPv4 네트워크 및 브로드캐스트 주소를 포함하여 범위의 모든 주소를 계산합니다. 전체 IPv6 공간에서도 수는 정확하며 주소를 하나씩 열거하지 않습니다."
        },
        "privacy": {
          "question": "끝점은 어디로 전송되나요?",
          "answer": "브라우저 계산은 장치 메모리에만 유지되며 업로드, 영구 저장, 로그 기록, URL에 입력 추가를 하지 않습니다. Web API와 원격 MCP는 끝점을 서버로 보냅니다. 웹사이트, Web API, MCP에서 이용할 수 있습니다."
        }
      }
    },
    subtract: {
      title: 'CIDR 빼기 관련 질문',
      mcpTitle: "MCP로 CIDR 차집합 사용",
      purpose: "AI 에이전트에게 포함된 주소 공간에서 제외 네트워크를 빼고 정확한 나머지 CIDR 목록을 반환하도록 요청하세요.",
      inputs: "같은 주소 계열의 include 및 exclude 배열을 전달하세요. include는 비어 있을 수 없으며 exclude는 비어 있어도 됩니다. 두 목록 합계 {{maximumInputs}}개까지, 각 항목 {{maximumLength}}자까지입니다.",
      result: "cidrs와 정확한 십진 문자열 includedAddressCount, removedAddressCount, remainingAddressCount를 읽으세요. 전체 제거는 빈 목록을 반환합니다. {{maximumOutputs}}개를 넘는 CIDR 결과는 부분 목록 없이 오류를 반환합니다.",
      boundary: "원격 API와 MCP는 입력을 서버로 보내고 브라우저는 로컬에서 계산합니다. 남은 범위는 입력에 따른 결과이며 실제 사용 가능 여부를 증명하지 않습니다. WireGuard 설정이나 방화벽 규칙을 변경하지 않습니다.",
      openTool: "브라우저 차집합 도구 열기",
      questions: {
        wireguard: {
          question: 'WireGuard AllowedIPs의 예외는 어떻게 준비하나요?',
          answer: '터널 범위는 포함 목록에, 예외는 제외 목록에 입력하세요. 쉼표로 구분해 복사를 선택하면 정확히 남은 CIDR을 WireGuard의 AllowedIPs 설정값으로 복사할 수 있습니다. 적용 전에 검토하세요. Packetrove는 WireGuard를 설정하거나 경로를 변경하지 않습니다.',
        },
        remaining: {
          question: '남은 범위는 주소가 사용되지 않는다는 증거인가요?',
          answer: '포함 및 제외 목록을 기준으로 남은 공간을 보여 줍니다. 이 도구는 실제 네트워크 사용 여부를 확인하거나 요청한 크기의 서브넷을 찾지 않습니다.',
        },
        outside: {
          question: '겹치거나 포함 범위 밖에 있는 제외 항목은 어떻게 처리하나요?',
          answer: '각 목록의 겹치는 주소는 한 번만 계산합니다. 포함 목록에 있는 주소만 제거하며, 그 밖의 제외 항목은 아무것도 제거하지 않습니다. 모든 주소가 제거되면 빈 CIDR 목록과 남은 주소 수 0을 정상적으로 반환합니다.',
        },
        covering: {
          question: 'CIDR 빼기는 포괄 CIDR과 어떻게 다른가요?',
          answer: '빼기는 포함 범위의 합집합에서 제외 범위의 합집합을 뺀 정확한 나머지를 유지하며 빈 공간도 보존합니다. 주소를 추가하지 않고 정규화된 CIDR의 최소 목록을 정렬해 반환합니다. 단일 포괄 CIDR은 추가 주소를 포함할 수 있습니다.',
        },
        access: {
          question: 'MCP, 웹 API 또는 CLI로 빼기를 호출할 수 있나요?',
          answer: "차집합은 웹사이트, Web API, MCP에서 사용할 수 있습니다. 브라우저 입력은 로컬에 남고 API와 MCP는 서버로 보냅니다. CLI는 현재 차집합을 지원하지 않습니다."
        },
      },
    },
    cidr: {
      title: '포괄 CIDR 관련 질문',
      mcpTitle: 'MCP로 계산기 사용하기',
      purpose: 'AI 에이전트에게 방화벽 허용 또는 차단 목록에서 선택한 항목 그룹의 단일 포괄 CIDR을 계산하고 추가 포함 범위를 설명하도록 요청하세요.',
      inputs: 'IPv4 또는 IPv6 주소나 CIDR을 1개부터 {{maximumInputs}}개까지 받으며, 항목당 최대 {{maximumLength}}자입니다. 호출마다 하나의 주소 체계만 사용하세요.',
      result: 'cidr과 range에서 포함된 네트워크를 확인하세요. 규칙 적용 전에 additionalAddressCount를 검토하세요. 모든 주소 수는 IPv6의 정확도를 유지하는 십진수 문자열입니다.',
      boundary: '원격 MCP 호출은 입력을 서버로 전송합니다. 웹 계산기는 로컬에서 실행됩니다. 이 도구는 하나의 CIDR을 계산합니다. 전체 목록의 항목 수 제한에 맞춰 여러 병합을 선택하려면 별도의 판단이 필요합니다. 방화벽 규칙은 변경하지 않습니다.',
      openTool: '브라우저 계산기 열기',
      questions: {
        firewall: {
          question: '방화벽 IP 목록의 항목 수는 어떻게 줄이나요?',
          answer: '선택한 그룹을 단일 포괄 CIDR로 합치세요. 먼저 추가 주소를 검토하세요. 허용 목록에서는 해당 주소가 허용되고 차단 목록에서는 차단됩니다.',
        },
        covering: {
          question: '단일 포괄 CIDR은 원래 주소를 정확히 유지하나요?',
          answer: '원래 합집합이 해당 CIDR을 완전히 채울 때만 가능합니다. 그 외에는 가장 작은 단일 포괄 CIDR도 주소를 추가합니다. Packetrove는 확장 범위를 보여 주며 전체 목록에 가장 적합한 병합 조합을 선택하지는 않습니다.',
        },
        overlap: {
          question: '겹치는 주소와 중복 항목은 어떻게 계산하나요?',
          answer: '원래 합집합의 각 주소는 한 번만 계산합니다. 호스트 비트가 있는 CIDR은 네트워크 주소로 정규화됩니다. normalizedInputs에는 중복 항목이 남지만 주소 수는 늘어나지 않습니다.',
        },
        counts: {
          question: '매우 큰 IPv6 범위의 주소 수도 정확한가요?',
          answer: '예. 브라우저는 정확한 정수를 사용하고 API와 MCP는 십진수 문자열을 반환합니다. IPv4 네트워크 및 브로드캐스트 주소를 포함해 규칙이 포함하는 모든 주소를 계산합니다. 계산마다 하나의 주소 체계만 사용하세요.',
        },
        privacy: {
          question: '계산 입력은 어디로 전송되나요?',
          answer: '웹 계산기는 브라우저에서 실행되며 입력을 API로 전송하지 않습니다. 입력 초안은 이 탭의 메모리에 유지됩니다. 로컬 CLI는 오프라인으로 계산하며 웹 API와 원격 MCP는 입력을 서버로 전송합니다.',
        },
      },
    },
    ip: {
      title: '공인 IP 관련 질문',
      mcpTitle: 'MCP로 연결 확인하기',
      purpose: 'AI 에이전트에게 MCP 도구 호출에 사용한 연결의 공인 IP를 확인하도록 요청하세요.',
      inputs: '빈 객체 {}를 전달하세요. 도구는 요청 연결을 관찰하며 조회할 IP 주소를 인수로 받지 않습니다.',
      result: '예제는 문서용 주소를 사용합니다. 실제 호출은 해당 요청에서 관찰한 ip와 family를 반환하며 family는 ipv4 또는 ipv6입니다.',
      boundary: '호스팅된 AI 클라이언트는 자신의 출구 주소를 반환할 수 있습니다. 브라우저 연결은 이 웹 도구로, 터미널 연결은 해당 컴퓨터에서 CLI를 실행해 확인하세요. 한 번의 호출로 두 주소 체계, 사설 로컬 주소 또는 프록시 이전 주소를 찾을 수 없습니다. 결과는 신원을 증명하지 않습니다.',
      openTool: '브라우저의 공인 IP 확인하기',
      questions: {
        address: {
          question: '이 페이지는 어떤 IP 주소를 보여 주나요?',
          answer: '브라우저가 현재 Packetrove에 보내는 요청에서 관찰한 공인 주소입니다. 사설 로컬 주소가 아니며 기기를 식별하지 않습니다.',
        },
        vpn: {
          question: 'VPN이나 프록시를 사용하면 무엇이 달라지나요?',
          answer: '결과는 해당 연결의 출구 주소를 보여 줍니다. 네트워크, VPN 또는 프록시 설정을 변경한 뒤 새로고침하세요. 프록시 이전 주소는 표시하지 않습니다.',
        },
        family: {
          question: '한 번의 조회로 IPv4와 IPv6를 모두 확인하나요?',
          answer: '아니요. 하나의 요청은 하나의 주소 체계만 관찰합니다. 조회가 성공해도 IPv4와 IPv6 양쪽 모두의 연결을 확인한 것은 아닙니다.',
        },
        client: {
          question: 'AI 에이전트나 CLI가 다른 IP를 표시하는 이유는 무엇인가요?',
          answer: '각 인터페이스는 자신의 요청에 사용된 연결을 관찰합니다. 호스팅된 MCP 클라이언트는 브라우저와 다른 네트워크를 사용할 수 있습니다. 확인하려는 네트워크 경로에서 웹 도구나 CLI를 실행하세요.',
        },
        privacy: {
          question: 'IP 결과가 저장되거나 캐시되나요?',
          answer: '애플리케이션은 현재 결과를 표시하기 위해 메모리에 유지하며 조회 기록이나 주소 로그를 남기지 않습니다. 결과와 오류는 캐시되지 않습니다. 호스팅 플랫폼은 자체 설정에 따라 요청을 처리합니다.',
        },
      },
    },
  },
  mcp: {
    identityTitle: "서버 식별 정보",
    identityExplanation: "서버는 릴리스 버전과 함께 다음 서비스 식별 정보를 제공합니다. 각 도구의 이름, 설명, 스키마는 tools/list를 통해 별도로 나열됩니다.",
    identityPresentation: "클라이언트는 제목, 설명, 웹사이트 또는 아이콘을 표시할지 결정하며 선택 필드를 무시할 수 있습니다. 프로토콜 검색 성공이 클라이언트의 정보 표시를 보장하지는 않습니다. PNG 아이콘은 32×32이며 테마 제한이 없습니다.",
    navigation: "MCP 안내",
    sdkTitle: "Node.js 예제 실행",
    sdkDescription: "새 디렉터리에 아래 코드를 <code>packetrove-example.mjs</code>로 저장한 다음 명령을 실행하세요. 예제는 <code>@modelcontextprotocol/client@{{version}}</code>를 사용해 도구를 검색하고 문서용 주소로 CIDR 도구를 호출합니다.",
    sdkLocal: "로컬 개발에서는 <code>pnpm dev:api</code>를 시작하고 예제의 서버 URL을 <code>{{localUrl}}</code>로 바꾸세요.",
    httpErrors: "업무 오류는 공유 오류 JSON을 사용합니다. MCP SDK가 프로토콜을 검증합니다. 잘못된 JSON, 지원하지 않는 미디어 형식, 너무 큰 본문은 HTTP 계층에서 거부됩니다.",
    deploymentTitle: "배포 및 연결 제한",
    serverBehavior: "서버는 최신 무상태 요청과 기존 Streamable HTTP의 초기화, 검색, 호출을 지원합니다. 영구 세션이나 독립적인 서버 이벤트 스트림은 제공하지 않습니다.",
    operationalLogging: "도구 이름, 성공 또는 오류 상태, 제어된 오류 코드와 호출 출처 분류를 담은 운영 이벤트로 실행 횟수를 집계합니다. 검증된 자동 검사에는 실행 식별자가 기록될 수도 있습니다. 입력, 결과, 조회된 주소, 원시 요청 헤더와 자동 검사 토큰은 제외합니다. Cloudflare가 요청 메타데이터를 추가할 수 있으며 처리 및 보관 기간은 개인정보 처리방침을 참고하세요.",
    connectionPrivacy: "공인 IP 연결 정보는 도구 호출마다 읽으며 동시 클라이언트의 서버 인스턴스는 격리됩니다. MCP 결과와 오류는 Cache-Control: no-store, no-transform을 사용합니다. 애플리케이션은 조회 주소를 저장하거나 기록하지 않습니다.",
    toolMigration: "기존 도구 이름에는 호환 별칭이 없습니다: {{toolRenames}}. 도구 검색과 저장된 호출을 업데이트하세요.",
    endpointMigration: "웹사이트의 <code>/mcp</code>는 서비스가 아닙니다. GET은 404, POST는 405를 반환하며 도구 호출을 프록시하거나 리디렉션하지 않습니다. 클라이언트에 <code>{{serverUrl}}</code>을 설정하세요. 직접 배포할 때는 도메인과 별도의 정확한 Host 및 브라우저 Origin 허용 목록을 갱신하세요. Origin 헤더가 없는 클라이언트도 지원합니다.",
    deploymentGuide: "배포, 자체 호스팅 및 운영 검증",
    registryGuide: "MCP Registry 게시 및 버전 정책",
    title: 'Packetrove를 AI 에이전트에 연결하기',
    explanation: "호환되는 MCP 클라이언트를 연결해 Packetrove 네트워크 도구를 사용하세요. 아래에서 연결을 설정한 후 도구 예시를 참고하세요.",
    connection: 'Streamable HTTP · 계정이나 API 키 불필요',
    connectTitle: '클라이언트 연결하기',
    connectDescription: 'Claude Code 또는 Codex를 설치한 뒤 이 원격 서버를 추가하세요. 명령은 클라이언트를 설정하며 로컬 Packetrove 서버를 설치하지 않습니다.',
    clientGuide: '{{client}} MCP 문서',
    check: "클라이언트에서 <code>/mcp</code>로 연결을 확인하세요. 다음 도구를 사용할 수 있는지 확인하세요: <code>{{tools}}</code>.",
    discovery: '설정 후 클라이언트는 tools/list로 사용 가능한 도구를 찾습니다. 도구 설명과 스키마는 선택과 인수 구성을 안내합니다. 웹 페이지를 읽는 것만으로 클라이언트가 설정되거나 도구 접근 권한이 생기지는 않습니다.',
    toolName: '도구 이름',
    arguments: '예제 인수',
    exampleResult: '문서용 주소를 사용한 예제 결과',
    errorsTitle: '결과 읽기 및 오류 처리',
    results: '<code>structuredContent</code> 또는 텍스트 블록의 JSON을 읽으세요. 주소 수는 십진수 문자열이나 임의 정밀도 정수로 유지하세요. 큰 IPv6 주소 수를 부동 소수점 숫자로 변환하면 정확도가 손실됩니다.',
    resourceLinkLabel: "성공 응답의 선택적 도구 페이지 링크",
    resultLinks: "계산과 조회의 성공 응답은 <code>structuredContent</code>와 첫 번째 JSON 텍스트 블록에 결과를 유지하고 영어 도구 페이지로 연결되는 선택적 <code>resource_link</code>를 추가합니다. 링크에는 입력이나 결과가 없으며 계산을 복원하지 않습니다. 링크를 표시하거나 무시하거나 열지는 클라이언트가 결정하며 자동 표시나 인용은 보장되지 않습니다. 공용 IP 페이지를 열면 브라우저의 새 연결을 확인하므로 MCP 호출자의 연결과 다를 수 있습니다. 오류 응답에는 도구 페이지 링크가 없습니다.",
    errors: '<code>isError</code>가 true이면 재시도 전에 오류 JSON을 읽으세요. 사용자 정보를 바탕으로 <code>INVALID_INPUT</code> 및 <code>MIXED_ADDRESS_FAMILIES</code>를 수정하세요. <code>CLIENT_IP_UNAVAILABLE</code>은 신뢰할 수 있는 연결 메타데이터가 없다는 뜻입니다. 주소를 임의로 만들지 마세요.',
    technicalGuide: '저장소의 MCP 기술 가이드 읽기 (영어)',
  },
  errors: {
    invalidInput: '계산 입력이 올바르지 않습니다.', mixedFamilies: '한 번의 계산에는 IPv4 또는 IPv6 중 하나만 사용하세요.',
    invalidJson: '요청에는 올바른 JSON이 포함되어야 합니다.', payloadTooLarge: '요청이 너무 큽니다.', unsupportedMediaType: '지원하지 않는 요청 콘텐츠 유형입니다.',
    notFound: '요청한 리소스가 존재하지 않습니다.', methodNotAllowed: '지원하지 않는 요청 메서드입니다.',
    internal: '작업을 완료하지 못했습니다. 다시 시도하세요.', ipUnavailable: '연결 메타데이터를 사용할 수 없습니다. 다시 시도하세요.',
    network: 'IP 조회 서비스에 연결하지 못했습니다. 연결을 확인하고 다시 시도하세요.', invalidResponse: 'IP 조회 서비스에서 올바르지 않은 응답을 받았습니다. 다시 시도하세요.',
    invalidAddress: '표준 IPv4 또는 IPv6 주소를 입력하세요. 유효한 CIDR 접두사를 함께 지정할 수 있습니다. 영역 식별자와 IPv4의 앞자리 0은 지원하지 않습니다.',
    emptyInputs: 'IP 주소 또는 CIDR 범위를 하나 이상 입력하세요.', tooManyInputs: '한 번의 계산에 최대 {{limit}}개 항목을 사용하세요.',
    inputTooLong: '각 항목은 {{limit}}자 이하여야 합니다.', expectedFamily: '첫 번째 입력과 동일하게 {{family}}를 사용하세요.',
    tooManyOutputs: '전체 결과가 {{limit}}개의 CIDR을 초과합니다. 제외 항목을 줄이거나 포함 범위를 좁히세요. 부분 결과는 반환하지 않습니다.',
  },
  meta: {
    certificate: certificateCopy.meta,
    support: {"title":"지원 — Packetrove","description":"Packetrove 관리자에게 연락하고, 문제를 안전하게 보고하며, API·MCP·CLI 가이드와 개인정보 정보를 확인하세요."},
    terms: {"title":"서비스 이용약관 — Packetrove","description":"Packetrove 호스팅 서비스의 허용되는 이용, 결과 제한, 가용성, 개인정보 및 MIT 라이선스를 확인하세요."},
    privacy: {"title": "개인정보 처리방침 — Packetrove", "description": "Packetrove의 로컬 계산, 원격 입력, 연결 주소, 운영 로그 및 호스팅 데이터 처리와 보관 기간 및 사용자 선택을 설명합니다."},
    range: {
      "title": "IP 범위를 CIDR로 변환 — Packetrove",
      "description": "양 끝을 포함하는 IPv4 또는 IPv6 범위를 로컬에서 최소의 정확한 CIDR 목록으로 변환하세요. 모든 블록을 복사하고 추가 범위 없이 정확한 수를 확인합니다."
    },
    mcp: { title: 'MCP 가이드 — Packetrove', description: '호환되는 AI 클라이언트를 MCP로 Packetrove에 연결하세요. 연결 설정, 도구 검색, 인수, 구조화된 결과, 오류 처리를 확인할 수 있습니다. API 키가 필요 없습니다.' },
    home: { title: 'Packetrove — 사용자와 AI 에이전트를 위한 네트워크 도구', description: '개발자와 AI 에이전트를 위한 오픈 소스 네트워크 도구입니다. 웹에서 Packetrove를 사용하거나 API, CLI, MCP로 작업 흐름에 연결하세요. 계정이 필요 없습니다.' },
    cidr: { title: '최소 포괄 CIDR 계산기 — Packetrove', description: 'IPv4 또는 IPv6 주소와 범위를 모두 포함하는 가장 작은 단일 CIDR을 찾으세요. 브라우저에서 정확한 주소 수, 추가 범위, 예제를 확인할 수 있습니다.' },
    subtract: { title: 'CIDR 빼기 계산기 — Packetrove', description: '브라우저에서 IPv4 또는 IPv6 CIDR 목록을 빼세요. WireGuard AllowedIPs에 사용할 정확한 최소 목록을 복사하거나 알려진 할당을 제외한 나머지 주소 공간을 확인할 수 있습니다.' },
    ip: { title: '내 IP는 무엇인가요? 공인 IP 조회 — Packetrove', description: '현재 연결의 공인 IPv4 또는 IPv6 주소를 확인하고 VPN과 프록시의 출구 주소를 이해하세요. 계정이 필요 없습니다.' },
    api: { title: 'API 문서 — Packetrove', description: '공개 HTTP API로 Packetrove 네트워크 도구를 앱과 스크립트에 연결하세요. 엔드포인트, 요청 예제, 구조화된 응답, OpenAPI 문서를 살펴볼 수 있습니다. API 키가 필요 없습니다.' },
    notFound: { title: '페이지를 찾을 수 없습니다 — Packetrove', description: '이 Packetrove 페이지는 존재하지 않습니다. 홈으로 돌아가 네트워크 도구를 사용하세요.' },
    imageAlt: '프로젝트 이름과 영어 슬로건 Network tools for humans and agents 옆에 있는 Packetrove 큐브 로고.',
  },
} satisfies TranslationResource;
