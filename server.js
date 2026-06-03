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

// 高精度唯一ID生成器
function generateUniqueID() {
    return Date.now() + Math.floor(Math.random() * 1000000);
}

// 1. 获取并自动修复/清洗提示词数据
app.get('/api/prompts', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4), 'utf-8');
        return res.json(defaultData);
    }
    
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        let parsed = JSON.parse(raw);
        
        let changed = false;
        const seenIds = new Set();

        if (Array.isArray(parsed)) {
            parsed.forEach(cat => {
                if (Array.isArray(cat.prompts)) {
                    cat.prompts.forEach(p => {
                        // 修复 starred
                        if (p.starred === undefined) {
                            p.starred = false;
                            changed = true;
                        }
                        // 【核心修复】：修复没有 ID 或 ID 重复的提示词，确保勾选完全精准
                        if (!p.id || seenIds.has(p.id)) {
                            p.id = generateUniqueID();
                            changed = true;
                        }
                        seenIds.add(p.id);
                    });
                }
            });
        }

        if (changed) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 4), 'utf-8');
        }
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: '数据解析失败' });
    }
});

app.post('/api/prompts', (req, res) => {
    try {
        const parsed = req.body;
        const seenIds = new Set();
        if (Array.isArray(parsed)) {
            parsed.forEach(cat => {
                if (Array.isArray(cat.prompts)) {
                    cat.prompts.forEach(p => {
                        if (!p.id || seenIds.has(p.id)) {
                            p.id = generateUniqueID();
                        }
                        seenIds.add(p.id);
                    });
                }
            });
        }
        fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 4), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '保存失败' });
    }
});

// 2. 常用组合独立物理存储接口
app.get('/api/presets', (req, res) => {
    if (!fs.existsSync(PRESETS_FILE)) {
        fs.writeFileSync(PRESETS_FILE, JSON.stringify([], null, 4), 'utf-8');
        return res.json([]);
    }
    try {
        const raw = fs.readFileSync(PRESETS_FILE, 'utf-8');
        res.json(JSON.parse(raw));
    } catch (e) {
        res.json([]);
    }
});

app.post('/api/presets', (req, res) => {
    try {
        fs.writeFileSync(PRESETS_FILE, JSON.stringify(req.body, null, 4), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '常用组合保存失败' });
    }
});

// 3. 窗口设置独立物理存储接口
app.get('/api/settings', (req, res) => {
    const defaultSettings = {
        widthCategory: 224,
        widthList: 320,
        widthSelected: 320,
        useDoubleNewline: false
    };
    if (!fs.existsSync(SETTINGS_FILE)) {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(defaultSettings, null, 4), 'utf-8');
        return res.json(defaultSettings);
    }
    try {
        const raw = fs.readFileSync(SETTINGS_FILE, 'utf-8');
        res.json(JSON.parse(raw));
    } catch (e) {
        res.json(defaultSettings);
    }
});

app.post('/api/settings', (req, res) => {
    try {
        fs.writeFileSync(SETTINGS_FILE, JSON.stringify(req.body, null, 4), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '设置保存失败' });
    }
});

module.exports = app;