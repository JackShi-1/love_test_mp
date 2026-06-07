function callFunction(name, data = {}) {
  if (!wx.cloud) {
    return Promise.reject(new Error('cloud unavailable'))
  }
  return wx.cloud.callFunction({ name, data }).then((res) => res.result)
}

const PROFILE_KEY = 'love36_profile'

function getSavedProfile() {
  return wx.getStorageSync(PROFILE_KEY) || null
}

function saveProfile(profile) {
  const next = {
    nickName: String(profile && profile.nickName ? profile.nickName : '').trim(),
    avatarUrl: profile && profile.avatarUrl ? profile.avatarUrl : '',
    updatedAt: Date.now()
  }
  wx.setStorageSync(PROFILE_KEY, next)
  const app = getApp()
  if (app && app.globalData) {
    app.globalData.profile = next
  }
  return next
}

function requestWechatProfile() {
  if (!wx.getUserProfile) {
    return Promise.reject(new Error('profile unavailable'))
  }
  return new Promise((resolve, reject) => {
    wx.getUserProfile({
      desc: '用于在房间和记录中展示昵称',
      success: (res) => {
        const userInfo = res.userInfo || {}
        resolve(saveProfile({
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl
        }))
      },
      fail: reject
    })
  })
}

function getLocalRecords() {
  return wx.getStorageSync('love36_records') || []
}

function saveLocalRecord(record) {
  const records = getLocalRecords()
  const next = [record].concat(records.filter((item) => item.id !== record.id))
  wx.setStorageSync('love36_records', next)
  return record
}

function getLocalRecord(recordId) {
  return getLocalRecords().find((item) => item.id === recordId)
}

function formatDuration(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}分${String(secs).padStart(2, '0')}秒`
}

function formatClock(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0)
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

module.exports = {
  callFunction,
  getSavedProfile,
  saveProfile,
  requestWechatProfile,
  getLocalRecords,
  saveLocalRecord,
  getLocalRecord,
  formatDuration,
  formatClock
}
