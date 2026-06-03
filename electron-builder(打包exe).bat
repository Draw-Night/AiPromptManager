@echo off
:: 强制使用 UTF-8 编码避免中文乱码
chcp 65001 >nul
title AI Prompt Hub - 自动化打包工具

cd /d "D:\PromptManager"

echo [1/3] 正在为您配置国内淘宝镜像加速源（打包下载极速完成）...
call npm config set registry https://registry.npmmirror.com
set ELECTRON_MIRROR=https://npmmirror.com/mirrors/electron/
set ELECTRON_BUILDER_BINARIES_MIRROR=https://npmmirror.com/mirrors/electron-builder-binaries/

echo [2/3] 正在安装/升级打包程序必备组件 (electron-builder)...
call npm install --save-dev electron-builder

echo [3/3] 正在编译并打包成 EXE (首次打包需要下载外壳，请耐心等待1~2分钟)...
call npm run pack

if %errorlevel% equ 0 (
    echo.
    echo ==================================================
    echo 🎉 打包成功！
    echo 绿色版单文件程序已生成在: D:\PromptManager\dist\ 目录下
    echo 生成文件名: AIPromptHub.exe
    echo.
    echo 💡 提示：
    echo 这个 .exe 文件可以拷贝到任意 Win10/Win11 电脑上双击直接运行！
    echo 运行后，数据会安全存放在您电脑的 “我的文档\AIPromptHub\prompts.json” 中。
    echo ==================================================
) else (
    echo.
    echo ❌ [错误] 打包失败，请检查上方控制台报错信息。
)

pause