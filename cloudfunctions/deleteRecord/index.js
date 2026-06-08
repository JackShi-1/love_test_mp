const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()
  const recordId = event.recordId
  if (!recordId) throw new Error('missing recordId')

  const recordRes = await db.collection('records').doc(recordId).get()
  const record = recordRes.data
  if (!record) {
    return { deleted: true }
  }

  if (!(record.memberOpenids || []).includes(wxContext.OPENID)) {
    throw new Error('无权删除该记录')
  }

  const memberOpenids = record.memberOpenids || []
  if (memberOpenids.length <= 1) {
    await db.collection('records').doc(recordId).remove()
  } else {
    await db.collection('records').doc(recordId).update({
      data: {
        memberOpenids: _.pull(wxContext.OPENID),
        updatedAt: Date.now()
      }
    })
  }

  return { deleted: true }
}
