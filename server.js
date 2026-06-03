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

// 默认数据增加 desc (描述手账字段)
const defaultData = [
    {
        "category": "人物",
        "prompts": [
            { 
                "id": 1, 
                "name": "赛博女战士", 
                "positive": "1girl, cyberpunk warrior, cyberpunk jacket, neon glowing, holding katana, looking at viewer", 
                "negative": "low quality, bad hands, deformed",
                "desc": "💡【画师手账 · 赛博女战士使用指南】\n---------------------------------------------\n1. 推荐 Lora: CyberpunkStyle_v2 (权重推荐 0.75)\n2. 最佳采样器: DPM++ 2M SDE Karras (28步以上)\n3. 提示词技巧: \n   - 想要雨夜效果可以追加: 'rainy night, wet street reflection'\n   - 想要脸部更精细可以开启 ADetailer 并追加 'beautiful eyes'\n4. 避坑指南: 不要给负面词堆砌太多，会降低画面对比度。"
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
                "desc": "📝【表情微调说明】\n- 适合肖像画，closed mouth 能够防止AI画出奇怪的牙齿。\n- 权重可调: (smiling: 1.1) 增加亲和力。"
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
        
        // 自动转换旧数据结构
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            const upgraded = [];
            for (const [catName, promptList] of Object.entries(parsed)) {
                upgraded.push({
                    category: catName,
                    prompts: promptList.map(p => ({ ...p, desc: p.desc || '' })) // 补全desc字段
                });
            }
            parsed = upgraded;
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