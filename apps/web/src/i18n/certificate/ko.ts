export const certificateCopy = {
  "certificate": {
    "title": "인증서 묶음 검사",
    "description": "PEM 인증서, 발급자 후보 관계와 근거에 따른 다음 단계를 확인합니다.",
    "local": "브라우저에서 검사 · 인증서와 결과는 페이지 메모리에만 유지",
    "scopeTitle": "검사 범위",
    "scope": "파싱, 중복, 유효 기간, 후보 서명, CA 및 keyCertSign 제약과 선택적 DNS 호스트 이름을 검사합니다. 전체 RFC 5280 경로, 클라이언트 신뢰, 폐기 여부나 배포 안전성은 검증하지 않습니다.",
    "inputs": "인증서 입력",
    "samplesLabel": "합성 인증서 예제",
    "loadSample": "예제 사용해 보기",
    "samplesHelp": "공개 합성 인증서 번들을 선택해 입력란을 채우세요. 준비되면 인증서 묶음 검사 버튼으로 검사를 실행하세요.",
    "closeExamples": "예제 닫기",
    "evidenceTitle": "근거",
    "pem": "PEM 인증서",
    "pemHelp": "CERTIFICATE 블록과 공백만 허용합니다. 최대 {{maximum}}개, {{kib}} KiB. 개인 키는 거부합니다.",
    "bytes": "{{current}} / {{maximum}} 바이트",
    "hostname": "예상 호스트 이름(선택)",
    "hostnameHelp": "ASCII DNS 이름만 허용합니다. 선택한 리프의 DNS SAN을 검사하며 Common Name으로 대체하지 않습니다.",
    "check": "인증서 묶음 검사",
    "result": "검사 결과",
    "completed": "검사 완료. 인증서: {{certificates}}. 진단: {{findings}}.",
    "certificates": "인증서",
    "verifiedLinks": "검증된 서명",
    "findingCount": "진단",
    "evaluation": "평가 시각: {{time}}(기기 시계)",
    "selectLeaf": "호스트 이름을 검사할 리프",
    "selectPosition": "원래 입력 위치 선택",
    "hostnameTitle": "호스트 이름: {{hostname}}",
    "relationships": "발급 관계",
    "candidate": "후보 관계",
    "constraints": "발급자 제약",
    "constraintsFailed": "CA / Key Usage 거부",
    "keyIdFailed": "키 식별자 불일치",
    "constraintsPassed": "로컬 제약 통과",
    "findingsTitle": "진단 및 다음 단계",
    "checking": "로컬에서 파싱 및 서명 검증 중…",
    "pending": "인증서를 입력하고 검사하세요. 입력을 바꾸면 이전 결과가 지워집니다.",
    "details": "인증서 상세 · 원래 순서",
    "explanationTitle": "검사의 의미",
    "explanation": "번호는 원래 입력 위치이며 JSON 인덱스는 0부터 시작합니다. 중복 위치도 유지합니다. 후보 이름은 보수적인 인코딩 비교를 사용합니다. 발급자 부재는 정보이며 한 후보 실패가 다른 관계를 무효화하지 않습니다. 도구나 언어 전환 시 초안은 페이지 메모리에 남으며 새로 고치면 지워집니다.",
    "dnsRules": "DNS SAN은 ASCII 대소문자와 호스트 이름 끝의 점을 무시합니다. 맨 왼쪽의 완전한 와일드카드는 한 레이블만 일치합니다. URL, IP, 포트, 와일드카드 입력과 Unicode 이름은 거부합니다. 국제화 이름은 먼저 punycode로 변환하세요. Common Name은 표시용입니다.",
    "examplesTitle": "합성 예제",
    "exampleNote": "공개 합성 인증서입니다. 문서 평가 시각: {{time}}. 실제 검사는 현재 실행 환경의 시계를 사용합니다.",
    "graphLabel": "인증서 발급 관계 그래프입니다. 화살표는 인증서에서 발급자 후보로 향하며 원래 위치는 아래에 나옵니다.",
    "graphHelp": "인증서 → 발급자 후보. 실선은 서명과 로컬 제약 통과, 점선은 실패 또는 미완료입니다. 자체 서명 결과는 상세에 나옵니다.",
    "noCommonName": "CN 없음",
    "ca": "CA 인증서",
    "nonCa": "비 CA 인증서",
    "nextAction": "다음 단계",
    "noFindings": "진단이 없습니다. 클라이언트 신뢰와 배포를 별도로 확인하세요.",
    "yes": "예",
    "no": "아니요",
    "notProvided": "제공되지 않음",
    "originalPosition": "원래 위치",
    "position": "인증서 #{{number}}, 시작 줄 {{line}}",
    "serial": "일련번호",
    "selfSignature": "자체 서명 검사",
    "json": "구조화된 결과 JSON",
    "inputLine": "{{line}}번째 줄: {{message}}",
    "status": {
      "verified": "검증됨",
      "failed": "실패",
      "unsupported": "미지원",
      "unavailable": "미완료"
    },
    "severity": {
      "error": "오류",
      "warning": "경고",
      "info": "정보"
    },
    "hostnameStatus": {
      "matched": "DNS SAN이 일치합니다. 체인과 클라이언트 신뢰는 별도로 검사하세요.",
      "mismatched": "DNS SAN이 불일치합니다. 진단 근거를 확인하세요.",
      "ambiguous": "호스트 이름 검사 전에 대상 리프를 선택하세요.",
      "no-leaf": "호스트 이름을 검사할 비 CA 리프가 없습니다."
    },
    "samples": {
      "normal": "정상 묶음",
      "omittedRoot": "루트 생략",
      "missingIntermediate": "중간 인증서 누락",
      "expired": "만료된 인증서",
      "future": "아직 유효하지 않은 인증서",
      "hostnameMismatch": "호스트 이름 불일치",
      "multipleLeaves": "여러 리프",
      "crossSigning": "교차 서명 및 무순서 입력",
      "invalidCandidate": "같은 이름의 후보 실패",
      "duplicate": "중복 인증서"
    },
    "errors": {
      "EMPTY_INPUT": "PEM 인증서를 하나 이상 붙여 넣으세요.",
      "INPUT_TOO_LARGE": "PEM이 UTF-8 48 KiB 제한을 초과합니다.",
      "INVALID_PEM": "잘못된 PEM입니다. CERTIFICATE 블록, 완전한 Base64와 블록 사이 공백만 허용합니다.",
      "PRIVATE_KEY_REJECTED": "개인 키 블록을 거부했습니다. 제거하고 인증서만 입력하세요.",
      "UNSUPPORTED_PEM_BLOCK": "지원하지 않는 블록입니다. CERTIFICATE만 허용합니다.",
      "INVALID_CERTIFICATE": "지원되는 올바른 DER X.509 인증서가 아닙니다.",
      "TOO_MANY_CERTIFICATES": "최대 16개입니다. 부분 결과를 반환하지 않습니다.",
      "INVALID_HOSTNAME": "URL, IP, 포트나 와일드카드 없는 ASCII DNS 이름을 입력하고 Unicode 이름은 punycode로 변환하세요.",
      "INVALID_LEAF_SELECTION": "비 CA 인증서가 있는 원래 위치를 선택하세요.",
      "CRYPTO_UNAVAILABLE": "검사를 완료하지 못했습니다. 보안 컨텍스트의 지원 브라우저나 다른 구현을 사용하세요.",
      "INVALID_INPUT": "잘못된 요청입니다. PEM, 호스트 이름과 리프 위치를 확인하세요.",
      "INVALID_TIME": "실행 환경의 평가 시각이 잘못되었습니다."
    },
    "graphScrollHelp": "좁은 화면에서는 관계도 안에서 좌우로 스크롤하여 각 인증서를 확인하세요.",
    "evidence": {
      "fingerprintSha256": "SHA-256 지문",
      "evaluatedAt": "평가 시각",
      "notAfter": "유효 기간 종료",
      "notBefore": "유효 기간 시작",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "서명",
      "algorithm": "서명 알고리즘",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints 존재",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "후보 수",
      "expectedHostname": "예상 호스트 이름",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "이 위치에 중복 인증서가 있음",
        "action": "의도하지 않은 중복이라면 제거하세요."
      },
      "CERTIFICATE_EXPIRED": {
        "title": "평가 시 인증서가 만료됨",
        "action": "인증서를 갱신하거나 교체하고 실제 제공되는 인증서를 확인하세요."
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "평가 시 아직 유효하지 않음",
        "action": "기기 시계와 인증서 활성화 날짜를 확인하세요."
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "자신의 공개 키로 서명 검증됨",
        "action": "클라이언트 신뢰와 실제 배포를 별도로 확인하세요. 이 관찰로 둘 다 증명할 수 없습니다."
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "자체 발급 인증서의 자체 서명 실패",
        "action": "이 두 원래 위치의 인증서를 확인하세요. 다른 후보는 독립적으로 검사합니다."
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "이 환경에서 서명 알고리즘 미지원",
        "action": "이 알고리즘을 지원하는 다른 구현으로 확인하세요. 미완료나 미지원은 서명 실패가 아닙니다."
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "서명 검사를 완료하지 못함",
        "action": "이 알고리즘을 지원하는 다른 구현으로 확인하세요. 미완료나 미지원은 서명 실패가 아닙니다."
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "묶음에서 같은 인코딩의 발급자 이름을 찾지 못함",
        "action": "서버가 실제로 이 묶음을 제공한다면 full-chain 설정을 확인하세요. 루트는 보통 생략되므로 부재만으로 체인 손상을 증명할 수 없습니다."
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "발급자 후보 서명 실패",
        "action": "이 두 원래 위치의 인증서를 확인하세요. 다른 후보는 독립적으로 검사합니다."
      },
      "ISSUER_NOT_CA": {
        "title": "발급자 후보에 CA=true가 없음",
        "action": "의도한 발급 CA, Key Usage, 키 식별자와 다른 후보를 확인하세요."
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "발급자 후보에 keyCertSign이 없음",
        "action": "의도한 발급 CA, Key Usage, 키 식별자와 다른 후보를 확인하세요."
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "발급자와 주체의 키 식별자 불일치",
        "action": "의도한 발급 CA, Key Usage, 키 식별자와 다른 후보를 확인하세요."
      },
      "MULTIPLE_ISSUERS": {
        "title": "여러 후보가 로컬 제약을 통과함",
        "action": "후보 경로를 각각 확인하세요. 이 도구는 권위 있는 신뢰 경로를 선택하지 않습니다."
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "가능한 리프가 여러 개이므로 선택 필요",
        "action": "대상 비 CA 리프를 제공하거나 명시적으로 선택한 뒤 호스트 이름을 검사하세요."
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "비 CA 리프가 제공되지 않음",
        "action": "대상 비 CA 리프를 제공하거나 명시적으로 선택한 뒤 호스트 이름을 검사하세요."
      },
      "HOSTNAME_MATCH": {
        "title": "호스트 이름이 선택한 리프의 DNS SAN과 일치",
        "action": "클라이언트 신뢰와 실제 배포를 별도로 확인하세요. 이 관찰로 둘 다 증명할 수 없습니다."
      },
      "HOSTNAME_MISMATCH": {
        "title": "호스트 이름이 선택한 리프의 DNS SAN과 불일치",
        "action": "호스트 이름을 확인하거나 필요한 DNS SAN이 있는 인증서를 발급받으세요. Common Name으로 대체하지 않습니다."
      }
    }
  },
  "homepage": {
    "description": "PEM 인증서 서명, 발급자 후보와 선택적 DNS 신원을 로컬에서 검사합니다.",
    "link": "인증서 묶음 검사"
  },
  "apiSummary": "PEM 인증서와 선택적 DNS 호스트 이름을 서버로 보내 원래 위치, 후보 서명, 근거와 다음 단계를 받습니다. 개인 키는 거부하며 결과는 클라이언트 신뢰를 증명하지 않습니다.",
  "meta": {
    "title": "인증서 묶음 검사 — Packetrove",
    "description": "PEM 후보 서명, 유효 기간, 발급자 제약과 DNS SAN을 로컬에서 검사하고 다음 단계를 확인합니다. 업로드나 전체 신뢰 검증은 하지 않습니다."
  },
  "remotePrivacy": "API와 원격 MCP는 IP, CIDR, 범위 끝점 또는 PEM 인증서와 선택적 호스트 이름을 Packetrove로 전송합니다. 데이터베이스나 결과 기록 없이 메모리에서 처리합니다. 인증서 내용과 민감한 상세는 앱 로그나 오류 원격 측정에 포함하지 않습니다. 개인 키나 비밀을 보내지 마세요. 호출 클라이언트는 자체 정책에 따라 결과를 보관할 수 있습니다.",
  "discovery": {
    "title": "인증서 묶음 질문",
    "mcpTitle": "MCP로 인증서 검사",
    "purpose": "AI 클라이언트에 공개 인증서 묶음 검사와 근거 기반 다음 단계를 요청합니다.",
    "inputs": "pem(UTF-8 최대 48 KiB, CERTIFICATE 블록 16개), 선택적 ASCII DNS hostname과 0부터 시작하는 leafIndex를 전달합니다. 개인 키와 다른 블록은 거부합니다.",
    "result": "원래 순서의 certificates, 후보 relationships, leafIndexes, selectedLeafIndex, hostname, evaluatedAt과 안정적인 code, severity, evidence, nextAction의 findings를 읽으세요. 미지원과 서명 실패는 구분합니다.",
    "boundary": "브라우저 검사는 로컬입니다. API와 원격 MCP는 인증서와 호스트 이름을 서버로 보냅니다. 전체 경로, 신뢰, 폐기, 온라인 탐색이나 CLI 작업은 없습니다. 배포 안전성의 증거로 삼지 마세요.",
    "openTool": "브라우저 인증서 검사 열기",
    "questions": {
      "trust": {
        "question": "검증된 관계는 신뢰할 수 있나요?",
        "answer": "서명 하나와 로컬 발급 제약만 검증합니다. 신뢰 저장소, 전체 경로, 폐기와 실제 배포는 별도 검사입니다."
      },
      "root": {
        "question": "발급자 부재는 체인 손상을 증명하나요?",
        "answer": "아니요. 제공된 입력만 설명합니다. 서버는 보통 루트를 생략합니다. 실제 제공 묶음이라면 full-chain 설정과 대상 클라이언트 신뢰를 확인하세요."
      },
      "privacy": {
        "question": "인증서는 어디로 전송되나요?",
        "answer": "브라우저 입력과 결과는 업로드, 저장, 로그나 URL 삽입 없이 페이지 메모리에 남습니다. API와 원격 MCP는 서버로 전송합니다. 개인 키는 거부합니다."
      }
    }
  }
} as const;
