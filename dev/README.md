# AI Approval Guard 開発者向けガイド

この文書は AI Approval Guard の開発、テスト、VSIX 作成、Marketplace 公開に関するガイドです。一般ユーザー向けの導入方法は、プロジェクトルートの [README.md](../README.md) を参照してください。

## 前提条件

- Node.js 20 以上
- npm
- VS Code 1.100.0 以上
- Marketplace に公開する場合は Publisher と公開権限

## 開発環境のセットアップ

プロジェクトのルートで実行します。

```powershell
npm install
npm run check-types
npm run build
```

## Extension Development Host で実行する

1. VS Code でプロジェクトルートを開く
2. `F5` を押す
3. 起動構成 **Run AI Approval Guard Extension** を選択する
4. 新しく開いた Extension Development Host でコマンドパレットを開く
5. `AI Approval Guard: Configure Rules` を実行する

起動構成は [.vscode/launch.json](../.vscode/launch.json) にあります。

## テストとビルド

```powershell
npm run check-types
npm run build
```

`npm run build` は `dist/extension.js` と source map を生成します。

## VSIX を作成する

```powershell
npm run check-types
npm run build
npx vsce package
```

生成された VSIX は、VS Code の拡張機能ビューから **VSIX からのインストール...** を選択してテストできます。

## VSIX の内容を確認する

```powershell
npx vsce ls
```

公開パッケージには、実行に必要なファイルだけを含めます。除外ルールは [.vscodeignore](../.vscodeignore) で管理します。

Marketplace 用アイコンは `media/icon.png` です。SVG 原稿の `media/icon.svg` は公開パッケージから除外しています。

## Marketplace に公開する

### Publisher の準備

1. [Visual Studio Marketplace Publisher Management](https://marketplace.visualstudio.com/manage) で Publisher を作成する
2. Azure DevOps で `Marketplace (Manage)` 権限を持つ認証情報を用意する
3. `package.json` の `publisher` に Publisher ID を設定する

Publisher ID は公開後に変更できません。

### ログインと公開

```powershell
npx vsce login <publisher-id>
npx vsce publish
```

更新を公開する場合は、まず `package.json` の `version` を更新します。例:

```powershell
npx vsce publish patch
```

認証情報や PAT は、ソースコード、設定ファイル、README に記録しないでください。

詳しい仕様は [VS Code 公式の公開ガイド](https://code.visualstudio.com/api/working-with-extensions/publishing-extension) を参照してください。

## 実装上の注意

- Copilot の設定は VS Code のユーザー設定に書き込みます。
- Claude Code が導入されている場合だけ、Claude の VS Code 設定と `%USERPROFILE%\\.claude\\settings.json` を更新します。
- Claude Code が導入されていない環境では、Claude の設定処理をスキップします。
- Claude の既存設定を変更する前に `.ai-approval-guard.bak` を作成します。
- 企業ポリシーや AI エージェント側が強制する承認は、拡張機能から解除できません。
- 全自動承認は高い権限を持つため、公開前に禁止コマンド、機密パス、MCP ツールの初期値を確認してください。
