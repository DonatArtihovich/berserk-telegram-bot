import { Context, Markup } from 'telegraf'
import { IController } from './control.types'
import { rooms, Room, User } from '../rooms/rooms'
import { IRoom, IUser } from '../rooms/rooms.types'
import { Game } from '../game/game'
import { Card, ICard, IDeck, IGame, IGameCard, IGamePlayer } from '../game/game.types'
import * as Text from '../text'
import { IMessage } from '../types'
import { IPlayer } from '../players/players.types'
import { Player, players } from '../players/players'
import cards from '../data.json'
import { GamePlayer } from '../game/game-player'
import { InlineKeyboardButton } from 'telegraf/typings/core/types/typegram'
import { getField } from '../field/field'

export default class Controller implements IController {
    public createRoom(ctx: Context): void {
        if (!ctx) throw new Error('ctx is not defined!')

        const userId = ctx.from?.id as number

        const curRoom: IRoom | undefined = findRoomForUser(userId)
        if (curRoom !== undefined) {

            ctx.replyWithHTML(`🚫Вы уже находитесь в комнате <b>${curRoom.name}</b>!`)
            return
        }

        const userName = ctx.from?.first_name as string
        const roomName: string = generateRandomRoomName()

        const player: IUser = new User(userId, userName)
        const newRoom: IRoom = new Room(roomName, player)

        rooms.push(newRoom)

        const replyText = `✅Комната под названием <code>${roomName}</code> создана! Пригласите сюда оппонента и зрителей!\n\n😀<i>Оппонент должен ввести <code>/join ${roomName}</code>, чтобы присоединиться как игрок,\n🥸зритель должен ввести <code>/watch ${roomName}</code>, чтобы присоединиться как зритель</i>`

        const menu = Markup.inlineKeyboard([
            [Markup.button.callback('Подробности', 'roominfo')],
            [Markup.button.callback('Удалить и выйти', 'exit')]
        ])

        ctx.replyWithHTML(replyText, menu)
    }

    public joinRoom(ctx: Context, roomName: string, watcher = false): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        if (roomName == undefined) {
            ctx.replyWithHTML('🚫<i>Комната не найдена</i>')
            return
        }

        const room = rooms.find(r => r.name === roomName.trim())
        const userId = ctx.from?.id as number

        const curRoom: IRoom | undefined = findRoomForUser(userId)
        if (curRoom !== undefined) {
            ctx.replyWithHTML(`🚫<i>Вы уже находитесь в комнате <b>${curRoom.name}</b>.</i>`)
            return
        }

        const userName = ctx.from?.first_name as string
        if (room?.players.findIndex(p => p.id === userId) !== -1) {
            ctx.replyWithHTML(`🚫<i>Комнаты <b>${roomName}</b> не существует.</i>`)
            return
        }

        const user: IUser = new User(userId, userName)

        const menu = Markup.inlineKeyboard([
            [Markup.button.callback('Начать игру', 'play')],
            [Markup.button.callback('Подробности', 'roominfo')],
            [Markup.button.callback('Выйти', 'exit')]
        ])

        if (room.players.length < 2 && !watcher) {

            room.players.push(user)
            ctx.replyWithHTML(`😀Вы добавлены в комнату <b>${room.name}</b> как игрок! Приятной игры!`, menu)

            room.informRoom(ctx, 'pjoin', user)
        } else {

            room.watchers.push(user)
            ctx.replyWithHTML(`🥸Вы добавлены в комнату <b>${room.name}</b> как зритель.`, menu)

            room.informRoom(ctx, 'wjoin', user)
        }
    }

    public leaveRoom(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom === undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
        } else {

            const userStatusArr = curRoom.players.findIndex(u => u.id === userId) !== -1 ? curRoom.players : curRoom.watchers as IUser[]
            const userIndex = userStatusArr.findIndex(u => u.id === userId)

            curRoom.informRoom(ctx, 'exit', userStatusArr[userIndex])

            userStatusArr.splice(userIndex, 1)

            ctx.replyWithHTML(`🚪Вы покинули комнату <b>${curRoom.name}</b>`)
            if (curRoom.players.length === 0 && curRoom.watchers.length === 0) rooms.splice(rooms.indexOf(curRoom), 1)
        }
    }

    public showRoom(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom === undefined) {
            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
        } else {
            const menu = Markup.inlineKeyboard([[Markup.button.callback('Выйти', 'exit')], [Markup.button.callback('Закрыть', 'close')]])

            const playersInRoom = curRoom.players.map(p => p.name)
            const watchersInRoom = curRoom.watchers.map(w => w.name)

            const players = playersInRoom.length ? `😀${playersInRoom.join('\n😀')}` : '🚫<i>Игроков нет</i>🚫'
            const watchers = watchersInRoom.length ? `🥸${watchersInRoom.join('\n🥸')}` : '🚫<i>Зрителей нет</i>🚫'
            const isOnGame = curRoom.status ? '✅Игра идет✅' : '🚫Игра еще не началась / уже закончилась🚫'

            const message = `📰<b>Информация о комнате</b> <code>${curRoom.name}</code>\n🗞<b>Владелец</b> - ${playersInRoom[0]}\n\n<b>Игроки:</b>\n${players}\n\n<b>Зрители:</b>\n${watchers}\n\n<b>Статус игры:</b> ${isOnGame}`
            ctx.replyWithHTML(message, menu)
        }
    }

    public showAllRooms(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const roomNames = rooms.map(room => `<code>${room.name}</code>`)
        const list = roomNames.length === 0 ? '<i>🚫Доступных комнат нет🚫</i>' : `🗞${roomNames.join('\n🗞')}`
        const message = `📰<b>Список доступных комнат:</b>\n\n${list}`

        ctx.replyWithHTML(message, Markup.inlineKeyboard([Markup.button.callback('Закрыть', 'close')]))
    }

    public prepareGame(ctx: Context): void {
        if (ctx.message != undefined) ctx.deleteMessage()

        const userId = ctx.from?.id as number
        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom == undefined) {

            ctx.replyWithHTML('🚫<i>Вы не находитесь в комнате.</i>')
            return
        } else if (!isPlayer(userId, curRoom)) {

            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        if (curRoom.isOnGame) return

        // if (curRoom.players.length !== 2) {
        //     ctx.replyWithHTML('🚫<i>Игроков должно быть двое.</i>')
        //     return
        // }

        curRoom.isOnGame = true
        curRoom.watchers.forEach(async (u) => {
            ctx.telegram.sendMessage(u.id, '🗡Игра запущена!🛡')
        })

        const game: IGame = new Game(curRoom)
        curRoom.game = game

        game.changeStatus('lobby')
        this.requireDecks(ctx, curRoom)
    }

    public sendMessage(ctx: Context): void {
        const userId = ctx.from?.id as number
        const userName = ctx.from?.first_name as string

        const curRoom: IRoom | undefined = findRoomForUser(userId)

        if (curRoom !== undefined) {
            curRoom.informRoom(ctx, 'msg', new User(userId, userName))
        }
    }

    public requireDecks(ctx: Context, room: IRoom): void {

        room.players.forEach(user => {
            const { message, menu } = this.printDecks(user.id)

            ctx.telegram.sendMessage(user.id, message, { parse_mode: 'HTML', reply_markup: Markup.inlineKeyboard(menu).reply_markup })
        })
    }

    public requireDecklist(ctx: Context) {
        const menu = [[Markup.button.callback('Отмена', 'cancel_add-deck')]]
        ctx.editMessageText(Text.requireDecklistMessage, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
    }

    public addDeck(ctx: Context) {
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

        console.log(deck)
        player.decks.push(deck)
    }

    public printDecks(id: number) {
        const player = findPlayerById(id)

        const deckButtonsArr = player == undefined ? [] : player.decks.map((deck) => [Markup.button.callback(`🃏${deck.name}`, `choose-deck_${deck.name}`)])

        const menu = deckButtonsArr.concat([
            [Markup.button.callback('➕Добавить колоду', 'add_deck')],
        ])
        // const decksList = p !== undefined ? `${p.decks.map(d => `🃏<code>/deck ${d.name}</code>`).join('\n')}` : '🚫<i>Колод нет</i>🚫'
        const message = 'Выберите колоду:'

        return { message, menu }
    }

    public async chooseDeck(ctx: Context, deckName: string) {
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

        if (game.players.findIndex(p => p.id === userId) !== -1) {
            ctx.replyWithHTML('🚫<i>Вы уже в игре</i>')
            return
        }

        game.players.push(new GamePlayer(userId, userName, deck))

        await ctx.replyWithHTML(`✅Колода <b>${deck.name}</b> выбрана для игры!`)
        room.informRoom(ctx, 'deck', new User(userId, userName))

        if (game.players.length === 2) game.startGame(ctx)
    }

    public generateHand(player: IGamePlayer): Card[] {
        const { deck } = player
        const deckSet: string[] = deck.list.map((card: ICard) => new Array(card.count).fill(card.name)).reduce((a, c) => a.concat(c), [])

        const handSet = this.generateHandSet(deckSet)
        const hand = this.parseHand(handSet)

        return hand
    }

    public parseCard(cardObj: Card | string, isFull = false): string {
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

    public addCardToSquad(ctx: Context, name: string) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        if (!player.game?.areHandsKeeped) {
            ctx.replyWithHTML('🚫<i>Еще не все оставили свои руки</i>')
            return
        }

        const menu = [
            [Markup.button.callback('🔙Отмена', `cancel_squad-${name}`)]
        ]

        const cardInfoArr = this.parseCard(name).split(' ')
        const cardElement = cardInfoArr[cardInfoArr.length - 1]
        const cardCost = cardInfoArr[0]
        ctx.editMessageCaption(`Карта ${cardElement}<b>${name}</b>(${cardCost}) взята в отряд!`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })


        const card = this.findCardByName(name)
        if (card == undefined) throw new Error('Card not found')

        if (card.stats.walkCount.toLowerCase().trim() === 'полет') {
            player.squad.fliers.push(card)
        } else {
            player.squad.field.push(card)
        }

        this.showCurrentSquad(ctx, player)
    }

    public keepHand(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        ctx.deleteMessage().catch(e => e)

        if (player.squad.isHandKeeped) {
            ctx.replyWithHTML('🚫<i>Вы уже оставили руку</i>')
            return
        }

        const game = player.game
        if (game == undefined) {
            ctx.replyWithHTML('🚫<i>Игра еще не началась/уже закончилась</i>')
            return
        }

        const room = game.room

        player.squad.isHandKeeped = true

        const isReady: boolean = room.game?.players.reduce((prev, curr) => !prev ? prev : curr.squad.isHandKeeped, true) as boolean
        if (isReady) game.areHandsKeeped = true

        room.players.concat(room.watchers).forEach(user => {
            if (isReady) {
                user.id === player.id ?
                    ctx.telegram.sendMessage(user.id, `✅Вы оставили руку.\nНабирайте отряд и расставляйте.`, { parse_mode: 'HTML' })
                    : ctx.telegram.sendMessage(user.id, `✅<b>${player.name}</b> оставил руку.\nНабирайте отряд и расставляйте.`, { parse_mode: 'HTML' })
            } else {
                user.id === player.id ?
                    ctx.telegram.sendMessage(user.id, `✅Вы оставили руку. Подождите остальных, прежде чем набирать отряд.`, { parse_mode: 'HTML' })
                    : ctx.telegram.sendMessage(user.id, `✅<b>${player.name}</b> оставил руку.`, { parse_mode: 'HTML' })
            }
        })
    }

    public async mulliganHand(ctx: Context) {
        this.deleteLastSquad(ctx)
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        player.handMessages = []
        player.squad.field = []
        player.squad.fliers = []
        player.squad.crystals.gold--
        player.squad.arrangingIndex = 0
        player.squad.arrangingArr = []
        player.squad.startArrangement = [new Array(5).fill(null), new Array(5).fill(null), new Array(5).fill(null)]

        const hand: Card[] = this.generateHand(player)

        await ctx.reply('🤚Новая рука сгенерирована!')
        new Promise((resolve) => {
            hand.forEach(async (card) => {

                const menu = [
                    [Markup.button.callback('➕Взять в отряд', `squad_${card.name}`)],
                    [Markup.button.callback('👁 Показать', `show_${card.name}`)],
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
                        Markup.button.callback('🤚Оставить', `keep-hand`),
                        Markup.button.callback('🔀Пересдать', `mulligan`)
                    ]
                ]

                ctx.reply('🃏Обязательно сообщите, что оставляете руку перед тем как набирать отряд:', { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
                    .then((res) => {
                        player.handMessages.push(res.message_id)
                    })
            })
            .then(() => {
                const game = player.game
                if (game == undefined) {
                    ctx.replyWithHTML('🚫<i>Игра еще не началась</i>')
                    return
                }

                game.room.players.concat(game.room.watchers).forEach(user => {
                    ctx.telegram.sendMessage(user.id, `🔀${user.id === player.id ? 'Вы пересдали' : `<b>${player.name}</b> пересдал`} руку`, { parse_mode: 'HTML' })
                })
            })
    }

    private async deleteLastSquad(ctx: Context) {
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

    public deleteCardFromSquad(ctx: Context, name: string) {
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

    private showCurrentSquad(ctx: Context, player: IGamePlayer) {
        if (player.handMessages.length < 16) return

        const playerCurrentSquad: (Card | void)[] = player.squad.field.concat(player.squad.fliers).map(({ name }) => this.findCardByName(name))

        const playerCurrentSquadStr: string = playerCurrentSquad.map(card => {
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

        const playerSquadElements: string[] = []
        let gold: number = player.squad.crystals.gold
        let silver: number = player.squad.crystals.silver

        playerCurrentSquad.forEach(card => {
            if (card == undefined) {
                throw new Error('Card not found')
            }

            card.elite ? gold -= card.cost : silver -= card.cost

            if (playerSquadElements.indexOf(card.element) === -1) {
                if (playerSquadElements.length) {
                    gold--
                }

                playerSquadElements.push(card.element)
            }
        })


        const menu = [
            [
                Markup.button.callback('🗺Расставить', `arrange-squad`)
            ]
        ]


        if (player.handMessages.length < 17) {
            ctx.replyWithHTML(`${playerCurrentSquadStr.trim() ? 'Ваш текущий отряд:\n' + playerCurrentSquadStr : ''}\n\nКристаллов осталось: ${gold}🔶, ${silver}🔷\n\n🃏Расставить:`, { reply_markup: { inline_keyboard: menu } })
                .then(m => player.handMessages.push(m.message_id))
        } else {
            ctx.telegram.editMessageText(ctx.from?.id, player.handMessages[player.handMessages.length - 1], undefined, `${playerCurrentSquadStr.trim() ? 'Ваш текущий отряд:\n' + playerCurrentSquadStr : ''}\n\nКристаллов осталось: ${gold}🔶, ${silver}🔷\n\n🃏Расставить:`, { reply_markup: { inline_keyboard: menu } })
                .catch(e => e)
        }
    }

    public startArranging(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
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
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        ctx.replyWithHTML(message, Markup.inlineKeyboard(menu)).then(m => {
            player.handMessages.push(m.message_id)
        })
    }

    public arrangeCard(ctx: Context, cellId: string) {

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

    public arrangeNext(ctx: Context) {
        const messageObj: IMessage = ctx.callbackQuery?.message as IMessage
        const text = messageObj.text
        const cardNameIndex = text.split('\n').findIndex(str => str.startsWith('➡️'))

        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        if (cardNameIndex === text.split('\n').length - 3) {

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

    public arrangePrev(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        player.squad.arrangingIndex = player.squad.arrangingIndex as number - 1

        const { message, menu } = this.arrange(ctx, player.squad.arrangingIndex)

        if (message == undefined || menu == undefined) {
            throw new Error('Message is undefined')
        }

        ctx.editMessageText(message, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
    }

    public defineTurnOrder(ctx: Context, isFirst: boolean) {

        ctx.deleteMessage()

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

        const menu = [
            [Markup.button.callback('🃏Взять 15 карт', 'draw-hand')]
        ]

        room.players.concat(room.watchers).forEach(user => {
            user.id === userId ?
                ctx.telegram.sendMessage(user.id, `🎲Вы ходите ${isFirst ? 'первым' : 'вторым'}.`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
                : ctx.telegram.sendMessage(user.id, `🎲<b>${player?.name}</b> ходит ${isFirst ? 'первым' : 'вторым'}.`, { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } })
        })

    }

    public async drawHand(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const hand = this.generateHand(player)
        await ctx.telegram.sendMessage(player.id, '🃏Ваша рука сгенерирована!')
        new Promise((resolve) => {
            hand.forEach(async (card) => {

                const menu = [
                    [Markup.button.callback('➕Взять в отряд', `squad_${card.name}`)],
                    [Markup.button.callback('👁 Показать', `show_${card.name}`)],
                    // Markup.button.callback('❔', `info_${card.name}`)
                ]

                ctx.telegram.sendPhoto(player.id, card.image, { parse_mode: 'HTML', caption: this.parseCard(card), reply_markup: { inline_keyboard: menu } })
                    .then((res) => {
                        player.handMessages.push(res.message_id)
                    })
                    .then(() => {
                        if (player.handMessages.length === hand.length) resolve(1)
                    })
            })
        })
            .then(() => {

                const menu = [
                    [
                        Markup.button.callback('🤚Оставить', `keep-hand`),
                        Markup.button.callback('🔀Пересдать', `mulligan`)
                    ]
                ]

                ctx.telegram.sendMessage(player.id, '🃏Обязательно сообщите, что оставляете руку перед тем как набирать отряд:', { parse_mode: 'HTML', reply_markup: { inline_keyboard: menu } }).then(m => {
                    player.handMessages.push(m.message_id)
                })
            })
    }

    public showCard(ctx: Context, name: string) {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const game = player.game
        if (game == undefined) {
            ctx.replyWithHTML('🚫<i>Игра не начата.</i>')
            return
        }

        if (!game.areHandsKeeped) {
            ctx.replyWithHTML('🚫<i>Еще не все оставили свои руки</i>')
            return
        }

        ctx.replyWithHTML(`👁Вы показали оппоненту карту <b>${name}</b>`)

        const opponentPlayer = game.players.find(p => p.id !== player.id) as IGamePlayer

        const card = this.findCardByName(name)
        if (card == undefined) {
            ctx.replyWithHTML(`🚫<i>Карта <b>${name}</b> не найдена!</i>`)
            return
        }

        ctx.telegram.sendPhoto(opponentPlayer.id, card.image, { caption: '👁Оппонент показывает вам карту:' })
    }

    public passTurn(ctx: Context) {
        const player = this.findGamePlayerByCtx(ctx)

        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const game = player.game as IGame

        game.endTurn(ctx)
    }

    private arrange(ctx: Context, currentIndex: number): { message: string | undefined, menu: InlineKeyboardButton[][] | undefined } {
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return { message: undefined, menu: undefined }
        }

        const arrangingArr = player.squad.arrangingArr
        if (arrangingArr == undefined) {
            throw new Error('Arranging arr not found')
        }

        player.squad.arrangingIndex = currentIndex

        const playerSquad = player.squad.field.concat(player.squad.fliers).map(({ name }, index) => { return { name, index: index + 1 } })

        const playerSquadStr = playerSquad.map((card, index) => index !== currentIndex - 1 ? (arrangingArr.findIndex(c => c.index === card.index) === -1 ? `✅(${card.index})${card.name}` : `✔️(${card.index})${card.name}`) : `➡️<b>(${card.index})${card.name}</b>`).join('\n')
        const message = `Расставьте свой отряд:\n${playerSquadStr}\n\n⬛ должны быть заняты прежде чем занимать ⬜️`

        const arrowButtons = currentIndex === 1 ? [Markup.button.callback('Дальше🔜', 'arrange-next')] : [Markup.button.callback('🔙Назад', 'arrange-prev'), Markup.button.callback('Дальше🔜', 'arrange-next')]

        let idx = 0
        const menu = player.squad.startArrangement.map((array, index) => {

            if (index) idx += array.length

            const row = array.map((item, i) => {
                let square: string
                if (player.game?.players[0] === player) {
                    square = i === 0 || i === 4 ? '⬜️' : '⬛️'
                } else {
                    square = i === 0 && index !== 0 || i === 4 && index !== 0 ? '⬜️' : '⬛️'
                }

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
                return Markup.button.callback(!item ? square : `${itemElement}(${item.arrIndex})`, `ar-card-place_${idx + i}`)
            })
            return row
        }).concat([arrowButtons])
        return { message, menu }
    }

    private parseDecklist(decklist: string): IDeck {
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

    private generateHandSet(set: string[]) {
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

    private parseHand(set: string[]): Card[] {
        const hand: Card[] = set.map(cardName => this.findCardByName(cardName)) as Card[]
        return hand
    }

    private findCardByName(name: string): Card | void {
        const result = cards.find(card => card.name.toLowerCase().trim() === name.toLowerCase().trim())
        return result !== undefined ? JSON.parse(JSON.stringify(result)) : result
    }

    public changeTappedCardStatus(ctx: Context, status = true): void {
        console.log(this)
        const player = this.findGamePlayerByCtx(ctx)
        if (player == undefined) {
            ctx.replyWithHTML('🚫<i>Вы не игрок.</i>')
            return
        }

        const game = player.game
        if (game == undefined) {
            ctx.replyWithHTML('🚫<i>Игра еще не началась/уже закончилась</i>')
            return
        }

        const cards = this.getCards(ctx, game)

        cards.forEach(card => card.isTapped = status)

        const text = status ? `⤵️<b>${player.name}</b> закрыл карты ${cards.map(c => c.name).join(', ')}.` : `⤴️<b>${player.name}</b> открыл карты ${cards.map(c => c.name).join(', ')}.`
        this.redrawField(ctx, game, text)
    }

    public findGamePlayerByCtx(ctx: Context): IGamePlayer | undefined {
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

    private getCards(ctx: Context, game: IGame): IGameCard[] {
        const message = ctx.message as IMessage
        const text = message.text

        const cardCells = text.split(' ').slice(1).map(cell => cell.trim())
        const notFoundCells: string[] = []

        const cards = cardCells
            .map(cellName => {
                let card

                if (!cellName.startsWith('f')) {
                    const cellIndex = cellNames.findIndex(name => name === cellName)

                    const cardRow = Math.floor(cellIndex / 5)
                    const cardCell = cellIndex % 5

                    card = game.battleField[cardRow][cardCell]

                } else {
                    const flierIndex = Number(cellName.slice(1))

                    const playerIndex = Number(!(flierIndex < 4))
                    card = game.players[playerIndex].fliers[flierIndex - 1]
                }

                if (card == undefined) {
                    notFoundCells.push(cellName)
                    return null
                }

                return card
            })
            .filter(card => Boolean(card)) as IGameCard[]

        if (notFoundCells.length) {
            ctx.replyWithHTML(`🚫<i>Клетки/карты на клетках ${notFoundCells.join(', ')} не найдены.</i>`)
        }

        return cards
    }

    private async redrawField(ctx: Context, game: IGame, text: string) {
        game.room.players.concat(game.room.watchers).forEach(user => {
            ctx.telegram.sendMessage(user.id, '🔘Ожидайте загрузки поля.')
        })
        const fieldStream = await getField(game.battleField, game.players)

        game.room.players.concat(game.room.watchers).forEach(user => {

            if (user.id === game.currentPlayer?.id) {
                ctx.telegram.sendPhoto(user.id, { source: fieldStream }, {
                    caption: `Поле игры:\n\n${text}\n\nХодит: ${game.currentPlayer?.name}`, reply_markup: { inline_keyboard: [[Markup.button.callback('Передать ход🔜', 'pass-turn')]] }, parse_mode: 'HTML'
                })
            } else {
                ctx.telegram.sendPhoto(user.id, { source: fieldStream }, { caption: `Поле игры:\n\n${text}\n\nХодит: ${game.currentPlayer?.name}`, parse_mode: 'HTML' })
            }
        })
    }
}

function generateRandomRoomName(): string {
    const alph = 'abcdefghigklmnopqrstuvwxuzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    let subStr = ''

    while (subStr.length <= 10) {
        const idx = Math.floor(Math.random() * (alph.length - 1))
        const letter = alph[idx]

        subStr += letter
    }

    return `room${subStr}`
}

export function findRoomForUser(userId: number): IRoom | undefined {
    const curRoom: IRoom | undefined = rooms.find(r =>
        r.players.find(p => p.id === userId) !== undefined
        || r.watchers?.find(w => w.id === userId) !== undefined)

    return curRoom
}

function isPlayer(userId: number, room: IRoom): boolean {
    return room.players.findIndex(p => p.id === userId) !== -1
}

export const findPlayerById = (playerId: number): IPlayer | undefined => players.find(u => u.id === playerId)


const cellNames = [
    'a1',
    'a2',
    'a3',
    'a4',
    'a5',
    'b1',
    'b2',
    'b3',
    'b4',
    'b5',
    'c1',
    'c2',
    'c3',
    'c4',
    'c5',
    'd1',
    'd2',
    'd3',
    'd4',
    'd5',
    'e1',
    'e2',
    'e3',
    'e4',
    'e5',
    'g1',
    'g2',
    'g3',
    'g4',
    'g5'
]