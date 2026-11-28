# 陪读小喵 · CloudBase 微信小程序壳

当前已完成第一阶段：

- 当前 H5 版本已部署到 CloudBase 静态托管：
  `https://wgh-d4gzi1zrs0b4d5c63-1540672373.tcloudbaseapp.com/index.html?v=28`
- `wx-miniprogram/` 提供原生微信小程序入口。
- `app.js` 已初始化 CloudBase 环境 `wgh-d4gzi1zrs0b4d5c63`。
- 原生壳使用 `web-view` 承载现有 3D 小屋和商店功能，并预留消息桥接。

## 在微信开发者工具打开

1. 将 `wx-miniprogram/project.config.json` 的 `appid` 填成真实的小程序 AppID。
2. 用微信开发者工具打开 `wx-miniprogram/`，登录绑定该小程序的公众平台账号。
3. 在小程序后台将 `wgh-d4gzi1zrs0b4d5c63-1540672373.tcloudbaseapp.com` 配为业务域名。
4. 勾选 CloudBase / 云开发能力，预览 `pages/index/index`。
5. 先验收 web-view 版本，再接入原生激励广告、微信分享、云端存档和隐私授权。

## 继续部署 H5

```powershell
tcb hosting deploy D:\Dev\Projects\aiplay\miao\miao\index.html --env-id wgh-d4gzi1zrs0b4d5c63
tcb hosting deploy D:\Dev\Projects\aiplay\miao\miao\css css --env-id wgh-d4gzi1zrs0b4d5c63
tcb hosting deploy D:\Dev\Projects\aiplay\miao\miao\js js --env-id wgh-d4gzi1zrs0b4d5c63
tcb hosting deploy D:\Dev\Projects\aiplay\miao\miao\assets assets --env-id wgh-d4gzi1zrs0b4d5c63
tcb hosting deploy D:\Dev\Projects\aiplay\miao\miao\papers papers --env-id wgh-d4gzi1zrs0b4d5c63
```

当前没有把 AppID 写入仓库，也没有保存任何 SecretId/SecretKey。

