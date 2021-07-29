import fs from 'fs'

const toArrayBuffer = (buffer) => {
    var ab = new ArrayBuffer(buffer.length);
    var view = new Uint8Array(ab);
    for (var i = 0; i < buffer.length; ++i) {
        view[i] = buffer[i];
    }
    return ab;
}

export const getArrayBuffer = (filePath) => {
    var content = fs.readFileSync(filePath, null)
    return new Uint8Array(toArrayBuffer(content));

}

