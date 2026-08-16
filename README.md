# AI Approval Guard

VS Code の AI エージェントを、必要な操作だけ自動で進められるようにする拡張機能です。

Copilot や Claude Code の承認を減らしながら、危険なコマンド、機密ファイル、MCP ツール、指定したドメインをブロックできます。

## できること

- Copilot の自動承認を有効にする
- Claude Code がインストールされている場合は Claude の自動承認を有効にする
- Claude Code がない環境では Claude の設定を変更せず、Copilot だけを設定する
- 危険なターミナルコマンドを拒否する
- `.env`、秘密情報、SSH 設定などの読み書きを拒否する
- MCP ツールを拒否する
- Claude の WebFetch に対する拒否ドメインを設定する
- 自動承認する Copilot のコマンドを自分で追加する
- Claude の既存設定をバックアップしてから変更する

## インストール

### Marketplace からインストールする

1. VS Code を起動します。
2. 拡張機能ビューを開きます（`Ctrl+Shift+X`）。
3. `AI Approval Guard` を検索します。
4. 公開元を確認して **インストール**を選択します。
5. VS Code の再読み込みが表示されたら、**再読み込み**を選択します。

### VSIX からインストールする

Marketplace に接続できない場合や、テスト版を使う場合は `.vsix` ファイルからインストールできます。

1. 拡張機能ビューを開きます。
2. 右上の `...` を選択します。
3. **VSIX からのインストール...** を選択します。
4. `ai-approval-guard-*.vsix` を選択します。
5. VS Code を再読み込みします。

## 初回設定

1. Copilot または Claude Code を使用するワークスペースを開きます。
2. コマンドパレットを開きます（`Ctrl+Shift+P`）。
3. `AI Approval Guard: Configure Rules` を実行します。
4. **全自動ポリシーを適用**を選択します。
5. 警告を確認し、問題がなければ **適用する**を選択します。

適用後は、次のように動作します。

| 環境 | 動作 |
| --- | --- |
| Copilot のみ | Copilot の自動承認を設定します |
| Claude Code あり | Copilot と Claude Code の両方を設定します |
| Claude Code なし | Claude の設定を変更せず、Copilot だけを設定します |

## 初期状態の保護ルール

初期設定では、次の操作を拒否します。

### 危険なコマンド

- `git push --force`
- `git reset --hard`
- `git clean -fd`
- `git checkout -- .`
- `git restore .`
- `git stash clear`
- `git stash drop`
- `rm -rf`
- `Remove-Item -Recurse -Force`
- `terraform destroy`
- `kubectl delete`

### 機密情報とツール

- `.env` と `.env.*`
- `secrets` 配下
- `.ssh` 配下
- MCP ツール（`mcp__*`）

## 設定を変更する

VS Code の設定画面で `AI Approval Guard` を検索してください。配列項目は JSON 配列として編集します。

### `aiApprovalGuard.blockedCommands`

拒否するコマンドの先頭部分を指定します。例えば `docker system prune` を拒否する場合は、次を追加します。

```json
[
  "docker system prune"
]
```

### `aiApprovalGuard.blockedPaths`

Claude Code が読み書きできないパスパターンを指定します。

```json
[
  "**/.env",
  "**/.env.*",
  "**/secrets/**",
  "**/.ssh/**"
]
```

### `aiApprovalGuard.blockedTools`

Claude Code が使用できないツール名を指定します。MCP ツールをまとめて拒否する初期値は `mcp__*` です。

### `aiApprovalGuard.blockedDomains`

Claude Code が WebFetch でアクセスできないドメインを指定します。

```json
[
  "example.com",
  "internal.example.com"
]
```

### `aiApprovalGuard.autoApproveTerminalCommands`

Copilot が承認なしで実行できるターミナルコマンドを指定します。信頼できるコマンドだけを追加してください。

設定を変更した後は、コマンドパレットから `AI Approval Guard: Apply Full Auto Policy` を再実行して反映します。

## 設定を元に戻す

### Claude Code

Claude Code の設定を変更する前に、次のバックアップを作成します。

```text
%USERPROFILE%\\.claude\\settings.json.ai-approval-guard.bak
```

元に戻す場合は、VS Code と Claude Code を終了し、バックアップの内容を確認してから `settings.json` を復元してください。

### Copilot

VS Code の設定画面で次の項目を確認・変更します。

- `chat.permissions.default`
- `chat.tools.terminal.enableAutoApprove`
- `chat.tools.terminal.autoApprove`
- `chat.tools.urls.autoApprove`

## セキュリティについて

全自動承認では、AI エージェントがファイルを編集したり、ターミナルコマンドを実行したりできます。保護ルールは安全性を高めますが、すべての危険な操作を検出できるものではありません。

- 信頼できるワークスペースでのみ使用してください。
- 本番環境や重要な認証情報を扱う作業では、手動承認を推奨します。
- AI が作成した変更を、コミットやデプロイの前に確認してください。
- 禁止ルールを設定していても、コマンドの書き換えや別のツール経由の操作を完全には防げない場合があります。
- VS Code、Copilot、Claude Code、企業ポリシーが強制する確認は、この拡張機能から解除できません。

## トラブルシューティング

### コマンドが見つからない

拡張機能が有効になっているか確認し、必要なら VS Code を再読み込みしてください。

### 設定が反映されない

設定変更後に `AI Approval Guard: Apply Full Auto Policy` を再実行してください。企業管理の設定や AI エージェント側の保護機能は上書きできません。

### Claude の設定エラーが出る

Claude Code がインストールされていない環境では、Claude の設定は自動的にスキップされます。拡張機能を再読み込みしてから、もう一度ポリシーを適用してください。

## 開発者向け情報

開発、テスト、VSIX 作成、Marketplace 公開の手順は [dev/README.md](dev/README.md) に分離しています。

## ライセンス

MIT
