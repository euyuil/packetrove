import { certificateCopy } from '../certificate/ja';
import type { TranslationResource } from '../translation-resource';

export const ja = {
  languageSuggestion: {
    title: 'このページを日本語で表示しますか？',
    switch: '日本語に切り替える', dismiss: '今はしない',
  },
  certificate: certificateCopy.certificate,
  common: {
    pageLoading: "ページを読み込み中…", pageLoadFailure: "ページを読み込めませんでした。もう一度お試しください。", retryPage: "再試行",
    home: 'ホーム', homeLabel: 'Packetrove ホーム', navigation: 'メインナビゲーション',
    language: '言語', tools: 'IP アドレスツール', copied: 'コピー済み', dismissCopy: 'コピーエラーを閉じる',
    tagline: '人と AI エージェントのためのネットワークツール',
    source: 'GitHub で Packetrove を見る', sourceCommit: 'GitHub でコミット {{commit}} のソースコードを見る', sourceLicense: 'ソースコード：MIT',
    feedbackPrompt: '問題やアイデアがあれば、GitHub でお知らせください。', reportBug: '問題を報告', requestFeature: '機能を提案',
    notFound: 'ページが見つかりません', notFoundDescription: '指定されたページは存在しません。', returnHome: 'ホームに戻る',
  },
  "support": {
    "title": "サポート",
    "introduction": "Packetrove のウェブサイト、Web API、CLI、リモート MCP 接続についてのサポートです。アカウントや API キーは不要です。",
    "contactTitle": "メンテナーへの連絡",
    "contactBody": "個人のメンテナーが下記アドレスへのメールを確認します。非公開の相談、プライバシーに関する請求、セキュリティ上の報告はメールでご連絡ください。対応は時間の許す範囲で行い、返信期限は保証しません。",
    "publicTitle": "公開フィードバック",
    "publicBody": "再現可能な不具合や機能の提案は GitHub に投稿してください。投稿と添付資料は公開されます。認証情報、実際のパブリック IP 検索結果、非公開のネットワークデータを含めないでください。",
    "detailsTitle": "問題の再現に必要な情報",
    "detailsBody": "ツールとインターフェース、ブラウザーやクライアントのバージョン、手順、期待した結果、実際の結果やエラーコードを記載してください。架空の入力例を使い、ログや画面から機密情報を取り除いてください。",
    "guidesTitle": "接続ガイドとプライバシー",
    "guidesBody": "API と MCP のガイドで接続方法と入力の条件を確認できます。CLI ガイドは英語です。プライバシーポリシーにはリモート処理とサポートのやり取りについて記載しています。"
  },
  "terms": {
    "title": "利用規約",
    "updated": "最終更新：2026年10月4日。",
    "introduction": "本規約は、個人のメンテナーが運営する Packetrove のホスト型ウェブサイト、Web API、リモート MCP サービスに適用されます。これらの利用により、本規約に同意したものとします。",
    "sections": {
      "use": {
        "title": "適切な利用",
        "body": "適法に、処理する権限のあるデータのみでサービスを利用してください。文書に記載された入力制限を守り、サービスへの妨害、セキュリティ対策の回避、認証情報や秘密情報の入力を行わないでください。"
      },
      "results": {
        "title": "利用前の結果確認",
        "body": "ネットワークに適用する前に、利用者の責任で結果を確認してください。包含 CIDR はアドレスを追加する場合があり、計算上の空き範囲は実際の利用可能性を保証しません。パブリック IP 検索は呼び出し元の接続を観測するため、AI クライアントの出口アドレスの場合があります。Packetrove はネットワークやファイアウォールを設定しません。"
      },
      "availability": {
        "title": "可用性と責任",
        "body": "ホスト型サービスは現状のまま、利用可能な範囲で提供され、可用性、正確性、適合性を保証しません。変更、制限、停止する場合があります。法律で認められる範囲で、メンテナーは利用による損失について責任を負いません。適用法が除外を認めない権利や責任は、本規約によって除外されません。"
      },
      "license": {
        "title": "オープンソースライセンス",
        "body": "CLI を含む Packetrove のソースコードは、引き続き MIT ライセンスで利用できます。本規約は同ライセンスの許諾や表示を変更しません。第三者のコンポーネントには、それぞれのライセンスが適用されます。"
      },
      "privacy": {
        "title": "プライバシーと他のサービス",
        "body": "Packetrove のデータ処理はプライバシーポリシーに記載しています。利用者が選ぶ AI クライアント、GitHub、その他のサービスには、それぞれの規約とプライバシーポリシーがあります。"
      },
      "changes": {
        "title": "規約の変更",
        "body": "変更は更新日とともに本ページに掲載し、その後のホスト型サービスの利用に適用します。変更に同意できない場合は、ホスト型サービスの利用を停止してください。"
      }
    },
    "contactTitle": "お問い合わせ",
    "contactBody": "本規約については Packetrove のメンテナーにお問い合わせください。利用方法の相談はサポートページをご覧ください。"
  },
  privacy: {
    "title": "プライバシーポリシー",
    "updated": "最終更新：2026年10月4日。",
    "introduction": "本ポリシーは、AIプラグイン経由の利用を含むPacketroveのウェブサイト、Web API、CLI、リモートMCPサービスに適用されます。PacketroveはLiu Yueが管理しています。アカウントやAPIキーは不要です。",
    "cloudflarePolicy": "Cloudflareのプライバシーポリシー",
    "sections": {
        "correspondence": {
          "title": "サポートのやり取り",
          "body": "メールで連絡いただくと、メールアドレス、記載された氏名、メッセージを受け取ります。個人のメンテナーはこれらを返信や問い合わせのフォローに使用します。サポートのやり取りは通常、固定の期限を設けず長期保存します。削除を希望する場合はご連絡ください。メールはメールサービス内に保存されます。GitHub の報告と公開履歴は GitHub に保存され、同サービスの保存管理に従います。"
        },
        "local": {
            "title": "ローカル計算とブラウザーの保存領域",
            "body": "ブラウザーの計算とオフラインCLIの計算では、入力と結果は端末内に留まります。計算の下書きはページのメモリーに保持されます。サイトは現在のタブのsessionStorageに言語提案を処理済みであることを示すフラグだけを保存し、アドレスや結果は保存しません。結果をコピーすると、システムのクリップボードに入ります。"
        },
        "remote": {
            "title": "リモートツールの入力と結果",
            "body": certificateCopy.remotePrivacy
        },
        "connection": {
            "title": "公開IPの確認",
            "body": "公開IPの確認はCloudflareが提供する接続情報を読み取り、観測したアドレスを1つ返します。アプリケーションは確認履歴を保持せず、返したIPをログに記録しません。クラウド上のAIクライアントは自身の出口アドレスを観測する場合があります。端末の接続は、その端末のブラウザーやローカルCLIで確認してください。"
        },
        "logs": {
            "title": "アプリケーションの運用ログ",
            "body": "MCP ツールのコールバックが終了すると、固定のイベント名、ツール名、成功またはエラーの状態、失敗時の管理されたエラーコードを含む運用イベントが生成されます。これらを実行回数の集計とエラー診断に使用します。再試行は別々に数え、ツールの検出やコールバック前に拒否されたリクエストは含めません。予期しない HTTP エラーは固定のイベント名とエラーコードを生成します。これらのアプリケーションイベントには、入力、結果、返された IP アドレス、生のリクエストヘッダー、自動チェック用トークン、元の例外の詳細を含めません。ユーザープロファイルの作成、サイト間追跡、ツールデータの販売、広告利用、モデル学習への利用は行いません。イベントでは、検証済みの自動チェックとその他の公開呼び出しを区別します。検証済みのチェックでは、有効な形式の自動チェック実行識別子も記録する場合があります。"
        },
        "providers": {
            "title": "ホスティング、受信者、保持期間",
            "body": "Cloudflareがサービスをホストし、接続アドレス、ヘッダー、リモートツールの引数を含むリクエストを処理します。プラットフォームのログには、時刻、URL、リクエスト識別子、技術的なメタデータが付加される場合があります。有効にした運用者向けWorkers Logsは最大7日間参照できます。現在のFreeでは3日間で、2026年12月1日から7日間になると発表されています。これはCloudflareのすべてのネットワークやセキュリティの記録を7日以内に削除するという約束ではありません。Cloudflareのインフラ処理には同社のポリシーが適用され、国外で行われる場合があります。Packetroveの管理者はサービスの診断のために有効な運用ログへアクセスできます。"
        },
        "controls": {
            "title": "利用者の選択",
            "body": "計算の入力をリモートへ送信したくない場合は、ブラウザー計算やオフラインCLI計算を利用できます。公開IPの確認にはネットワークリクエストが必要です。プラグインを無効にするかMCP接続を削除すると、その後の呼び出しを停止できますが、AIクライアントが既に保持している結果は削除されません。アカウントに紐づく呼び出し履歴や、呼び出しごとのログ記録の解除機能は提供していません。"
        },
        "contact": {
            "title": "プライバシーに関する問い合わせと請求",
            "body": "プライバシーの質問や適用されるアクセス・削除請求は、下記のメールアドレスから管理者にご連絡ください。ツールの呼び出しはアカウントに紐づかないため、個別の呼び出しを特定できない場合があります。任意のメールやGitHubでの連絡は各サービス内に保持され、その保持管理が適用されます。公開GitHub issueには非公開のネットワークデータや秘密情報を記載しないでください。ポリシーの変更はこのページで公開します。"
        }
    }
},
  footer: {
    project: 'プロジェクト情報', integrations: '連携', contact: 'お問い合わせ・ご意見',
    apiDocumentation: 'API ドキュメント', cliGuide: 'CLI ガイド（英語）', sendEmail: 'メールを送信',
  },
  home: {
    certificateDescription: certificateCopy.homepage.description, certificateLink: certificateCopy.homepage.link,
    rangeDescription: "両端を含む開始・終了 IP を最小の正確な CIDR リストに変換します。ローカルで計算し、追加アドレスなしで全ブロックをコピーできます。",
    rangeLink: "IP 範囲の変換を開く",
    galleryTitle: "ツールを探す",
    galleryDescription: "左右の矢印を使うかカードをスワイプして例を確認し、必要なツールを開いてください。",
    galleryPrevious: "前のツール",
    galleryNext: "次のツール",
    galleryPosition: "{{total}} 件中 {{current}} 件目",
    previewLabel: "例",
    previewInputs: "入力例",
    ipPreview: "ドキュメント用のアドレスです。接続を確認するにはツールを開いてください。",
    integrationsTitle: "ワークフローに Packetrove を組み込む",
    apiIntroduction: "共通の JSON 契約を使い、HTTP クライアントからツールを呼び出します。",
    cliIntroduction: "ターミナルで最小包含 CIDR をローカル計算したり、接続を確認したりできます。",
    description: 'ブラウザー、ターミナル、AI エージェントで使えるオープンソースのネットワークツールです。ナビゲーションからツールを開くか、以下の手順で Packetrove をワークフローに組み込めます。',
    openSource: 'オープンソース', anonymous: 'アカウントや API キーは不要',
    cidrDescription: 'IPv4 または IPv6 のアドレスと範囲を含む、最小の単一 CIDR を求めます。ブラウザー内で計算し、正確なアドレス数と追加される範囲の説明を確認できます。',
    cidrLink: 'CIDR 計算器を開く',
    subtractDescription: '含めるアドレス空間から除外するネットワークを取り除きます。入力をアップロードせずに、WireGuard の例外設定用の正確な CIDR リストをコピーしたり、既知の割り当てを除いた空き範囲を確認したりできます。',
    subtractLink: 'CIDR 差分計算器を開く',
    ipDescription: '現在の接続で使われるパブリック IP を確認できます。VPN やプロキシを使う場合はその出口アドレスが表示され、ローカルのプライベートアドレスは表示されません。',
    ipLink: '自分のパブリック IP を確認',
    apiTitle: 'Web API', apiDescription: '任意の HTTP クライアントから Packetrove を呼び出せます。たとえば、curl で現在のパブリック IP を取得できます：',
    apiResponse: 'レスポンスは IP アドレスと末尾の改行で、<code>Content-Type: text/plain</code> として返されます。', apiGuide: 'API ガイドを読む',
    cliTitle: 'コマンドラインインターフェース', cliDescription: 'Node.js と pnpm を使ってソースコードからインストールします：',
    cliExample: '次に、現在のパブリック IP を表示します：', cliGuide: 'CLI ガイドを読む（英語）',
    mcpTitle: 'Model Context Protocol（MCP）', mcpDescription: 'Streamable HTTP で AI エージェントを Packetrove に接続できます。認証やローカルサーバーは不要です。',
    serverAddress: 'サーバーアドレス', mcpExample: 'クライアントをインストールしたら、サーバーを追加します：',
    mcpCheck: 'クライアントで <code>/mcp</code> を使って接続を確認できます。パブリック IP の確認では、エージェントが使用する接続のアドレスが表示されます。', mcpGuide: "MCP 接続ガイドを読む",
  },
  cidr: {
    title: '最小の集約 CIDR', description: 'IPv4 または IPv6 のアドレスと範囲を、すべてを含む最小の単一 CIDR にまとめます。',
    local: 'ブラウザー内で計算 · API リクエストなし', addresses: '入力するアドレス', inputLabel: 'IP アドレスまたは CIDR 範囲',
    inputHelp: 'カンマ、スペース、タブ、改行で区切れます。1 回の計算では IPv4 または IPv6 のどちらか一方を使います。最大 {{maximum}} 件です。',
    entryCount_other: '{{total}} 件', clear: 'クリア', example: '例を試す', calculate: '集約 CIDR を計算',
    result: '集約結果', resultLabel: '最小の集約 CIDR', copy: 'CIDR をコピー',
    copySuccess: 'CIDR をコピーしました。', copyFailure: 'クリップボードを利用できません。上の CIDR を選択してコピーしてください。',
    first: '最初のアドレス', last: '最後のアドレス', unique: '入力内の重複しないアドレス数', covered: '集約範囲のアドレス数', additional: '追加されるアドレス数',
    exact: '完全に一致：この CIDR による追加アドレスはありません。',
    expansion: 'この CIDR を適用すると、リストで許可またはブロックするアドレスの範囲が広がります。',
    normalized: '正規化した入力（{{total}}）', emptyTitle: '計算結果はここに表示されます',
    emptyDescription: 'アドレスを入力すると、集約 CIDR、アドレス範囲、追加される範囲を確認できます。',
    explanationTitle: '集約範囲について',
    explanation: '使用できる最長のプレフィックスが、すべての入力を含む最小の単一範囲を表します。この範囲には元の入力にないアドレスも含まれる場合があります。重複するアドレスは 1 回だけ数え、ホスト部に値がある CIDR はネットワークアドレスに正規化します。',
    countExplanation: '範囲内のすべてのアドレスを数えます。ネットワークアドレスとブロードキャストアドレスも含まれます。許可リストやブロックリストで結果を使う前に、追加される範囲を確認してください。',
    examplesTitle: 'CIDR の計算例', exactExample: 'IPv4 の完全一致', expandedExample: 'IPv4 の追加範囲', ipv6Example: 'IPv6 の完全一致',
    limits: '個々のアドレスまたは CIDR 範囲を、最大 {{maximum}} 件入力できます。1 回の計算で IPv4 と IPv6 を混在させることはできません。非常に大きな範囲でも、IPv6 のアドレス数は正確に計算されます。',
    exampleResult: '{{cidr}} は {{covered}} 個のアドレスを含み、{{additional}} 個を追加します。',
    line: '{{line}} 行目：{{message}}',
    lineEntry: '{{line}} 行目、{{entry}} 番目の項目：{{message}}',
  },
  subtract: {
    normalizedInclude: "正規化した含める入力（{{total}} 件）",
    normalizedExclude: "正規化した除外する入力（{{total}} 件）",
    normalizedHelp: "各入力を個別に正規化します。入力順序、重複した項目、入れ子の範囲は保持されます。",
    noExcludedInputs: "除外する入力はありません。",
    title: 'CIDR の差分',
    description: '含める IPv4 または IPv6 のアドレス空間から、除外するネットワークを取り除きます。余分なアドレスを含まない、最小の正確な CIDR リストを取得できます。',
    inputs: 'アドレスリスト',
    include: '含めるリスト',
    exclude: '除外するリスト',
    includeLabel: '含める IP アドレスまたは CIDR',
    excludeLabel: '除外する IP アドレスまたは CIDR',
    includeHelp: 'カンマ、スペース、タブ、改行で区切れます。少なくとも 1 つのアドレスまたは範囲を含めてください。',
    excludeHelp: 'カンマ、スペース、タブ、改行で区切れます。空欄の場合はアドレスを削除せず、含めるリストを最小限にまとめます。',
    calculate: 'CIDR の差分を計算',
    result: '残りのアドレス空間',
    output: '残りの CIDR',
    included: '含めたアドレス数',
    removed: '削除したアドレス数',
    remaining: '残りのアドレス数',
    blocks: '結果の CIDR 数',
    completed: '計算が完了しました。残りのアドレス数：{{addresses}}。CIDR 数：{{cidrs}}。',
    copyList: '改行区切りでコピー',
    copyAllowed: 'カンマ区切りでコピー',
    copySuccess: '改行区切りでコピーしました。',
    allowedSuccess: 'カンマ区切りでコピーしました。',
    copyFailure: 'クリップボードを利用できません。上のリストを選択してコピーしてください。',
    formats: '改行区切りでは CIDR を1行に1つずつ配置します。カンマ区切りでは CIDR の間にカンマとスペース1つを入れます。',
    emptyTitle: '残りのアドレスはありません',
    emptyDescription: '除外リストにより、含めたすべてのアドレスが削除されました。コピーできる CIDR リストはありません。',
    pendingTitle: 'ここに結果が表示されます',
    pendingDescription: '含めるリストと任意の除外リストを入力すると、残りの範囲を正確に計算できます。',
    explanationTitle: '結果の意味',
    explanation: '含める範囲の和集合から、除外範囲の和集合を取り除きます。重複するアドレスは 1 回だけ数え、ホスト部を正規化し、アドレスを追加しません。ネットワークアドレスやブロードキャストアドレスを含む、範囲内のすべてのアドレスを数えます。',
    review: 'WireGuard の例外設定や、既知の割り当て後に残る範囲の確認に使えます。残りの範囲は入力に基づくもので、実際のネットワークでアドレスが未使用であることを示しません。適用する前にリストを確認してください。',
    limits: '両方のリストで同じアドレスファミリーを使用し、合計 {{inputs}} 件まで、各入力は {{length}} 文字以内にしてください。結果は {{outputs}} 件の CIDR までです。超えた場合はエラーになり、結果の一部だけを返すことはありません。',
    examplesTitle: '差分の計算例',
    example: '{{include}} から {{exclude}} を取り除く：',
    line: '{{list}}の {{line}} 行目：{{message}}',
    lineEntry: '{{list}}の {{line}} 行目、{{entry}} 番目の項目：{{message}}',
    listIssue: '{{list}}：{{message}}',
    outputLimitTitle: '結果の CIDR が多すぎます。',
  },
  range: {
    "title": "IP 範囲を CIDR に変換",
    "description": "両端を含む IPv4 または IPv6 の範囲を、余分なアドレスを追加せず最小の正確な CIDR リストに変換します。",
    "inputs": "IP アドレス範囲",
    "start": "開始 IP",
    "end": "終了 IP",
    "startHelp": "最初に含めるアドレス。CIDR プレフィックスのない IPv4 または IPv6 アドレスを 64 文字以内で入力します。",
    "endHelp": "最後に含めるアドレス。開始 IP と同じ種類で、開始 IP 以上のアドレスを 64 文字以内で入力します。",
    "calculate": "範囲を CIDR に変換",
    "result": "正確な範囲の結果",
    "output": "正確な CIDR リスト",
    "addresses": "範囲内のアドレス数",
    "completed": "計算完了。アドレス数: {{addresses}}。CIDR 数: {{cidrs}}。",
    "pendingDescription": "両端のアドレスを入力すると、正確な CIDR リストとアドレス数が表示されます。",
    "explanation": "両端のアドレスを含みます。結果はこの範囲だけを正確に覆う最小の CIDR リストで、ネットワークアドレス順に並び、隙間・重複・追加アドレスはありません。単一の包含 CIDR は範囲外のアドレスを含む場合があります。IPv4 のネットワークアドレスとブロードキャストアドレスも数え、大きな IPv6 範囲でも正確です。",
    "examplesTitle": "IP 範囲の例",
    "example": "両端を含む範囲: {{start}} から {{end}}。",
    "issue": "{{field}}: {{message}}",
    "emptyEndpoint": "IPv4 または IPv6 アドレスを 1 つ入力してください。",
    "invalidEndpoint": "CIDR プレフィックスのない標準の IPv4 または IPv6 アドレスを使用してください。ゾーン識別子と IPv4 の先頭ゼロには対応していません。",
    "endpointCidr": "CIDR プレフィックスのない IP アドレスを入力してください。",
    "reversedRange": "終了 IP は開始 IP 以上にしてください。両端を自動で入れ替えることはありません。",
    "expectedFamily": "開始 IP と同じ {{family}} を使用してください。"
  },
  ip: {
    title: '自分のパブリック IP', description: '現在の Packetrove への接続で使われるパブリック IP アドレスを確認します。',
    online: 'オンラインで確認 · アプリは結果を保存しません', connection: '現在の接続', checking: 'パブリック IP を確認しています…',
    resultLabel: 'パブリック IP アドレス', copy: 'IP をコピー', copySuccess: 'IP アドレスをコピーしました。',
    copyFailure: 'クリップボードを利用できません。上の IP アドレスを選択してコピーしてください。', checkingButton: '確認中…', retry: '再試行', refresh: 'IP を再取得',
    explanationTitle: 'このアドレスが表すもの',
    explanation: 'これは、このリクエストで Packetrove が確認したアドレスです。VPN やプロキシを使用している場合は、その出口のアドレスになります。ブラウザーとコマンドラインツールは異なるネットワーク経路を使うことがあります。',
    familyExplanation: '1 つの接続で使われるのは IPv4 または IPv6 のどちらかです。この確認で表示するのはその接続のアドレスで、両方のアドレスやローカルのプライベートアドレスは取得できません。ネットワークやプロキシの設定を変更したら、再取得してください。',
  },
  api: {
    certificateSummary: certificateCopy.apiSummary,
    examplesTitle: 'エンドポイントの概要と例',
    rangeSummary: "同じアドレス種別の start と end を送信します。両端を含み、正規化した端点、最小の正確な CIDR リスト、CIDR 数、十進数文字列のアドレス数を返します。このリクエストは入力をサーバーに送信します。",
    rangeResponse: "この例は {{cidrs}} を返し、正確に {{addresses}} 個のアドレスを表します。",
    title: 'API ドキュメント', loading: 'API ドキュメントを読み込んでいます…', specification: 'OpenAPI 仕様',
    unavailableTitle: 'API ドキュメントを表示できません',
    unavailableDescription: 'ドキュメントの読み込みまたは表示に失敗しました。計算器に戻っても、入力、結果、検証エラーは保持されます。',
    returnToCalculator: '計算器に戻る',
    description: 'エンドポイントの確認、リクエスト例のコピー、API の試用ができます。アカウントや API キーは不要です。リクエストを送ると、その入力が API に送信されます。パブリック IP の確認ではブラウザーの接続を確認します。',
    englishReference: '対話型リファレンスと仕様は英語です。',
    cidrSummary: 'IPv4 または IPv6 のアドレスと CIDR 範囲を JSON で送信します。レスポンスには最小の集約 CIDR、正規化した入力、十進数文字列で表す正確なアドレス数が含まれます。この API リクエストでは入力をサーバーに送信します。',
    cidrResponse: 'この例では {{cidr}} を返し、{{additional}} 個のアドレスが追加されます。許可リストやブロックリストで結果を使う前に、additionalAddressCount を確認してください。',
    ipSummary: 'この HTTP 接続で確認されたパブリック IP を返します。アドレスと末尾の改行には text/plain、アドレスとアドレスファミリーには application/json を指定します。レスポンスはキャッシュされません。VPN やプロキシを使うと、確認される出口アドレスが変わります。',
    subtractSummary: "include から exclude を正確に差し引きます。最小の正規 CIDR 一覧と正確な十進文字列のアドレス数を返します。この API は入力をサーバーへ送信します。",
    subtractResponse: "この例は {{cidrs}} を返し、残りは {{remaining}} アドレスです。余分な範囲は追加しません。",
  },
  discovery: {
    certificate: certificateCopy.discovery,
    range: {
      "title": "IP 範囲変換の質問",
      "mcpTitle": "MCP で IP 範囲を変換",
      "purpose": "両端を含む IP 範囲を最小の正確な CIDR リストで表すよう AI エージェントに依頼します。",
      "inputs": "start と end に同じ種類の IPv4 または IPv6 アドレスを指定します。CIDR プレフィックスなしで各 {{maximumLength}} 文字以内、end は start 以上にしてください。",
      "result": "正規化された range.first と range.last、並べ替えた cidrs、cidrCount、正確な十進数文字列 addressCount を読み取ります。同じ端点は /32 または /128、全アドレス空間は /0 になります。エラーは start または end を示します。",
      "boundary": "ブラウザーはローカルで計算します。API とリモート MCP は端点をサーバーに送信します。実際の割り当てを調べたり、ファイアウォール・ルーティング・VPN 設定を変更したりしません。CLI では範囲変換は利用できません。",
      "openTool": "ブラウザーで範囲変換を開く",
      "questions": {
        "exact": {
          "question": "単一の包含 CIDR との違いは？",
          "answer": "このリストは両端を含む範囲だけを表し、余分なアドレスを含みません。単一の包含 CIDR は開始より前や終了より後のアドレスを含む場合があります。許可リストを指定範囲に正確に合わせるときはこの変換を使います。"
        },
        "order": {
          "question": "同じ端点や逆順の端点は使えますか？",
          "answer": "同じ端点はホスト CIDR を 1 つ返します。IPv4 は /32、IPv6 は /128 です。逆順はエラーになり、自動で入れ替えません。両端は同じ種類の IP アドレスで、CIDR プレフィックスを付けないでください。"
        },
        "counts": {
          "question": "どのアドレスを数えますか？",
          "answer": "両端を含むすべてのアドレスを数え、IPv4 のネットワークアドレスとブロードキャストアドレスも含みます。IPv6 の全空間でも正確で、個別に列挙しません。"
        },
        "privacy": {
          "question": "端点はどこに送信されますか？",
          "answer": "ブラウザー計算は端末のメモリ内に保持され、アップロード・永続化・ログ記録・URL への入力追加を行いません。Web API とリモート MCP は端点をサーバーに送信します。ウェブサイト、Web API、MCP で利用できます。"
        }
      }
    },
    subtract: {
      title: "CIDR 差分のよくある質問",
      mcpTitle: "MCP で CIDR 差分を使う",
      purpose: "AI エージェントに、含めるアドレス空間から除外ネットワークを差し引き、正確な残りの CIDR 一覧を返すよう依頼します。",
      inputs: "同じアドレスファミリーの include と exclude 配列を渡します。include は空にできません。exclude は空でも構いません。合計 {{maximumInputs}} 件まで、各項目は {{maximumLength}} 文字までです。",
      result: "cidrs と、正確な十進文字列の includedAddressCount、removedAddressCount、remainingAddressCount を読み取ります。全削除は空の一覧を返します。{{maximumOutputs}} CIDR を超える結果は部分一覧なしでエラーになります。",
      boundary: "リモート API と MCP は入力をサーバーへ送信し、ブラウザーはローカルで計算します。残りの範囲は入力に対する差分で、実際の空き状況は証明しません。WireGuard やファイアウォール設定は変更しません。",
      openTool: "ブラウザーの差分ツールを開く",
      questions: {
        wireguard: {
          question: "WireGuard の AllowedIPs に例外を設けるには？",
          answer: "トンネルに通したい範囲を包含リストに、例外を除外リストに入力します。「カンマ区切りでコピー」で、正確な残りの CIDR を WireGuard の AllowedIPs 設定値としてコピーできます。適用前に確認してください。Packetrove は WireGuard の設定やルートの変更を行いません。"
        },
        remaining: {
          question: "残りの範囲はアドレスが未使用であることを証明しますか？",
          answer: "入力した包含・除外リストに対する空き範囲を示します。実際のネットワーク使用状況を調べたり、指定サイズのサブネットを検索したりはしません。"
        },
        outside: {
          question: "除外範囲が重複したり、包含範囲の外にある場合は？",
          answer: "各リストの重複は一度だけ数えます。包含リストにもあるアドレスだけを除去し、範囲外の除外は影響しません。全除去も成功で、空の CIDR リストと残りのアドレス数ゼロを返します。"
        },
        covering: {
          question: "差分と集約 CIDR はどう違いますか？",
          answer: "差分は包含リストの和集合から除外リストの和集合を引いた範囲を、間隙も含めて正確に保持します。アドレスを追加せず、正規化して並べた最小個数の CIDR リストを返します。単一の集約 CIDR は追加のアドレスを含む場合があります。"
        },
        access: {
          question: "MCP、Web API、CLI から差分を呼び出せますか？",
          answer: "差分はウェブサイト、Web API、MCP で利用できます。ブラウザーの入力はローカルに留まり、API と MCP はサーバーへ送信します。CLI は現在、差分に対応していません。"
        }
      }
    },
    cidr: {
      title: "集約 CIDR に関するよくある質問",
      mcpTitle: "MCP から計算ツールを使う",
      purpose: "選択したファイアウォールの許可リストや拒否リストの項目を覆う単一 CIDR を AI エージェントに計算させ、追加範囲を確認できます。",
      inputs: "IPv4 または IPv6 のアドレスまたは CIDR を 1～{{maximumInputs}} 件、各 {{maximumLength}} 文字以内で受け付けます。1 回の呼び出しでは同じアドレスファミリーを使います。",
      result: "cidr と range で対象ネットワークを確認し、ルールに適用する前に additionalAddressCount を確認してください。IPv6 の精度を保つため、アドレス数はすべて十進数の文字列です。",
      boundary: "リモート MCP 呼び出しでは入力をサーバーに送信します。Web 計算はブラウザー内で実行します。このツールは単一 CIDR を計算します。リスト全体の項目数制限を満たす複数の集約には、別途目標の定義が必要です。ファイアウォールのルールは変更しません。",
      openTool: "ブラウザーの計算ツールを開く",
      questions: {
        firewall: {
          question: "ファイアウォールの IP リストの項目を減らすには？",
          answer: "選択した項目を一つの CIDR に集約します。追加されるアドレスを先に確認してください。許可リストでは追加で許可され、拒否リストでは追加で拒否されます。"
        },
        covering: {
          question: "単一 CIDR は元のアドレス集合と完全に一致しますか？",
          answer: "元の和集合が CIDR 全体を埋める場合に限ります。それ以外では最小の単一 CIDR でもアドレスが追加されます。Packetrove は追加範囲を示しますが、リスト全体に対する最適な集約の組み合わせは選びません。"
        },
        overlap: {
          question: "重複する範囲や入力はどのように数えますか？",
          answer: "元の和集合の各アドレスを一度だけ数えます。ホスト部が設定された CIDR はネットワークアドレスに正規化します。normalizedInputs は重複項目を保持しますが、アドレス数は増えません。"
        },
        counts: {
          question: "非常に大きな IPv6 範囲も正確に数えられますか？",
          answer: "はい。ブラウザーは正確な整数を使い、API と MCP は十進数の文字列を返します。IPv4 のネットワークアドレスとブロードキャストアドレスを含め、ルールが覆うすべてのアドレスを数えます。一回の計算では一つのアドレスファミリーを使います。"
        },
        privacy: {
          question: "計算の入力はどこへ送信されますか？",
          answer: "Web 計算はブラウザー内で実行し、入力を API に送信しません。下書きはこのタブのメモリーに保持します。ローカル CLI はオフラインで計算でき、Web API とリモート MCP は入力をサーバーに送信します。"
        }
      }
    },
    ip: {
      title: "パブリック IP に関するよくある質問",
      mcpTitle: "MCP から接続を確認する",
      purpose: "MCP ツール呼び出しを行う接続のパブリック IP を AI エージェントで確認できます。",
      inputs: "空のオブジェクト {} を渡します。ツールはリクエストの接続を確認するため、検索対象の IP アドレスは受け付けません。",
      result: "例は文書用のアドレスです。実際の呼び出しでは、そのリクエストで観測した ip と family が返り、family は ipv4 または ipv6 です。",
      boundary: "ホスト型 AI クライアントは自身の出口アドレスを返す場合があります。ブラウザーの接続にはこの Web ツールを使い、端末の接続にはそのコンピューター上で CLI を実行してください。一回の呼び出しで両方のファミリー、ローカルのプライベート IP、プロキシ前の IP を検出することはできません。結果は本人確認には使えません。",
      openTool: "ブラウザーのパブリック IP を確認",
      questions: {
        address: {
          question: "このページにはどの IP が表示されますか？",
          answer: "Packetrove が現在のブラウザーリクエストで観測したパブリックアドレスです。ローカルのプライベート IP ではなく、デバイスの識別にも使えません。"
        },
        vpn: {
          question: "VPN やプロキシを使うと何が変わりますか？",
          answer: "その接続が使う出口アドレスが表示されます。ネットワーク、VPN、プロキシの設定を変えたら再取得してください。プロキシ前のアドレスは表示しません。"
        },
        family: {
          question: "一回の確認で IPv4 と IPv6 の両方が分かりますか？",
          answer: "いいえ。一つのリクエストでは一つのアドレスファミリーを観測します。取得に成功しても両方のファミリーでの接続性は証明できません。"
        },
        client: {
          question: "AI エージェントや CLI と IP が違うのはなぜですか？",
          answer: "各インターフェースはリクエストを行う接続を観測します。ホスト型 MCP クライアントはブラウザーとは別のネットワークを使う場合があります。確認したいネットワーク経路上で Web ツールや CLI を実行してください。"
        },
        privacy: {
          question: "IP の結果は保存やキャッシュされますか？",
          answer: "アプリは表示用の現在の結果だけをメモリーに保持し、履歴やアドレスのログを保存しません。結果とエラーはキャッシュしません。ホスティング基盤はその設定に従ってリクエストを処理します。"
        }
      }
    }
  },
  mcp: {
    identityTitle: "サーバーの識別情報",
    identityExplanation: "サーバーはリリースバージョンとともに、以下のサービス識別情報を提供します。各ツールの名前、説明、スキーマは tools/list で個別に一覧表示されます。",
    identityPresentation: "タイトル、説明、Web サイト、アイコンを表示するかどうかはクライアントが決め、任意のフィールドを無視する場合もあります。プロトコルでの検出成功は、クライアントがこれらの情報を表示することを意味しません。PNG アイコンは 32×32 で、テーマの制限はありません。",
    navigation: "MCP ガイド",
    sdkTitle: "Node.js の例を実行する",
    sdkDescription: "新しいディレクトリで、下のコードを <code>packetrove-example.mjs</code> として保存し、コマンドを実行します。例は <code>@modelcontextprotocol/client@{{version}}</code> を使い、ツールを検出して文書用アドレスで CIDR ツールを呼び出します。",
    sdkLocal: "ローカル開発では <code>pnpm dev:api</code> を起動し、例のサーバー URL を <code>{{localUrl}}</code> に置き換えてください。",
    httpErrors: "業務エラーは共通のエラー JSON を返します。MCP SDK がプロトコルを検証します。不正な JSON、未対応のメディア形式、過大な本文は HTTP 層で拒否されます。",
    deploymentTitle: "デプロイと接続の制限",
    serverBehavior: "サーバーは新しいステートレス要求と、従来の Streamable HTTP の初期化、検出、呼び出しに対応します。永続セッションや独立したサーバーイベントストリームは提供しません。",
    operationalLogging: "ツール名、成功またはエラー、管理されたエラーコード、呼び出し元の分類を含む運用イベントで実行回数を集計します。検証済みの自動チェックでは実行識別子も記録する場合があります。入力、結果、取得したアドレス、生のリクエストヘッダー、自動チェック用トークンは含めません。Cloudflare がリクエストのメタデータを追加する場合があります。データ処理と保持期間はプライバシーポリシーをご確認ください。",
    connectionPrivacy: "公開 IP の接続情報は呼び出しごとに読み取られ、同時接続するクライアントのサーバーインスタンスは分離されます。MCP の結果とエラーは Cache-Control: no-store, no-transform を使用します。アプリは照会アドレスを保存・記録しません。",
    toolMigration: "旧ツール名に互換エイリアスはありません：{{toolRenames}}。ツール検出と保存済みの呼び出しを更新してください。",
    endpointMigration: "ウェブサイトの <code>/mcp</code> はサービスではなく、GET は 404、POST は 405 を返し、呼び出しを転送しません。クライアントには <code>{{serverUrl}}</code> を設定してください。独自デプロイではドメインと、Host およびブラウザー Origin の個別の完全一致許可リストを更新します。Origin ヘッダーのないクライアントも対応します。",
    deploymentGuide: "デプロイ、セルフホスティング、本番確認",
    registryGuide: "MCP Registry への公開とバージョン方針",
    title: "Packetrove を AI エージェントに接続する",
    explanation: "互換性のある MCP クライアントを接続して Packetrove のネットワークツールを利用します。以下の設定を済ませてから、ツールの例を参照してください。",
    connection: "Streamable HTTP · アカウントや API キーは不要",
    connectTitle: "クライアントを接続する",
    connectDescription: "Claude Code または Codex をインストールしたら、このリモートサーバーを追加してください。以下のコマンドはクライアントを設定し、ローカルの Packetrove サーバーはインストールしません。",
    clientGuide: "{{client}} の MCP 公式ドキュメント",
    check: "クライアントで <code>/mcp</code> を使って接続を確認します。次のツールが利用可能か確認してください：<code>{{tools}}</code>。",
    discovery: "設定後、クライアントは tools/list でツールを検出し、説明とスキーマに基づいてツールと引数を選びます。Web ページを読むだけではクライアントの設定やアクセス権の付与は行われません。",
    toolName: "ツール名",
    arguments: "引数の例",
    exampleResult: "文書用アドレスを使った結果の例",
    errorsTitle: "結果の読み取りとエラー処理",
    results: "<code>structuredContent</code> またはテキストブロックの JSON を読み取ってください。アドレス数は十進数の文字列か任意精度整数として保持してください。大きな IPv6 の値を浮動小数点数に変換すると精度が失われます。",
    resourceLinkLabel: "成功した応答に含まれる任意のツールページリンク",
    resultLinks: "成功した応答は <code>structuredContent</code> と最初の JSON テキストブロックに結果を保持し、英語のツールページへの任意の <code>resource_link</code> を追加します。リンクには入力や結果を含めず、計算内容を復元しません。表示、無視、リンクを開くかどうかはクライアントが決定し、自動表示や引用は保証されません。公開 IP ページを開くとブラウザの新しい接続を確認するため、MCP クライアントの接続とは異なる場合があります。エラー応答にツールページリンクは含まれません。",
    errors: "<code>isError</code> が true の場合は再試行前にエラー JSON を確認してください。ユーザーの情報で <code>INVALID_INPUT</code> と <code>MIXED_ADDRESS_FAMILIES</code> を修正します。<code>CLIENT_IP_UNAVAILABLE</code> は信頼できる接続情報がないことを示すため、アドレスを推測しないでください。",
    technicalGuide: "リポジトリの MCP 技術ガイドを読む（英語）"
  },
  errors: {
    invalidInput: '計算に使用できない入力です。', mixedFamilies: '1 回の計算では IPv4 または IPv6 のどちらか一方を使ってください。',
    invalidJson: 'リクエストには有効な JSON が必要です。', payloadTooLarge: 'リクエストが大きすぎます。', unsupportedMediaType: 'リクエストのコンテンツタイプはサポートされていません。',
    notFound: '指定されたリソースは存在しません。', methodNotAllowed: 'このリクエストメソッドはサポートされていません。',
    internal: '操作を完了できませんでした。もう一度お試しください。', ipUnavailable: '接続のメタデータを取得できません。もう一度お試しください。',
    network: 'IP 確認サービスに接続できません。接続を確認して、もう一度お試しください。', invalidResponse: 'IP 確認サービスから無効なレスポンスが返されました。もう一度お試しください。',
    invalidAddress: '標準の IPv4 または IPv6 アドレスを入力してください。有効な CIDR プレフィックスも指定できます。ゾーン識別子や IPv4 の先頭のゼロはサポートされていません。',
    emptyInputs: 'IP アドレスまたは CIDR 範囲を少なくとも 1 件入力してください。', tooManyInputs: '1 回の計算で入力できるのは最大 {{limit}} 件です。',
    inputTooLong: '各入力は {{limit}} 文字以内にしてください。', expectedFamily: '最初の入力に合わせて {{family}} を使ってください。',
    tooManyOutputs: '結果全体が {{limit}} 件の CIDR を超えています。除外項目を減らすか、含める範囲を小さくしてください。結果の一部だけを返すことはありません。',
  },
  meta: {
    certificate: certificateCopy.meta,
    support: {"title":"Packetrove サポート","description":"Packetrove のメンテナーへの連絡、安全な問題報告、API・MCP・CLI ガイドとプライバシー情報。"},
    terms: {"title":"Packetrove 利用規約","description":"Packetrove のホスト型サービスの利用条件、結果の制限、可用性、プライバシー、MIT ライセンスを説明します。"},
    privacy: {"title": "Packetrove プライバシーポリシー", "description": "Packetroveのローカル計算、リモート入力、接続アドレス、運用ログ、ホスティングデータの処理と、保持期間および利用者の選択について説明します。"},
    range: {
      "title": "IP 範囲から CIDR への変換 — Packetrove",
      "description": "両端を含む IPv4・IPv6 範囲をローカルで最小の正確な CIDR リストに変換。全ブロックをコピーし、追加アドレスなしで正確な数を確認できます。"
    },
    mcp: {"title": "Packetrove MCP ガイド", "description": "MCP で対応する AI クライアントを Packetrove に接続できます。接続設定、ツールの検出、引数、構造化された結果、エラー処理を確認できます。API キーは不要です。"},
    home: { title: 'Packetrove — 人と AI エージェントのためのネットワークツール', description: '開発者と AI エージェント向けのオープンソースのネットワークツール。Web で利用するほか、API、CLI、MCP で作業フローに組み込めます。アカウントは不要です。' },
    cidr: { title: '最小の集約 CIDR 計算器 — Packetrove', description: 'IPv4 または IPv6 のアドレスと範囲を含む最小の単一 CIDR を求めます。ブラウザー内で正確なアドレス数、追加範囲、計算例を確認できます。' },
    subtract: { title: 'CIDR 差分計算器 — Packetrove', description: 'IPv4 または IPv6 の CIDR リストの差分をブラウザー内で計算します。WireGuard AllowedIPs 用の正確な最小リストをコピーしたり、既知の割り当て後の残りの範囲を確認したりできます。' },
    ip: { title: '自分の IP は？ パブリック IP 確認 — Packetrove', description: '現在の接続で使われる IPv4 または IPv6 のパブリック IP を確認し、VPN やプロキシの出口アドレスについて理解できます。アカウントは不要です。' },
    api: { title: 'Packetrove API ドキュメント', description: '公開 HTTP API で Packetrove のネットワークツールをアプリやスクリプトに組み込めます。エンドポイント、リクエスト例、構造化レスポンス、OpenAPI を確認できます。API キーは不要です。' },
    notFound: { title: 'ページが見つかりません — Packetrove', description: 'この Packetrove のページは存在しません。ホームに戻ってネットワークツールをご利用ください。' },
    imageAlt: 'Packetrove の立方体ロゴ、プロジェクト名、英語のスローガン Network tools for humans and agents。',
  },
} satisfies TranslationResource;
