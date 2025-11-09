# Gmail API設定ガイド

このガイドでは、カスタムドメインでメールを送受信するためのGmail API設定手順を説明します。

## 前提条件

- Google Cloud Platformアカウント
- Gmailアカウント
- AWS CLIとAWS認証情報の設定完了

## 1. Google Cloud Consoleでの設定

### 1.1 プロジェクトの作成

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）

### 1.2 Gmail APIの有効化

1. **APIとサービス > ライブラリ** に移動
2. 「Gmail API」を検索
3. **有効にする** をクリック

### 1.3 OAuth同意画面の設定

1. **APIとサービス > OAuth同意画面** に移動
2. **外部** を選択して **作成**
3. 以下の情報を入力：
   - **アプリ名**: `Gmail Forwarder`（任意）
   - **ユーザーサポートメール**: あなたのGmailアドレス
   - **デベロッパーの連絡先情報**: あなたのGmailアドレス
4. **保存して次へ**
5. **スコープ** 画面で **保存して次へ**（デフォルトのまま）
6. **テストユーザー** 画面で **ADD USERS** をクリック
7. あなたのGmailアドレス（例: `user@gmail.com`）を追加
8. **保存して次へ**
9. **概要** 画面で内容を確認して **ダッシュボードに戻る**

### 1.4 OAuth認証情報の作成

1. **APIとサービス > 認証情報** に移動
2. **認証情報を作成 > OAuth クライアント ID** をクリック
3. アプリケーションの種類：**ウェブ アプリケーション** を選択
4. 名前：`Gmail Forwarder Web Client`（任意）
5. **承認済みのリダイレクトURI** に以下を追加：
   - `http://localhost:8080`
6. **作成** をクリック
7. 表示されたダイアログで **JSONをダウンロード** をクリック
8. ダウンロードしたファイルを `client_secret.json` にリネームしてプロジェクトルートに配置

## 2. 認証フローの実行

### 2.1 依存関係のインストール

```bash
pnpm install
```

### 2.2 スクリプトのビルド

```bash
pnpm --filter @r53-gmail/scripts build
```

### 2.3 認証の実行

```bash
node packages/scripts/dist/gmail-auth.js client_secret.json
```

### 2.4 ブラウザでの認証

1. ターミナルに表示されたURLをブラウザで開く
2. Googleアカウントでログイン（テストユーザーとして追加したアカウント）
3. 「Gmail Forwarderが次の許可をリクエストしています」画面で **続行** をクリック
4. 「このアプリはGoogleで確認されていません」と表示された場合：
   - **詳細** をクリック
   - **Gmail Forwarder（安全ではないページ）に移動** をクリック
5. 権限の確認画面で **許可** をクリック
6. ブラウザに「Authentication successful!」と表示されたら完了

### 2.5 認証情報の確認

```bash
aws secretsmanager get-secret-value \
  --secret-id gmail-api-credentials \
  --region us-east-1 \
  --query SecretString \
  --output text | jq
```

以下のような出力が表示されれば成功：

```json
{
  "client_id": "850289889627-xxx.apps.googleusercontent.com",
  "client_secret": "GOCSPX-xxx",
  "refresh_token": "1//0xxx"
}
```

## 3. Gmail側の送信設定（オプション）

カスタムドメインからメールを送信する場合、Gmailの設定も必要です。

### 3.1 SES SMTP認証情報の作成

1. AWS Console > Amazon SES に移動
2. **SMTP設定** をクリック
3. **SMTP認証情報の作成** をクリック
4. IAMユーザー名を確認して **作成**
5. **認証情報をダウンロード** をクリック（重要：この画面を閉じると再表示できません）

### 3.2 Gmailでの送信設定

1. Gmailを開く
2. **設定（歯車アイコン）> すべての設定を表示** をクリック
3. **アカウントとインポート** タブを選択
4. **名前** セクションで **他のメールアドレスを追加** をクリック
5. ポップアップウィンドウで以下を入力：
   - **名前**: 送信者名（例: `山田太郎`）
   - **メールアドレス**: カスタムドメインのアドレス（例: `user@example.com`）
   - **エイリアスとして扱います** のチェックを外す
6. **次のステップ** をクリック
7. SMTP設定を入力：
   - **SMTPサーバー**: `email-smtp.us-east-1.amazonaws.com`（リージョンに応じて変更）
   - **ポート**: `587`
   - **ユーザー名**: SES SMTP認証情報のユーザー名
   - **パスワード**: SES SMTP認証情報のパスワード
   - **TLSを使用したセキュリティで保護された接続** を選択
8. **アカウントを追加** をクリック
9. 確認コードがカスタムドメインのメールアドレスに送信されます
10. Lambda関数でGmailに転送されたメールから確認コードを取得
11. 確認コードを入力して **確認** をクリック

## トラブルシューティング

### エラー: redirect_uri_mismatch

**原因**: OAuth認証情報の承認済みリダイレクトURIに `http://localhost:8080` が登録されていない

**解決方法**:
1. Google Cloud Console > APIとサービス > 認証情報
2. 作成したOAuth 2.0 クライアントIDをクリック
3. 承認済みのリダイレクトURIに `http://localhost:8080` を追加
4. 保存

### エラー: access_denied (403)

**原因**: OAuth同意画面のテストユーザーに追加されていない

**解決方法**:
1. Google Cloud Console > APIとサービス > OAuth同意画面
2. テストユーザーセクションで **ADD USERS** をクリック
3. 使用するGmailアドレスを追加
4. 保存

### エラー: invalid_grant

**原因**: 認証コードがURLエンコードされている、または期限切れ

**解決方法**:
- 認証フローを最初からやり直す
- ブラウザのキャッシュをクリアしてから再試行

### AWS SSO Token Expired

**原因**: AWS SSOセッションの有効期限切れ

**解決方法**:
```bash
aws sso login
```

### Gmail送信設定で確認コードが届かない

**原因**: SESがサンドボックスモードで、カスタムドメインが検証されていない

**解決方法**:
1. AWS Console > Amazon SES > Verified identities
2. カスタムドメインを追加して検証
3. Route53でDNSレコード（MX、TXT）を設定
4. 検証完了後、再度確認コードの送信を試行

## セキュリティに関する注意事項

- `client_secret.json` は機密情報です。Gitにコミットしないでください
- `.gitignore` に `client_secret*.json` が含まれていることを確認してください
- 本番環境では、OAuth同意画面を「公開」ステータスにする必要があります（Googleの審査が必要）
- テスト環境では最大100人のテストユーザーまで追加可能です

## 参考リンク

- [Gmail API Documentation](https://developers.google.com/gmail/api)
- [OAuth 2.0 for Web Server Applications](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Amazon SES SMTP Interface](https://docs.aws.amazon.com/ses/latest/dg/send-email-smtp.html)
