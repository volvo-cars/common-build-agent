import _ from 'lodash'
import { pino } from 'pino'

export interface Logger {
    info(msg: string, ...args: any[]): void
    debug(msg: string, ...args: any[]): void
    error(msg: string, ...args: any[]): void
    warn(msg: string, ...args: any[]): void
    business(type: string, msg: string): void
}

export const createLogger = (name?: string): Logger => {
    let definedName = name || "unknown"
    const logger = pino({
        level: 'debug',
        name: definedName
    })

    return {
        info: (msg: string, ...args: any[]): void => {
            logger.info(msg, ...args)
        },
        debug: (msg: string, ...args: any[]): void => {
            logger.debug(msg, ...args)
        },
        error: (msg: string, ...args: any[]): void => {
            logger.error(msg, ...args)
        },
        warn: (msg: string, ...args: any[]): void => {
            logger.warn(msg, ...args)
        },
        business: (type: string, msg: string): void => {
            console.log(`cb[${type}]: ${msg}`)
        }
    }
}

export const loggerName = (path: string, count: number = 1): string => {
    return _.takeRight(path.split('/'), count).join("/")
}


