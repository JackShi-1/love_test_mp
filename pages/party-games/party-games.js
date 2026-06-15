const { partyGames } = require('../../data/partyGames')

Page({
  data: {
    games: partyGames
  },

  chooseGame(event) {
    const { id } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/party-play/party-play?gameId=${id}`
    })
  }
})
