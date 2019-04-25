const newHandler = require('./new')
const joinHandler = require('./join')
const loadHandler = require('./load')
const leaveHandler = require('./leave')
const movesHandler = require('./moves')
const startHandler = require('./start')
const actionsHandler = require('./actions')
const messageHandler = require('./message')
const optionsHandler = require('./options')
const inlineJoinHandler = require('./inlineJoin')
const inlineMoveHandler = require('./inlineMove')
const inlineQueryHandler = require('./inlineQuery')

module.exports = {
  newHandler,
  joinHandler,
  loadHandler,
  leaveHandler,
  movesHandler,
  startHandler,
  actionsHandler,
  messageHandler,
  optionsHandler,
  inlineJoinHandler,
  inlineMoveHandler,
  inlineQueryHandler,
}
