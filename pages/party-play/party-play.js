const { getPartyGame } = require('../../data/partyGames')

function randomIndex(length, currentIndex = -1) {
  if (length <= 1) return 0
  let next = Math.floor(Math.random() * length)
  while (next === currentIndex) {
    next = Math.floor(Math.random() * length)
  }
  return next
}

Page({
  data: {
    gameId: '',
    game: null,
    deck: [],
    question: null,
    questionIndex: 0,
    cardMotion: ''
  },

  onLoad(options) {
    const game = getPartyGame(options.gameId)
    const deck = this.buildDeck(game)
    this.setData({
      gameId: game.id,
      game,
      deck
    }, () => this.drawQuestion('in'))
  },

  buildDeck(game) {
    if (!game || !game.packs || !game.packs.length) return []
    if (game.id !== 'wnrs') {
      return (game.packs[0].questions || []).map((question) => ({
        ...question,
        badge: question.category || ''
      }))
    }

    const basePack = game.packs.find((pack) => pack.id === 'base') || game.packs[0]
    const extensionQuestions = game.packs
      .filter((pack) => !['base', 'perception', 'connection', 'reflection', 'wildcards'].includes(pack.id))
      .flatMap((pack) => (pack.questions || []).map((question) => ({
        ...question,
        badge: pack.label
      })))

    return (basePack.questions || []).map((question) => ({
      ...question,
      badge: question.category || ''
    })).concat(extensionQuestions)
  },

  drawQuestion(motion = 'next') {
    const questions = this.data.deck || []
    const questionIndex = randomIndex(questions.length, this.data.questionIndex)
    this.setData({
      questionIndex,
      question: questions[questionIndex] || null,
      cardMotion: ''
    }, () => {
      setTimeout(() => {
        this.setData({ cardMotion: motion })
      }, 20)
    })
  },

  nextQuestion() {
    this.drawQuestion('next')
  }
})
