import fs from 'fs'
import { FIT_CONSTANTS } from '.';

const CHECKS_ACTIVE = false

const toArrayBuffer = (buffer) => {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

export const calculateCRC = (blob, start, end) => {
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

export const getArrayBuffer = (filePath) => {
    var content = fs.readFileSync(filePath, null)
    return new Uint8Array(toArrayBuffer(content));

}

const checkCRC = (fitCRC, calculatedCRC) => {
    console.log("--- FILE CHECKS ---")
    console.log(`CRC: ${fitCRC === calculatedCRC}`)
}

const checkHeader = (fitHeader, crc) => {
    console.log("--- HEADER CHECKS ---")
    /* File type */
    console.log(`.FIT: ${fitHeader.dataType === '.FIT'}`)

    /* CRC */
    console.log(`CRC: ${fitHeader.crc === crc}`)
}

export const getFitHeader = (blob) => {
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

    CHECKS_ACTIVE && checkHeader(fitHeader, calculateCRC(blob, 0, 12))

    return fitHeader
}

export const getMessageHeader = (byteRecord) => {
    var messageHeader = {
        compressed: null,
        type: null,
        specific: null,
        reserved: null,
        localType: null
    }

    /* 7 -> 10000000 ->  */
    messageHeader.compressed = FIT_CONSTANTS.types.compressed[(byteRecord & 128) >> 7]

    /* 6 -> 01000000 -> 64 */
    messageHeader.type = FIT_CONSTANTS.types.message[(byteRecord & 64) >> 6]

    /* 5 -> 00100000 -> 32 */
    messageHeader.specific = (byteRecord & 32) >> 5

    /* 4 -> 00010000 -> 16 */
    messageHeader.reserved = (byteRecord & 16) >> 4

    /* 0 - 3 -> 00001111 -> 15 */
    messageHeader.localType = (byteRecord & 15)

    return messageHeader
}

export const getFitCRC = (blob, fitHeader) => {
    const fitCRC = blob[blob.length - 2] + (blob[blob.length - 1] << 8);

    CHECKS_ACTIVE && checkCRC(fitCRC, calculateCRC(blob, fitHeader.size, fitHeader.size + fitHeader.dataSize))

    return fitCRC
}