const { callFunction, getLocalRecords, deleteLocalRecord, formatDuration, getSavedProfile, saveProfile } = require('../../utils/api')

Page({
  data: {
    records: [],
    recordsLoading: false,
    userNickName: '',
    nickDialogVisible: false,
    nickDraft: ''
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

  openNickDialog() {
    this.setData({
      nickDialogVisible: true,
      nickDraft: this.data.userNickName || ''
    })
  },

  closeNickDialog() {
    this.setData({
      nickDialogVisible: false,
      nickDraft: ''
    })
  },

  noop() {},

  onNickInput(event) {
    this.setData({ nickDraft: event.detail.value })
  },

  saveNickName() {
    const nickName = String(this.data.nickDraft || '').trim()
    if (!nickName) {
      wx.showToast({ title: '先写一个昵称', icon: 'none' })
      return
    }
    const profile = saveProfile({ nickName })
    this.setData({
      userNickName: profile.nickName || '',
      nickDialogVisible: false,
      nickDraft: ''
    })
    wx.showToast({ title: '昵称已保存', icon: 'none' })
  },

  loadRecords() {
    const localRecords = getLocalRecords()
    this.setData({ recordsLoading: true })
    callFunction('generateRecordImage', { listOnly: true })
      .then((res) => {
        const cloudRecords = res.records || []
        this.setData({ records: this.normalizeRecords(this.mergeRecords(cloudRecords, localRecords)) })
      })
      .catch(() => {
        this.setData({ records: this.normalizeRecords(localRecords) })
      })
      .finally(() => {
        this.setData({ recordsLoading: false })
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
      recordKey: item._id || item.id,
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

  confirmDeleteRecord(event) {
    const { id, local, cloudId } = event.currentTarget.dataset
    if (!id && !cloudId) return
    wx.showModal({
      title: '删除这条记录？',
      content: '删除后无法在历史记录里恢复。',
      confirmText: '删除',
      confirmColor: '#C97852',
      success: (res) => {
        if (res.confirm) {
          this.deleteRecord({ id, local, cloudId })
        }
      }
    })
  },

  deleteRecord({ id, local, cloudId }) {
    const isLocal = local === true || local === 'true' || local === 1 || local === '1'
    wx.showLoading({ title: '删除中' })
    const cloudRecordId = cloudId || (!isLocal ? id : '')
    const deleteCloud = cloudRecordId
      ? callFunction('deleteRecord', { recordId: cloudRecordId }).catch(() => {
          throw new Error('cloud delete failed')
        })
      : Promise.resolve()

    deleteCloud
      .then(() => {
        if (isLocal || cloudRecordId) {
          deleteLocalRecord(isLocal ? id : '', cloudRecordId)
        }
        this.loadRecords()
        wx.hideLoading()
        wx.showToast({ title: '已删除', icon: 'none' })
      })
      .catch(() => {
        wx.hideLoading()
        wx.showToast({ title: '删除失败，请稍后再试', icon: 'none' })
      })
  },

  goGuide() {
    wx.navigateTo({ url: '/pages/guide/guide' })
  },

  goAbout() {
    wx.navigateTo({ url: '/pages/about/about' })
  }
})
