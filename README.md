# 加州驾照笔试练习
[打开练习网站](https://california-dmv-bilingual-practice.viridhoney4.chatgpt.site/)

支持中英文题目、中文解析、顺序练习、随机练习、模拟考试、本机收藏和网页题目导入。

## 题目来源与免责声明

四套官方样题来自[加州 DMV](https://www.dmv.ca.gov/portal/driver-education-and-safety/educational-materials/sample-driver-license-dl-knowledge-tests/)。网络题库包含 60 道公开项目整理题及用户上传题，请注意辨别。用户提交的答案和本站解析可能有误或过时。本站为独立学习工具，与 DMV 无隶属关系，不能保证考试命中或通过。请以最新[加州驾驶手册](https://www.dmv.ca.gov/portal/handbook/california-driver-handbook/)和适用法规为准。

请仅上传有权分享的内容并移除个人信息。错题或版权反馈请通过 Issues 提供题号及来源。

## 开发

从 main 创建分支，修改 dist 下的网页文件、db/worker.mjs 服务逻辑或 db/questions.json 初始题库，运行以下命令重建服务并检查差异，再提交 Pull Request。

```sh
node build-worker.mjs
git diff --stat
```

服务入口为 dist/server/index.js。运行时需要 Worker 环境及名为 DB 的 D1 绑定，先执行 drizzle 下的 SQL 迁移。用户导入题保存在运行时数据库。合并到 main 后另行发布到 Sites。

## 许可

项目原创代码采用 MIT 许可。官方样题、第三方题目和用户上传内容保留各自权利与许可。整理题的上游来源及许可见 [db/NOTICE.txt](db/NOTICE.txt)。
