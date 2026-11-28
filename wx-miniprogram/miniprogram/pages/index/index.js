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
    const payload = last.payload || {};
    if (last.type === 'log') {
      console.info('[peiduxiaomiao]', payload);
      if (wx.cloud) {
        wx.cloud.database().collection('pdm_events').add({
          data: { type: payload.type || 'unknown', data: payload.data || null, at: new Date() }
        }).catch(() => {});
      }
      return;
    }
    if (last.type === 'share') {
      wx.showShareMenu({ withShareTicket: true }).catch(() => {});
      wx.showToast({ title: '请点右上角分享', icon: 'none' });
      return;
    }
    if (last.type === 'saveImage' && payload.dataUrl) {
      const base64 = payload.dataUrl.replace(/^data:image\/png;base64,/, '');
      const filePath = `${wx.env.USER_DATA_PATH}/peiduxiaomiao-${Date.now()}.png`;
      wx.getFileSystemManager().writeFile({
        filePath,
        data: base64,
        encoding: 'base64',
        success: () => wx.saveImageToPhotosAlbum({
          filePath,
          success: () => wx.showToast({ title: '图片已保存', icon: 'success' }),
          fail: () => wx.showToast({ title: '需要授权保存图片', icon: 'none' })
        }),
        fail: () => wx.showToast({ title: '图片保存失败', icon: 'none' })
      });
    }
  }
});

