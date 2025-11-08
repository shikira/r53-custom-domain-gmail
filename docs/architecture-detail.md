# アーキテクチャ詳細設計書

本ドキュメントは、Route53カスタムドメイン + Gmail統合プロジェクトの詳細なアーキテクチャ設計を記載します。

---

## 目次

1. [CDKアーキテクチャ](#cdkアーキテクチャ)
2. [Lambdaアーキテクチャ](#lambdaアーキテクチャ)
3. [データフロー](#データフロー)
4. [設計パターン](#設計パターン)
5. [セキュリティ設計](#セキュリティ設計)
6. [テスト戦略](#テスト戦略)
7. [モニタリング](#モニタリング)

---

## CDKアーキテクチャ

### 設計方針

**1スタック構成**でシンプルに保ちつつ、再利用可能なConstructパターンで実装。

#### 原則
1. **単一スタック**: すべてのリソースを1つのスタックで管理
2. **Constructで機能をカプセル化**: 再利用性とテスタビリティの向上
3. **ユースケース別にConstruct分離**: メール受信、送信、監視など
4. **段階的な拡張性**: 将来的に複数スタックへの分割も容易

### スタック構成

```
┌──────────────────────────────────────────────────┐
│           CDK App (bin/app.ts)                   │
└──────────────┬───────────────────────────────────┘
               │
               └─> EmailForwardingStack (すべてのリソース)
                    │
                    ├─> IamRolesConstruct (基盤)
                    ├─> SecretsConstruct (基盤)
                    │
                    ├─> EmailReceivingConstruct (メール受信)
                    │    ├─> S3BucketConstruct
                    │    ├─> LambdaFunctionConstruct
                    │    └─> SesReceiptRuleConstruct
                    │
                    ├─> EmailSendingConstruct (メール送信)
                    │    ├─> SesDomainIdentityConstruct
                    │    ├─> DkimConfigConstruct
                    │    ├─> SpfRecordConstruct
                    │    └─> DmarcRecordConstruct
                    │
                    └─> MonitoringConstruct (監視)
                         ├─> CloudWatchDashboardConstruct
                         └─> AlarmsConstruct
```

#### 1スタックを選択した理由

- ✅ リソース数が少ない（約20-30個）
- ✅ すべてのリソースが密結合
- ✅ デプロイが簡単（1回で完了）
- ✅ スタック間の依存管理が不要
- ✅ 初期開発フェーズに最適

### Construct設計

#### 2層Constructパターン

**高レベルConstruct（ユースケース）**:
- `EmailReceivingConstruct`: メール受信機能全体
- `EmailSendingConstruct`: メール送信設定全体
- `MonitoringConstruct`: 監視機能全体

**低レベルConstruct（個別リソース）**:
- `IamRolesConstruct`: IAMロール作成
- `SecretsConstruct`: Secrets Manager作成
- `S3EmailBucketConstruct`: S3バケット作成
- `EmailForwarderFunctionConstruct`: Lambda関数作成
- `SesReceiptRuleConstruct`: SES受信ルール作成
- `SesDomainIdentityConstruct`: SESドメイン認証
- `DkimConfigConstruct`: DKIM設定
- `SpfRecordConstruct`: SPFレコード作成
- `DmarcRecordConstruct`: DMARCレコード作成
- `CloudWatchDashboardConstruct`: ダッシュボード作成
- `AlarmsConstruct`: アラーム作成

### EmailReceivingConstruct

**責務**: カスタムドメイン宛のメール受信とGmail転送

**構成リソース**:

1. **S3バケット**: 受信メールの一時保存
   - 暗号化: SSE-S3
   - ライフサイクル: 7日後自動削除
   - SES書き込み権限付与

2. **Lambda関数**: メール転送処理
   - ランタイム: Node.js 20.x
   - トリガー: S3イベント（ObjectCreated）
   - 環境変数: GMAIL_USER, S3_BUCKET, LOG_LEVEL

3. **SES受信ルール**: メール受信設定
   - 受信者: ドメイン全体
   - アクション: S3保存 + Lambda起動
   - TLS必須、スパムスキャン有効

### EmailSendingConstruct

**責務**: カスタムドメインからのメール送信設定

**構成リソース**:
1. **SESドメイン認証**: ドメイン検証
2. **DKIM設定**: 電子署名（CNAMEレコード）
3. **SPFレコード**: 送信元認証（TXTレコード）
4. **DMARCレコード**: ポリシー設定（TXTレコード）

**Route53レコード自動作成**:
`hostedZoneId`が指定されている場合のみ、Route53にDNSレコードを自動作成。
未指定の場合は手動でDNSレコードを設定する必要がある。

### MonitoringConstruct

**責務**: メール送受信の監視とアラート

**構成リソース**:
1. **SNSトピック**: アラート通知先
2. **CloudWatchダッシュボード**: メトリクス可視化
   - Lambda実行回数・エラー率・実行時間
   - S3バケットサイズ
3. **CloudWatchアラーム**:
   - Lambda Error Rate > 5%
   - Lambda Duration > 25秒

### デプロイフロー

#### 基本デプロイ
```bash
pnpm --filter @r53-gmail/cdk deploy
```

#### 環境変数で設定を渡す
```bash
DOMAIN_NAME=example.com \
GMAIL_USER=user@gmail.com \
HOSTED_ZONE_ID=Z1234567890ABC \
pnpm --filter @r53-gmail/cdk deploy
```

#### その他のコマンド
```bash
# 差分確認
pnpm --filter @r53-gmail/cdk diff

# CloudFormationテンプレート生成
pnpm --filter @r53-gmail/cdk synth

# スタック破棄
pnpm --filter @r53-gmail/cdk destroy
```

---

## Lambdaアーキテクチャ

### レイヤー構成

```
┌────────────────────────────────────────────────────┐
│        Application Layer (Lambda)                  │
├────────────────────────────────────────────────────┤
│                                                     │
│  ┌──────────────────────────────────────────┐     │
│  │           Handler Layer                   │     │
│  │  - S3 Event Handler                      │     │
│  │  - Error Handling                        │     │
│  │  - Logging                               │     │
│  └──────────────────────────────────────────┘     │
│                     ▼                              │
│  ┌──────────────────────────────────────────┐     │
│  │         Use Case / Service Layer          │     │
│  │  - EmailForwarderService                 │     │
│  │    + forwardEmail(s3Event)               │     │
│  │    + parseEmail(rawEmail)                │     │
│  │    + validateEmail(email)                │     │
│  └──────────────────────────────────────────┘     │
│                     ▼                              │
│  ┌──────────────────────────────────────────┐     │
│  │          Domain Services                  │     │
│  │  - S3Service                             │     │
│  │    + getEmail()                          │     │
│  │    + deleteEmail()                       │     │
│  │  - GmailService                          │     │
│  │    + sendEmail()                         │     │
│  │    + createDraft()                       │     │
│  │  - EmailParserService                    │     │
│  │    + parseMime(raw)                      │     │
│  │    + extractHeaders(mime)                │     │
│  │    + extractAttachments(mime)            │     │
│  └──────────────────────────────────────────┘     │
│                     ▼                              │
│  ┌──────────────────────────────────────────┐     │
│  │       Infrastructure Adapters             │     │
│  │  - S3Client (AWS SDK)                    │     │
│  │  - Gmail API Client                      │     │
│  └──────────────────────────────────────────┘     │
│                                                     │
└────────────────────────────────────────────────────┘
```

### レイヤー責務

**Handler Layer**:
- Lambda関数のエントリーポイント
- S3イベントの受け取り
- エラーハンドリング

**Use Case Layer**:
- ビジネスロジックの調整
- サービス間の連携

**Domain Services Layer**:
- 個別ドメインロジック
- 外部サービスとの統合

**Infrastructure Adapters Layer**:
- AWS SDK、Gmail API等のラッパー

---

## データフロー

### メール受信フロー

```
外部送信者
    ↓ SMTP
Route53 (MX Record)
    ↓
Amazon SES
    ├─> S3 Bucket (incoming/)
    └─> Lambda Function
         ↓ Gmail API
       Gmail Inbox
```

### メール送信フロー

```
Gmail UI (Compose)
    ↓ SMTP (Port 587) + SES Credentials
Amazon SES
    ├─> DKIM Sign
    ├─> SPF Check
    └─> SMTP
         ↓
    外部受信者
```

---

## 設計パターン

### Hexagonal Architecture (Ports & Adapters)

Lambda関数のビジネスロジックを外部依存から分離。

### Dependency Injection (DI) パターン

Lambda関数では、コンストラクタインジェクションでサービスを注入。

**DI構成**:
- Lambda初期化フェーズでサービスインスタンスを生成
- 各サービスは依存を注入
- モックしやすいインターフェース設計

### Repository Pattern

データアクセス層を抽象化し、テスタビリティを向上。

**実装箇所**:
- S3Service: S3からのメール取得・削除
- GmailService: Gmail APIとの通信

### Service Layer Pattern

ビジネスロジックをカプセル化。

**実装箇所**:
- EmailForwarderService: メール転送の調整
- EmailParserService: メール解析

---

## エラーハンドリング戦略

### エラー分類

- `EmailForwardingError`: 基底エラークラス
- `S3RetrievalError`: S3取得エラー
- `GmailAPIError`: Gmail API通信エラー
- `EmailParsingError`: メール解析エラー

### リトライロジック

- 最大試行回数: 3回
- バックオフ戦略: 指数バックオフ
- リトライ対象: 一時的なネットワークエラー、レート制限

---

## ロギング戦略

### 構造化ログ

JSON形式で出力し、CloudWatch Logs Insightsで検索可能。

**ログ項目**:
- level: INFO / ERROR / WARN
- timestamp: ISO8601形式
- message: ログメッセージ
- metadata: コンテキスト情報（s3Bucket, s3Key, requestId等）

---

## セキュリティ設計

### 認証・認可

**Lambda実行**:
1. IAM Role Assume
2. Secrets Managerから認証情報取得
3. Gmail API認証

**最小権限の原則**:
- Lambda: S3読み取り、Secrets Manager読み取りのみ
- S3バケット: SESとLambdaのみアクセス可能

### データ暗号化

- **転送中**: TLS 1.2以上
- **保存時**: S3 SSE-S3、Secrets Managerデフォルト暗号化

### アクセス制御

- S3バケット: パブリックアクセスブロック
- SESバケット書き込み: SESサービスプリンシパルのみ

---

## パフォーマンス最適化

### Lambda Cold Start対策

- Provisioned Concurrency: 本番環境で1-2インスタンス
- レイヤー活用: 共通ライブラリ分離
- バンドルサイズ最小化: esbuildでTree Shaking

### 同時実行制御

- 予約済み同時実行数: 10
- タイムアウト: 30秒
- メモリ: 512MB

---

## テスト戦略

### テストピラミッド

```
     ┌──────────────┐
     │     E2E      │  ← 少数 (1-2%)
     ├──────────────┤
     │ Integration  │  ← 中程度 (20-30%)
     ├──────────────┤
     │     Unit     │  ← 多数 (70-80%)
     └──────────────┘
```

### テストレベル

**Unit Tests**:
- 個別サービスクラスのテスト
- モックを使用した独立テスト
- Vitestのvi.mock()でモック化

**Integration Tests**:
- サービス間の統合テスト
- LocalStackまたはAWSテスト環境

**E2E Tests**:
- メール送受信の完全フロー
- 本番環境に近い環境でのテスト

### CDKテスト

**Stackテスト**: リソース数、プロパティの検証
**Constructテスト**: 個別Constructの動作検証
**スナップショットテスト**: CloudFormationテンプレートの変更検出

**テストツール**:
- Vitest: テストフレームワーク（Jest互換、高速）
- CDK Assertions: CloudFormationテンプレート検証
- toMatchSnapshot(): スナップショットテスト

---

## モニタリング・オブザーバビリティ

### CloudWatch Metrics

**標準メトリクス**:
- Lambda: Invocations, Errors, Duration, Throttles
- S3: BucketSize, ObjectCount

**カスタムメトリクス**:
- EmailForwarding/Success
- EmailForwarding/Error

### CloudWatch Dashboard

**表示項目**:
- Lambda実行回数・成功率
- Lambda実行時間（平均・P99）
- エラーカウント
- S3バケットサイズ

### アラーム設定

- Lambda Error Rate > 5%
- Lambda Duration > 25秒
- SES Bounce Rate > 10%

---

## 設定管理

### 必須パラメータ
- `domainName`: Route53で管理しているドメイン名
- `gmailUser`: 転送先Gmailアドレス

### オプションパラメータ
- `hostedZoneId`: Route53ホストゾーンID（DNSレコード自動作成用）
- `alarmEmail`: CloudWatchアラート通知先（未指定時はgmailUser）

### パラメータ取得優先順位
1. CDKコンテキスト（`--context`オプション）
2. 環境変数
3. デフォルト値

---

## まとめ

本アーキテクチャは以下の特徴を持ちます:

### CDK設計

1. **1スタック構成**: すべてのリソースを`EmailForwardingStack`で管理
2. **2層Constructパターン**: 高レベル（ユースケース）と低レベル（個別リソース）
3. **テスタビリティ**: 各Constructを独立してテスト可能
4. **将来の拡張性**: 必要に応じて複数スタックへの分割が容易

### Lambda設計

1. **疎結合**: レイヤー分離とDIによる柔軟性
2. **テスタビリティ**: モックしやすいインターフェース設計
3. **保守性**: pnpm workspaceによるモノレポ管理
4. **スケーラビリティ**: サーバーレスによる自動スケーリング
5. **観測可能性**: 構造化ログとメトリクスによる可視化
6. **セキュリティ**: 最小権限とシークレット管理
