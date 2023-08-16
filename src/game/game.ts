import { Context, Markup } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { Card, IGame, IGameCard, IGamePlayer } from "./game.types";
import { User } from "../rooms/rooms";
import { getField } from "../field/field";
import GameCard from "./game-card";
import { app } from "..";


export class Game implements IGame {
    public status: 'off' | 'on' | 'lobby'
    public players: IGamePlayer[]
    public battleField: (IGameCard | null)[][]
    public currentPlayer: IGamePlayer | null
    public areHandsKeeped: boolean
    readonly room: IRoom

    constructor(room: IRoom) {
        this.status = 'off'
        this.room = room
        this.players = []
        this.battleField = [[]]
        this.currentPlayer = null
        this.areHandsKeeped = false
    }

    changeStatus(status: 'off' | 'on' | 'lobby') {
        this.status = status
    }

    startGame(ctx: Context) {
        this.players.forEach(player => player.game = this)
        this.room.informRoom(ctx, 'gen_start', { id: 0, name: '' })
            .then(() => this.determineFirstPlayer(ctx))
        // this.generateHands(ctx)
    }

    private determineFirstPlayer(ctx: Context) {
        const playerDices: any[] = []

        this.players.forEach((player) => {

            function rollTurnDice(): number {
                const roll = rollDice()
                return playerDices.findIndex(player => player.roll === roll) !== -1 ? rollTurnDice() : roll
            }

            const roll = rollTurnDice()

            playerDices.push({ ...player, roll })
        })

        const firstPlayer = playerDices.reduce((prev, curr) => curr.roll > prev.roll ? curr : prev)
        const message = `Броски игроков:\n${playerDices.map(({ name, roll }) => `<b>${name}</b>: ${roll}🎲`).join('\n')}\n\n <b>${firstPlayer.name}</b> выбирает каким ходить!`

        console.log('determine: ', this.players.map(p => p.name))

        this.room.informRoom(ctx, 'gen_def', firstPlayer, message).then(() => {

            const menu = [
                [Markup.button.callback('Ходить первым', 'first-turn'), Markup.button.callback('Ходить вторым', 'second-turn')]
            ]

            ctx.telegram.sendMessage(firstPlayer.id, 'Выберите каким ходить:', { reply_markup: { inline_keyboard: menu } })
        })
    }

    public async finishArranging(ctx: Context) {
        const player = app.findGamePlayerByCtx(ctx) as IGamePlayer

        // const playerField = player.squad.startArrangement.map(arr => {
        //     return arr.map(cell => {
        //         return cell ? cell.name : '⬜️'
        //     }).join('|')
        // }).join('\n')

        ctx.editMessageText(`✅Вы закончили расстановку отряда`)
        delete player.squad.arrangingIndex
        delete player.squad.arrangingArr

        await this.room.informRoom(ctx, 'finish-arranging', new User(player.id, player.name))
        const indicator = this.players.reduce((res, cur) => !res ? res : cur.squad.arrangingIndex == undefined, true)
        if (indicator) {
            this.startBattle(ctx)
        }
    }

    // public generateHands(ctx: Context): void {
    //     const hands: Card[][] = this.players.map(player => app.generateHand(player)) as Card[][]

    //     this.players.forEach(async (player, index) => {
    //         const hand: Card[] = hands[index]

    //         await ctx.telegram.sendMessage(player.id, '🃏Ваша рука сгенерирована!')
    //         new Promise((resolve) => {
    //             hand.forEach(async (card) => {

    //                 const menu = [
    //                     [
    //                         Markup.button.callback('➕', `squad_${card.name}`),
    //                         // Markup.button.callback('❔', `info_${card.name}`)
    //                     ]
    //                 ]

    //                 ctx.telegram.sendPhoto(player.id, card.image, { parse_mode: 'HTML', caption: app.parseCard(card), reply_markup: { inline_keyboard: menu } })
    //                     .then((res) => {
    //                         player.handMessages.push(res.message_id)
    //                     })
    //                     .then(() => {
    //                         if (player.handMessages.length === hand.length) resolve(1)
    //                     })
    //             })
    //         })
    //             .then(() => {

    //                 const menu = [
    //                     [
    //                         Markup.button.callback('🗺Расставить', `arrange-squad`),
    //                         Markup.button.callback('🤚Пересдать', `mulligan`)
    //                     ]
    //                 ]

    //                 ctx.telegram.sendMessage(player.id, '🃏Завершить набор/пересдать: ', { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } }).then(m => {
    //                     player.handMessages.push(m.message_id)
    //                 })
    //             })
    //     })
    // }

    private async startBattle(ctx: Context) {
        await this.room.informRoom(ctx, 'gen_start-battle', new User(Number(ctx.from?.id), String(ctx.from?.first_name)))

        console.log(this.players.map(p => p.name))

        this.battleField = this.players[0].squad.startArrangement
            .reverse()
            .map(arr => arr.reverse())
            .concat(this.players[1].squad.startArrangement)
            .map((arr, index) => arr.map((card: Card | null) => {
                return card ? new GameCard(card, index < 3 ? this.players[0] : this.players[1], index === 5) : card
            }))
            .map((row, rowIndex) => {
                return row.map(card => {

                    if (card && card.stats.walkCount.trim().toLowerCase() === 'полет' && !card.isHidden) {
                        const player = rowIndex < 3 ? this.players[0] : this.players[1]
                        player.fliers.push(card)

                        return null
                    }

                    return card
                })
            })

        const fieldStream = await getField(this.battleField, this.players)

        this.currentPlayer = this.players[0]

        this.room.players.concat(this.room.watchers).forEach(user => {

            if (user.id === this.players[0].id) {
                ctx.telegram.sendPhoto(user.id, { source: fieldStream }, { caption: `Поле игры:\n\nПервым ходит ${this.currentPlayer?.name}`, reply_markup: { inline_keyboard: [[Markup.button.callback('Передать ход🔜', 'pass-turn')]] } })
            } else {
                ctx.telegram.sendPhoto(user.id, { source: fieldStream }, { caption: `Поле игры:\n\nПервым ходит ${this.currentPlayer?.name}` })
            }
        })

        this.startTurn()
    }

    private startTurn() {
        const { players } = this

        this.currentPlayer = this.currentPlayer === players[0] ? players[1] : players[0]
    }

    public endTurn() {

        this.startTurn()
    }
}

function rollDice(): number {
    return Math.ceil(Math.random() * 6)
}