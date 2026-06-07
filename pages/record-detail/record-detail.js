const { callFunction, getLocalRecord, saveLocalRecord, formatDuration } = require('../../utils/api')

Page({
  data: {
    recordId: '',
    local: false,
    record: null,
    recordAnswers: [],
    durationText: '',
    answerCount: 0,
    memberCount: 0,
    shareRecordId: '',
    preparingShare: false,
    shareReady: false,
    imagePath: '',
    canvasHeight: 1200,
    generating: false
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
      this.setRecord(record)
      return
    }

    callFunction('generateRecordImage', {
      recordId: this.data.recordId,
      previewOnly: true
    })
      .then((res) => this.setRecord(res.record))
      .catch(() => wx.showToast({ title: '记录加载失败', icon: 'none' }))
  },

  setRecord(record) {
    if (!record) return
    const answers = record.answers || []
    const members = record.members || []
    this.setData({
      record,
      recordAnswers: answers,
      durationText: formatDuration(record.durationSeconds),
      answerCount: answers.length,
      memberCount: members.length,
      shareRecordId: this.data.local ? record.cloudRecordId || '' : this.data.recordId,
      shareReady: !this.data.local || !!record.cloudRecordId
    })
    if (this.data.local && !record.cloudRecordId) {
      this.ensureShareableRecord()
    }
  },

  ensureShareableRecord() {
    if (!this.data.local || !this.data.record || this.data.preparingShare || this.data.shareRecordId) {
      return Promise.resolve(this.data.shareRecordId)
    }
    this.setData({ preparingShare: true })
    return callFunction('saveRecord', { record: this.data.record })
      .then((res) => {
        const shareRecordId = res.recordId || ''
        if (!shareRecordId) throw new Error('missing cloud record id')
        const record = { ...this.data.record, cloudRecordId: shareRecordId }
        saveLocalRecord(record)
        this.setData({
          record,
          shareRecordId,
          shareReady: true,
          preparingShare: false
        })
        return shareRecordId
      })
      .catch(() => {
        this.setData({ preparingShare: false, shareReady: false })
        wx.showToast({ title: '分享准备失败，请稍后重试', icon: 'none' })
        return ''
      })
  },

  prepareShareResult() {
    if (this.data.local && !this.data.shareRecordId) {
      this.ensureShareableRecord()
    }
  },

  generateImage() {
    if (!this.data.record || this.data.generating) return
    this.setData({ generating: true, imagePath: '' })
    this.setData({ canvasHeight: this.estimateCanvasHeight(this.data.record) })
    setTimeout(() => this.drawRecordImage(), 120)
  },

  drawRecordImage() {
    const record = this.data.record
    const ctx = wx.createCanvasContext('recordCanvas', this)
    const width = 750
    let y = 0

    ctx.setFillStyle('#FFFDF8')
    ctx.fillRect(0, 0, width, this.data.canvasHeight)
    ctx.setFillStyle('#F7E4D9')
    this.roundRect(ctx, 36, 36, 678, 270, 28)
    ctx.fill()
    ctx.setFillStyle('#9A6A4E')
    ctx.setFontSize(24)
    ctx.fillText('LOVE 36 QUESTIONS', 72, 92)
    ctx.setFillStyle('#263640')
    ctx.setFontSize(48)
    ctx.fillText('爱情三十六问', 72, 154)
    ctx.setFillStyle('#5F6D72')
    ctx.setFontSize(28)
    ctx.fillText(record.versionTitle || '对话记录', 72, 210)
    ctx.fillText(`完成时长 ${this.data.durationText}`, 72, 250)

    y = 350
    ctx.setFillStyle('#EDF3F0')
    this.roundRect(ctx, 36, y, 420, 58, 29)
    ctx.fill()
    ctx.setFillStyle('#365C73')
    ctx.setFontSize(26)
    ctx.fillText(`${(record.answers || []).length || 36}题 · ${(record.members || []).length || 1}人 · 完整问答`, 64, y + 38)

    y += 112
    ctx.setFillStyle('#263640')
    ctx.setFontSize(32)
    ctx.fillText('完整问答', 42, y)
    y += 34

    ;(record.answers || []).forEach((item) => {
      const cardTop = y + 24
      const cardHeight = this.answerCardHeight(item)
      ctx.setFillStyle('#FFFFFF')
      this.roundRect(ctx, 36, cardTop, 678, cardHeight, 22)
      ctx.fill()
      ctx.setFillStyle('#C97852')
      ctx.setFontSize(24)
      ctx.fillText(`Q${item.questionIndex}`, 64, cardTop + 38)
      ctx.setFillStyle('#263640')
      ctx.setFontSize(28)
      let innerY = this.wrapText(ctx, item.question, 64, cardTop + 76, 622, 38)

      ;(item.answers || []).forEach((answer, answerIndex) => {
        innerY += 18
        ctx.setFillStyle(answerIndex === 0 ? '#EDF3F0' : '#F7E4D9')
        ctx.beginPath()
        ctx.arc(84, innerY + 14, 22, 0, Math.PI * 2)
        ctx.fill()
        ctx.setFillStyle(answerIndex === 0 ? '#365C73' : '#9A5A39')
        ctx.setFontSize(22)
        ctx.fillText(answerIndex === 0 ? '♡' : '✦', 76, innerY + 22)
        ctx.setFillStyle('#4F5D62')
        ctx.setFontSize(25)
        innerY = this.wrapText(ctx, answer.answer || '未记录', 126, innerY + 8, 560, 34)
      })

      y = cardTop + cardHeight
    })

    ctx.setFillStyle('#78858F')
    ctx.setFontSize(24)
    ctx.fillText('这是一份对话记录，不代表心理诊断或咨询意见。', 42, y + 58)
    ctx.draw(false, () => {
      wx.canvasToTempFilePath({
        canvasId: 'recordCanvas',
        width,
        height: Math.min(this.data.canvasHeight, y + 120),
        destWidth: width,
        destHeight: Math.min(this.data.canvasHeight, y + 120),
        success: (res) => {
          this.setData({ imagePath: res.tempFilePath, generating: false })
          wx.previewImage({ urls: [res.tempFilePath] })
          const cloudRecordId = this.data.local ? this.data.shareRecordId : this.data.recordId
          if (cloudRecordId) {
            callFunction('generateRecordImage', {
              recordId: cloudRecordId,
              tempNote: 'full-client-canvas'
            }).catch(() => {})
          }
        },
        fail: () => {
          this.setData({ generating: false })
          wx.showToast({ title: '长图生成失败', icon: 'none' })
        }
      }, this)
    })
  },

  estimateCanvasHeight(record) {
    const answers = record && record.answers ? record.answers : []
    const contentHeight = answers.reduce((total, item) => total + this.answerCardHeight(item) + 24, 0)
    return Math.max(1400, 620 + contentHeight)
  },

  answerCardHeight(item) {
    let height = 104 + this.textLineCount(item.question, 22) * 38
    ;(item.answers || []).forEach((answer) => {
      height += 54 + this.textLineCount(answer.answer || '未记录', 24) * 34
    })
    return Math.max(190, height + 24)
  },

  textLineCount(text, charsPerLine) {
    return Math.max(1, Math.ceil(String(text || '').length / charsPerLine))
  },

  wrapText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 99) {
    const chars = String(text || '').split('')
    let line = ''
    let lines = 0
    for (let i = 0; i < chars.length; i += 1) {
      const char = chars[i]
      const testLine = line + char
      if (ctx.measureText(testLine).width > maxWidth && line) {
        const isLastLine = lines + 1 >= maxLines
        ctx.fillText(isLastLine && i < chars.length ? `${line}…` : line, x, y)
        if (isLastLine) {
          return y + lineHeight
        }
        line = char
        y += lineHeight
        lines += 1
      } else {
        line = testLine
      }
    }
    if (line) {
      ctx.fillText(line, x, y)
      y += lineHeight
    }
    return y
  },

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + width - radius, y)
    ctx.arcTo(x + width, y, x + width, y + radius, radius)
    ctx.lineTo(x + width, y + height - radius)
    ctx.arcTo(x + width, y + height, x + width - radius, y + height, radius)
    ctx.lineTo(x + radius, y + height)
    ctx.arcTo(x, y + height, x, y + height - radius, radius)
    ctx.lineTo(x, y + radius)
    ctx.arcTo(x, y, x + radius, y, radius)
    ctx.closePath()
  },

  previewImage() {
    if (!this.data.imagePath) return
    wx.previewImage({ urls: [this.data.imagePath] })
  },

  onShareAppMessage() {
    if (this.data.local && !this.data.shareRecordId) {
      wx.showToast({ title: '分享还在准备中', icon: 'none' })
    }
    const recordId = this.data.shareRecordId || this.data.recordId
    return {
      title: '我们完成了一次认真对话',
      path: `/pages/record-detail/record-detail?recordId=${recordId}&shared=1`
    }
  }
})
