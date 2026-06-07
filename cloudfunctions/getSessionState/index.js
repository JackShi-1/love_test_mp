const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const sessionId = event.sessionId
  const questionIndex = Number(event.questionIndex || 1)
  if (!sessionId) throw new Error('missing sessionId')

  const sessionRes = await db.collection('sessions').doc(sessionId).get()
  const session = sessionRes.data
  if (!session) throw new Error('房间不存在')

  const answersRes = await db.collection('answers')
    .where({ sessionId, questionIndex })
    .get()

  const members = session.members || []
  const answers = answersRes.data || []
  const mySubmitted = answers.some((item) => item.openid === wxContext.OPENID)
  const bothSubmitted = members.length === 2 && members.every((member) => (
    answers.some((answer) => answer.openid === member.openid)
  ))

  const visibleAnswers = bothSubmitted ? members.map((member) => {
    const answer = answers.find((item) => item.openid === member.openid) || {}
    return {
      openid: member.openid,
      nickName: member.nickName,
      answer: answer.answer || ''
    }
  }) : []

  return {
    session,
    mySubmitted,
    bothSubmitted,
    visibleAnswers
  }
}
