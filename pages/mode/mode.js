const { getQuestionSet } = require('../../data/questionSets')
const { callFunction, getSavedProfile } = require('../../utils/api')

Page({
  data: {
    versionId: '',
    questionSet: null,
    creating: false
  },

  onLoad(options) {
    const versionId = options.versionId || 'goodbye-love'
    this.setData({
      versionId,
      questionSet: getQuestionSet(versionId)
    })
  },

  startSameDevice() {
    wx.navigateTo({
      url: `/pages/flow/flow?mode=same-device&versionId=${this.data.versionId}`
    })
  },

  startInvite() {
    if (this.data.creating) return
    this.setData({ creating: true })
    const profile = getSavedProfile()
    callFunction('createSession', {
      versionId: this.data.versionId,
      mode: 'invite',
      nickName: profile && profile.nickName ? profile.nickName : ''
    })
      .then((res) => {
        if (!res || !res.sessionId) {
          throw new Error('missing session')
        }
        const reusedQuery = res.reused ? '&reused=1' : ''
        wx.navigateTo({
          url: `/pages/join/join?sessionId=${res.sessionId}&role=host${reusedQuery}`
        })
      })
      .catch((error) => {
        console.error('createSession failed', error)
        wx.showToast({
          title: '创建失败，请看控制台',
          icon: 'none'
        })
      })
      .finally(() => {
        this.setData({ creating: false })
      })
  }
})
