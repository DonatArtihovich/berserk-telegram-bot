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
    private battleField: (IGameCard | null)[][]
    readonly room: IRoom

    constructor(room: IRoom) {
        this.status = 'off'
        this.room = room
        this.players = []
        this.battleField = [[]]
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

        this.room.informRoom(ctx, 'gen_def', firstPlayer, message).then(() => {

            const menu = [
                [Markup.button.callback('Ходить первым', 'first-turn'), Markup.button.callback('Ходить вторым', 'second-turn')]
            ]

            ctx.telegram.sendMessage(firstPlayer.id, 'Выберите каким ходить:', { reply_markup: { inline_keyboard: menu } })
        })
    }

    public async finishArranging(ctx: Context) {
        const player = app.findGamePlayerByCtx(ctx) as IGamePlayer

        const playerField = player.squad.startArrangement.map(arr => {
            return arr.map(cell => {
                return cell ? cell.name : '⬜️'
            }).join('|')
        }).join('\n')

        ctx.editMessageText(`✅Вы закончили расстановку отряда\nВаша расстановка:\n${playerField}`)
        delete player.squad.arrangingIndex
        delete player.squad.arrangingArr

        await this.room.informRoom(ctx, 'finish-arranging', new User(player.id, player.name))
        const indicator = this.players.reduce((res, cur) => !res ? res : cur.squad.arrangingIndex == undefined, true)
        if (indicator) {
            this.startBattle(ctx)
        }
    }

    public generateHands(ctx: Context): void {
        const hands: Card[][] = this.players.map(player => app.generateHand(player)) as Card[][]

        this.players.forEach(async (player, index) => {
            const hand: Card[] = hands[index]

            await ctx.telegram.sendMessage(player.id, '🃏Ваша рука сгенерирована!')
            new Promise((resolve) => {
                hand.forEach(async (card) => {

                    const menu = [
                        [
                            Markup.button.callback('➕', `squad_${card.name}`),
                            // Markup.button.callback('❔', `info_${card.name}`)
                        ]
                    ]

                    ctx.telegram.sendPhoto(player.id, card.image, { parse_mode: 'HTML', caption: app.parseCard(card), reply_markup: { inline_keyboard: menu } })
                        .then((res) => {
                            player.handMessages.push(res.message_id)
                        })
                        .then(() => {
                            if (player.handMessages.length === hand.length) resolve(1)
                        })
                })
            })
                .then(() => {

                    const menu = [
                        [
                            Markup.button.callback('🗺Расставить', `arrange-squad`),
                            Markup.button.callback('🤚Пересдать', `mulligan`)
                        ]
                    ]

                    ctx.telegram.sendMessage(player.id, '🃏Завершить набор/пересдать: ', { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } }).then(m => {
                        player.handMessages.push(m.message_id)
                    })
                })
        })
    }

    private async startBattle(ctx: Context) {
        await this.room.informRoom(ctx, 'gen_start-battle', new User(Number(ctx.from?.id), String(ctx.from?.first_name)))
        this.battleField = this.players[0].squad.startArrangement
            .reverse()
            .map(arr => arr.reverse())
            .concat(this.players[1].squad.startArrangement)
            .map((arr, index) => arr.map((card: Card | null) => {
                return card ? new GameCard(card, index === 5) : card
            }))

        const fieldStream = await getField(this.battleField)

        this.room.players.concat(this.room.watchers).forEach(user => {
            ctx.telegram.sendDocument(user.id, { source: fieldStream, filename: 'field.png' }, { caption: 'Поле игры:' })
        })
    }
}

function rollDice(): number {
    return Math.ceil(Math.random() * 6)
}