const CLOUD_ENV_ID = 'wgh-d4gzi1zrs0b4d5c63';
const WEB_URL = 'https://wgh-d4gzi1zrs0b4d5c63-1540672373.tcloudbaseapp.com/index.html?v=28';

App({
  globalData: {
    cloudEnvId: CLOUD_ENV_ID,
    webViewUrl: WEB_URL
  },
  onLaunch() {
    if (wx.cloud) {
      wx.cloud.init({
        env: CLOUD_ENV_ID,
        traceUser: true
      });
    }
  }
});

