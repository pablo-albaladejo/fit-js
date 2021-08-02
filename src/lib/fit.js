import util from 'util'
import { FIT_CONSTANTS } from '.'
import { getArrayBuffer, getFitHeader, getFitCRC, getMessageHeader, getDefinitionHeader, getDataValue, addEndian } from './binary'

const formatByType = (data, type, scale, offset) => {
    switch (type) {
        //case 'date_time': return new Date((data * 1000) + 631065600000);
        case 'sint32':
        case 'sint16':
            return data * FIT_CONSTANTS.scConst;
        default:
            if (FIT_CONSTANTS.types[type] && FIT_CONSTANTS.types[type][data] !== undefined) {
                return FIT_CONSTANTS.types[type][data];
            }
            return scale ? data / scale + offset : data;;
    }
}

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
            baseType: FIT_CONSTANTS.types.fit_base_type[message_type_base_type],
            littleEndian: defHeader.littleEndian
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
    var dataContent = []
    for (let definitionField of definition.fields) {
        const current = offset + innerOffset
        const buff = blob.subarray(current, current + definitionField.baseType.bytes)
        const dataValue = addEndian(definition.littleEndian, buff)
        dataContent.push(dataValue)

        innerOffset += definitionField.size
    }
    return {
        dataContent,
        innerOffset
    }
}

const createMessageRecord = (definition) => {
    return {
        fields: definition.fields,
        data: []
    }
}

const getFitMessages = (blob, fitHeader) => {
    const rawMessages = getRawFitMessages(blob, fitHeader)
    const cleanMessages = {}

    Object.keys(rawMessages).forEach((key) => {
        const rawMessage = rawMessages[key]

        cleanMessages[key] = {
            fields: [],
            data: rawMessage.data
        }
        rawMessage.fields.forEach((item, field_index) => {
            
            rawMessage.data.forEach(data_row => {
                data_row[field_index] = formatByType(data_row[field_index], item.type.type, item.type.scale, item.type.offset)
            })

            cleanMessages[key].fields.push({ name: item.type.field, units: item.type.units })
        })

    })

    console.log(util.inspect(cleanMessages, false, null, true /* enable colors */))
    return cleanMessages;
}


const getRawFitMessages = (blob, fitHeader) => {
    var offset = fitHeader.size
    var definitions = {}
    var messages = {}

    while (offset <= fitHeader.dataSize) {

        const messageHeader = getMessageHeader(blob[offset])
        offset++

        if (messageHeader.message === FIT_CONSTANTS.types.message[1]) {
            const {
                definitionContent,
                innerOffset
            } = getDefinitionContent(blob, offset, messageHeader.developer_flag)


            messages[definitionContent.name] = createMessageRecord(definitionContent)
            definitions[messageHeader.localType] = definitionContent


            offset += innerOffset
        } else {
            const definition = definitions[messageHeader.localType]

            const {
                dataContent,
                innerOffset
            } = getDataContent(blob, offset, messageHeader.developer_flag, definition)

            messages[definition.name].data.push(dataContent)
            offset += innerOffset
        }


    }

    //console.log(util.inspect(messages, false, null, true /* enable colors */))
    return messages
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