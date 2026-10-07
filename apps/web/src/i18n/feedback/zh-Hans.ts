export const feedbackCopy = {
  title: "可选的智能体反馈",
  availability: "{{name}} 是默认关闭的 MCP 支持操作，仅在 tools/list 列出时可用。它将私密报告通过邮件发给维护者供人工处理；网站、Web API 和 CLI 不提供提交入口。",
  authorization: "仅在用户请求或授权反馈时提交。用户提供或已批准的报告可以直接发送。新起草的内容须先展示给用户确认。不要附带会话历史，也不要在每次调用后主动征求反馈。",
  inputs: "category 可选 bug、confusing_behavior 或 feature_request。必须填写 summary，可选 tool_name 和 synthetic_reproduction。bug 必须有 expected 和 actual；confusing_behavior 必须有 actual。feature_request 可有 expected，但不能有 actual 或 error_code。summary 最多 {{summaryLimit}} 个 Unicode 码点，expected/actual 各 {{descriptionLimit}} 个，复现内容 {{reproductionLimit}} 个。可选 error_code 使用大写代码。拒绝未知字段；序列化参数最多 8 KiB。",
  limits: "近似限额为每个观察到的出口 IP 在过去 24 小时内 {{ipLimit}} 次、全站每个 UTC 自然日 {{dailyLimit}} 次，共用出口的客户端共用额度。并发请求和 KV 同步延迟可能使任一限额被超过。投递不确定或额度释放失败时，标记会占用额度直至过期。反馈限制不影响计算和查询。",
  delivery: "成功返回 accepted 和 receipt_id，表示邮件服务已接受提交，不保证进入收件箱或被阅读，也不承诺答复或修复。明确拒绝时返回 delivery: not_accepted。超时、取消或 DELIVERY_UNCERTAIN 后不要自动重发：报告可能已通过邮件发送。报告不做去重。",
  privacyTitle: "自愿提交的智能体反馈",
  privacyBody: "启用时，submit-feedback 通过 Cloudflare 将你授权的报告、回执、公开服务版本和提交时间发到维护者邮箱，供人工处理。请使用虚构示例，不要包含真实网络数据、证书、秘密、日志或会话历史。邮件的保留和删除由维护者人工管理，报告不会自动过期。Cloudflare Workers KV 单独保存出口 IP 的带密钥摘要及预留时间，24 小时后自动过期，不保存报告正文或与回执的关联。摘要不会附在报告上或写入日志。删除邮件不恢复额度。如需删除，请将回执通过邮件提供给维护者。报告不会自动公开。",
} as const;
