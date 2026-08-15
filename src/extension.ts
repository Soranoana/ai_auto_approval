import * as fs from 'node:fs/promises';
import * as os from 'node:os';
import * as path from 'node:path';
import * as vscode from 'vscode';

type GuardConfig = {
    enableFullAuto: boolean;
    blockedCommands: string[];
    blockedPaths: string[];
    blockedTools: string[];
    blockedDomains: string[];
    autoApproveTerminalCommands: string[];
};

type ClaudeSettings = {
    permissions?: {
        defaultMode?: string;
        deny?: string[];
    };
    [key: string]: unknown;
};

const section = 'aiApprovalGuard';

export function activate(context: vscode.ExtensionContext): void {
    context.subscriptions.push(
        vscode.commands.registerCommand('aiApprovalGuard.configure', () => configure()),
        vscode.commands.registerCommand('aiApprovalGuard.applyPolicy', () => applyPolicy())
    );
}

async function configure(): Promise<void> {
    const choice = await vscode.window.showQuickPick(
        [
            { label: '$(shield) 全自動ポリシーを適用', action: 'apply' },
            { label: '$(settings-gear) 設定を開く', action: 'settings' },
            { label: '$(file-code) Claude 設定を開く', action: 'claude' }
        ],
        { placeHolder: 'AI Approval Guard の操作を選択' }
    );

    if (choice?.action === 'apply') {
        await applyPolicy();
    } else if (choice?.action === 'settings') {
        await vscode.commands.executeCommand('workbench.action.openSettings', '@ext:local.ai-approval-guard');
    } else if (choice?.action === 'claude') {
        await vscode.commands.executeCommand('workbench.action.openSettingsJson');
    }
}

async function applyPolicy(): Promise<void> {
    const config = readConfig();
    const confirmation = await vscode.window.showWarningMessage(
        'Copilot と Claude の承認を広く自動化します。禁止ルール以外のツール・コマンドが実行される可能性があります。',
        { modal: true },
        '適用する'
    );

    if (confirmation !== '適用する') {
        return;
    }

    await applyCopilotPolicy(config);
    const claudeInstalled = await applyClaudePolicy(config);
    await vscode.workspace.getConfiguration(section).update('enableFullAuto', true, vscode.ConfigurationTarget.Global);

    const claudeMessage = claudeInstalled
        ? 'Claude のポリシーも適用しました。'
        : 'Claude Code は未インストールのため、Claude の設定は変更していません。';
    vscode.window.showInformationMessage(`AI Approval Guard: Copilot の全自動ポリシーを適用しました。${claudeMessage}`);
}

function readConfig(): GuardConfig {
    const config = vscode.workspace.getConfiguration(section);
    return {
        enableFullAuto: config.get<boolean>('enableFullAuto', false),
        blockedCommands: config.get<string[]>('blockedCommands', []),
        blockedPaths: config.get<string[]>('blockedPaths', []),
        blockedTools: config.get<string[]>('blockedTools', []),
        blockedDomains: config.get<string[]>('blockedDomains', []),
        autoApproveTerminalCommands: config.get<string[]>('autoApproveTerminalCommands', [])
    };
}

async function applyCopilotPolicy(config: GuardConfig): Promise<void> {
    const target = vscode.ConfigurationTarget.Global;
    const copilot = vscode.workspace.getConfiguration();

    await copilot.update('chat.permissions.default', 'bypass', target);
    await copilot.update('chat.tools.terminal.enableAutoApprove', true, target);

    const commandRules: Record<string, boolean> = {};
    for (const command of config.autoApproveTerminalCommands) {
        commandRules[command] = true;
    }
    for (const command of config.blockedCommands) {
        commandRules[command] = false;
    }
    await copilot.update('chat.tools.terminal.autoApprove', commandRules, target);

    const urlRules: Record<string, boolean> = {};
    for (const domain of config.blockedDomains) {
        urlRules[`https://${domain}/*`] = false;
        urlRules[`http://${domain}/*`] = false;
    }
    await copilot.update('chat.tools.urls.autoApprove', urlRules, target);
}

async function applyClaudePolicy(config: GuardConfig): Promise<boolean> {
    const claudeExtension = vscode.extensions.getExtension('anthropic.claude-code');
    if (!claudeExtension) {
        return false;
    }

    const target = vscode.ConfigurationTarget.Global;
    const claudeConfiguration = vscode.workspace.getConfiguration('claudeCode');
    const updatedMode = await updateIfRegistered(claudeConfiguration, 'initialPermissionMode', 'bypassPermissions', target);
    const updatedDangerousMode = await updateIfRegistered(claudeConfiguration, 'allowDangerouslySkipPermissions', true, target);

    const claudeDirectory = path.join(os.homedir(), '.claude');
    const settingsPath = path.join(claudeDirectory, 'settings.json');
    await fs.mkdir(claudeDirectory, { recursive: true });

    let settings: ClaudeSettings = {};
    try {
        settings = JSON.parse(await fs.readFile(settingsPath, 'utf8')) as ClaudeSettings;
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw new Error(`Claude settings.json の読み込みに失敗しました: ${String(error)}`);
        }
    }

    try {
        await fs.copyFile(settingsPath, `${settingsPath}.ai-approval-guard.bak`);
    } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
            throw error;
        }
    }

    const deny = new Set(settings.permissions?.deny ?? []);
    for (const command of config.blockedCommands) {
        deny.add(`Bash(${command} *)`);
        deny.add(`PowerShell(${command} *)`);
    }
    for (const filePath of config.blockedPaths) {
        deny.add(`Read(${filePath})`);
        deny.add(`Edit(${filePath})`);
    }
    for (const tool of config.blockedTools) {
        deny.add(tool);
    }
    for (const domain of config.blockedDomains) {
        deny.add(`WebFetch(domain:${domain})`);
    }

    settings.permissions = {
        ...settings.permissions,
        defaultMode: 'bypassPermissions',
        deny: [...deny]
    };
    await fs.writeFile(settingsPath, `${JSON.stringify(settings, null, 2)}\n`, 'utf8');

    if (!updatedMode || !updatedDangerousMode) {
        void vscode.window.showWarningMessage(
            'Claude Code 拡張機能の VS Code 設定キーが見つからなかったため、claudeCode.* の更新はスキップしました。.claude/settings.json にはポリシーを適用しています。'
        );
    }

    return true;
}

async function updateIfRegistered<T>(
    configuration: vscode.WorkspaceConfiguration,
    key: string,
    value: T,
    target: vscode.ConfigurationTarget
): Promise<boolean> {
    const inspected = configuration.inspect<T>(key);
    if (!inspected) {
        return false;
    }

    try {
        await configuration.update(key, value, target);
        return true;
    } catch {
        return false;
    }
}

export function deactivate(): void {
    // Nothing to dispose; commands are owned by the extension context.
}
