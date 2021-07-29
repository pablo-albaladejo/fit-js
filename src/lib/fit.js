import { getArrayBuffer } from './binary'

const getFitHeader = (blob) => {
    const fitHeader = {
        size: null,
        protocolVersion: null,
        profileVersion: null,
        dataSize: null,
        dataType: null,
        crc: null,
    }

    /* 0 */
    fitHeader.size = blob[0];

    /* 1 */
    fitHeader.protocolVersion = blob[1];

    /* 2 - 3 */
    fitHeader.profileVersion = blob[2] + (blob[3] << 8);

    /* 4 - 7 */
    fitHeader.dataSize = blob[4] + (blob[5] << 8) + (blob[6] << 16) + (blob[7] << 24);

    /* 8 - 11 */
    let fileTypeString = '';
    for (let i = 8; i <= 11; i++) {
        fileTypeString += String.fromCharCode(blob[i]);
    }
    fitHeader.dataType = fileTypeString

    /* 12 - 13 */
    fitHeader.crc = blob[12] + (blob[13] << 8);
    
    return fitHeader
}

function calculateCRC(blob, start, end) {
    const crcTable = [
        0x0000, 0xCC01, 0xD801, 0x1400, 0xF001, 0x3C00, 0x2800, 0xE401,
        0xA001, 0x6C00, 0x7800, 0xB401, 0x5000, 0x9C01, 0x8801, 0x4400,
    ];

    let crc = 0;
    for (let i = start; i < end; i++) {
        const byte = blob[i];
        let tmp = crcTable[crc & 0xF];
        crc = (crc >> 4) & 0x0FFF;
        crc = crc ^ tmp ^ crcTable[byte & 0xF];
        tmp = crcTable[crc & 0xF];
        crc = (crc >> 4) & 0x0FFF;
        crc = crc ^ tmp ^ crcTable[(byte >> 4) & 0xF];
    }

    return crc;
}

const checkHeader = (fitHeader, crc) => {
    /* File type */
    console.log(`.FIT: ${fitHeader.dataType === '.FIT'}`)

    /* CRC */
    console.log(`CRC: ${fitHeader.crc === crc}`)
}

export const parseFile = (filePath) => {
    const blob = getArrayBuffer(filePath)
    const fitHeader = getFitHeader(blob)

    checkHeader(fitHeader, calculateCRC(blob, 0, 12))

    return {
        header: fitHeader,
        messages: null,
        crc: null
    }
}