import { FIT_CONSTANTS } from '.'
import { getArrayBuffer, getFitHeader, getFitCRC, getMessageHeader } from './binary'

const getDefinitionContent = (blob, offset) => {

    return []
}

const getFitMessages = (blob, fitHeader) => {
    var offset = fitHeader.size

    var definitionMessages = {}

    const messageHeader = getMessageHeader(blob[offset])

    if (messageHeader.type === FIT_CONSTANTS.types.message[1]) { //ToDo: Refactor consts
        offset++
        const definitionContent = getDefinitionContent(blob, offset)
        console.log(definitionContent)
    } else {

    }

    return []
}

export const parseFile = (filePath) => {
    const blob = getArrayBuffer(filePath)

    const fitHeader = getFitHeader(blob)
    const fitMessages = getFitMessages(blob, fitHeader)
    const fitCRC = getFitCRC(blob, fitHeader)

    return {
        header: fitHeader,
        messages: fitMessages,
        crc: fitCRC
    }
}