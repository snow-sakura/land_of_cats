# 🐱 流浪猫足迹

基于微信小程序 + Express + MySQL 的流浪猫档案记录应用。帮助用户记录遇见的流浪猫，支持拍照、录音、位置标记、属性标签等完整功能。

## 功能特性

- 📸 **拍照记录** — 为每只猫咪拍摄照片，支持多张轮播预览
- 🎙️ **声音录制** — 记录猫咪的叫声（长按录音、试听、删除）
- 📍 **位置标记** — 标记遇见地点，集成微信地图一键导航
- 🏷️ **属性标签** — 毛色、体型、性格、健康状态等多维标签
- 📖 **详情档案** — 照片轮播、属性展示、地图定位、编辑入口
- 🔒 **用户系统** — 注册/登录，数据按用户隔离

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端 | 微信小程序原生开发（WXML + WXSS + JS） |
| 后端 | Node.js + Express |
| 数据库 | MySQL 8 |
| 认证 | JWT + x-openid 双重鉴权 |
| 文件存储 | 本地文件系统（`backend/uploads/`） |

## 项目结构

```
land_of_cats/
├── frontend/                       # 微信小程序前端
│   ├── app.js / app.json / app.wxss
│   ├── constants/
│   │   └── cat-tags.js            # 猫咪属性枚举（毛色/体型/性格等）
│   ├── data/
│   │   └── mock-data.js           # Mock 数据 + 日期格式化
│   ├── custom-tab-bar/            # 自定义底部导航（猫爪图标）
│   ├── pages/
│   │   ├── index/                 # 首页 — 猫咪卡片列表（拍立得风格）
│   │   ├── add/                   # 添加档案 — 完整表单（照片/录音/属性/定位）
│   │   ├── detail/                # 详情页 — 轮播图、属性展示、地图、编辑入口
│   │   ├── edit/                  # 编辑档案 — 复用添加页表单，预填数据
│   │   ├── record/                # 录音页 — 长按录音、试听、删除
│   │   ├── login/                 # 登录页
│   │   ├── register/              # 注册页
│   │   └── my/                    # 个人中心
│   └── utils/
│       └── api.js                 # API 请求封装
├── backend/                        # Express 后端
│   ├── app.js                     # 入口，Express 配置
│   ├── config/index.js            # 数据库 / JWT / 上传配置
│   ├── middleware/
│   │   ├── auth.js                # JWT + x-openid 鉴权
│   │   └── manage-auth.js         # 管理后台 session 鉴权
│   ├── routes/
│   │   ├── cats.js                # 猫咪 CRUD API
│   │   ├── auth.js                # 注册 / 登录 / 微信登录
│   │   ├── upload.js              # 照片/音频文件上传
│   │   └── manage.js              # 管理后台路由
│   ├── models/
│   │   ├── cat.js                 # 猫咪 + 照片/音频关联查询
│   │   ├── user.js                # 用户表操作
│   │   ├── admin.js               # 管理员操作
│   │   └── db.js                  # MySQL 连接池
│   ├── schema.sql                 # 数据库建表 DDL
│   ├── scripts/
│   │   ├── migrate.js             # 数据库迁移脚本
│   │   └── seed-admin.js          # 初始化管理员账号
│   ├── views/                     # 管理后台 EJS 模板
│   │   ├── layout.ejs             # 布局外壳
│   │   ├── dashboard.ejs          # 仪表盘
│   │   ├── cats.ejs               # 猫咪列表
│   │   ├── cat-new.ejs            # 新增猫咪
│   │   ├── cat-detail.ejs         # 详情/编辑
│   │   ├── cat-form.ejs           # 表单组件
│   │   └── login.ejs              # 管理后台登录
│   └── uploads/                   # 上传文件存储目录
│       ├── photos/
│       └── sounds/
└── CLAUDE.md                       # Claude Code 项目指南
```

## 快速开始

### 前置依赖

- [Node.js](https://nodejs.org/) >= 18
- [MySQL](https://www.mysql.com/) 8.0+
- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html)

### 1. 初始化数据库

```bash
mysql -u root -p < backend/schema.sql
```

将创建数据库 `stray_cats` 及以下表：
- `cat_profiles` — 猫咪档案主表
- `cat_photos` — 猫咪照片表
- `cat_sounds` — 猫咪音频表
- `admin_users` — 管理后台用户表
- `users` — 小程序用户表

### 2. 启动后端

```bash
cd backend
cp .env.example .env   # 按需修改数据库连接信息
npm install
npm run dev            # 开发模式（文件变更自动重启）
```

后端默认监听 `http://localhost:3000`，可访问 `http://localhost:3000/api/health` 验证服务状态。

> **注意**：`backend/uploads/photos/` 和 `backend/uploads/sounds/` 目录会在首次启动时自动创建。

### 3. 初始化管理后台账号

```bash
cd backend
node scripts/seed-admin.js
```

默认管理员：用户名 `admin`，密码 `admin123`（首次启动后请修改）。

### 4. 打开小程序前端

使用微信开发者工具导入 `frontend/` 目录：

1. 打开微信开发者工具 → **导入项目**
2. 项目目录选择 `land_of_cats/frontend/`
3. AppID 在 `frontend/project.config.json` 中配置
4. 使用「模拟器」调试或「预览」在真机测试

> **注意**：真机调试时需将 `frontend/utils/api.js` 中的 `BASE_URL` 从 `localhost:3000` 改为电脑局域网 IP。

## API 文档

### 认证接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/auth/register` | 注册 `{ username, password, nickname }` |
| POST | `/api/auth/login` | 登录 `{ username, password }` → `{ token, user }` |
| POST | `/api/auth/wx-login` | 微信登录（mock） |
| POST | `/api/auth/send-code` | 发送短信验证码（mock，固定 `666666`） |
| POST | `/api/auth/sms-login` | 验证码登录 |
| GET | `/api/auth/me` | 获取当前用户信息 |

### 猫咪档案接口

所有请求需携带 `x-openid` 或 `x-token` 头。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/cats` | 获取猫咪列表（按创建时间倒序） |
| GET | `/api/cats/:id` | 获取猫咪详情（含照片、音频） |
| POST | `/api/cats` | 创建猫咪档案 |
| PUT | `/api/cats/:id` | 更新猫咪档案 |
| DELETE | `/api/cats/:id` | 删除猫咪档案（级联删除照片和音频） |

响应格式：

```json
// 成功
{ "success": true, "data": { ... } }

// 失败
{ "success": false, "error": "错误信息" }
```

### 文件上传接口

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/upload/photo` | 上传照片（multipart/form-data） |
| POST | `/api/upload/sound` | 上传音频（multipart/form-data） |

### 管理后台

访问 `http://localhost:3000/manage` 进入管理后台，包含：
- **仪表盘** — 系统概览、统计数据
- **猫咪列表** — 查看/搜索/删除猫咪
- **新增猫咪** — 手动添加猫咪档案（含照片、音频上传）
- **详情/编辑** — 查看完整档案、修改信息

## 猫咪档案数据结构

```javascript
{
  id: 1,
  nickname: '橘子',
  createTime: '2026-05-16T10:30:00+08:00',
  updateTime: '2026-05-16T12:00:00+08:00',
  location: {
    name: '济南泉城公园东门附近',
    address: '山东省济南市历下区泉城公园',
    latitude: 36.66,
    longitude: 117.02
  },
  photos: [
    { id: 'img_001', url: '...', isCover: true }
  ],
  sounds: [
    { id: 'snd_001', url: '...', duration: 3.5, desc: '温柔的喵喵' }
  ],
  attributes: {
    coatColors: ['橘色'],
    hairLength: '短毛',
    bodyType: '偏胖',
    specialFeatures: '尾巴尖白色',
    eyeColor: '黄色',
    healthStatus: '健康',
    healthNote: '',
    personalities: ['亲人', '贪吃'],
    relationships: '经常独自出现'
  },
  notes: '每天下午都会出现在长椅下面。'
}
```

## 页面导航

```
┌─────────┐      navigateTo      ┌──────────┐      navigateTo      ┌────────┐
│  index   │ ──────────────────→ │  detail  │ ──────────────────→ │  edit  │
│ (首页)   │                     │ (详情页) │                     │ (编辑) │
└─────────┘                     └──────────┘                     └────────┘
     │                               │
     │ tabBar                        │ tabBar
     ↓                               ↓
┌─────────┐                     ┌──────────┐
│   add   │                     │    my    │
│ (记录)  │                     │ (我的)   │
└─────────┘                     └──────────┘
     │
     │ navigateTo
     ↓
┌─────────┐
│ record  │
│ (录音)  │
└─────────┘
```

## 猫咪属性标签系统

`frontend/constants/cat-tags.js` 预定义了以下枚举，供各页面统一使用：

| 属性 | 类型 | 选项 |
|------|------|------|
| 毛色 | 多选 | 橘色、白色、黑色、灰色、狸花、三花、玳瑁、奶牛、其他 |
| 毛长 | 单选 | 短毛、长毛、无毛 |
| 体型 | 单选 | 瘦小、正常、偏胖、怀孕中 |
| 眼睛颜色 | 单选 | 黄色、蓝色、绿色、异瞳、其他 |
| 健康状况 | 单选 | 健康、轻伤、明显疾病、未绝育、已绝育 |
| 性格标签 | 多选 | 亲人、警惕、胆小、凶猛、话痨、安静、贪吃、独行侠 |

## 数据库表结构

详见 `backend/schema.sql`，核心表：

### cat_profiles（猫咪档案主表）

| 字段 | 类型 | 说明 |
|------|------|------|
| id | INT | 主键，自增 |
| openid | VARCHAR(64) | 微信用户标识，用于数据隔离 |
| nickname | VARCHAR(20) | 猫咪昵称 |
| location_name | VARCHAR(255) | 地点名称 |
| latitude/longitude | DECIMAL(10,7) | 经纬度坐标 |
| coat_colors | JSON | 毛色数组 |
| personalities | JSON | 性格标签数组 |
| health_status | VARCHAR(30) | 健康状况 |
| 其他属性字段 | VARCHAR | 毛长、体型、特征、眼睛颜色等 |

### cat_photos / cat_sounds（关联表）

外键关联 `cat_profiles.id`，级联删除。

## 常见问题

**Q: 小程序无法连接后端？**
A: 确认后端已启动且端口未被占用。模拟器可用 `localhost`，真机需改为电脑局域网 IP。

**Q: 上传文件失败？**
A: 检查 `backend/uploads/` 目录权限，确认文件大小不超过限制（照片 10MB，音频 5MB）。

**Q: 管理后台无法登录？**
A: 执行 `node scripts/seed-admin.js` 初始化默认管理员账号。

## License

MIT
