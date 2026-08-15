# AI Approval Guard

VS Code 拡張機能です。Copilot と Claude の自動承認を有効化しつつ、指定したコマンド・パス・ツール・ドメインを拒否します。

## 使い方

1. `npm install`
2. VS Code で `F5` を押して Extension Development Host を起動
3. コマンドパレットから `AI Approval Guard: Configure Rules` を実行
4. `AI Approval Guard: Apply Full Auto Policy` を実行

設定は VS Code のユーザー設定で変更できます。

- `aiApprovalGuard.blockedCommands`
- `aiApprovalGuard.blockedPaths`
- `aiApprovalGuard.blockedTools`
- `aiApprovalGuard.blockedDomains`
- `aiApprovalGuard.autoApproveTerminalCommands`

Claude のルールは `%USERPROFILE%\\.claude\\settings.json` にバックアップを作成してから反映します。Copilot の設定は VS Code ユーザー設定へ反映します。

## 注意

全自動モードは、AI がターミナルやファイルを操作できる状態です。信頼できるワークスペース、またはコンテナ・VM で使用してください。企業ポリシーや保護された操作は、この拡張機能から解除できません。
