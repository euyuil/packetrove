export const feedbackCopy = {
  title: "任意のエージェントフィードバック",
  availability: "{{name}} は既定で無効な任意の MCP サポート操作です。tools/list に表示される場合のみ利用できます。非公開の報告を人による確認のために送信します。ウェブサイト、Web API、CLI からの送信には対応していません。",
  authorization: "ユーザーの依頼または許可がある場合のみ送信してください。ユーザーが提供または承認した報告は直接送信できます。新しく作成した内容は先に表示して承認を得てください。会話履歴を添付したり、呼び出すたびに報告を求めたりしないでください。",
  inputs: "category は bug、confusing_behavior、feature_request です。summary は必須で、tool_name と synthetic_reproduction は任意です。bug には expected と actual、confusing_behavior には actual が必要です。feature_request は expected を指定できますが、actual と error_code は指定できません。summary は Unicode コードポイント {{summaryLimit}} 個、expected/actual は各 {{descriptionLimit}} 個、再現内容は {{reproductionLimit}} 個までです。任意の error_code は大文字のコードです。未知のフィールドは拒否され、シリアライズした引数は 8 KiB 以内です。",
  limits: "観測した出口 IP ごとに、直近 24 時間で {{ipLimit}} 件まで受理します。出口を共有するクライアントは枠も共有します。UTC の暦日ごとに {{dailyLimit}} 件、保存総数 {{reportLimit}} 件の上限もあります。計算や照会には影響しません。",
  delivery: "成功時は accepted と receipt_id を返しますが、回答や修正は保証しません。確実な拒否は delivery: not_accepted を返します。タイムアウト、キャンセル、DELIVERY_UNCERTAIN 後は自動再送しないでください。報告が保存済みの場合があります。重複排除は行いません。",
  privacyTitle: "任意に送信するエージェントフィードバック",
  privacyBody: "有効な場合、submit-feedback は許可された報告と公開サービスバージョンを非公開の Cloudflare D1 キューに保存し、人が確認します。架空の例を使い、実際のネットワークデータ、証明書、秘密情報、ログ、会話履歴は含めないでください。報告は 90 日後に期限切れとなり、毎時削除されます。鍵を用いた出口 IP の識別値と受理時刻は直近 24 時間の制限用に別途保存し、期限切れの記録を毎時削除します。報告への付記やログ出力は行いません。報告を削除しても枠は戻りません。D1 復旧用バックアップに削除した内容が最大でさらに 30 日間残る場合があります。削除希望は受領番号を添えて管理者へメールしてください。報告は自動公開されません。",
} as const;
