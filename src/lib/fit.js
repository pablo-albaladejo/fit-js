import { FIT_CONSTANTS } from '.'
import { getArrayBuffer, getFitHeader, getFitCRC, getMessageHeader, getBaseType, getDefinitionHeader } from './binary'

const getDefinitionContent = (blob, offset, devFlag) => {
    var innerOffset = 5
    var fields = []

    const defHeader = getDefinitionHeader(blob, offset)
    const message_type = FIT_CONSTANTS.messages[defHeader.globalMessageNumber]

    for (let i = 0; i < defHeader.numberOfFields; i++) {
        const message_type_field = blob[offset + innerOffset]
        const message_type_size = blob[offset + innerOffset + 1]
        const message_type_base_type = blob[offset + innerOffset + 2]

        fields.push({
            type: message_type[message_type_field],
            size: message_type_size,
            baseType: FIT_CONSTANTS.types.fit_base_type[message_type_base_type]
        })

        innerOffset += 3
    }

    if (devFlag) {
        console.log("ToDo: Dev definition fields") //ToDo: Dev definition fields
    }

    return {
        definitionContent: {
            name: message_type.name,
            fields
        },
        innerOffset
    }
}

const getDataContent = (blob, offset, devFlag, definition) => {
    var innerOffset = 0
    for (let i = 0; i < definition.fields.length; i++) {
        const field = definition.fields[i]
        innerOffset += field.baseType.bytes
    }
    return {
        dataContent: {},
        innerOffset
    }
}

const getFitMessages = (blob, fitHeader) => {
    var offset = fitHeader.size
    var entries = {}

    while (offset < fitHeader.dataSize) {

        const messageHeader = getMessageHeader(blob[offset])
        offset++

        if (messageHeader.message === FIT_CONSTANTS.types.message[1]) {
            const {
                definitionContent,
                innerOffset
            } = getDefinitionContent(blob, offset, messageHeader.developer_flag)

            entries[messageHeader.localType] = {
                definition: definitionContent,
                data: []
            }


            offset += innerOffset
        } else {
            const definition = entries[messageHeader.localType].definition

            const {
                dataContent,
                innerOffset
            } = getDataContent(blob, offset, messageHeader.developer_flag, definition)

            entries[messageHeader.localType].data.push(dataContent)
            offset += innerOffset
        }
        
        console.log(entries)
        console.log("---")
    }

    return []
}

export const parseFile = (filePath) => {
    const blob = getArrayBuffer(filePath)

    const fitHeader = getFitHeader(blob)
    const fitMessages = getFitMessages(blob, fitHeader)
    const fitCRC = getFitCRC(blob)

    return {
        header: fitHeader,
        messages: fitMessages,
        crc: fitCRC
    }
}