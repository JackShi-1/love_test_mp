const { callFunction, getLocalRecords, formatDuration, getSavedProfile, requestWechatProfile } = require('../../utils/api')

Page({
  data: {
    records: [],
    userNickName: ''
  },

  onShow() {
    this.loadProfile()
    this.loadRecords()
  },

  loadProfile() {
    const profile = getSavedProfile()
    this.setData({
      userNickName: profile && profile.nickName ? profile.nickName : ''
    })
  },

  loginWithWechat() {
    requestWechatProfile()
      .then((profile) => {
        this.setData({ userNickName: profile.nickName || '' })
        wx.showToast({ title: '昵称已保存', icon: 'none' })
      })
      .catch(() => {
        wx.showToast({ title: '可以继续匿名使用', icon: 'none' })
      })
  },

  loadRecords() {
    const localRecords = getLocalRecords()
    callFunction('generateRecordImage', { listOnly: true })
      .then((res) => {
        const cloudRecords = res.records || []
        this.setData({ records: this.normalizeRecords(this.mergeRecords(cloudRecords, localRecords)) })
      })
      .catch(() => {
        this.setData({ records: this.normalizeRecords(localRecords) })
      })
  },

  mergeRecords(cloudRecords, localRecords) {
    const cloudIds = cloudRecords.map((item) => item._id)
    const filteredLocal = localRecords.filter((item) => !item.cloudRecordId || !cloudIds.includes(item.cloudRecordId))
    return cloudRecords.concat(filteredLocal)
  },

  normalizeRecords(records) {
    return records.map((item) => ({
      ...item,
      durationText: formatDuration(item.durationSeconds),
      dateText: item.completedAt ? new Date(item.completedAt).toLocaleDateString() : ''
    }))
  },

  openRecord(event) {
    const { id, local } = event.currentTarget.dataset
    wx.navigateTo({
      url: `/pages/record-detail/record-detail?recordId=${id}${local ? '&local=1' : ''}`
    })
  },

  goGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' })
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  }
})
