import { Card, IGameCard, IGamePlayer } from "./game.types";

export default class GameCard implements IGameCard {
    public control: IGamePlayer
    public name: string
    public cost: number
    public elite: boolean
    public class: string | null
    public uniqueness: boolean
    public element: string
    public stats: {
        lifeCount: number
        walkCount: string
        simpleHit: string
    }
    public abilities: string | null
    public rarity: string
    public index: number
    public description: string | null
    public set: string
    public image: string
    public owner: IGamePlayer
    public isHidden: boolean
    public isTapped: boolean

    constructor(card: Card, player: IGamePlayer, isHidden: boolean) {
        this.control = player
        this.name = card.name
        this.cost = card.cost
        this.elite = card.elite
        this.class = card.class
        this.uniqueness = card.uniqueness
        this.element = card.element
        this.stats = { ...card.stats }
        this.abilities = card.abilities
        this.rarity = card.rarity
        this.index = card.index
        this.description = card.description
        this.set = card.set
        this.image = card.image
        this.owner = player
        this.isHidden = isHidden
        this.isTapped = false
    }
}