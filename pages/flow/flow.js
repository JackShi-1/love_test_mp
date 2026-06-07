const { getQuestionSet } = require('../../data/questionSets')
const { callFunction, saveLocalRecord, formatClock, getSavedProfile } = require('../../utils/api')

const GROUP_SECONDS = 10 * 60
const GAZE_SECONDS = 4 * 60

Page({
  data: {
    mode: 'same-device',
    previewMode: false,
    participantMode: 'two',
    myOpenid: '',
    versionId: 'goodbye-love',
    sessionId: '',
    questionSet: null,
    currentQuestion: null,
    currentGroup: 1,
    groupQuestionIndex: 1,
    progressPercent: 2.7,
    stage: 'prepare',
    currentIndex: 1,
    startedAt: 0,
    elapsedSeconds: 0,
    groupSeconds: GROUP_SECONDS,
    gazeSeconds: GAZE_SECONDS,
    timerRunning: false,
    timerText: formatClock(GROUP_SECONDS),
    gazeText: formatClock(GAZE_SECONDS),
    answers: {},
    answerA: '',
    answerB: '',
    selfAnswer: '',
    state: null,
    remoteReady: false,
    bothSubmitted: false,
    mySubmitted: false,
    peerAnswerRead: false,
    peerAnswerDialogVisible: false,
    readQuestions: {},
    visibleAnswers: [],
    submitting: false,
    answerDialogVisible: false,
    answerRole: '',
    answerDialogTitle: '',
    answerDialogPlaceholder: '',
    answerDraft: '',
    questionMotion: false
  },

  onLoad(options) {
    const mode = options.mode || 'same-device'
    const sessionId = options.sessionId || ''
    const versionId = options.versionId || 'goodbye-love'
    const previewMode = options.preview === '1'

    this.setData({
      mode,
      previewMode,
      myOpenid: getApp().globalData.openid || '',
      sessionId,
      versionId,
      questionSet: getQuestionSet(versionId),
      startedAt: Date.now()
    })
    this.ensureMyOpenid()
    this.syncQuestionMeta()

    if (mode === 'invite' && sessionId) {
      this.refreshSession().then(() => this.startPolling())
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
    this.stopTick()
    this.stopPolling()
    if (this.motionTimer) {
      clearTimeout(this.motionTimer)
      this.motionTimer = null
    }
  },

  chooseParticipantMode(event) {
    const value = event.currentTarget.dataset.value
    if (value !== 'one' && value !== 'two') return
    this.setData({ participantMode: value })
    this.saveSameDeviceDraft()
  },

  startDialogue() {
    this.setData({
      stage: 'question',
      groupSeconds: GROUP_SECONDS,
      timerText: formatClock(GROUP_SECONDS)
    }, () => {
      this.loadQuestionAnswers()
      this.startAutoTimer('group')
      this.animateQuestion()
    })
  },

  startPolling() {
    this.stopPolling()
    this.poller = setInterval(() => this.refreshSession(), 2500)
  },

  stopPolling() {
    if (this.poller) {
      clearInterval(this.poller)
      this.poller = null
    }
  },

  refreshSession() {
    if (!this.data.sessionId) return Promise.resolve()
    return callFunction('getSessionState', {
      sessionId: this.data.sessionId,
      questionIndex: this.data.currentIndex
    })
      .then((res) => {
        if (!res || !res.session) return
        const versionId = res.session.versionId || this.data.versionId
        const bothSubmitted = !!res.bothSubmitted
        const peerAnswerRead = bothSubmitted && !!this.data.readQuestions[this.data.currentIndex]
        this.setData({
          state: res.session,
          versionId,
          questionSet: getQuestionSet(versionId),
          remoteReady: res.session.members && res.session.members.length === 2,
          mySubmitted: !!res.mySubmitted,
          bothSubmitted,
          peerAnswerRead,
          visibleAnswers: res.visibleAnswers || []
        })
        this.syncQuestionMeta()
      })
      .catch(() => {})
  },

  toggleTimer() {
    if (this.data.timerRunning) {
      this.stopTick()
      this.setData({ timerRunning: false })
      return
    }

    this.setData({ timerRunning: true })
    this.tick = setInterval(() => {
      const key = this.data.stage === 'gaze' ? 'gazeSeconds' : 'groupSeconds'
      const next = Math.max(0, this.data[key] - 1)
      this.setData({
        [key]: next,
        timerText: formatClock(this.data.stage === 'gaze' ? this.data.groupSeconds : next),
        gazeText: formatClock(this.data.stage === 'gaze' ? next : this.data.gazeSeconds),
        elapsedSeconds: this.data.elapsedSeconds + 1
      })
      if (next === 0) {
        this.stopTick()
        this.setData({ timerRunning: false })
        wx.showToast({ title: '时间到，可按自己的节奏继续', icon: 'none' })
      }
    }, 1000)
  },

  startAutoTimer(type) {
    this.stopTick()
    const key = type === 'gaze' ? 'gazeSeconds' : 'groupSeconds'
    this.setData({ timerRunning: true })
    this.tick = setInterval(() => {
      const next = Math.max(0, this.data[key] - 1)
      const updates = {
        [key]: next,
        timerRunning: next > 0,
        elapsedSeconds: this.data.elapsedSeconds + 1
      }
      if (type === 'gaze') {
        updates.gazeText = formatClock(next)
      } else {
        updates.timerText = formatClock(next)
      }
      this.setData(updates)
      if (next === 0) {
        this.stopTick()
        wx.showToast({
          title: type === 'gaze' ? '对视时间已到' : '本题参考时间已到',
          icon: 'none'
        })
      }
    }, 1000)
  },

  stopTick() {
    if (this.tick) {
      clearInterval(this.tick)
      this.tick = null
    }
  },

  resetTimer() {
    this.stopTick()
    if (this.data.stage === 'gaze') {
      this.setData({
        gazeSeconds: GAZE_SECONDS,
        gazeText: formatClock(GAZE_SECONDS),
        timerRunning: false
      })
    } else {
      this.setData({
        groupSeconds: GROUP_SECONDS,
        timerText: formatClock(GROUP_SECONDS),
        timerRunning: false
      })
    }
  },

  onAnswerA(event) {
    this.setData({ answerA: event.detail.value })
    this.saveSameDeviceDraft()
  },

  onAnswerB(event) {
    this.setData({ answerB: event.detail.value })
    this.saveSameDeviceDraft()
  },

  onSelfAnswer(event) {
    this.setData({ selfAnswer: event.detail.value })
  },

  openAnswerDialog(event) {
    const role = event.currentTarget.dataset.role
    if (this.data.mode === 'invite' && role === 'self' && this.data.mySubmitted) {
      return
    }

    const config = {
      a: {
        title: '记录我的回答',
        value: this.data.answerA,
        placeholder: '写几句关键词也可以，重要的是把对话留下来。'
      },
      b: {
        title: '记录对方的回答',
        value: this.data.answerB,
        placeholder: '记录让你想记住的部分，不需要逐字复述。'
      },
      self: {
        title: '写下我的回答',
        value: this.data.selfAnswer,
        placeholder: '写下你的回答，保存后可再提交本题。'
      }
    }[role]

    if (!config) return
    this.setData({
      answerDialogVisible: true,
      answerRole: role,
      answerDialogTitle: config.title,
      answerDialogPlaceholder: config.placeholder,
      answerDraft: config.value || ''
    })
  },

  closeAnswerDialog() {
    this.setData({
      answerDialogVisible: false,
      answerRole: '',
      answerDraft: ''
    })
  },

  noop() {},

  openPeerAnswerDialog() {
    if (!this.data.bothSubmitted) {
      if (!this.data.mySubmitted) {
        wx.showToast({ title: '先提交本题', icon: 'none' })
      } else {
        wx.showToast({ title: '等对方提交后再阅读', icon: 'none' })
      }
      return
    }
    this.setData({ peerAnswerDialogVisible: true })
  },

  confirmPeerAnswerRead() {
    const readQuestions = {
      ...this.data.readQuestions,
      [this.data.currentIndex]: true
    }
    this.setData({
      readQuestions,
      peerAnswerRead: true,
      peerAnswerDialogVisible: false
    })
  },

  onAnswerDraft(event) {
    this.setData({ answerDraft: event.detail.value })
  },

  saveAnswerDialog() {
    const value = this.data.answerDraft
    const role = this.data.answerRole

    if (role === 'a') {
      this.setData({ answerA: value })
      this.saveSameDeviceDraft({ a: value })
    }

    if (role === 'b') {
      this.setData({ answerB: value })
      this.saveSameDeviceDraft({ b: value })
    }

    if (role === 'self') {
      this.setData({ selfAnswer: value })
    }

    this.closeAnswerDialog()
  },

  saveSameDeviceDraft(patch = {}) {
    if (this.data.mode !== 'same-device') return
    const answers = { ...this.data.answers }
    answers[this.data.currentIndex] = {
      a: patch.a !== undefined ? patch.a : this.data.answerA,
      b: patch.b !== undefined ? patch.b : this.data.answerB
    }
    this.setData({ answers })
  },

  loadQuestionAnswers() {
    this.syncQuestionMeta()
    if (this.data.mode === 'same-device') {
      const answer = this.data.answers[this.data.currentIndex] || {}
      this.setData({
        answerA: answer.a || '',
        answerB: answer.b || ''
      })
    } else {
      this.setData({
        selfAnswer: '',
        mySubmitted: false,
        bothSubmitted: false,
        peerAnswerRead: false,
        peerAnswerDialogVisible: false,
        visibleAnswers: []
      })
      this.refreshSession()
    }
  },

  submitSelfAnswer() {
    if (!this.data.selfAnswer.trim()) {
      wx.showToast({ title: '先写下你的回答', icon: 'none' })
      return
    }
    if (this.data.submitting) return
    this.setData({ submitting: true })
    callFunction('submitAnswer', {
      sessionId: this.data.sessionId,
      questionIndex: this.data.currentIndex,
      answer: this.data.selfAnswer.trim()
    })
      .then(() => this.refreshSession())
      .catch(() => {
        wx.showToast({ title: '提交失败，请稍后再试', icon: 'none' })
      })
      .finally(() => {
        this.setData({ submitting: false })
      })
  },

  previousQuestion() {
    this.saveSameDeviceDraft()
    if (this.data.currentIndex <= 1) {
      this.stopTick()
      this.setData({
        stage: 'prepare',
        groupSeconds: GROUP_SECONDS,
        timerText: formatClock(GROUP_SECONDS),
        timerRunning: false
      })
      return
    }
    this.setData({
      currentIndex: this.data.currentIndex - 1,
      stage: 'question',
      groupSeconds: GROUP_SECONDS,
      timerText: formatClock(GROUP_SECONDS)
    }, () => {
      this.syncQuestionMeta()
      this.loadQuestionAnswers()
      this.startAutoTimer('group')
      this.animateQuestion()
    })
  },

  nextQuestion() {
    if (this.data.mode === 'invite' && !this.data.previewMode) {
      if (!this.data.mySubmitted) {
        wx.showToast({ title: '先提交本题', icon: 'none' })
        return
      }
      if (!this.data.remoteReady) {
        wx.showToast({ title: '等对方加入后再继续', icon: 'none' })
        return
      }
      if (!this.data.bothSubmitted) {
        wx.showToast({ title: '等对方提交后再进入下一题', icon: 'none' })
        return
      }
      if (!this.data.peerAnswerRead) {
        this.openPeerAnswerDialog()
        wx.showToast({ title: '先阅读对方回答', icon: 'none' })
        return
      }
    }
    this.saveSameDeviceDraft()
    const current = this.data.currentIndex
    if (current === 36) {
      this.enterGaze()
      return
    }
    if (current === 12 || current === 24) {
      this.stopTick()
      this.setData({
        stage: 'break',
        timerRunning: false
      })
      return
    }
    this.setData({
      currentIndex: current + 1,
      groupSeconds: GROUP_SECONDS,
      timerText: formatClock(GROUP_SECONDS)
    }, () => {
      this.syncQuestionMeta()
      this.loadQuestionAnswers()
      this.startAutoTimer('group')
      this.animateQuestion()
    })
  },

  continueNextGroup() {
    const nextIndex = this.data.currentIndex + 1
    this.setData({
      currentIndex: nextIndex,
      stage: 'question',
      groupSeconds: GROUP_SECONDS,
      timerText: formatClock(GROUP_SECONDS)
    }, () => {
      this.syncQuestionMeta()
      this.loadQuestionAnswers()
      this.startAutoTimer('group')
      this.animateQuestion()
    })
  },

  enterGaze() {
    this.stopTick()
    this.setData({
      stage: 'gaze',
      timerRunning: false,
      gazeSeconds: GAZE_SECONDS,
      gazeText: formatClock(GAZE_SECONDS)
    }, () => this.startAutoTimer('gaze'))
  },

  finishDialogue() {
    this.stopTick()
    this.stopPolling()
    if (this.data.mode === 'invite') {
      callFunction('completeSession', { sessionId: this.data.sessionId })
        .then((res) => {
          wx.redirectTo({
            url: `/pages/complete/complete?recordId=${res.recordId}&sessionId=${this.data.sessionId}`
          })
        })
        .catch(() => {
          wx.showToast({ title: '完成失败，请重试', icon: 'none' })
        })
      return
    }

    this.saveSameDeviceDraft()
    const now = Date.now()
    const isSolo = this.data.participantMode === 'one'
    const profile = getSavedProfile()
    const myNickName = profile && profile.nickName ? profile.nickName : '我'
    const record = {
      id: `local_${now}`,
      mode: 'same-device',
      participantMode: this.data.participantMode,
      versionId: this.data.versionId,
      versionTitle: this.data.questionSet.title,
      startedAt: this.data.startedAt,
      completedAt: now,
      durationSeconds: Math.max(1, Math.floor((now - this.data.startedAt) / 1000)),
      members: isSolo ? [{ nickName: myNickName }] : [{ nickName: myNickName }, { nickName: '对方' }],
      answers: this.data.questionSet.questions.map((question) => {
        const answer = this.data.answers[question.index] || {}
        return {
          questionIndex: question.index,
          question: question.text,
          answers: isSolo
            ? [{ nickName: myNickName, answer: answer.a || '' }]
            : [
                { nickName: myNickName, answer: answer.a || '' },
                { nickName: '对方', answer: answer.b || '' }
              ]
        }
      })
    }
    saveLocalRecord(record)
    wx.redirectTo({
      url: `/pages/complete/complete?recordId=${record.id}&local=1`
    })
  },

  syncQuestionMeta() {
    const set = this.data.questionSet || getQuestionSet(this.data.versionId)
    const currentQuestion = set.questions[this.data.currentIndex - 1] || set.questions[0]
    this.setData({
      questionSet: set,
      currentQuestion,
      currentGroup: currentQuestion.group,
      groupQuestionIndex: ((this.data.currentIndex - 1) % 12) + 1,
      progressPercent: Math.round((this.data.currentIndex / 36) * 1000) / 10
    })
  },

  animateQuestion() {
    if (this.motionTimer) {
      clearTimeout(this.motionTimer)
    }
    this.setData({ questionMotion: true })
    this.motionTimer = setTimeout(() => {
      this.setData({ questionMotion: false })
      this.motionTimer = null
    }, 260)
  }
})
