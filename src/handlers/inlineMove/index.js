const chess = require('chess')

const { board } = require('@/keyboards')
const { debug, unescapeUser } = require('@/helpers')

const isWhiteTurn = (moves) => !(moves.length % 2)
const isWhiteUser = (game, ctx) => game.user_w === ctx.update.callback_query.from.id
const isBlackUser = (game, ctx) => game.user_b === ctx.update.callback_query.from.id

const statusMessage = ({ isCheck, isCheckmate, isRepetition }) => `
${isCheck ? '|CHECK|' : ''}
${isCheckmate ? '|CHECKMATE|' : ''}
${isRepetition ? '|REPETITION|' : ''}`

const topMessage = (moves, player, enemy) => isWhiteTurn(moves)
  ? `White (top): ${player.first_name}
Black (bottom): ${enemy.first_name}
Black's turn`
  : `Black (top): ${player.first_name}
White (bottom): ${enemy.first_name}
White's turn`

module.exports = () => [
  /^([a-h])([1-8])$/,
  async (ctx) => {
    ctx.state[ctx.update.callback_query.inline_message_id] = ctx.state[ctx.update.callback_query.inline_message_id] || {}

    const gameState = await ctx.db('games')
      .where('inline_id', ctx.update.callback_query.inline_message_id)
      .first()

    debug(ctx.update)

    if (![
      Number(gameState.user_w),
      Number(gameState.user_b),
    ].includes(ctx.update.callback_query.from.id)) {
      return ctx.answerCbQuery('This board is full, please start a new one.')
    }

    const movesState = await ctx.db('moves')
      .where('game_id', gameState.id)
      .orderBy('created_at', 'asc')
      .select()

    if ((isWhiteTurn(movesState) && isBlackUser(gameState, ctx)) ||
      (!isWhiteTurn(movesState) && isWhiteUser(gameState, ctx))) {
      return ctx.answerCbQuery('Wait, please. Now is not your turn.')
    }

    const gameClient = chess.create({ PGN: true })

    movesState.forEach(({ move }) => {
      try {
        gameClient.move(move)
      } catch (error) {
        debug(error)
      }
    })

    let moves = []
    let status = gameClient.getStatus()
    const square = status.board.squares
      .find(({ file, rank }) => file === ctx.match[1] && rank === Number(ctx.match[2]))

    if (ctx.state[ctx.update.callback_query.inline_message_id].moving) {
      if (
        !square ||
        !square.piece ||
        (square.piece.side.name === 'black' && isWhiteTurn(movesState)) ||
        (square.piece.side.name === 'white' && !isWhiteTurn(movesState))
      ) {
        return ctx.answerCbQuery('Please, move your pieces!')
      }

      moves = Object.keys(status.notatedMoves)
        .filter((key) => status.notatedMoves[key].src === square)
        .map((key) => ({ ...status.notatedMoves[key], key }))

      await ctx.editMessageReplyMarkup(board(
        status.board.squares.map((sqr) => {
          const move = moves
            .find((({ file, rank }) => ({ dest }) => dest.file === file &&
              dest.rank === rank)(sqr))

          return move ? { ...sqr, destination: move } : sqr
        }),
        isWhiteTurn(movesState)
      ).reply_markup)
        .catch(debug)

      ctx.state[ctx.update.callback_query.inline_message_id].moving = true
      ctx.state[ctx.update.callback_query.inline_message_id].moves = moves
      ctx.state[ctx.update.callback_query.inline_message_id].selected = square
    } else {
      const moving = ctx.state[ctx.update.callback_query.inline_message_id].moves
        .find(({ dest: { file, rank } }) => file === square.file && rank === square.rank)

      if (moving && !movesState.find(({ move }) => move === moving.key)) {
        try {
          gameClient.move(moving.key)
        } catch (error) {
          debug(error)
        }

        status = gameClient.getStatus()

        await ctx.db('moves').insert({ game_id: gameState.id, move: moving.key })
          .catch(debug)

        ctx.state[ctx.update.callback_query.inline_message_id].moves = null
        ctx.state[ctx.update.callback_query.inline_message_id].moving = false
        ctx.state[ctx.update.callback_query.inline_message_id].selected = null
      }

      const enemy = await ctx.db('users')
        .where('id', isWhiteTurn(movesState) ? gameState.user_b : gameState.user_w)
        .first()
        .catch(debug)

      await ctx.editMessageText(
        topMessage(
          movesState,
          ctx.update.callback_query.from,
          unescapeUser(enemy)
        ) + statusMessage(status),
        board(status.board.squares, !isWhiteTurn(movesState))
      )
        .catch(debug)
    }

    return ctx.answerCbQuery()
  },
]
