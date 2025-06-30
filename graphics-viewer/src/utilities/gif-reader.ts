import { StreamReader } from './stream-reader';

export class GifReader {
    public static Read(dataURI: string): any[] {
        // Base64 encoded image data string to byte string
        const byteString: string = atob(dataURI.split(',')[1]);

        // write the bytes of the string to an ArrayBuffer
        const buffer: ArrayBuffer = new ArrayBuffer(byteString.length);
        const intArray: Uint8Array = new Uint8Array(buffer);
        for (let i: number = 0; i < byteString.length; i++) {
            intArray[i] = byteString.charCodeAt(i);
        }

        const frames: any[] = [];
        const streamReader: StreamReader = new StreamReader(buffer);

        // Ensure this is an animated GIF
        if (streamReader.readAscii(6) !== 'GIF89a') {
            return;
        }

        streamReader.skipBytes(4); // Height & Width
        if (streamReader.peekBit(1)) {
            streamReader.log('GLOBAL COLOR TABLE');
            // eslint-disable-next-line no-bitwise
            const colorTableSize: number = streamReader.readByte() & 0x07;
            streamReader.log('GLOBAL COLOR TABLE IS ' + 3 * Math.pow(2, colorTableSize + 1) + ' BYTES');
            streamReader.skipBytes(2);
            streamReader.skipBytes(3 * Math.pow(2, colorTableSize + 1));
        } else {
            streamReader.log('NO GLOBAL COLOR TABLE');
        }
        // WE HAVE ENOUGH FOR THE GIF HEADER!
        const gifHeader: any = buffer.slice(0, streamReader.index);

        let spinning: boolean = true;
        let expectingImage: boolean = false;
        while (spinning) {

            if (streamReader.isNext([0x21, 0xFF])) {
                streamReader.log('APPLICATION EXTENSION');
                streamReader.skipBytes(2);
                const blockSize: number = streamReader.readByte();
                streamReader.log(streamReader.readAscii(blockSize));

                if (streamReader.isNext([0x03, 0x01])) {
                    // we cool
                    streamReader.skipBytes(5);
                } else {
                    streamReader.log('A weird application extension. Skip until we have 2 NULL bytes');
                    while (!(streamReader.readByte() === 0 && streamReader.peekByte() === 0)) {
                        // TBD
                    }
                    streamReader.log('OK moving on');
                    streamReader.skipBytes(1);
                }
            } else if (streamReader.isNext([0x21, 0xFE])) {
                streamReader.log('COMMENT EXTENSION');
                streamReader.skipBytes(2);

                while (!streamReader.isNext([0x00])) {
                    const blockSize: number = streamReader.readByte();
                    streamReader.log(streamReader.readAscii(blockSize));
                }
                streamReader.skipBytes(1); // NULL terminator

            } else if (streamReader.isNext([0x2c])) {
                streamReader.log('IMAGE DESCRIPTOR!');
                if (!expectingImage) {
                    // This is a bare image, not prefaced with a Graphics Control Extension
                    // so we should treat it as a frame.
                    frames.push({ index: streamReader.index, delay: 0 });
                }
                expectingImage = false;

                streamReader.skipBytes(9);
                if (streamReader.peekBit(1)) {
                    streamReader.log('LOCAL COLOR TABLE');
                    // eslint-disable-next-line no-bitwise
                    const colorTableSize: number = streamReader.readByte() & 0x07;
                    streamReader.log('LOCAL COLOR TABLE IS ' + 3 * Math.pow(2, colorTableSize + 1) + ' BYTES');
                    streamReader.skipBytes(3 * Math.pow(2, colorTableSize + 1));
                } else {
                    streamReader.log('NO LOCAL TABLE PHEW');
                    streamReader.skipBytes(1);
                }

                streamReader.log('MIN CODE SIZE ' + streamReader.readByte());
                streamReader.log('DATA START');

                while (!streamReader.isNext([0x00])) {
                    const blockSize: number = streamReader.readByte();
                    // streamReader.log("SKIPPING " + blockSize + " BYTES");
                    streamReader.skipBytes(blockSize);
                }
                streamReader.log('DATA END');
                streamReader.skipBytes(1); // NULL terminator
            } else if (streamReader.isNext([0x21, 0xF9, 0x04])) {
                streamReader.log('GRAPHICS CONTROL EXTENSION!');
                // We _definitely_ have a frame. Now we're expecting an image
                const indexValue: number = streamReader.index;

                streamReader.skipBytes(3);
                // eslint-disable-next-line no-bitwise
                const disposalMethod: number = streamReader.readByte() >> 2;
                streamReader.log('DISPOSAL ' + disposalMethod);
                const delayValue: number = streamReader.readByte() + streamReader.readByte() * 256;
                frames.push({ index: indexValue, delay: delayValue, disposal: disposalMethod });
                streamReader.log('FRAME DELAY ' + delayValue);
                streamReader.skipBytes(2);
                expectingImage = true;
            } else {
                const maybeTheEnd: number = streamReader.index;
                while (!streamReader.finished() && !streamReader.isNext([0x21, 0xF9, 0x04])) {
                    streamReader.readByte();
                }
                if (streamReader.finished()) {
                    streamReader.index = maybeTheEnd;
                    streamReader.log('WE END');
                    spinning = false;
                } else {
                    streamReader.log('UNKNOWN DATA FROM ' + maybeTheEnd);
                }
            }
        }
        const endOfFrames: number = streamReader.index;

        const gifFooter: any = buffer.slice(-1); // last bit is all we need
        for (let i: number = 0; i < frames.length; i++) {
            const frame: any = frames[i];
            const nextIndex: number = (i < frames.length - 1) ? frames[i + 1].index : endOfFrames;
            frame.blob = new Blob([gifHeader, buffer.slice(frame.index, nextIndex), gifFooter], { type: 'image/gif' });
            frame.url = URL.createObjectURL(frame.blob);
        }

        return frames;
    }
}
