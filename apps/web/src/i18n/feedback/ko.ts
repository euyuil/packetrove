export const feedbackCopy = {
  title: "선택적 에이전트 피드백",
  availability: "{{name}}은 기본적으로 비활성화된 선택적 MCP 지원 작업입니다. tools/list에 표시될 때만 사용하세요. 사람의 검토를 위해 비공개 보고서를 전송하며 웹사이트, Web API, CLI 제출은 지원하지 않습니다.",
  authorization: "사용자가 요청하거나 허용할 때만 제출하세요. 사용자가 제공하거나 승인한 보고서는 바로 보낼 수 있습니다. 새로 작성한 내용은 먼저 보여 주고 승인을 받으세요. 대화 기록을 첨부하거나 호출할 때마다 피드백을 요청하지 마세요.",
  inputs: "category는 bug, confusing_behavior, feature_request 중 하나입니다. summary는 필수이며 tool_name과 synthetic_reproduction은 선택 사항입니다. bug에는 expected와 actual, confusing_behavior에는 actual이 필요합니다. feature_request에는 expected를 넣을 수 있지만 actual과 error_code는 금지됩니다. summary는 유니코드 코드 포인트 {{summaryLimit}}개, expected/actual은 각각 {{descriptionLimit}}개, 재현 내용은 {{reproductionLimit}}개까지입니다. 선택적 error_code는 대문자 코드입니다. 알 수 없는 필드는 거부되며 직렬화한 인자는 8 KiB 이하여야 합니다.",
  limits: "관측된 출구 IP마다 지난 24시간 동안 {{ipLimit}}건까지 접수합니다. 같은 출구를 사용하는 클라이언트는 한도를 공유합니다. UTC 날짜마다 {{dailyLimit}}건, 저장된 보고서 {{reportLimit}}건의 제한도 있습니다. 계산과 조회에는 영향을 주지 않습니다.",
  delivery: "성공하면 accepted와 receipt_id를 반환하며 답변이나 수정을 보장하지 않습니다. 확실한 거부는 delivery: not_accepted를 반환합니다. 시간 초과, 취소 또는 DELIVERY_UNCERTAIN 뒤에는 자동 재전송하지 마세요. 보고서가 이미 저장되었을 수 있습니다. 중복 제거는 제공하지 않습니다.",
  privacyTitle: "자발적인 에이전트 피드백",
  privacyBody: "활성화하면 submit-feedback은 허용한 보고서와 공개 서비스 버전을 비공개 Cloudflare D1 대기열에 저장하여 사람이 검토합니다. 가상 예시를 사용하고 실제 네트워크 데이터, 인증서, 비밀, 로그, 대화 기록은 제외하세요. 보고서는 90일 후 만료되며 매시간 삭제합니다. 키를 사용해 만든 출구 IP 표식과 접수 시간은 지난 24시간의 한도 계산용으로 별도 저장하며 만료된 기록은 매시간 정리합니다. 보고서에 첨부하거나 로그에 남기지 않습니다. 보고서를 삭제해도 한도가 복구되지 않습니다. D1 복구 백업은 삭제된 자료를 추가로 최대 30일간 보유할 수 있습니다. 삭제 요청은 접수 번호를 포함해 관리자에게 이메일로 보내세요. 보고서는 자동 공개되지 않습니다.",
} as const;
