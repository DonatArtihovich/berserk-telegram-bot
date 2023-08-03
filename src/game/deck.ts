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
import { InlineKeyboardButton } from "telegraf/typings/core/types/typegram";

// const getCards = async () => await (await fetch('./src/game/data.json')).json()

export default class Deck {

    public static requireDecks(ctx: Context, room: IRoom): void {

        room.players.forEach(user => {
            const { message, menu } = this.printDecks(user.id)

            ctx.telegram.sendMessage(user.id, message, { parse_mode: 'HTML', reply_markup: Markup.inlineKeyboard(menu).reply_markup })
        })
    }

    public static requireDecklist(ctx: Context) {
        const menu = [[Markup.button.callback('Отмена', 'cancel_add-deck')]]
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
                [
                    Markup.button.callback('🔙Назад', 'cancel_add-deck'),
                    Markup.button.callback('🎮Играть', `choose-deck_${deck.name}`)
                ]
            ])

            ctx.replyWithHTML(`🃏Колода <b>${deck.name}</b> добавлена!\n\n<b>Деклист:</b>\n<code>${decklist}</code>\n\n<b>Всего карт:</b> ${deck.count}`, menu)
        }

        player.decks.push(deck)
    }

    public static printDecks(id: number) {
        const player = findPlayerById(id)

        const deckButtonsArr = player == undefined ? [] : player.decks.map((deck) => [Markup.button.callback(`🃏${deck.name}`, `choose-deck_${deck.name}`)])

        const menu = deckButtonsArr.concat([
            [Markup.button.callback('➕Добавить колоду', 'add_deck')],
        ])
        // const decksList = p !== undefined ? `${p.decks.map(d => `🃏<code>/deck ${d.name}</code>`).join('\n')}` : '🚫<i>Колод нет</i>🚫'
        const message = 'Выберите колоду:'

        return { message, menu }
    }

    public static async chooseDeck(ctx: Context, deckName: string) {
        const userId = ctx.from?.id
        const userName = ctx.from?.first_name
        if (userId == undefined || userName == undefined) throw new Error('user not founded')

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

        game.players.push(new GamePlayer(userId, userName, deck))

        await ctx.replyWithHTML(`✅Колода <b>${deck.name}</b> выбрана для игры!`)
        room.informRoom(ctx, 'deck', new User(userId, userName))

        if (game.players.length === 2) game.startGame(ctx)
    }

    public static generateHand(player: IGamePlayer): Card[] {
        const { deck } = player
        const deckSet: string[] = deck.list.map((card: ICard) => new Array(card.count).fill(card.name)).reduce((a, c) => a.concat(c), [])

        const handSet = this.generateHandSet(deckSet)
        const hand = this.parseHand(handSet)

        return hand
    }

    public static parseCard(cardObj: Card | string, isFull = false): string {
        let card = cardObj

        if (typeof card === 'string') {
            card = this.findCardByName(cardObj as string) as Card
        }

        const cardCost = card.elite ? '🔶' + card.cost : '🔷' + card.cost
        const cardName = `<b>${card.name}</b>`

        let cardElement;

        switch (card.element.toLowerCase().trim()) {
            case 'степи':
                cardElement = isFull ? '☀️' + card.element : '☀️'
                break;
            case 'леса':
                cardElement = isFull ? '🌳' + card.element : '🌳'
                break;
            case 'горы':
                cardElement = isFull ? '🗻' + card.element : '🗻'
                break;
            case 'болото':
                cardElement = isFull ? '🌾' + card.element : '🌾'
                break;
            case 'тьма':
                cardElement = isFull ? '💀' + card.element : '💀'
                break;
            default:
                cardElement = isFull ? '⚔' + card.element : '⚔'
        }

        const cardHead = [cardCost, cardName, cardElement].join('  ')

        if (!isFull) return cardHead

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

    public static addCardToSquad(ctx: Context, name: string) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const card = this.findCardByName(name)
        if (card == undefined) throw new Error('Card not found')

        if (card.stats.walkCount.toLowerCase().trim() === 'полет') {
            player.squad.fliers.push(card)
        } else {
            player.squad.field.push(card)
        }

        this.showCurrentSquad(ctx, player)
    }

    public static async mulliganHand(ctx: Context) {
        this.deleteLastSquad(ctx)
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.<i>')
            return
        }

        player.handMessages = []
        player.squad.field = []
        player.squad.fliers = []
        player.squad.arrangingIndex = 0
        player.squad.arrangingArr = []
        player.squad.startArrangement = [new Array(5).fill(null), new Array(5).fill(null), new Array(5).fill(null)]

        const hand: Card[] = Deck.generateHand(player)

        await ctx.reply('🤚Новая рука сгенерирована!')
        new Promise((resolve) => {
            hand.forEach(async (card) => {

                const menu = [
                    [
                        Markup.button.callback('➕', `squad_${card.name}`)
                    ]
                ]

                await ctx.replyWithPhoto(card.image, { caption: this.parseCard(card), parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
                    .then((res) => {
                        player.handMessages.push(res.message_id)
                    })
                if (player.handMessages.length === hand.length) resolve(1)
            })
        })
            .then(() => {

                const menu = [
                    [
                        Markup.button.callback('🗺Расставить', `arrange-squad`),
                        Markup.button.callback('🤚Пересдать', `mulligan`)
                    ]
                ]

                ctx.reply('🃏Завершить набор/пересдать: ', { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
                    .then((res) => {
                        player.handMessages.push(res.message_id)
                    })
            })
    }

    private static async deleteLastSquad(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const squadMessagesIds = player.handMessages
        squadMessagesIds.forEach(id => {
            ctx.deleteMessage(id).catch((e) => { return e })
        })
    }

    public static deleteCardFromSquad(ctx: Context, name: string) {
        const userId = ctx.chat?.id
        if (userId == undefined) throw new Error('User not found')

        const room = findRoomForUser(userId)
        if (room == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
            return
        }

        const game = room.game
        if (game === undefined) {
            ctx.replyWithHTML('🚫<i>Игра не начата.</i>')
            return
        }

        const player = game.players.find(player => player.id === userId)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const card = this.findCardByName(name)
        if (card == undefined) throw new Error('Card not found')

        const squadArr = card.stats.walkCount.toLowerCase().trim() === 'полет' ? player.squad.fliers : player.squad.field

        const cardIndex = squadArr.findIndex(card => card.name === name)

        if (cardIndex !== -1) {
            squadArr.splice(cardIndex, 1)
        }

        this.showCurrentSquad(ctx, player)
    }

    private static showCurrentSquad(ctx: Context, player: IGamePlayer) {
        if (player.handMessages.length < 16) return

        const playerCurrentSquad = player.squad.field.concat(player.squad.fliers).map(({ name }) => {
            const card = this.findCardByName(name)

            if (card == undefined) {
                throw new Error('Card not found')
            }

            const cardCost = card.elite ? '🔶' + card.cost : '🔷' + card.cost

            let cardElement
            switch (card.element.toLowerCase().trim()) {
                case 'степи':
                    cardElement = '☀️'
                    break;
                case 'леса':
                    cardElement = '🌳'
                    break;
                case 'горы':
                    cardElement = '🗻'
                    break;
                case 'болото':
                    cardElement = '🌾'
                    break;
                case 'тьма':
                    cardElement = '💀'
                    break;
                default:
                    cardElement = '⚔'
            }

            return `${cardCost} ${card.name} ${cardElement}`
        }).join('\n')


        const menu = [
            [
                Markup.button.callback('🗺Расставить', `arrange-squad`),
                Markup.button.callback('🤚Пересдать', `mulligan`)
            ]
        ]

        ctx.telegram.editMessageText(ctx.from?.id, player.handMessages[player.handMessages.length - 1], undefined, `${playerCurrentSquad.trim() ? 'Ваш текущий отряд:\n' + playerCurrentSquad : ''}\n\n🃏Завершить набор/пересдать:`, { reply_markup: { inline_keyboard: menu } })
    }

    public static startArranging(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.<i>')
            return
        }

        if (!player.squad.field.concat(player.squad.fliers).length) {
            ctx.replyWithHTML('🚫<i>Вы не набрали отряд!</i>')
            return
        }

        this.deleteLastSquad(ctx)

        const playerSquad = player.squad.field.concat(player.squad.fliers).map(({ name }, index) => { return { name, index: index + 1 } })
        player.squad.arrangingArr = playerSquad

        const { message, menu } = this.arrange(ctx, 1)
        if (message == undefined || menu == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.<i>')
            return
        }

        ctx.replyWithHTML(message, Markup.inlineKeyboard(menu)).then(m => {
            player.handMessages.push(m.message_id)
        })
    }

    public static arrangeCard(ctx: Context, cellId: string) {
        if (ctx.callbackQuery == undefined) {
            throw new Error('Message not found')
        }

        const messageObj: IMessage = ctx.callbackQuery.message as IMessage
        const text = messageObj.text

        const cardName = text.split('\n').find(str => str.startsWith('➡️'))?.split(')').slice(1).join('').toLowerCase().trim()
        if (cardName == undefined) {
            return
        }

        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const arrangingArr = player.squad.arrangingArr
        if (arrangingArr == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const cellNumber = Number(cellId.split('_')[1])
        const row = Math.floor(cellNumber / 5)
        const cell = cellNumber % 5

        if (player.squad.startArrangement[row][cell]) {
            return
        }

        let indicator = false;
        player.squad.startArrangement.forEach(arr => arr.forEach(card => { if (Number(card?.arrIndex) === player.squad.arrangingIndex) indicator = true }))

        if (indicator) {
            const rowIndex = player.squad.startArrangement.findIndex(arr => arr.findIndex(c => c ? c.arrIndex === player.squad.arrangingIndex : false) !== -1)
            const cellIndex = player.squad.startArrangement[rowIndex].findIndex(c => c ? c.arrIndex === player.squad.arrangingIndex : false)

            player.squad.startArrangement[rowIndex][cellIndex] = null
        } else {
            // ctx.replyWithHTML(`<code>До:</code>${JSON.stringify(player.squad.startArrangement.map(arr => arr.map(c => c ? `${c.name}(${c.arrIndex})` : '⬜️')))}`)

            arrangingArr.splice(arrangingArr.findIndex(c => c.index === player.squad.arrangingIndex), 1)
        }

        const card = this.findCardByName(cardName) as Card
        card.arrIndex = player.squad.arrangingIndex

        player.squad.startArrangement[row][cell] = card

        const { message, menu } = this.arrange(ctx, player.squad.arrangingIndex !== undefined ? player.squad.arrangingIndex : 0)

        if (message == undefined || menu == undefined) {
            throw new Error('Message is undefined')
        }
        // ctx.replyWithHTML(`<code>После:</code>${JSON.stringify(player.squad.startArrangement.map(arr => arr.map(c => c ? `${c.name}(${c.arrIndex})` : '⬜️')))}`)

        ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
    }

    public static arrangeNext(ctx: Context) {
        const messageObj: IMessage = ctx.callbackQuery?.message as IMessage
        const text = messageObj.text
        const cardNameIndex = text.split('\n').findIndex(str => str.startsWith('➡️'))

        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.<i>')
            return
        }

        if (cardNameIndex === text.split('\n').length - 1) {

            player.game?.finishArranging(ctx)
            return
        }

        player.squad.arrangingIndex = player.squad.arrangingIndex as number + 1

        const { message, menu } = this.arrange(ctx, player.squad.arrangingIndex)

        if (message == undefined || menu == undefined) {
            throw new Error('Message is undefined')
        }

        ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
    }

    public static arrangePrev(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.<i>')
            return
        }

        player.squad.arrangingIndex = player.squad.arrangingIndex as number - 1

        const { message, menu } = this.arrange(ctx, player.squad.arrangingIndex)

        if (message == undefined || menu == undefined) {
            throw new Error('Message is undefined')
        }

        ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
    }

    public static defineTurnOrder(ctx: Context, isFirst: boolean) {

        ctx.editMessageText(`🎲Вы ходите ${isFirst ? 'первым' : 'вторым'}.`)

        const userId = ctx.chat?.id
        if (userId == undefined) throw new Error('User not found')

        const player = this.findGamePlayerByCtx(ctx)

        const room = findRoomForUser(userId)
        if (room == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
            return
        }

        const game = room.game
        if (game === undefined) {
            ctx.replyWithHTML('🚫<i>Игра не начата.</i>')
            return
        }

        game.players = game.players[0].id === userId && !isFirst || game.players[0].id !== userId && isFirst ? game.players.reverse() : game.players

        room.informRoom(ctx, 'def', { id: userId, name: player?.name == undefined ? 'Игрок' : player.name }, `🎲<b>${player?.name}</b> ходит ${isFirst ? 'первым' : 'вторым'}.`)
        game.generateHands(ctx)
    }

    private static arrange(ctx: Context, currentIndex: number): { message: string | undefined, menu: InlineKeyboardButton[][] | undefined } {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.<i>')
            return { message: undefined, menu: undefined }
        }

        const arrangingArr = player.squad.arrangingArr
        if (arrangingArr == undefined) {
            throw new Error('Arranging arr not found')
        }

        player.squad.arrangingIndex = currentIndex

        const playerSquad = player.squad.field.concat(player.squad.fliers).map(({ name }, index) => { return { name, index: index + 1 } })

        const playerSquadStr = playerSquad.map((card, index) => index !== currentIndex - 1 ? (arrangingArr.findIndex(c => c.index === card.index) === -1 ? `✅(${card.index})${card.name}` : `✔️(${card.index})${card.name}`) : `➡️<b>(${card.index})${card.name}</b>`).join('\n')
        const message = `Расставьте свой отряд:\n${playerSquadStr}`

        const arrowButtons = currentIndex === 1 ? [Markup.button.callback('Дальше🔜', 'arrange-next')] : [Markup.button.callback('🔙Назад', 'arrange-prev'), Markup.button.callback('Дальше🔜', 'arrange-next')]

        let idx = 0
        const menu = player.squad.startArrangement.map((array, i) => {

            if (i) idx += array.length

            const row = array.map((item, i) => {
                let itemElement
                if (item) {
                    switch (item.element.trim().toLowerCase()) {
                        case 'степи':
                            itemElement = '☀️'
                            break;
                        case 'леса':
                            itemElement = '🌳'
                            break;
                        case 'горы':
                            itemElement = '🗻'
                            break;
                        case 'болото':
                            itemElement = '🌾'
                            break;
                        case 'тьма':
                            itemElement = '💀'
                            break;
                        default:
                            itemElement = '⚔️'
                    }
                }
                return Markup.button.callback(!item ? '⬜️' : `${itemElement}(${item.arrIndex})`, `ar-card-place_${idx + i}`)
            })
            return row
        }).concat([arrowButtons])
        return { message, menu }
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
        const hand: Card[] = set.map(cardName => this.findCardByName(cardName)) as Card[]
        return hand
    }

    private static findCardByName(name: string): Card | void {
        const result = cards.find(card => card.name.toLowerCase().trim() === name.toLowerCase().trim())
        return result !== undefined ? JSON.parse(JSON.stringify(result)) : result
    }

    public static findGamePlayerByCtx(ctx: Context): IGamePlayer | undefined {
        const userId = ctx.chat?.id
        if (userId == undefined) throw new Error('User not found')

        const room = findRoomForUser(userId)
        if (room == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
            return
        }

        const game = room.game
        if (game === undefined) {
            ctx.replyWithHTML('🚫<i>Игра не начата.</i>')
            return
        }

        return game.players.find(player => player.id === userId)
    }
}

export const findPlayerById = (playerId: number): IPlayer | undefined => players.find(u => u.id === playerId)