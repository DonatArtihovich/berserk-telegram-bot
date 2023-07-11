import { Context, Markup } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { IPlayer } from "../players/players.types";
import { players } from "../players/players";
import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import * as Text from '../text'

export function requireDecks(ctx: Context, room: IRoom): void {
    room.players.forEach(user => {
        const { message, menu } = printDecksList(user.id)
        ctx.telegram.sendMessage(user.id, message, { parse_mode: 'HTML', reply_markup: Markup.inlineKeyboard(menu).reply_markup })
    })
}

export function requireDecklist(ctx: Context) {
    const menu = [[Markup.button.callback('Отмена', 'cancel_add')]]
    ctx.editMessageText(Text.requireDecklistMessage, { reply_markup: { inline_keyboard: menu } })
}

export function printDecksList(id: number) {
    const p = findPlayerById(id)
    let menu
    if (p == undefined) {
        menu = [
            [Markup.button.callback('➕Добавить колоду', 'add_deck')]
        ]
    } else {
        const deckButtons = p.decks.map(d => [Markup.button.callback(d.name, 'choose_deck')])
        menu = [
            ...deckButtons,
            [Markup.button.callback('➕Добавить колоду', 'add_deck')]
        ]
    }
    const message = '🃏выберите колоду: '
    return { message, menu }
}

const findPlayerById = (playerId: number): IPlayer | undefined => players.find(u => u.id === playerId)
