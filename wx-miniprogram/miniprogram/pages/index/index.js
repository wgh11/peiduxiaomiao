const app = getApp();

Page({
  data: {
    webViewUrl: ''
  },

  onLoad() {
    this.setData({ webViewUrl: app.globalData.webViewUrl });
  },

  onShareAppMessage() {
    return {
      title: '陪读小喵：一起安静学习一会儿',
      path: '/pages/index/index'
    };
  },

  onWebMessage(event) {
    const messages = (event.detail && event.detail.data) || [];
    const last = messages[messages.length - 1];
    if (!last || !last.type) return;
    // 后续原生广告、保存图片和云端存档都从这里接入。
    if (last.type === 'log') console.info('[peiduxiaomiao]', last.payload || {});
  }
});

