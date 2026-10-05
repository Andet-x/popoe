const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'clicks.db'); 


const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) console.error('Ошибка БД:', err.message);
    else console.log('База данных подключена: clicks.db');
});

db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS global_clicks (id INTEGER PRIMARY KEY, count INTEGER)`);
    db.run(`INSERT OR IGNORE INTO global_clicks (id, count) VALUES (1, 0)`);
});

app.use(express.json());
app.use(express.static(__dirname));

// API 1: Получить текущие клики
app.get('/api/clicks', (req, res) => {
    db.get(`SELECT count FROM global_clicks WHERE id = 1`, [], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: err.message });
        }
        res.json({ clicks: row ? row.count : 0 });
    });
});

// API 2: Добавить клики (ИСПРАВЛЕНО)
app.post('/api/clicks', (req, res) => {
    const countToAdd = parseInt(req.body.count);
    
    // Если кликов для добавления нет (0), просто возвращаем текущее значение
    if (isNaN(countToAdd) || countToAdd <= 0) {
        db.get(`SELECT count FROM global_clicks WHERE id = 1`, [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            return res.json({ clicks: row ? row.count : 0 });
        });
        return;
    }

    // Исправленный SQL запрос: передаем параметры строго в массиве [countToAdd]
    db.run(`UPDATE global_clicks SET count = count + ? WHERE id = 1`, [countToAdd], function(err) {
        if (err) {
            console.error("Ошибка при обновлении кликов:", err.message);
            return res.status(500).json({ error: err.message });
        }
        
        // После успешного обновления берем актуальное число и отдаем клиенту
        db.get(`SELECT count FROM global_clicks WHERE id = 1`, [], (err, row) => {
            if (err) return res.status(500).json({ error: err.message });
            res.json({ clicks: row ? row.count : 0 });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
