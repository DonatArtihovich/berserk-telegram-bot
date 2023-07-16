import { Context, Markup } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { IPlayer } from "../players/players.types";
import { Player, players } from "../players/players";
import * as Text from '../text'
import { IMessage } from "../types";
import { IDeck, ICard, Card } from "./game.types";
import { findRoomForUser } from "../controller/control";
import { User } from "../rooms/rooms";
import cards from './data.json'

// const getCards = async () => await (await fetch('./src/game/data.json')).json()

export function requireDecks(ctx: Context, room: IRoom): void {
    room.players.forEach(user => {
        const { message, menu } = printDecksList(user.id)
        ctx.telegram.sendMessage(user.id, message, { parse_mode: 'HTML', reply_markup: Markup.inlineKeyboard(menu).reply_markup })
    })
}

export function requireDecklist(ctx: Context) {
    const menu = [[Markup.button.callback('Отмена', 'cancel_add')]]
    ctx.editMessageText(Text.requireDecklistMessage, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
}

export async function addDeck(ctx: Context) {
    const message = ctx.message as IMessage
    const messageText = message.text
    let deck: IDeck
    try {
        deck = parseDecklist(messageText)
    } catch (e) {
        ctx.reply(Text.deckErrorMessage)
        return
    }

    const cardsCount = deck.list.reduce((count: number, card: ICard) => count + card.count, 0)
    if (cardsCount < 30) {
        ctx.reply(Text.deckErrorMessage)
        return
    } else {
        deck.count = cardsCount
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

export function printDecksList(id: number) {
    const p = findPlayerById(id)
    const menu = [
        [Markup.button.callback('➕Добавить колоду', 'add_deck')]
    ]
    const decksList = p !== undefined ? `${p.decks.map(d => `🃏<code>/deck ${d.name}</code>`).join('\n')}` : '🚫<i>Колод нет</i>🚫'
    console.log(decksList)
    const message = `Выберите колоду:\n\n${decksList}`
    return { message, menu }
}

function parseDecklist(decklist: string): IDeck {
    const result: IDeck = {} as IDeck;
    const matches = decklist.split(',')
    if (matches) {
        result.name = matches[0].trim(); result.list = [];
        const cards = matches.slice(1)
        for (let i = 0; i < cards.length; i++) {
            const [count, name] = cards[i].trim().replace(' ', '|').split('|').map(i => i.trim());

            result.list.push({ name: name.trim(), count: parseInt(count) });
        }
    }

    return result;
}

export function chooseDeck(ctx: Context): void {
    const userId = ctx.from?.id
    const userName = ctx.from?.first_name
    const message = ctx.message as IMessage
    if (!message.text.split(' ')[1]) {
        ctx.replyWithHTML('🚫<i>Колода не найдена.</i>')
        return
    }
    const deckName = message.text.split(' ')[1].trim()

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
        ctx.replyWithHTML('🚫<i>Игра не запущена</i>')
        return
    }
    const deck = player.decks.find(deck => deck.name === deckName)
    if (deck == undefined) {
        ctx.replyWithHTML('🚫<i>Колода не найдена</i>')
        return
    }
    game.players.push({ id: userId, deck: deck })
    ctx.replyWithHTML(`✅Колода <b>${deck.name}</b> выбрана для игры!`)
    room.informRoom(ctx, 'deck', new User(userId, userName))
    if (game.players.length === 2) game.startGame(ctx)

    console.log(deckName)
}

const findPlayerById = (playerId: number): IPlayer | undefined => players.find(u => u.id === playerId)