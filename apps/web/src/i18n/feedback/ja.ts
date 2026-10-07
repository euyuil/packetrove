export const feedbackCopy = {
  title: "任意のエージェントフィードバック",
  availability: "{{name}} は任意の MCP サポート操作で、既定では無効です。tools/list に表示される場合のみ使用してください。非公開のレポートをメールで管理者に送り、人が確認します。ウェブサイト、Web API、CLI からは送信できません。",
  authorization: "ユーザーの依頼または許可がある場合のみ送信してください。ユーザーが提供または承認した報告は直接送信できます。新しく作成した内容は先に表示して承認を得てください。会話履歴を添付したり、呼び出すたびに報告を求めたりしないでください。",
  inputs: "category は bug、confusing_behavior、feature_request です。summary は必須で、tool_name と synthetic_reproduction は任意です。bug には expected と actual、confusing_behavior には actual が必要です。feature_request は expected を指定できますが、actual と error_code は指定できません。summary は Unicode コードポイント {{summaryLimit}} 個、expected/actual は各 {{descriptionLimit}} 個、再現内容は {{reproductionLimit}} 個までです。任意の error_code は大文字のコードです。未知のフィールドは拒否され、シリアライズした引数は 8 KiB 以内です。",
  limits: "近似的な制限は、観測した出口 IP ごとに直近 24 時間で {{ipLimit}} 回、サービス全体で UTC の暦日ごとに {{dailyLimit}} 回です。出口を共有するクライアントは枠も共有します。同時リクエストや KV の同期遅延により、どちらの制限も超える場合があります。送信結果が不明な場合や枠の解放に失敗した場合は、期限まで枠を使います。計算や照会には影響しません。",
  delivery: "accepted と receipt_id はメールサービスが送信を受け付けたことを示し、受信トレイへの到着や閲覧は保証しません。返信や修正も約束しません。明確な拒否では delivery: not_accepted を返します。タイムアウト、キャンセル、DELIVERY_UNCERTAIN の後に自動再送しないでください。レポートがすでにメールで送信された可能性があります。重複排除は行いません。",
  privacyTitle: "任意に送信するエージェントフィードバック",
  privacyBody: "有効な場合、submit-feedback は承認されたレポート、受領番号、サービスの公開バージョン、送信時刻を Cloudflare 経由で管理者のメールに送り、人が確認します。架空の例を使い、実際のネットワークデータ、証明書、秘密、ログ、会話履歴を含めないでください。メールの保管と削除は手動で管理し、レポートは自動的に期限切れになりません。Cloudflare Workers KV は鍵付きの出口 IP マーカーと予約時刻だけを別に保存し、24 時間で期限切れになります。レポート本文や受領番号との関連は保存しません。マーカーはレポートにもログにも含めません。メールを削除しても枠は戻りません。削除依頼は受領番号を添えて管理者にメールしてください。レポートは自動公開しません。",
} as const;
