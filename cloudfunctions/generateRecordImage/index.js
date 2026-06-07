const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()
const _ = db.command

exports.main = async (event) => {
  const wxContext = cloud.getWXContext()

  if (event.listOnly) {
    const records = await db.collection('records')
      .where({ memberOpenids: _.all([wxContext.OPENID]) })
      .orderBy('completedAt', 'desc')
      .limit(50)
      .get()
    return {
      records: records.data || []
    }
  }

  const recordId = event.recordId
  if (!recordId) throw new Error('missing recordId')

  const recordRes = await db.collection('records').doc(recordId).get()
  const record = recordRes.data
  if (!record) throw new Error('记录不存在')

  if (!record.shareEnabled && !(record.memberOpenids || []).includes(wxContext.OPENID)) {
    throw new Error('无权查看该记录')
  }

  if (!event.previewOnly) {
    await db.collection('records').doc(recordId).update({
      data: {
        imageGeneratedAt: Date.now(),
        imageGenerationNotes: _.push(event.tempNote || 'client-canvas')
      }
    })
  }

  return { record }
}
