const { getSavedProfile } = require('./utils/api')

App({
  globalData: {
    openid: '',
    profile: null,
    cloudReady: false,
    fontReady: false
  },

  onLaunch() {
    this.globalData.profile = getSavedProfile()
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-d0gkqrect0711f911',
        traceUser: true
      })
      this.globalData.cloudReady = true
      this.ensureLogin()
    }
  },

  ensureLogin() {
    if (this.globalData.openid) {
      return Promise.resolve(this.globalData.openid)
    }

    if (!this.globalData.cloudReady) {
      const localOpenid = wx.getStorageSync('love36_local_openid') || `local_${Date.now()}`
      wx.setStorageSync('love36_local_openid', localOpenid)
      this.globalData.openid = localOpenid
      return Promise.resolve(localOpenid)
    }

    return wx.cloud.callFunction({ name: 'login' })
      .then((res) => {
        const openid = res.result && res.result.openid
        this.globalData.openid = openid || ''
        return this.globalData.openid
      })
      .catch(() => {
        const localOpenid = wx.getStorageSync('love36_local_openid') || `local_${Date.now()}`
        wx.setStorageSync('love36_local_openid', localOpenid)
        this.globalData.openid = localOpenid
        return localOpenid
      })
  }
})
