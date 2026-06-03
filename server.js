const express = require('express');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const DATA_FILE = path.join(__dirname, 'prompts.json');

// 新版“有序数组”默认数据
const defaultData = [
    {
        "category": "表情",
        "prompts": [
            { "id": 1, "name": "温柔微笑", "positive": "smiling, gentle smile", "negative": "frowning" }
        ]
    },
    {
        "category": "衣着",
        "prompts": [
            { "id": 2, "name": "白色连衣裙", "positive": "white dress, elegant", "negative": "pants" }
        ]
    }
];

// 获取数据（包含旧版格式自动平滑升级逻辑）
app.get('/api/prompts', (req, res) => {
    if (!fs.existsSync(DATA_FILE)) {
        fs.writeFileSync(DATA_FILE, JSON.stringify(defaultData, null, 4), 'utf-8');
        return res.json(defaultData);
    }
    
    try {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        let parsed = JSON.parse(raw);
        
        // 【平滑升级】如果读取到的是旧版对象格式 {}，将其转换为新版有序数组 []
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
            console.log("检测到旧版数据格式，正在为您自动转换...");
            const upgraded = [];
            for (const [catName, promptList] of Object.entries(parsed)) {
                upgraded.push({
                    category: catName,
                    prompts: promptList
                });
            }
            parsed = upgraded;
            // 写入保存
            fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 4), 'utf-8');
        }
        
        res.json(parsed);
    } catch (e) {
        res.status(500).json({ error: '数据解析失败' });
    }
});

// 保存数据
app.post('/api/prompts', (req, res) => {
    try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(req.body, null, 4), 'utf-8');
        res.json({ success: true });
    } catch (err) {
        res.status(500).json({ error: '保存失败' });
    }
});

module.exports = app;