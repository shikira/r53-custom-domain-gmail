# 実装計画

## 開発スケジュール

**総所要期間**: 7-10日間
**開発方式**: アジャイル、イテレーティブ

---

## フェーズ1: 環境準備・設計（1-2日）

### 1.1 AWS環境セットアップ
**所要時間**: 2-3時間

- [ ] AWSアカウント確認、IAMユーザー作成
- [ ] AWS CLIインストール・設定
- [ ] リージョン選択（SES対応リージョン: us-east-1, us-west-2, eu-west-1等）
- [ ] S3バケット作成
  ```bash
  aws s3 mb s3://ses-received-emails-{account-id} --region us-east-1
  ```
- [ ] S3バケットポリシー設定（SES書き込み権限）
- [ ] S3ライフサイクルルール設定（7日後削除）

### 1.2 SES初期設定
**所要時間**: 1-2時間

- [ ] SESコンソールでドメイン追加
- [ ] ドメイン認証用TXTレコード取得
- [ ] Route53にTXTレコード追加
- [ ] ドメイン認証完了確認（最大72時間）
- [ ] DKIM有効化、CNAMEレコード取得

### 1.3 IAMロール作成
**所要時間**: 1時間

- [ ] Lambda実行ロール作成
  - S3読み取り権限
  - CloudWatch Logs書き込み権限
  - SES送信権限（オプション）
- [ ] ポリシードキュメント作成

### 1.4 アーキテクチャドキュメント作成
**所要時間**: 2-3時間

- [x] システム構成図作成
- [x] データフロー図作成
- [x] セキュリティ設計書作成

**成果物**:
- `docs/architecture.md`
- AWSリソース一覧
- IAMポリシードキュメント

---

## フェーズ2: メール受信実装（2-3日）

### 2.1 Route53 DNS設定
**所要時間**: 1時間

- [ ] MXレコード追加
  ```
  example.com MX 10 inbound-smtp.us-east-1.amazonaws.com
  ```
- [ ] SPFレコード追加
  ```
  example.com TXT "v=spf1 include:amazonses.com ~all"
  ```
- [ ] DKIMレコード追加（SESから取得した3つのCNAME）
- [ ] DMARCレコード追加
  ```
  _dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
  ```
- [ ] DNS伝播確認（dig/nslookup）

### 2.2 SES受信ルール設定
**所要時間**: 1-2時間

- [ ] Receipt Rule Set作成（またはデフォルト使用）
- [ ] Receipt Rule追加
  - 受信者条件: `example.com`
  - アクション1: S3保存（`s3://bucket/incoming/`）
  - アクション2: Lambda起動（後ほど設定）
- [ ] アクティブルールセットとして設定
- [ ] テストメール送信（SES Mailbox Simulator使用）

### 2.3 Lambda関数開発（メール転送）
**所要時間**: 1日

#### 環境構築
- [ ] Lambda関数作成（Python 3.12）
- [ ] 開発環境セットアップ
  ```bash
  mkdir lambda-email-forwarder
  cd lambda-email-forwarder
  python -m venv venv
  source venv/bin/activate
  pip install boto3 google-auth google-auth-oauthlib google-auth-httplib2 google-api-python-client
  ```

#### コード実装
- [ ] S3からメールオブジェクト取得
- [ ] MIMEメッセージ解析
- [ ] Gmail API認証設定
- [ ] Gmail API経由でメール転送
- [ ] エラーハンドリング実装
- [ ] ログ出力実装

#### デプロイ
- [ ] 依存関係をLayerまたはデプロイパッケージに含める
- [ ] 環境変数設定
  - `GMAIL_USER`: 転送先アドレス
  - `S3_BUCKET`: バケット名
- [ ] Lambda関数デプロイ
- [ ] S3トリガー設定（ObjectCreated:Put）

### 2.4 Gmail API設定
**所要時間**: 2-3時間

- [ ] Google Cloud Consoleでプロジェクト作成
- [ ] Gmail API有効化
- [ ] OAuth 2.0認証情報作成（サービスアカウントまたはOAuth）
- [ ] 認証情報JSONダウンロード
- [ ] Lambdaに認証情報設定（環境変数またはSecrets Manager）
- [ ] 初回認証フロー実行

### 2.5 受信テスト
**所要時間**: 2-3時間

- [ ] 外部メールアドレスからテストメール送信
- [ ] S3にメール保存確認
- [ ] Lambda実行ログ確認
- [ ] Gmailに転送されたメール確認
- [ ] 添付ファイル付きメールテスト
- [ ] HTMLメールテスト
- [ ] 大容量メールテスト（10MB以上）

**成果物**:
- Lambda関数コード
- デプロイパッケージ
- 受信テスト結果レポート

---

## フェーズ3: メール送信実装（2-3日）

### 3.1 SES送信設定
**所要時間**: 1-2時間

- [ ] SMTP認証情報生成（SESコンソール）
- [ ] SMTPユーザー名・パスワード取得
- [ ] サンドボックス環境での送信テスト
- [ ] 本番移行申請（必要に応じて）
  - 送信理由説明
  - バウンス・苦情処理プロセス説明

### 3.2 SPF/DKIM/DMARC検証
**所要時間**: 1時間

- [ ] SPFレコード検証（MXToolbox等）
- [ ] DKIMレコード検証
- [ ] DMARCレコード検証
- [ ] テスト送信でヘッダー確認

### 3.3 Gmail送信設定
**所要時間**: 1時間

- [ ] Gmailにログイン
- [ ] 設定 > アカウント > 他のメールアドレスを追加
- [ ] カスタムドメインアドレス入力（`user@example.com`）
- [ ] SMTP設定
  - SMTPサーバー: `email-smtp.us-east-1.amazonaws.com`
  - ポート: 587
  - ユーザー名・パスワード: SES SMTP認証情報
- [ ] 確認メール受信・認証

### 3.4 送信テスト
**所要時間**: 2-3時間

- [ ] Gmailからカスタムドメインで送信
- [ ] 外部メールアドレスで受信確認
- [ ] メールヘッダー確認（SPF/DKIM/DMARC通過確認）
- [ ] 主要メールプロバイダーでのテスト
  - Gmail
  - Outlook/Hotmail
  - Yahoo Mail
- [ ] スパム判定チェック（Mail-Tester.com）
- [ ] バウンス処理確認

**成果物**:
- SMTP設定手順書
- 送信テスト結果レポート
- スパムスコア評価結果

---

## フェーズ4: テスト・監視（1-2日）

### 4.1 統合テスト
**所要時間**: 3-4時間

- [ ] エンドツーエンドテスト（送受信）
- [ ] 複数メールアドレスでの受信テスト
- [ ] 同時複数メール受信テスト
- [ ] エラーケーステスト
  - 不正なメールフォーマット
  - 大容量添付ファイル（25MB超）
  - Lambda タイムアウト

### 4.2 パフォーマンステスト
**所要時間**: 2時間

- [ ] メール配送遅延測定
- [ ] Lambda実行時間測定
- [ ] スループットテスト

### 4.3 監視・アラート設定
**所要時間**: 3-4時間

- [ ] CloudWatch Logsグループ確認
- [ ] CloudWatch Metricsダッシュボード作成
  - SES送受信メトリクス
  - Lambda実行メトリクス
  - S3ストレージメトリクス
- [ ] CloudWatch Alarms設定
  - Lambda Error Rate > 5%
  - SES Bounce Rate > 10%
  - SES Complaint Rate > 0.5%
- [ ] SNSトピック作成（アラート通知用）
- [ ] メール通知設定

### 4.4 セキュリティ監査
**所要時間**: 2時間

- [ ] IAMポリシー最小権限確認
- [ ] S3バケットパブリックアクセス無効確認
- [ ] Lambda環境変数暗号化確認
- [ ] TLS/SSL証明書確認

**成果物**:
- テストケース一覧
- テスト結果レポート
- CloudWatchダッシュボード
- アラート設定ドキュメント

---

## フェーズ5: ドキュメント・運用準備（1日）

### 5.1 ドキュメント作成
**所要時間**: 4-5時間

- [ ] README.md更新
- [ ] セットアップ手順書
  - 前提条件
  - ステップバイステップガイド
  - スクリーンショット付き
- [ ] トラブルシューティングガイド
  - よくある問題と解決方法
  - エラーメッセージ一覧
- [ ] 運用マニュアル
  - 日常運用タスク
  - バックアップ・リストア手順
  - スケーリング手順
- [ ] APIドキュメント（Lambda関数）

### 5.2 IaC化（オプション）
**所要時間**: 4-6時間

- [ ] Terraformまたは AWS CDKで実装
- [ ] リソース定義
  - S3バケット
  - Lambda関数
  - IAMロール・ポリシー
  - SES設定（一部手動）
  - CloudWatchアラーム
- [ ] `terraform plan`実行、検証
- [ ] ドライラン確認

### 5.3 CI/CD構築（オプション）
**所要時間**: 3-4時間

- [ ] GitHub Actionsワークフロー作成
- [ ] Lambdaデプロイパイプライン
- [ ] テスト自動化
- [ ] シークレット管理（GitHub Secrets）

**成果物**:
- `docs/setup-guide.md`
- `docs/troubleshooting.md`
- `docs/operations-manual.md`
- `terraform/` または `cdk/` ディレクトリ
- `.github/workflows/` デプロイワークフロー

---

## マイルストーン

| マイルストーン | 完了条件 | 期日 |
|---------------|---------|------|
| M1: 環境準備完了 | AWS環境、SES認証完了 | Day 2 |
| M2: 受信機能実装完了 | テストメール受信成功 | Day 5 |
| M3: 送信機能実装完了 | カスタムドメインで送信成功 | Day 7 |
| M4: テスト完了 | すべてのテストケース合格 | Day 9 |
| M5: 本番リリース | ドキュメント完成、運用開始 | Day 10 |

---

## リスク管理

| リスク | 軽減策 | コンティンジェンシープラン |
|--------|--------|--------------------------|
| SES認証遅延（最大72時間） | 早期に申請開始 | 外部転送サービス一時利用 |
| Gmail API認証エラー | ドキュメント事前確認 | 代替メール転送方法検討 |
| Lambda実装バグ | ユニットテスト実施 | ロールバック手順準備 |
| DNS伝播遅延 | TTL短縮（300秒） | 伝播待機時間を計画に含める |
| コスト超過 | CloudWatch予算アラート設定 | 使用量上限設定 |

---

## 開発環境

### 必要なツール
- AWS CLI (v2)
- Python 3.12
- Node.js 20.x（CDK使用時）
- Terraform 1.5+（IaC使用時）
- Git

### 推奨IDEプラグイン
- AWS Toolkit for VS Code
- Python
- Terraform
- YAML

---

## 次のステップ

実装開始前に以下を確認：
- [ ] AWSアカウントアクセス権限確認
- [ ] Route53でドメイン管理確認
- [ ] Gmailアカウント準備
- [ ] 開発環境セットアップ完了
- [ ] プロジェクトリポジトリ作成

準備完了後、**フェーズ1**から順次実装を開始してください。
