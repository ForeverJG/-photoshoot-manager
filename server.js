import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { dbPromise, queryAll, queryOne, run, lastInsertRowId } from './db.js';
import { getWeather } from './weather.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

// 中间件
app.use(cors());
app.use(express.json());

// 等待数据库初始化完毕
let dbReady = false;
dbPromise.then(() => { dbReady = true; });

// ==================== API 路由 ====================

// 获取所有事件（支持月份筛选）
app.get('/api/events', async (req, res) => {
  try {
    await dbPromise;
    const { month, year } = req.query;
    let sql = 'SELECT * FROM events';
    const params = [];

    if (year && month) {
      sql += ' WHERE strftime(\'%Y\', shoot_date) = ? AND strftime(\'%m\', shoot_date) = ?';
      params.push(String(year), String(month).padStart(2, '0'));
    } else if (year) {
      sql += ' WHERE strftime(\'%Y\', shoot_date) = ?';
      params.push(String(year));
    }

    sql += ' ORDER BY shoot_date ASC, start_time ASC';
    const events = queryAll(sql, params);
    res.json(events);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 获取单个事件
app.get('/api/events/:id', async (req, res) => {
  try {
    await dbPromise;
    const event = queryOne('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!event) return res.status(404).json({ error: '事件不存在' });
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 创建事件
app.post('/api/events', async (req, res) => {
  try {
    await dbPromise;
    const {
      model_name, shoot_date, start_time, end_time,
      content, location, props,
      deposit_amount, balance_amount,
      deposit_received, balance_received,
    } = req.body;

    run(
      `INSERT INTO events (model_name, shoot_date, start_time, end_time, content, location, props, deposit_amount, balance_amount, deposit_received, balance_received)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        model_name, shoot_date,
        start_time || '09:00', end_time || null,
        content, location,
        JSON.stringify(props || []),
        deposit_amount || 0, balance_amount || 0,
        deposit_received ? 1 : 0, balance_received ? 1 : 0,
      ]
    );

    const id = lastInsertRowId();
    const event = queryOne('SELECT * FROM events WHERE id = ?', [id]);
    res.status(201).json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 更新事件
app.put('/api/events/:id', async (req, res) => {
  try {
    await dbPromise;
    const existing = queryOne('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: '事件不存在' });

    const {
      model_name, shoot_date, start_time, end_time,
      content, location, props,
      deposit_amount, balance_amount,
      deposit_received, balance_received,
    } = req.body;

    run(
      `UPDATE events SET
        model_name = ?, shoot_date = ?, start_time = ?, end_time = ?,
        content = ?, location = ?, props = ?,
        deposit_amount = ?, balance_amount = ?,
        deposit_received = ?, balance_received = ?,
        updated_at = datetime('now', 'localtime')
       WHERE id = ?`,
      [
        model_name, shoot_date,
        start_time || '09:00', end_time || null,
        content, location,
        JSON.stringify(props || []),
        deposit_amount || 0, balance_amount || 0,
        deposit_received ? 1 : 0, balance_received ? 1 : 0,
        Number(req.params.id),
      ]
    );

    const event = queryOne('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    res.json(event);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 删除事件
app.delete('/api/events/:id', async (req, res) => {
  try {
    await dbPromise;
    const existing = queryOne('SELECT * FROM events WHERE id = ?', [Number(req.params.id)]);
    if (!existing) return res.status(404).json({ error: '事件不存在' });
    run('DELETE FROM events WHERE id = ?', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 当月道具清单
app.get('/api/props', async (req, res) => {
  try {
    await dbPromise;
    const { year, month } = req.query;
    const y = year || new Date().getFullYear();
    const m = month || (new Date().getMonth() + 1);

    const events = queryAll(
      'SELECT props FROM events WHERE strftime(\'%Y\', shoot_date) = ? AND strftime(\'%m\', shoot_date) = ?',
      [String(y), String(m).padStart(2, '0')]
    );

    const propsSet = new Set();
    for (const e of events) {
      try {
        const arr = JSON.parse(e.props);
        arr.forEach(p => { if (p.trim()) propsSet.add(p.trim()); });
      } catch { /* ignore */ }
    }

    res.json({
      year: Number(y),
      month: Number(m),
      props: [...propsSet].sort(),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 收入统计
app.get('/api/income', async (req, res) => {
  try {
    await dbPromise;
    const { year, month } = req.query;
    let sql;
    let params = [];

    if (year && month) {
      sql = `
        SELECT
          COALESCE(SUM(CASE WHEN deposit_received = 1 THEN deposit_amount ELSE 0 END), 0) as deposit_total,
          COALESCE(SUM(CASE WHEN balance_received = 1 THEN balance_amount ELSE 0 END), 0) as balance_total
        FROM events
        WHERE strftime('%Y', shoot_date) = ? AND strftime('%m', shoot_date) = ?
      `;
      params = [String(year), String(month).padStart(2, '0')];
    } else if (year) {
      sql = `
        SELECT
          COALESCE(SUM(CASE WHEN deposit_received = 1 THEN deposit_amount ELSE 0 END), 0) as deposit_total,
          COALESCE(SUM(CASE WHEN balance_received = 1 THEN balance_amount ELSE 0 END), 0) as balance_total
        FROM events
        WHERE strftime('%Y', shoot_date) = ?
      `;
      params = [String(year)];
    } else {
      sql = `
        SELECT
          COALESCE(SUM(CASE WHEN deposit_received = 1 THEN deposit_amount ELSE 0 END), 0) as deposit_total,
          COALESCE(SUM(CASE WHEN balance_received = 1 THEN balance_amount ELSE 0 END), 0) as balance_total
        FROM events
      `;
    }

    const result = queryOne(sql, params);
    res.json({
      year: year ? Number(year) : null,
      month: month ? Number(month) : null,
      deposit_total: result?.deposit_total || 0,
      balance_total: result?.balance_total || 0,
      total: (result?.deposit_total || 0) + (result?.balance_total || 0),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== 日历订阅（ICS） ====================

// ICS 行折叠（RFC 5545）
function foldLine(line) {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  let result = '';
  let remaining = line;
  while (remaining.length > 0) {
    let chunk = '';
    let chunkBytes = 0;
    for (const char of remaining) {
      const charBytes = new TextEncoder().encode(char).length;
      if (chunkBytes + charBytes > (result ? 74 : 75)) break;
      chunk += char;
      chunkBytes += charBytes;
    }
    result += (result ? '\r\n ' : '') + chunk;
    remaining = remaining.slice(chunk.length);
    if (!remaining) break;
  }
  return result;
}

function escapeICS(text) {
  return (text || '')
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '');
}

function formatICSDate(date) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}T${pad(date.getHours())}${pad(date.getMinutes())}${pad(date.getSeconds())}`;
}

async function generateICS() {
  await dbPromise;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayStr = today.toISOString().split('T')[0];

  const events = queryAll(
    'SELECT * FROM events WHERE shoot_date >= ? ORDER BY shoot_date ASC, start_time ASC',
    [todayStr]
  );

  const lines = [];

  lines.push('BEGIN:VCALENDAR');
  lines.push('VERSION:2.0');
  lines.push('PRODID:-//Photographer Shoot Manager//CN');
  lines.push('CALSCALE:GREGORIAN');
  lines.push('METHOD:PUBLISH');
  lines.push('X-WR-CALNAME:拍摄日程');
  lines.push('X-WR-TIMEZONE:Asia/Shanghai');
  lines.push('X-PUBLISHED-TTL:PT5M');

  // 批量获取天气（每批3个，控制并发）
  const weatherResults = new Map();
  const BATCH_SIZE = 3;
  for (let i = 0; i < events.length; i += BATCH_SIZE) {
    const batch = events.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(e => getWeather(e.location, e.shoot_date))
    );
    batch.forEach((e, idx) => {
      const r = results[idx];
      weatherResults.set(e.id, r.status === 'fulfilled' ? r.value : '天气信息暂不可用');
    });
  }

  for (const event of events) {
    const startDate = new Date(`${event.shoot_date}T${event.start_time || '09:00'}:00+08:00`);
    const endDate = event.end_time
      ? new Date(`${event.shoot_date}T${event.end_time}:00+08:00`)
      : new Date(startDate.getTime() + 2 * 60 * 60 * 1000);

    const uid = `shoot-${event.id}@photoshoot`;
    const summary = `[拍摄] ${event.model_name} - ${event.content}`;
    const location = event.location || '';

    let props = [];
    try { props = JSON.parse(event.props || '[]'); } catch { /* */ }
    const propsStr = props.length > 0 ? props.join('、') : '无';

    const weather = weatherResults.get(event.id) || '天气信息暂不可用';
    const depositStatus = event.deposit_received ? '已收' : '未收';
    const balanceStatus = event.balance_received ? '已收' : '未收';

    const description = [
      `拍摄内容：${event.content}`,
      `需准备道具：${propsStr}`,
      `定金：${event.deposit_amount} 元（${depositStatus}）`,
      `尾款：${event.balance_amount} 元（${balanceStatus}）`,
      `天气：${weather}`,
    ].join('\\n');

    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${uid}`);
    lines.push(`DTSTART;TZID=Asia/Shanghai:${formatICSDate(startDate)}`);
    lines.push(`DTEND;TZID=Asia/Shanghai:${formatICSDate(endDate)}`);
    lines.push(`SUMMARY:${escapeICS(summary)}`);
    lines.push(`LOCATION:${escapeICS(location)}`);
    lines.push(`DESCRIPTION:${escapeICS(description)}`);
    lines.push(`DTSTAMP:${formatICSDate(new Date())}Z`);
    lines.push(`CREATED:${formatICSDate(new Date(event.created_at || Date.now()))}Z`);
    lines.push(`LAST-MODIFIED:${formatICSDate(new Date(event.updated_at || Date.now()))}Z`);

    // VALARM: 拍摄前一天
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-P1D');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:📸 明天有拍摄：${escapeICS(event.model_name)} - ${escapeICS(event.content)}`);
    lines.push('END:VALARM');

    // VALARM: 拍摄前3小时
    lines.push('BEGIN:VALARM');
    lines.push('TRIGGER:-PT3H');
    lines.push('ACTION:DISPLAY');
    lines.push(`DESCRIPTION:⏰ 3小时后有拍摄：${escapeICS(event.model_name)} - ${escapeICS(event.content)}`);
    lines.push('END:VALARM');

    lines.push('END:VEVENT');
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldLine).join('\r\n') + '\r\n';
}

// ICS 端点
app.get('/calendar.ics', async (req, res) => {
  try {
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.setHeader('Content-Disposition', 'inline; filename="photoshoot.ics"');
    const ics = await generateICS();
    res.send(ics);
  } catch (err) {
    console.error('生成 ICS 失败:', err);
    res.status(500).send('日历生成失败');
  }
});

// ==================== 生产环境：托管前端静态文件 ====================
const clientDist = path.join(__dirname, 'client', 'dist');
app.use(express.static(clientDist));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api') && req.path !== '/calendar.ics') {
    res.sendFile(path.join(clientDist, 'index.html'));
  }
});

// ==================== 启动服务器 ====================
app.listen(PORT, async () => {
  await dbPromise;
  console.log('📸 摄影师拍摄管理系统已启动');
  console.log(`   管理界面: http://localhost:${PORT}`);
  console.log(`   日历订阅: http://localhost:${PORT}/calendar.ics`);
});
