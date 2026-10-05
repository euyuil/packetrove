export const certificateCopy = {
  "certificate": {
    "title": "証明書バンドル検査",
    "description": "PEM 証明書、発行者候補と根拠に基づく次の手順を確認します。",
    "local": "ブラウザー内で検査 · 証明書と結果はページのメモリー内のみ",
    "scopeTitle": "検査範囲",
    "scope": "解析、重複、有効期間、候補の署名、CA と keyCertSign 制約、任意の DNS ホスト名を検査します。完全な RFC 5280 パス、クライアントの信頼、失効や配備の安全性は検証しません。",
    "inputs": "証明書の入力",
    "samplesLabel": "合成証明書の例",
    "loadSample": "例を試す",
    "samplesHelp": "公開された合成証明書バンドルを選んで入力欄に読み込みます。その後「証明書バンドルを検査」で検査してください。",
    "closeExamples": "例を閉じる",
    "evidenceTitle": "根拠",
    "file": {
      "status": "ファイルの読み込み",
      "choose": "PEM ファイルを選択",
      "help": "PEM テキストを貼り付けるか、証明書ファイルを1つここにドロップしてください。ファイルはブラウザー内でのみ読み取ります。",
      "reading": "ファイルを読み取り中…",
      "imported": "ファイルを読み込みました。内容を確認してから証明書バンドルを検査してください。",
      "errorTitle": "ファイルを読み込めませんでした",
      "errors": {
        "FILE_COUNT": "証明書バンドルを含むファイルを1つ選択してください。",
        "FILE_ENCODING": "PEM 証明書を含む UTF-8 テキストファイルを使用してください。",
        "FILE_READ_FAILED": "ファイルを読み取れませんでした。再度選択するか、内容を貼り付けてください。"
      }
    },
    "pem": "PEM 証明書",
    "pemHelp": "CERTIFICATE ブロックと空白のみ。最大 {{maximum}} 枚、{{kib}} KiB。秘密鍵は拒否します。",
    "bytes": "{{current}} / {{maximum}} バイト",
    "hostname": "想定ホスト名（任意）",
    "hostnameHelp": "ASCII DNS 名のみ。選択したリーフの DNS SAN を検査し、Common Name にフォールバックしません。",
    "check": "証明書バンドルを検査",
    "result": "検査結果",
    "completed": "検査完了。証明書: {{certificates}}。検出事項: {{findings}}。",
    "certificates": "証明書",
    "verifiedLinks": "検証済み署名",
    "findingCount": "検出事項",
    "evaluation": "評価時刻: {{time}}（端末の時計）",
    "selectLeaf": "ホスト名検査のリーフ",
    "selectPosition": "元の入力位置を選択",
    "hostnameTitle": "ホスト名: {{hostname}}",
    "relationships": "発行者の関係",
    "candidate": "候補の関係",
    "constraints": "発行者制約",
    "constraintsFailed": "CA / Key Usage 不適合",
    "keyIdFailed": "鍵識別子が不一致",
    "constraintsPassed": "ローカル制約を満たす",
    "findingsTitle": "検出事項と次の手順",
    "checking": "ローカルで解析と署名検証中…",
    "pending": "証明書を入力して検査します。入力変更で前の結果を消去します。",
    "details": "証明書の詳細 · 元の順序",
    "explanationTitle": "検査の意味",
    "explanation": "番号は元の入力位置で、JSON のインデックスは 0 始まりです。重複位置も残します。候補名は保守的な符号化比較を使います。発行者不在は情報で、候補の失敗は他の関係を否定しません。ツールや言語の切替時はメモリー内の下書きを保持し、再読み込みで消去します。",
    "dnsRules": "DNS SAN は ASCII 大文字小文字とホスト名末尾のドットを無視します。左端の完全なワイルドカードは 1 ラベルのみ一致します。URL、IP、ポート、ワイルドカード入力と Unicode 名は拒否します。国際化名は punycode に変換してください。Common Name は表示専用です。",
    "examplesTitle": "合成証明書の例",
    "exampleNote": "公開の合成証明書。文書の評価時刻: {{time}}。実際の検査は現在の実行環境の時計を使います。",
    "graphLabel": "証明書の発行者グラフ。矢印は証明書から発行者候補へ向き、元の位置は下に示します。",
    "graphHelp": "証明書 → 発行者候補。実線は署名とローカル制約を満たし、破線は失敗または未完了です。自己署名は詳細に示します。",
    "noCommonName": "CN なし",
    "ca": "CA 証明書",
    "nonCa": "非 CA 証明書",
    "nextAction": "次の手順",
    "noFindings": "検出事項はありません。クライアントの信頼と配備を別途確認してください。",
    "yes": "はい",
    "no": "いいえ",
    "notProvided": "未提供",
    "originalPosition": "元の位置",
    "position": "証明書 #{{number}}、開始行 {{line}}",
    "serial": "シリアル番号",
    "selfSignature": "自己署名の検査",
    "json": "構造化結果 JSON",
    "inputLine": "行 {{line}}: {{message}}",
    "status": {
      "verified": "検証済み",
      "failed": "失敗",
      "unsupported": "未対応",
      "unavailable": "未完了"
    },
    "severity": {
      "error": "エラー",
      "warning": "警告",
      "info": "情報"
    },
    "hostnameStatus": {
      "matched": "DNS SAN が一致します。チェーンとクライアントの信頼は別途確認が必要です。",
      "mismatched": "DNS SAN が不一致です。検出事項の根拠を確認してください。",
      "ambiguous": "対象リーフを選択してからホスト名を検査してください。",
      "no-leaf": "ホスト名検査用の非 CA リーフがありません。"
    },
    "samples": {
      "normal": "通常のバンドル",
      "omittedRoot": "ルート省略",
      "missingIntermediate": "中間証明書不在",
      "expired": "期限切れ",
      "future": "まだ有効でない",
      "hostnameMismatch": "ホスト名不一致",
      "multipleLeaves": "複数リーフ",
      "crossSigning": "クロス署名と順不同",
      "invalidCandidate": "同名候補の失敗",
      "duplicate": "重複証明書"
    },
    "errors": {
      "EMPTY_INPUT": "PEM 証明書を1つ以上入力または読み込んでください。",
      "INPUT_TOO_LARGE": "PEM が UTF-8 48 KiB 制限を超えます。",
      "INVALID_PEM": "PEM が不正です。CERTIFICATE ブロック、完全な Base64 と間の空白のみ対応します。",
      "PRIVATE_KEY_REJECTED": "秘密鍵を拒否しました。削除して証明書のみ入力してください。",
      "UNSUPPORTED_PEM_BLOCK": "未対応のブロックです。CERTIFICATE のみ受け付けます。",
      "INVALID_CERTIFICATE": "このブロックは対応する正しい DER X.509 証明書ではありません。",
      "TOO_MANY_CERTIFICATES": "最大 16 枚です。部分的な結果は返しません。",
      "INVALID_HOSTNAME": "URL、IP、ポートやワイルドカードのない ASCII DNS 名を入力し、Unicode 名は punycode に変換してください。",
      "INVALID_LEAF_SELECTION": "非 CA 証明書がある元の位置を選択してください。",
      "CRYPTO_UNAVAILABLE": "検査できませんでした。安全なコンテキストの対応ブラウザーか別実装で確認してください。",
      "INVALID_INPUT": "不正な要求です。PEM、ホスト名とリーフ位置を確認してください。",
      "INVALID_TIME": "実行環境の評価時刻が不正です。"
    },
    "graphScrollHelp": "画面が狭い場合は、図を左右にスクロールして各証明書を確認してください。",
    "evidence": {
      "fingerprintSha256": "SHA-256 指紋",
      "evaluatedAt": "評価時刻",
      "notAfter": "有効期限",
      "notBefore": "有効期間開始",
      "subject": "Subject",
      "issuer": "Issuer",
      "signature": "署名",
      "algorithm": "署名アルゴリズム",
      "ca": "CA",
      "basicConstraintsPresent": "basicConstraints の存在",
      "keyCertSign": "keyCertSign",
      "authorityKeyIdentifier": "Authority Key Identifier",
      "subjectKeyIdentifier": "Subject Key Identifier",
      "candidateCount": "候補数",
      "expectedHostname": "想定ホスト名",
      "dnsSubjectAlternativeNames": "DNS SAN"
    },
    "findings": {
      "DUPLICATE_CERTIFICATE": {
        "title": "これらの位置に同じ証明書",
        "action": "意図しない重複なら証明書を除去してください。"
      },
      "CERTIFICATE_EXPIRED": {
        "title": "評価時に有効期限切れ",
        "action": "証明書を更新または交換し、実際に提供する証明書を確認してください。"
      },
      "CERTIFICATE_NOT_YET_VALID": {
        "title": "評価時にまだ有効でない",
        "action": "端末の時計と証明書の利用開始日を確認してください。"
      },
      "SELF_SIGNED_CERTIFICATE": {
        "title": "自身の公開鍵で署名検証成功",
        "action": "クライアントの信頼と実際の配備を別途確認してください。この観察はどちらも証明しません。"
      },
      "SELF_SIGNATURE_FAILED": {
        "title": "自己発行証明書の自己署名が失敗",
        "action": "この 2 つの元の位置の証明書を確認してください。他の候補は独立に検査します。"
      },
      "SIGNATURE_UNSUPPORTED": {
        "title": "署名アルゴリズム未対応",
        "action": "そのアルゴリズムに対応する別の実装で確認してください。未完了や未対応は署名の失敗ではありません。"
      },
      "SIGNATURE_CHECK_UNAVAILABLE": {
        "title": "署名検査が未完了",
        "action": "そのアルゴリズムに対応する別の実装で確認してください。未完了や未対応は署名の失敗ではありません。"
      },
      "ISSUER_NOT_IN_BUNDLE": {
        "title": "符号化された発行者名が見つからない",
        "action": "サーバーが実際にこのバンドルを提供するなら full-chain 設定を確認してください。通常ルートは省略され、不在だけでチェーンの破損を証明しません。"
      },
      "CANDIDATE_SIGNATURE_FAILED": {
        "title": "発行者候補の署名が失敗",
        "action": "この 2 つの元の位置の証明書を確認してください。他の候補は独立に検査します。"
      },
      "ISSUER_NOT_CA": {
        "title": "発行者候補は CA=true でない",
        "action": "意図した発行 CA、Key Usage と鍵識別子を確認し、他の候補も調べてください。"
      },
      "ISSUER_KEY_USAGE_REJECTED": {
        "title": "発行者候補に keyCertSign がない",
        "action": "意図した発行 CA、Key Usage と鍵識別子を確認し、他の候補も調べてください。"
      },
      "ISSUER_KEY_ID_MISMATCH": {
        "title": "発行者と主体の鍵識別子が不一致",
        "action": "意図した発行 CA、Key Usage と鍵識別子を確認し、他の候補も調べてください。"
      },
      "MULTIPLE_ISSUERS": {
        "title": "複数候補がローカル制約を満たす",
        "action": "候補パスを別々に確認してください。本ツールは権威ある信頼パスを選びません。"
      },
      "LEAF_SELECTION_REQUIRED": {
        "title": "複数のリーフ候補から選択が必要",
        "action": "対象の非 CA リーフを提供または明示的に選択してからホスト名を検査してください。"
      },
      "NO_LEAF_CERTIFICATE": {
        "title": "非 CA リーフがない",
        "action": "対象の非 CA リーフを提供または明示的に選択してからホスト名を検査してください。"
      },
      "HOSTNAME_MATCH": {
        "title": "ホスト名がリーフの DNS SAN と一致",
        "action": "クライアントの信頼と実際の配備を別途確認してください。この観察はどちらも証明しません。"
      },
      "HOSTNAME_MISMATCH": {
        "title": "ホスト名がリーフの DNS SAN と不一致",
        "action": "ホスト名を確認するか、必要な DNS SAN を持つ証明書を取得してください。Common Name は代用しません。"
      }
    }
  },
  "homepage": {
    "description": "PEM 証明書の署名、発行者候補と任意の DNS 識別をローカル検査します。",
    "link": "証明書バンドルを検査"
  },
  "apiSummary": "PEM 証明書と任意の DNS ホスト名をサーバーへ送り、元の位置、候補署名、根拠と次の手順を取得します。秘密鍵は拒否し、結果はクライアントの信頼を証明しません。",
  "meta": {
    "title": "証明書バンドル検査 — Packetrove",
    "description": "PEM の候補署名、有効期間、発行制約と DNS SAN をローカル検査し、根拠と手順を確認します。アップロードや完全な信頼検証は行いません。"
  },
  "remotePrivacy": "API とリモート MCP は IP、CIDR、範囲端点、または PEM 証明書と任意のホスト名を Packetrove へ送信します。メモリー内で処理し、データベースや結果履歴は保持しません。証明書の内容と機密詳細はアプリのログやエラー計測に含めません。秘密鍵や他の秘密情報を送らないでください。クライアントは自身の方針で結果を保持する場合があります。",
  "discovery": {
    "title": "証明書バンドルの質問",
    "mcpTitle": "MCP で証明書を検査",
    "purpose": "AI クライアントに公開証明書バンドルの検査と根拠に基づく手順を依頼します。",
    "inputs": "pem（UTF-8 48 KiB、CERTIFICATE 16 ブロックまで）、任意の ASCII DNS hostname と 0 始まりの leafIndex を渡します。秘密鍵と他の形式は拒否します。",
    "result": "元の順序の certificates、候補 relationships、leafIndexes、selectedLeafIndex、hostname、evaluatedAt と code、severity、evidence、nextAction を含む findings を読みます。未対応と署名失敗は区別します。",
    "boundary": "ブラウザーはローカルで検査します。API とリモート MCP は証明書と任意のホスト名を送信します。完全なパス、信頼、失効、接続先検査や CLI 操作はありません。結果は配備安全性の証明ではありません。",
    "openTool": "ブラウザーの証明書検査を開く",
    "questions": {
      "trust": {
        "question": "検証済み関係は信頼済みですか？",
        "answer": "1 つの署名とローカル制約を検証しただけです。信頼ストア、完全なパス、失効と配備は別途確認します。"
      },
      "root": {
        "question": "発行者不在はチェーン破損を証明しますか？",
        "answer": "いいえ。入力されたバンドルの観察です。サーバーは通常ルートを省略します。実際の提供内容なら full-chain と対象クライアントの信頼を確認します。"
      },
      "privacy": {
        "question": "証明書はどこに送られますか？",
        "answer": "ブラウザーの入力と結果はページメモリーのみで、送信、保存、ログや URL への追加はありません。API とリモート MCP はサーバーへ送信します。秘密鍵は拒否します。"
      }
    }
  }
} as const;
