# Basic 850 零基础英语学习教材

一套手机优先的响应式 H5 学习网站：纯前端、可离线使用，包含6节字母入门课、14节音标先修课、17单元/85课/850词主课、197个词的本地配图、完整词库、英美发音切换与本机间隔复习。电脑和平板也会自动适配。

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
- 字母模块包含26个大小写、英美字母名、常见音值、基础书写和6节短课；它不会把字母误写成26个固定音。
- 音标、中文释义、简明英文定义、例句和相关词属于现代教学增补层；数据中的 `editorial_status` 标明校订状态。
- 字母名、单词和例句采用浏览器/操作系统的合成语音。UK/US 会优先选择对应地区音色；设备没有对应声音时会降级到可用英语音色。
- 音标卡的“单音”键播放随站点打包的48段独立合成示范；它们是宽式教学参照，不代表所有英语口音只有一种实现。生成说明见 `public/audio/phonemes/NOTICE.md`。
- 字母课使用6张原创儿童绘本风插图帮助建立图像联想；文字和语音仍是正式学习内容。
- 词卡首批为197个适合看图理解的词提供本地 SVG 配图：覆盖171/200个“可描绘事物”及26个具体普通名词。142个可描绘词属于精确图解，29个只能近似表示的词明确标成“联想图”；没有可靠图形对应的词不会硬配。
- 词卡 SVG 取自 [Twemoji v17.0.2](https://github.com/jdecked/twemoji/tree/v17.0.2)，图形采用 [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)；项目未修改原图，只添加了中文替代文本与教学提示。完整说明见 `public/illustrations/words/NOTICE.md`。
- 学习进度只保存在当前浏览器，可在“复习”页导出或导入 JSON 备份。

## 数据维护

```powershell
python -X utf8 scripts/build_words.py --offline
node scripts/build-course-map.mjs
node scripts/fetch-word-picture-assets.mjs
npm run validate:data
```

生成后的数据位于 `public/data/`。构建前的验证会检查850词唯一性、五类数量、85课每课10词，以及课程映射无遗漏无重复。
