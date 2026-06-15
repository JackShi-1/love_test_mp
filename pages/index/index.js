const { questionSets } = require('../../data/questionSets')

const homeQuestionSets = questionSets
  .map((item) => ({
    ...item,
    bg: item.id === 'aron' ? '/assets/card-bg-aron.jpg' : '/assets/card-bg-goodbye.jpg'
  }))
  .sort((a, b) => (a.id === 'aron' ? -1 : 1) - (b.id === 'aron' ? -1 : 1))

Page({
  data: {
    questionSets: homeQuestionSets
  },

  chooseVersion(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/mode/mode?versionId=${id}`
    })
  },

  goPartyGames() {
    wx.navigateTo({ url: '/pages/party-games/party-games' })
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
