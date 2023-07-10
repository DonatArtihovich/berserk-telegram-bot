import { Context, Markup } from "telegraf";
import { IRoom } from "../rooms/rooms.types";
import { IPlayer } from "../players/players.types";
import { players } from "../players/players";
import { InlineKeyboardMarkup } from "telegraf/typings/core/types/typegram";
import * as Text from '../text'

export function requireDecks(ctx: Context, room: IRoom): void {
    room.players.forEach(user => {
        const p = findPlayerById(user.id)
        let menu: InlineKeyboardMarkup
        if (p == undefined) {
            menu = Markup.inlineKeyboard([
                [Markup.button.callback('➕Добавить колоду', 'add_deck')]
            ]).reply_markup
        } else {
            const deckButtons = p.decks.map(d => [Markup.button.callback(d.name, 'choose_deck')])
            menu = Markup.inlineKeyboard([
                ...deckButtons,
                [Markup.button.callback('➕Добавить колоду', 'add_deck')]
            ]).reply_markup
        }
        const message = '🃏выберите колоду: '
        ctx.telegram.sendMessage(user.id, message, { parse_mode: 'HTML', reply_markup: menu })
    })
}

export function requireDecklist(ctx: Context) {
    const menu = Markup.inlineKeyboard([Markup.button.callback('Отмена', 'close')])
    ctx.replyWithHTML(Text.requireDecklistMessage, menu)
}

const findPlayerById = (playerId: number): IPlayer | undefined => players.find(u => u.id === playerId)
