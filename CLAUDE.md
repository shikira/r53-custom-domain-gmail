# Claude Code 開発ガイドライン

このファイルは、Claude Code（AI開発アシスタント）がこのプロジェクトで作業する際の指針です。

---

## ドキュメント管理ポリシー

### ❌ ドキュメントファイル（*.md）にコードを書かない

**理由**: 実際のコードとの二重メンテナンスを避けるため

**ルール**:
- `docs/*.md` ファイルには**コード例を含めない**
- 設計思想、アーキテクチャ図、構成説明のみ記載
- コード構造は**ディレクトリツリー**と**説明文**で表現

**許可されるもの**:
- アーキテクチャ図（ASCII art）
- ディレクトリツリー
- 設計原則・思想の説明
- bashコマンド例

**禁止されるもの**:
- TypeScript/JavaScriptのコード例
- 実装の詳細

---

## プロジェクト概要

### 目的
Route53で管理しているカスタムドメインを使用して、Gmailでメールを送受信する。

### 技術スタック
- **インフラ**: AWS CDK v2 (TypeScript)
- **ランタイム**: Node.js 20.x
- **パッケージ管理**: pnpm workspace
- **主要サービス**: Amazon SES, Lambda, S3, Route53, Secrets Manager

### データフロー
- **受信**: 外部 → Route53 (MX) → SES → S3 + Lambda → Gmail
- **送信**: Gmail → SES (SMTP) → 外部

---

## アーキテクチャ概要

### CDK構成（1スタック）

```
EmailForwardingStack
 ├─ IamRolesConstruct
 ├─ SecretsConstruct
 ├─ EmailReceivingConstruct
 │   ├─ S3BucketConstruct
 │   ├─ LambdaFunctionConstruct
 │   └─ SesReceiptRuleConstruct
 ├─ EmailSendingConstruct
 │   ├─ SesDomainIdentityConstruct
 │   ├─ DkimConfigConstruct
 │   ├─ SpfRecordConstruct
 │   └─ DmarcRecordConstruct
 └─ MonitoringConstruct
     ├─ CloudWatchDashboardConstruct
     └─ AlarmsConstruct
```

### Lambdaアーキテクチャ

```
Handler Layer (index.ts)
    ↓
Use Case Layer (EmailForwarderService)
    ↓
Domain Services (S3Service, GmailService, EmailParser)
    ↓
Infrastructure Adapters (AWS SDK, Gmail API)
```

詳細は [アーキテクチャ詳細設計書](docs/architecture-detail.md) を参照。

---

## ディレクトリ構成

```
r53-custom-domain-gmail/
├── packages/
│   ├── cdk/                      # AWS CDK
│   │   ├── bin/app.ts
│   │   ├── lib/
│   │   │   ├── stacks/
│   │   │   │   └── email-forwarding-stack.ts
│   │   │   └── constructs/
│   │   │       ├── high-level/   # ユースケース単位
│   │   │       └── low-level/    # 個別リソース
│   │   └── test/
│   ├── lambda-email-forwarder/   # Lambda関数
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── services/
│   │   │   └── utils/
│   │   └── test/
│   ├── shared/                   # 共通ライブラリ
│   └── scripts/                  # 運用スクリプト
├── docs/
│   ├── requirements.md           # 要件定義
│   ├── implementation-plan.md    # 実装計画
│   └── architecture-detail.md    # 詳細設計
├── config/                       # 設定ファイル
└── .github/workflows/            # CI/CD
```

---

## コーディング規約

### TypeScript
- strict モード有効
- ESLint + Prettier で統一
- 明示的な型定義を優先
- `any` は警告レベル

### 命名規則
- **Construct**:
  - 高レベル: `{UseCase}Construct` (例: `EmailReceivingConstruct`)
  - 低レベル: `{Resource}{Type}Construct` (例: `S3EmailBucketConstruct`)
- **ファイル**: ケバブケース `email-forwarding-stack.ts`
- **テスト**: `*.test.ts`

---

## 開発ワークフロー

### セットアップ
```bash
pnpm install
pnpm build
```

### デプロイ
```bash
pnpm --filter @r53-gmail/cdk deploy
```

### テスト
```bash
pnpm test
pnpm test:unit
pnpm test:integration
```

---

## 設計原則

1. **単一スタック構成**: リソース数が少ないためシンプルに管理
2. **Constructパターン**: 高レベル（ユースケース）と低レベル（個別リソース）の2層
3. **テスタビリティ**: DIパターン、モックしやすいインターフェース
4. **セキュリティ**: 最小権限の原則、Secrets Manager使用

---

## 環境変数

### 必須
- `DOMAIN_NAME`: Route53で管理しているドメイン
- `GMAIL_USER`: 転送先Gmailアドレス

### オプション
- `HOSTED_ZONE_ID`: Route53ホストゾーンID
- `ALARM_EMAIL`: CloudWatchアラート通知先
- `ENVIRONMENT`: 環境名（dev/staging/prod）

---

## ドキュメント

- **[CLAUDE.md](CLAUDE.md)** (このファイル): AI向けガイド
- **[README.md](README.md)**: 人間向けプロジェクト概要
- **[docs/requirements.md](docs/requirements.md)**: 要件定義
- **[docs/implementation-plan.md](docs/implementation-plan.md)**: 実装計画
- **[docs/architecture-detail.md](docs/architecture-detail.md)**: 詳細設計書

---

## トラブルシューティング

1. **SESサンドボックス制限**: 本番移行申請が必要
2. **Lambda Cold Start**: Provisioned Concurrency設定
3. **Gmail API認証エラー**: OAuth認証フロー再実行
