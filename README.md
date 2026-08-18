# Basic 850 零基础英语学习教材

一套手机优先的响应式 H5 学习网站：纯前端、可离线使用，包含14节音标先修课、17单元/85课/850词主课、完整词库、英美发音切换与本机间隔复习。电脑和平板也会自动适配。

## 本机运行

需要 Node.js 22.13 或更新版本。

```powershell
npm ci
npm run dev
```

浏览器打开 `http://localhost:3000/`。

## 生成静态网站

```powershell
npm run build
npm run preview
```

构建产物位于 `dist/client/`，预览地址为 `http://localhost:4173/`。整个目录可直接放到 Nginx、对象存储或其他静态网站服务中。

当前资源路径按域名根目录生成；部署时请将站点放在域名根路径。正式服务器建议启用 HTTPS，否则浏览器不会启用离线 Service Worker。

## 部署到普通云服务器

Nginx 示例：

1. 将 `dist/client/` 的全部内容上传到 `/usr/share/nginx/html/`。
2. 使用 `deploy/nginx.conf` 作为站点配置。
3. 重载 Nginx。

Docker 示例：

```powershell
docker build -t basic-850 .
docker run --rm -p 8080:80 basic-850
```

然后打开 `http://localhost:8080/`。

## 内容和证据边界

- 850词形、分类与原始顺序来自项目根目录中的 PDF 词表，经程序提取和850项唯一性校验。
- 该 PDF 是2015年打印的福岛大学网页词表，不是 Ogden 1930年原著扫描件。
- 音标、中文释义、简明英文定义、例句和相关词属于现代教学增补层；数据中的 `editorial_status` 标明校订状态。
- 发音采用浏览器/操作系统的合成语音。UK/US 会优先选择对应地区音色；设备没有对应声音时会降级到可用英语音色。
- 学习进度只保存在当前浏览器，可在“复习”页导出或导入 JSON 备份。

## 数据维护

```powershell
python -X utf8 scripts/build_words.py --offline
node scripts/build-course-map.mjs
npm run validate:data
```

生成后的数据位于 `public/data/`。构建前的验证会检查850词唯一性、五类数量、85课每课10词，以及课程映射无遗漏无重复。
