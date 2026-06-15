# 📸 摄影师拍摄管理与日历订阅系统

专为摄影师设计的移动端拍摄管理工具。核心功能是通过生成 **ICS 日历订阅链接**，让用户用手机自带日历 App 订阅后，自动同步拍摄日程并弹窗提醒。

- 🔗 **公网访问**：https://photoshoot-manager-production-0133.up.railway.app
- 📂 **代码仓库**：https://github.com/ForeverJG/-photoshoot-manager

## 功能概览

- **拍摄事件管理**：添加/编辑/删除拍摄，包含模特、时间、地点、道具、定金尾款等
- **当月道具清单**：自动汇总当月所有拍摄的道具，去重展示，支持打勾准备状态
- **收入统计**：按月/按年查看定金、尾款及总收入
- **ICS 日历订阅**：生成标准日历订阅链接，手机订阅后自动弹窗提醒（拍摄前一天 + 前3小时）
- **天气集成**：ICS 描述中自动包含拍摄当天天气预报（Open-Meteo 免费 API）
- **暗色模式**：支持亮/暗模式切换
- **手机适配**：宽度 ≤ 428px 优化，卡片布局，大按钮，触摸友好

## 技术栈

| 层级 | 技术 |
|------|------|
| 后端 | Node.js + Express + SQLite（sql.js） |
| 前端 | React 18 + Vite + TailwindCSS 3 |
| 天气 | Open-Meteo API（免费、无需 Key） + wttr.in 降级 |
| 日历 | RFC 5545 标准 ICS 文件 |
| 部署 | Railway（免费额度） |

## 关键设计说明

- **sql.js 替代 better-sqlite3**：better-sqlite3 需要 C++ 编译环境（Visual Studio），在 Windows 上安装失败率高。sql.js 是纯 JS/WASM 实现，无需编译，跨平台兼容，Railway 上也能直接运行。
- **前端构建产物提交到 Git**：`client/dist/` 已提交到仓库，Railway 部署时无需执行构建步骤，避免网络问题导致构建失败。
- **数据库持久化**：通过 `DATA_DIR` 环境变量指定数据库存储路径，配合 Railway Volume 挂载实现数据持久化。
- **ICS 天气**：生成日历时实时调用 Open-Meteo API 获取拍摄当天天气，失败时自动降级到 wttr.in，都失败则显示"天气信息暂不可用"。

## 本地运行

### 前提条件

- Node.js >= 18
- npm >= 9

### 安装与启动

```bash
# 1. 安装后端依赖
npm install

# 2. 安装前端依赖并构建
cd client && npm install && npm run build && cd ..

# 3. 启动服务器
npm start
```

服务器启动后：
- 📱 管理界面：http://localhost:3001
- 📅 日历订阅链接：http://localhost:3001/calendar.ics

### 开发模式

```bash
# 终端1：启动后端（端口3001）
npm run dev

# 终端2：启动前端开发服务器（端口5173，自动代理API）
cd client && npm run dev
```

前端开发服务器会代理 `/api` 和 `/calendar.ics` 到后端。

## 部署指南

### 方案一：Railway（当前使用）

1. 将项目推送到 GitHub
2. 在 [Railway](https://railway.app) 用 GitHub 登录
3. New Project → GitHub Repository → 搜索并选择仓库
4. 部署自动开始（前端已预构建，无需额外 Build Command）
5. **配置持久化**：Service → Settings → Networking → Generate Domain（获取公网域名）
   - 添加 Volume：挂载路径 `/app/data`，大小 1 GB
   - 添加环境变量：Name=`DATA_DIR`，Value=`/app/data`
6. 完成后获得域名 `https://xxx.up.railway.app`
   - 管理界面：直接访问该域名
   - 日历订阅：`https://xxx.up.railway.app/calendar.ics`

### 方案二：VPS / 云服务器

```bash
# 1. 安装 Node.js（使用 nvm）
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18

# 2. 克隆项目
git clone <你的仓库>
cd 日历

# 3. 安装与构建
npm install
cd client && npm install && npm run build && cd ..

# 4. 使用 PM2 守护进程
npm install -g pm2
pm2 start server.js --name photomanager
pm2 save
pm2 startup

# 5. 配置 Nginx 反向代理（可选）
# 将域名指向你的服务器，Nginx 代理到 localhost:3001
```

### 关于 Vercel

Vercel 是 Serverless 平台，不适合直接使用 SQLite 文件数据库。如需部署到 Vercel，需要：
1. 将数据库改为 Supabase PostgreSQL（免费层 500MB）
2. 将后端 API 改为 Vercel Serverless Functions
3. 如需此方案，可联系作者获取适配版本

## 如何使用日历订阅

### iOS（Apple 日历）
1. 打开「日历」App
2. 底部点击「日历」→「添加日历」→「添加订阅日历」
3. 粘贴订阅链接 `https://你的域名/calendar.ics`
4. 点击「订阅」→「完成」

### Android（Google 日历）
1. 打开「Google 日历」App
2. 左上角菜单 →「设置」
3. 点击「添加日历」→「通过网址」
4. 粘贴订阅链接，点击「添加日历」

### 提醒说明
- 📸 拍摄前一天早上会弹出提醒
- ⏰ 拍摄开始前 3 小时再次提醒
- 🔄 手机日历每 15-30 分钟自动刷新订阅

## 项目结构

```
├── server.js            # Express 服务器（API + ICS + 静态文件）
├── db.js                # SQLite 数据库初始化
├── weather.js           # 天气 API 服务（Open-Meteo + wttr.in 降级）
├── package.json         # 后端依赖
├── data.db              # SQLite 数据库文件（自动创建）
├── client/
│   ├── index.html
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   └── src/
│       ├── main.jsx          # 入口
│       ├── App.jsx           # 根组件（tab切换 + 暗色模式）
│       ├── index.css         # TailwindCSS + 自定义组件样式
│       ├── api.js            # API 请求封装
│       ├── components/
│       │   ├── Layout.jsx        # 布局（Header + 内容 + 底部导航）
│       │   ├── BottomNav.jsx     # 底部三tab导航
│       │   ├── EventCard.jsx     # 拍摄事件卡片
│       │   ├── EventForm.jsx     # 添加/编辑表单（底部抽屉）
│       │   ├── CalendarView.jsx  # 月历视图
│       │   └── SubscribeGuide.jsx # 日历订阅操作指引
│       └── pages/
│           ├── EventsPage.jsx    # 拍摄事件页（列表 + 月历）
│           ├── PropsPage.jsx     # 道具清单页
│           └── IncomePage.jsx    # 收入统计页
└── README.md
```

## ICS 日历规范

生成的 ICS 文件严格遵循 [RFC 5545](https://datatracker.ietf.org/doc/html/rfc5545) 标准：

- `VERSION: 2.0`
- `CALSCALE: GREGORIAN`
- `METHOD: PUBLISH`
- 每个事件包含 `DTSTART`、`DTEND`（亚洲/上海时区）
- `VALARM` 组件：`TRIGGER:-P1D`（拍摄前一天）+ `TRIGGER:-PT3H`（拍摄前3小时）
- `DESCRIPTION` 包含拍摄详情 + 天气信息
- 长行自动折叠（RFC 5545 Section 3.1）
- 兼容 Apple 日历、Google 日历、Outlook

## License

MIT
