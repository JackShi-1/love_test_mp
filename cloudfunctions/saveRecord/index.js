const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

function cleanText(value, fallback = '') {
  return String(value || fallback).trim().slice(0, 1000)
}

function cleanRecord(input, openid) {
  const now = Date.now()
  const members = Array.isArray(input.members) ? input.members.slice(0, 2) : []
  const answers = Array.isArray(input.answers) ? input.answers.slice(0, 36) : []

  return {
    mode: input.mode || 'same-device',
    participantMode: input.participantMode || 'two',
    versionId: input.versionId || 'goodbye-love',
    versionTitle: cleanText(input.versionTitle, '爱情三十六问').slice(0, 40),
    startedAt: Number(input.startedAt) || now,
    completedAt: Number(input.completedAt) || now,
    durationSeconds: Math.max(1, Number(input.durationSeconds) || 1),
    members: members.map((member, index) => ({
      openid: index === 0 ? openid : '',
      nickName: cleanText(member.nickName, index === 0 ? '我' : '对方').slice(0, 24)
    })),
    memberOpenids: [openid],
    shareEnabled: true,
    uploadedFromLocal: true,
    localRecordId: cleanText(input.id).slice(0, 80),
    answers: answers.map((item, index) => ({
      questionIndex: Number(item.questionIndex) || index + 1,
      question: cleanText(item.question).slice(0, 300),
      answers: (Array.isArray(item.answers) ? item.answers.slice(0, 2) : []).map((answer, answerIndex) => ({
        openid: answerIndex === 0 ? openid : '',
        nickName: cleanText(answer.nickName, answerIndex === 0 ? '我' : '对方').slice(0, 24),
        answer: cleanText(answer.answer).slice(0, 1600)
      }))
    })),
    updatedAt: now
  }
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const record = cleanRecord(event.record || {}, wxContext.OPENID)
  if (!record.localRecordId) throw new Error('missing local record')

  const existing = await db.collection('records')
    .where({
      localRecordId: record.localRecordId,
      memberOpenids: _.all([wxContext.OPENID])
    })
    .limit(1)
    .get()

  if (existing.data && existing.data.length) {
    const recordId = existing.data[0]._id
    await db.collection('records').doc(recordId).update({ data: record })
    return { recordId }
  }

  const result = await db.collection('records').add({ data: record })
  return { recordId: result._id }
}
