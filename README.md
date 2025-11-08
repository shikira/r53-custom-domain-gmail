# Route53カスタムドメイン + Gmail統合プロジェクト

Route53で管理しているカスタムドメインを使用して、Gmailでメールを送受信するためのプロジェクト。

## 📖 概要

このプロジェクトは、AWS SES + Lambdaを活用して、カスタムドメイン（例: `user@example.com`）でのメール送受信を実現します。既存のGmailインターフェースをそのまま利用できるため、学習コスト不要で、低コスト（月額$1以下）で運用可能です。

## ✨ 主な機能

- **メール受信**: カスタムドメイン宛のメールをGmailで受信
- **メール送信**: Gmailからカスタムドメインのアドレスで送信
- **送信元認証**: SPF/DKIM/DMARCによる信頼性の高いメール配信
- **自動転送**: Lambda関数による自動メール転送処理
- **監視**: CloudWatchによるログ・メトリクス監視

## 🏗️ アーキテクチャ

```
外部送信者 → Route53 (MX) → Amazon SES → S3 + Lambda → Gmail
Gmail → Amazon SES (SMTP) → 外部受信者
```

詳細は [アーキテクチャ設計書](docs/architecture.md) を参照してください。

## 📋 ドキュメント

- [要件定義書](docs/requirements.md) - プロジェクトの要件と目的
- [アーキテクチャ設計書](docs/architecture.md) - システム構成とデータフロー
- [実装計画](docs/implementation-plan.md) - フェーズ別の開発計画

## 🚀 クイックスタート

### 前提条件

- AWSアカウント
- Route53で管理されているドメイン
- Gmailアカウント
- AWS CLI (v2)
- Python 3.12以上

### セットアップ

詳細な手順は [実装計画](docs/implementation-plan.md) を参照してください。

1. **AWS環境準備**
   ```bash
   # S3バケット作成
   aws s3 mb s3://ses-received-emails-{your-account-id} --region us-east-1
   ```

2. **SESドメイン認証**
   - SESコンソールでドメイン追加
   - Route53にDNSレコード追加

3. **Lambda関数デプロイ**
   ```bash
   cd lambda-email-forwarder
   pip install -r requirements.txt -t .
   zip -r function.zip .
   aws lambda create-function ...
   ```

4. **Gmail設定**
   - カスタムFromアドレス追加
   - SMTP設定（SES認証情報使用）

## 💰 コスト見積もり

月間1000通送受信の場合: **約$0.73/月**

- SES受信: $0.10
- SES送信: $0.10
- S3ストレージ: $0.02
- Lambda実行: $0.01
- Route53: $0.50

## 📊 開発スケジュール

- **フェーズ1**: 環境準備・設計（1-2日）
- **フェーズ2**: メール受信実装（2-3日）
- **フェーズ3**: メール送信実装（2-3日）
- **フェーズ4**: テスト・監視（1-2日）
- **フェーズ5**: ドキュメント・運用準備（1日）

**総所要期間**: 7-10日

## 🔒 セキュリティ

- TLS/SSL暗号化通信
- SPF/DKIM/DMARC送信元認証
- IAM最小権限ポリシー
- S3暗号化（SSE-S3）

## 📝 ライセンス

MIT License

## 🤝 コントリビューション

Issue、Pull Requestを歓迎します。

## 📞 サポート

質問や問題がある場合は、Issueを作成してください。
