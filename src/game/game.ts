import { Context } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { Card, IGame, IGamePlayer } from "./game.types";
import Deck from './deck'


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

    async startGame(ctx: Context) {
        await this.room.informRoom(ctx, 'gen_start', { id: 0, name: '' })
        this.generateHands(ctx)
    }

    private generateHands(ctx: Context): void {

        const hands: Card[][] = this.players.map(player => Deck.generateHand(player)) as Card[][]

        this.players.forEach(async (player, index) => {
            const hand: Card[] = hands[index]
            console.log(hand)

            await ctx.telegram.sendMessage(player.id, '🃏Ваша рука сгенерирована!')
            hand.forEach(card => {
                ctx.telegram.sendMessage(player.id, Deck.validateCard(card), { parse_mode: 'HTML' })
            })
        })
    }
} 