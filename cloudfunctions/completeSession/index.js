const cloud = require('wx-server-sdk')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

const db = cloud.database()

const questions = {
  'goodbye-love': [
    '如果你可以选择世界上任何一个人，你想让谁做你晚餐的客人呢？',
    '你想出名吗？以哪种方式？',
    '在打电话之前，你有没有排练过你想要说的话？为什么？',
    '你心中完美的一天具体是什么样子的？',
    '你最后一次独自唱歌是什么时候？最后一次和别人一起唱歌是什么时候？',
    '如果你可以活到 90 岁，但是身体状况保持在 30 岁的状态，那这 60 年你想要怎么过？',
    '你有想过你会怎么死吗？',
    '举出你和我的三个共同之处。',
    '你人生中最感激的一件事是什么？',
    '如果你能改变你成长的方式，你会去改变什么？',
    '用四分钟，尽可能详尽地告诉我你一生的故事。',
    '如果你明天一觉醒来，拥有了某种新的品质或者能力，那会是什么呢？',
    '如果水晶球能告诉你关于你自己、你的人生、未来或者任何其他事情的真相，你想知道什么？',
    '有没有某样东西 / 某件事让你魂牵梦绕很久却没有实现的呢？为什么还没做呢？',
    '你一生最大的成就是什么？',
    '友谊中你最珍惜的是什么？',
    '你最珍贵的记忆是什么？',
    '你最糟糕的记忆是什么？',
    '如果你知道一年后你会突然死去，你会改变现在的生活方式吗？为什么？',
    '友谊对你意味着什么？',
    '爱情和感情在你的人生中起了什么作用？',
    '分享你认为我身上的 5 个优点。',
    '你的家庭多亲密？你觉得自己的童年比大多数人都快乐吗？',
    '你觉得你和母亲的关系怎么样？',
    '分别造三句“我们”的句子。例如，“我们同时在这个房间，感觉……”',
    '完成这句句子：“我希望我有一个能和他分享……的人。”',
    '如果你想和我成为亲密的朋友，请分享你认为很重要并一定要我知晓的事情。',
    '告诉我你喜欢我的什么，一定要中肯诚实，不要说那些和第一次见面的陌生人就能说的泛泛之谈。',
    '分享给我你一生中一个尴尬的瞬间。',
    '你最近一次在别人面前哭是什么时候？被谁弄哭的？还是自己哭的？',
    '告诉我你已经喜欢我的一点。',
    '什么样的玩笑不能开？（如果有的话）',
    '如果今晚你要死了，却没有机会和任何人交流，你最后悔没有告诉某人什么事？你为什么到现在为止没有说呢？',
    '如果你的家（包括你的所有财产）着火了。在救了爱的人和宠物外，你还有时间安全地再冲进去捡回一个东西。会是什么呢？为什么？',
    '家中所有的人中，谁的死会让你最不安？为什么？',
    '我会和你讲一个很私人化的问题，请你换位思考告诉我如果是你，你会如何处理。你觉得我在面对这个问题的时候是什么感觉呢？'
  ],
  aron: [
    '假如可以选择世界上任何人，你希望邀请谁共进晚餐？',
    '你想出名吗？你希望以什么样的方式成名？',
    '打电话前，你会预演你即将要说的话吗？为什么？',
    '对你来说，“完美”的一天是什么样的？',
    '上一次一个人唱歌是什么时候？和别人一起是什么时候？',
    '如果你能够活到 90 岁，并能在你生命的最后 60 年保留一个 30 岁的人所拥有的精神或身体，你会选择哪个？',
    '你内心能预感自己何时会离世吗？',
    '说出 3 个你和对方在外表上的共同特征。',
    '生命中什么事情让你感激不尽？',
    '如果你可以改变自己的成长轨迹，你希望改成什么样子？',
    '用 4 分钟尽可能详细地告诉对方你的生活故事。',
    '如果明天醒来你可以获得一个品质或一种能力，你希望是什么？',
    '如果有颗水晶球能向你揭示关于你自己、你的生活、你的未来，或是其他任何事情的真相，你想知道些什么？',
    '你有没有一直梦想要做的事情？为什么没有做呢？',
    '你人生中最大的成就是什么？',
    '一段友谊中，你最重视的是什么？',
    '你最珍贵的记忆是什么？',
    '你最可怕的记忆是什么？',
    '如果你知道一年后你会突然离世，你会改变现在的生活方式吗？为什么？',
    '朋友对你来说意味着什么？',
    '恋爱和感情在你的生活中扮演着什么样的角色？',
    '逐个列出对方好的一面，共列举 5 个。',
    '你的家庭成员彼此亲密吗？氛围温馨吗？你觉得你的童年比大部分人都开心吗？',
    '你和母亲的关系如何？',
    '用“我们”组 3 个基于现有场景的句子，比如，“我们在这个房间都感觉……”',
    '把这个句子补充完整：“我希望有个人能跟我分享……”',
    '如果你想和对方成为亲密的朋友，请列举出对他 / 她来说最重要的事情。',
    '告诉对方你喜欢他 / 她的地方，这一次你要非常诚恳，说一些你平常不会跟刚认识的人说的话。',
    '和对方分享人生中最尴尬的时刻。',
    '上一次你在他人面前哭是什么时候？是莫名地哭吗？',
    '告诉对方你已经喜欢他 / 她很久了。',
    '有没有什么事情是你认为非常严肃，不能开玩笑的？',
    '假如你今晚会离世，并且没有机会跟任何人交流，你最后悔没有对谁吐露心声？为什么到现在还没有对这个人说出想说的话？',
    '你的房子着火了，所有的财产都在里面。救出了亲人和宠物之后，如果你还有时间最后努力一次，并且安全地挽救任何一件物品，你会选择什么？为什么？',
    '如果有家庭成员去世，你认为谁的离开最让你恐慌？为什么？',
    '说一个个人问题并询问对方的处理意见，让对方向你反馈，你对这个问题所表现出的态度。'
  ]
}

exports.main = async (event) => {
  const sessionId = event.sessionId
  if (!sessionId) throw new Error('missing sessionId')

  const sessionRes = await db.collection('sessions').doc(sessionId).get()
  const session = sessionRes.data
  if (!session) throw new Error('房间不存在')

  const answersRes = await db.collection('answers').where({ sessionId }).get()
  const answers = answersRes.data || []
  const now = Date.now()
  const record = {
    mode: session.mode,
    sessionId,
    versionId: session.versionId,
    versionTitle: session.versionTitle,
    startedAt: session.createdAt,
    completedAt: now,
    durationSeconds: Math.max(1, Math.floor((now - session.createdAt) / 1000)),
    members: session.members || [],
    memberOpenids: (session.members || []).map((item) => item.openid),
    shareEnabled: true,
    answers: (questions[session.versionId] || questions['goodbye-love']).map((question, index) => {
      const questionIndex = index + 1
      return {
        questionIndex,
        question,
        answers: (session.members || []).map((member) => {
          const item = answers.find((answer) => answer.questionIndex === questionIndex && answer.openid === member.openid)
          return {
            openid: member.openid,
            nickName: member.nickName,
            answer: item ? item.answer : ''
          }
        })
      }
    })
  }

  const existing = await db.collection('records').where({ sessionId }).limit(1).get()
  let recordId
  if (existing.data.length) {
    recordId = existing.data[0]._id
    await db.collection('records').doc(recordId).update({ data: record })
  } else {
    const result = await db.collection('records').add({ data: record })
    recordId = result._id
  }

  await db.collection('sessions').doc(sessionId).update({
    data: {
      status: 'completed',
      recordId,
      updatedAt: now
    }
  })

  return { recordId }
}
