# Route53カスタムドメイン + Gmail統合

Route53で管理しているカスタムドメインを使用して、Gmailでメールを送受信するプロジェクト。

## 概要

AWS SES + Lambdaを活用して、カスタムドメイン（例: `user@example.com`）でのメール送受信を実現します。既存のGmailインターフェースをそのまま利用できるため、学習コスト不要で、低コスト（月額$1以下）で運用可能です。

### 主な機能

- **メール受信**: カスタムドメイン宛のメールをGmailで受信
- **メール送信**: Gmailからカスタムドメインのアドレスで送信
- **送信元認証**: SPF/DKIM/DMARCによる信頼性の高いメール配信
- **自動転送**: Lambda関数による自動メール転送処理
- **監視**: CloudWatchによるログ・メトリクス監視

### アーキテクチャ

```
受信: 外部 → Route53 (MX) → SES → S3 + Lambda → Gmail
送信: Gmail → SES (SMTP) → 外部
```

## クイックスタート

### 前提条件

- AWSアカウント
- Route53で管理されているドメイン
- Gmailアカウント
- Node.js 20.x以上
- pnpm

### セットアップ

1. **リポジトリのクローン**
   ```bash
   git clone https://github.com/your-org/r53-custom-domain-gmail.git
   cd r53-custom-domain-gmail
   ```

2. **依存関係のインストール**
   ```bash
   pnpm install
   ```

3. **ビルド**
   ```bash
   pnpm build
   ```

4. **環境変数の設定**
   ```bash
   cp .env.example .env
   # .envを編集してドメイン名、Gmailアドレスを設定
   ```

5. **デプロイ**
   ```bash
   DOMAIN_NAME=example.com \
   GMAIL_USER=user@gmail.com \
   pnpm --filter @r53-gmail/cdk deploy
   ```

6. **Gmail設定**
   - Gmailの設定 > アカウント > 他のメールアドレスを追加
   - SESのSMTP認証情報を使用

詳細な手順は [実装計画](docs/implementation-plan.md) を参照してください。

## 開発

### ディレクトリ構成

```
r53-custom-domain-gmail/
├── packages/
│   ├── cdk/                      # AWS CDK (インフラ)
│   ├── lambda-email-forwarder/   # Lambda関数
│   ├── shared/                   # 共通ライブラリ
│   └── scripts/                  # 運用スクリプト
└── docs/                         # ドキュメント
```

### 開発コマンド

```bash
# ビルド（Turborepo並列実行）
pnpm build

# テスト（Vitest）
pnpm test
pnpm test:unit
pnpm test:integration
pnpm test:coverage
pnpm test:ui

# Lint
pnpm lint
pnpm lint:fix

# デプロイ
pnpm deploy

# スタック削除
pnpm destroy
```

## コスト見積もり

月間1000通送受信の場合: **約$0.73/月**

| サービス | 月額コスト |
|---------|-----------|
| SES受信 | $0.10 |
| SES送信 | $0.10 |
| S3ストレージ | $0.02 |
| Lambda実行 | $0.01 |
| Route53 | $0.50 |

## セキュリティ

- TLS/SSL暗号化通信
- SPF/DKIM/DMARC送信元認証
- IAM最小権限ポリシー
- S3暗号化（SSE-S3）
- Secrets Managerによるシークレット管理

## ドキュメント

- [要件定義書](docs/requirements.md) - プロジェクトの要件と目的
- [実装計画](docs/implementation-plan.md) - フェーズ別の開発計画
- [アーキテクチャ詳細設計](docs/architecture-detail.md) - システム設計の詳細

開発者向けガイドは [CLAUDE.md](CLAUDE.md) を参照してください。

## トラブルシューティング

### SESサンドボックス制限
本番環境では、SESの本番移行申請が必要です。

### Lambda Cold Start
Provisioned Concurrencyを設定することで軽減できます。

### Gmail API認証エラー
OAuth認証フローを再実行してください。

## ライセンス

MIT License

## コントリビューション

Issue、Pull Requestを歓迎します。

## サポート

質問や問題がある場合は、Issueを作成してください。
