# Nanocount

Nanocount 是一个轻量的网站访问量计数器。只需一键部署然后在网站中加入一行 JavaScript ，就可以记录每个页面的访问次数，并在后台查看或修改数据。

它不会保存访客 IP、Cookie、User-Agent 或身份信息。你可以部署到 Vercel、Cloudflare、普通 Linux 服务器或 Docker。

## 添加计数器到网站

部署 Nanocount 后，你会得到一个地址，例如：

```text
https://count.example.com
```

把下面代码放到需要统计的网页中，建议放在 `</body>` 前：

```html
<script defer src="https://count.example.com/nano.js"></script>
```

请把 `https://count.example.com` 替换成你自己的 Nanocount 地址。

每次页面加载时，Nanocount 会给当前页面增加一次访问量。默认只按域名和路径统计，例如：

```text
https://example.com/posts/hello?from=home
```

会被记录为：

```text
example.com /posts/hello
```

查询参数和 `#` 后面的内容默认不会参与统计，避免同一个页面产生很多重复记录。

如果希望在网页上显示计数，可以添加：

```html
当前页面访问量：<span data-nanocount-page>--</span>
全站访问量：<span data-nanocount-site>--</span>

<script defer src="https://count.example.com/nano.js"></script>
```

可选设置：

| 写法 | 作用 |
| --- | --- |
| `data-query="true"` | 把查询参数也计入页面地址 |
| `data-readonly="true"` | 只显示访问量，不增加计数；设置了 `PUBLIC_API_TOKEN` 时不能使用 |
| `data-debug="true"` | 请求失败时在浏览器控制台显示错误 |

完整示例：

```html
<script
  defer
  src="https://count.example.com/nano.js"
  data-query="true"
  data-debug="true"
></script>
```

如果你的网站启用了 CSP，需要允许加载 Nanocount 脚本和发送请求：

```http
Content-Security-Policy: script-src 'self' https://count.example.com; connect-src 'self' https://count.example.com
```

## 部署

只需要选择下面一种部署方式。部署完成后打开：

```text
https://你的-nanocount-地址/admin
```

使用 `ADMIN_PASSWORD` 登录后台。

### 环境变量

第一次部署主要填写前两项：

| 变量 | 是否必填 | 怎么填写 |
| --- | --- | --- |
| `ADMIN_PASSWORD` | 是 | 后台登录密码，至少 12 位，建议使用密码管理器生成随机密码 |
| `ALLOWED_HOSTS` | 是 | 需要统计的网站域名，例如 `example.com`；多个域名用英文逗号分隔，子域名可写 `*.example.com`；回环地址默认允许 |
| `PUBLIC_API_TOKEN` | 否 | 设置后，读取访问量 API 必须携带此 Token；公开网页需要直接读取时请留空 |
| `SESSION_TTL_HOURS` | 否 | 后台登录有效时间，默认 `12` 小时 |
| `ALLOW_NO_ORIGIN` | 否 | 默认 `false`；只有服务端主动上报访问量时才建议设为 `true` |
| `DATABASE_URL` | Linux / Docker | 默认 `file:data/nanocount.db`，通常不用修改 |
| `TURSO_DATABASE_URL` | Vercel | 由 Vercel 的 Turso 集成自动创建和填写 |
| `TURSO_AUTH_TOKEN` | Vercel | 由 Vercel 的 Turso 集成自动创建和填写 |
| `TRUST_PROXY` | Linux / Docker | 使用自己控制的 Nginx、Caddy 等反向代理时设为 `true` |
| `PORT` | Linux | 服务端口，默认 `3000` |

`ALLOWED_HOSTS` 示例：

```dotenv
# 只统计一个域名
ALLOWED_HOSTS=example.com

# 同时统计主域名和所有子域名
ALLOWED_HOSTS=example.com,*.example.com

# 统计多个不同网站
ALLOWED_HOSTS=example.com,example.net,blog.example.org
```

`localhost`、`*.localhost`、`127.0.0.0/8` 和 IPv6 `[::1]` 等回环地址始终允许，无需加入 `ALLOWED_HOSTS`，可直接用于本地主题测试。

不要把真实密码或 Token 提交到 Git 仓库。

### vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fimouup%2FNanocount&project-name=nanocount&repository-name=nanocount&env=ADMIN_PASSWORD,ALLOWED_HOSTS&envDescription=ADMIN_PASSWORD%20%E8%87%B3%E5%B0%91%2012%20%E4%BD%8D%EF%BC%9BALLOWED_HOSTS%20%E5%A1%AB%E5%86%99%E8%A6%81%E7%BB%9F%E8%AE%A1%E7%9A%84%E7%BD%91%E7%AB%99%E5%9F%9F%E5%90%8D%EF%BC%8C%E4%BE%8B%E5%A6%82%20example.com%2C*.example.com%E3%80%82&envLink=https%3A%2F%2Fgithub.com%2Fimouup%2FNanocount%23%E7%8E%AF%E5%A2%83%E5%8F%98%E9%87%8F&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22tursocloud%22%2C%22productSlug%22%3A%22database%22%2C%22protocol%22%3A%22storage%22%7D%5D)

点击按钮后：

1. 登录 Vercel，并选择 Git 仓库保存位置。
2. 同意添加 Turso Cloud 数据库。Vercel 会自动创建数据库，并配置 `TURSO_DATABASE_URL` 和 `TURSO_AUTH_TOKEN`。
3. 填写 `ADMIN_PASSWORD` 和 `ALLOWED_HOSTS`。
4. 点击 **Deploy**。
5. 部署完成后，打开 Vercel 给出的地址，在地址后加 `/admin` 登录。

一键按钮会完成代码复制、项目创建、数据库连接和部署。出于安全原因，管理员密码和网站域名仍必须由你亲自填写。

如果没有自动出现 Turso 步骤，可以在 Vercel 项目的 **Storage / Marketplace** 中安装 **Turso Cloud**，创建一个数据库并连接到项目，然后重新部署。

### cloudflare

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/imouup/Nanocount)

点击按钮后：

1. 登录 Cloudflare，并授权它复制仓库。
2. 填写 `ADMIN_PASSWORD` 和 `ALLOWED_HOSTS`。
3. 确认创建 Worker 和 D1 数据库。
4. 点击部署。D1 建表迁移会自动执行。
5. 部署完成后，打开 Worker 地址并在后面加 `/admin` 登录。



如果一键部署不可用，可以手动部署：

```bash
git clone https://github.com/imouup/Nanocount.git
cd Nanocount
npm ci
npx wrangler login
```

设置两个变量：

```bash
npx wrangler secret put ADMIN_PASSWORD
npx wrangler secret put ALLOWED_HOSTS
```

最后运行：

```bash
npm run deploy
```

### linux

需要 Node.js `>= 22.0.0`，推荐使用当前 Node.js 22 LTS 补丁版本。

```bash
git clone https://github.com/imouup/Nanocount.git
cd Nanocount
npm ci
cp .env.example .env
```

打开 `.env`，至少修改：

```dotenv
ADMIN_PASSWORD=替换成至少12位的随机密码
ALLOWED_HOSTS=example.com,*.example.com
DATABASE_URL=file:data/nanocount.db
```

构建并启动：

```bash
npm run build
NODE_ENV=production npm start
```

Nanocount 默认监听 `3000` 端口，数据保存在 `data/nanocount.db`。请定期备份这个文件。

生产环境建议使用 Caddy 或 Nginx 配置 HTTPS。Caddy 示例：

```caddyfile
count.example.com {
  reverse_proxy 127.0.0.1:3000
}
```

使用反向代理时，在 `.env` 中添加：

```dotenv
TRUST_PROXY=true
```

### docker

需要已经安装并启动 Docker Desktop 或 Docker Engine。

可以直接使用构建好的 GHCR 镜像：

```bash
docker run -d \
  --name nanocount \
  --restart unless-stopped \
  -p 3000:3000 \
  -e ADMIN_PASSWORD='替换成至少12位的随机密码' \
  -e ALLOWED_HOSTS='example.com,*.example.com' \
  -v nanocount-data:/app/data \
  ghcr.io/imouup/nanocount:latest
```

* 如果希望自己构建镜像，可以使用 Docker Compose：

```bash
git clone https://github.com/imouup/Nanocount.git
cd Nanocount
cp .env.example .env
```

打开 `.env`，至少修改：

```dotenv
ADMIN_PASSWORD=替换成至少12位的随机密码
ALLOWED_HOSTS=example.com,*.example.com
```

启动：

```bash
docker compose up -d --build
```




然后打开：

```text
http://服务器IP:3000/admin
```

常用命令：

```bash
# 查看日志
docker compose logs -f

# 停止
docker compose down

# 拉取新版本并升级
git pull
docker compose up -d --build
```

数据库保存在 Docker 命名卷 `nanocount-data` 中。执行 `docker compose down` 不会删除数据，不要使用 `docker compose down -v`，除非你确定要删除全部统计数据。

## API文档

下面示例假设 Nanocount 地址为：

```text
https://count.example.com
```

所有成功响应格式：

```json
{
  "ok": true,
  "data": {}
}
```

失败响应格式：

```json
{
  "ok": false,
  "error": {
    "code": "invalid_input",
    "message": "host is invalid"
  }
}
```

**记录一次访问**

计数脚本会自动调用此接口，普通用户通常不需要手动调用。

```http
POST /api/v1/hit
Origin: https://example.com
Content-Type: text/plain
```

```json
{
  "host": "example.com",
  "path": "/posts/hello"
}
```

请求中的 `host` 必须与浏览器的 `Origin` 域名一致，并且必须包含在 `ALLOWED_HOSTS` 中；本地回环地址默认允许。

成功响应：

```json
{
  "ok": true,
  "data": {
    "host": "example.com",
    "path": "/posts/hello",
    "pageViews": 128,
    "siteViews": 2048
  }
}
```

**获取一个页面的访问量**

```http
GET /api/v1/count?host=example.com&path=/posts/hello
```

也可以直接传完整 URL：

```http
GET /api/v1/count?url=https%3A%2F%2Fexample.com%2Fposts%2Fhello
```

参数：

| 参数 | 说明 |
| --- | --- |
| `host` | 页面域名，与 `path` 一起使用 |
| `path` | 页面路径，默认 `/` |
| `url` | 完整的 HTTP 或 HTTPS 地址；设置后优先于 `host` 和 `path` |
| `includeQuery=true` | 保留查询参数 |

页面不存在时，`pageViews` 返回 `0`。

**获取一个网站的总访问量**

```http
GET /api/v1/site?host=example.com
```

```json
{
  "ok": true,
  "data": {
    "host": "example.com",
    "siteViews": 2048
  }
}
```

**读取 API 鉴权**

如果设置了 `PUBLIC_API_TOKEN`，读取接口必须携带以下任意一种请求头：

```http
Authorization: Bearer your-token
```

或：

```http
X-Nanocount-Key: your-token
```

不要把 `PUBLIC_API_TOKEN` 写进公开网页。如果网页需要直接显示计数，最简单的做法是让它保持为空。

**管理 API**

脚本或自动化程序可以使用 `ADMIN_PASSWORD` 作为 Bearer Token：

```bash
curl -H "Authorization: Bearer $ADMIN_PASSWORD" \
  "https://count.example.com/admin/api/pages?host=example.com"
```

修改访问量：

```bash
curl -X PATCH \
  -H "Authorization: Bearer $ADMIN_PASSWORD" \
  -H "Content-Type: application/json" \
  -d '{"host":"example.com","path":"/posts/hello","views":500}' \
  "https://count.example.com/admin/api/pages"
```

| 方法 | 地址 | 作用 |
| --- | --- | --- |
| `GET` | `/admin/api/summary` | 获取总访问量、页面数和域名数 |
| `GET` | `/admin/api/hosts` | 获取域名列表 |
| `GET` | `/admin/api/pages` | 获取页面列表，支持 `host`、`search`、`page`、`pageSize`、`sort`、`order` |
| `PATCH` | `/admin/api/pages` | 创建页面或修改页面访问量 |

## 开发与验证

安装依赖并启动开发服务器：

```bash
npm ci
cp .env.example .env
npm run dev
```

运行完整检查：

```bash
npm run check
```

它会依次执行 TypeScript 类型检查、自动化测试和生产构建。

单独运行：

```bash
npm run typecheck
npm test
npm run build
```

Cloudflare 本地开发：

```bash
cp .dev.vars.example .dev.vars
npm run cf:migrate:local
npm run cf:dev
```

**发布 Docker 镜像**

仓库中的 `.github/workflows/release-docker.yml` 会在 GitHub Release 发布后自动构建 `linux/amd64` 和 `linux/arm64` 镜像，并发布到ghcr和doxker hub。




## License

[MIT](LICENSE)

界面图标来自 [Font Awesome Free](https://fontawesome.com/)，图标部分按 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/) 使用。
