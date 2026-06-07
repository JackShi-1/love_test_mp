const { callFunction, getLocalRecord, saveLocalRecord, formatDuration } = require('../../utils/api')

Page({
  data: {
    recordId: '',
    shareRecordId: '',
    local: false,
    record: null,
    durationText: '',
    preparingShare: false,
    shareReady: false
  },

  onLoad(options) {
    this.setData({
      recordId: options.recordId || '',
      local: options.local === '1'
    })
    this.loadRecord()
  },

  loadRecord() {
    if (this.data.local) {
      const record = getLocalRecord(this.data.recordId)
      this.setData({
        record,
        durationText: record ? formatDuration(record.durationSeconds) : '',
        shareRecordId: record && record.cloudRecordId ? record.cloudRecordId : '',
        shareReady: !!(record && record.cloudRecordId)
      })
      if (record && !record.cloudRecordId) {
        this.ensureShareableRecord(record)
      }
      return
    }

    callFunction('generateRecordImage', {
      recordId: this.data.recordId,
      previewOnly: true
    }).then((res) => {
      const record = res.record
      this.setData({
        record,
        durationText: record ? formatDuration(record.durationSeconds) : '',
        shareRecordId: this.data.recordId,
        shareReady: true
      })
    }).catch(() => {})
  },

  ensureShareableRecord(record) {
    if (!this.data.local || this.data.preparingShare || this.data.shareRecordId) return
    this.setData({ preparingShare: true })
    callFunction('saveRecord', { record })
      .then((res) => {
        const shareRecordId = res.recordId || ''
        if (!shareRecordId) throw new Error('missing cloud record id')
        const nextRecord = { ...record, cloudRecordId: shareRecordId }
        saveLocalRecord(nextRecord)
        this.setData({
          record: nextRecord,
          shareRecordId,
          preparingShare: false,
          shareReady: true
        })
      })
      .catch(() => {
        this.setData({ preparingShare: false, shareReady: false })
      })
  },

  openRecord() {
    wx.navigateTo({
      url: `/pages/record-detail/record-detail?recordId=${this.data.recordId}${this.data.local ? '&local=1' : ''}`
    })
  },

  backHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  onShareAppMessage() {
    if (this.data.local && !this.data.shareRecordId) {
      wx.showToast({ title: '分享还在准备中', icon: 'none' })
    }
    const recordId = this.data.shareRecordId || this.data.recordId
    return {
      title: '我们完成了一次 36 问对话',
      path: `/pages/record-detail/record-detail?recordId=${recordId}`
    }
  }
})
