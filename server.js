const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const app = express();

app.use(express.json());
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

// 默认数据，部分设定为 starred: true
const defaultData = [
    {
        "category": "人物",
        "prompts": [
            { 
                "id": 1, 
                "name": "赛博女战士", 
                "positive": "1girl, cyberpunk warrior, cyberpunk jacket, neon glowing, holding katana, looking at viewer", 
                "negative": "low quality, bad hands, deformed",
                "desc": "💡【画师手账 · 赛博女战士使用指南】\n---------------------------------------------\n1. 推荐 Lora: CyberpunkStyle_v2 (权重推荐 0.75)\n2. 最佳采样器: DPM++ 2M SDE Karras (28步以上)",
                "starred": true
            }
        ]
    },
    {
        "category": "表情",
        "prompts": [
            { 
                "id": 2, 
                "name": "温柔微笑", 
                "positive": "smiling, gentle smile, closed mouth", 
                "negative": "frowning",
                "desc": "📝【表情微调说明】\n- 适合肖像画，closed mouth 能够防止AI画出奇怪的牙齿。",
                "starred": false
            }
        ]
    }
];

app.get('/api/prompts', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4), 'utf-8');
        return res.json(defaultData);
    }
    
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        let parsed = JSON.parse(raw);
        
        // 自动兼容处理：为所有旧提示词平滑补全 starred 字段，防止报错
        let changed = false;
        if (Array.isArray(parsed)) {
            parsed.forEach(cat => {
                if (Array.isArray(cat.prompts)) {
                    cat.prompts.forEach(p => {
                        if (p.starred === undefined) {
                            p.starred = false;
                            changed = true;
                        }
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
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 4), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '保存失败' });
    }
});

module.exports = app;