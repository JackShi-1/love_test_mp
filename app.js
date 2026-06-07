const FONT_FAMILY = 'LXGW WenKai'
const FONT_FILE_ID = 'cloud://cloud1-d0gkqrect0711f911.636c-cloud1-d0gkqrect0711f911-1440900961/LXGWWenKai-Regular.ttf'
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
      this.loadFontFace()
      this.ensureLogin()
    } else {
      this.loadFontFace()
    }
  },

  loadFontFace() {
    if (!wx.loadFontFace) {
      return
    }

    if (!wx.cloud || !this.globalData.cloudReady) {
      this.applyFontFace(FONT_FILE_ID)
      return
    }

    wx.cloud.getTempFileURL({
      fileList: [FONT_FILE_ID],
      success: (res) => {
        const file = res.fileList && res.fileList[0]
        this.applyFontFace(file && file.tempFileURL ? file.tempFileURL : FONT_FILE_ID)
      },
      fail: (error) => {
        console.warn('LXGW WenKai temp url failed', error)
        this.applyFontFace(FONT_FILE_ID)
      }
    })
  },

  applyFontFace(sourceUrl) {
    wx.loadFontFace({
      global: true,
      family: FONT_FAMILY,
      source: `url("${sourceUrl}")`,
      desc: {
        style: 'normal',
        weight: '400'
      },
      success: () => {
        this.globalData.fontReady = true
      },
      fail: (error) => {
        console.warn('LXGW WenKai font load failed', error)
      }
    })
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
