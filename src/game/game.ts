import { Context } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { IGame, IGamePlayer } from "./game.types";


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

    startGame(ctx: Context): void {
        this.room.informRoom(ctx, 'gen_start', { id: 0, name: '' })
    }
} 