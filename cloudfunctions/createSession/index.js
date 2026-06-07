const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const roomAdjectives = ['春日', '月光', '薄荷', '纸船', '晚风', '橘子', '蓝格子', '暖灯', '花信', '云朵']
const roomNouns = ['慢聊屋', '小书桌', '回声房', '纸条站', '对话角', '同学录', '小客厅', '问答间', '留白页', '秘密格']

const versionTitles = {
  'goodbye-love': '再见爱人版',
  aron: '亚瑟·阿伦原版'
}

function createRoomName(openid, now) {
  const seed = String(openid || '').split('').reduce((sum, char) => sum + char.charCodeAt(0), 0) + now
  return `${roomAdjectives[seed % roomAdjectives.length]}${roomNouns[seed % roomNouns.length]}`
}

function cleanNickName(value) {
  return String(value || '').trim().slice(0, 10)
}

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const versionId = event.versionId || 'goodbye-love'
  const mode = event.mode || 'invite'
  const nickName = cleanNickName(event.nickName) || '我'
  const now = Date.now()

  const existing = await db.collection('sessions')
    .where({
      ownerOpenid: wxContext.OPENID,
      versionId,
      mode
    })
    .limit(20)
    .get()

  const unfinished = (existing.data || [])
    .filter((item) => item.status !== 'completed' && item.status !== 'cancelled')
    .sort((a, b) => (b.updatedAt || b.createdAt || 0) - (a.updatedAt || a.createdAt || 0))[0]

  if (unfinished) {
    if (event.nickName !== undefined) {
      const members = unfinished.members || []
      const nextMembers = members.map((item) => (
        item.openid === wxContext.OPENID
          ? { ...item, nickName }
          : item
      ))
      await db.collection('sessions').doc(unfinished._id).update({
        data: {
          members: nextMembers,
          updatedAt: now
        }
      })
    }
    return {
      sessionId: unfinished._id,
      reused: true,
      roomName: unfinished.roomName || ''
    }
  }

  const result = await db.collection('sessions').add({
    data: {
      versionId,
      versionTitle: versionTitles[versionId] || '爱情三十六问',
      mode,
      roomName: createRoomName(wxContext.OPENID, now),
      status: 'waiting',
      currentIndex: 1,
      members: [
        {
          openid: wxContext.OPENID,
          nickName,
          joinedAt: now
        }
      ],
      ownerOpenid: wxContext.OPENID,
      createdAt: now,
      updatedAt: now
    }
  })

  return {
    sessionId: result._id,
    reused: false
  }
}
