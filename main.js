const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs'); // 引入文件系统模块
const expressApp = require('./server'); // 引入后台 Express 服务

let mainWindow;
const PORT = 19145; // 端口
const STATE_FILE = path.join(__dirname, 'window-state.json'); // 窗口大小配置文件

// 读取历史窗口尺寸
function getSavedWindowState() {
    let defaults = { width: 1250, height: 800 }; // 默认大小（加宽了以容纳第三栏）
    try {
        if (fs.existsSync(STATE_FILE)) {
            const data = fs.readFileSync(STATE_FILE, 'utf-8');
            return JSON.parse(data);
        }
    } catch (e) {
        console.error("读取窗口配置失败，使用默认值", e);
    }
    return defaults;
}

// 保存窗口尺寸
function saveWindowState(width, height) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify({ width, height }), 'utf-8');
    } catch (e) {
        console.error("保存窗口配置失败", e);
    }
}

function createWindow() {
    const savedState = getSavedWindowState();

    // 创建浏览器窗口
    mainWindow = new BrowserWindow({
        width: savedState.width,
        height: savedState.height,
        title: "🎨 AI Prompt Hub",
        autoHideMenuBar: true, // 自动隐藏菜单栏
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    // 加载网页服务
    mainWindow.loadURL(`http://localhost:${PORT}`);

    // 监听窗口调整大小事件
    mainWindow.on('resize', () => {
        const [width, height] = mainWindow.getSize();
        saveWindowState(width, height); // 实时保存窗口大小
    });

    // 窗口关闭时释放内存
    mainWindow.on('closed', function () {
        mainWindow = null;
    });
}

// Electron 准备就绪
app.on('ready', () => {
    expressApp.listen(PORT, () => {
        console.log(`后台服务已在端口 ${PORT} 启动`);
        createWindow();
    });
});

app.on('window-all-closed', function () {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', function () {
    if (mainWindow === null) {
        createWindow();
    }
});