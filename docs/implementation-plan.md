# 実装計画

## 開発スケジュール

**総所要期間**: 7-10日間
**開発方式**: アジャイル、イテレーティブ

---

## フェーズ1: プロジェクトセットアップ（1-2日）

### 1.1 開発環境セットアップ
**所要時間**: 1-2時間

- [ ] Node.js 20.x インストール確認
- [ ] pnpm インストール（`npm install -g pnpm`）
- [ ] AWS CLI v2 インストール・設定
- [ ] リージョン選択（SES対応リージョン: us-east-1, us-west-2, eu-west-1等）
- [ ] 環境変数ファイル作成
  ```bash
  cp .env.example .env
  # DOMAIN_NAME, GMAIL_USER等を設定
  ```

### 1.2 pnpm workspaceセットアップ
**所要時間**: 2-3時間

- [ ] パッケージディレクトリ作成
  ```bash
  mkdir -p packages/{cdk,lambda-email-forwarder,shared,scripts}
  ```
- [ ] 各パッケージのpackage.json作成
- [ ] turbo.json作成（パイプライン設定）
- [ ] pnpm依存関係インストール
  ```bash
  pnpm install
  ```
- [ ] Vitest設定
  ```bash
  # ルートディレクトリにvitest.config.ts作成済み
  pnpm add -D vitest @vitest/ui @vitest/coverage-v8
  ```
- [ ] ビルド動作確認
  ```bash
  pnpm build  # Turborepoで並列ビルド
  ```

### 1.3 CDK初期化
**所要時間**: 1-2時間

- [ ] CDKパッケージセットアップ
  ```bash
  cd packages/cdk
  pnpm add -D aws-cdk aws-cdk-lib constructs
  pnpm add -D @types/node typescript
  pnpm add -D cdk-nag
  pnpm add -D vitest
  ```
- [ ] CDK Bootstrap実行
  ```bash
  pnpm cdk bootstrap
  ```
- [ ] スタックファイル作成
  - `lib/stacks/email-forwarding-stack.ts`
  - `bin/app.ts`（cdk-nag統合含む）

### 1.4 Lambda初期化
**所要時間**: 1-2時間

- [ ] Lambda関数パッケージセットアップ
  ```bash
  cd packages/lambda-email-forwarder
  pnpm add @aws-sdk/client-s3 @aws-sdk/client-secrets-manager
  pnpm add googleapis nodemailer
  pnpm add -D @types/node esbuild
  pnpm add -D vitest @vitest/coverage-v8
  ```
- [ ] ディレクトリ構成作成
  ```bash
  mkdir -p src/{services,utils,types}
  mkdir -p test/{unit,integration}
  touch src/index.ts
  ```

**成果物**:
- pnpm workspaceセットアップ完了
- CDK初期化完了（cdk-nag統合）
- Lambda開発環境準備完了
- Turborepo設定完了（turbo.json）
- Vitest設定完了

---

## フェーズ2: CDK基盤Construct実装（1-2日）

### 2.1 低レベルConstruct実装
**所要時間**: 3-4時間

- [ ] IamRolesConstruct実装
  - Lambda実行ロール
  - S3読み取り権限
  - Secrets Manager読み取り権限
  - CloudWatch Logs書き込み権限
- [ ] SecretsConstruct実装
  - Gmail API認証情報保存用Secret
  - SES SMTP認証情報保存用Secret

### 2.2 S3BucketConstruct実装
**所要時間**: 2-3時間

- [ ] S3バケット作成
  - 暗号化: SSE-S3
  - パブリックアクセスブロック
  - バージョニング無効
  - サーバーアクセスログ有効（cdk-nag準拠）
- [ ] バケットポリシー設定
  - SES書き込み権限
  - Lambda読み取り権限
  - SSL/TLS必須（cdk-nag準拠）
- [ ] ライフサイクルルール設定
  - incoming/ プレフィックス: 7日後削除

### 2.3 EmailReceivingConstruct実装
**所要時間**: 3-4時間

- [ ] 高レベルConstruct作成
- [ ] 内部で低レベルConstructを組み合わせ
  - S3BucketConstruct
  - LambdaFunctionConstruct（後ほど実装）
  - SesReceiptRuleConstruct（後ほど実装）
- [ ] Construct間の依存関係設定

### 2.4 CDK Constructテスト実装
**所要時間**: 2-3時間

- [ ] Vitestテストセットアップ
- [ ] スナップショットテスト実装
  - EmailForwardingStackスナップショット
  - 各Constructのスナップショット
- [ ] CDK Assertionsテスト
  - リソース数検証
  - プロパティ検証
  - IAMポリシー検証

### 2.5 cdk-nag初回検証
**所要時間**: 1時間

- [ ] cdk-nag実行
  ```bash
  pnpm synth
  ```
- [ ] 警告内容確認
- [ ] 必要に応じて抑制設定追加（理由をコメント記載）

**成果物**:
- `packages/cdk/lib/constructs/low-level/*.ts`
- `packages/cdk/lib/constructs/high-level/email-receiving-construct.ts`
- `packages/cdk/test/**/*.test.ts`（スナップショット含む）
- cdk-nagチェック通過

---

## フェーズ3: メール受信実装（2-3日）

### 3.1 Lambda関数実装（メール転送）
**所要時間**: 1日

#### Infrastructure Layer
- [ ] S3Client実装（AWS SDK v3ラッパー）
  - getObject
  - deleteObject
- [ ] GmailClient実装（Gmail APIラッパー）
  - sendMessage
  - authenticate

#### Domain Services Layer
- [ ] S3Service実装
  - getEmailFromS3(bucket, key)
  - deleteEmailFromS3(bucket, key)
- [ ] GmailService実装
  - sendEmail(message)
  - createDraft(message)
- [ ] EmailParserService実装
  - parseMime(raw)
  - extractHeaders(mime)
  - extractAttachments(mime)

#### Use Case Layer
- [ ] EmailForwarderService実装
  - forwardEmail(s3Event)
  - ビジネスロジック調整

#### Handler Layer
- [ ] index.ts実装
  - S3イベントハンドラー
  - エラーハンドリング
  - ロギング

### 3.2 Lambdaユニットテスト実装
**所要時間**: 4-5時間

- [ ] S3Serviceテスト（vi.mock使用）
- [ ] GmailServiceテスト（vi.mock使用）
- [ ] EmailParserServiceテスト
- [ ] EmailForwarderServiceテスト
- [ ] カバレッジ80%以上確認
  ```bash
  pnpm --filter @r53-gmail/lambda-email-forwarder test:coverage
  ```

### 3.3 Lambda CDK Construct実装
**所要時間**: 2-3時間

- [ ] LambdaFunctionConstruct実装
  - ランタイム: Node.js 20.x
  - メモリ: 512MB
  - タイムアウト: 30秒
  - 環境変数: GMAIL_USER, S3_BUCKET, LOG_LEVEL
  - 予約済み同時実行数設定（cdk-nag準拠）
  - X-Ray トレーシング有効（cdk-nag推奨）
- [ ] esbuildでバンドル設定
- [ ] Lambda Layerの設定（オプション）

### 3.4 SES受信ルールConstruct実装
**所要時間**: 2-3時間

- [ ] SesReceiptRuleConstruct実装
  - Receipt Rule Set作成またはデフォルト使用
  - Receipt Rule追加
    - 受信者条件: ドメイン全体
    - アクション1: S3保存
    - アクション2: Lambda起動
  - TLS必須
  - スパム・ウイルススキャン有効

### 3.5 Route53 DNS設定
**所要時間**: 1-2時間

- [ ] MXレコード追加
  ```
  example.com MX 10 inbound-smtp.{region}.amazonaws.com
  ```
- [ ] DNS伝播確認（dig/nslookup）
  ```bash
  dig MX example.com
  ```

### 3.6 Gmail API設定
**所要時間**: 2-3時間

- [ ] Google Cloud Consoleでプロジェクト作成
- [ ] Gmail API有効化
- [ ] OAuth 2.0認証情報作成
- [ ] 認証情報JSONダウンロード
- [ ] Secrets Managerに認証情報保存
  ```bash
  aws secretsmanager create-secret \
    --name gmail-api-credentials \
    --secret-string file://credentials.json
  ```
- [ ] 初回認証フロー実行

### 3.7 CDKスナップショット更新
**所要時間**: 30分

- [ ] スナップショット更新
  ```bash
  pnpm --filter @r53-gmail/cdk test -- -u
  ```
- [ ] 変更差分レビュー

### 3.8 cdk-nag検証（受信機能）
**所要時間**: 1時間

- [ ] cdk-nag実行
  ```bash
  pnpm synth
  ```
- [ ] Lambda/S3/SESの警告確認
- [ ] 必要に応じて抑制設定

### 3.9 受信テスト
**所要時間**: 2-3時間

- [ ] CDKデプロイ
  ```bash
  pnpm deploy
  ```
- [ ] 外部メールアドレスからテストメール送信
- [ ] CloudWatch Logsで実行ログ確認
- [ ] Gmailに転送されたメール確認
- [ ] 添付ファイル付きメールテスト
- [ ] HTMLメールテスト
- [ ] 大容量メールテスト（10MB以上）

**成果物**:
- `packages/lambda-email-forwarder/src/**/*.ts`
- `packages/lambda-email-forwarder/test/**/*.test.ts`
- `packages/cdk/lib/constructs/low-level/lambda-function-construct.ts`
- `packages/cdk/lib/constructs/low-level/ses-receipt-rule-construct.ts`
- スナップショットファイル更新
- カバレッジレポート（80%以上）
- cdk-nagチェック通過
- 受信テスト結果レポート

---

## フェーズ4: メール送信実装（2-3日）

### 4.1 EmailSendingConstruct実装
**所要時間**: 3-4時間

- [ ] SesDomainIdentityConstruct実装
  - SESドメイン認証
  - ドメイン認証TXTレコード
- [ ] DkimConfigConstruct実装
  - DKIM有効化
  - DKIMのCNAMEレコード（3つ）
- [ ] SpfRecordConstruct実装
  - SPF TXTレコード
  ```
  example.com TXT "v=spf1 include:amazonses.com ~all"
  ```
- [ ] DmarcRecordConstruct実装
  - DMARC TXTレコード
  ```
  _dmarc.example.com TXT "v=DMARC1; p=quarantine; rua=mailto:dmarc@example.com"
  ```

### 4.2 Route53自動DNS設定
**所要時間**: 2-3時間

- [ ] EmailSendingConstructにRoute53統合実装
- [ ] hostedZoneId指定時のDNSレコード自動作成
  - SESドメイン認証TXTレコード
  - DKIM CNAMEレコード（3つ）
  - SPF TXTレコード
  - DMARC TXTレコード
- [ ] 手動DNS設定の手順書作成（hostedZoneId未指定時）

### 4.3 SES SMTP認証情報設定
**所要時間**: 1-2時間

- [ ] SESコンソールでSMTP認証情報生成
- [ ] Secrets Managerに保存
  ```bash
  aws secretsmanager create-secret \
    --name ses-smtp-credentials \
    --secret-string '{"username":"AKIAEXAMPLE","password":"secret"}'
  ```
- [ ] サンドボックス環境での送信テスト
- [ ] 本番移行申請（必要に応じて）

### 4.4 Gmail送信設定
**所要時間**: 1時間

- [ ] Gmailにログイン
- [ ] 設定 > アカウント > 他のメールアドレスを追加
- [ ] カスタムドメインアドレス入力（`user@example.com`）
- [ ] SMTP設定
  - SMTPサーバー: `email-smtp.{region}.amazonaws.com`
  - ポート: 587
  - TLS有効
  - ユーザー名・パスワード: Secrets Managerから取得
- [ ] 確認メール受信・認証

### 4.5 SPF/DKIM/DMARC検証
**所要時間**: 1-2時間

- [ ] DNSレコード伝播確認
  ```bash
  dig TXT example.com
  dig TXT _dmarc.example.com
  dig CNAME {dkim-selector}._domainkey.example.com
  ```
- [ ] SPFレコード検証（MXToolbox等）
- [ ] DKIMレコード検証
- [ ] DMARCレコード検証

### 4.6 CDKスナップショット更新
**所要時間**: 30分

- [ ] スナップショット更新
  ```bash
  pnpm --filter @r53-gmail/cdk test -- -u
  ```
- [ ] SES/Route53リソース追加確認

### 4.7 cdk-nag検証（送信機能）
**所要時間**: 30分

- [ ] cdk-nag実行
  ```bash
  pnpm synth
  ```
- [ ] SES/Route53の警告確認

### 4.8 送信テスト
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
- `packages/cdk/lib/constructs/high-level/email-sending-construct.ts`
- `packages/cdk/lib/constructs/low-level/ses-*.ts`
- スナップショットファイル更新
- cdk-nagチェック通過
- 送信テスト結果レポート
- スパムスコア評価結果

---

## フェーズ5: 監視・テスト（1-2日）

### 5.1 MonitoringConstruct実装
**所要時間**: 3-4時間

- [ ] CloudWatchDashboardConstruct実装
  - Lambda実行回数・エラー率・実行時間
  - S3バケットサイズ
  - カスタムメトリクス（EmailForwarding/Success, Error）
- [ ] AlarmsConstruct実装
  - Lambda Error Rate > 5%
  - Lambda Duration > 25秒
  - SES Bounce Rate > 10%（オプション）
  - SNSアクションでアラート通知（cdk-nag準拠）
- [ ] SNSトピック作成
  - アラート通知先設定
  - SNS暗号化有効（cdk-nag準拠）

### 5.2 統合テスト実装
**所要時間**: 3-4時間

- [ ] Lambda統合テスト（LocalStack使用）
  - S3 → Lambda連携テスト
  - エンドツーエンドフロー
- [ ] 統合テスト実行
  ```bash
  pnpm test:integration
  ```

### 5.3 CDKスナップショット最終確認
**所要時間**: 1時間

- [ ] 全スナップショット更新
  ```bash
  pnpm --filter @r53-gmail/cdk test -- -u
  ```
- [ ] スナップショット差分レビュー
- [ ] 不要なスナップショット削除

### 5.4 cdk-nag最終検証
**所要時間**: 1時間

- [ ] 全機能統合後のcdk-nag実行
  ```bash
  pnpm synth
  ```
- [ ] 警告の最終確認
- [ ] 抑制設定の妥当性確認
- [ ] cdk-nagレポート生成

### 5.5 カバレッジ確認
**所要時間**: 1時間

- [ ] 全パッケージのカバレッジ確認
  ```bash
  pnpm test:coverage
  ```
- [ ] カバレッジ80%未満の箇所を特定
- [ ] 追加テスト実装

### 5.6 パフォーマンステスト
**所要時間**: 2時間

- [ ] メール配送遅延測定
- [ ] Lambda実行時間測定
- [ ] スループットテスト

**成果物**:
- `packages/cdk/lib/constructs/high-level/monitoring-construct.ts`
- `packages/lambda-email-forwarder/test/**/*.integration.test.ts`
- `packages/cdk/test/**/*.test.ts`
- スナップショットファイル（全Construct）
- cdk-nagレポート
- カバレッジレポート（HTML）
- テスト結果レポート
- CloudWatchダッシュボード

---

## フェーズ6: ドキュメント・運用準備（1日）

### 6.1 セットアップドキュメント作成
**所要時間**: 3-4時間

- [ ] セットアップ手順書作成
  - 前提条件
  - ステップバイステップガイド
  - 環境変数設定
  - デプロイ手順（cdk-nag含む）
- [ ] トラブルシューティングガイド
  - よくある問題と解決方法
  - エラーメッセージ一覧
  - cdk-nag警告対応方法
- [ ] 運用マニュアル
  - 日常運用タスク
  - ログ確認方法
  - アラート対応手順

### 6.2 CI/CDパイプライン構築（オプション）
**所要時間**: 3-4時間

- [ ] GitHub Actionsワークフロー作成
  ```yaml
  .github/workflows/test.yml
  .github/workflows/deploy.yml
  ```
- [ ] Vitestテスト自動実行
- [ ] カバレッジレポート自動生成
- [ ] cdk-nag自動チェック統合
- [ ] スナップショットテスト自動実行
- [ ] Lambdaデプロイパイプライン
- [ ] シークレット管理（GitHub Secrets）

### 6.3 コスト最適化確認
**所要時間**: 1-2時間

- [ ] CloudWatch予算アラート設定
- [ ] コスト見積もり確認
- [ ] 不要リソースのクリーンアップ

**成果物**:
- `docs/setup-guide.md`
- `docs/troubleshooting.md`
- `docs/operations-manual.md`
- `.github/workflows/test.yml`（Vitest自動実行）
- `.github/workflows/deploy.yml`（cdk-nag統合）

---

## マイルストーン

| マイルストーン | 完了条件 | 期日 |
|---------------|---------|------|
| M1: 環境準備完了 | pnpm workspace、CDK（cdk-nag統合）、Lambda初期化、Vitest設定完了 | Day 2 |
| M2: CDK基盤実装完了 | IAM、Secrets、S3のConstruct実装、スナップショットテスト、cdk-nagチェック通過 | Day 3 |
| M3: 受信機能実装完了 | テストメール受信成功、ユニットテスト80%以上、cdk-nagチェック通過 | Day 5 |
| M4: 送信機能実装完了 | カスタムドメインで送信成功、スナップショット更新、cdk-nagチェック通過 | Day 7 |
| M5: テスト完了 | すべてのテストケース合格、カバレッジ80%以上、cdk-nag最終検証通過 | Day 9 |
| M6: 本番リリース | ドキュメント完成、CI/CD構築、運用開始 | Day 10 |

---

## リスク管理

| リスク | 軽減策 | コンティンジェンシープラン |
|--------|--------|-----------------------------|
| SESドメイン認証遅延（最大72時間） | 早期に申請開始 | 外部転送サービス一時利用 |
| Gmail API認証エラー | ドキュメント事前確認 | 代替メール転送方法検討 |
| Lambda実装バグ | Vitestユニットテスト実施 | ロールバック手順準備 |
| DNS伝播遅延 | TTL短縮（300秒） | 伝播待機時間を計画に含める |
| CDKデプロイエラー | 差分確認（cdk diff）実施 | 手動ロールバック手順準備 |
| スナップショット変更検出 | 変更差分を必ずレビュー | スナップショット更新前に設計再確認 |
| cdk-nag警告多発 | 各フェーズで段階的にチェック | 抑制設定（理由明記）または設計見直し |
| カバレッジ不足 | 各実装直後にテスト実装 | カバレッジ80%未満は追加テスト |
| コスト超過 | CloudWatch予算アラート設定 | 使用量上限設定 |

---

## 開発環境

### 必要なツール
- Node.js 20.x
- pnpm 8.0+
- AWS CLI v2
- Git
- TypeScript 5.x

### 推奨IDEプラグイン
- AWS Toolkit for VS Code
- ESLint
- Prettier
- Vitest Runner

### 開発コマンド

```bash
# 依存関係インストール
pnpm install

# ビルド（Turborepo並列実行）
pnpm build  # Turborepoで並列ビルド

# テスト（Vitest）
pnpm test                     # 全テスト実行
pnpm test:unit                # ユニットテストのみ
pnpm test:integration         # 統合テストのみ
pnpm test:watch               # ウォッチモード
pnpm test:coverage            # カバレッジ計測
pnpm test:ui                  # Vitest UI起動

# CDKコマンド
pnpm synth                              # cdk-nagチェック + テンプレート生成
pnpm diff                               # 差分確認
pnpm deploy                             # デプロイ
pnpm --filter @r53-gmail/cdk destroy    # スタック削除

# Lint & Format
pnpm lint
pnpm format
```

---

## テスト戦略詳細

### Vitestの特徴

- **高速**: Viteベースで並列実行、HMR対応
- **Jest互換**: JestのAPIとほぼ同じ、移行容易
- **TypeScript対応**: 追加設定不要
- **UI**: ブラウザベースのテストUI提供

### スナップショットテスト

**目的**: CloudFormationテンプレートの意図しない変更を検出

**実装例**:
- EmailForwardingStack全体のスナップショット
- 各高レベルConstructのスナップショット
- IAMポリシー、S3バケットポリシーのスナップショット

**更新フロー**:
1. Construct変更
2. テスト実行（失敗）
3. 変更差分確認
4. スナップショット更新（`-u`フラグ）
5. 差分レビュー

### カバレッジ目標

- **全体**: 80%以上
- **Services**: 90%以上
- **Utils**: 85%以上
- **Handlers**: 75%以上

---

## cdk-nag統合詳細

### セットアップ

```bash
cd packages/cdk
pnpm add -D cdk-nag
```

### 使用方法

bin/app.tsでAwsSolutionsChecksを適用

### チェック項目例

- **IAM**: 過度な権限付与の検出
- **S3**: パブリックアクセス、暗号化、ログ設定
- **Lambda**: 予約済み同時実行、トレーシング、環境変数の暗号化
- **Secrets Manager**: 自動ローテーション設定
- **SNS**: トピック暗号化

### 抑制方法

正当な理由がある場合のみ使用

### 実行タイミング

- 各フェーズのConstruct実装後
- CDKデプロイ前（`pnpm synth`）
- CI/CDパイプライン内

---

## 次のステップ

実装開始前に以下を確認：
- [ ] AWSアカウントアクセス権限確認
- [ ] Route53でドメイン管理確認
- [ ] Gmailアカウント準備
- [ ] Node.js 20.x、pnpm、AWS CLI導入完了
- [ ] プロジェクトリポジトリクローン完了

準備完了後、**フェーズ1**から順次実装を開始してください。
