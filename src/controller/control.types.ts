import { Context } from 'telegraf'

export interface IController {
    createRoom: (ctx: Context) => void
    joinRoom: (ctx: Context, roomName: string, watcher?: boolean) => void
    leaveRoom: (ctx: Context) => void
    showRoom: (ctx: Context) => void
    showAllRooms: (ctx: Context) => void
    sendMessage: (ctx: Context) => void
}