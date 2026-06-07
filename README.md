# 爱情三十六问小程序

原生微信小程序 + 微信云开发版本。当前实现包含两步选择动线、面对面同屏、双机同步答双人房间、双方提交后解锁答案、历史记录、结果页和客户端 canvas 分享图生成。

## 页面

- `pages/index`：选择答题类型
- `pages/mode`：选择面对面同屏或双机同步答
- `pages/join`：创建/加入双人房间
- `pages/flow`：准备、36 问、组间休息、对视
- `pages/complete`：完成结果
- `pages/record-detail`：历史详情和分享图生成
- `pages/mine`：我的记录、使用说明、关于入口

## 云开发配置

1. 用微信开发者工具打开本目录。
2. 在 `app.js` 中确认 `wx.cloud.init({ env })` 使用你的云开发环境 ID。当前已填入 `cloud1-d0gkqrect0711f911`。
3. 开通云开发后，创建以下集合：
   - `sessions`
   - `answers`
   - `records`
   - `question_sets`（当前题库内置在前端和云函数中，后续可迁移到该集合）
4. 右键 `cloudfunctions` 下每个云函数目录，逐个选择“上传并部署：云端安装依赖”。

## 云函数

- `login`：获取当前用户 openid。
- `createSession`：创建或复用未完成的双人房间。
- `joinSession`：加入双人房间，最多 2 人。
- `updateSessionProfile`：修改房间名和当前成员昵称。
- `submitAnswer`：提交当前题答案。
- `getSessionState`：拉取房间、提交状态和可见答案。
- `completeSession`：完成会话并生成历史记录。
- `generateRecordImage`：读取历史记录、记录分享图生成状态。实际 PNG 分享图由小程序端 canvas 绘制，避免云函数图形库依赖。

## 注意

- 不要把 `app secret` 写入小程序前端或仓库。
- 全局字体使用霞鹜文楷 `LXGW WenKai`。当前字体文件放在云存储 `/LXGWWenKai-Regular.ttf`，小程序启动时通过 `wx.cloud.getTempFileURL` 获取临时地址后调用 `wx.loadFontFace`。
- 微信昵称授权是非强制流程。用户可跳过；授权后昵称保存在本地，并用于我的记录、双机房间成员名和后续创建/加入房间。
- 当前版本不包含语音转文字。
- 文案定位为沟通工具，不宣称心理测试、心理诊断或咨询替代。
