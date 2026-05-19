# 📋 流浪猫足迹 — 迭代版本与待办事项

> 本文档记录项目各版本的更新内容及未来待办计划。
> 每次迭代完成后，将对应条目移至版本历史并补充细节。

---

## 版本历史

### v1.1.1（当前版本）

> 修复日期：2026-05-19

#### 管理后台用户显示优化

- **`backend/routes/manage.js`**
  - 导入 `userModel`，在列表、新增、详情三个路由中查询用户表
  - 列表页按 openid 批量查询用户昵称，构建 `userMap` 注入每只猫的 `userDisplay`
  - 新增表单页将 `openids` 数组改为 `openidUsers` 对象数组（含 `nickname`）
  - 详情页查询单条用户记录注入 `userDisplay`

- **`backend/views/cats.ejs`**
  - 表格「用户」列改为显示用户昵称，hover 可查看原始 openid，无用户时显示 `—`

- **`backend/views/cat-form.ejs`**
  - 标签从「用户（openid）」改为「所属用户」
  - 下拉选项从罗列 raw openid 改为显示用户昵称（fallback 到 openid）

- **`backend/views/cat-detail.ejs`**
  - 详情页「所属用户」字段改为显示用户昵称（fallback 到 openid）

---

### v1.1.0

> 修复日期：2026-05-19

#### 详情页 UI 异常与请求爆红修复

**根因**：初始数据 `cat: {}` 导致 WXML 模板对 `undefined` 子属性访问引发大量 TypeError，地图组件无条件渲染触发无效地图瓦片请求。

##### 修复内容

- **`frontend/pages/detail/detail.js`**
  - 初始 `data.cat` 从空对象 `{}` 改为完整默认值（`photos:[]`、`sounds:[]`、`location:{}`、`attributes:{}` 等）—— 消除所有模板 TypeError
  - `loadCatDetail()` 中 markers 仅当 `cat.location` 存在且非空坐标时创建
  - `openMap()` 增加 location 空值守卫，无位置时 Toast 提示
  - `previewPhoto()` 增加 photos 空数组守卫
  - `goToEdit()` 增加 id 空值守卫
  - 移除不存在的 `map-marker.png` 图标路径引用

- **`frontend/pages/detail/detail.wxml`**
  - 照片计数 `{{cat.photos && cat.photos.length ? ... : ''}}` 守卫
  - 声音区域 `wx:if="{{cat.sounds && cat.sounds.length > 0}}"` 空安全检查
  - 地图区域 `wx:if="{{cat.location && cat.location.longitude}}"` 条件渲染——无位置数据时不渲染 `<map>` 组件，杜绝无效地图瓦片请求

##### 修改文件

| 文件 | 操作 | 说明 |
|------|------|------|
| `frontend/pages/detail/detail.js` | 修改 | 初始数据默认值 + 4 个事件守卫 |
| `frontend/pages/detail/detail.wxml` | 修改 | 3 处 WXML 条件守卫 |

---

### v1.0.0

> 发布日期：2026-05-19

#### 项目初始搭建

前后端基础框架搭建完毕，完成核心 CRUD 流程。

##### 前端 — 微信小程序

| 页面 | 功能 |
|------|------|
| `index`（首页） | 猫咪拍立得风格卡片列表，按创建时间倒序，随机旋转角度 |
| `add`（添加） | 完整表单：照片选择、录音入口、属性标签、地图选点 |
| `detail`（详情） | 照片轮播、属性展示、地图定位、声音播放、编辑/删除入口 |
| `edit`（编辑） | 复用添加表单结构，预填已有数据 |
| `record`（录音） | 长按录音、试听播放、删除重录 |
| `login`（登录） | 账号密码登录 |
| `register`（注册） | 用户名+密码+昵称注册 |
| `my`（个人中心） | 用户信息展示 |

- 自定义 tabBar（猫爪图标），暖色治愈系 UI（主色 `#FF9A6B`，背景 `#FFF8F0`）
- `custom-tab-bar/` 组件，`constants/cat-tags.js` 猫咪属性枚举
- `utils/api.js` 封装 wx.request → Promise，自动携带 `x-openid` / `x-token`

##### 后端 — Express + MySQL

| 模块 | 路由 | 功能 |
|------|------|------|
| 认证 | `POST /api/auth/register` | 用户注册 |
| 认证 | `POST /api/auth/login` | 账号密码登录（返回 JWT） |
| 认证 | `POST /api/auth/wx-login` | 微信登录（mock） |
| 认证 | `POST /api/auth/send-code` | 短信验证码（mock） |
| 认证 | `POST /api/auth/sms-login` | 验证码登录 |
| 认证 | `GET /api/auth/me` | 获取当前用户信息 |
| 猫咪 | `GET /api/cats` | 猫咪列表 |
| 猫咪 | `GET /api/cats/:id` | 猫咪详情（含照片、音频） |
| 猫咪 | `POST /api/cats` | 创建猫咪档案 |
| 猫咪 | `PUT /api/cats/:id` | 更新猫咪档案 |
| 猫咪 | `DELETE /api/cats/:id` | 删除猫咪档案（级联） |
| 上传 | `POST /api/upload/photo` | 上传照片 |
| 上传 | `POST /api/upload/sound` | 上传音频 |

- 鉴权中间件：JWT（`x-token`）+ openid（`x-openid`）双重认证
- `models/cat.js`：`toFrontendFormat()` 将 MySQL 行数据转换为前端嵌套 camelCase 格式
- 管理后台：仪表盘、猫咪列表、新增/详情/编辑、管理员登录

##### 数据库（MySQL）

- 库名：`stray_cats`，5 张表（`cat_profiles`、`cat_photos`、`cat_sounds`、`users`、`admin_users`）
- `cat_profiles` 含完整属性字段（毛色 JSON、体型、性格 JSON、健康状况等）
- 照片/音频子表以 `cat_id` 外键关联主表，`ON DELETE CASCADE`

##### 初始文件

| 文件 | 说明 |
|------|------|
| `backend/schema.sql` | 数据库建表 DDL |
| `backend/scripts/seed-admin.js` | 管理员账号初始化脚本 |
| `frontend/project.config.json` | 微信开发者工具项目配置 |
| `frontend/utils/api.js` | API 封装层 |

---

## 待办计划

### 🔴 P0 — 高优先级

- [ ] **首页加载状态优化**：图片加载失败时显示占位图，目前 `index.wxml:20` 使用了 `/images/default-cat.png` 但该文件不存在
- [ ] **音频播放异常处理**：`detail.wxml:141` 中 `{{item.duration.toFixed(1)}}` 当 `duration` 为 `undefined` 时会崩溃，需加默认值守卫
- [ ] **首页空数据兼容**：`index.wxml:30` 中 `{{item.location.name}}` 当 `location` 不存在时显示空白，需加守卫
- [ ] **录音页数据传回**：`record.js` 的 `confirmRecord` 仅做 Toast 提示，实际未将音频数据传回 add/edit 页

### 🟡 P1 — 中优先级

- [ ] **图片懒加载与缓存**：详情页轮播图片较多时加载缓慢，考虑使用 `lazy-load` 或预加载策略
- [ ] **表单校验统一**：add/edit 页的表单校验目前分散在各处，可提取为统一校验函数
- [ ] **删除确认优化**：详情页删除后应返回列表页，`navigateBack` 可能回退多层，需确保回到正确页面
- [ ] **管理后台搜索增强**：目前仅支持按昵称搜索，可扩展为支持 openid / 毛色等多维度搜索
- [ ] **列表页下拉刷新**：目前 `index` 页没有下拉刷新机制，手动下拉应重新加载列表

### 🟢 P2 — 低优先级

- [ ] **图片上传进度**：`api.js` 中 `uploadFile` 未使用 `wx.uploadFile` 的 `onProgressUpdate` 回调
- [ ] **管理后台批量操作**：支持批量删除、导出数据
- [ ] **暗黑模式**：基于 CSS 变量，增加深色主题支持
- [ ] **国际化**：猫咪标签枚举当前为中文硬编码，可考虑 i18n 方案
- [ ] **数据库迁移脚本**：`scripts/migrate.js` 骨架已创建，需完善表结构变更的版本管理逻辑
- [ ] **单元测试**：后端 API 缺少测试，可引入 Jest / Mocha 做接口测试

### 🐛 已知问题

- [ ] `frontend/app.js` 中 `wx.cloud.init` 的 `env` 为占位符 `'your-env-id'`，微信云开发未正式启用
- [ ] `frontend/utils/api.js` 中 `BASE_URL` 为 `localhost:3000`，真机调试需替换为局域网 IP
- [ ] `frontend/data/mock-data.js` 的 mockCats 已不再被页面直接使用，考虑移除或改为 API 异常时的 fallback
- [ ] 管理后台 `cat-form.ejs` 的 `BODY_TYPE` 常量与前端 `constants/cat-tags.js` 不完全一致（前端有「怀孕中」，后端为「偏瘦」「适中」「偏胖」）
- [ ] 后端 `routes/auth.js` 的 `wx-login` 和 `send-code/sms-login` 为 mock 实现，生产环境需接入微信 code2session 和短信服务商

---

## 版本迭代规则

1. **版本号格式**：`v{major}.{minor}.{patch}`
   - major：重大重构或架构变更
   - minor：新功能或重要优化
   - patch：Bug 修复或微小调整
2. 每次完成迭代后，将对应条目从「待办计划」移至「版本历史」
3. 每个版本需注明日期和简要修改说明
4. 关联的 GitHub Issue 或 PR 可附在条目末尾
