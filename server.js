const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = express();

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

const isPackaged = __dirname.includes('app.asar'); 
let dataDir = __dirname;

if (isPackaged) {
    dataDir = path.join(os.homedir(), 'Documents', 'AIPromptHub');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
}

const DATA_FILE = path.join(dataDir, 'prompts.json');
const PRESETS_FILE = path.join(dataDir, 'presets.json');
const SETTINGS_FILE = path.join(dataDir, 'settings.json');

// 默认数据
const defaultData = [
    {
        "category": "人物",
        "prompts": [
            { 
                "id": 100001, 
                "name": "赛博女战士", 
                "positive": "1girl, cyberpunk warrior, cyberpunk jacket, neon glowing, holding katana, looking at viewer", 
                "negative": "low quality, bad hands, deformed",
                "desc": "💡【画师手账 · 赛博女战士使用指南】\n---------------------------------------------\n1. 推荐 Lora: CyberpunkStyle_v2 (权重推荐 0.75)\n2. 最佳采样器: DPM++ 2M SDE Karras (28步以上)",
                "starred": true
            }
        ]
    }
];

function generateUniqueID() {
    return Date.now() + Math.floor(Math.random() * 1000000);
}

// ==========================================
// 💡【核心性能优化】：引入服务器内存级变量缓存
// ==========================================
let memPromptsCache = null;
let memPresetsCache = null;
let memSettingsCache = null;

// 在程序启动时，一次性把所有数据读入电脑内存
function initDataToMemory() {
    // 1. 初始化 Prompts
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4), 'utf-8');
        memPromptsCache = defaultData;
    } else {
        try {
            const raw = fs.readFileSync(DATA_FILE, 'utf-8');
            memPromptsCache = JSON.parse(raw);
            
            // 清洗脏数据
            let changed = false;
            const seenIds = new Set();
            if (Array.isArray(memPromptsCache)) {
                memPromptsCache.forEach(cat => {
                    if (Array.isArray(cat.prompts)) {
                        cat.prompts.forEach(p => {
                            if (p.starred === undefined) { p.starred = false; changed = true; }
                            if (!p.id || seenIds.has(p.id)) { p.id = generateUniqueID(); changed = true; }
                            seenIds.add(p.id);
                        });
                    }
                });
            }
            if (changed) {
                fs.writeFileSync(DATA_FILE, JSON.stringify(memPromptsCache, null, 4), 'utf-8');
            }
        } catch (e) {
            memPromptsCache = defaultData;
        }
    }

    // 2. 初始化 Presets 组合
    if (!fs.existsSync(PRESETS_FILE)) {
        fs.writeFileSync(PRESETS_FILE, JSON.stringify([], null, 4), 'utf-8');
        memPresetsCache = [];
    } else {
        try {
            memPresetsCache = JSON.parse(fs.readFileSync(PRESETS_FILE, 'utf-8'));
        } catch (e) {
            memPresetsCache = [];
        }
    }

    // 3. 初始化 Settings 窗口参数
    const defaultSettings = { widthCategory: 224, widthList: 320, widthSelected: 320, useDoubleNewline: false };
    if (!fs.existsSync(SETTINGS_FILE)) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 4), 'utf-8');
        memSettingsCache = defaultSettings;
    } else {
        try {
            memSettingsCache = JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
        } catch (e) {
            memSettingsCache = defaultSettings;
        }
    }
    console.log("⚡ [成功] 提示词本地文件已全部加载至系统高频内存！");
}

// 执行初始化
initDataToMemory();

// --- API 路由：现在全部在内存中进行 0 延迟秒级响应，并由后台异步写入硬盘 ---

// 1. Prompts 接口
app.get('/api/prompts', (req, res) => {
    res.json(memPromptsCache); // 直接从内存返回，毫秒级响应
});

app.post('/api/prompts', (req, res) => {
    memPromptsCache = req.body;
    res.json({ success: true }); // 先给前端返回成功，让界面绝对不卡顿

    // 异步写入硬盘，绝不阻塞 Node.js 线程
    fs.writeFile(DATA_FILE, JSON.stringify(memPromptsCache, null, 4), 'utf-8', (err) => {
        if (err) console.error("后台异步保存 prompts 失败:", err);
    });
});

// 2. Presets 常用组合接口
app.get('/api/presets', (req, res) => {
    res.json(memPresetsCache);
});

app.post('/api/presets', (req, res) => {
    memPresetsCache = req.body;
    res.json({ success: true });

    // 异步写入
    fs.writeFile(PRESETS_FILE, JSON.stringify(memPresetsCache, null, 4), 'utf-8', (err) => {
        if (err) console.error("后台异步保存 presets 失败:", err);
    });
});

// 3. Settings 配置接口
app.get('/api/settings', (req, res) => {
    res.json(memSettingsCache);
});

app.post('/api/settings', (req, res) => {
    memSettingsCache = req.body;
    res.json({ success: true });

    // 异步写入
    fs.writeFile(SETTINGS_FILE, JSON.stringify(memSettingsCache, null, 4), 'utf-8', (err) => {
        if (err) console.error("后台异步保存 settings 失败:", err);
    });
});

module.exports = app;