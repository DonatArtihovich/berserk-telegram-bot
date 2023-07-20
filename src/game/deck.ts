import { Context, Markup } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { IPlayer } from "../players/players.types";
import { Player, players } from "../players/players";
import * as Text from '../text'
import { IMessage } from "../types";
import { IDeck, ICard, Card, IGamePlayer } from "./game.types";
import { findRoomForUser } from "../controller/control";
import { User } from "../rooms/rooms";
import cards from './data.json'
import { GamePlayer } from "./game-player";

// const getCards = async () => await (await fetch('./src/game/data.json')).json()

export default class Deck {


    public static requireDecks(ctx: Context, room: IRoom): void {

        room.players.forEach(user => {
            const { message, menu } = this.printDecks(user.id)

            ctx.telegram.sendMessage(user.id, message, { parse_mode: 'HTML', reply_markup: Markup.inlineKeyboard(menu).reply_markup })
        })
    }

    public static requireDecklist(ctx: Context) {
        const menu = [[Markup.button.callback('Отмена', 'cancel_add')]]
        ctx.editMessageText(Text.requireDecklistMessage, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
    }

    public static addDeck(ctx: Context) {
        const message = ctx.message as IMessage
        const messageText = message.text

        let deck: IDeck
        try {
            deck = this.parseDecklist(messageText)
        } catch (e) {
            ctx.reply(Text.deckErrorMessage)
            return
        }


        if (deck.count < 30) {
            ctx.reply(Text.deckErrorMessage)
            return
        }

        const userId = ctx.from?.id
        if (!userId) throw new Error('Cannot find user id')

        let player: IPlayer | undefined = findPlayerById(userId)

        if (player == undefined) {
            player = new Player(userId)
            players.push(player)
        }

        if (player.decks.findIndex(d => d.name === deck.name) !== -1) {
            ctx.replyWithHTML(`🚫<i>Колода с именем <b>${deck.name}</b> уже существует!</i>`)
            return
        }

        for (const card of deck.list) {
            if (cards.findIndex((c) => c.name.toLowerCase() === card.name.toLowerCase()) === -1) {
                ctx.replyWithHTML(`🚫<i>Карта <b>${card.name}</b> не найдена!</i>`)
                return
            }
        }

        const decklist = deck.list.map((card: ICard) => `${card.count} ${card.name}`).join(',\n')
        const room = findRoomForUser(userId)

        if (room == undefined || room.game == undefined || room.game.status !== 'lobby') {
            ctx.replyWithHTML(`🃏Колода <b>${deck.name}</b> добавлена!\n<b>Деклист:</b>\n<code>${decklist}</code>\n\n<b>Всего карт:</b> ${deck.count}`)
        } else {

            const menu = Markup.inlineKeyboard([
                [Markup.button.callback('🔙Назад', 'cancel_add')]
            ])

            ctx.replyWithHTML(`🃏Колода <b>${deck.name}</b> добавлена!\n\n<b>Деклист:</b>\n<code>${decklist}</code>\n\n<b>Всего карт:</b> ${deck.count}\n\nЧтобы выбрать колоду для игры введите <code>/deck ${deck.name}</code>`, menu)
        }

        player.decks.push(deck)
    }

    public static printDecks(id: number) {
        const p = findPlayerById(id)

        const menu = [
            [Markup.button.callback('➕Добавить колоду', 'add_deck')]
        ]

        const decksList = p !== undefined ? `${p.decks.map(d => `🃏<code>/deck ${d.name}</code>`).join('\n')}` : '🚫<i>Колод нет</i>🚫'
        const message = `Выберите колоду:\n\n${decksList}`

        return { message, menu }
    }

    public static async chooseDeck(ctx: Context) {

        const userId = ctx.from?.id
        const userName = ctx.from?.first_name
        if (userId == undefined || userName == undefined) throw new Error('user not founded')

        const message = ctx.message as IMessage

        if (!message.text.split(' ')[1]) {
            ctx.replyWithHTML('🚫<i>Колода не найдена.</i>')
            return
        }

        const deckName = message.text.split(' ')[1].trim()

        let player = players.find(p => p.id === userId)

        if (player == undefined) {
            player = new Player(userId)
            players.push(player)
        }

        const room = findRoomForUser(userId)
        if (room == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате</i>')
            return
        }

        const game = room.game
        if (game == undefined) {
            ctx.replyWithHTML('🚫<i>Игра не начата</i>')
            return
        }

        const deck = player.decks.find(deck => deck.name === deckName)
        if (deck == undefined) {
            ctx.replyWithHTML('🚫<i>Колода не найдена</i>')
            return
        }

        game.players.push(new GamePlayer(userId, deck))

        await ctx.replyWithHTML(`✅Колода <b>${deck.name}</b> выбрана для игры!`)
        room.informRoom(ctx, 'deck', new User(userId, userName))

        //if (game.players.length === 2)
        game.startGame(ctx)
    }

    public static generateHand(player: IGamePlayer): Card[] {
        const { deck } = player
        const deckSet: string[] = deck.list.map((card: ICard) => new Array(card.count).fill(card.name)).reduce((a, c) => a.concat(c), [])

        const handSet = this.generateHandSet(deckSet)
        const hand = this.parseHand(handSet)

        return hand
    }

    public static validateCard(card: Card): string {
        const cardCost = card.elite ? '🔶' + card.cost : '🔷' + card.cost
        const cardName = `<b>${card.name}</b>`

        let cardElement;

        switch (card.element.toLowerCase().trim()) {
            case 'степи':
                cardElement = '☀️' + card.element
                break;
            case 'леса':
                cardElement = '🌳' + card.element
                break;
            case 'горы':
                cardElement = '🗻' + card.element
                break;
            case 'болото':
                cardElement = '🌾' + card.element
                break;
            case 'тьма':
                cardElement = '💀' + card.element
                break;
            default:
                cardElement = '⚔' + card.element
        }

        const cardHead = [cardCost, cardName, cardElement].join('  ')

        const cardClass = `———————${card.class ? card.class : '————'}———————`

        const cardLife = `{${card.stats.lifeCount}❤️}`
        const cardWalk = `{${card.stats.walkCount}🐾}`
        const cardHit = `{${card.stats.simpleHit}🗡}`

        const cardStats = `======<b>${cardLife}</b>==<b>${cardWalk}</b>==<b>${cardHit}</b>======`

        const cardAbilities = card.abilities ? card.abilities.replaceAll('|', '\n') : ''

        const cardDescription = card.description ? `\n<i>${card.description.replaceAll('|', '\n')}</i>` : ''

        let cardRarity;
        switch (card.rarity.toLowerCase().trim()) {
            case 'частая':
                cardRarity = '🟢 ' + card.rarity
                break;
            case 'необычная':
                cardRarity = '🔵 ' + card.rarity
                break;
            case 'редкая':
                cardRarity = '🟣 ' + card.rarity
                break;
            case 'ультраредкая':
                cardRarity = '🟠 ' + card.rarity
                break;
        }

        const cardString = [cardHead, cardClass, cardStats, cardAbilities, cardDescription, `${card.index} <b>${card.set}</b> ${cardRarity}`].join('\n')

        return cardString
    }

    private static parseDecklist(decklist: string): IDeck {
        const result: IDeck = {} as IDeck;
        const matches = decklist.split(',')

        const list: ICard[] = []

        if (matches) {
            result.name = matches[0].trim(); result.list = [];
            const cards = matches.slice(1)

            for (let i = 0; i < cards.length; i++) {
                const [count, name] = cards[i].trim().replace(' ', '|').split('|').map(i => i.toLowerCase().trim());

                list.push({ name: name.trim(), count: parseInt(count) });
            }

            list
                .map((card, index) => {
                    for (let i = index + 1; i < list.length; i++) {
                        const deckCard = list[i]

                        if (deckCard.name === card.name) {
                            card.count += deckCard.count

                            list.splice(i, 1)
                        }

                        if (card.count > 3) {
                            card.count = 3
                        }
                    }

                    return card
                })
                .forEach(card => {
                    if (card != undefined) {
                        result.list.push(card)
                    }
                })
        }

        result.count = result.list.reduce((count: number, card: ICard) => count + card.count, 0)

        return result;
    }

    private static generateHandSet(set: string[]) {
        const handSet: string[] = []
        const numbers: number[] = []

        while (handSet.length < 15) {

            const cardNumber = Math.floor(Math.random() * (set.length - 1))

            if (numbers.indexOf(cardNumber) === -1) {

                numbers.push(cardNumber)
                handSet.push(set[cardNumber])
            }
        }

        return handSet
    }

    private static parseHand(set: string[]): Card[] {
        const hand: Card[] = set.map(cardName => cards.find(c => c.name.toLowerCase().trim() === cardName.toLowerCase().trim())) as Card[]
        return hand
    }
}

const findPlayerById = (playerId: number): IPlayer | undefined => players.find(u => u.id === playerId)