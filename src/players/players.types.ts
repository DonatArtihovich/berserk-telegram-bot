type Players = IPlayer[]

interface IPlayer {
    id: number
    decks: Deck[]
    winsCount: number
    losesCount: number
    drawsCount: number
}

interface Deck {
    name: string
    list: Record<string, number>
}
export { Players, IPlayer, Deck }