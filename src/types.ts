import { KeyboardButton } from "telegraf/typings/core/types/typegram"

export interface IMessage {
    message_id: number
    from: {
        id: number
        is_bot: boolean
        first_name: string
        username: string
        language_code: string
    },
    chat: {
        id: number
        first_name: string
        username: string
        type: string
    },
    date: number
    text: string
    entities: IEntity[]
    reply_markup: Omit<any, any>
}

interface IEntity { offset: number, length: number, type: string }