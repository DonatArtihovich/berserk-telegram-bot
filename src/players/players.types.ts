import { IDeck } from "../game/game.types"

type Players = IPlayer[]

interface IPlayer {
    id: number
    decks: IDeck[]
    winsCount: number
    losesCount: number
    drawsCount: number
}

export { Players, IPlayer }