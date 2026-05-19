# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概览

微信小程序「流浪猫足迹」—— 帮助用户记录流浪猫档案，支持拍照、录音、位置标记、属性标签。

- **前端**：微信小程序原生开发（`frontend/`）
- **后端**：Express + MySQL + JWT 认证（`backend/`）
- **UI 风格**：治愈系暖色卡片流（主色 `#FF9A6B`，背景 `#FFF8F0`）

## 项目结构

```
land_of_cats/
├── frontend/                   # 微信小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── constants/cat-tags.js   # 猫咪属性枚举常量
│   ├── data/mock-data.js       # Mock 数据 + 日期格式化工具
│   ├── custom-tab-bar/         # 自定义 tabBar（猫爪图标）
│   ├── pages/
│   │   ├── index/              # 首页 - 猫咪卡片列表
│   │   ├── add/                # 添加档案表单（照片/声音/属性/定位）
│   │   ├── detail/             # 详情页 - 轮播、属性、地图
│   │   ├── edit/               # 编辑档案（复用 add 表单）
│   │   ├── record/             # 录音页（长按录音/试听）
│   │   ├── login/              # 登录页
│   │   ├── register/           # 注册页
│   │   └── my/                 # 个人中心
│   └── utils/api.js            # API 请求封装（wx.request → Promise）
├── backend/                    # Express 后端
│   ├── app.js                  # 入口
│   ├── config/index.js         # 数据库 / JWT / 上传配置
│   ├── middleware/auth.js      # JWT + x-openid 双重鉴权
│   ├── routes/
│   │   ├── cats.js             # 猫咪 CRUD API
│   │   ├── auth.js             # 注册 / 登录 / 短信验证码
│   │   ├── upload.js           # 照片/音频文件上传
│   │   └── manage.js           # 管理后台
│   ├── models/
│   │   ├── cat.js              # 猫咪档案 + 照片/音频关联查询
│   │   ├── user.js             # 用户表
│   │   ├── admin.js            # 管理员
│   │   └── db.js               # MySQL 连接池
│   ├── schema.sql              # 建表 DDL
│   └── uploads/                # 文件存储目录
└── 需求文档.md
```

## 关键数据流

前端通过 `utils/api.js` 调用后端 REST API，请求携带 `x-openid` 或 `x-token` 头用于鉴权。

API 响应格式：`{ success: true, data: <payload> }` 或 `{ success: false, error: "<message>" }`

核心接口：
- `GET /api/cats` — 列表
- `GET /api/cats/:id` — 详情
- `POST /api/cats` — 创建
- `PUT /api/cats/:id` — 更新
- `DELETE /api/cats/:id` — 删除
- `POST /api/upload/photo` / `POST /api/upload/sound` — 文件上传
- `POST /api/auth/register` / `POST /api/auth/login` — 认证

后端 `models/cat.js` 的 `toFrontendFormat()` 负责将 MySQL 行数据（snake_case）转为前端期望的嵌套 camelCase 格式（CatProfile）。属性字段如 `location`、`attributes` 从前端表单发送时已是嵌套对象格式，后端直接展开存入对应列。

## 页面间导航

tabBar 页（自定义）：index（遇见） ↔ add（记录） ↔ my（我的）
navigateTo 链：index → detail → edit，add/edit → record
导航回退：navigateBack

## 开发启动

### 后端

```bash
cd backend
cp .env.example .env        # 按需修改数据库配置
mysql -u root -p < schema.sql  # 初始化数据库
npm install
npm run dev                 # 开发模式（文件变更自动重启）
npm start                   # 正式启动（默认端口 3000）
```

后端启动后监听 `http://localhost:3000`，API 基础路径 `http://localhost:3000/api`。健康检查：`GET /api/health`

### 前端

无 CLI 构建命令。使用 **微信开发者工具** 打开 `frontend/` 目录：

1. 打开微信开发者工具 → 导入项目
2. AppID 在 `frontend/project.config.json` 中
3. 使用「模拟器」调试或「预览」在真机测试

前端 `utils/api.js` 中 `BASE_URL` 默认为 `http://localhost:3000/api`，真机调试需改为电脑局域网 IP。

## 数据库

MySQL 数据库名 `stray_cats`，3 张核心表：
- `cat_profiles` — 猫咪主表，openid 字段做数据隔离
- `cat_photos` — 照片表，关联 cat_profiles.id，外键级联删除
- `cat_sounds` — 音频表，同上

后端 `models/cat.js` 的 `getById` / `listByUser` 会自动补全关联的 photos 和 sounds。

## 已知问题

1. `frontend/data/mock-data.js` 的 mockCats 已不再被页面直接使用，页面均通过 API 获取数据
2. `frontend/utils/api.js` 中 `BASE_URL` 为 `localhost:3000`，真机调试需替换为局域网 IP
3. `frontend/app.js` 中 `wx.cloud.init` 的 `env` 仍为占位符 `'your-env-id'`，微信云开发未正式启用
4. `frontend/pages/detail/detail.wxml` 中 `{{item.duration.toFixed(1)}}` 当 duration 为 undefined 时会崩溃（已在 mock-data 中设置为 0，但从未经清洗的 API 数据获取时需注意）
