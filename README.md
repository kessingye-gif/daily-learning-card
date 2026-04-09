# 学习小组（Academia Study Hub）

一个支持多学习小组、成员管理、动态发布与互动的全栈应用。前端使用 React 19 + Vite，后端使用 Node/Express + better-sqlite3。每个学习小组最多 3 位管理员，普通成员的邀请需要管理员审核，管理员可以删除成员、设置管理员、审批邀请等。

## 功能概览

- **注册 / 登录**：用户名 + 密码登录，密码使用 bcrypt 哈希保存。
- **学习小组**  
  - 创建／加入多个小组，每个小组独立管理动态、成员、邀请。  
  - 创建者自动成为 `owner`，同组最多 3 个 `owner/admin`。  
  - 管理员可邀请成员（立即生效），普通成员的邀请进入待审批列表。  
  - 管理员可移除成员、提升/降级管理员；不可删除 owner，本人也不能删除自己。
- **动态**  
  - 仅小组成员可创建、浏览、点赞、收藏、评论。  
  - 动态、评论、点赞等都绑定小组权限；退出小组后无法再访问该组的动态。  
  - 管理员（即动态作者）可以删除自己的动态。
- **统计与资料**：后台提供 `/api/stats`、`/api/members` 等基础数据接口，便于扩展仪表盘。

## 技术栈

| 层 | 技术 |
| --- | --- |
| 前端 | React 19、Vite、TypeScript、Tailwind（自定义样式）、Framer Motion |
| 后端 | Node.js、Express、better-sqlite3、bcryptjs |
| 数据库 | SQLite（单文件 `database.sqlite`） |
| 运行脚本 | `tsx server.ts`（同进程负责 API + Vite 中间件） |

## 快速开始

### 1. 环境需求

- Node.js ≥ 18（如果在旧版 CentOS/GLIBC 环境，推荐使用 nvm 源码编译以避免 GLIBC 版本错误）
- npm ≥ 9

### 2. 安装依赖

```bash
npm install
```

### 3. 开发模式

```bash
npm run dev
```

默认会：

- 初始化/升级 SQLite（`database.sqlite`）
- 在 `PORT`（默认 3000）启动 Express API
- 以 Vite 中间件模式提供前端（HMR 端口默认 24678）

访问 `http://127.0.0.1:3000` 即可体验全部功能。

### 4. 构建前端并运行生产服务

```bash
npm run build           # 生成 dist/ 静态资源
APP_HOST=0.0.0.0 PORT=7890 NODE_ENV=production npx tsx server.ts
```

在生产环境中，`server.ts` 会直接托管 `dist/` 静态文件并提供 API。

### 5. 环境变量

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | API 和前端服务监听端口 |
| `APP_HOST` | `0.0.0.0` | API 监听地址 |
| `VITE_DEV_HOST` | `127.0.0.1` | 开发模式下的 Vite host |
| `VITE_HMR_PORT` | `24678` | HMR 端口 |
| `PUBLIC_DEV_HOST` | 自动推断 | 控制日志里展示的访问地址 |

可在启动命令前设置，如 `PORT=7890 npm run dev`。

## 部署建议

1. **后端服务器**：选择一个可以运行 Node/Express 的宿主环境，确保开放 `PORT`。  
2. **进程守护**：可用 pm2 / systemd 管理进程，例如  
   ```bash
   pm2 start --name academia "APP_HOST=0.0.0.0 PORT=7890 NODE_ENV=production npx tsx server.ts"
   pm2 save && pm2 startup
   ```  
   如果无法安装 pm2，可创建 systemd service。
3. **静态资源**：生产环境运行 `npm run build`，由 `server.ts` 托管 `dist/`。若想把前端放到 CDN/Netlify，需要把前端的 `API_ROUTES` 指向服务器的真实域名，并处理 CORS。
4. **数据库备份**：SQLite 在轻量场景表现良好，但仍需定期备份 `database.sqlite`（例如每日/每周复制到安全位置）；如果用户规模和并发显著增长，可迁移到托管的 PostgreSQL/MySQL。
5. **日志 & 监控**：`pm2 logs academia` 查看实时日志；或使用 systemd/journalctl 记录。

## 常见问题

- **GLIBC 版本错误**：在老旧 Linux（如 CentOS 7）上安装 Node 22 会提示 `GLIBC_2.27 not found`。请使用 nvm 源码编译 Node 18（`nvm install 18 --source=remote`）或通过 NodeSource repo 安装，为当前系统编译的 Node。
- **esbuild 平台报错**：不要把本地 `node_modules` 直接拷贝到服务器。请在目标机器运行 `rm -rf node_modules && npm install`，获取与平台匹配的 esbuild 二进制。
- **Failed to fetch / 登录失败**：确保前端请求的 API 地址与后端实际监听地址一致；如果前端部署在不同域名，需要打开 CORS，或通过反向代理统一域名。
- **被移出小组后还能看动态吗？**：不能。所有动态/互动接口都会校验组成员资格，只有重新加入小组才能继续访问。

## 目录结构概览

```
.
├── backend/
│   ├── db/
│   │   ├── database.ts        # SQLite 初始化 & 迁移
│   │   └── repository.ts      # 业务查询/写入封装
│   └── routes/                # cards/users/groups API
├── src/
│   ├── components/            # UI & 功能组件
│   ├── hooks/                 # 数据获取、状态管理
│   ├── services/apiService.ts # 与后端交互
│   └── lib/AuthContext.tsx    # 登录状态
├── server.ts                  # Express + Vite 入口
├── database.sqlite            # SQLite 数据库文件（运行后生成）
└── README.md
```

## 备份与迁移

1. 定期复制 `database.sqlite` 到安全位置，即可完成冷备份。  
2. 如需迁移到云数据库：  
   - 导出 SQLite 数据 (`.dump` 或自写脚本)；  
   - 在云数据库中建表；  
   - 更新 `backend/db/database.ts` 与 `repository.ts` 使用新的数据库驱动；  
   - 调整 `.env` 或连接配置后重新部署。

## License

该项目默认遵循 MIT License（如需变更，可修改仓库根目录的 LICENSE 文件）。

---

欢迎提 Issue 或 PR，一起改进学习小组的体验！
