# AI Approval Guard

AI Approval Guard は、VS Code の AI エージェントを自動承認モードで実行しながら、指定したコマンド・パス・ツール・ドメインを拒否する拡張機能です。

## Marketplace から導入する

1. VS Code の拡張機能ビューを開きます（`Ctrl+Shift+X`）。
2. `AI Approval Guard` を検索します。
3. Marketplace の公開元を確認し、**インストール**を選択します。
4. 必要に応じて **Reload Required** を選択し、VS Code を再読み込みします。

Marketplace に公開されていない場合は、公開者から受け取った `.vsix` ファイルを拡張機能ビューの `...` メニューから **VSIX からのインストール...** で導入してください。

## 一般ユーザー向けの使い方

### 全自動ポリシーを適用する

1. Copilot または Claude Code を使用するワークスペースを VS Code で開きます。
2. コマンドパレットを開きます（`Ctrl+Shift+P`）。
3. `AI Approval Guard: Configure Rules` を実行します。
4. **全自動ポリシーを適用**を選択します。
5. 警告内容を確認し、**適用する**を選択します。

適用後の動作は次のとおりです。

- Copilot: 自動承認とターミナルコマンドの自動承認を有効化します。
- Claude Code がインストール済みの場合: Claude の自動承認設定と禁止ルールを適用します。
- Claude Code がインストールされていない場合: Claude の設定を変更せず、Copilot の設定だけを適用します。

### 設定を変更する

VS Code の設定画面で `AI Approval Guard` を検索すると、次の項目を変更できます。配列項目は、設定画面の JSON 配列として編集してください。

- `aiApprovalGuard.blockedCommands`: 拒否するコマンドの先頭部分
- `aiApprovalGuard.blockedPaths`: Claude が読み書きできないパスパターン
- `aiApprovalGuard.blockedTools`: Claude が使用できないツール名や MCP ツールパターン
- `aiApprovalGuard.blockedDomains`: Claude がアクセスできないドメイン
- `aiApprovalGuard.autoApproveTerminalCommands`: Copilot が自動承認するコマンド

設定変更後、コマンドパレットから `AI Approval Guard: Apply Full Auto Policy` をもう一度実行して反映します。

### 初期状態で拒否される操作

- `git push --force`
- `git reset --hard`
- `git clean -fd`
- `git checkout -- .`
- `git restore .`
- `git stash clear` / `git stash drop`
- `rm -rf`
- `Remove-Item -Recurse -Force`
- `terraform destroy`
- `kubectl delete`
- `.env` と `.env.*`
- `secrets` 配下と `.ssh` 配下
- MCP ツール（`mcp__*`）

## セキュリティ上の注意

全自動モードでは、AI エージェントがファイルを編集したり、ターミナルコマンドを実行したりできます。禁止ルールは安全性を高めますが、すべての危険な操作を検出できるものではありません。

- 信頼できるワークスペースでのみ使用してください。
- 本番環境や重要な認証情報を扱う作業では、手動承認モードを推奨します。
- AI が作成した変更は、コミットやデプロイの前に確認してください。
- Claude の設定を書き換える前に、`%USERPROFILE%\\.claude\\settings.json.ai-approval-guard.bak` を作成します。
- 企業ポリシー、管理者設定、Claude / Copilot が強制する確認は、この拡張機能から解除できません。

### 全自動ポリシーを元に戻す

この拡張機能は、適用前の Claude 設定をバックアップします。Claude の設定を戻す場合は、VS Code と Claude Code を終了してから、バックアップを確認したうえで次のファイルを復元してください。

```text
%USERPROFILE%\\.claude\\settings.json.ai-approval-guard.bak
```

Copilot の設定は VS Code の設定画面で、`chat.permissions.default`、`chat.tools.terminal.enableAutoApprove`、`chat.tools.terminal.autoApprove`、`chat.tools.urls.autoApprove` を確認・変更してください。

## 開発者向け

### 開発環境で実行する

```powershell
npm install
npm run check-types
npm run build
```

VS Code でこのプロジェクトを開き、`F5` を押して **Run AI Approval Guard Extension** を起動します。新しく開いた Extension Development Host でコマンドパレットを開き、拡張機能のコマンドを実行します。

### VSIX を作成する

```powershell
npm run check-types
npm run build
npx vsce package
```

生成された `.vsix` は、拡張機能ビューの `...` メニューから **VSIX からのインストール...** を選択してテストできます。

### Marketplace に公開する

公開には Marketplace の Publisher と `Marketplace (Manage)` 権限を持つ認証情報が必要です。公開者 ID を `package.json` の `publisher` に設定した後、次を実行します。

```powershell
npx vsce login <publisher-id>
npx vsce publish
```

認証情報はソースコードや README に記載しないでください。詳しい公開手順は [VS Code の公式ドキュメント](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) を参照してください。

## ライセンス

MIT
