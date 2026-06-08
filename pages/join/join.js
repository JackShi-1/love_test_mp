const { callFunction, getSavedProfile, saveProfile } = require('../../utils/api')

const ROOM_ADJECTIVES = ['春日', '月光', '薄荷', '纸船', '晚风', '橘子', '蓝格子', '暖灯', '花信', '云朵']
const ROOM_NOUNS = ['慢聊屋', '小书桌', '回声房', '纸条站', '对话角', '同学录', '小客厅', '问答间', '留白页', '秘密格']

function hashText(text) {
  return String(text || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0)
}

function getRoomName(session) {
  if (session && session.roomName) return session.roomName
  const seed = hashText((session && session._id) || '')
  return `${ROOM_ADJECTIVES[seed % ROOM_ADJECTIVES.length]}${ROOM_NOUNS[seed % ROOM_NOUNS.length]}`
}

function getJoinErrorState(error) {
  const message = String((error && error.message) || error || '')
  if (message.includes('房间已满')) {
    return {
      errorType: 'full',
      errorTitle: '房间已满',
      errorDesc: '这个双人房间已经有两位参与者了，可以请邀请人重新创建一个房间。'
    }
  }
  if (message.includes('房间不存在') || message.includes('not found')) {
    return {
      errorType: 'missing',
      errorTitle: '房间不存在',
      errorDesc: '这个邀请可能已经失效，或者房间信息有误。'
    }
  }
  return {
    errorType: 'unknown',
    errorTitle: '暂时无法进入',
    errorDesc: '房间同步失败，请稍后再试，或请邀请人重新发起邀请。'
  }
}

Page({
  data: {
    sessionId: '',
    roomName: '',
    myOpenid: '',
    role: 'guest',
    reused: false,
    loading: true,
    joining: false,
    state: null,
    error: '',
    errorType: '',
    errorTitle: '',
    errorDesc: '',
    editingType: '',
    editingTitle: '',
    editingValue: '',
    editDialogVisible: false,
    savingEdit: false
  },

  onLoad(options) {
    this.ensureMyOpenid()
    this.setData({
      sessionId: options.sessionId || '',
      roomName: getRoomName({ _id: options.sessionId || '' }),
      role: options.role || 'guest',
      reused: options.reused === '1'
    })
    if (!options.sessionId) {
      this.setData({
        loading: false,
        error: 'missing sessionId',
        ...getJoinErrorState('房间不存在')
      })
      return
    }
    if (this.data.role === 'guest') {
      this.joinRoom()
    } else {
      this.refreshState()
      this.startPolling()
    }
  },

  ensureMyOpenid() {
    const app = getApp()
    if (app.globalData.openid) {
      this.setData({ myOpenid: app.globalData.openid })
      return
    }
    if (app.ensureLogin) {
      app.ensureLogin().then((openid) => {
        this.setData({ myOpenid: openid })
      }).catch(() => {})
    }
  },

  onUnload() {
    this.stopPolling()
  },

  startPolling() {
    this.stopPolling()
    this.timer = setInterval(() => this.refreshState(), 2500)
  },

  stopPolling() {
    if (this.timer) {
      clearInterval(this.timer)
      this.timer = null
    }
  },

  joinRoom() {
    this.setData({ joining: true, loading: true })
    const profile = getSavedProfile()
    callFunction('joinSession', {
      sessionId: this.data.sessionId,
      nickName: profile && profile.nickName ? profile.nickName : ''
    })
      .then((res) => {
        if (!res || !res.session) {
          throw new Error('join failed')
        }
        this.setData({
          state: res.session,
          roomName: getRoomName(res.session),
          error: '',
          errorType: '',
          errorTitle: '',
          errorDesc: ''
        })
        this.startPolling()
      })
      .catch((error) => {
        this.setData({
          error: error.message || 'join failed',
          ...getJoinErrorState(error)
        })
      })
      .finally(() => {
        this.setData({ joining: false, loading: false })
      })
  },

  backHome() {
    wx.reLaunch({ url: '/pages/index/index' })
  },

  refreshState() {
    callFunction('getSessionState', { sessionId: this.data.sessionId })
      .then((res) => {
        if (res && res.session) {
          this.setData({
            state: res.session,
            roomName: getRoomName(res.session),
            loading: false,
            error: ''
          })
        }
      })
      .catch(() => {
        this.setData({ loading: false })
      })
  },

  openRoomNameEditor() {
    this.setData({
      editingType: 'room',
      editingTitle: '修改房间名',
      editingValue: this.data.roomName || '',
      editDialogVisible: true
    })
  },

  openNickNameEditor() {
    const member = this.getMyMember()
    this.setData({
      editingType: 'nick',
      editingTitle: '修改我的昵称',
      editingValue: member && member.nickName ? member.nickName : '',
      editDialogVisible: true
    })
  },

  getMyMember() {
    const openid = this.data.myOpenid || getApp().globalData.openid
    const members = this.data.state && this.data.state.members ? this.data.state.members : []
    return members.find((item) => item.openid === openid) || members[0] || null
  },

  onEditInput(event) {
    this.setData({ editingValue: event.detail.value })
  },

  noop() {},

  closeEditDialog() {
    this.setData({
      editDialogVisible: false,
      editingType: '',
      editingTitle: '',
      editingValue: ''
    })
  },

  saveEditDialog() {
    const value = String(this.data.editingValue || '').trim()
    if (!value) {
      wx.showToast({ title: '先写一个名字', icon: 'none' })
      return
    }
    const payload = {
      sessionId: this.data.sessionId
    }
    if (this.data.editingType === 'room') {
      payload.roomName = value
    } else {
      payload.nickName = value
    }
    this.setData({ savingEdit: true })
    callFunction('updateSessionProfile', payload)
      .then((res) => {
        if (res && res.session) {
          this.setData({
            state: res.session,
            roomName: getRoomName(res.session)
          })
        }
        this.closeEditDialog()
      })
      .catch(() => {
        wx.showToast({ title: '保存失败，请稍后再试', icon: 'none' })
      })
      .finally(() => {
        this.setData({ savingEdit: false })
      })
  },

  useWechatNickName() {
    if (!wx.getUserProfile) {
      wx.showToast({ title: '当前版本暂不支持自动获取', icon: 'none' })
      return
    }
    wx.getUserProfile({
      desc: '用于显示在双人房间里',
      success: (res) => {
        const nickName = res.userInfo && res.userInfo.nickName
        if (nickName) {
          saveProfile({
            nickName,
            avatarUrl: res.userInfo.avatarUrl
          })
          this.setData({ editingValue: nickName })
        }
      },
      fail: () => {
        wx.showToast({ title: '可以手动填写昵称', icon: 'none' })
      }
    })
  },

  startFlow(event) {
    const preview = event && event.currentTarget.dataset.preview === '1'
    wx.navigateTo({
      url: `/pages/flow/flow?mode=invite&sessionId=${this.data.sessionId}${preview ? '&preview=1' : ''}`
    })
  },

  onShareAppMessage() {
    return {
      title: '和我一起完成 36 个问题的对话吧',
      path: `/pages/join/join?sessionId=${this.data.sessionId}`
    }
  }
})
