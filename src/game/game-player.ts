import { Card, IDeck, IGamePlayer, ISquad } from "./game.types";

export class GamePlayer implements IGamePlayer {
    public id: number
    public deck: IDeck
    public squad: ISquad
    public grave: Card[]

    constructor(id: number, deck: IDeck) {
        this.id = id
        this.deck = deck
        this.squad = new Squad()
        this.grave = []
    }
}

class Squad implements ISquad {
    public fliers: Card[]
    public field: Card[]

    constructor() {
        this.fliers = []
        this.field = []
    }
}