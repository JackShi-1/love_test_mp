const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const sessionId = event.sessionId
  const questionIndex = Number(event.questionIndex)
  const answer = String(event.answer || '').trim()

  if (!sessionId || !questionIndex || !answer) {
    throw new Error('missing answer data')
  }

  const now = Date.now()
  const existed = await db.collection('answers')
    .where({ sessionId, questionIndex, openid: wxContext.OPENID })
    .limit(1)
    .get()

  if (existed.data.length) {
    await db.collection('answers').doc(existed.data[0]._id).update({
      data: { answer, updatedAt: now }
    })
    return { answerId: existed.data[0]._id }
  }

  const result = await db.collection('answers').add({
    data: {
      sessionId,
      questionIndex,
      openid: wxContext.OPENID,
      nickName: event.nickName || '参与者',
      answer,
      createdAt: now,
      updatedAt: now
    }
  })

  await db.collection('sessions').doc(sessionId).update({
    data: {
      currentIndex: questionIndex,
      updatedAt: now
    }
  })

  return { answerId: result._id }
}
