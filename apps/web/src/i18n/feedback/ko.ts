export const feedbackCopy = {
  title: "선택적 에이전트 피드백",
  availability: "{{name}}은 선택적 MCP 지원 작업이며 기본적으로 꺼져 있습니다. tools/list에 표시될 때만 사용하세요. 비공개 보고서를 이메일로 관리자에게 보내 사람이 검토합니다. 웹사이트, Web API, CLI에서는 제출할 수 없습니다.",
  authorization: "사용자가 요청하거나 허용할 때만 제출하세요. 사용자가 제공하거나 승인한 보고서는 바로 보낼 수 있습니다. 새로 작성한 내용은 먼저 보여 주고 승인을 받으세요. 대화 기록을 첨부하거나 호출할 때마다 피드백을 요청하지 마세요.",
  inputs: "category는 bug, confusing_behavior, feature_request 중 하나입니다. summary는 필수이며 tool_name과 synthetic_reproduction은 선택 사항입니다. bug에는 expected와 actual, confusing_behavior에는 actual이 필요합니다. feature_request에는 expected를 넣을 수 있지만 actual과 error_code는 금지됩니다. summary는 유니코드 코드 포인트 {{summaryLimit}}개, expected/actual은 각각 {{descriptionLimit}}개, 재현 내용은 {{reproductionLimit}}개까지입니다. 선택적 error_code는 대문자 코드입니다. 알 수 없는 필드는 거부되며 직렬화한 인자는 8 KiB 이하여야 합니다.",
  limits: "근사 한도는 관측된 출구 IP마다 지난 24시간 동안 {{ipLimit}}회, 서비스 전체에서 UTC 날짜마다 {{dailyLimit}}회입니다. 같은 출구를 쓰는 클라이언트는 한도를 공유합니다. 동시 요청과 KV 동기화 지연으로 두 한도 모두 초과할 수 있습니다. 전송 결과가 불확실하거나 한도 해제에 실패하면 만료될 때까지 한도를 사용합니다. 계산과 조회에는 영향을 주지 않습니다.",
  delivery: "accepted와 receipt_id는 이메일 서비스가 제출을 접수했다는 뜻이며 받은편지함 도착이나 열람을 보장하지 않습니다. 답변이나 수정도 약속하지 않습니다. 명확한 거부는 delivery: not_accepted를 반환합니다. 시간 초과, 취소, DELIVERY_UNCERTAIN 뒤에 자동 재전송하지 마세요. 보고서가 이미 이메일로 전송됐을 수 있습니다. 중복 제거는 하지 않습니다.",
  privacyTitle: "자발적인 에이전트 피드백",
  privacyBody: "활성화되면 submit-feedback은 승인된 보고서, 접수 번호, 공개 서비스 버전, 제출 시각을 Cloudflare를 통해 관리자 이메일로 보내 사람이 검토하게 합니다. 가상 예시를 쓰고 실제 네트워크 데이터, 인증서, 비밀, 로그, 대화 기록은 제외하세요. 이메일 보관과 삭제는 수동으로 관리하며 보고서는 자동 만료되지 않습니다. Cloudflare Workers KV는 키를 사용하는 출구 IP 표식과 예약 시각만 별도로 보관하고 24시간 후 만료합니다. 보고서 본문이나 접수 번호와의 연결은 저장하지 않습니다. 표식은 보고서나 로그에 넣지 않습니다. 이메일을 삭제해도 한도는 복구되지 않습니다. 삭제를 원하면 접수 번호와 함께 관리자에게 이메일로 요청하세요. 보고서는 자동 공개되지 않습니다.",
} as const;
