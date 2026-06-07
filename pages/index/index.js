const { questionSets } = require('../../data/questionSets')
const { getSavedProfile, requestWechatProfile } = require('../../utils/api')

const PROFILE_PROMPT_KEY = 'love36_profile_prompt_at'
const PROFILE_PROMPT_INTERVAL = 24 * 60 * 60 * 1000

const homeQuestionSets = questionSets
  .map((item) => ({
    ...item,
    bg: item.id === 'aron' ? '/assets/card-bg-aron.jpg' : '/assets/card-bg-goodbye.jpg'
  }))
  .sort((a, b) => (a.id === 'aron' ? -1 : 1) - (b.id === 'aron' ? -1 : 1))

Page({
  data: {
    questionSets: homeQuestionSets,
    showProfilePrompt: false
  },

  onShow() {
    this.maybeShowProfilePrompt()
  },

  maybeShowProfilePrompt() {
    const profile = getSavedProfile()
    if (profile && profile.nickName) {
      this.setData({ showProfilePrompt: false })
      return
    }

    const lastPromptAt = Number(wx.getStorageSync(PROFILE_PROMPT_KEY)) || 0
    if (Date.now() - lastPromptAt < PROFILE_PROMPT_INTERVAL) {
      this.setData({ showProfilePrompt: false })
      return
    }

    setTimeout(() => {
      const latestProfile = getSavedProfile()
      if (!latestProfile || !latestProfile.nickName) {
        this.setData({ showProfilePrompt: true })
      }
    }, 450)
  },

  useWechatProfile() {
    requestWechatProfile()
      .then(() => {
        this.setData({ showProfilePrompt: false })
        wx.showToast({ title: '昵称已保存', icon: 'none' })
      })
      .catch(() => {
        this.deferProfilePrompt()
        wx.showToast({ title: '可以继续匿名使用', icon: 'none' })
      })
  },

  skipProfilePrompt() {
    this.deferProfilePrompt()
  },

  deferProfilePrompt() {
    wx.setStorageSync(PROFILE_PROMPT_KEY, Date.now())
    this.setData({ showProfilePrompt: false })
  },

  chooseVersion(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/mode/mode?versionId=${id}`
    })
  },

  goMine() {
    wx.navigateTo({ url: '/pages/mine/mine' })
  },

  goGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' })
  },

  onShareAppMessage() {
    return {
      title: '36 个问题，一次慢下来的对话',
      path: '/pages/index/index'
    }
  }
})
