import { Context, Markup } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { Card, IGame, IGamePlayer } from "./game.types";
import Deck from './deck'
import { User } from "../rooms/rooms";


export class Game implements IGame {
    public status: 'off' | 'on' | 'lobby'
    public players: IGamePlayer[]
    readonly room: IRoom

    constructor(room: IRoom) {
        this.status = 'off'
        this.room = room
        this.players = []
    }

    changeStatus(status: 'off' | 'on' | 'lobby') {
        this.status = status
    }

    startGame(ctx: Context) {
        this.players.forEach(player => player.game = this)
        this.room.informRoom(ctx, 'gen_start', { id: 0, name: '' })
            .then(() => this.generateHands(ctx))
    }

    public finishArranging(ctx: Context): void {
        const player = Deck.findGamePlayerByCtx(ctx) as IGamePlayer

        const playerField = player.squad.startArrangement.map(arr => {
            return arr.map(cell => {
                return cell ? cell.name.slice(0, 6) : '⬜️'
            }).join('|')
        }).join('\n')

        ctx.editMessageText(`✅Вы закончили расстановку отряда\nВаша расстановка:\n${playerField}`)

        this.room.informRoom(ctx, 'finish-arranging', new User(player.id, player.name))
    }

    private generateHands(ctx: Context): void {
        console.log(this.players)

        const hands: Card[][] = this.players.map(player => Deck.generateHand(player)) as Card[][]

        this.players.forEach(async (player, index) => {
            const hand: Card[] = hands[index]

            await ctx.telegram.sendMessage(player.id, '🃏Ваша рука сгенерирована!')
            new Promise((resolve) => {
                hand.forEach(async (card, index) => {

                    const menu = [
                        [
                            Markup.button.callback('➕', `squad_${card.name}`),
                            Markup.button.callback('❔', `info_${card.name}`)
                        ]
                    ]

                    ctx.telegram.sendMessage(player.id, Deck.parseCard(card), { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
                        .then((res) => {
                            player.handMessages.push(res.message_id)
                        })
                        .then(() => {
                            if (index === hand.length - 1) resolve(1)
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
} 