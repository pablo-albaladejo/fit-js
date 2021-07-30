import fs from 'fs'
import { FIT_CONSTANTS } from '.';

export const addEndian = (littleEndian, bytes) => {
    let result = 0;
    if (!littleEndian) bytes.reverse();
    for (let i = 0; i < bytes.length; i++) {
        result += (bytes[i] << (i << 3)) >>> 0;
    }

    return result;
}

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

export const getBaseType = (byte) => {
    return {

    }
}


export const getFitHeader = (blob) => {
    return {
        size: blob[0],                                                              /* 0 */
        protocolVersion: blob[1],                                                   /* 1 */
        profileVersion: blob[2] + (blob[3] << 8),                                   /* 2 - 3 */
        dataSize: blob[4] + (blob[5] << 8) + (blob[6] << 16) + (blob[7] << 24),     /* 4 - 7 */
        dataType: blob.subarray(8, 12)                                              /* 8 - 11 */
            .reduce((acc, cur) => { return acc + String.fromCharCode(cur) }, ""),
        crc: blob[12] + (blob[13] << 8),                                            /* 12 - 13 */
    }
}

export const getMessageHeader = (byte) => {
    return {
        compressed: FIT_CONSTANTS.types.compressed[(byte & 128) >> 7],  /* 7 -> 10000000 ->  */
        message: FIT_CONSTANTS.types.message[(byte & 64) >> 6],         /* 6 -> 01000000 -> 64 */
        developer_flag: (byte & 32) >> 5 === 1,                         /* 5 -> 00100000 -> 32 */
        reserved: (byte & 16) >> 4,                                     /* 4 -> 00010000 -> 16 */
        localType: (byte & 15)                                          /* 0 - 3 -> 00001111 -> 15 */
    }
}

export const getFitCRC = (blob) => {
    //checkCRC(fitCRC, calculateCRC(blob, fitHeader.size, fitHeader.size + fitHeader.dataSize))
    return blob[blob.length - 2] + (blob[blob.length - 1] << 8)
}

export const getDefinitionHeader = (blob, offset) => {
    const reserved = blob[offset]
    const littleEndian = blob[offset + 1] === 0
    const globalMessageNumber = addEndian(littleEndian, [blob[offset + 2], blob[offset + 3]])
    const numberOfFields = blob[offset + 4]

    return {
        reserved,
        littleEndian,
        globalMessageNumber,
        numberOfFields
    }
}