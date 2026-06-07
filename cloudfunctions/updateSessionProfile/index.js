const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength)
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const sessionId = event.sessionId
  if (!sessionId) throw new Error('missing sessionId')

  const sessionRes = await db.collection('sessions').doc(sessionId).get()
  const session = sessionRes.data
  if (!session) throw new Error('房间不存在')
  const members = session.members || []
  const currentMemberIndex = members.findIndex((item) => item.openid === wxContext.OPENID)
  if (currentMemberIndex < 0) throw new Error('你还没有加入房间')

  const updates = {
    updatedAt: Date.now()
  }

  const roomName = cleanText(event.roomName, 12)
  if (event.roomName !== undefined) {
    if (!roomName) throw new Error('房间名不能为空')
    updates.roomName = roomName
  }

  const nickName = cleanText(event.nickName, 10)
  if (event.nickName !== undefined) {
    if (!nickName) throw new Error('昵称不能为空')
    updates.members = members.map((item, memberIndex) => (
      memberIndex === currentMemberIndex
        ? { ...item, nickName }
        : item
    ))
  }

  await db.collection('sessions').doc(sessionId).update({ data: updates })
  const latest = await db.collection('sessions').doc(sessionId).get()

  return {
    session: latest.data
  }
}
