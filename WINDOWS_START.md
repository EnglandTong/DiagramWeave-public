# Windows 下载后启动说明 / Windows Startup After Download

## 中文

如果双击 `start-diagramweave.bat` 或 `启动DiagramWeave.bat` 时看到：

> 智能应用控制已阻止可能不安全的文件

这是 Windows Smart App Control 对“来自 Internet 的批处理文件”的拦截。DiagramWeave 是本地 Web 工具，但从 GitHub 下载的 ZIP 和其中的 `.bat` 文件可能会被 Windows 标记为来自 Internet，因此会被阻止双击运行。

### 推荐方式 1：先解除 ZIP 阻止，再解压

1. 右键点击从 GitHub 下载的 ZIP 文件。
2. 选择“属性”。
3. 在“常规”页底部勾选“解除锁定”或“取消阻止”。
4. 点击“应用”。
5. 重新解压 ZIP。
6. 双击 `start-diagramweave.bat` 或 `启动DiagramWeave.bat`。

这是最推荐的方式，因为它会让解压出来的文件不再带有 Internet 阻止标记。

### 如果提示“未找到 pnpm / npm”

这表示 BAT 已经可以运行，但当前电脑没有可用的 npm/pnpm，无法安装首次运行所需依赖。

处理方式：

1. 安装官方 Node.js LTS：<https://nodejs.org/>
2. 安装时使用默认选项，确保包含 npm。
3. 安装完成后，关闭当前 BAT 窗口。
4. 重新双击 `start-diagramweave.bat` 或 `启动DiagramWeave.bat`。

如果已经安装过 Node.js，但仍然提示找不到 npm，通常是安装包不完整、环境变量未刷新，或使用了不带 npm 的 Node 运行环境。建议重新安装官方 Node.js LTS，然后重新打开 BAT。

### 推荐方式 2：已解压后解除整个目录阻止

在 DiagramWeave 解压目录中打开 PowerShell，执行：

```powershell
Get-ChildItem -Recurse | Unblock-File
```

然后重新双击 `start-diagramweave.bat` 或 `启动DiagramWeave.bat`。

### 方式 3：不用 BAT，直接命令行启动

如果仍然不能双击 BAT，可以在项目目录中执行：

```bash
pnpm install
pnpm serve
```

然后打开：

<http://127.0.0.1:4173/flowchart-editor.html>

### 注意

- 不建议关闭 Windows Smart App Control。
- 不建议直接用 `file://` 打开 `flowchart-editor.html`。
- 如果公司电脑有额外安全策略，可能需要 IT 管理员允许本地批处理脚本运行。

---

## English

If double-clicking `start-diagramweave.bat` or `启动DiagramWeave.bat` shows:

> Smart App Control blocked a potentially unsafe file

Windows Smart App Control is blocking a batch file downloaded from the Internet. DiagramWeave is a local web app, but ZIP files downloaded from GitHub and the `.bat` files extracted from them may be marked by Windows as Internet-origin files.

### Recommended Option 1: Unblock the ZIP before extracting

1. Right-click the ZIP file downloaded from GitHub.
2. Choose Properties.
3. On the General tab, check Unblock.
4. Click Apply.
5. Extract the ZIP again.
6. Double-click `start-diagramweave.bat` or `启动DiagramWeave.bat`.

This is the recommended option because extracted files will no longer carry the Internet block marker.

### If it says "pnpm / npm was not found"

This means the BAT file can now run, but npm/pnpm is not available on the computer, so DiagramWeave cannot install its first-run dependencies.

Fix:

1. Install the official Node.js LTS: <https://nodejs.org/>
2. Use the default installer options, which include npm.
3. Close the current BAT window.
4. Double-click `start-diagramweave.bat` or `启动DiagramWeave.bat` again.

If Node.js is already installed but npm is still missing, the installation may be incomplete, the PATH may not have refreshed, or the Node runtime may not include npm. Reinstall the official Node.js LTS and reopen the BAT window.

### Recommended Option 2: Unblock the extracted folder

Open PowerShell in the extracted DiagramWeave folder and run:

```powershell
Get-ChildItem -Recurse | Unblock-File
```

Then double-click `start-diagramweave.bat` or `启动DiagramWeave.bat` again.

### Option 3: Start without BAT

If BAT launch is still blocked, run these commands in the project folder:

```bash
pnpm install
pnpm serve
```

Then open:

<http://127.0.0.1:4173/flowchart-editor.html>

### Notes

- Do not disable Windows Smart App Control just for this.
- Do not open `flowchart-editor.html` directly with `file://`.
- On managed company computers, an IT administrator may need to allow local batch scripts.
