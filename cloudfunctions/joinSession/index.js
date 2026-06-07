const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

function cleanNickName(value) {
  return String(value || '').trim().slice(0, 10)
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const sessionId = event.sessionId
  const nickName = cleanNickName(event.nickName)
  if (!sessionId) throw new Error('missing sessionId')

  const sessionRes = await db.collection('sessions').doc(sessionId).get()
  const session = sessionRes.data
  if (!session) throw new Error('房间不存在')

  const members = session.members || []
  const exists = members.some((item) => item.openid === wxContext.OPENID)
  if (!exists && members.length >= 2) {
    throw new Error('房间已满')
  }

  if (!exists) {
    await db.collection('sessions').doc(sessionId).update({
      data: {
        members: _.push({
          openid: wxContext.OPENID,
          nickName: nickName || (members.length === 0 ? '我' : '对方'),
          joinedAt: Date.now()
        }),
        status: 'ready',
        updatedAt: Date.now()
      }
    })
  } else if (event.nickName !== undefined && nickName) {
    await db.collection('sessions').doc(sessionId).update({
      data: {
        members: members.map((item) => (
          item.openid === wxContext.OPENID
            ? { ...item, nickName }
            : item
        )),
        updatedAt: Date.now()
      }
    })
  }

  const latest = await db.collection('sessions').doc(sessionId).get()
  return {
    session: latest.data
  }
}
