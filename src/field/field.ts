import nodeHtmlToImage from 'node-html-to-image'
import { Readable } from 'node:stream'
import { IGameCard } from '../game/game.types'
import fieldStyle from './field-style'

export async function getField(matrix: (IGameCard | null)[][]) {
    // const image = 'https://berserk.ru/image/data/00_Berserk/01_Война%20стихий/Berserk_VS_all_card%20117-page-00001.jpg'
    function getCard(card: IGameCard | null) {
        return new Promise(resolve => {

            if (!card) {
                resolve('<td></td>')
                return
            }

            let src = card.image
            let className = ''

            if (card.isTapped) className += 'tapped'
            if (card.isHidden) {
                src = 'https://sun9-49.userapi.com/impg/VkNvFosdvodyEPs1a0VYHYMc6Hn39xtPMeSUUQ/K6luO7j7B-I.jpg?size=495x700&quality=95&sign=34785b727068237a68703901161fcaf9&type=album'

                resolve(`<td><div class="card-wrapper"><img src="${src}"></div></td>`)
            }
            resolve(`
            <td>
                <div class="${className} card-wrapper">
                     <img src="${src}">
                     <div class="counter life-counter">${card.stats.lifeCount}</div>
                     <div class="counter walk-counter">${card.stats.walkCount.trim().toLowerCase() === 'полет' ? '🕊' : card.stats.walkCount}</div>
                     <div class="counter hit-counter">${card.stats.simpleHit}</div>
                </div>
            </td>`)
        })
    }
    console.time()
    const buffer = await nodeHtmlToImage({
        html: `<!DOCTYPE html>
        <html lang="en">
        
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Document</title>
        </head>
        
        <body>
            <table>
            ${await Promise.all(matrix.map((arr, i) =>
            new Promise(res => {

                Promise.all(arr.map(card => getCard(card))).then(arr =>
                    res(
                        `<tr>
                                <td></td>
                                ${arr.join('')}
                                <td></td>
                            </tr>`
                    ))
            }))).then(res => res.join(''))
            }
</table>
    <style> ${fieldStyle} </style>
        </body>
        </html>`
    })

    console.timeEnd()
    const stream = new Readable()

    stream.push(buffer)
    stream.push(null)

    return stream
}

