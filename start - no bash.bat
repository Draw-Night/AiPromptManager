@echo off
:: 强制 Windows 命令行（CMD）使用 UTF-8 编码
chcp 65001 >nul

title AI Prompt Hub 极速启动与修复工具
cd /d "D:\PromptManager"

:: 1. 检测是否需要重装
if not exist "node_modules\electron\dist\electron.exe" (
    echo [状态] 未检测到有效的 Electron 程序，正在为您强制进行[国内极速安装]...
    
    :: 强制删除旧的、残缺的依赖文件夹
    if exist "node_modules" rd /s /q "node_modules"
    if exist "package-lock.json" del /f /q "package-lock.json"

    echo [1/3] 正在设置淘宝 NPM 镜像源...
    call npm config set registry https://registry.npmmirror.com

    echo [2/3] 正在设置临时环境变量（避开 NPM 严格校验）...
    :: 【关键修改】使用 Windows 的 set 命令设置临时环境变量，完美兼容新版 NPM
    set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/

    echo [3/3] 开始极速安装依赖（约需30秒，请保持网络畅通）...
    call npm install

    echo [完成] 安装成功！
    timeout /t 2 >nul
)

:: 2. 正常启动
echo [状态] 正在为您拉起 AI 提示词管理工具...

powershell -windowstyle hidden -command "Start-Process cmd -ArgumentList '/c npm start' -WindowStyle Hidden"

if %errorlevel% neq 0 (
    echo.
    echo --------------------------------------------------
    echo [错误] 启动失败。
    echo --------------------------------------------------
    pause
)