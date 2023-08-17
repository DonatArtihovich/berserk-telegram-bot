import nodeHtmlToImage from 'node-html-to-image'
import { Readable } from 'node:stream'
import { IGameCard, IGamePlayer } from '../game/game.types'
import fieldStyle from './field-style'

export async function getField(matrix: (IGameCard | null)[][], players: IGamePlayer[]) {
    // const image = 'https://berserk.ru/image/data/00_Berserk/01_Война%20стихий/Berserk_VS_all_card%20117-page-00001.jpg'
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
            ${await Promise.all(matrix.map((arr, index) =>
            new Promise(res => {

                Promise.all(arr.map((card, i) => getCard(card, null, index, i))).then(async (arr) =>
                    res(
                        `<tr>
                            ${await getLeftCell(index, players)}
                            ${arr.join('')}
                            ${await getRightCell(index, players)}
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

function getCard(card: IGameCard | null, name: null | string, arrIndex?: number, cellIndex?: number) {
    return new Promise(resolve => {

        let color: string;
        switch (card?.element.trim().toLowerCase()) {
            case 'степи':
                color = StatsColours.planes
                break;
            case 'леса':
                color = StatsColours.forests
                break;
            case 'горы':
                color = StatsColours.mountains
                break;
            case 'болота':
                color = StatsColours.swamp
                break;
            case 'тьма':
                color = StatsColours.darkness
                break;
            default:
                color = StatsColours.neutral
                break;
        }

        if (!card) {
            resolve(`<td><div class="cell-number">${name ? name : cellNames[`c${arrIndex as number * 5 + (cellIndex as number) + 1}`]}</div></td>`)
            return
        }

        let src = card.image
        let className = ''

        if (card.isTapped) className += 'tapped'
        if (card.isHidden) {
            src = 'https://sun9-49.userapi.com/impg/VkNvFosdvodyEPs1a0VYHYMc6Hn39xtPMeSUUQ/K6luO7j7B-I.jpg?size=495x700&quality=95&sign=34785b727068237a68703901161fcaf9&type=album'

            resolve(`
            <td>
                <div class="cell-number">${name ? name : cellNames[`c${arrIndex as number * 5 + (cellIndex as number) + 1}`]}</div>
                <div class="card-wrapper"><img src="${src}"></div>
            </td>`)
        }

        resolve(`
        <td>
            <div class="cell-number">${name ? name : cellNames[`c${arrIndex as number * 5 + (cellIndex as number) + 1}`]}</div>
            <div class="${className} card-wrapper">
                 <img src="${src}">
                 ${card.stats.walkCount.toLowerCase().trim() !== 'местность' ? `<div class="counter life-counter" style="background-color:${color}">${card.stats.lifeCount}</div>` : ''}
                 ${card.stats.walkCount.toLowerCase().trim() !== 'артефакт' && card.stats.walkCount.toLowerCase().trim() !== 'местность' ? `<div class="counter walk-counter" style="background-color:${color}">${card.stats.walkCount.trim().toLowerCase() === 'полет' ? '🕊' : card.stats.walkCount}</div>` : ''}
                 ${card.stats.walkCount.toLowerCase().trim() !== 'артефакт' && card.stats.walkCount.toLowerCase().trim() !== 'местность' ? `<div class="counter hit-counter" style="background-color:${color}">${card.stats.simpleHit}</div>` : ''}
                 <div class="counters">
                        ${card.poison ? `<div class="counter poison-counter">${card.poison}</div>` : ''}
                        ${card.chipsNumber ? `<div class="counter chip-counter">${card.chipsNumber}</div>` : ''}
                 </div>
            </div>
        </td>`)
    })
}

async function getRightCell(rowIndex: number, players: IGamePlayer[]) {
    switch (rowIndex) {
        case 0: return players[0].fliers[0] == undefined ? '<td><div class="cell-number">f1</div></td>' : await getCard(players[0].fliers[0], `f1`)
        case 1: return players[0].fliers[1] == undefined ? '<td><div class="cell-number">f2</div></td>' : await getCard(players[0].fliers[1], `f2`)
        case 2: return players[0].fliers[2] == undefined ? '<td><div class="cell-number">f3</div></td>' : await getCard(players[0].fliers[2], `f3`)
        case 3: return players[1].terrain ? '<td><div class="cell-number">t2</div></td>' : await getCard(players[1].terrain, `t2`)
        case 4: return players[0].grave[players[0].grave.length - 1] != undefined ? `<td><div class="card-wrapper"><img src="${players[0].grave[players[0].grave.length - 1].image}"></div></td>` : '<td></td>'
        case 5: return '<td><div class="card-wrapper"><img src="https://sun9-49.userapi.com/impg/VkNvFosdvodyEPs1a0VYHYMc6Hn39xtPMeSUUQ/K6luO7j7B-I.jpg?size=495x700&quality=95&sign=34785b727068237a68703901161fcaf9&type=album"></div></td>'
    }
}

async function getLeftCell(rowIndex: number, players: IGamePlayer[]) {
    switch (rowIndex) {
        case 0: return '<td><div class="card-wrapper"><img src="https://sun9-49.userapi.com/impg/VkNvFosdvodyEPs1a0VYHYMc6Hn39xtPMeSUUQ/K6luO7j7B-I.jpg?size=495x700&quality=95&sign=34785b727068237a68703901161fcaf9&type=album"></div></td>'
        case 1: return players[0].grave[players[1].grave.length - 1] != undefined ? `<td><div class="card-wrapper"><img src="${players[1].grave[players[1].grave.length - 1].image}"></div></td>` : '<td></td>'
        case 3: return players[0].terrain ? '<td><div class="cell-number">t1</div></td>' : await getCard(players[0].terrain, `t1`)
        case 3: return players[1].fliers[0] == undefined ? '<td><div class="cell-number">f4</div></td>' : await getCard(players[1].fliers[0], `f4`)
        case 4: return players[1].fliers[1] == undefined ? '<td><div class="cell-number">f5</div></td>' : await getCard(players[1].fliers[1], `f5`)
        case 5: return players[1].fliers[2] == undefined ? '<td><div class="cell-number">f6</div></td>' : await getCard(players[1].fliers[2], `f6`)
    }
}

enum StatsColours {
    planes = 'rgb(204, 127, 13)',
    forests = 'rgb(16, 168, 11)',
    mountains = 'rgb(18, 78, 168)',
    swamp = 'rgb(78, 133, 76)',
    darkness = 'rgb(162, 25, 255)',
    neutral = 'rgb(189, 23, 23)'
}

const cellNames: Record<string, string> = {
    c1: 'a1',
    c2: 'a2',
    c3: 'a3',
    c4: 'a4',
    c5: 'a5',
    c6: 'b1',
    c7: 'b2',
    c8: 'b3',
    c9: 'b4',
    c10: 'b5',
    c11: 'c1',
    c12: 'c2',
    c13: 'c3',
    c14: 'c4',
    c15: 'c5',
    c16: 'd1',
    c17: 'd2',
    c18: 'd3',
    c19: 'd4',
    c20: 'd5',
    c21: 'e1',
    c22: 'e2',
    c23: 'e3',
    c24: 'e4',
    c25: 'e5',
    c26: 'g1',
    c27: 'g2',
    c28: 'g3',
    c29: 'g4',
    c30: 'g5'
}
