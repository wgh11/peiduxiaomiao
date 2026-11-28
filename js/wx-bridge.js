/* 微信 web-view 与原生小程序壳的最小消息桥。
 * 普通浏览器中保持空操作；进入微信 web-view 后由 jweixin 提供 wx.miniProgram。
 */
window.PDM = window.PDM || {};
(function (PDM) {
  'use strict';
  const mini = window.wx && window.wx.miniProgram;
  const bridge = {
    isWebView: !!mini,
    post(type, payload) {
      if (!mini || !mini.postMessage) return false;
      mini.postMessage({ data: { type: type, payload: payload || {} } });
      return true;
    },
    share(payload) { return this.post('share', payload); },
    requestRewardedAd(payload) { return this.post('rewardedAd', payload); },
    saveImage(payload) { return this.post('saveImage', payload); },
    log(payload) { return this.post('log', payload); }
  };
  PDM.wxBridge = bridge;
})(window.PDM);

