# アーキテクチャ設計書

## システム構成

### 採用方式: AWS SES + Lambda

低コスト、スケーラブル、フルマネージドな方式を採用。

## 全体アーキテクチャ

```
┌─────────────────┐
│  送信者         │
│  (外部)         │
└────────┬────────┘
         │
         │ SMTP
         ▼
┌─────────────────────────────────────────────────────┐
│                    Route53                           │
│  ┌──────────────────────────────────────────────┐   │
│  │ MX Record: inbound-smtp.region.amazonaws.com│   │
│  │ SPF Record: v=spf1 include:amazonses.com ~all│  │
│  │ DKIM Records: (SES generated)                │   │
│  │ DMARC Record: v=DMARC1; p=quarantine         │   │
│  └──────────────────────────────────────────────┘   │
└─────────────────────┬───────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │      Amazon SES         │
         │  ┌──────────────────┐  │
         │  │ Receipt Rule Set │  │
         │  │ - Active Rule    │  │
         │  └────────┬─────────┘  │
         └───────────┼────────────┘
                     │
         ┌───────────┴─────────────┐
         │                         │
         ▼                         ▼
┌─────────────────┐      ┌──────────────────┐
│   Amazon S3     │      │  AWS Lambda      │
│  (メール保存)    │◄─────│  (転送処理)      │
│                 │      │                  │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  │ Gmail API
                                  ▼
                         ┌─────────────────┐
                         │     Gmail       │
                         │  (受信トレイ)    │
                         └─────────────────┘


【送信フロー】

┌─────────────────┐
│     Gmail       │
│  ユーザー       │
└────────┬────────┘
         │
         │ SMTP (587/465)
         │ SMTP Auth (SES Credentials)
         ▼
┌─────────────────────────┐
│     Amazon SES          │
│  - DKIM Signing         │
│  - SPF Check            │
└────────┬────────────────┘
         │
         │ SMTP
         ▼
┌─────────────────┐
│  受信者         │
│  (外部)         │
└─────────────────┘
```

## コンポーネント詳細

### 1. Route53
**役割**: DNSレコード管理

**設定レコード**:
- **MXレコード**: SESエンドポイントを指定
  ```
  example.com MX 10 inbound-smtp.us-east-1.amazonaws.com
  ```
- **TXTレコード (SPF)**:
  ```
  example.com TXT "v=spf1 include:amazonses.com ~all"
  ```
- **TXTレコード (DMARC)**:
  ```
  _dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
  ```
- **DKIM CNAMEレコード**: SESで自動生成される3つのレコード

### 2. Amazon SES
**役割**: メール送受信エンジン

**受信設定**:
- Receipt Rule Set作成
- ルール条件: example.com宛すべてのメール
- アクション:
  1. S3アクション: メールをS3に保存
  2. Lambdaアクション: 転送処理を実行

**送信設定**:
- ドメイン認証（DKIM有効化）
- SMTP認証情報生成
- サンドボックス解除申請（本番運用時）

### 3. Amazon S3
**役割**: 受信メールの一時保存

**設定**:
- バケット名: `ses-received-emails-{account-id}`
- プレフィックス: `incoming/`
- ライフサイクルルール: 7日後自動削除
- 暗号化: SSE-S3
- アクセスポリシー: SESとLambdaのみ

### 4. AWS Lambda
**役割**: メール転送処理

**機能**:
1. S3からメール取得
2. MIMEメッセージ解析
3. Gmail APIでメール転送
4. エラーハンドリングとリトライ

**仕様**:
- ランタイム: Python 3.12 / Node.js 20.x
- メモリ: 512 MB
- タイムアウト: 30秒
- トリガー: S3イベント（ObjectCreated）

**環境変数**:
- `GMAIL_USER`: 転送先Gmailアドレス
- `S3_BUCKET`: S3バケット名
- `LOG_LEVEL`: ログレベル

### 5. Gmail
**役割**: メールクライアント

**受信設定**:
- Gmail API経由でメール受信
- ラベル自動適用（オプション）

**送信設定**:
- 設定 > アカウント > 他のメールアドレスを追加
- SMTPサーバー: `email-smtp.us-east-1.amazonaws.com`
- ポート: 587 (TLS)
- 認証: SES SMTP認証情報

## データフロー

### 受信フロー
1. 外部からメール送信 → Route53 (MX)
2. Route53 → SES受信エンドポイント
3. SES → S3にメール保存 + Lambda起動
4. Lambda → S3からメール取得
5. Lambda → MIMEパース、Gmail API呼び出し
6. Gmail API → Gmailアカウントにメール配信

### 送信フロー
1. Gmail UI → SMTP送信（SESエンドポイント）
2. SES → DKIM署名付与
3. SES → 外部SMTPサーバーへ配信

## セキュリティ設計

### 認証・認可
- **IAMロール**: Lambda実行ロール（S3読み取り、Logs書き込み）
- **SES認証**: SMTP認証情報（Gmail用）
- **Gmail API**: OAuth 2.0認証

### 暗号化
- **転送中**: TLS 1.2以上
- **保存時**: S3 SSE-S3暗号化

### アクセス制御
- S3バケットポリシー: SES、Lambda、特定AWSアカウントのみ
- セキュリティグループ: N/A（サーバーレス）
- IAMポリシー: 最小権限の原則

### 送信元認証
- **SPF**: SESを許可送信元として指定
- **DKIM**: SES自動署名
- **DMARC**: quarantineポリシー

## 監視・ログ

### CloudWatch Logs
- Lambda実行ログ
- SES送受信ログ
- ログ保持期間: 30日

### CloudWatch Metrics
- SES: Sent, Delivered, Bounced, Complained
- Lambda: Invocations, Errors, Duration
- S3: ObjectCount, BucketSize

### CloudWatch Alarms
- Lambda Error Rate > 5%
- SES Bounce Rate > 10%
- SES Complaint Rate > 0.5%

## スケーラビリティ

- **SES**: 1秒あたり1通から開始（サンドボックス）、申請で上限拡張可能
- **Lambda**: 自動スケーリング、同時実行数最大1000
- **S3**: 無制限ストレージ

## コスト見積もり

**想定**: 月間1000通送受信

| サービス | 使用量 | 月額コスト |
|---------|--------|-----------|
| SES (受信) | 1000通 | $0.10 |
| SES (送信) | 1000通 | $0.10 |
| S3 (保存) | 1GB、7日保持 | $0.02 |
| Lambda | 1000実行、512MB | $0.01 |
| Route53 (ホストゾーン) | 1ゾーン | $0.50 |
| **合計** | - | **$0.73/月** |

※データ転送料別途
