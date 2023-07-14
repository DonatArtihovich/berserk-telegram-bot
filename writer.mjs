import fs from 'node:fs'
import path from 'node:path'
import * as readline from 'node:readline'
import { fileURLToPath } from 'node:url'
const { stdout, stdin } = process
const __dirname = fileURLToPath(path.dirname(import.meta.url))
const PATH_TO_FILE = path.join(__dirname, './src/game/data.json')

const rl = readline.createInterface({ input: stdin, output: stdout })

const archive = []

async function manageInputs() {
    const name = await askData('имя карты')
    const cost = await askData('стоимость карты')
    const elite = await askData('элитность карты')
    const uniqueness = await askData('уникальность карты')
    const element = 'Горы'//await askData('стихию карты')
    const className = await askData('класс карты')
    const lifeCount = await askData('количество жизней карты')
    const walkCount = await askData('количество клеток хода карты')
    const simpleHit = await askData('простой удар карты')
    const abilities = await askData('особенности карты')
    const index = await askData('номер карты')
    const rarity = await askData('редкость карты')
    const description = await askData('описание карты')

    const cardData = {
        name,
        cost: Number(cost),
        elite: Boolean(elite),
        uniqueness: Boolean(uniqueness),
        element,
        class: className,
        stats: { lifeCount: Number(lifeCount), walkCount, simpleHit },
        abilities,
        rarity,
        index: Number(index),
        description
    }

    archive.push(cardData)
    console.log(archive)

    rl.question(`Do you want to continue? `, input => {
        if (input === '' || input.toLowerCase === 'y') manageInputs()
        else writeToFile(archive)
    })
}

async function askData(param) {
    return new Promise((resolve) => {
        rl.question(`Введите ${param}: `, (input) => {
            resolve(input)
        })
    })
}

async function writeToFile(data) {
    new Promise(async (resolve, reject) => {
        fs.access(PATH_TO_FILE, err => {
            if (err) {
                fs.writeFile(PATH_TO_FILE, JSON.stringify([]), err => {
                    if (err) throw err
                    else resolve(JSON.stringify([]))
                })
            } else {
                resolve(readJSONFile())
            }
        })
    }).then(json => {
        const arr = JSON.parse(json)
        const out = arr.concat(data).map(o => `{ "name": "${o.name}", "cost": ${o.cost}, "elite": ${o.elite},"uniqueness": ${o.uniqueness}, "element": "${o.element}","class":"${o.class == undefined ? '' : o.class}", "stats": {"lifeCount":${o.stats.lifeCount},"walkCount":"${o.stats.walkCount}","simpleHit":"${o.stats.simpleHit}"},"abilities": "${o.abilities.replaceAll('Защита от отравления', '🩸')}", "rarity": "${o.rarity}", "index": ${o.index}, "description": "${o.description}", "set": "Война стихий" }`)

        writeJSONFile(out)
    })
}

async function readJSONFile() {
    return new Promise((resolve) => {
        const readableStream = fs.createReadStream(PATH_TO_FILE, 'utf-8')
        let fileData = ''
        readableStream.on('data', data => {
            fileData += data
        })

        readableStream.on('end', () => {
            resolve(fileData)
        })
    })
}

async function writeJSONFile(data) {
    const writableStream = fs.createWriteStream(PATH_TO_FILE)
    await fs.truncate(PATH_TO_FILE, 0, () => { })

    writableStream.write(`[${data.join(', ')}]`)
    console.log('Карт добавлено: ', data.length)
    writableStream.on('close', () => process.exit())
}

manageInputs()