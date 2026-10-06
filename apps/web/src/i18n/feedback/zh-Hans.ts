export const feedbackCopy = {
  title: "可选的智能体反馈",
  availability: "{{name}} 是默认关闭的 MCP 支持操作，仅在 tools/list 列出时可用。它向维护者发送私密报告供人工处理；网站、Web API 和 CLI 不提供提交入口。",
  authorization: "仅在用户请求或授权反馈时提交。用户提供或已批准的报告可以直接发送。新起草的内容须先展示给用户确认。不要附带会话历史，也不要在每次调用后主动征求反馈。",
  inputs: "category 可选 bug、confusing_behavior 或 feature_request。必须填写 summary，可选 tool_name 和 synthetic_reproduction。bug 必须有 expected 和 actual；confusing_behavior 必须有 actual。feature_request 可有 expected，但不能有 actual 或 error_code。summary 最多 {{summaryLimit}} 个 Unicode 码点，expected/actual 各 {{descriptionLimit}} 个，复现内容 {{reproductionLimit}} 个。可选 error_code 使用大写代码。拒绝未知字段；序列化参数最多 8 KiB。",
  limits: "每个观察到的出口 IP 在过去 24 小时内最多成功提交 {{ipLimit}} 份报告，共用出口的客户端共用额度。服务还限制每个 UTC 自然日 {{dailyLimit}} 份、最多存储 {{reportLimit}} 份。反馈限制不影响计算和查询。",
  delivery: "成功返回 accepted 和 receipt_id，不承诺答复或修复。明确拒绝时返回 delivery: not_accepted。超时、取消或 DELIVERY_UNCERTAIN 后不要自动重试：报告可能已经存储。报告不做去重。",
  privacyTitle: "自愿提交的智能体反馈",
  privacyBody: "启用时，submit-feedback 将你授权的报告及公开服务版本存入私有 Cloudflare D1 队列，供人工处理。请使用虚构示例，不要包含真实网络数据、证书、秘密、日志或会话历史。报告在 90 天后过期，每小时清理。出口 IP 的带密钥摘要及成功提交时间单独保存，用于过去 24 小时的限额，每小时清理过期记录；它们不会附在报告上或写入日志。删除报告不恢复额度。D1 恢复备份可能额外保留已删除内容最多 30 天。如需删除，请将回执通过邮件提供给维护者。报告不会自动公开。",
} as const;
