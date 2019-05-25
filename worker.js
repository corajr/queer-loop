(function () {
    'use strict';

    class BitMatrix {
        static createEmpty(width, height) {
            return new BitMatrix(new Uint8ClampedArray(width * height), width);
        }
        constructor(data, width) {
            this.width = width;
            this.height = data.length / width;
            this.data = data;
        }
        get(x, y) {
            if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
                return false;
            }
            return !!this.data[y * this.width + x];
        }
        set(x, y, v) {
            this.data[y * this.width + x] = v ? 1 : 0;
        }
        setRegion(left, top, width, height, v) {
            for (let y = top; y < top + height; y++) {
                for (let x = left; x < left + width; x++) {
                    this.set(x, y, !!v);
                }
            }
        }
    }

    const REGION_SIZE = 8;
    const MIN_DYNAMIC_RANGE = 24;
    function numBetween(value, min, max) {
        return value < min ? min : value > max ? max : value;
    }
    // Like BitMatrix but accepts arbitry Uint8 values
    class Matrix {
        constructor(width, height, buffer) {
            this.width = width;
            const bufferSize = width * height;
            if (buffer && buffer.length !== bufferSize) {
                throw new Error("Wrong buffer size");
            }
            this.data = buffer || new Uint8ClampedArray(bufferSize);
        }
        get(x, y) {
            return this.data[y * this.width + x];
        }
        set(x, y, value) {
            this.data[y * this.width + x] = value;
        }
    }
    function binarize(data, width, height, returnInverted, greyscaleWeights, canOverwriteImage) {
        const pixelCount = width * height;
        if (data.length !== pixelCount * 4) {
            throw new Error("Malformed data passed to binarizer.");
        }
        // assign the greyscale and binary image within the rgba buffer as the rgba image will not be needed after conversion
        let bufferOffset = 0;
        // Convert image to greyscale
        let greyscaleBuffer;
        if (canOverwriteImage) {
            greyscaleBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
            bufferOffset += pixelCount;
        }
        const greyscalePixels = new Matrix(width, height, greyscaleBuffer);
        if (greyscaleWeights.useIntegerApproximation) {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelPosition = (y * width + x) * 4;
                    const r = data[pixelPosition];
                    const g = data[pixelPosition + 1];
                    const b = data[pixelPosition + 2];
                    greyscalePixels.set(x, y, 
                    // tslint:disable-next-line no-bitwise
                    (greyscaleWeights.red * r + greyscaleWeights.green * g + greyscaleWeights.blue * b + 128) >> 8);
                }
            }
        }
        else {
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const pixelPosition = (y * width + x) * 4;
                    const r = data[pixelPosition];
                    const g = data[pixelPosition + 1];
                    const b = data[pixelPosition + 2];
                    greyscalePixels.set(x, y, greyscaleWeights.red * r + greyscaleWeights.green * g + greyscaleWeights.blue * b);
                }
            }
        }
        const horizontalRegionCount = Math.ceil(width / REGION_SIZE);
        const verticalRegionCount = Math.ceil(height / REGION_SIZE);
        const blackPointsCount = horizontalRegionCount * verticalRegionCount;
        let blackPointsBuffer;
        if (canOverwriteImage) {
            blackPointsBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, blackPointsCount);
            bufferOffset += blackPointsCount;
        }
        const blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount, blackPointsBuffer);
        for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
            for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
                let min = Infinity;
                let max = 0;
                for (let y = 0; y < REGION_SIZE; y++) {
                    for (let x = 0; x < REGION_SIZE; x++) {
                        const pixelLumosity = greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
                        min = Math.min(min, pixelLumosity);
                        max = Math.max(max, pixelLumosity);
                    }
                }
                // We could also compute the real average of all pixels but following the assumption that the qr code consists
                // of bright and dark pixels and essentially not much in between, by (min + max)/2 we make the cut really between
                // those two classes. If using the average over all pixel in a block of mostly bright pixels and few dark pixels,
                // the avg would tend to the bright side and darker bright pixels could be interpreted as dark.
                let average = (min + max) / 2;
                // Small bias towards black by moving the threshold up. We do this, as in the finder patterns white holes tend
                // to appear which makes them undetectable.
                const blackBias = 1.1;
                average = Math.min(255, average * blackBias);
                if (max - min <= MIN_DYNAMIC_RANGE) {
                    // If variation within the block is low, assume this is a block with only light or only
                    // dark pixels. In that case we do not want to use the average, as it would divide this
                    // low contrast area into black and white pixels, essentially creating data out of noise.
                    //
                    // Default the blackpoint for these blocks to be half the min - effectively white them out
                    average = min / 2;
                    if (verticalRegion > 0 && hortizontalRegion > 0) {
                        // Correct the "white background" assumption for blocks that have neighbors by comparing
                        // the pixels in this block to the previously calculated black points. This is based on
                        // the fact that dark barcode symbology is always surrounded by some amount of light
                        // background for which reasonable black point estimates were made. The bp estimated at
                        // the boundaries is used for the interior.
                        // The (min < bp) is arbitrary but works better than other heuristics that were tried.
                        const averageNeighborBlackPoint = (blackPoints.get(hortizontalRegion, verticalRegion - 1) +
                            (2 * blackPoints.get(hortizontalRegion - 1, verticalRegion)) +
                            blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)) / 4;
                        if (min < averageNeighborBlackPoint) {
                            average = averageNeighborBlackPoint; // no need to apply black bias as already applied to neighbors
                        }
                    }
                }
                blackPoints.set(hortizontalRegion, verticalRegion, average);
            }
        }
        let binarized;
        if (canOverwriteImage) {
            const binarizedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
            bufferOffset += pixelCount;
            binarized = new BitMatrix(binarizedBuffer, width);
        }
        else {
            binarized = BitMatrix.createEmpty(width, height);
        }
        let inverted = null;
        if (returnInverted) {
            if (canOverwriteImage) {
                const invertedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
                inverted = new BitMatrix(invertedBuffer, width);
            }
            else {
                inverted = BitMatrix.createEmpty(width, height);
            }
        }
        for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
            for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
                const left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
                const top = numBetween(verticalRegion, 2, verticalRegionCount - 3);
                let sum = 0;
                for (let xRegion = -2; xRegion <= 2; xRegion++) {
                    for (let yRegion = -2; yRegion <= 2; yRegion++) {
                        sum += blackPoints.get(left + xRegion, top + yRegion);
                    }
                }
                const threshold = sum / 25;
                for (let xRegion = 0; xRegion < REGION_SIZE; xRegion++) {
                    for (let yRegion = 0; yRegion < REGION_SIZE; yRegion++) {
                        const x = hortizontalRegion * REGION_SIZE + xRegion;
                        const y = verticalRegion * REGION_SIZE + yRegion;
                        const lum = greyscalePixels.get(x, y);
                        binarized.set(x, y, lum <= threshold);
                        if (returnInverted) {
                            inverted.set(x, y, !(lum <= threshold));
                        }
                    }
                }
            }
        }
        if (returnInverted) {
            return { binarized, inverted };
        }
        return { binarized };
    }

    // tslint:disable:no-bitwise
    class BitStream {
        constructor(bytes) {
            this.byteOffset = 0;
            this.bitOffset = 0;
            this.bytes = bytes;
        }
        readBits(numBits) {
            if (numBits < 1 || numBits > 32 || numBits > this.available()) {
                throw new Error("Cannot read " + numBits.toString() + " bits");
            }
            let result = 0;
            // First, read remainder from current byte
            if (this.bitOffset > 0) {
                const bitsLeft = 8 - this.bitOffset;
                const toRead = numBits < bitsLeft ? numBits : bitsLeft;
                const bitsToNotRead = bitsLeft - toRead;
                const mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
                result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
                numBits -= toRead;
                this.bitOffset += toRead;
                if (this.bitOffset === 8) {
                    this.bitOffset = 0;
                    this.byteOffset++;
                }
            }
            // Next read whole bytes
            if (numBits > 0) {
                while (numBits >= 8) {
                    result = (result << 8) | (this.bytes[this.byteOffset] & 0xFF);
                    this.byteOffset++;
                    numBits -= 8;
                }
                // Finally read a partial byte
                if (numBits > 0) {
                    const bitsToNotRead = 8 - numBits;
                    const mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
                    result = (result << numBits) | ((this.bytes[this.byteOffset] & mask) >> bitsToNotRead);
                    this.bitOffset += numBits;
                }
            }
            return result;
        }
        available() {
            return 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
        }
    }

    // tslint:disable:no-bitwise
    var Mode;
    (function (Mode) {
        Mode["Numeric"] = "numeric";
        Mode["Alphanumeric"] = "alphanumeric";
        Mode["Byte"] = "byte";
        Mode["Kanji"] = "kanji";
        Mode["ECI"] = "eci";
    })(Mode || (Mode = {}));
    var ModeByte;
    (function (ModeByte) {
        ModeByte[ModeByte["Terminator"] = 0] = "Terminator";
        ModeByte[ModeByte["Numeric"] = 1] = "Numeric";
        ModeByte[ModeByte["Alphanumeric"] = 2] = "Alphanumeric";
        ModeByte[ModeByte["Byte"] = 4] = "Byte";
        ModeByte[ModeByte["Kanji"] = 8] = "Kanji";
        ModeByte[ModeByte["ECI"] = 7] = "ECI";
        // StructuredAppend = 0x3,
        // FNC1FirstPosition = 0x5,
        // FNC1SecondPosition = 0x9,
    })(ModeByte || (ModeByte = {}));
    function decodeNumeric(stream, size) {
        const bytes = [];
        let text = "";
        const characterCountSize = [10, 12, 14][size];
        let length = stream.readBits(characterCountSize);
        // Read digits in groups of 3
        while (length >= 3) {
            const num = stream.readBits(10);
            if (num >= 1000) {
                throw new Error("Invalid numeric value above 999");
            }
            const a = Math.floor(num / 100);
            const b = Math.floor(num / 10) % 10;
            const c = num % 10;
            bytes.push(48 + a, 48 + b, 48 + c);
            text += a.toString() + b.toString() + c.toString();
            length -= 3;
        }
        // If the number of digits aren't a multiple of 3, the remaining digits are special cased.
        if (length === 2) {
            const num = stream.readBits(7);
            if (num >= 100) {
                throw new Error("Invalid numeric value above 99");
            }
            const a = Math.floor(num / 10);
            const b = num % 10;
            bytes.push(48 + a, 48 + b);
            text += a.toString() + b.toString();
        }
        else if (length === 1) {
            const num = stream.readBits(4);
            if (num >= 10) {
                throw new Error("Invalid numeric value above 9");
            }
            bytes.push(48 + num);
            text += num.toString();
        }
        return { bytes, text };
    }
    const AlphanumericCharacterCodes = [
        "0", "1", "2", "3", "4", "5", "6", "7", "8",
        "9", "A", "B", "C", "D", "E", "F", "G", "H",
        "I", "J", "K", "L", "M", "N", "O", "P", "Q",
        "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
        " ", "$", "%", "*", "+", "-", ".", "/", ":",
    ];
    function decodeAlphanumeric(stream, size) {
        const bytes = [];
        let text = "";
        const characterCountSize = [9, 11, 13][size];
        let length = stream.readBits(characterCountSize);
        while (length >= 2) {
            const v = stream.readBits(11);
            const a = Math.floor(v / 45);
            const b = v % 45;
            bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0), AlphanumericCharacterCodes[b].charCodeAt(0));
            text += AlphanumericCharacterCodes[a] + AlphanumericCharacterCodes[b];
            length -= 2;
        }
        if (length === 1) {
            const a = stream.readBits(6);
            bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0));
            text += AlphanumericCharacterCodes[a];
        }
        return { bytes, text };
    }
    function decodeByte(stream, size) {
        const bytes = [];
        let text = "";
        const characterCountSize = [8, 16, 16][size];
        const length = stream.readBits(characterCountSize);
        for (let i = 0; i < length; i++) {
            const b = stream.readBits(8);
            bytes.push(b);
        }
        try {
            text += decodeURIComponent(bytes.map(b => `%${("0" + b.toString(16)).substr(-2)}`).join(""));
        }
        catch (_a) {
            // failed to decode
        }
        return { bytes, text };
    }
    function decodeKanji(stream, size) {
        const bytes = [];
        const characterCountSize = [8, 10, 12][size];
        const length = stream.readBits(characterCountSize);
        for (let i = 0; i < length; i++) {
            const k = stream.readBits(13);
            let c = (Math.floor(k / 0xC0) << 8) | (k % 0xC0);
            if (c < 0x1F00) {
                c += 0x8140;
            }
            else {
                c += 0xC140;
            }
            bytes.push(c >> 8, c & 0xFF);
        }
        const text = new TextDecoder("shift-jis").decode(Uint8Array.from(bytes));
        return { bytes, text };
    }
    function decode(data, version) {
        const stream = new BitStream(data);
        // There are 3 'sizes' based on the version. 1-9 is small (0), 10-26 is medium (1) and 27-40 is large (2).
        const size = version <= 9 ? 0 : version <= 26 ? 1 : 2;
        const result = {
            text: "",
            bytes: [],
            chunks: [],
        };
        while (stream.available() >= 4) {
            const mode = stream.readBits(4);
            if (mode === ModeByte.Terminator) {
                return result;
            }
            else if (mode === ModeByte.ECI) {
                if (stream.readBits(1) === 0) {
                    result.chunks.push({
                        type: Mode.ECI,
                        assignmentNumber: stream.readBits(7),
                    });
                }
                else if (stream.readBits(1) === 0) {
                    result.chunks.push({
                        type: Mode.ECI,
                        assignmentNumber: stream.readBits(14),
                    });
                }
                else if (stream.readBits(1) === 0) {
                    result.chunks.push({
                        type: Mode.ECI,
                        assignmentNumber: stream.readBits(21),
                    });
                }
                else {
                    // ECI data seems corrupted
                    result.chunks.push({
                        type: Mode.ECI,
                        assignmentNumber: -1,
                    });
                }
            }
            else if (mode === ModeByte.Numeric) {
                const numericResult = decodeNumeric(stream, size);
                result.text += numericResult.text;
                result.bytes.push(...numericResult.bytes);
                result.chunks.push({
                    type: Mode.Numeric,
                    text: numericResult.text,
                });
            }
            else if (mode === ModeByte.Alphanumeric) {
                const alphanumericResult = decodeAlphanumeric(stream, size);
                result.text += alphanumericResult.text;
                result.bytes.push(...alphanumericResult.bytes);
                result.chunks.push({
                    type: Mode.Alphanumeric,
                    text: alphanumericResult.text,
                });
            }
            else if (mode === ModeByte.Byte) {
                const byteResult = decodeByte(stream, size);
                result.text += byteResult.text;
                result.bytes.push(...byteResult.bytes);
                result.chunks.push({
                    type: Mode.Byte,
                    bytes: byteResult.bytes,
                    text: byteResult.text,
                });
            }
            else if (mode === ModeByte.Kanji) {
                const kanjiResult = decodeKanji(stream, size);
                result.text += kanjiResult.text;
                result.bytes.push(...kanjiResult.bytes);
                result.chunks.push({
                    type: Mode.Kanji,
                    bytes: kanjiResult.bytes,
                    text: kanjiResult.text,
                });
            }
        }
        // If there is no data left, or the remaining bits are all 0, then that counts as a termination marker
        if (stream.available() === 0 || stream.readBits(stream.available()) === 0) {
            return result;
        }
    }

    class GenericGFPoly {
        constructor(field, coefficients) {
            if (coefficients.length === 0) {
                throw new Error("No coefficients.");
            }
            this.field = field;
            const coefficientsLength = coefficients.length;
            if (coefficientsLength > 1 && coefficients[0] === 0) {
                // Leading term must be non-zero for anything except the constant polynomial "0"
                let firstNonZero = 1;
                while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
                    firstNonZero++;
                }
                if (firstNonZero === coefficientsLength) {
                    this.coefficients = field.zero.coefficients;
                }
                else {
                    this.coefficients = new Uint8ClampedArray(coefficientsLength - firstNonZero);
                    for (let i = 0; i < this.coefficients.length; i++) {
                        this.coefficients[i] = coefficients[firstNonZero + i];
                    }
                }
            }
            else {
                this.coefficients = coefficients;
            }
        }
        degree() {
            return this.coefficients.length - 1;
        }
        isZero() {
            return this.coefficients[0] === 0;
        }
        getCoefficient(degree) {
            return this.coefficients[this.coefficients.length - 1 - degree];
        }
        addOrSubtract(other) {
            if (this.isZero()) {
                return other;
            }
            if (other.isZero()) {
                return this;
            }
            let smallerCoefficients = this.coefficients;
            let largerCoefficients = other.coefficients;
            if (smallerCoefficients.length > largerCoefficients.length) {
                [smallerCoefficients, largerCoefficients] = [largerCoefficients, smallerCoefficients];
            }
            const sumDiff = new Uint8ClampedArray(largerCoefficients.length);
            const lengthDiff = largerCoefficients.length - smallerCoefficients.length;
            for (let i = 0; i < lengthDiff; i++) {
                sumDiff[i] = largerCoefficients[i];
            }
            for (let i = lengthDiff; i < largerCoefficients.length; i++) {
                sumDiff[i] = addOrSubtractGF(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
            }
            return new GenericGFPoly(this.field, sumDiff);
        }
        multiply(scalar) {
            if (scalar === 0) {
                return this.field.zero;
            }
            if (scalar === 1) {
                return this;
            }
            const size = this.coefficients.length;
            const product = new Uint8ClampedArray(size);
            for (let i = 0; i < size; i++) {
                product[i] = this.field.multiply(this.coefficients[i], scalar);
            }
            return new GenericGFPoly(this.field, product);
        }
        multiplyPoly(other) {
            if (this.isZero() || other.isZero()) {
                return this.field.zero;
            }
            const aCoefficients = this.coefficients;
            const aLength = aCoefficients.length;
            const bCoefficients = other.coefficients;
            const bLength = bCoefficients.length;
            const product = new Uint8ClampedArray(aLength + bLength - 1);
            for (let i = 0; i < aLength; i++) {
                const aCoeff = aCoefficients[i];
                for (let j = 0; j < bLength; j++) {
                    product[i + j] = addOrSubtractGF(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
                }
            }
            return new GenericGFPoly(this.field, product);
        }
        multiplyByMonomial(degree, coefficient) {
            if (degree < 0) {
                throw new Error("Invalid degree less than 0");
            }
            if (coefficient === 0) {
                return this.field.zero;
            }
            const size = this.coefficients.length;
            const product = new Uint8ClampedArray(size + degree);
            for (let i = 0; i < size; i++) {
                product[i] = this.field.multiply(this.coefficients[i], coefficient);
            }
            return new GenericGFPoly(this.field, product);
        }
        evaluateAt(a) {
            let result = 0;
            if (a === 0) {
                // Just return the x^0 coefficient
                return this.getCoefficient(0);
            }
            const size = this.coefficients.length;
            if (a === 1) {
                // Just the sum of the coefficients
                this.coefficients.forEach((coefficient) => {
                    result = addOrSubtractGF(result, coefficient);
                });
                return result;
            }
            result = this.coefficients[0];
            for (let i = 1; i < size; i++) {
                result = addOrSubtractGF(this.field.multiply(a, result), this.coefficients[i]);
            }
            return result;
        }
    }

    function addOrSubtractGF(a, b) {
        return a ^ b; // tslint:disable-line:no-bitwise
    }
    class GenericGF {
        constructor(primitive, size, genBase) {
            this.primitive = primitive;
            this.size = size;
            this.generatorBase = genBase;
            this.expTable = new Array(this.size);
            this.logTable = new Array(this.size);
            let x = 1;
            for (let i = 0; i < this.size; i++) {
                this.expTable[i] = x;
                x = x * 2;
                if (x >= this.size) {
                    x = (x ^ this.primitive) & (this.size - 1); // tslint:disable-line:no-bitwise
                }
            }
            for (let i = 0; i < this.size - 1; i++) {
                this.logTable[this.expTable[i]] = i;
            }
            this.zero = new GenericGFPoly(this, Uint8ClampedArray.from([0]));
            this.one = new GenericGFPoly(this, Uint8ClampedArray.from([1]));
        }
        multiply(a, b) {
            if (a === 0 || b === 0) {
                return 0;
            }
            return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
        }
        inverse(a) {
            if (a === 0) {
                throw new Error("Can't invert 0");
            }
            return this.expTable[this.size - this.logTable[a] - 1];
        }
        buildMonomial(degree, coefficient) {
            if (degree < 0) {
                throw new Error("Invalid monomial degree less than 0");
            }
            if (coefficient === 0) {
                return this.zero;
            }
            const coefficients = new Uint8ClampedArray(degree + 1);
            coefficients[0] = coefficient;
            return new GenericGFPoly(this, coefficients);
        }
        log(a) {
            if (a === 0) {
                throw new Error("Can't take log(0)");
            }
            return this.logTable[a];
        }
        exp(a) {
            return this.expTable[a];
        }
    }

    function runEuclideanAlgorithm(field, a, b, R) {
        // Assume a's degree is >= b's
        if (a.degree() < b.degree()) {
            [a, b] = [b, a];
        }
        let rLast = a;
        let r = b;
        let tLast = field.zero;
        let t = field.one;
        // Run Euclidean algorithm until r's degree is less than R/2
        while (r.degree() >= R / 2) {
            const rLastLast = rLast;
            const tLastLast = tLast;
            rLast = r;
            tLast = t;
            // Divide rLastLast by rLast, with quotient in q and remainder in r
            if (rLast.isZero()) {
                // Euclidean algorithm already terminated?
                return null;
            }
            r = rLastLast;
            let q = field.zero;
            const denominatorLeadingTerm = rLast.getCoefficient(rLast.degree());
            const dltInverse = field.inverse(denominatorLeadingTerm);
            while (r.degree() >= rLast.degree() && !r.isZero()) {
                const degreeDiff = r.degree() - rLast.degree();
                const scale = field.multiply(r.getCoefficient(r.degree()), dltInverse);
                q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
                r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
            }
            t = q.multiplyPoly(tLast).addOrSubtract(tLastLast);
            if (r.degree() >= rLast.degree()) {
                return null;
            }
        }
        const sigmaTildeAtZero = t.getCoefficient(0);
        if (sigmaTildeAtZero === 0) {
            return null;
        }
        const inverse = field.inverse(sigmaTildeAtZero);
        return [t.multiply(inverse), r.multiply(inverse)];
    }
    function findErrorLocations(field, errorLocator) {
        // This is a direct application of Chien's search
        const numErrors = errorLocator.degree();
        if (numErrors === 1) {
            return [errorLocator.getCoefficient(1)];
        }
        const result = new Array(numErrors);
        let errorCount = 0;
        for (let i = 1; i < field.size && errorCount < numErrors; i++) {
            if (errorLocator.evaluateAt(i) === 0) {
                result[errorCount] = field.inverse(i);
                errorCount++;
            }
        }
        if (errorCount !== numErrors) {
            return null;
        }
        return result;
    }
    function findErrorMagnitudes(field, errorEvaluator, errorLocations) {
        // This is directly applying Forney's Formula
        const s = errorLocations.length;
        const result = new Array(s);
        for (let i = 0; i < s; i++) {
            const xiInverse = field.inverse(errorLocations[i]);
            let denominator = 1;
            for (let j = 0; j < s; j++) {
                if (i !== j) {
                    denominator = field.multiply(denominator, addOrSubtractGF(1, field.multiply(errorLocations[j], xiInverse)));
                }
            }
            result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse), field.inverse(denominator));
            if (field.generatorBase !== 0) {
                result[i] = field.multiply(result[i], xiInverse);
            }
        }
        return result;
    }
    function decode$1(bytes, twoS) {
        const outputBytes = new Uint8ClampedArray(bytes.length);
        outputBytes.set(bytes);
        const field = new GenericGF(0x011D, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
        const poly = new GenericGFPoly(field, outputBytes);
        const syndromeCoefficients = new Uint8ClampedArray(twoS);
        let error = false;
        for (let s = 0; s < twoS; s++) {
            const evaluation = poly.evaluateAt(field.exp(s + field.generatorBase));
            syndromeCoefficients[syndromeCoefficients.length - 1 - s] = evaluation;
            if (evaluation !== 0) {
                error = true;
            }
        }
        if (!error) {
            return outputBytes;
        }
        const syndrome = new GenericGFPoly(field, syndromeCoefficients);
        const sigmaOmega = runEuclideanAlgorithm(field, field.buildMonomial(twoS, 1), syndrome, twoS);
        if (sigmaOmega === null) {
            return null;
        }
        const errorLocations = findErrorLocations(field, sigmaOmega[0]);
        if (errorLocations == null) {
            return null;
        }
        const errorMagnitudes = findErrorMagnitudes(field, sigmaOmega[1], errorLocations);
        for (let i = 0; i < errorLocations.length; i++) {
            const position = outputBytes.length - 1 - field.log(errorLocations[i]);
            if (position < 0) {
                return null;
            }
            outputBytes[position] = addOrSubtractGF(outputBytes[position], errorMagnitudes[i]);
        }
        return outputBytes;
    }

    const VERSIONS = [
        {
            infoBits: null,
            versionNumber: 1,
            alignmentPatternCenters: [],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 7,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 19 }],
                },
                {
                    ecCodewordsPerBlock: 10,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
                },
                {
                    ecCodewordsPerBlock: 13,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 13 }],
                },
                {
                    ecCodewordsPerBlock: 17,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 9 }],
                },
            ],
        },
        {
            infoBits: null,
            versionNumber: 2,
            alignmentPatternCenters: [6, 18],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 10,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 34 }],
                },
                {
                    ecCodewordsPerBlock: 16,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 28 }],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 22 }],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
                },
            ],
        },
        {
            infoBits: null,
            versionNumber: 3,
            alignmentPatternCenters: [6, 22],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 15,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 55 }],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 44 }],
                },
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 17 }],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 13 }],
                },
            ],
        },
        {
            infoBits: null,
            versionNumber: 4,
            alignmentPatternCenters: [6, 26],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 20,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 80 }],
                },
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 32 }],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 24 }],
                },
                {
                    ecCodewordsPerBlock: 16,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 9 }],
                },
            ],
        },
        {
            infoBits: null,
            versionNumber: 5,
            alignmentPatternCenters: [6, 30],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 108 }],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 43 }],
                },
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 15 },
                        { numBlocks: 2, dataCodewordsPerBlock: 16 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 11 },
                        { numBlocks: 2, dataCodewordsPerBlock: 12 },
                    ],
                },
            ],
        },
        {
            infoBits: null,
            versionNumber: 6,
            alignmentPatternCenters: [6, 34],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 68 }],
                },
                {
                    ecCodewordsPerBlock: 16,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 27 }],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 19 }],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 15 }],
                },
            ],
        },
        {
            infoBits: 0x07C94,
            versionNumber: 7,
            alignmentPatternCenters: [6, 22, 38],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 20,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 78 }],
                },
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 31 }],
                },
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 14 },
                        { numBlocks: 4, dataCodewordsPerBlock: 15 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 13 },
                        { numBlocks: 1, dataCodewordsPerBlock: 14 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x085BC,
            versionNumber: 8,
            alignmentPatternCenters: [6, 24, 42],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 97 }],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 38 },
                        { numBlocks: 2, dataCodewordsPerBlock: 39 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 18 },
                        { numBlocks: 2, dataCodewordsPerBlock: 19 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 14 },
                        { numBlocks: 2, dataCodewordsPerBlock: 15 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x09A99,
            versionNumber: 9,
            alignmentPatternCenters: [6, 26, 46],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 116 }],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 36 },
                        { numBlocks: 2, dataCodewordsPerBlock: 37 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 20,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 16 },
                        { numBlocks: 4, dataCodewordsPerBlock: 17 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 12 },
                        { numBlocks: 4, dataCodewordsPerBlock: 13 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x0A4D3,
            versionNumber: 10,
            alignmentPatternCenters: [6, 28, 50],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 18,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 68 },
                        { numBlocks: 2, dataCodewordsPerBlock: 69 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 43 },
                        { numBlocks: 1, dataCodewordsPerBlock: 44 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 19 },
                        { numBlocks: 2, dataCodewordsPerBlock: 20 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 15 },
                        { numBlocks: 2, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x0BBF6,
            versionNumber: 11,
            alignmentPatternCenters: [6, 30, 54],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 20,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 81 }],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 1, dataCodewordsPerBlock: 50 },
                        { numBlocks: 4, dataCodewordsPerBlock: 51 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 22 },
                        { numBlocks: 4, dataCodewordsPerBlock: 23 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 12 },
                        { numBlocks: 8, dataCodewordsPerBlock: 13 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x0C762,
            versionNumber: 12,
            alignmentPatternCenters: [6, 32, 58],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 92 },
                        { numBlocks: 2, dataCodewordsPerBlock: 93 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 36 },
                        { numBlocks: 2, dataCodewordsPerBlock: 37 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 20 },
                        { numBlocks: 6, dataCodewordsPerBlock: 21 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 7, dataCodewordsPerBlock: 14 },
                        { numBlocks: 4, dataCodewordsPerBlock: 15 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x0D847,
            versionNumber: 13,
            alignmentPatternCenters: [6, 34, 62],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 107 }],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 8, dataCodewordsPerBlock: 37 },
                        { numBlocks: 1, dataCodewordsPerBlock: 38 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 8, dataCodewordsPerBlock: 20 },
                        { numBlocks: 4, dataCodewordsPerBlock: 21 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 12, dataCodewordsPerBlock: 11 },
                        { numBlocks: 4, dataCodewordsPerBlock: 12 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x0E60D,
            versionNumber: 14,
            alignmentPatternCenters: [6, 26, 46, 66],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 115 },
                        { numBlocks: 1, dataCodewordsPerBlock: 116 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 40 },
                        { numBlocks: 5, dataCodewordsPerBlock: 41 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 20,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 16 },
                        { numBlocks: 5, dataCodewordsPerBlock: 17 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 12 },
                        { numBlocks: 5, dataCodewordsPerBlock: 13 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x0F928,
            versionNumber: 15,
            alignmentPatternCenters: [6, 26, 48, 70],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 22,
                    ecBlocks: [
                        { numBlocks: 5, dataCodewordsPerBlock: 87 },
                        { numBlocks: 1, dataCodewordsPerBlock: 88 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 5, dataCodewordsPerBlock: 41 },
                        { numBlocks: 5, dataCodewordsPerBlock: 42 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 5, dataCodewordsPerBlock: 24 },
                        { numBlocks: 7, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 12 },
                        { numBlocks: 7, dataCodewordsPerBlock: 13 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x10B78,
            versionNumber: 16,
            alignmentPatternCenters: [6, 26, 50, 74],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 5, dataCodewordsPerBlock: 98 },
                        { numBlocks: 1, dataCodewordsPerBlock: 99 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 7, dataCodewordsPerBlock: 45 },
                        { numBlocks: 3, dataCodewordsPerBlock: 46 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [
                        { numBlocks: 15, dataCodewordsPerBlock: 19 },
                        { numBlocks: 2, dataCodewordsPerBlock: 20 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 15 },
                        { numBlocks: 13, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1145D,
            versionNumber: 17,
            alignmentPatternCenters: [6, 30, 54, 78],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 1, dataCodewordsPerBlock: 107 },
                        { numBlocks: 5, dataCodewordsPerBlock: 108 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 10, dataCodewordsPerBlock: 46 },
                        { numBlocks: 1, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 1, dataCodewordsPerBlock: 22 },
                        { numBlocks: 15, dataCodewordsPerBlock: 23 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 14 },
                        { numBlocks: 17, dataCodewordsPerBlock: 15 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x12A17,
            versionNumber: 18,
            alignmentPatternCenters: [6, 30, 56, 82],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 5, dataCodewordsPerBlock: 120 },
                        { numBlocks: 1, dataCodewordsPerBlock: 121 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 9, dataCodewordsPerBlock: 43 },
                        { numBlocks: 4, dataCodewordsPerBlock: 44 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 17, dataCodewordsPerBlock: 22 },
                        { numBlocks: 1, dataCodewordsPerBlock: 23 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 14 },
                        { numBlocks: 19, dataCodewordsPerBlock: 15 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x13532,
            versionNumber: 19,
            alignmentPatternCenters: [6, 30, 58, 86],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 113 },
                        { numBlocks: 4, dataCodewordsPerBlock: 114 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 44 },
                        { numBlocks: 11, dataCodewordsPerBlock: 45 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 17, dataCodewordsPerBlock: 21 },
                        { numBlocks: 4, dataCodewordsPerBlock: 22 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 9, dataCodewordsPerBlock: 13 },
                        { numBlocks: 16, dataCodewordsPerBlock: 14 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x149A6,
            versionNumber: 20,
            alignmentPatternCenters: [6, 34, 62, 90],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 107 },
                        { numBlocks: 5, dataCodewordsPerBlock: 108 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 41 },
                        { numBlocks: 13, dataCodewordsPerBlock: 42 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 15, dataCodewordsPerBlock: 24 },
                        { numBlocks: 5, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 15, dataCodewordsPerBlock: 15 },
                        { numBlocks: 10, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x15683,
            versionNumber: 21,
            alignmentPatternCenters: [6, 28, 50, 72, 94],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 116 },
                        { numBlocks: 4, dataCodewordsPerBlock: 117 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 42 }],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 17, dataCodewordsPerBlock: 22 },
                        { numBlocks: 6, dataCodewordsPerBlock: 23 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 19, dataCodewordsPerBlock: 16 },
                        { numBlocks: 6, dataCodewordsPerBlock: 17 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x168C9,
            versionNumber: 22,
            alignmentPatternCenters: [6, 26, 50, 74, 98],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 111 },
                        { numBlocks: 7, dataCodewordsPerBlock: 112 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 46 }],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 7, dataCodewordsPerBlock: 24 },
                        { numBlocks: 16, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 24,
                    ecBlocks: [{ numBlocks: 34, dataCodewordsPerBlock: 13 }],
                },
            ],
        },
        {
            infoBits: 0x177EC,
            versionNumber: 23,
            alignmentPatternCenters: [6, 30, 54, 74, 102],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 121 },
                        { numBlocks: 5, dataCodewordsPerBlock: 122 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 47 },
                        { numBlocks: 14, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 24 },
                        { numBlocks: 14, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 16, dataCodewordsPerBlock: 15 },
                        { numBlocks: 14, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x18EC4,
            versionNumber: 24,
            alignmentPatternCenters: [6, 28, 54, 80, 106],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 117 },
                        { numBlocks: 4, dataCodewordsPerBlock: 118 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 45 },
                        { numBlocks: 14, dataCodewordsPerBlock: 46 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 24 },
                        { numBlocks: 16, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 30, dataCodewordsPerBlock: 16 },
                        { numBlocks: 2, dataCodewordsPerBlock: 17 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x191E1,
            versionNumber: 25,
            alignmentPatternCenters: [6, 32, 58, 84, 110],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 26,
                    ecBlocks: [
                        { numBlocks: 8, dataCodewordsPerBlock: 106 },
                        { numBlocks: 4, dataCodewordsPerBlock: 107 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 8, dataCodewordsPerBlock: 47 },
                        { numBlocks: 13, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 7, dataCodewordsPerBlock: 24 },
                        { numBlocks: 22, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 22, dataCodewordsPerBlock: 15 },
                        { numBlocks: 13, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1AFAB,
            versionNumber: 26,
            alignmentPatternCenters: [6, 30, 58, 86, 114],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 10, dataCodewordsPerBlock: 114 },
                        { numBlocks: 2, dataCodewordsPerBlock: 115 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 19, dataCodewordsPerBlock: 46 },
                        { numBlocks: 4, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 28, dataCodewordsPerBlock: 22 },
                        { numBlocks: 6, dataCodewordsPerBlock: 23 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 33, dataCodewordsPerBlock: 16 },
                        { numBlocks: 4, dataCodewordsPerBlock: 17 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1B08E,
            versionNumber: 27,
            alignmentPatternCenters: [6, 34, 62, 90, 118],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 8, dataCodewordsPerBlock: 122 },
                        { numBlocks: 4, dataCodewordsPerBlock: 123 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 22, dataCodewordsPerBlock: 45 },
                        { numBlocks: 3, dataCodewordsPerBlock: 46 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 8, dataCodewordsPerBlock: 23 },
                        { numBlocks: 26, dataCodewordsPerBlock: 24 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 12, dataCodewordsPerBlock: 15 },
                        { numBlocks: 28, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1CC1A,
            versionNumber: 28,
            alignmentPatternCenters: [6, 26, 50, 74, 98, 122],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 117 },
                        { numBlocks: 10, dataCodewordsPerBlock: 118 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 3, dataCodewordsPerBlock: 45 },
                        { numBlocks: 23, dataCodewordsPerBlock: 46 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 24 },
                        { numBlocks: 31, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 15 },
                        { numBlocks: 31, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1D33F,
            versionNumber: 29,
            alignmentPatternCenters: [6, 30, 54, 78, 102, 126],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 7, dataCodewordsPerBlock: 116 },
                        { numBlocks: 7, dataCodewordsPerBlock: 117 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 21, dataCodewordsPerBlock: 45 },
                        { numBlocks: 7, dataCodewordsPerBlock: 46 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 1, dataCodewordsPerBlock: 23 },
                        { numBlocks: 37, dataCodewordsPerBlock: 24 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 19, dataCodewordsPerBlock: 15 },
                        { numBlocks: 26, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1ED75,
            versionNumber: 30,
            alignmentPatternCenters: [6, 26, 52, 78, 104, 130],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 5, dataCodewordsPerBlock: 115 },
                        { numBlocks: 10, dataCodewordsPerBlock: 116 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 19, dataCodewordsPerBlock: 47 },
                        { numBlocks: 10, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 15, dataCodewordsPerBlock: 24 },
                        { numBlocks: 25, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 23, dataCodewordsPerBlock: 15 },
                        { numBlocks: 25, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x1F250,
            versionNumber: 31,
            alignmentPatternCenters: [6, 30, 56, 82, 108, 134],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 13, dataCodewordsPerBlock: 115 },
                        { numBlocks: 3, dataCodewordsPerBlock: 116 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 46 },
                        { numBlocks: 29, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 42, dataCodewordsPerBlock: 24 },
                        { numBlocks: 1, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 23, dataCodewordsPerBlock: 15 },
                        { numBlocks: 28, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x209D5,
            versionNumber: 32,
            alignmentPatternCenters: [6, 34, 60, 86, 112, 138],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 115 }],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 10, dataCodewordsPerBlock: 46 },
                        { numBlocks: 23, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 10, dataCodewordsPerBlock: 24 },
                        { numBlocks: 35, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 19, dataCodewordsPerBlock: 15 },
                        { numBlocks: 35, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x216F0,
            versionNumber: 33,
            alignmentPatternCenters: [6, 30, 58, 86, 114, 142],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 17, dataCodewordsPerBlock: 115 },
                        { numBlocks: 1, dataCodewordsPerBlock: 116 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 14, dataCodewordsPerBlock: 46 },
                        { numBlocks: 21, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 29, dataCodewordsPerBlock: 24 },
                        { numBlocks: 19, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 11, dataCodewordsPerBlock: 15 },
                        { numBlocks: 46, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x228BA,
            versionNumber: 34,
            alignmentPatternCenters: [6, 34, 62, 90, 118, 146],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 13, dataCodewordsPerBlock: 115 },
                        { numBlocks: 6, dataCodewordsPerBlock: 116 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 14, dataCodewordsPerBlock: 46 },
                        { numBlocks: 23, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 44, dataCodewordsPerBlock: 24 },
                        { numBlocks: 7, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 59, dataCodewordsPerBlock: 16 },
                        { numBlocks: 1, dataCodewordsPerBlock: 17 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x2379F,
            versionNumber: 35,
            alignmentPatternCenters: [6, 30, 54, 78, 102, 126, 150],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 12, dataCodewordsPerBlock: 121 },
                        { numBlocks: 7, dataCodewordsPerBlock: 122 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 12, dataCodewordsPerBlock: 47 },
                        { numBlocks: 26, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 39, dataCodewordsPerBlock: 24 },
                        { numBlocks: 14, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 22, dataCodewordsPerBlock: 15 },
                        { numBlocks: 41, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x24B0B,
            versionNumber: 36,
            alignmentPatternCenters: [6, 24, 50, 76, 102, 128, 154],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 121 },
                        { numBlocks: 14, dataCodewordsPerBlock: 122 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 6, dataCodewordsPerBlock: 47 },
                        { numBlocks: 34, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 46, dataCodewordsPerBlock: 24 },
                        { numBlocks: 10, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 2, dataCodewordsPerBlock: 15 },
                        { numBlocks: 64, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x2542E,
            versionNumber: 37,
            alignmentPatternCenters: [6, 28, 54, 80, 106, 132, 158],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 17, dataCodewordsPerBlock: 122 },
                        { numBlocks: 4, dataCodewordsPerBlock: 123 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 29, dataCodewordsPerBlock: 46 },
                        { numBlocks: 14, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 49, dataCodewordsPerBlock: 24 },
                        { numBlocks: 10, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 24, dataCodewordsPerBlock: 15 },
                        { numBlocks: 46, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x26A64,
            versionNumber: 38,
            alignmentPatternCenters: [6, 32, 58, 84, 110, 136, 162],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 4, dataCodewordsPerBlock: 122 },
                        { numBlocks: 18, dataCodewordsPerBlock: 123 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 13, dataCodewordsPerBlock: 46 },
                        { numBlocks: 32, dataCodewordsPerBlock: 47 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 48, dataCodewordsPerBlock: 24 },
                        { numBlocks: 14, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 42, dataCodewordsPerBlock: 15 },
                        { numBlocks: 32, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x27541,
            versionNumber: 39,
            alignmentPatternCenters: [6, 26, 54, 82, 110, 138, 166],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 20, dataCodewordsPerBlock: 117 },
                        { numBlocks: 4, dataCodewordsPerBlock: 118 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 40, dataCodewordsPerBlock: 47 },
                        { numBlocks: 7, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 43, dataCodewordsPerBlock: 24 },
                        { numBlocks: 22, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 10, dataCodewordsPerBlock: 15 },
                        { numBlocks: 67, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
        {
            infoBits: 0x28C69,
            versionNumber: 40,
            alignmentPatternCenters: [6, 30, 58, 86, 114, 142, 170],
            errorCorrectionLevels: [
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 19, dataCodewordsPerBlock: 118 },
                        { numBlocks: 6, dataCodewordsPerBlock: 119 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 28,
                    ecBlocks: [
                        { numBlocks: 18, dataCodewordsPerBlock: 47 },
                        { numBlocks: 31, dataCodewordsPerBlock: 48 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 34, dataCodewordsPerBlock: 24 },
                        { numBlocks: 34, dataCodewordsPerBlock: 25 },
                    ],
                },
                {
                    ecCodewordsPerBlock: 30,
                    ecBlocks: [
                        { numBlocks: 20, dataCodewordsPerBlock: 15 },
                        { numBlocks: 61, dataCodewordsPerBlock: 16 },
                    ],
                },
            ],
        },
    ];

    // tslint:disable:no-bitwise
    function numBitsDiffering(x, y) {
        let z = x ^ y;
        let bitCount = 0;
        while (z) {
            bitCount++;
            z &= z - 1;
        }
        return bitCount;
    }
    function pushBit(bit, byte) {
        return (byte << 1) | bit;
    }
    // tslint:enable:no-bitwise
    const FORMAT_INFO_TABLE = [
        { bits: 0x5412, formatInfo: { errorCorrectionLevel: 1, dataMask: 0 } },
        { bits: 0x5125, formatInfo: { errorCorrectionLevel: 1, dataMask: 1 } },
        { bits: 0x5E7C, formatInfo: { errorCorrectionLevel: 1, dataMask: 2 } },
        { bits: 0x5B4B, formatInfo: { errorCorrectionLevel: 1, dataMask: 3 } },
        { bits: 0x45F9, formatInfo: { errorCorrectionLevel: 1, dataMask: 4 } },
        { bits: 0x40CE, formatInfo: { errorCorrectionLevel: 1, dataMask: 5 } },
        { bits: 0x4F97, formatInfo: { errorCorrectionLevel: 1, dataMask: 6 } },
        { bits: 0x4AA0, formatInfo: { errorCorrectionLevel: 1, dataMask: 7 } },
        { bits: 0x77C4, formatInfo: { errorCorrectionLevel: 0, dataMask: 0 } },
        { bits: 0x72F3, formatInfo: { errorCorrectionLevel: 0, dataMask: 1 } },
        { bits: 0x7DAA, formatInfo: { errorCorrectionLevel: 0, dataMask: 2 } },
        { bits: 0x789D, formatInfo: { errorCorrectionLevel: 0, dataMask: 3 } },
        { bits: 0x662F, formatInfo: { errorCorrectionLevel: 0, dataMask: 4 } },
        { bits: 0x6318, formatInfo: { errorCorrectionLevel: 0, dataMask: 5 } },
        { bits: 0x6C41, formatInfo: { errorCorrectionLevel: 0, dataMask: 6 } },
        { bits: 0x6976, formatInfo: { errorCorrectionLevel: 0, dataMask: 7 } },
        { bits: 0x1689, formatInfo: { errorCorrectionLevel: 3, dataMask: 0 } },
        { bits: 0x13BE, formatInfo: { errorCorrectionLevel: 3, dataMask: 1 } },
        { bits: 0x1CE7, formatInfo: { errorCorrectionLevel: 3, dataMask: 2 } },
        { bits: 0x19D0, formatInfo: { errorCorrectionLevel: 3, dataMask: 3 } },
        { bits: 0x0762, formatInfo: { errorCorrectionLevel: 3, dataMask: 4 } },
        { bits: 0x0255, formatInfo: { errorCorrectionLevel: 3, dataMask: 5 } },
        { bits: 0x0D0C, formatInfo: { errorCorrectionLevel: 3, dataMask: 6 } },
        { bits: 0x083B, formatInfo: { errorCorrectionLevel: 3, dataMask: 7 } },
        { bits: 0x355F, formatInfo: { errorCorrectionLevel: 2, dataMask: 0 } },
        { bits: 0x3068, formatInfo: { errorCorrectionLevel: 2, dataMask: 1 } },
        { bits: 0x3F31, formatInfo: { errorCorrectionLevel: 2, dataMask: 2 } },
        { bits: 0x3A06, formatInfo: { errorCorrectionLevel: 2, dataMask: 3 } },
        { bits: 0x24B4, formatInfo: { errorCorrectionLevel: 2, dataMask: 4 } },
        { bits: 0x2183, formatInfo: { errorCorrectionLevel: 2, dataMask: 5 } },
        { bits: 0x2EDA, formatInfo: { errorCorrectionLevel: 2, dataMask: 6 } },
        { bits: 0x2BED, formatInfo: { errorCorrectionLevel: 2, dataMask: 7 } },
    ];
    const DATA_MASKS = [
        (p) => ((p.y + p.x) % 2) === 0,
        (p) => (p.y % 2) === 0,
        (p) => p.x % 3 === 0,
        (p) => (p.y + p.x) % 3 === 0,
        (p) => (Math.floor(p.y / 2) + Math.floor(p.x / 3)) % 2 === 0,
        (p) => ((p.x * p.y) % 2) + ((p.x * p.y) % 3) === 0,
        (p) => ((((p.y * p.x) % 2) + (p.y * p.x) % 3) % 2) === 0,
        (p) => ((((p.y + p.x) % 2) + (p.y * p.x) % 3) % 2) === 0,
    ];
    function buildFunctionPatternMask(version) {
        const dimension = 17 + 4 * version.versionNumber;
        const matrix = BitMatrix.createEmpty(dimension, dimension);
        matrix.setRegion(0, 0, 9, 9, true); // Top left finder pattern + separator + format
        matrix.setRegion(dimension - 8, 0, 8, 9, true); // Top right finder pattern + separator + format
        matrix.setRegion(0, dimension - 8, 9, 8, true); // Bottom left finder pattern + separator + format
        // Alignment patterns
        for (const x of version.alignmentPatternCenters) {
            for (const y of version.alignmentPatternCenters) {
                if (!(x === 6 && y === 6 || x === 6 && y === dimension - 7 || x === dimension - 7 && y === 6)) {
                    matrix.setRegion(x - 2, y - 2, 5, 5, true);
                }
            }
        }
        matrix.setRegion(6, 9, 1, dimension - 17, true); // Vertical timing pattern
        matrix.setRegion(9, 6, dimension - 17, 1, true); // Horizontal timing pattern
        if (version.versionNumber > 6) {
            matrix.setRegion(dimension - 11, 0, 3, 6, true); // Version info, top right
            matrix.setRegion(0, dimension - 11, 6, 3, true); // Version info, bottom left
        }
        return matrix;
    }
    function readCodewords(matrix, version, formatInfo) {
        const dataMask = DATA_MASKS[formatInfo.dataMask];
        const dimension = matrix.height;
        const functionPatternMask = buildFunctionPatternMask(version);
        const codewords = [];
        let currentByte = 0;
        let bitsRead = 0;
        // Read columns in pairs, from right to left
        let readingUp = true;
        for (let columnIndex = dimension - 1; columnIndex > 0; columnIndex -= 2) {
            if (columnIndex === 6) { // Skip whole column with vertical alignment pattern;
                columnIndex--;
            }
            for (let i = 0; i < dimension; i++) {
                const y = readingUp ? dimension - 1 - i : i;
                for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
                    const x = columnIndex - columnOffset;
                    if (!functionPatternMask.get(x, y)) {
                        bitsRead++;
                        let bit = matrix.get(x, y);
                        if (dataMask({ y, x })) {
                            bit = !bit;
                        }
                        currentByte = pushBit(bit, currentByte);
                        if (bitsRead === 8) { // Whole bytes
                            codewords.push(currentByte);
                            bitsRead = 0;
                            currentByte = 0;
                        }
                    }
                }
            }
            readingUp = !readingUp;
        }
        return codewords;
    }
    function readVersion(matrix) {
        const dimension = matrix.height;
        const provisionalVersion = Math.floor((dimension - 17) / 4);
        if (provisionalVersion <= 6) { // 6 and under dont have version info in the QR code
            return VERSIONS[provisionalVersion - 1];
        }
        let topRightVersionBits = 0;
        for (let y = 5; y >= 0; y--) {
            for (let x = dimension - 9; x >= dimension - 11; x--) {
                topRightVersionBits = pushBit(matrix.get(x, y), topRightVersionBits);
            }
        }
        let bottomLeftVersionBits = 0;
        for (let x = 5; x >= 0; x--) {
            for (let y = dimension - 9; y >= dimension - 11; y--) {
                bottomLeftVersionBits = pushBit(matrix.get(x, y), bottomLeftVersionBits);
            }
        }
        let bestDifference = Infinity;
        let bestVersion;
        for (const version of VERSIONS) {
            if (version.infoBits === topRightVersionBits || version.infoBits === bottomLeftVersionBits) {
                return version;
            }
            let difference = numBitsDiffering(topRightVersionBits, version.infoBits);
            if (difference < bestDifference) {
                bestVersion = version;
                bestDifference = difference;
            }
            difference = numBitsDiffering(bottomLeftVersionBits, version.infoBits);
            if (difference < bestDifference) {
                bestVersion = version;
                bestDifference = difference;
            }
        }
        // We can tolerate up to 3 bits of error since no two version info codewords will
        // differ in less than 8 bits.
        if (bestDifference <= 3) {
            return bestVersion;
        }
    }
    function readFormatInformation(matrix) {
        let topLeftFormatInfoBits = 0;
        for (let x = 0; x <= 8; x++) {
            if (x !== 6) { // Skip timing pattern bit
                topLeftFormatInfoBits = pushBit(matrix.get(x, 8), topLeftFormatInfoBits);
            }
        }
        for (let y = 7; y >= 0; y--) {
            if (y !== 6) { // Skip timing pattern bit
                topLeftFormatInfoBits = pushBit(matrix.get(8, y), topLeftFormatInfoBits);
            }
        }
        const dimension = matrix.height;
        let topRightBottomRightFormatInfoBits = 0;
        for (let y = dimension - 1; y >= dimension - 7; y--) { // bottom left
            topRightBottomRightFormatInfoBits = pushBit(matrix.get(8, y), topRightBottomRightFormatInfoBits);
        }
        for (let x = dimension - 8; x < dimension; x++) { // top right
            topRightBottomRightFormatInfoBits = pushBit(matrix.get(x, 8), topRightBottomRightFormatInfoBits);
        }
        let bestDifference = Infinity;
        let bestFormatInfo = null;
        for (const { bits, formatInfo } of FORMAT_INFO_TABLE) {
            if (bits === topLeftFormatInfoBits || bits === topRightBottomRightFormatInfoBits) {
                return formatInfo;
            }
            let difference = numBitsDiffering(topLeftFormatInfoBits, bits);
            if (difference < bestDifference) {
                bestFormatInfo = formatInfo;
                bestDifference = difference;
            }
            if (topLeftFormatInfoBits !== topRightBottomRightFormatInfoBits) { // also try the other option
                difference = numBitsDiffering(topRightBottomRightFormatInfoBits, bits);
                if (difference < bestDifference) {
                    bestFormatInfo = formatInfo;
                    bestDifference = difference;
                }
            }
        }
        // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits differing means we found a match
        if (bestDifference <= 3) {
            return bestFormatInfo;
        }
        return null;
    }
    function getDataBlocks(codewords, version, ecLevel) {
        const ecInfo = version.errorCorrectionLevels[ecLevel];
        const dataBlocks = [];
        let totalCodewords = 0;
        ecInfo.ecBlocks.forEach(block => {
            for (let i = 0; i < block.numBlocks; i++) {
                dataBlocks.push({ numDataCodewords: block.dataCodewordsPerBlock, codewords: [] });
                totalCodewords += block.dataCodewordsPerBlock + ecInfo.ecCodewordsPerBlock;
            }
        });
        // In some cases the QR code will be malformed enough that we pull off more or less than we should.
        // If we pull off less there's nothing we can do.
        // If we pull off more we can safely truncate
        if (codewords.length < totalCodewords) {
            return null;
        }
        codewords = codewords.slice(0, totalCodewords);
        const shortBlockSize = ecInfo.ecBlocks[0].dataCodewordsPerBlock;
        // Pull codewords to fill the blocks up to the minimum size
        for (let i = 0; i < shortBlockSize; i++) {
            for (const dataBlock of dataBlocks) {
                dataBlock.codewords.push(codewords.shift());
            }
        }
        // If there are any large blocks, pull codewords to fill the last element of those
        if (ecInfo.ecBlocks.length > 1) {
            const smallBlockCount = ecInfo.ecBlocks[0].numBlocks;
            const largeBlockCount = ecInfo.ecBlocks[1].numBlocks;
            for (let i = 0; i < largeBlockCount; i++) {
                dataBlocks[smallBlockCount + i].codewords.push(codewords.shift());
            }
        }
        // Add the rest of the codewords to the blocks. These are the error correction codewords.
        while (codewords.length > 0) {
            for (const dataBlock of dataBlocks) {
                dataBlock.codewords.push(codewords.shift());
            }
        }
        return dataBlocks;
    }
    function decodeMatrix(matrix) {
        const version = readVersion(matrix);
        if (!version) {
            return null;
        }
        const formatInfo = readFormatInformation(matrix);
        if (!formatInfo) {
            return null;
        }
        const codewords = readCodewords(matrix, version, formatInfo);
        const dataBlocks = getDataBlocks(codewords, version, formatInfo.errorCorrectionLevel);
        if (!dataBlocks) {
            return null;
        }
        // Count total number of data bytes
        const totalBytes = dataBlocks.reduce((a, b) => a + b.numDataCodewords, 0);
        const resultBytes = new Uint8ClampedArray(totalBytes);
        let resultIndex = 0;
        for (const dataBlock of dataBlocks) {
            const correctedBytes = decode$1(dataBlock.codewords, dataBlock.codewords.length - dataBlock.numDataCodewords);
            if (!correctedBytes) {
                return null;
            }
            for (let i = 0; i < dataBlock.numDataCodewords; i++) {
                resultBytes[resultIndex++] = correctedBytes[i];
            }
        }
        try {
            return decode(resultBytes, version.versionNumber);
        }
        catch (_a) {
            return null;
        }
    }
    function decode$2(matrix) {
        if (matrix == null) {
            return null;
        }
        const result = decodeMatrix(matrix);
        if (result) {
            return result;
        }
        // Decoding didn't work, try mirroring the QR across the topLeft -> bottomRight line.
        for (let x = 0; x < matrix.width; x++) {
            for (let y = x + 1; y < matrix.height; y++) {
                if (matrix.get(x, y) !== matrix.get(y, x)) {
                    matrix.set(x, y, !matrix.get(x, y));
                    matrix.set(y, x, !matrix.get(y, x));
                }
            }
        }
        return decodeMatrix(matrix);
    }

    function squareToQuadrilateral(p1, p2, p3, p4) {
        const dx3 = p1.x - p2.x + p3.x - p4.x;
        const dy3 = p1.y - p2.y + p3.y - p4.y;
        if (dx3 === 0 && dy3 === 0) { // Affine
            return {
                a11: p2.x - p1.x,
                a12: p2.y - p1.y,
                a13: 0,
                a21: p3.x - p2.x,
                a22: p3.y - p2.y,
                a23: 0,
                a31: p1.x,
                a32: p1.y,
                a33: 1,
            };
        }
        else {
            const dx1 = p2.x - p3.x;
            const dx2 = p4.x - p3.x;
            const dy1 = p2.y - p3.y;
            const dy2 = p4.y - p3.y;
            const denominator = dx1 * dy2 - dx2 * dy1;
            const a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
            const a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
            return {
                a11: p2.x - p1.x + a13 * p2.x,
                a12: p2.y - p1.y + a13 * p2.y,
                a13,
                a21: p4.x - p1.x + a23 * p4.x,
                a22: p4.y - p1.y + a23 * p4.y,
                a23,
                a31: p1.x,
                a32: p1.y,
                a33: 1,
            };
        }
    }
    function quadrilateralToSquare(p1, p2, p3, p4) {
        // Here, the adjoint serves as the inverse:
        const sToQ = squareToQuadrilateral(p1, p2, p3, p4);
        return {
            a11: sToQ.a22 * sToQ.a33 - sToQ.a23 * sToQ.a32,
            a12: sToQ.a13 * sToQ.a32 - sToQ.a12 * sToQ.a33,
            a13: sToQ.a12 * sToQ.a23 - sToQ.a13 * sToQ.a22,
            a21: sToQ.a23 * sToQ.a31 - sToQ.a21 * sToQ.a33,
            a22: sToQ.a11 * sToQ.a33 - sToQ.a13 * sToQ.a31,
            a23: sToQ.a13 * sToQ.a21 - sToQ.a11 * sToQ.a23,
            a31: sToQ.a21 * sToQ.a32 - sToQ.a22 * sToQ.a31,
            a32: sToQ.a12 * sToQ.a31 - sToQ.a11 * sToQ.a32,
            a33: sToQ.a11 * sToQ.a22 - sToQ.a12 * sToQ.a21,
        };
    }
    function times(a, b) {
        return {
            a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
            a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
            a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
            a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
            a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
            a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
            a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
            a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
            a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33,
        };
    }
    function extract(image, location) {
        const qToS = quadrilateralToSquare({ x: 3.5, y: 3.5 }, { x: location.dimension - 3.5, y: 3.5 }, { x: location.dimension - 6.5, y: location.dimension - 6.5 }, { x: 3.5, y: location.dimension - 3.5 });
        const sToQ = squareToQuadrilateral(location.topLeft, location.topRight, location.alignmentPattern, location.bottomLeft);
        const transform = times(sToQ, qToS);
        const matrix = BitMatrix.createEmpty(location.dimension, location.dimension);
        const mappingFunction = (x, y) => {
            const denominator = transform.a13 * x + transform.a23 * y + transform.a33;
            return {
                x: (transform.a11 * x + transform.a21 * y + transform.a31) / denominator,
                y: (transform.a12 * x + transform.a22 * y + transform.a32) / denominator,
            };
        };
        for (let y = 0; y < location.dimension; y++) {
            for (let x = 0; x < location.dimension; x++) {
                const xValue = x + 0.5;
                const yValue = y + 0.5;
                const sourcePixel = mappingFunction(xValue, yValue);
                matrix.set(x, y, image.get(Math.floor(sourcePixel.x), Math.floor(sourcePixel.y)));
            }
        }
        return {
            matrix,
            mappingFunction,
        };
    }

    const MAX_FINDERPATTERNS_TO_SEARCH = 4;
    const MIN_QUAD_RATIO = 0.5;
    const MAX_QUAD_RATIO = 1.5;
    const distance = (a, b) => Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
    function sum(values) {
        return values.reduce((a, b) => a + b);
    }
    // Takes three finder patterns and organizes them into topLeft, topRight, etc
    function reorderFinderPatterns(pattern1, pattern2, pattern3) {
        // Find distances between pattern centers
        const oneTwoDistance = distance(pattern1, pattern2);
        const twoThreeDistance = distance(pattern2, pattern3);
        const oneThreeDistance = distance(pattern1, pattern3);
        let bottomLeft;
        let topLeft;
        let topRight;
        // Assume one closest to other two is B; A and C will just be guesses at first
        if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
            [bottomLeft, topLeft, topRight] = [pattern2, pattern1, pattern3];
        }
        else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
            [bottomLeft, topLeft, topRight] = [pattern1, pattern2, pattern3];
        }
        else {
            [bottomLeft, topLeft, topRight] = [pattern1, pattern3, pattern2];
        }
        // Use cross product to figure out whether bottomLeft (A) and topRight (C) are correct or flipped in relation to topLeft (B)
        // This asks whether BC x BA has a positive z component, which is the arrangement we want. If it's negative, then
        // we've got it flipped around and should swap topRight and bottomLeft.
        if (((topRight.x - topLeft.x) * (bottomLeft.y - topLeft.y)) - ((topRight.y - topLeft.y) * (bottomLeft.x - topLeft.x)) < 0) {
            [bottomLeft, topRight] = [topRight, bottomLeft];
        }
        return { bottomLeft, topLeft, topRight };
    }
    // Computes the dimension (number of modules on a side) of the QR Code based on the position of the finder patterns
    function computeDimension(topLeft, topRight, bottomLeft, matrix) {
        const moduleSize = (sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 + // Divide by 7 since the ratio is 1:1:3:1:1
            sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
            sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
            sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7) / 4;
        if (moduleSize < 1) {
            throw new Error("Invalid module size");
        }
        const topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
        const sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
        let dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
        switch (dimension % 4) {
            case 0:
                dimension++;
                break;
            case 2:
                dimension--;
                break;
        }
        return { dimension, moduleSize };
    }
    // Takes an origin point and an end point and counts the sizes of the black white run from the origin towards the end point.
    // Returns an array of elements, representing the pixel size of the black white run.
    // Uses a variant of http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
    function countBlackWhiteRunTowardsPoint(origin, end, matrix, length) {
        const switchPoints = [{ x: Math.floor(origin.x), y: Math.floor(origin.y) }];
        const steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);
        let fromX;
        let fromY;
        let toX;
        let toY;
        if (steep) {
            fromX = Math.floor(origin.y);
            fromY = Math.floor(origin.x);
            toX = Math.floor(end.y);
            toY = Math.floor(end.x);
        }
        else {
            fromX = Math.floor(origin.x);
            fromY = Math.floor(origin.y);
            toX = Math.floor(end.x);
            toY = Math.floor(end.y);
        }
        const dx = Math.abs(toX - fromX);
        const dy = Math.abs(toY - fromY);
        let error = Math.floor(-dx / 2);
        const xStep = fromX < toX ? 1 : -1;
        const yStep = fromY < toY ? 1 : -1;
        let currentPixel = true;
        // Loop up until x == toX, but not beyond
        for (let x = fromX, y = fromY; x !== toX + xStep; x += xStep) {
            // Does current pixel mean we have moved white to black or vice versa?
            // Scanning black in state 0,2 and white in state 1, so if we find the wrong
            // color, advance to next state or end if we are in state 2 already
            const realX = steep ? y : x;
            const realY = steep ? x : y;
            if (matrix.get(realX, realY) !== currentPixel) {
                currentPixel = !currentPixel;
                switchPoints.push({ x: realX, y: realY });
                if (switchPoints.length === length + 1) {
                    break;
                }
            }
            error += dy;
            if (error > 0) {
                if (y === toY) {
                    break;
                }
                y += yStep;
                error -= dx;
            }
        }
        const distances = [];
        for (let i = 0; i < length; i++) {
            if (switchPoints[i] && switchPoints[i + 1]) {
                distances.push(distance(switchPoints[i], switchPoints[i + 1]));
            }
            else {
                distances.push(0);
            }
        }
        return distances;
    }
    // Takes an origin point and an end point and counts the sizes of the black white run in the origin point
    // along the line that intersects with the end point. Returns an array of elements, representing the pixel sizes
    // of the black white run. Takes a length which represents the number of switches from black to white to look for.
    function countBlackWhiteRun(origin, end, matrix, length) {
        const rise = end.y - origin.y;
        const run = end.x - origin.x;
        const towardsEnd = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
        const awayFromEnd = countBlackWhiteRunTowardsPoint(origin, { x: origin.x - run, y: origin.y - rise }, matrix, Math.ceil(length / 2));
        const middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1; // Substract one so we don't double count a pixel
        return awayFromEnd.concat(middleValue).concat(...towardsEnd);
    }
    // Takes in a black white run and an array of expected ratios. Returns the average size of the run as well as the "error" -
    // that is the amount the run diverges from the expected ratio
    function scoreBlackWhiteRun(sequence, ratios) {
        const averageSize = sum(sequence) / sum(ratios);
        let error = 0;
        ratios.forEach((ratio, i) => {
            error += Math.pow((sequence[i] - ratio * averageSize), 2);
        });
        return { averageSize, error };
    }
    // Takes an X,Y point and an array of sizes and scores the point against those ratios.
    // For example for a finder pattern takes the ratio list of 1:1:3:1:1 and checks horizontal, vertical and diagonal ratios
    // against that.
    function scorePattern(point, ratios, matrix) {
        try {
            const horizontalRun = countBlackWhiteRun(point, { x: -1, y: point.y }, matrix, ratios.length);
            const verticalRun = countBlackWhiteRun(point, { x: point.x, y: -1 }, matrix, ratios.length);
            const topLeftPoint = {
                x: Math.max(0, point.x - point.y) - 1,
                y: Math.max(0, point.y - point.x) - 1,
            };
            const topLeftBottomRightRun = countBlackWhiteRun(point, topLeftPoint, matrix, ratios.length);
            const bottomLeftPoint = {
                x: Math.min(matrix.width, point.x + point.y) + 1,
                y: Math.min(matrix.height, point.y + point.x) + 1,
            };
            const bottomLeftTopRightRun = countBlackWhiteRun(point, bottomLeftPoint, matrix, ratios.length);
            const horzError = scoreBlackWhiteRun(horizontalRun, ratios);
            const vertError = scoreBlackWhiteRun(verticalRun, ratios);
            const diagDownError = scoreBlackWhiteRun(topLeftBottomRightRun, ratios);
            const diagUpError = scoreBlackWhiteRun(bottomLeftTopRightRun, ratios);
            const ratioError = Math.sqrt(horzError.error * horzError.error +
                vertError.error * vertError.error +
                diagDownError.error * diagDownError.error +
                diagUpError.error * diagUpError.error);
            const avgSize = (horzError.averageSize + vertError.averageSize + diagDownError.averageSize + diagUpError.averageSize) / 4;
            const sizeError = (Math.pow((horzError.averageSize - avgSize), 2) +
                Math.pow((vertError.averageSize - avgSize), 2) +
                Math.pow((diagDownError.averageSize - avgSize), 2) +
                Math.pow((diagUpError.averageSize - avgSize), 2)) / avgSize;
            return ratioError + sizeError;
        }
        catch (_a) {
            return Infinity;
        }
    }
    function locate(matrix) {
        const finderPatternQuads = [];
        let activeFinderPatternQuads = [];
        const alignmentPatternQuads = [];
        let activeAlignmentPatternQuads = [];
        for (let y = 0; y <= matrix.height; y++) {
            let length = 0;
            let lastBit = false;
            let scans = [0, 0, 0, 0, 0];
            for (let x = -1; x <= matrix.width; x++) {
                const v = matrix.get(x, y);
                if (v === lastBit) {
                    length++;
                }
                else {
                    scans = [scans[1], scans[2], scans[3], scans[4], length];
                    length = 1;
                    lastBit = v;
                    // Do the last 5 color changes ~ match the expected ratio for a finder pattern? 1:1:3:1:1 of b:w:b:w:b
                    const averageFinderPatternBlocksize = sum(scans) / 7;
                    const validFinderPattern = Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                        Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                        Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
                        Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                        Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                        !v; // And make sure the current pixel is white since finder patterns are bordered in white
                    // Do the last 3 color changes ~ match the expected ratio for an alignment pattern? 1:1:1 of w:b:w
                    const averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
                    const validAlignmentPattern = Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                        Math.abs(scans[3] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                        Math.abs(scans[4] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                        v; // Is the current pixel black since alignment patterns are bordered in black
                    if (validFinderPattern) {
                        // Compute the start and end x values of the large center black square
                        const endX = x - scans[3] - scans[4];
                        const startX = endX - scans[2];
                        const line = { startX, endX, y };
                        // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                        // that line as the starting point.
                        const matchingQuads = activeFinderPatternQuads.filter(q => (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
                            (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
                            (startX <= q.bottom.startX && endX >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                                (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO)));
                        if (matchingQuads.length > 0) {
                            matchingQuads[0].bottom = line;
                        }
                        else {
                            activeFinderPatternQuads.push({ top: line, bottom: line });
                        }
                    }
                    if (validAlignmentPattern) {
                        // Compute the start and end x values of the center black square
                        const endX = x - scans[4];
                        const startX = endX - scans[3];
                        const line = { startX, y, endX };
                        // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                        // that line as the starting point.
                        const matchingQuads = activeAlignmentPatternQuads.filter(q => (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
                            (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
                            (startX <= q.bottom.startX && endX >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                                (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO)));
                        if (matchingQuads.length > 0) {
                            matchingQuads[0].bottom = line;
                        }
                        else {
                            activeAlignmentPatternQuads.push({ top: line, bottom: line });
                        }
                    }
                }
            }
            finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y !== y && q.bottom.y - q.top.y >= 2));
            activeFinderPatternQuads = activeFinderPatternQuads.filter(q => q.bottom.y === y);
            alignmentPatternQuads.push(...activeAlignmentPatternQuads.filter(q => q.bottom.y !== y));
            activeAlignmentPatternQuads = activeAlignmentPatternQuads.filter(q => q.bottom.y === y);
        }
        finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y - q.top.y >= 2));
        alignmentPatternQuads.push(...activeAlignmentPatternQuads);
        const finderPatternGroups = finderPatternQuads
            .filter(q => q.bottom.y - q.top.y >= 2) // All quads must be at least 2px tall since the center square is larger than a block
            .map(q => {
            const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
            const y = (q.top.y + q.bottom.y + 1) / 2;
            if (!matrix.get(Math.round(x), Math.round(y))) {
                return;
            }
            const lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, q.bottom.y - q.top.y + 1];
            const size = sum(lengths) / lengths.length;
            const score = scorePattern({ x: Math.round(x), y: Math.round(y) }, [1, 1, 3, 1, 1], matrix);
            return { score, x, y, size };
        })
            .filter(q => !!q) // Filter out any rejected quads from above
            .sort((a, b) => a.score - b.score)
            // Now take the top finder pattern options and try to find 2 other options with a similar size.
            .map((point, i, finderPatterns) => {
            if (i > MAX_FINDERPATTERNS_TO_SEARCH) {
                return null;
            }
            const otherPoints = finderPatterns
                .filter((p, ii) => i !== ii)
                .map(p => ({ x: p.x, y: p.y, score: p.score + (Math.pow((p.size - point.size), 2)) / point.size, size: p.size }))
                .sort((a, b) => a.score - b.score);
            if (otherPoints.length < 2) {
                return null;
            }
            const score = point.score + otherPoints[0].score + otherPoints[1].score;
            return { points: [point].concat(otherPoints.slice(0, 2)), score };
        })
            .filter(q => !!q) // Filter out any rejected finder patterns from above
            .sort((a, b) => a.score - b.score);
        if (finderPatternGroups.length === 0) {
            return null;
        }
        const { topRight, topLeft, bottomLeft } = reorderFinderPatterns(finderPatternGroups[0].points[0], finderPatternGroups[0].points[1], finderPatternGroups[0].points[2]);
        // Now that we've found the three finder patterns we can determine the blockSize and the size of the QR code.
        // We'll use these to help find the alignment pattern but also later when we do the extraction.
        let dimension;
        let moduleSize;
        try {
            ({ dimension, moduleSize } = computeDimension(topLeft, topRight, bottomLeft, matrix));
        }
        catch (e) {
            return null;
        }
        // Now find the alignment pattern
        const bottomRightFinderPattern = {
            x: topRight.x - topLeft.x + bottomLeft.x,
            y: topRight.y - topLeft.y + bottomLeft.y,
        };
        const modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);
        const correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
        const expectedAlignmentPattern = {
            x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
            y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
        };
        const alignmentPatterns = alignmentPatternQuads
            .map(q => {
            const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
            const y = (q.top.y + q.bottom.y + 1) / 2;
            if (!matrix.get(Math.floor(x), Math.floor(y))) {
                return;
            }
            const lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, (q.bottom.y - q.top.y + 1)];
            const size = sum(lengths) / lengths.length;
            const sizeScore = scorePattern({ x: Math.floor(x), y: Math.floor(y) }, [1, 1, 1], matrix);
            const score = sizeScore + distance({ x, y }, expectedAlignmentPattern);
            return { x, y, score };
        })
            .filter(v => !!v)
            .sort((a, b) => a.score - b.score);
        // If there are less than 15 modules between finder patterns it's a version 1 QR code and as such has no alignmemnt pattern
        // so we can only use our best guess.
        const alignmentPattern = modulesBetweenFinderPatterns >= 15 && alignmentPatterns.length ? alignmentPatterns[0] : expectedAlignmentPattern;
        return {
            alignmentPattern: { x: alignmentPattern.x, y: alignmentPattern.y },
            bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
            dimension,
            topLeft: { x: topLeft.x, y: topLeft.y },
            topRight: { x: topRight.x, y: topRight.y },
        };
    }

    function scan(matrix) {
        const location = locate(matrix);
        if (!location) {
            return null;
        }
        const extracted = extract(matrix, location);
        const decoded = decode$2(extracted.matrix);
        if (!decoded) {
            return null;
        }
        return {
            binaryData: decoded.bytes,
            data: decoded.text,
            chunks: decoded.chunks,
            location: {
                topRightCorner: extracted.mappingFunction(location.dimension, 0),
                topLeftCorner: extracted.mappingFunction(0, 0),
                bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
                bottomLeftCorner: extracted.mappingFunction(0, location.dimension),
                topRightFinderPattern: location.topRight,
                topLeftFinderPattern: location.topLeft,
                bottomLeftFinderPattern: location.bottomLeft,
                bottomRightAlignmentPattern: location.alignmentPattern,
            },
        };
    }
    const defaultOptions = {
        inversionAttempts: "attemptBoth",
        greyScaleWeights: {
            red: 0.2126,
            green: 0.7152,
            blue: 0.0722,
            useIntegerApproximation: false,
        },
        canOverwriteImage: true,
    };
    function mergeObject(target, src) {
        Object.keys(src).forEach(opt => {
            target[opt] = src[opt];
        });
    }
    function jsQR(data, width, height, providedOptions = {}) {
        const options = Object.create(null);
        mergeObject(options, defaultOptions);
        mergeObject(options, providedOptions);
        const shouldInvert = options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst";
        const tryInvertedFirst = options.inversionAttempts === "onlyInvert" || options.inversionAttempts === "invertFirst";
        const { binarized, inverted } = binarize(data, width, height, shouldInvert, options.greyScaleWeights, options.canOverwriteImage);
        let result = scan(tryInvertedFirst ? inverted : binarized);
        if (!result && (options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst")) {
            result = scan(tryInvertedFirst ? binarized : inverted);
        }
        return result;
    }
    jsQR.default = jsQR;

    var undefinedHeader = /* array */[];

    function some(x) {
      if (x === undefined) {
        var block = /* tuple */[
          undefinedHeader,
          0
        ];
        block.tag = 256;
        return block;
      } else if (x !== null && x[0] === undefinedHeader) {
        var nid = x[1] + 1 | 0;
        var block$1 = /* tuple */[
          undefinedHeader,
          nid
        ];
        block$1.tag = 256;
        return block$1;
      } else {
        return x;
      }
    }

    function nullable_to_opt(x) {
      if (x === null || x === undefined) {
        return undefined;
      } else {
        return some(x);
      }
    }
    /* No side effect */

    // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

    function string_of_invertOptions(param) {
      switch (param) {
        case 0 : 
            return "attemptBoth";
        case 1 : 
            return "dontInvert";
        case 2 : 
            return "onlyInvert";
        case 3 : 
            return "invertFirst";
        
      }
    }

    function jsQR$1(d, w, h, invertOptions) {
      var optString = string_of_invertOptions(invertOptions);
      return nullable_to_opt(jsQR(d, w, h, {
                      inversionAttempts: optString,
                      canOverwriteImage: true
                    }));
    }
    /* jsqr-es6 Not a pure module */

    // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

    self.onmessage = (function (e) {
        var match = e.data;
        var maybeCode = jsQR$1(match[0], match[1], match[2], match[3]);
        postMessage(maybeCode);
        return /* () */0;
      });
    /*  Not a pure module */

}());
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlcyI6WyJub2RlX21vZHVsZXMvanNxci1lczYvZGlzdC9qc1FSLmpzIiwibm9kZV9tb2R1bGVzL2JzLXBsYXRmb3JtL2xpYi9lczYvY2FtbF9vcHRpb24uanMiLCJzcmMvSnNRci5icy5qcyIsInNyYy9EZWNvZGVXb3JrZXIuYnMuanMiXSwic291cmNlc0NvbnRlbnQiOlsiY2xhc3MgQml0TWF0cml4IHtcbiAgICBzdGF0aWMgY3JlYXRlRW1wdHkod2lkdGgsIGhlaWdodCkge1xuICAgICAgICByZXR1cm4gbmV3IEJpdE1hdHJpeChuZXcgVWludDhDbGFtcGVkQXJyYXkod2lkdGggKiBoZWlnaHQpLCB3aWR0aCk7XG4gICAgfVxuICAgIGNvbnN0cnVjdG9yKGRhdGEsIHdpZHRoKSB7XG4gICAgICAgIHRoaXMud2lkdGggPSB3aWR0aDtcbiAgICAgICAgdGhpcy5oZWlnaHQgPSBkYXRhLmxlbmd0aCAvIHdpZHRoO1xuICAgICAgICB0aGlzLmRhdGEgPSBkYXRhO1xuICAgIH1cbiAgICBnZXQoeCwgeSkge1xuICAgICAgICBpZiAoeCA8IDAgfHwgeCA+PSB0aGlzLndpZHRoIHx8IHkgPCAwIHx8IHkgPj0gdGhpcy5oZWlnaHQpIHtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gISF0aGlzLmRhdGFbeSAqIHRoaXMud2lkdGggKyB4XTtcbiAgICB9XG4gICAgc2V0KHgsIHksIHYpIHtcbiAgICAgICAgdGhpcy5kYXRhW3kgKiB0aGlzLndpZHRoICsgeF0gPSB2ID8gMSA6IDA7XG4gICAgfVxuICAgIHNldFJlZ2lvbihsZWZ0LCB0b3AsIHdpZHRoLCBoZWlnaHQsIHYpIHtcbiAgICAgICAgZm9yIChsZXQgeSA9IHRvcDsgeSA8IHRvcCArIGhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gbGVmdDsgeCA8IGxlZnQgKyB3aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5zZXQoeCwgeSwgISF2KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbn1cblxuY29uc3QgUkVHSU9OX1NJWkUgPSA4O1xuY29uc3QgTUlOX0RZTkFNSUNfUkFOR0UgPSAyNDtcbmZ1bmN0aW9uIG51bUJldHdlZW4odmFsdWUsIG1pbiwgbWF4KSB7XG4gICAgcmV0dXJuIHZhbHVlIDwgbWluID8gbWluIDogdmFsdWUgPiBtYXggPyBtYXggOiB2YWx1ZTtcbn1cbi8vIExpa2UgQml0TWF0cml4IGJ1dCBhY2NlcHRzIGFyYml0cnkgVWludDggdmFsdWVzXG5jbGFzcyBNYXRyaXgge1xuICAgIGNvbnN0cnVjdG9yKHdpZHRoLCBoZWlnaHQsIGJ1ZmZlcikge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIGNvbnN0IGJ1ZmZlclNpemUgPSB3aWR0aCAqIGhlaWdodDtcbiAgICAgICAgaWYgKGJ1ZmZlciAmJiBidWZmZXIubGVuZ3RoICE9PSBidWZmZXJTaXplKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJXcm9uZyBidWZmZXIgc2l6ZVwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmRhdGEgPSBidWZmZXIgfHwgbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ1ZmZlclNpemUpO1xuICAgIH1cbiAgICBnZXQoeCwgeSkge1xuICAgICAgICByZXR1cm4gdGhpcy5kYXRhW3kgKiB0aGlzLndpZHRoICsgeF07XG4gICAgfVxuICAgIHNldCh4LCB5LCB2YWx1ZSkge1xuICAgICAgICB0aGlzLmRhdGFbeSAqIHRoaXMud2lkdGggKyB4XSA9IHZhbHVlO1xuICAgIH1cbn1cbmZ1bmN0aW9uIGJpbmFyaXplKGRhdGEsIHdpZHRoLCBoZWlnaHQsIHJldHVybkludmVydGVkLCBncmV5c2NhbGVXZWlnaHRzLCBjYW5PdmVyd3JpdGVJbWFnZSkge1xuICAgIGNvbnN0IHBpeGVsQ291bnQgPSB3aWR0aCAqIGhlaWdodDtcbiAgICBpZiAoZGF0YS5sZW5ndGggIT09IHBpeGVsQ291bnQgKiA0KSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIk1hbGZvcm1lZCBkYXRhIHBhc3NlZCB0byBiaW5hcml6ZXIuXCIpO1xuICAgIH1cbiAgICAvLyBhc3NpZ24gdGhlIGdyZXlzY2FsZSBhbmQgYmluYXJ5IGltYWdlIHdpdGhpbiB0aGUgcmdiYSBidWZmZXIgYXMgdGhlIHJnYmEgaW1hZ2Ugd2lsbCBub3QgYmUgbmVlZGVkIGFmdGVyIGNvbnZlcnNpb25cbiAgICBsZXQgYnVmZmVyT2Zmc2V0ID0gMDtcbiAgICAvLyBDb252ZXJ0IGltYWdlIHRvIGdyZXlzY2FsZVxuICAgIGxldCBncmV5c2NhbGVCdWZmZXI7XG4gICAgaWYgKGNhbk92ZXJ3cml0ZUltYWdlKSB7XG4gICAgICAgIGdyZXlzY2FsZUJ1ZmZlciA9IG5ldyBVaW50OENsYW1wZWRBcnJheShkYXRhLmJ1ZmZlciwgYnVmZmVyT2Zmc2V0LCBwaXhlbENvdW50KTtcbiAgICAgICAgYnVmZmVyT2Zmc2V0ICs9IHBpeGVsQ291bnQ7XG4gICAgfVxuICAgIGNvbnN0IGdyZXlzY2FsZVBpeGVscyA9IG5ldyBNYXRyaXgod2lkdGgsIGhlaWdodCwgZ3JleXNjYWxlQnVmZmVyKTtcbiAgICBpZiAoZ3JleXNjYWxlV2VpZ2h0cy51c2VJbnRlZ2VyQXBwcm94aW1hdGlvbikge1xuICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IGhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IHdpZHRoOyB4KyspIHtcbiAgICAgICAgICAgICAgICBjb25zdCBwaXhlbFBvc2l0aW9uID0gKHkgKiB3aWR0aCArIHgpICogNDtcbiAgICAgICAgICAgICAgICBjb25zdCByID0gZGF0YVtwaXhlbFBvc2l0aW9uXTtcbiAgICAgICAgICAgICAgICBjb25zdCBnID0gZGF0YVtwaXhlbFBvc2l0aW9uICsgMV07XG4gICAgICAgICAgICAgICAgY29uc3QgYiA9IGRhdGFbcGl4ZWxQb3NpdGlvbiArIDJdO1xuICAgICAgICAgICAgICAgIGdyZXlzY2FsZVBpeGVscy5zZXQoeCwgeSwgXG4gICAgICAgICAgICAgICAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lIG5vLWJpdHdpc2VcbiAgICAgICAgICAgICAgICAoZ3JleXNjYWxlV2VpZ2h0cy5yZWQgKiByICsgZ3JleXNjYWxlV2VpZ2h0cy5ncmVlbiAqIGcgKyBncmV5c2NhbGVXZWlnaHRzLmJsdWUgKiBiICsgMTI4KSA+PiA4KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQb3NpdGlvbiA9ICh5ICogd2lkdGggKyB4KSAqIDQ7XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IGRhdGFbcGl4ZWxQb3NpdGlvbl07XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IGRhdGFbcGl4ZWxQb3NpdGlvbiArIDFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBkYXRhW3BpeGVsUG9zaXRpb24gKyAyXTtcbiAgICAgICAgICAgICAgICBncmV5c2NhbGVQaXhlbHMuc2V0KHgsIHksIGdyZXlzY2FsZVdlaWdodHMucmVkICogciArIGdyZXlzY2FsZVdlaWdodHMuZ3JlZW4gKiBnICsgZ3JleXNjYWxlV2VpZ2h0cy5ibHVlICogYik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgaG9yaXpvbnRhbFJlZ2lvbkNvdW50ID0gTWF0aC5jZWlsKHdpZHRoIC8gUkVHSU9OX1NJWkUpO1xuICAgIGNvbnN0IHZlcnRpY2FsUmVnaW9uQ291bnQgPSBNYXRoLmNlaWwoaGVpZ2h0IC8gUkVHSU9OX1NJWkUpO1xuICAgIGNvbnN0IGJsYWNrUG9pbnRzQ291bnQgPSBob3Jpem9udGFsUmVnaW9uQ291bnQgKiB2ZXJ0aWNhbFJlZ2lvbkNvdW50O1xuICAgIGxldCBibGFja1BvaW50c0J1ZmZlcjtcbiAgICBpZiAoY2FuT3ZlcndyaXRlSW1hZ2UpIHtcbiAgICAgICAgYmxhY2tQb2ludHNCdWZmZXIgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoZGF0YS5idWZmZXIsIGJ1ZmZlck9mZnNldCwgYmxhY2tQb2ludHNDb3VudCk7XG4gICAgICAgIGJ1ZmZlck9mZnNldCArPSBibGFja1BvaW50c0NvdW50O1xuICAgIH1cbiAgICBjb25zdCBibGFja1BvaW50cyA9IG5ldyBNYXRyaXgoaG9yaXpvbnRhbFJlZ2lvbkNvdW50LCB2ZXJ0aWNhbFJlZ2lvbkNvdW50LCBibGFja1BvaW50c0J1ZmZlcik7XG4gICAgZm9yIChsZXQgdmVydGljYWxSZWdpb24gPSAwOyB2ZXJ0aWNhbFJlZ2lvbiA8IHZlcnRpY2FsUmVnaW9uQ291bnQ7IHZlcnRpY2FsUmVnaW9uKyspIHtcbiAgICAgICAgZm9yIChsZXQgaG9ydGl6b250YWxSZWdpb24gPSAwOyBob3J0aXpvbnRhbFJlZ2lvbiA8IGhvcml6b250YWxSZWdpb25Db3VudDsgaG9ydGl6b250YWxSZWdpb24rKykge1xuICAgICAgICAgICAgbGV0IG1pbiA9IEluZmluaXR5O1xuICAgICAgICAgICAgbGV0IG1heCA9IDA7XG4gICAgICAgICAgICBmb3IgKGxldCB5ID0gMDsgeSA8IFJFR0lPTl9TSVpFOyB5KyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IFJFR0lPTl9TSVpFOyB4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxMdW1vc2l0eSA9IGdyZXlzY2FsZVBpeGVscy5nZXQoaG9ydGl6b250YWxSZWdpb24gKiBSRUdJT05fU0laRSArIHgsIHZlcnRpY2FsUmVnaW9uICogUkVHSU9OX1NJWkUgKyB5KTtcbiAgICAgICAgICAgICAgICAgICAgbWluID0gTWF0aC5taW4obWluLCBwaXhlbEx1bW9zaXR5KTtcbiAgICAgICAgICAgICAgICAgICAgbWF4ID0gTWF0aC5tYXgobWF4LCBwaXhlbEx1bW9zaXR5KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBXZSBjb3VsZCBhbHNvIGNvbXB1dGUgdGhlIHJlYWwgYXZlcmFnZSBvZiBhbGwgcGl4ZWxzIGJ1dCBmb2xsb3dpbmcgdGhlIGFzc3VtcHRpb24gdGhhdCB0aGUgcXIgY29kZSBjb25zaXN0c1xuICAgICAgICAgICAgLy8gb2YgYnJpZ2h0IGFuZCBkYXJrIHBpeGVscyBhbmQgZXNzZW50aWFsbHkgbm90IG11Y2ggaW4gYmV0d2VlbiwgYnkgKG1pbiArIG1heCkvMiB3ZSBtYWtlIHRoZSBjdXQgcmVhbGx5IGJldHdlZW5cbiAgICAgICAgICAgIC8vIHRob3NlIHR3byBjbGFzc2VzLiBJZiB1c2luZyB0aGUgYXZlcmFnZSBvdmVyIGFsbCBwaXhlbCBpbiBhIGJsb2NrIG9mIG1vc3RseSBicmlnaHQgcGl4ZWxzIGFuZCBmZXcgZGFyayBwaXhlbHMsXG4gICAgICAgICAgICAvLyB0aGUgYXZnIHdvdWxkIHRlbmQgdG8gdGhlIGJyaWdodCBzaWRlIGFuZCBkYXJrZXIgYnJpZ2h0IHBpeGVscyBjb3VsZCBiZSBpbnRlcnByZXRlZCBhcyBkYXJrLlxuICAgICAgICAgICAgbGV0IGF2ZXJhZ2UgPSAobWluICsgbWF4KSAvIDI7XG4gICAgICAgICAgICAvLyBTbWFsbCBiaWFzIHRvd2FyZHMgYmxhY2sgYnkgbW92aW5nIHRoZSB0aHJlc2hvbGQgdXAuIFdlIGRvIHRoaXMsIGFzIGluIHRoZSBmaW5kZXIgcGF0dGVybnMgd2hpdGUgaG9sZXMgdGVuZFxuICAgICAgICAgICAgLy8gdG8gYXBwZWFyIHdoaWNoIG1ha2VzIHRoZW0gdW5kZXRlY3RhYmxlLlxuICAgICAgICAgICAgY29uc3QgYmxhY2tCaWFzID0gMS4xO1xuICAgICAgICAgICAgYXZlcmFnZSA9IE1hdGgubWluKDI1NSwgYXZlcmFnZSAqIGJsYWNrQmlhcyk7XG4gICAgICAgICAgICBpZiAobWF4IC0gbWluIDw9IE1JTl9EWU5BTUlDX1JBTkdFKSB7XG4gICAgICAgICAgICAgICAgLy8gSWYgdmFyaWF0aW9uIHdpdGhpbiB0aGUgYmxvY2sgaXMgbG93LCBhc3N1bWUgdGhpcyBpcyBhIGJsb2NrIHdpdGggb25seSBsaWdodCBvciBvbmx5XG4gICAgICAgICAgICAgICAgLy8gZGFyayBwaXhlbHMuIEluIHRoYXQgY2FzZSB3ZSBkbyBub3Qgd2FudCB0byB1c2UgdGhlIGF2ZXJhZ2UsIGFzIGl0IHdvdWxkIGRpdmlkZSB0aGlzXG4gICAgICAgICAgICAgICAgLy8gbG93IGNvbnRyYXN0IGFyZWEgaW50byBibGFjayBhbmQgd2hpdGUgcGl4ZWxzLCBlc3NlbnRpYWxseSBjcmVhdGluZyBkYXRhIG91dCBvZiBub2lzZS5cbiAgICAgICAgICAgICAgICAvL1xuICAgICAgICAgICAgICAgIC8vIERlZmF1bHQgdGhlIGJsYWNrcG9pbnQgZm9yIHRoZXNlIGJsb2NrcyB0byBiZSBoYWxmIHRoZSBtaW4gLSBlZmZlY3RpdmVseSB3aGl0ZSB0aGVtIG91dFxuICAgICAgICAgICAgICAgIGF2ZXJhZ2UgPSBtaW4gLyAyO1xuICAgICAgICAgICAgICAgIGlmICh2ZXJ0aWNhbFJlZ2lvbiA+IDAgJiYgaG9ydGl6b250YWxSZWdpb24gPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvcnJlY3QgdGhlIFwid2hpdGUgYmFja2dyb3VuZFwiIGFzc3VtcHRpb24gZm9yIGJsb2NrcyB0aGF0IGhhdmUgbmVpZ2hib3JzIGJ5IGNvbXBhcmluZ1xuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgcGl4ZWxzIGluIHRoaXMgYmxvY2sgdG8gdGhlIHByZXZpb3VzbHkgY2FsY3VsYXRlZCBibGFjayBwb2ludHMuIFRoaXMgaXMgYmFzZWQgb25cbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGZhY3QgdGhhdCBkYXJrIGJhcmNvZGUgc3ltYm9sb2d5IGlzIGFsd2F5cyBzdXJyb3VuZGVkIGJ5IHNvbWUgYW1vdW50IG9mIGxpZ2h0XG4gICAgICAgICAgICAgICAgICAgIC8vIGJhY2tncm91bmQgZm9yIHdoaWNoIHJlYXNvbmFibGUgYmxhY2sgcG9pbnQgZXN0aW1hdGVzIHdlcmUgbWFkZS4gVGhlIGJwIGVzdGltYXRlZCBhdFxuICAgICAgICAgICAgICAgICAgICAvLyB0aGUgYm91bmRhcmllcyBpcyB1c2VkIGZvciB0aGUgaW50ZXJpb3IuXG4gICAgICAgICAgICAgICAgICAgIC8vIFRoZSAobWluIDwgYnApIGlzIGFyYml0cmFyeSBidXQgd29ya3MgYmV0dGVyIHRoYW4gb3RoZXIgaGV1cmlzdGljcyB0aGF0IHdlcmUgdHJpZWQuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2VOZWlnaGJvckJsYWNrUG9pbnQgPSAoYmxhY2tQb2ludHMuZ2V0KGhvcnRpem9udGFsUmVnaW9uLCB2ZXJ0aWNhbFJlZ2lvbiAtIDEpICtcbiAgICAgICAgICAgICAgICAgICAgICAgICgyICogYmxhY2tQb2ludHMuZ2V0KGhvcnRpem9udGFsUmVnaW9uIC0gMSwgdmVydGljYWxSZWdpb24pKSArXG4gICAgICAgICAgICAgICAgICAgICAgICBibGFja1BvaW50cy5nZXQoaG9ydGl6b250YWxSZWdpb24gLSAxLCB2ZXJ0aWNhbFJlZ2lvbiAtIDEpKSAvIDQ7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtaW4gPCBhdmVyYWdlTmVpZ2hib3JCbGFja1BvaW50KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhdmVyYWdlID0gYXZlcmFnZU5laWdoYm9yQmxhY2tQb2ludDsgLy8gbm8gbmVlZCB0byBhcHBseSBibGFjayBiaWFzIGFzIGFscmVhZHkgYXBwbGllZCB0byBuZWlnaGJvcnNcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGJsYWNrUG9pbnRzLnNldChob3J0aXpvbnRhbFJlZ2lvbiwgdmVydGljYWxSZWdpb24sIGF2ZXJhZ2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBiaW5hcml6ZWQ7XG4gICAgaWYgKGNhbk92ZXJ3cml0ZUltYWdlKSB7XG4gICAgICAgIGNvbnN0IGJpbmFyaXplZEJ1ZmZlciA9IG5ldyBVaW50OENsYW1wZWRBcnJheShkYXRhLmJ1ZmZlciwgYnVmZmVyT2Zmc2V0LCBwaXhlbENvdW50KTtcbiAgICAgICAgYnVmZmVyT2Zmc2V0ICs9IHBpeGVsQ291bnQ7XG4gICAgICAgIGJpbmFyaXplZCA9IG5ldyBCaXRNYXRyaXgoYmluYXJpemVkQnVmZmVyLCB3aWR0aCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBiaW5hcml6ZWQgPSBCaXRNYXRyaXguY3JlYXRlRW1wdHkod2lkdGgsIGhlaWdodCk7XG4gICAgfVxuICAgIGxldCBpbnZlcnRlZCA9IG51bGw7XG4gICAgaWYgKHJldHVybkludmVydGVkKSB7XG4gICAgICAgIGlmIChjYW5PdmVyd3JpdGVJbWFnZSkge1xuICAgICAgICAgICAgY29uc3QgaW52ZXJ0ZWRCdWZmZXIgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoZGF0YS5idWZmZXIsIGJ1ZmZlck9mZnNldCwgcGl4ZWxDb3VudCk7XG4gICAgICAgICAgICBpbnZlcnRlZCA9IG5ldyBCaXRNYXRyaXgoaW52ZXJ0ZWRCdWZmZXIsIHdpZHRoKTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIGludmVydGVkID0gQml0TWF0cml4LmNyZWF0ZUVtcHR5KHdpZHRoLCBoZWlnaHQpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IHZlcnRpY2FsUmVnaW9uID0gMDsgdmVydGljYWxSZWdpb24gPCB2ZXJ0aWNhbFJlZ2lvbkNvdW50OyB2ZXJ0aWNhbFJlZ2lvbisrKSB7XG4gICAgICAgIGZvciAobGV0IGhvcnRpem9udGFsUmVnaW9uID0gMDsgaG9ydGl6b250YWxSZWdpb24gPCBob3Jpem9udGFsUmVnaW9uQ291bnQ7IGhvcnRpem9udGFsUmVnaW9uKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGxlZnQgPSBudW1CZXR3ZWVuKGhvcnRpem9udGFsUmVnaW9uLCAyLCBob3Jpem9udGFsUmVnaW9uQ291bnQgLSAzKTtcbiAgICAgICAgICAgIGNvbnN0IHRvcCA9IG51bUJldHdlZW4odmVydGljYWxSZWdpb24sIDIsIHZlcnRpY2FsUmVnaW9uQ291bnQgLSAzKTtcbiAgICAgICAgICAgIGxldCBzdW0gPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgeFJlZ2lvbiA9IC0yOyB4UmVnaW9uIDw9IDI7IHhSZWdpb24rKykge1xuICAgICAgICAgICAgICAgIGZvciAobGV0IHlSZWdpb24gPSAtMjsgeVJlZ2lvbiA8PSAyOyB5UmVnaW9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgc3VtICs9IGJsYWNrUG9pbnRzLmdldChsZWZ0ICsgeFJlZ2lvbiwgdG9wICsgeVJlZ2lvbik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgY29uc3QgdGhyZXNob2xkID0gc3VtIC8gMjU7XG4gICAgICAgICAgICBmb3IgKGxldCB4UmVnaW9uID0gMDsgeFJlZ2lvbiA8IFJFR0lPTl9TSVpFOyB4UmVnaW9uKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5UmVnaW9uID0gMDsgeVJlZ2lvbiA8IFJFR0lPTl9TSVpFOyB5UmVnaW9uKyspIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeCA9IGhvcnRpem9udGFsUmVnaW9uICogUkVHSU9OX1NJWkUgKyB4UmVnaW9uO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCB5ID0gdmVydGljYWxSZWdpb24gKiBSRUdJT05fU0laRSArIHlSZWdpb247XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGx1bSA9IGdyZXlzY2FsZVBpeGVscy5nZXQoeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIGJpbmFyaXplZC5zZXQoeCwgeSwgbHVtIDw9IHRocmVzaG9sZCk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChyZXR1cm5JbnZlcnRlZCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaW52ZXJ0ZWQuc2V0KHgsIHksICEobHVtIDw9IHRocmVzaG9sZCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChyZXR1cm5JbnZlcnRlZCkge1xuICAgICAgICByZXR1cm4geyBiaW5hcml6ZWQsIGludmVydGVkIH07XG4gICAgfVxuICAgIHJldHVybiB7IGJpbmFyaXplZCB9O1xufVxuXG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1iaXR3aXNlXG5jbGFzcyBCaXRTdHJlYW0ge1xuICAgIGNvbnN0cnVjdG9yKGJ5dGVzKSB7XG4gICAgICAgIHRoaXMuYnl0ZU9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuYml0T2Zmc2V0ID0gMDtcbiAgICAgICAgdGhpcy5ieXRlcyA9IGJ5dGVzO1xuICAgIH1cbiAgICByZWFkQml0cyhudW1CaXRzKSB7XG4gICAgICAgIGlmIChudW1CaXRzIDwgMSB8fCBudW1CaXRzID4gMzIgfHwgbnVtQml0cyA+IHRoaXMuYXZhaWxhYmxlKCkpIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbm5vdCByZWFkIFwiICsgbnVtQml0cy50b1N0cmluZygpICsgXCIgYml0c1wiKTtcbiAgICAgICAgfVxuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgLy8gRmlyc3QsIHJlYWQgcmVtYWluZGVyIGZyb20gY3VycmVudCBieXRlXG4gICAgICAgIGlmICh0aGlzLmJpdE9mZnNldCA+IDApIHtcbiAgICAgICAgICAgIGNvbnN0IGJpdHNMZWZ0ID0gOCAtIHRoaXMuYml0T2Zmc2V0O1xuICAgICAgICAgICAgY29uc3QgdG9SZWFkID0gbnVtQml0cyA8IGJpdHNMZWZ0ID8gbnVtQml0cyA6IGJpdHNMZWZ0O1xuICAgICAgICAgICAgY29uc3QgYml0c1RvTm90UmVhZCA9IGJpdHNMZWZ0IC0gdG9SZWFkO1xuICAgICAgICAgICAgY29uc3QgbWFzayA9ICgweEZGID4+ICg4IC0gdG9SZWFkKSkgPDwgYml0c1RvTm90UmVhZDtcbiAgICAgICAgICAgIHJlc3VsdCA9ICh0aGlzLmJ5dGVzW3RoaXMuYnl0ZU9mZnNldF0gJiBtYXNrKSA+PiBiaXRzVG9Ob3RSZWFkO1xuICAgICAgICAgICAgbnVtQml0cyAtPSB0b1JlYWQ7XG4gICAgICAgICAgICB0aGlzLmJpdE9mZnNldCArPSB0b1JlYWQ7XG4gICAgICAgICAgICBpZiAodGhpcy5iaXRPZmZzZXQgPT09IDgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmJpdE9mZnNldCA9IDA7XG4gICAgICAgICAgICAgICAgdGhpcy5ieXRlT2Zmc2V0Kys7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgLy8gTmV4dCByZWFkIHdob2xlIGJ5dGVzXG4gICAgICAgIGlmIChudW1CaXRzID4gMCkge1xuICAgICAgICAgICAgd2hpbGUgKG51bUJpdHMgPj0gOCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChyZXN1bHQgPDwgOCkgfCAodGhpcy5ieXRlc1t0aGlzLmJ5dGVPZmZzZXRdICYgMHhGRik7XG4gICAgICAgICAgICAgICAgdGhpcy5ieXRlT2Zmc2V0Kys7XG4gICAgICAgICAgICAgICAgbnVtQml0cyAtPSA4O1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gRmluYWxseSByZWFkIGEgcGFydGlhbCBieXRlXG4gICAgICAgICAgICBpZiAobnVtQml0cyA+IDApIHtcbiAgICAgICAgICAgICAgICBjb25zdCBiaXRzVG9Ob3RSZWFkID0gOCAtIG51bUJpdHM7XG4gICAgICAgICAgICAgICAgY29uc3QgbWFzayA9ICgweEZGID4+IGJpdHNUb05vdFJlYWQpIDw8IGJpdHNUb05vdFJlYWQ7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gKHJlc3VsdCA8PCBudW1CaXRzKSB8ICgodGhpcy5ieXRlc1t0aGlzLmJ5dGVPZmZzZXRdICYgbWFzaykgPj4gYml0c1RvTm90UmVhZCk7XG4gICAgICAgICAgICAgICAgdGhpcy5iaXRPZmZzZXQgKz0gbnVtQml0cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbiAgICBhdmFpbGFibGUoKSB7XG4gICAgICAgIHJldHVybiA4ICogKHRoaXMuYnl0ZXMubGVuZ3RoIC0gdGhpcy5ieXRlT2Zmc2V0KSAtIHRoaXMuYml0T2Zmc2V0O1xuICAgIH1cbn1cblxuLy8gdHNsaW50OmRpc2FibGU6bm8tYml0d2lzZVxudmFyIE1vZGU7XG4oZnVuY3Rpb24gKE1vZGUpIHtcbiAgICBNb2RlW1wiTnVtZXJpY1wiXSA9IFwibnVtZXJpY1wiO1xuICAgIE1vZGVbXCJBbHBoYW51bWVyaWNcIl0gPSBcImFscGhhbnVtZXJpY1wiO1xuICAgIE1vZGVbXCJCeXRlXCJdID0gXCJieXRlXCI7XG4gICAgTW9kZVtcIkthbmppXCJdID0gXCJrYW5qaVwiO1xuICAgIE1vZGVbXCJFQ0lcIl0gPSBcImVjaVwiO1xufSkoTW9kZSB8fCAoTW9kZSA9IHt9KSk7XG52YXIgTW9kZUJ5dGU7XG4oZnVuY3Rpb24gKE1vZGVCeXRlKSB7XG4gICAgTW9kZUJ5dGVbTW9kZUJ5dGVbXCJUZXJtaW5hdG9yXCJdID0gMF0gPSBcIlRlcm1pbmF0b3JcIjtcbiAgICBNb2RlQnl0ZVtNb2RlQnl0ZVtcIk51bWVyaWNcIl0gPSAxXSA9IFwiTnVtZXJpY1wiO1xuICAgIE1vZGVCeXRlW01vZGVCeXRlW1wiQWxwaGFudW1lcmljXCJdID0gMl0gPSBcIkFscGhhbnVtZXJpY1wiO1xuICAgIE1vZGVCeXRlW01vZGVCeXRlW1wiQnl0ZVwiXSA9IDRdID0gXCJCeXRlXCI7XG4gICAgTW9kZUJ5dGVbTW9kZUJ5dGVbXCJLYW5qaVwiXSA9IDhdID0gXCJLYW5qaVwiO1xuICAgIE1vZGVCeXRlW01vZGVCeXRlW1wiRUNJXCJdID0gN10gPSBcIkVDSVwiO1xuICAgIC8vIFN0cnVjdHVyZWRBcHBlbmQgPSAweDMsXG4gICAgLy8gRk5DMUZpcnN0UG9zaXRpb24gPSAweDUsXG4gICAgLy8gRk5DMVNlY29uZFBvc2l0aW9uID0gMHg5LFxufSkoTW9kZUJ5dGUgfHwgKE1vZGVCeXRlID0ge30pKTtcbmZ1bmN0aW9uIGRlY29kZU51bWVyaWMoc3RyZWFtLCBzaXplKSB7XG4gICAgY29uc3QgYnl0ZXMgPSBbXTtcbiAgICBsZXQgdGV4dCA9IFwiXCI7XG4gICAgY29uc3QgY2hhcmFjdGVyQ291bnRTaXplID0gWzEwLCAxMiwgMTRdW3NpemVdO1xuICAgIGxldCBsZW5ndGggPSBzdHJlYW0ucmVhZEJpdHMoY2hhcmFjdGVyQ291bnRTaXplKTtcbiAgICAvLyBSZWFkIGRpZ2l0cyBpbiBncm91cHMgb2YgM1xuICAgIHdoaWxlIChsZW5ndGggPj0gMykge1xuICAgICAgICBjb25zdCBudW0gPSBzdHJlYW0ucmVhZEJpdHMoMTApO1xuICAgICAgICBpZiAobnVtID49IDEwMDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbnVtZXJpYyB2YWx1ZSBhYm92ZSA5OTlcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYSA9IE1hdGguZmxvb3IobnVtIC8gMTAwKTtcbiAgICAgICAgY29uc3QgYiA9IE1hdGguZmxvb3IobnVtIC8gMTApICUgMTA7XG4gICAgICAgIGNvbnN0IGMgPSBudW0gJSAxMDtcbiAgICAgICAgYnl0ZXMucHVzaCg0OCArIGEsIDQ4ICsgYiwgNDggKyBjKTtcbiAgICAgICAgdGV4dCArPSBhLnRvU3RyaW5nKCkgKyBiLnRvU3RyaW5nKCkgKyBjLnRvU3RyaW5nKCk7XG4gICAgICAgIGxlbmd0aCAtPSAzO1xuICAgIH1cbiAgICAvLyBJZiB0aGUgbnVtYmVyIG9mIGRpZ2l0cyBhcmVuJ3QgYSBtdWx0aXBsZSBvZiAzLCB0aGUgcmVtYWluaW5nIGRpZ2l0cyBhcmUgc3BlY2lhbCBjYXNlZC5cbiAgICBpZiAobGVuZ3RoID09PSAyKSB7XG4gICAgICAgIGNvbnN0IG51bSA9IHN0cmVhbS5yZWFkQml0cyg3KTtcbiAgICAgICAgaWYgKG51bSA+PSAxMDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbnVtZXJpYyB2YWx1ZSBhYm92ZSA5OVwiKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhID0gTWF0aC5mbG9vcihudW0gLyAxMCk7XG4gICAgICAgIGNvbnN0IGIgPSBudW0gJSAxMDtcbiAgICAgICAgYnl0ZXMucHVzaCg0OCArIGEsIDQ4ICsgYik7XG4gICAgICAgIHRleHQgKz0gYS50b1N0cmluZygpICsgYi50b1N0cmluZygpO1xuICAgIH1cbiAgICBlbHNlIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgY29uc3QgbnVtID0gc3RyZWFtLnJlYWRCaXRzKDQpO1xuICAgICAgICBpZiAobnVtID49IDEwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG51bWVyaWMgdmFsdWUgYWJvdmUgOVwiKTtcbiAgICAgICAgfVxuICAgICAgICBieXRlcy5wdXNoKDQ4ICsgbnVtKTtcbiAgICAgICAgdGV4dCArPSBudW0udG9TdHJpbmcoKTtcbiAgICB9XG4gICAgcmV0dXJuIHsgYnl0ZXMsIHRleHQgfTtcbn1cbmNvbnN0IEFscGhhbnVtZXJpY0NoYXJhY3RlckNvZGVzID0gW1xuICAgIFwiMFwiLCBcIjFcIiwgXCIyXCIsIFwiM1wiLCBcIjRcIiwgXCI1XCIsIFwiNlwiLCBcIjdcIiwgXCI4XCIsXG4gICAgXCI5XCIsIFwiQVwiLCBcIkJcIiwgXCJDXCIsIFwiRFwiLCBcIkVcIiwgXCJGXCIsIFwiR1wiLCBcIkhcIixcbiAgICBcIklcIiwgXCJKXCIsIFwiS1wiLCBcIkxcIiwgXCJNXCIsIFwiTlwiLCBcIk9cIiwgXCJQXCIsIFwiUVwiLFxuICAgIFwiUlwiLCBcIlNcIiwgXCJUXCIsIFwiVVwiLCBcIlZcIiwgXCJXXCIsIFwiWFwiLCBcIllcIiwgXCJaXCIsXG4gICAgXCIgXCIsIFwiJFwiLCBcIiVcIiwgXCIqXCIsIFwiK1wiLCBcIi1cIiwgXCIuXCIsIFwiL1wiLCBcIjpcIixcbl07XG5mdW5jdGlvbiBkZWNvZGVBbHBoYW51bWVyaWMoc3RyZWFtLCBzaXplKSB7XG4gICAgY29uc3QgYnl0ZXMgPSBbXTtcbiAgICBsZXQgdGV4dCA9IFwiXCI7XG4gICAgY29uc3QgY2hhcmFjdGVyQ291bnRTaXplID0gWzksIDExLCAxM11bc2l6ZV07XG4gICAgbGV0IGxlbmd0aCA9IHN0cmVhbS5yZWFkQml0cyhjaGFyYWN0ZXJDb3VudFNpemUpO1xuICAgIHdoaWxlIChsZW5ndGggPj0gMikge1xuICAgICAgICBjb25zdCB2ID0gc3RyZWFtLnJlYWRCaXRzKDExKTtcbiAgICAgICAgY29uc3QgYSA9IE1hdGguZmxvb3IodiAvIDQ1KTtcbiAgICAgICAgY29uc3QgYiA9IHYgJSA0NTtcbiAgICAgICAgYnl0ZXMucHVzaChBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2Rlc1thXS5jaGFyQ29kZUF0KDApLCBBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2Rlc1tiXS5jaGFyQ29kZUF0KDApKTtcbiAgICAgICAgdGV4dCArPSBBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2Rlc1thXSArIEFscGhhbnVtZXJpY0NoYXJhY3RlckNvZGVzW2JdO1xuICAgICAgICBsZW5ndGggLT0gMjtcbiAgICB9XG4gICAgaWYgKGxlbmd0aCA9PT0gMSkge1xuICAgICAgICBjb25zdCBhID0gc3RyZWFtLnJlYWRCaXRzKDYpO1xuICAgICAgICBieXRlcy5wdXNoKEFscGhhbnVtZXJpY0NoYXJhY3RlckNvZGVzW2FdLmNoYXJDb2RlQXQoMCkpO1xuICAgICAgICB0ZXh0ICs9IEFscGhhbnVtZXJpY0NoYXJhY3RlckNvZGVzW2FdO1xuICAgIH1cbiAgICByZXR1cm4geyBieXRlcywgdGV4dCB9O1xufVxuZnVuY3Rpb24gZGVjb2RlQnl0ZShzdHJlYW0sIHNpemUpIHtcbiAgICBjb25zdCBieXRlcyA9IFtdO1xuICAgIGxldCB0ZXh0ID0gXCJcIjtcbiAgICBjb25zdCBjaGFyYWN0ZXJDb3VudFNpemUgPSBbOCwgMTYsIDE2XVtzaXplXTtcbiAgICBjb25zdCBsZW5ndGggPSBzdHJlYW0ucmVhZEJpdHMoY2hhcmFjdGVyQ291bnRTaXplKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IGIgPSBzdHJlYW0ucmVhZEJpdHMoOCk7XG4gICAgICAgIGJ5dGVzLnB1c2goYik7XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHRleHQgKz0gZGVjb2RlVVJJQ29tcG9uZW50KGJ5dGVzLm1hcChiID0+IGAlJHsoXCIwXCIgKyBiLnRvU3RyaW5nKDE2KSkuc3Vic3RyKC0yKX1gKS5qb2luKFwiXCIpKTtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIC8vIGZhaWxlZCB0byBkZWNvZGVcbiAgICB9XG4gICAgcmV0dXJuIHsgYnl0ZXMsIHRleHQgfTtcbn1cbmZ1bmN0aW9uIGRlY29kZUthbmppKHN0cmVhbSwgc2l6ZSkge1xuICAgIGNvbnN0IGJ5dGVzID0gW107XG4gICAgY29uc3QgY2hhcmFjdGVyQ291bnRTaXplID0gWzgsIDEwLCAxMl1bc2l6ZV07XG4gICAgY29uc3QgbGVuZ3RoID0gc3RyZWFtLnJlYWRCaXRzKGNoYXJhY3RlckNvdW50U2l6ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBrID0gc3RyZWFtLnJlYWRCaXRzKDEzKTtcbiAgICAgICAgbGV0IGMgPSAoTWF0aC5mbG9vcihrIC8gMHhDMCkgPDwgOCkgfCAoayAlIDB4QzApO1xuICAgICAgICBpZiAoYyA8IDB4MUYwMCkge1xuICAgICAgICAgICAgYyArPSAweDgxNDA7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBjICs9IDB4QzE0MDtcbiAgICAgICAgfVxuICAgICAgICBieXRlcy5wdXNoKGMgPj4gOCwgYyAmIDB4RkYpO1xuICAgIH1cbiAgICBjb25zdCB0ZXh0ID0gbmV3IFRleHREZWNvZGVyKFwic2hpZnQtamlzXCIpLmRlY29kZShVaW50OEFycmF5LmZyb20oYnl0ZXMpKTtcbiAgICByZXR1cm4geyBieXRlcywgdGV4dCB9O1xufVxuZnVuY3Rpb24gZGVjb2RlKGRhdGEsIHZlcnNpb24pIHtcbiAgICBjb25zdCBzdHJlYW0gPSBuZXcgQml0U3RyZWFtKGRhdGEpO1xuICAgIC8vIFRoZXJlIGFyZSAzICdzaXplcycgYmFzZWQgb24gdGhlIHZlcnNpb24uIDEtOSBpcyBzbWFsbCAoMCksIDEwLTI2IGlzIG1lZGl1bSAoMSkgYW5kIDI3LTQwIGlzIGxhcmdlICgyKS5cbiAgICBjb25zdCBzaXplID0gdmVyc2lvbiA8PSA5ID8gMCA6IHZlcnNpb24gPD0gMjYgPyAxIDogMjtcbiAgICBjb25zdCByZXN1bHQgPSB7XG4gICAgICAgIHRleHQ6IFwiXCIsXG4gICAgICAgIGJ5dGVzOiBbXSxcbiAgICAgICAgY2h1bmtzOiBbXSxcbiAgICB9O1xuICAgIHdoaWxlIChzdHJlYW0uYXZhaWxhYmxlKCkgPj0gNCkge1xuICAgICAgICBjb25zdCBtb2RlID0gc3RyZWFtLnJlYWRCaXRzKDQpO1xuICAgICAgICBpZiAobW9kZSA9PT0gTW9kZUJ5dGUuVGVybWluYXRvcikge1xuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtb2RlID09PSBNb2RlQnl0ZS5FQ0kpIHtcbiAgICAgICAgICAgIGlmIChzdHJlYW0ucmVhZEJpdHMoMSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuY2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBNb2RlLkVDSSxcbiAgICAgICAgICAgICAgICAgICAgYXNzaWdubWVudE51bWJlcjogc3RyZWFtLnJlYWRCaXRzKDcpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RyZWFtLnJlYWRCaXRzKDEpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNodW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTW9kZS5FQ0ksXG4gICAgICAgICAgICAgICAgICAgIGFzc2lnbm1lbnROdW1iZXI6IHN0cmVhbS5yZWFkQml0cygxNCksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIGlmIChzdHJlYW0ucmVhZEJpdHMoMSkgPT09IDApIHtcbiAgICAgICAgICAgICAgICByZXN1bHQuY2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBNb2RlLkVDSSxcbiAgICAgICAgICAgICAgICAgICAgYXNzaWdubWVudE51bWJlcjogc3RyZWFtLnJlYWRCaXRzKDIxKSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIC8vIEVDSSBkYXRhIHNlZW1zIGNvcnJ1cHRlZFxuICAgICAgICAgICAgICAgIHJlc3VsdC5jaHVua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE1vZGUuRUNJLFxuICAgICAgICAgICAgICAgICAgICBhc3NpZ25tZW50TnVtYmVyOiAtMSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtb2RlID09PSBNb2RlQnl0ZS5OdW1lcmljKSB7XG4gICAgICAgICAgICBjb25zdCBudW1lcmljUmVzdWx0ID0gZGVjb2RlTnVtZXJpYyhzdHJlYW0sIHNpemUpO1xuICAgICAgICAgICAgcmVzdWx0LnRleHQgKz0gbnVtZXJpY1Jlc3VsdC50ZXh0O1xuICAgICAgICAgICAgcmVzdWx0LmJ5dGVzLnB1c2goLi4ubnVtZXJpY1Jlc3VsdC5ieXRlcyk7XG4gICAgICAgICAgICByZXN1bHQuY2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IE1vZGUuTnVtZXJpYyxcbiAgICAgICAgICAgICAgICB0ZXh0OiBudW1lcmljUmVzdWx0LnRleHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtb2RlID09PSBNb2RlQnl0ZS5BbHBoYW51bWVyaWMpIHtcbiAgICAgICAgICAgIGNvbnN0IGFscGhhbnVtZXJpY1Jlc3VsdCA9IGRlY29kZUFscGhhbnVtZXJpYyhzdHJlYW0sIHNpemUpO1xuICAgICAgICAgICAgcmVzdWx0LnRleHQgKz0gYWxwaGFudW1lcmljUmVzdWx0LnRleHQ7XG4gICAgICAgICAgICByZXN1bHQuYnl0ZXMucHVzaCguLi5hbHBoYW51bWVyaWNSZXN1bHQuYnl0ZXMpO1xuICAgICAgICAgICAgcmVzdWx0LmNodW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBNb2RlLkFscGhhbnVtZXJpYyxcbiAgICAgICAgICAgICAgICB0ZXh0OiBhbHBoYW51bWVyaWNSZXN1bHQudGV4dCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1vZGUgPT09IE1vZGVCeXRlLkJ5dGUpIHtcbiAgICAgICAgICAgIGNvbnN0IGJ5dGVSZXN1bHQgPSBkZWNvZGVCeXRlKHN0cmVhbSwgc2l6ZSk7XG4gICAgICAgICAgICByZXN1bHQudGV4dCArPSBieXRlUmVzdWx0LnRleHQ7XG4gICAgICAgICAgICByZXN1bHQuYnl0ZXMucHVzaCguLi5ieXRlUmVzdWx0LmJ5dGVzKTtcbiAgICAgICAgICAgIHJlc3VsdC5jaHVua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogTW9kZS5CeXRlLFxuICAgICAgICAgICAgICAgIGJ5dGVzOiBieXRlUmVzdWx0LmJ5dGVzLFxuICAgICAgICAgICAgICAgIHRleHQ6IGJ5dGVSZXN1bHQudGV4dCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICAgIGVsc2UgaWYgKG1vZGUgPT09IE1vZGVCeXRlLkthbmppKSB7XG4gICAgICAgICAgICBjb25zdCBrYW5qaVJlc3VsdCA9IGRlY29kZUthbmppKHN0cmVhbSwgc2l6ZSk7XG4gICAgICAgICAgICByZXN1bHQudGV4dCArPSBrYW5qaVJlc3VsdC50ZXh0O1xuICAgICAgICAgICAgcmVzdWx0LmJ5dGVzLnB1c2goLi4ua2FuamlSZXN1bHQuYnl0ZXMpO1xuICAgICAgICAgICAgcmVzdWx0LmNodW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBNb2RlLkthbmppLFxuICAgICAgICAgICAgICAgIGJ5dGVzOiBrYW5qaVJlc3VsdC5ieXRlcyxcbiAgICAgICAgICAgICAgICB0ZXh0OiBrYW5qaVJlc3VsdC50ZXh0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgdGhlcmUgaXMgbm8gZGF0YSBsZWZ0LCBvciB0aGUgcmVtYWluaW5nIGJpdHMgYXJlIGFsbCAwLCB0aGVuIHRoYXQgY291bnRzIGFzIGEgdGVybWluYXRpb24gbWFya2VyXG4gICAgaWYgKHN0cmVhbS5hdmFpbGFibGUoKSA9PT0gMCB8fCBzdHJlYW0ucmVhZEJpdHMoc3RyZWFtLmF2YWlsYWJsZSgpKSA9PT0gMCkge1xuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH1cbn1cblxuY2xhc3MgR2VuZXJpY0dGUG9seSB7XG4gICAgY29uc3RydWN0b3IoZmllbGQsIGNvZWZmaWNpZW50cykge1xuICAgICAgICBpZiAoY29lZmZpY2llbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiTm8gY29lZmZpY2llbnRzLlwiKTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLmZpZWxkID0gZmllbGQ7XG4gICAgICAgIGNvbnN0IGNvZWZmaWNpZW50c0xlbmd0aCA9IGNvZWZmaWNpZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChjb2VmZmljaWVudHNMZW5ndGggPiAxICYmIGNvZWZmaWNpZW50c1swXSA9PT0gMCkge1xuICAgICAgICAgICAgLy8gTGVhZGluZyB0ZXJtIG11c3QgYmUgbm9uLXplcm8gZm9yIGFueXRoaW5nIGV4Y2VwdCB0aGUgY29uc3RhbnQgcG9seW5vbWlhbCBcIjBcIlxuICAgICAgICAgICAgbGV0IGZpcnN0Tm9uWmVybyA9IDE7XG4gICAgICAgICAgICB3aGlsZSAoZmlyc3ROb25aZXJvIDwgY29lZmZpY2llbnRzTGVuZ3RoICYmIGNvZWZmaWNpZW50c1tmaXJzdE5vblplcm9dID09PSAwKSB7XG4gICAgICAgICAgICAgICAgZmlyc3ROb25aZXJvKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoZmlyc3ROb25aZXJvID09PSBjb2VmZmljaWVudHNMZW5ndGgpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvZWZmaWNpZW50cyA9IGZpZWxkLnplcm8uY29lZmZpY2llbnRzO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2VmZmljaWVudHMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoY29lZmZpY2llbnRzTGVuZ3RoIC0gZmlyc3ROb25aZXJvKTtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuY29lZmZpY2llbnRzW2ldID0gY29lZmZpY2llbnRzW2ZpcnN0Tm9uWmVybyArIGldO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIHRoaXMuY29lZmZpY2llbnRzID0gY29lZmZpY2llbnRzO1xuICAgICAgICB9XG4gICAgfVxuICAgIGRlZ3JlZSgpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aCAtIDE7XG4gICAgfVxuICAgIGlzWmVybygpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29lZmZpY2llbnRzWzBdID09PSAwO1xuICAgIH1cbiAgICBnZXRDb2VmZmljaWVudChkZWdyZWUpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuY29lZmZpY2llbnRzW3RoaXMuY29lZmZpY2llbnRzLmxlbmd0aCAtIDEgLSBkZWdyZWVdO1xuICAgIH1cbiAgICBhZGRPclN1YnRyYWN0KG90aGVyKSB7XG4gICAgICAgIGlmICh0aGlzLmlzWmVybygpKSB7XG4gICAgICAgICAgICByZXR1cm4gb3RoZXI7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKG90aGVyLmlzWmVybygpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgICAgICBsZXQgc21hbGxlckNvZWZmaWNpZW50cyA9IHRoaXMuY29lZmZpY2llbnRzO1xuICAgICAgICBsZXQgbGFyZ2VyQ29lZmZpY2llbnRzID0gb3RoZXIuY29lZmZpY2llbnRzO1xuICAgICAgICBpZiAoc21hbGxlckNvZWZmaWNpZW50cy5sZW5ndGggPiBsYXJnZXJDb2VmZmljaWVudHMubGVuZ3RoKSB7XG4gICAgICAgICAgICBbc21hbGxlckNvZWZmaWNpZW50cywgbGFyZ2VyQ29lZmZpY2llbnRzXSA9IFtsYXJnZXJDb2VmZmljaWVudHMsIHNtYWxsZXJDb2VmZmljaWVudHNdO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHN1bURpZmYgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkobGFyZ2VyQ29lZmZpY2llbnRzLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGxlbmd0aERpZmYgPSBsYXJnZXJDb2VmZmljaWVudHMubGVuZ3RoIC0gc21hbGxlckNvZWZmaWNpZW50cy5sZW5ndGg7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoRGlmZjsgaSsrKSB7XG4gICAgICAgICAgICBzdW1EaWZmW2ldID0gbGFyZ2VyQ29lZmZpY2llbnRzW2ldO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSBsZW5ndGhEaWZmOyBpIDwgbGFyZ2VyQ29lZmZpY2llbnRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBzdW1EaWZmW2ldID0gYWRkT3JTdWJ0cmFjdEdGKHNtYWxsZXJDb2VmZmljaWVudHNbaSAtIGxlbmd0aERpZmZdLCBsYXJnZXJDb2VmZmljaWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgR2VuZXJpY0dGUG9seSh0aGlzLmZpZWxkLCBzdW1EaWZmKTtcbiAgICB9XG4gICAgbXVsdGlwbHkoc2NhbGFyKSB7XG4gICAgICAgIGlmIChzY2FsYXIgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpZWxkLnplcm87XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHNjYWxhciA9PT0gMSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IG5ldyBVaW50OENsYW1wZWRBcnJheShzaXplKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIHByb2R1Y3RbaV0gPSB0aGlzLmZpZWxkLm11bHRpcGx5KHRoaXMuY29lZmZpY2llbnRzW2ldLCBzY2FsYXIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgR2VuZXJpY0dGUG9seSh0aGlzLmZpZWxkLCBwcm9kdWN0KTtcbiAgICB9XG4gICAgbXVsdGlwbHlQb2x5KG90aGVyKSB7XG4gICAgICAgIGlmICh0aGlzLmlzWmVybygpIHx8IG90aGVyLmlzWmVybygpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWVsZC56ZXJvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGFDb2VmZmljaWVudHMgPSB0aGlzLmNvZWZmaWNpZW50cztcbiAgICAgICAgY29uc3QgYUxlbmd0aCA9IGFDb2VmZmljaWVudHMubGVuZ3RoO1xuICAgICAgICBjb25zdCBiQ29lZmZpY2llbnRzID0gb3RoZXIuY29lZmZpY2llbnRzO1xuICAgICAgICBjb25zdCBiTGVuZ3RoID0gYkNvZWZmaWNpZW50cy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoYUxlbmd0aCArIGJMZW5ndGggLSAxKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBhTGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IGFDb2VmZiA9IGFDb2VmZmljaWVudHNbaV07XG4gICAgICAgICAgICBmb3IgKGxldCBqID0gMDsgaiA8IGJMZW5ndGg7IGorKykge1xuICAgICAgICAgICAgICAgIHByb2R1Y3RbaSArIGpdID0gYWRkT3JTdWJ0cmFjdEdGKHByb2R1Y3RbaSArIGpdLCB0aGlzLmZpZWxkLm11bHRpcGx5KGFDb2VmZiwgYkNvZWZmaWNpZW50c1tqXSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJldHVybiBuZXcgR2VuZXJpY0dGUG9seSh0aGlzLmZpZWxkLCBwcm9kdWN0KTtcbiAgICB9XG4gICAgbXVsdGlwbHlCeU1vbm9taWFsKGRlZ3JlZSwgY29lZmZpY2llbnQpIHtcbiAgICAgICAgaWYgKGRlZ3JlZSA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgZGVncmVlIGxlc3MgdGhhbiAwXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2VmZmljaWVudCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmllbGQuemVybztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzaXplID0gdGhpcy5jb2VmZmljaWVudHMubGVuZ3RoO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHNpemUgKyBkZWdyZWUpO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgcHJvZHVjdFtpXSA9IHRoaXMuZmllbGQubXVsdGlwbHkodGhpcy5jb2VmZmljaWVudHNbaV0sIGNvZWZmaWNpZW50KTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEdlbmVyaWNHRlBvbHkodGhpcy5maWVsZCwgcHJvZHVjdCk7XG4gICAgfVxuICAgIGV2YWx1YXRlQXQoYSkge1xuICAgICAgICBsZXQgcmVzdWx0ID0gMDtcbiAgICAgICAgaWYgKGEgPT09IDApIHtcbiAgICAgICAgICAgIC8vIEp1c3QgcmV0dXJuIHRoZSB4XjAgY29lZmZpY2llbnRcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmdldENvZWZmaWNpZW50KDApO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGg7XG4gICAgICAgIGlmIChhID09PSAxKSB7XG4gICAgICAgICAgICAvLyBKdXN0IHRoZSBzdW0gb2YgdGhlIGNvZWZmaWNpZW50c1xuICAgICAgICAgICAgdGhpcy5jb2VmZmljaWVudHMuZm9yRWFjaCgoY29lZmZpY2llbnQpID0+IHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBhZGRPclN1YnRyYWN0R0YocmVzdWx0LCBjb2VmZmljaWVudCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0ID0gdGhpcy5jb2VmZmljaWVudHNbMF07XG4gICAgICAgIGZvciAobGV0IGkgPSAxOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHQgPSBhZGRPclN1YnRyYWN0R0YodGhpcy5maWVsZC5tdWx0aXBseShhLCByZXN1bHQpLCB0aGlzLmNvZWZmaWNpZW50c1tpXSk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIGFkZE9yU3VidHJhY3RHRihhLCBiKSB7XG4gICAgcmV0dXJuIGEgXiBiOyAvLyB0c2xpbnQ6ZGlzYWJsZS1saW5lOm5vLWJpdHdpc2Vcbn1cbmNsYXNzIEdlbmVyaWNHRiB7XG4gICAgY29uc3RydWN0b3IocHJpbWl0aXZlLCBzaXplLCBnZW5CYXNlKSB7XG4gICAgICAgIHRoaXMucHJpbWl0aXZlID0gcHJpbWl0aXZlO1xuICAgICAgICB0aGlzLnNpemUgPSBzaXplO1xuICAgICAgICB0aGlzLmdlbmVyYXRvckJhc2UgPSBnZW5CYXNlO1xuICAgICAgICB0aGlzLmV4cFRhYmxlID0gbmV3IEFycmF5KHRoaXMuc2l6ZSk7XG4gICAgICAgIHRoaXMubG9nVGFibGUgPSBuZXcgQXJyYXkodGhpcy5zaXplKTtcbiAgICAgICAgbGV0IHggPSAxO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMuc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmV4cFRhYmxlW2ldID0geDtcbiAgICAgICAgICAgIHggPSB4ICogMjtcbiAgICAgICAgICAgIGlmICh4ID49IHRoaXMuc2l6ZSkge1xuICAgICAgICAgICAgICAgIHggPSAoeCBeIHRoaXMucHJpbWl0aXZlKSAmICh0aGlzLnNpemUgLSAxKTsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1iaXR3aXNlXG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNpemUgLSAxOyBpKyspIHtcbiAgICAgICAgICAgIHRoaXMubG9nVGFibGVbdGhpcy5leHBUYWJsZVtpXV0gPSBpO1xuICAgICAgICB9XG4gICAgICAgIHRoaXMuemVybyA9IG5ldyBHZW5lcmljR0ZQb2x5KHRoaXMsIFVpbnQ4Q2xhbXBlZEFycmF5LmZyb20oWzBdKSk7XG4gICAgICAgIHRoaXMub25lID0gbmV3IEdlbmVyaWNHRlBvbHkodGhpcywgVWludDhDbGFtcGVkQXJyYXkuZnJvbShbMV0pKTtcbiAgICB9XG4gICAgbXVsdGlwbHkoYSwgYikge1xuICAgICAgICBpZiAoYSA9PT0gMCB8fCBiID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5leHBUYWJsZVsodGhpcy5sb2dUYWJsZVthXSArIHRoaXMubG9nVGFibGVbYl0pICUgKHRoaXMuc2l6ZSAtIDEpXTtcbiAgICB9XG4gICAgaW52ZXJzZShhKSB7XG4gICAgICAgIGlmIChhID09PSAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW4ndCBpbnZlcnQgMFwiKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdGhpcy5leHBUYWJsZVt0aGlzLnNpemUgLSB0aGlzLmxvZ1RhYmxlW2FdIC0gMV07XG4gICAgfVxuICAgIGJ1aWxkTW9ub21pYWwoZGVncmVlLCBjb2VmZmljaWVudCkge1xuICAgICAgICBpZiAoZGVncmVlIDwgMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBtb25vbWlhbCBkZWdyZWUgbGVzcyB0aGFuIDBcIik7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGNvZWZmaWNpZW50ID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy56ZXJvO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGNvZWZmaWNpZW50cyA9IG5ldyBVaW50OENsYW1wZWRBcnJheShkZWdyZWUgKyAxKTtcbiAgICAgICAgY29lZmZpY2llbnRzWzBdID0gY29lZmZpY2llbnQ7XG4gICAgICAgIHJldHVybiBuZXcgR2VuZXJpY0dGUG9seSh0aGlzLCBjb2VmZmljaWVudHMpO1xuICAgIH1cbiAgICBsb2coYSkge1xuICAgICAgICBpZiAoYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgdGFrZSBsb2coMClcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMubG9nVGFibGVbYV07XG4gICAgfVxuICAgIGV4cChhKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmV4cFRhYmxlW2FdO1xuICAgIH1cbn1cblxuZnVuY3Rpb24gcnVuRXVjbGlkZWFuQWxnb3JpdGhtKGZpZWxkLCBhLCBiLCBSKSB7XG4gICAgLy8gQXNzdW1lIGEncyBkZWdyZWUgaXMgPj0gYidzXG4gICAgaWYgKGEuZGVncmVlKCkgPCBiLmRlZ3JlZSgpKSB7XG4gICAgICAgIFthLCBiXSA9IFtiLCBhXTtcbiAgICB9XG4gICAgbGV0IHJMYXN0ID0gYTtcbiAgICBsZXQgciA9IGI7XG4gICAgbGV0IHRMYXN0ID0gZmllbGQuemVybztcbiAgICBsZXQgdCA9IGZpZWxkLm9uZTtcbiAgICAvLyBSdW4gRXVjbGlkZWFuIGFsZ29yaXRobSB1bnRpbCByJ3MgZGVncmVlIGlzIGxlc3MgdGhhbiBSLzJcbiAgICB3aGlsZSAoci5kZWdyZWUoKSA+PSBSIC8gMikge1xuICAgICAgICBjb25zdCByTGFzdExhc3QgPSByTGFzdDtcbiAgICAgICAgY29uc3QgdExhc3RMYXN0ID0gdExhc3Q7XG4gICAgICAgIHJMYXN0ID0gcjtcbiAgICAgICAgdExhc3QgPSB0O1xuICAgICAgICAvLyBEaXZpZGUgckxhc3RMYXN0IGJ5IHJMYXN0LCB3aXRoIHF1b3RpZW50IGluIHEgYW5kIHJlbWFpbmRlciBpbiByXG4gICAgICAgIGlmIChyTGFzdC5pc1plcm8oKSkge1xuICAgICAgICAgICAgLy8gRXVjbGlkZWFuIGFsZ29yaXRobSBhbHJlYWR5IHRlcm1pbmF0ZWQ/XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICByID0gckxhc3RMYXN0O1xuICAgICAgICBsZXQgcSA9IGZpZWxkLnplcm87XG4gICAgICAgIGNvbnN0IGRlbm9taW5hdG9yTGVhZGluZ1Rlcm0gPSByTGFzdC5nZXRDb2VmZmljaWVudChyTGFzdC5kZWdyZWUoKSk7XG4gICAgICAgIGNvbnN0IGRsdEludmVyc2UgPSBmaWVsZC5pbnZlcnNlKGRlbm9taW5hdG9yTGVhZGluZ1Rlcm0pO1xuICAgICAgICB3aGlsZSAoci5kZWdyZWUoKSA+PSByTGFzdC5kZWdyZWUoKSAmJiAhci5pc1plcm8oKSkge1xuICAgICAgICAgICAgY29uc3QgZGVncmVlRGlmZiA9IHIuZGVncmVlKCkgLSByTGFzdC5kZWdyZWUoKTtcbiAgICAgICAgICAgIGNvbnN0IHNjYWxlID0gZmllbGQubXVsdGlwbHkoci5nZXRDb2VmZmljaWVudChyLmRlZ3JlZSgpKSwgZGx0SW52ZXJzZSk7XG4gICAgICAgICAgICBxID0gcS5hZGRPclN1YnRyYWN0KGZpZWxkLmJ1aWxkTW9ub21pYWwoZGVncmVlRGlmZiwgc2NhbGUpKTtcbiAgICAgICAgICAgIHIgPSByLmFkZE9yU3VidHJhY3Qockxhc3QubXVsdGlwbHlCeU1vbm9taWFsKGRlZ3JlZURpZmYsIHNjYWxlKSk7XG4gICAgICAgIH1cbiAgICAgICAgdCA9IHEubXVsdGlwbHlQb2x5KHRMYXN0KS5hZGRPclN1YnRyYWN0KHRMYXN0TGFzdCk7XG4gICAgICAgIGlmIChyLmRlZ3JlZSgpID49IHJMYXN0LmRlZ3JlZSgpKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBzaWdtYVRpbGRlQXRaZXJvID0gdC5nZXRDb2VmZmljaWVudCgwKTtcbiAgICBpZiAoc2lnbWFUaWxkZUF0WmVybyA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgaW52ZXJzZSA9IGZpZWxkLmludmVyc2Uoc2lnbWFUaWxkZUF0WmVybyk7XG4gICAgcmV0dXJuIFt0Lm11bHRpcGx5KGludmVyc2UpLCByLm11bHRpcGx5KGludmVyc2UpXTtcbn1cbmZ1bmN0aW9uIGZpbmRFcnJvckxvY2F0aW9ucyhmaWVsZCwgZXJyb3JMb2NhdG9yKSB7XG4gICAgLy8gVGhpcyBpcyBhIGRpcmVjdCBhcHBsaWNhdGlvbiBvZiBDaGllbidzIHNlYXJjaFxuICAgIGNvbnN0IG51bUVycm9ycyA9IGVycm9yTG9jYXRvci5kZWdyZWUoKTtcbiAgICBpZiAobnVtRXJyb3JzID09PSAxKSB7XG4gICAgICAgIHJldHVybiBbZXJyb3JMb2NhdG9yLmdldENvZWZmaWNpZW50KDEpXTtcbiAgICB9XG4gICAgY29uc3QgcmVzdWx0ID0gbmV3IEFycmF5KG51bUVycm9ycyk7XG4gICAgbGV0IGVycm9yQ291bnQgPSAwO1xuICAgIGZvciAobGV0IGkgPSAxOyBpIDwgZmllbGQuc2l6ZSAmJiBlcnJvckNvdW50IDwgbnVtRXJyb3JzOyBpKyspIHtcbiAgICAgICAgaWYgKGVycm9yTG9jYXRvci5ldmFsdWF0ZUF0KGkpID09PSAwKSB7XG4gICAgICAgICAgICByZXN1bHRbZXJyb3JDb3VudF0gPSBmaWVsZC5pbnZlcnNlKGkpO1xuICAgICAgICAgICAgZXJyb3JDb3VudCsrO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmIChlcnJvckNvdW50ICE9PSBudW1FcnJvcnMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBmaW5kRXJyb3JNYWduaXR1ZGVzKGZpZWxkLCBlcnJvckV2YWx1YXRvciwgZXJyb3JMb2NhdGlvbnMpIHtcbiAgICAvLyBUaGlzIGlzIGRpcmVjdGx5IGFwcGx5aW5nIEZvcm5leSdzIEZvcm11bGFcbiAgICBjb25zdCBzID0gZXJyb3JMb2NhdGlvbnMubGVuZ3RoO1xuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBBcnJheShzKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHM7IGkrKykge1xuICAgICAgICBjb25zdCB4aUludmVyc2UgPSBmaWVsZC5pbnZlcnNlKGVycm9yTG9jYXRpb25zW2ldKTtcbiAgICAgICAgbGV0IGRlbm9taW5hdG9yID0gMTtcbiAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBzOyBqKyspIHtcbiAgICAgICAgICAgIGlmIChpICE9PSBqKSB7XG4gICAgICAgICAgICAgICAgZGVub21pbmF0b3IgPSBmaWVsZC5tdWx0aXBseShkZW5vbWluYXRvciwgYWRkT3JTdWJ0cmFjdEdGKDEsIGZpZWxkLm11bHRpcGx5KGVycm9yTG9jYXRpb25zW2pdLCB4aUludmVyc2UpKSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVzdWx0W2ldID0gZmllbGQubXVsdGlwbHkoZXJyb3JFdmFsdWF0b3IuZXZhbHVhdGVBdCh4aUludmVyc2UpLCBmaWVsZC5pbnZlcnNlKGRlbm9taW5hdG9yKSk7XG4gICAgICAgIGlmIChmaWVsZC5nZW5lcmF0b3JCYXNlICE9PSAwKSB7XG4gICAgICAgICAgICByZXN1bHRbaV0gPSBmaWVsZC5tdWx0aXBseShyZXN1bHRbaV0sIHhpSW52ZXJzZSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbn1cbmZ1bmN0aW9uIGRlY29kZSQxKGJ5dGVzLCB0d29TKSB7XG4gICAgY29uc3Qgb3V0cHV0Qnl0ZXMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoYnl0ZXMubGVuZ3RoKTtcbiAgICBvdXRwdXRCeXRlcy5zZXQoYnl0ZXMpO1xuICAgIGNvbnN0IGZpZWxkID0gbmV3IEdlbmVyaWNHRigweDAxMUQsIDI1NiwgMCk7IC8vIHheOCArIHheNCArIHheMyArIHheMiArIDFcbiAgICBjb25zdCBwb2x5ID0gbmV3IEdlbmVyaWNHRlBvbHkoZmllbGQsIG91dHB1dEJ5dGVzKTtcbiAgICBjb25zdCBzeW5kcm9tZUNvZWZmaWNpZW50cyA9IG5ldyBVaW50OENsYW1wZWRBcnJheSh0d29TKTtcbiAgICBsZXQgZXJyb3IgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBzID0gMDsgcyA8IHR3b1M7IHMrKykge1xuICAgICAgICBjb25zdCBldmFsdWF0aW9uID0gcG9seS5ldmFsdWF0ZUF0KGZpZWxkLmV4cChzICsgZmllbGQuZ2VuZXJhdG9yQmFzZSkpO1xuICAgICAgICBzeW5kcm9tZUNvZWZmaWNpZW50c1tzeW5kcm9tZUNvZWZmaWNpZW50cy5sZW5ndGggLSAxIC0gc10gPSBldmFsdWF0aW9uO1xuICAgICAgICBpZiAoZXZhbHVhdGlvbiAhPT0gMCkge1xuICAgICAgICAgICAgZXJyb3IgPSB0cnVlO1xuICAgICAgICB9XG4gICAgfVxuICAgIGlmICghZXJyb3IpIHtcbiAgICAgICAgcmV0dXJuIG91dHB1dEJ5dGVzO1xuICAgIH1cbiAgICBjb25zdCBzeW5kcm9tZSA9IG5ldyBHZW5lcmljR0ZQb2x5KGZpZWxkLCBzeW5kcm9tZUNvZWZmaWNpZW50cyk7XG4gICAgY29uc3Qgc2lnbWFPbWVnYSA9IHJ1bkV1Y2xpZGVhbkFsZ29yaXRobShmaWVsZCwgZmllbGQuYnVpbGRNb25vbWlhbCh0d29TLCAxKSwgc3luZHJvbWUsIHR3b1MpO1xuICAgIGlmIChzaWdtYU9tZWdhID09PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBlcnJvckxvY2F0aW9ucyA9IGZpbmRFcnJvckxvY2F0aW9ucyhmaWVsZCwgc2lnbWFPbWVnYVswXSk7XG4gICAgaWYgKGVycm9yTG9jYXRpb25zID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGVycm9yTWFnbml0dWRlcyA9IGZpbmRFcnJvck1hZ25pdHVkZXMoZmllbGQsIHNpZ21hT21lZ2FbMV0sIGVycm9yTG9jYXRpb25zKTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGVycm9yTG9jYXRpb25zLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHBvc2l0aW9uID0gb3V0cHV0Qnl0ZXMubGVuZ3RoIC0gMSAtIGZpZWxkLmxvZyhlcnJvckxvY2F0aW9uc1tpXSk7XG4gICAgICAgIGlmIChwb3NpdGlvbiA8IDApIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIG91dHB1dEJ5dGVzW3Bvc2l0aW9uXSA9IGFkZE9yU3VidHJhY3RHRihvdXRwdXRCeXRlc1twb3NpdGlvbl0sIGVycm9yTWFnbml0dWRlc1tpXSk7XG4gICAgfVxuICAgIHJldHVybiBvdXRwdXRCeXRlcztcbn1cblxuY29uc3QgVkVSU0lPTlMgPSBbXG4gICAge1xuICAgICAgICBpbmZvQml0czogbnVsbCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMSxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFtdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiA3LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTkgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDEwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDEzLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTMgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE3LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOSB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiBudWxsLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDE4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzNCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyOCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMiB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiBudWxsLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDIyXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTUsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA1NSB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNyB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMyB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiBudWxsLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiA0LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA4MCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzMiB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA5IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IG51bGwsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDUsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEwOCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0MyB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogbnVsbCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogNixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzNF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNjggfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjcgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTkgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwN0M5NCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogNyxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyMiwgMzhdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDc4IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDMxIH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE0IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDA4NUJDLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiA4LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI0LCA0Ml0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOTcgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM4IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM5IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTggfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTkgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwOUE5OSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogOSxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNiwgNDZdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNiB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMzYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMzcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDBBNEQzLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAxMCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyOCwgNTBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA2OCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA2OSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQzIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ0IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTkgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjAgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwQkJGNixcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTEsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU0XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA4MSB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNTAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNTEgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDBDNzYyLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAxMixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMiwgNThdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA5MiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA5MyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjEgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwRDg0NyxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTMsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzQsIDYyXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMDcgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjEgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MEU2MEQsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDE0LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA0NiwgNjZdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDEgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MEY5MjgsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDE1LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA0OCwgNzBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA4NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA4OCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQxIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTBCNzgsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDE2LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA1MCwgNzRdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA5OCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA5OSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE5IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIwIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDExNDVELFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAxNyxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTQsIDc4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTA3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEwOCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxMkExNyxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTgsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU2LCA4Ml0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjEgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0MyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxMzUzMixcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTksXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU4LCA4Nl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExMyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTQgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjIgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTQgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTQ5QTYsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDIwLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDM0LCA2MiwgOTBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMDcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTA4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxNTY4MyxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMjEsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjgsIDUwLCA3MiwgOTRdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDIgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxNjhDOSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMjIsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjYsIDUwLCA3NCwgOThdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTEyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDM0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTc3RUMsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDIzLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1NCwgNzQsIDEwMl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjIgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxOEVDNCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMjQsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjgsIDU0LCA4MCwgMTA2XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExOCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTkxRTEsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDI1LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMyLCA1OCwgODQsIDExMF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEwNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDFBRkFCLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyNixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTgsIDg2LCAxMTRdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxQjA4RSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMjcsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzQsIDYyLCA5MCwgMTE4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIzIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MUNDMUEsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDI4LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA1MCwgNzQsIDk4LCAxMjJdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExOCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MUQzM0YsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDI5LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1NCwgNzgsIDEwMiwgMTI2XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIzIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MUVENzUsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDMwLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA1MiwgNzgsIDEwNCwgMTMwXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MUYyNTAsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDMxLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1NiwgODIsIDEwOCwgMTM0XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDI4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDIwOUQ1LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzMixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzNCwgNjAsIDg2LCAxMTIsIDEzOF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDE3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNSB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDM1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDIxNkYwLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzMyxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTgsIDg2LCAxMTQsIDE0Ml0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQ2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDIyOEJBLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzNCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzNCwgNjIsIDkwLCAxMTgsIDE0Nl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0NCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1OSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyMzc5RixcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzUsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU0LCA3OCwgMTAyLCAxMjYsIDE1MF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0OCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzOSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDI0QjBCLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzNixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNCwgNTAsIDc2LCAxMDIsIDEyOCwgMTU0XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIxIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjIgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDY0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDI1NDJFLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzNyxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyOCwgNTQsIDgwLCAxMDYsIDEzMiwgMTU4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQ5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MjZBNjQsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDM4LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMyLCA1OCwgODQsIDExMCwgMTM2LCAxNjJdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNDgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyNzU0MSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzksXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjYsIDU0LCA4MiwgMTEwLCAxMzgsIDE2Nl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNjcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MjhDNjksXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDQwLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1OCwgODYsIDExNCwgMTQyLCAxNzBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE4IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExOSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDM0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2MSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG5dO1xuXG4vLyB0c2xpbnQ6ZGlzYWJsZTpuby1iaXR3aXNlXG5mdW5jdGlvbiBudW1CaXRzRGlmZmVyaW5nKHgsIHkpIHtcbiAgICBsZXQgeiA9IHggXiB5O1xuICAgIGxldCBiaXRDb3VudCA9IDA7XG4gICAgd2hpbGUgKHopIHtcbiAgICAgICAgYml0Q291bnQrKztcbiAgICAgICAgeiAmPSB6IC0gMTtcbiAgICB9XG4gICAgcmV0dXJuIGJpdENvdW50O1xufVxuZnVuY3Rpb24gcHVzaEJpdChiaXQsIGJ5dGUpIHtcbiAgICByZXR1cm4gKGJ5dGUgPDwgMSkgfCBiaXQ7XG59XG4vLyB0c2xpbnQ6ZW5hYmxlOm5vLWJpdHdpc2VcbmNvbnN0IEZPUk1BVF9JTkZPX1RBQkxFID0gW1xuICAgIHsgYml0czogMHg1NDEyLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAxLCBkYXRhTWFzazogMCB9IH0sXG4gICAgeyBiaXRzOiAweDUxMjUsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDEsIGRhdGFNYXNrOiAxIH0gfSxcbiAgICB7IGJpdHM6IDB4NUU3QywgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMSwgZGF0YU1hc2s6IDIgfSB9LFxuICAgIHsgYml0czogMHg1QjRCLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAxLCBkYXRhTWFzazogMyB9IH0sXG4gICAgeyBiaXRzOiAweDQ1RjksIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDEsIGRhdGFNYXNrOiA0IH0gfSxcbiAgICB7IGJpdHM6IDB4NDBDRSwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMSwgZGF0YU1hc2s6IDUgfSB9LFxuICAgIHsgYml0czogMHg0Rjk3LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAxLCBkYXRhTWFzazogNiB9IH0sXG4gICAgeyBiaXRzOiAweDRBQTAsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDEsIGRhdGFNYXNrOiA3IH0gfSxcbiAgICB7IGJpdHM6IDB4NzdDNCwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMCwgZGF0YU1hc2s6IDAgfSB9LFxuICAgIHsgYml0czogMHg3MkYzLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAwLCBkYXRhTWFzazogMSB9IH0sXG4gICAgeyBiaXRzOiAweDdEQUEsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDAsIGRhdGFNYXNrOiAyIH0gfSxcbiAgICB7IGJpdHM6IDB4Nzg5RCwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMCwgZGF0YU1hc2s6IDMgfSB9LFxuICAgIHsgYml0czogMHg2NjJGLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAwLCBkYXRhTWFzazogNCB9IH0sXG4gICAgeyBiaXRzOiAweDYzMTgsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDAsIGRhdGFNYXNrOiA1IH0gfSxcbiAgICB7IGJpdHM6IDB4NkM0MSwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMCwgZGF0YU1hc2s6IDYgfSB9LFxuICAgIHsgYml0czogMHg2OTc2LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAwLCBkYXRhTWFzazogNyB9IH0sXG4gICAgeyBiaXRzOiAweDE2ODksIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDMsIGRhdGFNYXNrOiAwIH0gfSxcbiAgICB7IGJpdHM6IDB4MTNCRSwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMywgZGF0YU1hc2s6IDEgfSB9LFxuICAgIHsgYml0czogMHgxQ0U3LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAzLCBkYXRhTWFzazogMiB9IH0sXG4gICAgeyBiaXRzOiAweDE5RDAsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDMsIGRhdGFNYXNrOiAzIH0gfSxcbiAgICB7IGJpdHM6IDB4MDc2MiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMywgZGF0YU1hc2s6IDQgfSB9LFxuICAgIHsgYml0czogMHgwMjU1LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAzLCBkYXRhTWFzazogNSB9IH0sXG4gICAgeyBiaXRzOiAweDBEMEMsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDMsIGRhdGFNYXNrOiA2IH0gfSxcbiAgICB7IGJpdHM6IDB4MDgzQiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMywgZGF0YU1hc2s6IDcgfSB9LFxuICAgIHsgYml0czogMHgzNTVGLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAyLCBkYXRhTWFzazogMCB9IH0sXG4gICAgeyBiaXRzOiAweDMwNjgsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDIsIGRhdGFNYXNrOiAxIH0gfSxcbiAgICB7IGJpdHM6IDB4M0YzMSwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMiwgZGF0YU1hc2s6IDIgfSB9LFxuICAgIHsgYml0czogMHgzQTA2LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAyLCBkYXRhTWFzazogMyB9IH0sXG4gICAgeyBiaXRzOiAweDI0QjQsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDIsIGRhdGFNYXNrOiA0IH0gfSxcbiAgICB7IGJpdHM6IDB4MjE4MywgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMiwgZGF0YU1hc2s6IDUgfSB9LFxuICAgIHsgYml0czogMHgyRURBLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAyLCBkYXRhTWFzazogNiB9IH0sXG4gICAgeyBiaXRzOiAweDJCRUQsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDIsIGRhdGFNYXNrOiA3IH0gfSxcbl07XG5jb25zdCBEQVRBX01BU0tTID0gW1xuICAgIChwKSA9PiAoKHAueSArIHAueCkgJSAyKSA9PT0gMCxcbiAgICAocCkgPT4gKHAueSAlIDIpID09PSAwLFxuICAgIChwKSA9PiBwLnggJSAzID09PSAwLFxuICAgIChwKSA9PiAocC55ICsgcC54KSAlIDMgPT09IDAsXG4gICAgKHApID0+IChNYXRoLmZsb29yKHAueSAvIDIpICsgTWF0aC5mbG9vcihwLnggLyAzKSkgJSAyID09PSAwLFxuICAgIChwKSA9PiAoKHAueCAqIHAueSkgJSAyKSArICgocC54ICogcC55KSAlIDMpID09PSAwLFxuICAgIChwKSA9PiAoKCgocC55ICogcC54KSAlIDIpICsgKHAueSAqIHAueCkgJSAzKSAlIDIpID09PSAwLFxuICAgIChwKSA9PiAoKCgocC55ICsgcC54KSAlIDIpICsgKHAueSAqIHAueCkgJSAzKSAlIDIpID09PSAwLFxuXTtcbmZ1bmN0aW9uIGJ1aWxkRnVuY3Rpb25QYXR0ZXJuTWFzayh2ZXJzaW9uKSB7XG4gICAgY29uc3QgZGltZW5zaW9uID0gMTcgKyA0ICogdmVyc2lvbi52ZXJzaW9uTnVtYmVyO1xuICAgIGNvbnN0IG1hdHJpeCA9IEJpdE1hdHJpeC5jcmVhdGVFbXB0eShkaW1lbnNpb24sIGRpbWVuc2lvbik7XG4gICAgbWF0cml4LnNldFJlZ2lvbigwLCAwLCA5LCA5LCB0cnVlKTsgLy8gVG9wIGxlZnQgZmluZGVyIHBhdHRlcm4gKyBzZXBhcmF0b3IgKyBmb3JtYXRcbiAgICBtYXRyaXguc2V0UmVnaW9uKGRpbWVuc2lvbiAtIDgsIDAsIDgsIDksIHRydWUpOyAvLyBUb3AgcmlnaHQgZmluZGVyIHBhdHRlcm4gKyBzZXBhcmF0b3IgKyBmb3JtYXRcbiAgICBtYXRyaXguc2V0UmVnaW9uKDAsIGRpbWVuc2lvbiAtIDgsIDksIDgsIHRydWUpOyAvLyBCb3R0b20gbGVmdCBmaW5kZXIgcGF0dGVybiArIHNlcGFyYXRvciArIGZvcm1hdFxuICAgIC8vIEFsaWdubWVudCBwYXR0ZXJuc1xuICAgIGZvciAoY29uc3QgeCBvZiB2ZXJzaW9uLmFsaWdubWVudFBhdHRlcm5DZW50ZXJzKSB7XG4gICAgICAgIGZvciAoY29uc3QgeSBvZiB2ZXJzaW9uLmFsaWdubWVudFBhdHRlcm5DZW50ZXJzKSB7XG4gICAgICAgICAgICBpZiAoISh4ID09PSA2ICYmIHkgPT09IDYgfHwgeCA9PT0gNiAmJiB5ID09PSBkaW1lbnNpb24gLSA3IHx8IHggPT09IGRpbWVuc2lvbiAtIDcgJiYgeSA9PT0gNikpIHtcbiAgICAgICAgICAgICAgICBtYXRyaXguc2V0UmVnaW9uKHggLSAyLCB5IC0gMiwgNSwgNSwgdHJ1ZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgbWF0cml4LnNldFJlZ2lvbig2LCA5LCAxLCBkaW1lbnNpb24gLSAxNywgdHJ1ZSk7IC8vIFZlcnRpY2FsIHRpbWluZyBwYXR0ZXJuXG4gICAgbWF0cml4LnNldFJlZ2lvbig5LCA2LCBkaW1lbnNpb24gLSAxNywgMSwgdHJ1ZSk7IC8vIEhvcml6b250YWwgdGltaW5nIHBhdHRlcm5cbiAgICBpZiAodmVyc2lvbi52ZXJzaW9uTnVtYmVyID4gNikge1xuICAgICAgICBtYXRyaXguc2V0UmVnaW9uKGRpbWVuc2lvbiAtIDExLCAwLCAzLCA2LCB0cnVlKTsgLy8gVmVyc2lvbiBpbmZvLCB0b3AgcmlnaHRcbiAgICAgICAgbWF0cml4LnNldFJlZ2lvbigwLCBkaW1lbnNpb24gLSAxMSwgNiwgMywgdHJ1ZSk7IC8vIFZlcnNpb24gaW5mbywgYm90dG9tIGxlZnRcbiAgICB9XG4gICAgcmV0dXJuIG1hdHJpeDtcbn1cbmZ1bmN0aW9uIHJlYWRDb2Rld29yZHMobWF0cml4LCB2ZXJzaW9uLCBmb3JtYXRJbmZvKSB7XG4gICAgY29uc3QgZGF0YU1hc2sgPSBEQVRBX01BU0tTW2Zvcm1hdEluZm8uZGF0YU1hc2tdO1xuICAgIGNvbnN0IGRpbWVuc2lvbiA9IG1hdHJpeC5oZWlnaHQ7XG4gICAgY29uc3QgZnVuY3Rpb25QYXR0ZXJuTWFzayA9IGJ1aWxkRnVuY3Rpb25QYXR0ZXJuTWFzayh2ZXJzaW9uKTtcbiAgICBjb25zdCBjb2Rld29yZHMgPSBbXTtcbiAgICBsZXQgY3VycmVudEJ5dGUgPSAwO1xuICAgIGxldCBiaXRzUmVhZCA9IDA7XG4gICAgLy8gUmVhZCBjb2x1bW5zIGluIHBhaXJzLCBmcm9tIHJpZ2h0IHRvIGxlZnRcbiAgICBsZXQgcmVhZGluZ1VwID0gdHJ1ZTtcbiAgICBmb3IgKGxldCBjb2x1bW5JbmRleCA9IGRpbWVuc2lvbiAtIDE7IGNvbHVtbkluZGV4ID4gMDsgY29sdW1uSW5kZXggLT0gMikge1xuICAgICAgICBpZiAoY29sdW1uSW5kZXggPT09IDYpIHsgLy8gU2tpcCB3aG9sZSBjb2x1bW4gd2l0aCB2ZXJ0aWNhbCBhbGlnbm1lbnQgcGF0dGVybjtcbiAgICAgICAgICAgIGNvbHVtbkluZGV4LS07XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkaW1lbnNpb247IGkrKykge1xuICAgICAgICAgICAgY29uc3QgeSA9IHJlYWRpbmdVcCA/IGRpbWVuc2lvbiAtIDEgLSBpIDogaTtcbiAgICAgICAgICAgIGZvciAobGV0IGNvbHVtbk9mZnNldCA9IDA7IGNvbHVtbk9mZnNldCA8IDI7IGNvbHVtbk9mZnNldCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgeCA9IGNvbHVtbkluZGV4IC0gY29sdW1uT2Zmc2V0O1xuICAgICAgICAgICAgICAgIGlmICghZnVuY3Rpb25QYXR0ZXJuTWFzay5nZXQoeCwgeSkpIHtcbiAgICAgICAgICAgICAgICAgICAgYml0c1JlYWQrKztcbiAgICAgICAgICAgICAgICAgICAgbGV0IGJpdCA9IG1hdHJpeC5nZXQoeCwgeSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhTWFzayh7IHksIHggfSkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJpdCA9ICFiaXQ7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgY3VycmVudEJ5dGUgPSBwdXNoQml0KGJpdCwgY3VycmVudEJ5dGUpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoYml0c1JlYWQgPT09IDgpIHsgLy8gV2hvbGUgYnl0ZXNcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvZGV3b3Jkcy5wdXNoKGN1cnJlbnRCeXRlKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIGJpdHNSZWFkID0gMDtcbiAgICAgICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCeXRlID0gMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZWFkaW5nVXAgPSAhcmVhZGluZ1VwO1xuICAgIH1cbiAgICByZXR1cm4gY29kZXdvcmRzO1xufVxuZnVuY3Rpb24gcmVhZFZlcnNpb24obWF0cml4KSB7XG4gICAgY29uc3QgZGltZW5zaW9uID0gbWF0cml4LmhlaWdodDtcbiAgICBjb25zdCBwcm92aXNpb25hbFZlcnNpb24gPSBNYXRoLmZsb29yKChkaW1lbnNpb24gLSAxNykgLyA0KTtcbiAgICBpZiAocHJvdmlzaW9uYWxWZXJzaW9uIDw9IDYpIHsgLy8gNiBhbmQgdW5kZXIgZG9udCBoYXZlIHZlcnNpb24gaW5mbyBpbiB0aGUgUVIgY29kZVxuICAgICAgICByZXR1cm4gVkVSU0lPTlNbcHJvdmlzaW9uYWxWZXJzaW9uIC0gMV07XG4gICAgfVxuICAgIGxldCB0b3BSaWdodFZlcnNpb25CaXRzID0gMDtcbiAgICBmb3IgKGxldCB5ID0gNTsgeSA+PSAwOyB5LS0pIHtcbiAgICAgICAgZm9yIChsZXQgeCA9IGRpbWVuc2lvbiAtIDk7IHggPj0gZGltZW5zaW9uIC0gMTE7IHgtLSkge1xuICAgICAgICAgICAgdG9wUmlnaHRWZXJzaW9uQml0cyA9IHB1c2hCaXQobWF0cml4LmdldCh4LCB5KSwgdG9wUmlnaHRWZXJzaW9uQml0cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IGJvdHRvbUxlZnRWZXJzaW9uQml0cyA9IDA7XG4gICAgZm9yIChsZXQgeCA9IDU7IHggPj0gMDsgeC0tKSB7XG4gICAgICAgIGZvciAobGV0IHkgPSBkaW1lbnNpb24gLSA5OyB5ID49IGRpbWVuc2lvbiAtIDExOyB5LS0pIHtcbiAgICAgICAgICAgIGJvdHRvbUxlZnRWZXJzaW9uQml0cyA9IHB1c2hCaXQobWF0cml4LmdldCh4LCB5KSwgYm90dG9tTGVmdFZlcnNpb25CaXRzKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgYmVzdERpZmZlcmVuY2UgPSBJbmZpbml0eTtcbiAgICBsZXQgYmVzdFZlcnNpb247XG4gICAgZm9yIChjb25zdCB2ZXJzaW9uIG9mIFZFUlNJT05TKSB7XG4gICAgICAgIGlmICh2ZXJzaW9uLmluZm9CaXRzID09PSB0b3BSaWdodFZlcnNpb25CaXRzIHx8IHZlcnNpb24uaW5mb0JpdHMgPT09IGJvdHRvbUxlZnRWZXJzaW9uQml0cykge1xuICAgICAgICAgICAgcmV0dXJuIHZlcnNpb247XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpZmZlcmVuY2UgPSBudW1CaXRzRGlmZmVyaW5nKHRvcFJpZ2h0VmVyc2lvbkJpdHMsIHZlcnNpb24uaW5mb0JpdHMpO1xuICAgICAgICBpZiAoZGlmZmVyZW5jZSA8IGJlc3REaWZmZXJlbmNlKSB7XG4gICAgICAgICAgICBiZXN0VmVyc2lvbiA9IHZlcnNpb247XG4gICAgICAgICAgICBiZXN0RGlmZmVyZW5jZSA9IGRpZmZlcmVuY2U7XG4gICAgICAgIH1cbiAgICAgICAgZGlmZmVyZW5jZSA9IG51bUJpdHNEaWZmZXJpbmcoYm90dG9tTGVmdFZlcnNpb25CaXRzLCB2ZXJzaW9uLmluZm9CaXRzKTtcbiAgICAgICAgaWYgKGRpZmZlcmVuY2UgPCBiZXN0RGlmZmVyZW5jZSkge1xuICAgICAgICAgICAgYmVzdFZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgYmVzdERpZmZlcmVuY2UgPSBkaWZmZXJlbmNlO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIFdlIGNhbiB0b2xlcmF0ZSB1cCB0byAzIGJpdHMgb2YgZXJyb3Igc2luY2Ugbm8gdHdvIHZlcnNpb24gaW5mbyBjb2Rld29yZHMgd2lsbFxuICAgIC8vIGRpZmZlciBpbiBsZXNzIHRoYW4gOCBiaXRzLlxuICAgIGlmIChiZXN0RGlmZmVyZW5jZSA8PSAzKSB7XG4gICAgICAgIHJldHVybiBiZXN0VmVyc2lvbjtcbiAgICB9XG59XG5mdW5jdGlvbiByZWFkRm9ybWF0SW5mb3JtYXRpb24obWF0cml4KSB7XG4gICAgbGV0IHRvcExlZnRGb3JtYXRJbmZvQml0cyA9IDA7XG4gICAgZm9yIChsZXQgeCA9IDA7IHggPD0gODsgeCsrKSB7XG4gICAgICAgIGlmICh4ICE9PSA2KSB7IC8vIFNraXAgdGltaW5nIHBhdHRlcm4gYml0XG4gICAgICAgICAgICB0b3BMZWZ0Rm9ybWF0SW5mb0JpdHMgPSBwdXNoQml0KG1hdHJpeC5nZXQoeCwgOCksIHRvcExlZnRGb3JtYXRJbmZvQml0cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgZm9yIChsZXQgeSA9IDc7IHkgPj0gMDsgeS0tKSB7XG4gICAgICAgIGlmICh5ICE9PSA2KSB7IC8vIFNraXAgdGltaW5nIHBhdHRlcm4gYml0XG4gICAgICAgICAgICB0b3BMZWZ0Rm9ybWF0SW5mb0JpdHMgPSBwdXNoQml0KG1hdHJpeC5nZXQoOCwgeSksIHRvcExlZnRGb3JtYXRJbmZvQml0cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZGltZW5zaW9uID0gbWF0cml4LmhlaWdodDtcbiAgICBsZXQgdG9wUmlnaHRCb3R0b21SaWdodEZvcm1hdEluZm9CaXRzID0gMDtcbiAgICBmb3IgKGxldCB5ID0gZGltZW5zaW9uIC0gMTsgeSA+PSBkaW1lbnNpb24gLSA3OyB5LS0pIHsgLy8gYm90dG9tIGxlZnRcbiAgICAgICAgdG9wUmlnaHRCb3R0b21SaWdodEZvcm1hdEluZm9CaXRzID0gcHVzaEJpdChtYXRyaXguZ2V0KDgsIHkpLCB0b3BSaWdodEJvdHRvbVJpZ2h0Rm9ybWF0SW5mb0JpdHMpO1xuICAgIH1cbiAgICBmb3IgKGxldCB4ID0gZGltZW5zaW9uIC0gODsgeCA8IGRpbWVuc2lvbjsgeCsrKSB7IC8vIHRvcCByaWdodFxuICAgICAgICB0b3BSaWdodEJvdHRvbVJpZ2h0Rm9ybWF0SW5mb0JpdHMgPSBwdXNoQml0KG1hdHJpeC5nZXQoeCwgOCksIHRvcFJpZ2h0Qm90dG9tUmlnaHRGb3JtYXRJbmZvQml0cyk7XG4gICAgfVxuICAgIGxldCBiZXN0RGlmZmVyZW5jZSA9IEluZmluaXR5O1xuICAgIGxldCBiZXN0Rm9ybWF0SW5mbyA9IG51bGw7XG4gICAgZm9yIChjb25zdCB7IGJpdHMsIGZvcm1hdEluZm8gfSBvZiBGT1JNQVRfSU5GT19UQUJMRSkge1xuICAgICAgICBpZiAoYml0cyA9PT0gdG9wTGVmdEZvcm1hdEluZm9CaXRzIHx8IGJpdHMgPT09IHRvcFJpZ2h0Qm90dG9tUmlnaHRGb3JtYXRJbmZvQml0cykge1xuICAgICAgICAgICAgcmV0dXJuIGZvcm1hdEluZm87XG4gICAgICAgIH1cbiAgICAgICAgbGV0IGRpZmZlcmVuY2UgPSBudW1CaXRzRGlmZmVyaW5nKHRvcExlZnRGb3JtYXRJbmZvQml0cywgYml0cyk7XG4gICAgICAgIGlmIChkaWZmZXJlbmNlIDwgYmVzdERpZmZlcmVuY2UpIHtcbiAgICAgICAgICAgIGJlc3RGb3JtYXRJbmZvID0gZm9ybWF0SW5mbztcbiAgICAgICAgICAgIGJlc3REaWZmZXJlbmNlID0gZGlmZmVyZW5jZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAodG9wTGVmdEZvcm1hdEluZm9CaXRzICE9PSB0b3BSaWdodEJvdHRvbVJpZ2h0Rm9ybWF0SW5mb0JpdHMpIHsgLy8gYWxzbyB0cnkgdGhlIG90aGVyIG9wdGlvblxuICAgICAgICAgICAgZGlmZmVyZW5jZSA9IG51bUJpdHNEaWZmZXJpbmcodG9wUmlnaHRCb3R0b21SaWdodEZvcm1hdEluZm9CaXRzLCBiaXRzKTtcbiAgICAgICAgICAgIGlmIChkaWZmZXJlbmNlIDwgYmVzdERpZmZlcmVuY2UpIHtcbiAgICAgICAgICAgICAgICBiZXN0Rm9ybWF0SW5mbyA9IGZvcm1hdEluZm87XG4gICAgICAgICAgICAgICAgYmVzdERpZmZlcmVuY2UgPSBkaWZmZXJlbmNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIC8vIEhhbW1pbmcgZGlzdGFuY2Ugb2YgdGhlIDMyIG1hc2tlZCBjb2RlcyBpcyA3LCBieSBjb25zdHJ1Y3Rpb24sIHNvIDw9IDMgYml0cyBkaWZmZXJpbmcgbWVhbnMgd2UgZm91bmQgYSBtYXRjaFxuICAgIGlmIChiZXN0RGlmZmVyZW5jZSA8PSAzKSB7XG4gICAgICAgIHJldHVybiBiZXN0Rm9ybWF0SW5mbztcbiAgICB9XG4gICAgcmV0dXJuIG51bGw7XG59XG5mdW5jdGlvbiBnZXREYXRhQmxvY2tzKGNvZGV3b3JkcywgdmVyc2lvbiwgZWNMZXZlbCkge1xuICAgIGNvbnN0IGVjSW5mbyA9IHZlcnNpb24uZXJyb3JDb3JyZWN0aW9uTGV2ZWxzW2VjTGV2ZWxdO1xuICAgIGNvbnN0IGRhdGFCbG9ja3MgPSBbXTtcbiAgICBsZXQgdG90YWxDb2Rld29yZHMgPSAwO1xuICAgIGVjSW5mby5lY0Jsb2Nrcy5mb3JFYWNoKGJsb2NrID0+IHtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBibG9jay5udW1CbG9ja3M7IGkrKykge1xuICAgICAgICAgICAgZGF0YUJsb2Nrcy5wdXNoKHsgbnVtRGF0YUNvZGV3b3JkczogYmxvY2suZGF0YUNvZGV3b3Jkc1BlckJsb2NrLCBjb2Rld29yZHM6IFtdIH0pO1xuICAgICAgICAgICAgdG90YWxDb2Rld29yZHMgKz0gYmxvY2suZGF0YUNvZGV3b3Jkc1BlckJsb2NrICsgZWNJbmZvLmVjQ29kZXdvcmRzUGVyQmxvY2s7XG4gICAgICAgIH1cbiAgICB9KTtcbiAgICAvLyBJbiBzb21lIGNhc2VzIHRoZSBRUiBjb2RlIHdpbGwgYmUgbWFsZm9ybWVkIGVub3VnaCB0aGF0IHdlIHB1bGwgb2ZmIG1vcmUgb3IgbGVzcyB0aGFuIHdlIHNob3VsZC5cbiAgICAvLyBJZiB3ZSBwdWxsIG9mZiBsZXNzIHRoZXJlJ3Mgbm90aGluZyB3ZSBjYW4gZG8uXG4gICAgLy8gSWYgd2UgcHVsbCBvZmYgbW9yZSB3ZSBjYW4gc2FmZWx5IHRydW5jYXRlXG4gICAgaWYgKGNvZGV3b3Jkcy5sZW5ndGggPCB0b3RhbENvZGV3b3Jkcykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29kZXdvcmRzID0gY29kZXdvcmRzLnNsaWNlKDAsIHRvdGFsQ29kZXdvcmRzKTtcbiAgICBjb25zdCBzaG9ydEJsb2NrU2l6ZSA9IGVjSW5mby5lY0Jsb2Nrc1swXS5kYXRhQ29kZXdvcmRzUGVyQmxvY2s7XG4gICAgLy8gUHVsbCBjb2Rld29yZHMgdG8gZmlsbCB0aGUgYmxvY2tzIHVwIHRvIHRoZSBtaW5pbXVtIHNpemVcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHNob3J0QmxvY2tTaXplOyBpKyspIHtcbiAgICAgICAgZm9yIChjb25zdCBkYXRhQmxvY2sgb2YgZGF0YUJsb2Nrcykge1xuICAgICAgICAgICAgZGF0YUJsb2NrLmNvZGV3b3Jkcy5wdXNoKGNvZGV3b3Jkcy5zaGlmdCgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBJZiB0aGVyZSBhcmUgYW55IGxhcmdlIGJsb2NrcywgcHVsbCBjb2Rld29yZHMgdG8gZmlsbCB0aGUgbGFzdCBlbGVtZW50IG9mIHRob3NlXG4gICAgaWYgKGVjSW5mby5lY0Jsb2Nrcy5sZW5ndGggPiAxKSB7XG4gICAgICAgIGNvbnN0IHNtYWxsQmxvY2tDb3VudCA9IGVjSW5mby5lY0Jsb2Nrc1swXS5udW1CbG9ja3M7XG4gICAgICAgIGNvbnN0IGxhcmdlQmxvY2tDb3VudCA9IGVjSW5mby5lY0Jsb2Nrc1sxXS5udW1CbG9ja3M7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGFyZ2VCbG9ja0NvdW50OyBpKyspIHtcbiAgICAgICAgICAgIGRhdGFCbG9ja3Nbc21hbGxCbG9ja0NvdW50ICsgaV0uY29kZXdvcmRzLnB1c2goY29kZXdvcmRzLnNoaWZ0KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIEFkZCB0aGUgcmVzdCBvZiB0aGUgY29kZXdvcmRzIHRvIHRoZSBibG9ja3MuIFRoZXNlIGFyZSB0aGUgZXJyb3IgY29ycmVjdGlvbiBjb2Rld29yZHMuXG4gICAgd2hpbGUgKGNvZGV3b3Jkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGF0YUJsb2NrIG9mIGRhdGFCbG9ja3MpIHtcbiAgICAgICAgICAgIGRhdGFCbG9jay5jb2Rld29yZHMucHVzaChjb2Rld29yZHMuc2hpZnQoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRhdGFCbG9ja3M7XG59XG5mdW5jdGlvbiBkZWNvZGVNYXRyaXgobWF0cml4KSB7XG4gICAgY29uc3QgdmVyc2lvbiA9IHJlYWRWZXJzaW9uKG1hdHJpeCk7XG4gICAgaWYgKCF2ZXJzaW9uKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBmb3JtYXRJbmZvID0gcmVhZEZvcm1hdEluZm9ybWF0aW9uKG1hdHJpeCk7XG4gICAgaWYgKCFmb3JtYXRJbmZvKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBjb2Rld29yZHMgPSByZWFkQ29kZXdvcmRzKG1hdHJpeCwgdmVyc2lvbiwgZm9ybWF0SW5mbyk7XG4gICAgY29uc3QgZGF0YUJsb2NrcyA9IGdldERhdGFCbG9ja3MoY29kZXdvcmRzLCB2ZXJzaW9uLCBmb3JtYXRJbmZvLmVycm9yQ29ycmVjdGlvbkxldmVsKTtcbiAgICBpZiAoIWRhdGFCbG9ja3MpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIENvdW50IHRvdGFsIG51bWJlciBvZiBkYXRhIGJ5dGVzXG4gICAgY29uc3QgdG90YWxCeXRlcyA9IGRhdGFCbG9ja3MucmVkdWNlKChhLCBiKSA9PiBhICsgYi5udW1EYXRhQ29kZXdvcmRzLCAwKTtcbiAgICBjb25zdCByZXN1bHRCeXRlcyA9IG5ldyBVaW50OENsYW1wZWRBcnJheSh0b3RhbEJ5dGVzKTtcbiAgICBsZXQgcmVzdWx0SW5kZXggPSAwO1xuICAgIGZvciAoY29uc3QgZGF0YUJsb2NrIG9mIGRhdGFCbG9ja3MpIHtcbiAgICAgICAgY29uc3QgY29ycmVjdGVkQnl0ZXMgPSBkZWNvZGUkMShkYXRhQmxvY2suY29kZXdvcmRzLCBkYXRhQmxvY2suY29kZXdvcmRzLmxlbmd0aCAtIGRhdGFCbG9jay5udW1EYXRhQ29kZXdvcmRzKTtcbiAgICAgICAgaWYgKCFjb3JyZWN0ZWRCeXRlcykge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBkYXRhQmxvY2subnVtRGF0YUNvZGV3b3JkczsgaSsrKSB7XG4gICAgICAgICAgICByZXN1bHRCeXRlc1tyZXN1bHRJbmRleCsrXSA9IGNvcnJlY3RlZEJ5dGVzW2ldO1xuICAgICAgICB9XG4gICAgfVxuICAgIHRyeSB7XG4gICAgICAgIHJldHVybiBkZWNvZGUocmVzdWx0Qnl0ZXMsIHZlcnNpb24udmVyc2lvbk51bWJlcik7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG59XG5mdW5jdGlvbiBkZWNvZGUkMihtYXRyaXgpIHtcbiAgICBpZiAobWF0cml4ID09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IGRlY29kZU1hdHJpeChtYXRyaXgpO1xuICAgIGlmIChyZXN1bHQpIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgLy8gRGVjb2RpbmcgZGlkbid0IHdvcmssIHRyeSBtaXJyb3JpbmcgdGhlIFFSIGFjcm9zcyB0aGUgdG9wTGVmdCAtPiBib3R0b21SaWdodCBsaW5lLlxuICAgIGZvciAobGV0IHggPSAwOyB4IDwgbWF0cml4LndpZHRoOyB4KyspIHtcbiAgICAgICAgZm9yIChsZXQgeSA9IHggKyAxOyB5IDwgbWF0cml4LmhlaWdodDsgeSsrKSB7XG4gICAgICAgICAgICBpZiAobWF0cml4LmdldCh4LCB5KSAhPT0gbWF0cml4LmdldCh5LCB4KSkge1xuICAgICAgICAgICAgICAgIG1hdHJpeC5zZXQoeCwgeSwgIW1hdHJpeC5nZXQoeCwgeSkpO1xuICAgICAgICAgICAgICAgIG1hdHJpeC5zZXQoeSwgeCwgIW1hdHJpeC5nZXQoeSwgeCkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkZWNvZGVNYXRyaXgobWF0cml4KTtcbn1cblxuZnVuY3Rpb24gc3F1YXJlVG9RdWFkcmlsYXRlcmFsKHAxLCBwMiwgcDMsIHA0KSB7XG4gICAgY29uc3QgZHgzID0gcDEueCAtIHAyLnggKyBwMy54IC0gcDQueDtcbiAgICBjb25zdCBkeTMgPSBwMS55IC0gcDIueSArIHAzLnkgLSBwNC55O1xuICAgIGlmIChkeDMgPT09IDAgJiYgZHkzID09PSAwKSB7IC8vIEFmZmluZVxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgYTExOiBwMi54IC0gcDEueCxcbiAgICAgICAgICAgIGExMjogcDIueSAtIHAxLnksXG4gICAgICAgICAgICBhMTM6IDAsXG4gICAgICAgICAgICBhMjE6IHAzLnggLSBwMi54LFxuICAgICAgICAgICAgYTIyOiBwMy55IC0gcDIueSxcbiAgICAgICAgICAgIGEyMzogMCxcbiAgICAgICAgICAgIGEzMTogcDEueCxcbiAgICAgICAgICAgIGEzMjogcDEueSxcbiAgICAgICAgICAgIGEzMzogMSxcbiAgICAgICAgfTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGNvbnN0IGR4MSA9IHAyLnggLSBwMy54O1xuICAgICAgICBjb25zdCBkeDIgPSBwNC54IC0gcDMueDtcbiAgICAgICAgY29uc3QgZHkxID0gcDIueSAtIHAzLnk7XG4gICAgICAgIGNvbnN0IGR5MiA9IHA0LnkgLSBwMy55O1xuICAgICAgICBjb25zdCBkZW5vbWluYXRvciA9IGR4MSAqIGR5MiAtIGR4MiAqIGR5MTtcbiAgICAgICAgY29uc3QgYTEzID0gKGR4MyAqIGR5MiAtIGR4MiAqIGR5MykgLyBkZW5vbWluYXRvcjtcbiAgICAgICAgY29uc3QgYTIzID0gKGR4MSAqIGR5MyAtIGR4MyAqIGR5MSkgLyBkZW5vbWluYXRvcjtcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGExMTogcDIueCAtIHAxLnggKyBhMTMgKiBwMi54LFxuICAgICAgICAgICAgYTEyOiBwMi55IC0gcDEueSArIGExMyAqIHAyLnksXG4gICAgICAgICAgICBhMTMsXG4gICAgICAgICAgICBhMjE6IHA0LnggLSBwMS54ICsgYTIzICogcDQueCxcbiAgICAgICAgICAgIGEyMjogcDQueSAtIHAxLnkgKyBhMjMgKiBwNC55LFxuICAgICAgICAgICAgYTIzLFxuICAgICAgICAgICAgYTMxOiBwMS54LFxuICAgICAgICAgICAgYTMyOiBwMS55LFxuICAgICAgICAgICAgYTMzOiAxLFxuICAgICAgICB9O1xuICAgIH1cbn1cbmZ1bmN0aW9uIHF1YWRyaWxhdGVyYWxUb1NxdWFyZShwMSwgcDIsIHAzLCBwNCkge1xuICAgIC8vIEhlcmUsIHRoZSBhZGpvaW50IHNlcnZlcyBhcyB0aGUgaW52ZXJzZTpcbiAgICBjb25zdCBzVG9RID0gc3F1YXJlVG9RdWFkcmlsYXRlcmFsKHAxLCBwMiwgcDMsIHA0KTtcbiAgICByZXR1cm4ge1xuICAgICAgICBhMTE6IHNUb1EuYTIyICogc1RvUS5hMzMgLSBzVG9RLmEyMyAqIHNUb1EuYTMyLFxuICAgICAgICBhMTI6IHNUb1EuYTEzICogc1RvUS5hMzIgLSBzVG9RLmExMiAqIHNUb1EuYTMzLFxuICAgICAgICBhMTM6IHNUb1EuYTEyICogc1RvUS5hMjMgLSBzVG9RLmExMyAqIHNUb1EuYTIyLFxuICAgICAgICBhMjE6IHNUb1EuYTIzICogc1RvUS5hMzEgLSBzVG9RLmEyMSAqIHNUb1EuYTMzLFxuICAgICAgICBhMjI6IHNUb1EuYTExICogc1RvUS5hMzMgLSBzVG9RLmExMyAqIHNUb1EuYTMxLFxuICAgICAgICBhMjM6IHNUb1EuYTEzICogc1RvUS5hMjEgLSBzVG9RLmExMSAqIHNUb1EuYTIzLFxuICAgICAgICBhMzE6IHNUb1EuYTIxICogc1RvUS5hMzIgLSBzVG9RLmEyMiAqIHNUb1EuYTMxLFxuICAgICAgICBhMzI6IHNUb1EuYTEyICogc1RvUS5hMzEgLSBzVG9RLmExMSAqIHNUb1EuYTMyLFxuICAgICAgICBhMzM6IHNUb1EuYTExICogc1RvUS5hMjIgLSBzVG9RLmExMiAqIHNUb1EuYTIxLFxuICAgIH07XG59XG5mdW5jdGlvbiB0aW1lcyhhLCBiKSB7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYTExOiBhLmExMSAqIGIuYTExICsgYS5hMjEgKiBiLmExMiArIGEuYTMxICogYi5hMTMsXG4gICAgICAgIGExMjogYS5hMTIgKiBiLmExMSArIGEuYTIyICogYi5hMTIgKyBhLmEzMiAqIGIuYTEzLFxuICAgICAgICBhMTM6IGEuYTEzICogYi5hMTEgKyBhLmEyMyAqIGIuYTEyICsgYS5hMzMgKiBiLmExMyxcbiAgICAgICAgYTIxOiBhLmExMSAqIGIuYTIxICsgYS5hMjEgKiBiLmEyMiArIGEuYTMxICogYi5hMjMsXG4gICAgICAgIGEyMjogYS5hMTIgKiBiLmEyMSArIGEuYTIyICogYi5hMjIgKyBhLmEzMiAqIGIuYTIzLFxuICAgICAgICBhMjM6IGEuYTEzICogYi5hMjEgKyBhLmEyMyAqIGIuYTIyICsgYS5hMzMgKiBiLmEyMyxcbiAgICAgICAgYTMxOiBhLmExMSAqIGIuYTMxICsgYS5hMjEgKiBiLmEzMiArIGEuYTMxICogYi5hMzMsXG4gICAgICAgIGEzMjogYS5hMTIgKiBiLmEzMSArIGEuYTIyICogYi5hMzIgKyBhLmEzMiAqIGIuYTMzLFxuICAgICAgICBhMzM6IGEuYTEzICogYi5hMzEgKyBhLmEyMyAqIGIuYTMyICsgYS5hMzMgKiBiLmEzMyxcbiAgICB9O1xufVxuZnVuY3Rpb24gZXh0cmFjdChpbWFnZSwgbG9jYXRpb24pIHtcbiAgICBjb25zdCBxVG9TID0gcXVhZHJpbGF0ZXJhbFRvU3F1YXJlKHsgeDogMy41LCB5OiAzLjUgfSwgeyB4OiBsb2NhdGlvbi5kaW1lbnNpb24gLSAzLjUsIHk6IDMuNSB9LCB7IHg6IGxvY2F0aW9uLmRpbWVuc2lvbiAtIDYuNSwgeTogbG9jYXRpb24uZGltZW5zaW9uIC0gNi41IH0sIHsgeDogMy41LCB5OiBsb2NhdGlvbi5kaW1lbnNpb24gLSAzLjUgfSk7XG4gICAgY29uc3Qgc1RvUSA9IHNxdWFyZVRvUXVhZHJpbGF0ZXJhbChsb2NhdGlvbi50b3BMZWZ0LCBsb2NhdGlvbi50b3BSaWdodCwgbG9jYXRpb24uYWxpZ25tZW50UGF0dGVybiwgbG9jYXRpb24uYm90dG9tTGVmdCk7XG4gICAgY29uc3QgdHJhbnNmb3JtID0gdGltZXMoc1RvUSwgcVRvUyk7XG4gICAgY29uc3QgbWF0cml4ID0gQml0TWF0cml4LmNyZWF0ZUVtcHR5KGxvY2F0aW9uLmRpbWVuc2lvbiwgbG9jYXRpb24uZGltZW5zaW9uKTtcbiAgICBjb25zdCBtYXBwaW5nRnVuY3Rpb24gPSAoeCwgeSkgPT4ge1xuICAgICAgICBjb25zdCBkZW5vbWluYXRvciA9IHRyYW5zZm9ybS5hMTMgKiB4ICsgdHJhbnNmb3JtLmEyMyAqIHkgKyB0cmFuc2Zvcm0uYTMzO1xuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgeDogKHRyYW5zZm9ybS5hMTEgKiB4ICsgdHJhbnNmb3JtLmEyMSAqIHkgKyB0cmFuc2Zvcm0uYTMxKSAvIGRlbm9taW5hdG9yLFxuICAgICAgICAgICAgeTogKHRyYW5zZm9ybS5hMTIgKiB4ICsgdHJhbnNmb3JtLmEyMiAqIHkgKyB0cmFuc2Zvcm0uYTMyKSAvIGRlbm9taW5hdG9yLFxuICAgICAgICB9O1xuICAgIH07XG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPCBsb2NhdGlvbi5kaW1lbnNpb247IHkrKykge1xuICAgICAgICBmb3IgKGxldCB4ID0gMDsgeCA8IGxvY2F0aW9uLmRpbWVuc2lvbjsgeCsrKSB7XG4gICAgICAgICAgICBjb25zdCB4VmFsdWUgPSB4ICsgMC41O1xuICAgICAgICAgICAgY29uc3QgeVZhbHVlID0geSArIDAuNTtcbiAgICAgICAgICAgIGNvbnN0IHNvdXJjZVBpeGVsID0gbWFwcGluZ0Z1bmN0aW9uKHhWYWx1ZSwgeVZhbHVlKTtcbiAgICAgICAgICAgIG1hdHJpeC5zZXQoeCwgeSwgaW1hZ2UuZ2V0KE1hdGguZmxvb3Ioc291cmNlUGl4ZWwueCksIE1hdGguZmxvb3Ioc291cmNlUGl4ZWwueSkpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBtYXRyaXgsXG4gICAgICAgIG1hcHBpbmdGdW5jdGlvbixcbiAgICB9O1xufVxuXG5jb25zdCBNQVhfRklOREVSUEFUVEVSTlNfVE9fU0VBUkNIID0gNDtcbmNvbnN0IE1JTl9RVUFEX1JBVElPID0gMC41O1xuY29uc3QgTUFYX1FVQURfUkFUSU8gPSAxLjU7XG5jb25zdCBkaXN0YW5jZSA9IChhLCBiKSA9PiBNYXRoLnNxcnQoTWF0aC5wb3coKGIueCAtIGEueCksIDIpICsgTWF0aC5wb3coKGIueSAtIGEueSksIDIpKTtcbmZ1bmN0aW9uIHN1bSh2YWx1ZXMpIHtcbiAgICByZXR1cm4gdmFsdWVzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIpO1xufVxuLy8gVGFrZXMgdGhyZWUgZmluZGVyIHBhdHRlcm5zIGFuZCBvcmdhbml6ZXMgdGhlbSBpbnRvIHRvcExlZnQsIHRvcFJpZ2h0LCBldGNcbmZ1bmN0aW9uIHJlb3JkZXJGaW5kZXJQYXR0ZXJucyhwYXR0ZXJuMSwgcGF0dGVybjIsIHBhdHRlcm4zKSB7XG4gICAgLy8gRmluZCBkaXN0YW5jZXMgYmV0d2VlbiBwYXR0ZXJuIGNlbnRlcnNcbiAgICBjb25zdCBvbmVUd29EaXN0YW5jZSA9IGRpc3RhbmNlKHBhdHRlcm4xLCBwYXR0ZXJuMik7XG4gICAgY29uc3QgdHdvVGhyZWVEaXN0YW5jZSA9IGRpc3RhbmNlKHBhdHRlcm4yLCBwYXR0ZXJuMyk7XG4gICAgY29uc3Qgb25lVGhyZWVEaXN0YW5jZSA9IGRpc3RhbmNlKHBhdHRlcm4xLCBwYXR0ZXJuMyk7XG4gICAgbGV0IGJvdHRvbUxlZnQ7XG4gICAgbGV0IHRvcExlZnQ7XG4gICAgbGV0IHRvcFJpZ2h0O1xuICAgIC8vIEFzc3VtZSBvbmUgY2xvc2VzdCB0byBvdGhlciB0d28gaXMgQjsgQSBhbmQgQyB3aWxsIGp1c3QgYmUgZ3Vlc3NlcyBhdCBmaXJzdFxuICAgIGlmICh0d29UaHJlZURpc3RhbmNlID49IG9uZVR3b0Rpc3RhbmNlICYmIHR3b1RocmVlRGlzdGFuY2UgPj0gb25lVGhyZWVEaXN0YW5jZSkge1xuICAgICAgICBbYm90dG9tTGVmdCwgdG9wTGVmdCwgdG9wUmlnaHRdID0gW3BhdHRlcm4yLCBwYXR0ZXJuMSwgcGF0dGVybjNdO1xuICAgIH1cbiAgICBlbHNlIGlmIChvbmVUaHJlZURpc3RhbmNlID49IHR3b1RocmVlRGlzdGFuY2UgJiYgb25lVGhyZWVEaXN0YW5jZSA+PSBvbmVUd29EaXN0YW5jZSkge1xuICAgICAgICBbYm90dG9tTGVmdCwgdG9wTGVmdCwgdG9wUmlnaHRdID0gW3BhdHRlcm4xLCBwYXR0ZXJuMiwgcGF0dGVybjNdO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgW2JvdHRvbUxlZnQsIHRvcExlZnQsIHRvcFJpZ2h0XSA9IFtwYXR0ZXJuMSwgcGF0dGVybjMsIHBhdHRlcm4yXTtcbiAgICB9XG4gICAgLy8gVXNlIGNyb3NzIHByb2R1Y3QgdG8gZmlndXJlIG91dCB3aGV0aGVyIGJvdHRvbUxlZnQgKEEpIGFuZCB0b3BSaWdodCAoQykgYXJlIGNvcnJlY3Qgb3IgZmxpcHBlZCBpbiByZWxhdGlvbiB0byB0b3BMZWZ0IChCKVxuICAgIC8vIFRoaXMgYXNrcyB3aGV0aGVyIEJDIHggQkEgaGFzIGEgcG9zaXRpdmUgeiBjb21wb25lbnQsIHdoaWNoIGlzIHRoZSBhcnJhbmdlbWVudCB3ZSB3YW50LiBJZiBpdCdzIG5lZ2F0aXZlLCB0aGVuXG4gICAgLy8gd2UndmUgZ290IGl0IGZsaXBwZWQgYXJvdW5kIGFuZCBzaG91bGQgc3dhcCB0b3BSaWdodCBhbmQgYm90dG9tTGVmdC5cbiAgICBpZiAoKCh0b3BSaWdodC54IC0gdG9wTGVmdC54KSAqIChib3R0b21MZWZ0LnkgLSB0b3BMZWZ0LnkpKSAtICgodG9wUmlnaHQueSAtIHRvcExlZnQueSkgKiAoYm90dG9tTGVmdC54IC0gdG9wTGVmdC54KSkgPCAwKSB7XG4gICAgICAgIFtib3R0b21MZWZ0LCB0b3BSaWdodF0gPSBbdG9wUmlnaHQsIGJvdHRvbUxlZnRdO1xuICAgIH1cbiAgICByZXR1cm4geyBib3R0b21MZWZ0LCB0b3BMZWZ0LCB0b3BSaWdodCB9O1xufVxuLy8gQ29tcHV0ZXMgdGhlIGRpbWVuc2lvbiAobnVtYmVyIG9mIG1vZHVsZXMgb24gYSBzaWRlKSBvZiB0aGUgUVIgQ29kZSBiYXNlZCBvbiB0aGUgcG9zaXRpb24gb2YgdGhlIGZpbmRlciBwYXR0ZXJuc1xuZnVuY3Rpb24gY29tcHV0ZURpbWVuc2lvbih0b3BMZWZ0LCB0b3BSaWdodCwgYm90dG9tTGVmdCwgbWF0cml4KSB7XG4gICAgY29uc3QgbW9kdWxlU2l6ZSA9IChzdW0oY291bnRCbGFja1doaXRlUnVuKHRvcExlZnQsIGJvdHRvbUxlZnQsIG1hdHJpeCwgNSkpIC8gNyArIC8vIERpdmlkZSBieSA3IHNpbmNlIHRoZSByYXRpbyBpcyAxOjE6MzoxOjFcbiAgICAgICAgc3VtKGNvdW50QmxhY2tXaGl0ZVJ1bih0b3BMZWZ0LCB0b3BSaWdodCwgbWF0cml4LCA1KSkgLyA3ICtcbiAgICAgICAgc3VtKGNvdW50QmxhY2tXaGl0ZVJ1bihib3R0b21MZWZ0LCB0b3BMZWZ0LCBtYXRyaXgsIDUpKSAvIDcgK1xuICAgICAgICBzdW0oY291bnRCbGFja1doaXRlUnVuKHRvcFJpZ2h0LCB0b3BMZWZ0LCBtYXRyaXgsIDUpKSAvIDcpIC8gNDtcbiAgICBpZiAobW9kdWxlU2l6ZSA8IDEpIHtcbiAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBtb2R1bGUgc2l6ZVwiKTtcbiAgICB9XG4gICAgY29uc3QgdG9wRGltZW5zaW9uID0gTWF0aC5yb3VuZChkaXN0YW5jZSh0b3BMZWZ0LCB0b3BSaWdodCkgLyBtb2R1bGVTaXplKTtcbiAgICBjb25zdCBzaWRlRGltZW5zaW9uID0gTWF0aC5yb3VuZChkaXN0YW5jZSh0b3BMZWZ0LCBib3R0b21MZWZ0KSAvIG1vZHVsZVNpemUpO1xuICAgIGxldCBkaW1lbnNpb24gPSBNYXRoLmZsb29yKCh0b3BEaW1lbnNpb24gKyBzaWRlRGltZW5zaW9uKSAvIDIpICsgNztcbiAgICBzd2l0Y2ggKGRpbWVuc2lvbiAlIDQpIHtcbiAgICAgICAgY2FzZSAwOlxuICAgICAgICAgICAgZGltZW5zaW9uKys7XG4gICAgICAgICAgICBicmVhaztcbiAgICAgICAgY2FzZSAyOlxuICAgICAgICAgICAgZGltZW5zaW9uLS07XG4gICAgICAgICAgICBicmVhaztcbiAgICB9XG4gICAgcmV0dXJuIHsgZGltZW5zaW9uLCBtb2R1bGVTaXplIH07XG59XG4vLyBUYWtlcyBhbiBvcmlnaW4gcG9pbnQgYW5kIGFuIGVuZCBwb2ludCBhbmQgY291bnRzIHRoZSBzaXplcyBvZiB0aGUgYmxhY2sgd2hpdGUgcnVuIGZyb20gdGhlIG9yaWdpbiB0b3dhcmRzIHRoZSBlbmQgcG9pbnQuXG4vLyBSZXR1cm5zIGFuIGFycmF5IG9mIGVsZW1lbnRzLCByZXByZXNlbnRpbmcgdGhlIHBpeGVsIHNpemUgb2YgdGhlIGJsYWNrIHdoaXRlIHJ1bi5cbi8vIFVzZXMgYSB2YXJpYW50IG9mIGh0dHA6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvQnJlc2VuaGFtJ3NfbGluZV9hbGdvcml0aG1cbmZ1bmN0aW9uIGNvdW50QmxhY2tXaGl0ZVJ1blRvd2FyZHNQb2ludChvcmlnaW4sIGVuZCwgbWF0cml4LCBsZW5ndGgpIHtcbiAgICBjb25zdCBzd2l0Y2hQb2ludHMgPSBbeyB4OiBNYXRoLmZsb29yKG9yaWdpbi54KSwgeTogTWF0aC5mbG9vcihvcmlnaW4ueSkgfV07XG4gICAgY29uc3Qgc3RlZXAgPSBNYXRoLmFicyhlbmQueSAtIG9yaWdpbi55KSA+IE1hdGguYWJzKGVuZC54IC0gb3JpZ2luLngpO1xuICAgIGxldCBmcm9tWDtcbiAgICBsZXQgZnJvbVk7XG4gICAgbGV0IHRvWDtcbiAgICBsZXQgdG9ZO1xuICAgIGlmIChzdGVlcCkge1xuICAgICAgICBmcm9tWCA9IE1hdGguZmxvb3Iob3JpZ2luLnkpO1xuICAgICAgICBmcm9tWSA9IE1hdGguZmxvb3Iob3JpZ2luLngpO1xuICAgICAgICB0b1ggPSBNYXRoLmZsb29yKGVuZC55KTtcbiAgICAgICAgdG9ZID0gTWF0aC5mbG9vcihlbmQueCk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmcm9tWCA9IE1hdGguZmxvb3Iob3JpZ2luLngpO1xuICAgICAgICBmcm9tWSA9IE1hdGguZmxvb3Iob3JpZ2luLnkpO1xuICAgICAgICB0b1ggPSBNYXRoLmZsb29yKGVuZC54KTtcbiAgICAgICAgdG9ZID0gTWF0aC5mbG9vcihlbmQueSk7XG4gICAgfVxuICAgIGNvbnN0IGR4ID0gTWF0aC5hYnModG9YIC0gZnJvbVgpO1xuICAgIGNvbnN0IGR5ID0gTWF0aC5hYnModG9ZIC0gZnJvbVkpO1xuICAgIGxldCBlcnJvciA9IE1hdGguZmxvb3IoLWR4IC8gMik7XG4gICAgY29uc3QgeFN0ZXAgPSBmcm9tWCA8IHRvWCA/IDEgOiAtMTtcbiAgICBjb25zdCB5U3RlcCA9IGZyb21ZIDwgdG9ZID8gMSA6IC0xO1xuICAgIGxldCBjdXJyZW50UGl4ZWwgPSB0cnVlO1xuICAgIC8vIExvb3AgdXAgdW50aWwgeCA9PSB0b1gsIGJ1dCBub3QgYmV5b25kXG4gICAgZm9yIChsZXQgeCA9IGZyb21YLCB5ID0gZnJvbVk7IHggIT09IHRvWCArIHhTdGVwOyB4ICs9IHhTdGVwKSB7XG4gICAgICAgIC8vIERvZXMgY3VycmVudCBwaXhlbCBtZWFuIHdlIGhhdmUgbW92ZWQgd2hpdGUgdG8gYmxhY2sgb3IgdmljZSB2ZXJzYT9cbiAgICAgICAgLy8gU2Nhbm5pbmcgYmxhY2sgaW4gc3RhdGUgMCwyIGFuZCB3aGl0ZSBpbiBzdGF0ZSAxLCBzbyBpZiB3ZSBmaW5kIHRoZSB3cm9uZ1xuICAgICAgICAvLyBjb2xvciwgYWR2YW5jZSB0byBuZXh0IHN0YXRlIG9yIGVuZCBpZiB3ZSBhcmUgaW4gc3RhdGUgMiBhbHJlYWR5XG4gICAgICAgIGNvbnN0IHJlYWxYID0gc3RlZXAgPyB5IDogeDtcbiAgICAgICAgY29uc3QgcmVhbFkgPSBzdGVlcCA/IHggOiB5O1xuICAgICAgICBpZiAobWF0cml4LmdldChyZWFsWCwgcmVhbFkpICE9PSBjdXJyZW50UGl4ZWwpIHtcbiAgICAgICAgICAgIGN1cnJlbnRQaXhlbCA9ICFjdXJyZW50UGl4ZWw7XG4gICAgICAgICAgICBzd2l0Y2hQb2ludHMucHVzaCh7IHg6IHJlYWxYLCB5OiByZWFsWSB9KTtcbiAgICAgICAgICAgIGlmIChzd2l0Y2hQb2ludHMubGVuZ3RoID09PSBsZW5ndGggKyAxKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZXJyb3IgKz0gZHk7XG4gICAgICAgIGlmIChlcnJvciA+IDApIHtcbiAgICAgICAgICAgIGlmICh5ID09PSB0b1kpIHtcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHkgKz0geVN0ZXA7XG4gICAgICAgICAgICBlcnJvciAtPSBkeDtcbiAgICAgICAgfVxuICAgIH1cbiAgICBjb25zdCBkaXN0YW5jZXMgPSBbXTtcbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGlmIChzd2l0Y2hQb2ludHNbaV0gJiYgc3dpdGNoUG9pbnRzW2kgKyAxXSkge1xuICAgICAgICAgICAgZGlzdGFuY2VzLnB1c2goZGlzdGFuY2Uoc3dpdGNoUG9pbnRzW2ldLCBzd2l0Y2hQb2ludHNbaSArIDFdKSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBkaXN0YW5jZXMucHVzaCgwKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGlzdGFuY2VzO1xufVxuLy8gVGFrZXMgYW4gb3JpZ2luIHBvaW50IGFuZCBhbiBlbmQgcG9pbnQgYW5kIGNvdW50cyB0aGUgc2l6ZXMgb2YgdGhlIGJsYWNrIHdoaXRlIHJ1biBpbiB0aGUgb3JpZ2luIHBvaW50XG4vLyBhbG9uZyB0aGUgbGluZSB0aGF0IGludGVyc2VjdHMgd2l0aCB0aGUgZW5kIHBvaW50LiBSZXR1cm5zIGFuIGFycmF5IG9mIGVsZW1lbnRzLCByZXByZXNlbnRpbmcgdGhlIHBpeGVsIHNpemVzXG4vLyBvZiB0aGUgYmxhY2sgd2hpdGUgcnVuLiBUYWtlcyBhIGxlbmd0aCB3aGljaCByZXByZXNlbnRzIHRoZSBudW1iZXIgb2Ygc3dpdGNoZXMgZnJvbSBibGFjayB0byB3aGl0ZSB0byBsb29rIGZvci5cbmZ1bmN0aW9uIGNvdW50QmxhY2tXaGl0ZVJ1bihvcmlnaW4sIGVuZCwgbWF0cml4LCBsZW5ndGgpIHtcbiAgICBjb25zdCByaXNlID0gZW5kLnkgLSBvcmlnaW4ueTtcbiAgICBjb25zdCBydW4gPSBlbmQueCAtIG9yaWdpbi54O1xuICAgIGNvbnN0IHRvd2FyZHNFbmQgPSBjb3VudEJsYWNrV2hpdGVSdW5Ub3dhcmRzUG9pbnQob3JpZ2luLCBlbmQsIG1hdHJpeCwgTWF0aC5jZWlsKGxlbmd0aCAvIDIpKTtcbiAgICBjb25zdCBhd2F5RnJvbUVuZCA9IGNvdW50QmxhY2tXaGl0ZVJ1blRvd2FyZHNQb2ludChvcmlnaW4sIHsgeDogb3JpZ2luLnggLSBydW4sIHk6IG9yaWdpbi55IC0gcmlzZSB9LCBtYXRyaXgsIE1hdGguY2VpbChsZW5ndGggLyAyKSk7XG4gICAgY29uc3QgbWlkZGxlVmFsdWUgPSB0b3dhcmRzRW5kLnNoaWZ0KCkgKyBhd2F5RnJvbUVuZC5zaGlmdCgpIC0gMTsgLy8gU3Vic3RyYWN0IG9uZSBzbyB3ZSBkb24ndCBkb3VibGUgY291bnQgYSBwaXhlbFxuICAgIHJldHVybiBhd2F5RnJvbUVuZC5jb25jYXQobWlkZGxlVmFsdWUpLmNvbmNhdCguLi50b3dhcmRzRW5kKTtcbn1cbi8vIFRha2VzIGluIGEgYmxhY2sgd2hpdGUgcnVuIGFuZCBhbiBhcnJheSBvZiBleHBlY3RlZCByYXRpb3MuIFJldHVybnMgdGhlIGF2ZXJhZ2Ugc2l6ZSBvZiB0aGUgcnVuIGFzIHdlbGwgYXMgdGhlIFwiZXJyb3JcIiAtXG4vLyB0aGF0IGlzIHRoZSBhbW91bnQgdGhlIHJ1biBkaXZlcmdlcyBmcm9tIHRoZSBleHBlY3RlZCByYXRpb1xuZnVuY3Rpb24gc2NvcmVCbGFja1doaXRlUnVuKHNlcXVlbmNlLCByYXRpb3MpIHtcbiAgICBjb25zdCBhdmVyYWdlU2l6ZSA9IHN1bShzZXF1ZW5jZSkgLyBzdW0ocmF0aW9zKTtcbiAgICBsZXQgZXJyb3IgPSAwO1xuICAgIHJhdGlvcy5mb3JFYWNoKChyYXRpbywgaSkgPT4ge1xuICAgICAgICBlcnJvciArPSBNYXRoLnBvdygoc2VxdWVuY2VbaV0gLSByYXRpbyAqIGF2ZXJhZ2VTaXplKSwgMik7XG4gICAgfSk7XG4gICAgcmV0dXJuIHsgYXZlcmFnZVNpemUsIGVycm9yIH07XG59XG4vLyBUYWtlcyBhbiBYLFkgcG9pbnQgYW5kIGFuIGFycmF5IG9mIHNpemVzIGFuZCBzY29yZXMgdGhlIHBvaW50IGFnYWluc3QgdGhvc2UgcmF0aW9zLlxuLy8gRm9yIGV4YW1wbGUgZm9yIGEgZmluZGVyIHBhdHRlcm4gdGFrZXMgdGhlIHJhdGlvIGxpc3Qgb2YgMToxOjM6MToxIGFuZCBjaGVja3MgaG9yaXpvbnRhbCwgdmVydGljYWwgYW5kIGRpYWdvbmFsIHJhdGlvc1xuLy8gYWdhaW5zdCB0aGF0LlxuZnVuY3Rpb24gc2NvcmVQYXR0ZXJuKHBvaW50LCByYXRpb3MsIG1hdHJpeCkge1xuICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGhvcml6b250YWxSdW4gPSBjb3VudEJsYWNrV2hpdGVSdW4ocG9pbnQsIHsgeDogLTEsIHk6IHBvaW50LnkgfSwgbWF0cml4LCByYXRpb3MubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgdmVydGljYWxSdW4gPSBjb3VudEJsYWNrV2hpdGVSdW4ocG9pbnQsIHsgeDogcG9pbnQueCwgeTogLTEgfSwgbWF0cml4LCByYXRpb3MubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgdG9wTGVmdFBvaW50ID0ge1xuICAgICAgICAgICAgeDogTWF0aC5tYXgoMCwgcG9pbnQueCAtIHBvaW50LnkpIC0gMSxcbiAgICAgICAgICAgIHk6IE1hdGgubWF4KDAsIHBvaW50LnkgLSBwb2ludC54KSAtIDEsXG4gICAgICAgIH07XG4gICAgICAgIGNvbnN0IHRvcExlZnRCb3R0b21SaWdodFJ1biA9IGNvdW50QmxhY2tXaGl0ZVJ1bihwb2ludCwgdG9wTGVmdFBvaW50LCBtYXRyaXgsIHJhdGlvcy5sZW5ndGgpO1xuICAgICAgICBjb25zdCBib3R0b21MZWZ0UG9pbnQgPSB7XG4gICAgICAgICAgICB4OiBNYXRoLm1pbihtYXRyaXgud2lkdGgsIHBvaW50LnggKyBwb2ludC55KSArIDEsXG4gICAgICAgICAgICB5OiBNYXRoLm1pbihtYXRyaXguaGVpZ2h0LCBwb2ludC55ICsgcG9pbnQueCkgKyAxLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCBib3R0b21MZWZ0VG9wUmlnaHRSdW4gPSBjb3VudEJsYWNrV2hpdGVSdW4ocG9pbnQsIGJvdHRvbUxlZnRQb2ludCwgbWF0cml4LCByYXRpb3MubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgaG9yekVycm9yID0gc2NvcmVCbGFja1doaXRlUnVuKGhvcml6b250YWxSdW4sIHJhdGlvcyk7XG4gICAgICAgIGNvbnN0IHZlcnRFcnJvciA9IHNjb3JlQmxhY2tXaGl0ZVJ1bih2ZXJ0aWNhbFJ1biwgcmF0aW9zKTtcbiAgICAgICAgY29uc3QgZGlhZ0Rvd25FcnJvciA9IHNjb3JlQmxhY2tXaGl0ZVJ1bih0b3BMZWZ0Qm90dG9tUmlnaHRSdW4sIHJhdGlvcyk7XG4gICAgICAgIGNvbnN0IGRpYWdVcEVycm9yID0gc2NvcmVCbGFja1doaXRlUnVuKGJvdHRvbUxlZnRUb3BSaWdodFJ1biwgcmF0aW9zKTtcbiAgICAgICAgY29uc3QgcmF0aW9FcnJvciA9IE1hdGguc3FydChob3J6RXJyb3IuZXJyb3IgKiBob3J6RXJyb3IuZXJyb3IgK1xuICAgICAgICAgICAgdmVydEVycm9yLmVycm9yICogdmVydEVycm9yLmVycm9yICtcbiAgICAgICAgICAgIGRpYWdEb3duRXJyb3IuZXJyb3IgKiBkaWFnRG93bkVycm9yLmVycm9yICtcbiAgICAgICAgICAgIGRpYWdVcEVycm9yLmVycm9yICogZGlhZ1VwRXJyb3IuZXJyb3IpO1xuICAgICAgICBjb25zdCBhdmdTaXplID0gKGhvcnpFcnJvci5hdmVyYWdlU2l6ZSArIHZlcnRFcnJvci5hdmVyYWdlU2l6ZSArIGRpYWdEb3duRXJyb3IuYXZlcmFnZVNpemUgKyBkaWFnVXBFcnJvci5hdmVyYWdlU2l6ZSkgLyA0O1xuICAgICAgICBjb25zdCBzaXplRXJyb3IgPSAoTWF0aC5wb3coKGhvcnpFcnJvci5hdmVyYWdlU2l6ZSAtIGF2Z1NpemUpLCAyKSArXG4gICAgICAgICAgICBNYXRoLnBvdygodmVydEVycm9yLmF2ZXJhZ2VTaXplIC0gYXZnU2l6ZSksIDIpICtcbiAgICAgICAgICAgIE1hdGgucG93KChkaWFnRG93bkVycm9yLmF2ZXJhZ2VTaXplIC0gYXZnU2l6ZSksIDIpICtcbiAgICAgICAgICAgIE1hdGgucG93KChkaWFnVXBFcnJvci5hdmVyYWdlU2l6ZSAtIGF2Z1NpemUpLCAyKSkgLyBhdmdTaXplO1xuICAgICAgICByZXR1cm4gcmF0aW9FcnJvciArIHNpemVFcnJvcjtcbiAgICB9XG4gICAgY2F0Y2ggKF9hKSB7XG4gICAgICAgIHJldHVybiBJbmZpbml0eTtcbiAgICB9XG59XG5mdW5jdGlvbiBsb2NhdGUobWF0cml4KSB7XG4gICAgY29uc3QgZmluZGVyUGF0dGVyblF1YWRzID0gW107XG4gICAgbGV0IGFjdGl2ZUZpbmRlclBhdHRlcm5RdWFkcyA9IFtdO1xuICAgIGNvbnN0IGFsaWdubWVudFBhdHRlcm5RdWFkcyA9IFtdO1xuICAgIGxldCBhY3RpdmVBbGlnbm1lbnRQYXR0ZXJuUXVhZHMgPSBbXTtcbiAgICBmb3IgKGxldCB5ID0gMDsgeSA8PSBtYXRyaXguaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgbGV0IGxlbmd0aCA9IDA7XG4gICAgICAgIGxldCBsYXN0Qml0ID0gZmFsc2U7XG4gICAgICAgIGxldCBzY2FucyA9IFswLCAwLCAwLCAwLCAwXTtcbiAgICAgICAgZm9yIChsZXQgeCA9IC0xOyB4IDw9IG1hdHJpeC53aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICBjb25zdCB2ID0gbWF0cml4LmdldCh4LCB5KTtcbiAgICAgICAgICAgIGlmICh2ID09PSBsYXN0Qml0KSB7XG4gICAgICAgICAgICAgICAgbGVuZ3RoKys7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBzY2FucyA9IFtzY2Fuc1sxXSwgc2NhbnNbMl0sIHNjYW5zWzNdLCBzY2Fuc1s0XSwgbGVuZ3RoXTtcbiAgICAgICAgICAgICAgICBsZW5ndGggPSAxO1xuICAgICAgICAgICAgICAgIGxhc3RCaXQgPSB2O1xuICAgICAgICAgICAgICAgIC8vIERvIHRoZSBsYXN0IDUgY29sb3IgY2hhbmdlcyB+IG1hdGNoIHRoZSBleHBlY3RlZCByYXRpbyBmb3IgYSBmaW5kZXIgcGF0dGVybj8gMToxOjM6MToxIG9mIGI6dzpiOnc6YlxuICAgICAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplID0gc3VtKHNjYW5zKSAvIDc7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRGaW5kZXJQYXR0ZXJuID0gTWF0aC5hYnMoc2NhbnNbMF0gLSBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSkgPCBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSAmJlxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhzY2Fuc1sxXSAtIGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplKSA8IGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplICYmXG4gICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHNjYW5zWzJdIC0gMyAqIGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplKSA8IDMgKiBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSAmJlxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhzY2Fuc1szXSAtIGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplKSA8IGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplICYmXG4gICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHNjYW5zWzRdIC0gYXZlcmFnZUZpbmRlclBhdHRlcm5CbG9ja3NpemUpIDwgYXZlcmFnZUZpbmRlclBhdHRlcm5CbG9ja3NpemUgJiZcbiAgICAgICAgICAgICAgICAgICAgIXY7IC8vIEFuZCBtYWtlIHN1cmUgdGhlIGN1cnJlbnQgcGl4ZWwgaXMgd2hpdGUgc2luY2UgZmluZGVyIHBhdHRlcm5zIGFyZSBib3JkZXJlZCBpbiB3aGl0ZVxuICAgICAgICAgICAgICAgIC8vIERvIHRoZSBsYXN0IDMgY29sb3IgY2hhbmdlcyB+IG1hdGNoIHRoZSBleHBlY3RlZCByYXRpbyBmb3IgYW4gYWxpZ25tZW50IHBhdHRlcm4/IDE6MToxIG9mIHc6Yjp3XG4gICAgICAgICAgICAgICAgY29uc3QgYXZlcmFnZUFsaWdubWVudFBhdHRlcm5CbG9ja3NpemUgPSBzdW0oc2NhbnMuc2xpY2UoLTMpKSAvIDM7XG4gICAgICAgICAgICAgICAgY29uc3QgdmFsaWRBbGlnbm1lbnRQYXR0ZXJuID0gTWF0aC5hYnMoc2NhbnNbMl0gLSBhdmVyYWdlQWxpZ25tZW50UGF0dGVybkJsb2Nrc2l6ZSkgPCBhdmVyYWdlQWxpZ25tZW50UGF0dGVybkJsb2Nrc2l6ZSAmJlxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhzY2Fuc1szXSAtIGF2ZXJhZ2VBbGlnbm1lbnRQYXR0ZXJuQmxvY2tzaXplKSA8IGF2ZXJhZ2VBbGlnbm1lbnRQYXR0ZXJuQmxvY2tzaXplICYmXG4gICAgICAgICAgICAgICAgICAgIE1hdGguYWJzKHNjYW5zWzRdIC0gYXZlcmFnZUFsaWdubWVudFBhdHRlcm5CbG9ja3NpemUpIDwgYXZlcmFnZUFsaWdubWVudFBhdHRlcm5CbG9ja3NpemUgJiZcbiAgICAgICAgICAgICAgICAgICAgdjsgLy8gSXMgdGhlIGN1cnJlbnQgcGl4ZWwgYmxhY2sgc2luY2UgYWxpZ25tZW50IHBhdHRlcm5zIGFyZSBib3JkZXJlZCBpbiBibGFja1xuICAgICAgICAgICAgICAgIGlmICh2YWxpZEZpbmRlclBhdHRlcm4pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgc3RhcnQgYW5kIGVuZCB4IHZhbHVlcyBvZiB0aGUgbGFyZ2UgY2VudGVyIGJsYWNrIHNxdWFyZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmRYID0geCAtIHNjYW5zWzNdIC0gc2NhbnNbNF07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHN0YXJ0WCA9IGVuZFggLSBzY2Fuc1syXTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbGluZSA9IHsgc3RhcnRYLCBlbmRYLCB5IH07XG4gICAgICAgICAgICAgICAgICAgIC8vIElzIHRoZXJlIGEgcXVhZCBkaXJlY3RseSBhYm92ZSB0aGUgY3VycmVudCBzcG90PyBJZiBzbywgZXh0ZW5kIGl0IHdpdGggdGhlIG5ldyBsaW5lLiBPdGhlcndpc2UsIGNyZWF0ZSBhIG5ldyBxdWFkIHdpdGhcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhhdCBsaW5lIGFzIHRoZSBzdGFydGluZyBwb2ludC5cbiAgICAgICAgICAgICAgICAgICAgY29uc3QgbWF0Y2hpbmdRdWFkcyA9IGFjdGl2ZUZpbmRlclBhdHRlcm5RdWFkcy5maWx0ZXIocSA9PiAoc3RhcnRYID49IHEuYm90dG9tLnN0YXJ0WCAmJiBzdGFydFggPD0gcS5ib3R0b20uZW5kWCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChlbmRYID49IHEuYm90dG9tLnN0YXJ0WCAmJiBzdGFydFggPD0gcS5ib3R0b20uZW5kWCkgfHxcbiAgICAgICAgICAgICAgICAgICAgICAgIChzdGFydFggPD0gcS5ib3R0b20uc3RhcnRYICYmIGVuZFggPj0gcS5ib3R0b20uZW5kWCAmJiAoKHNjYW5zWzJdIC8gKHEuYm90dG9tLmVuZFggLSBxLmJvdHRvbS5zdGFydFgpKSA8IE1BWF9RVUFEX1JBVElPICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgKHNjYW5zWzJdIC8gKHEuYm90dG9tLmVuZFggLSBxLmJvdHRvbS5zdGFydFgpKSA+IE1JTl9RVUFEX1JBVElPKSkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAobWF0Y2hpbmdRdWFkcy5sZW5ndGggPiAwKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtYXRjaGluZ1F1YWRzWzBdLmJvdHRvbSA9IGxpbmU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMucHVzaCh7IHRvcDogbGluZSwgYm90dG9tOiBsaW5lIH0pO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICh2YWxpZEFsaWdubWVudFBhdHRlcm4pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gQ29tcHV0ZSB0aGUgc3RhcnQgYW5kIGVuZCB4IHZhbHVlcyBvZiB0aGUgY2VudGVyIGJsYWNrIHNxdWFyZVxuICAgICAgICAgICAgICAgICAgICBjb25zdCBlbmRYID0geCAtIHNjYW5zWzRdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydFggPSBlbmRYIC0gc2NhbnNbM107XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpbmUgPSB7IHN0YXJ0WCwgeSwgZW5kWCB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBJcyB0aGVyZSBhIHF1YWQgZGlyZWN0bHkgYWJvdmUgdGhlIGN1cnJlbnQgc3BvdD8gSWYgc28sIGV4dGVuZCBpdCB3aXRoIHRoZSBuZXcgbGluZS4gT3RoZXJ3aXNlLCBjcmVhdGUgYSBuZXcgcXVhZCB3aXRoXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgbGluZSBhcyB0aGUgc3RhcnRpbmcgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nUXVhZHMgPSBhY3RpdmVBbGlnbm1lbnRQYXR0ZXJuUXVhZHMuZmlsdGVyKHEgPT4gKHN0YXJ0WCA+PSBxLmJvdHRvbS5zdGFydFggJiYgc3RhcnRYIDw9IHEuYm90dG9tLmVuZFgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoZW5kWCA+PSBxLmJvdHRvbS5zdGFydFggJiYgc3RhcnRYIDw9IHEuYm90dG9tLmVuZFgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RhcnRYIDw9IHEuYm90dG9tLnN0YXJ0WCAmJiBlbmRYID49IHEuYm90dG9tLmVuZFggJiYgKChzY2Fuc1syXSAvIChxLmJvdHRvbS5lbmRYIC0gcS5ib3R0b20uc3RhcnRYKSkgPCBNQVhfUVVBRF9SQVRJTyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChzY2Fuc1syXSAvIChxLmJvdHRvbS5lbmRYIC0gcS5ib3R0b20uc3RhcnRYKSkgPiBNSU5fUVVBRF9SQVRJTykpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nUXVhZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdRdWFkc1swXS5ib3R0b20gPSBsaW5lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlQWxpZ25tZW50UGF0dGVyblF1YWRzLnB1c2goeyB0b3A6IGxpbmUsIGJvdHRvbTogbGluZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmaW5kZXJQYXR0ZXJuUXVhZHMucHVzaCguLi5hY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMuZmlsdGVyKHEgPT4gcS5ib3R0b20ueSAhPT0geSAmJiBxLmJvdHRvbS55IC0gcS50b3AueSA+PSAyKSk7XG4gICAgICAgIGFjdGl2ZUZpbmRlclBhdHRlcm5RdWFkcyA9IGFjdGl2ZUZpbmRlclBhdHRlcm5RdWFkcy5maWx0ZXIocSA9PiBxLmJvdHRvbS55ID09PSB5KTtcbiAgICAgICAgYWxpZ25tZW50UGF0dGVyblF1YWRzLnB1c2goLi4uYWN0aXZlQWxpZ25tZW50UGF0dGVyblF1YWRzLmZpbHRlcihxID0+IHEuYm90dG9tLnkgIT09IHkpKTtcbiAgICAgICAgYWN0aXZlQWxpZ25tZW50UGF0dGVyblF1YWRzID0gYWN0aXZlQWxpZ25tZW50UGF0dGVyblF1YWRzLmZpbHRlcihxID0+IHEuYm90dG9tLnkgPT09IHkpO1xuICAgIH1cbiAgICBmaW5kZXJQYXR0ZXJuUXVhZHMucHVzaCguLi5hY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMuZmlsdGVyKHEgPT4gcS5ib3R0b20ueSAtIHEudG9wLnkgPj0gMikpO1xuICAgIGFsaWdubWVudFBhdHRlcm5RdWFkcy5wdXNoKC4uLmFjdGl2ZUFsaWdubWVudFBhdHRlcm5RdWFkcyk7XG4gICAgY29uc3QgZmluZGVyUGF0dGVybkdyb3VwcyA9IGZpbmRlclBhdHRlcm5RdWFkc1xuICAgICAgICAuZmlsdGVyKHEgPT4gcS5ib3R0b20ueSAtIHEudG9wLnkgPj0gMikgLy8gQWxsIHF1YWRzIG11c3QgYmUgYXQgbGVhc3QgMnB4IHRhbGwgc2luY2UgdGhlIGNlbnRlciBzcXVhcmUgaXMgbGFyZ2VyIHRoYW4gYSBibG9ja1xuICAgICAgICAubWFwKHEgPT4ge1xuICAgICAgICBjb25zdCB4ID0gKHEudG9wLnN0YXJ0WCArIHEudG9wLmVuZFggKyBxLmJvdHRvbS5zdGFydFggKyBxLmJvdHRvbS5lbmRYKSAvIDQ7XG4gICAgICAgIGNvbnN0IHkgPSAocS50b3AueSArIHEuYm90dG9tLnkgKyAxKSAvIDI7XG4gICAgICAgIGlmICghbWF0cml4LmdldChNYXRoLnJvdW5kKHgpLCBNYXRoLnJvdW5kKHkpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxlbmd0aHMgPSBbcS50b3AuZW5kWCAtIHEudG9wLnN0YXJ0WCwgcS5ib3R0b20uZW5kWCAtIHEuYm90dG9tLnN0YXJ0WCwgcS5ib3R0b20ueSAtIHEudG9wLnkgKyAxXTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHN1bShsZW5ndGhzKSAvIGxlbmd0aHMubGVuZ3RoO1xuICAgICAgICBjb25zdCBzY29yZSA9IHNjb3JlUGF0dGVybih7IHg6IE1hdGgucm91bmQoeCksIHk6IE1hdGgucm91bmQoeSkgfSwgWzEsIDEsIDMsIDEsIDFdLCBtYXRyaXgpO1xuICAgICAgICByZXR1cm4geyBzY29yZSwgeCwgeSwgc2l6ZSB9O1xuICAgIH0pXG4gICAgICAgIC5maWx0ZXIocSA9PiAhIXEpIC8vIEZpbHRlciBvdXQgYW55IHJlamVjdGVkIHF1YWRzIGZyb20gYWJvdmVcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuc2NvcmUgLSBiLnNjb3JlKVxuICAgICAgICAvLyBOb3cgdGFrZSB0aGUgdG9wIGZpbmRlciBwYXR0ZXJuIG9wdGlvbnMgYW5kIHRyeSB0byBmaW5kIDIgb3RoZXIgb3B0aW9ucyB3aXRoIGEgc2ltaWxhciBzaXplLlxuICAgICAgICAubWFwKChwb2ludCwgaSwgZmluZGVyUGF0dGVybnMpID0+IHtcbiAgICAgICAgaWYgKGkgPiBNQVhfRklOREVSUEFUVEVSTlNfVE9fU0VBUkNIKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBvdGhlclBvaW50cyA9IGZpbmRlclBhdHRlcm5zXG4gICAgICAgICAgICAuZmlsdGVyKChwLCBpaSkgPT4gaSAhPT0gaWkpXG4gICAgICAgICAgICAubWFwKHAgPT4gKHsgeDogcC54LCB5OiBwLnksIHNjb3JlOiBwLnNjb3JlICsgKE1hdGgucG93KChwLnNpemUgLSBwb2ludC5zaXplKSwgMikpIC8gcG9pbnQuc2l6ZSwgc2l6ZTogcC5zaXplIH0pKVxuICAgICAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuc2NvcmUgLSBiLnNjb3JlKTtcbiAgICAgICAgaWYgKG90aGVyUG9pbnRzLmxlbmd0aCA8IDIpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNjb3JlID0gcG9pbnQuc2NvcmUgKyBvdGhlclBvaW50c1swXS5zY29yZSArIG90aGVyUG9pbnRzWzFdLnNjb3JlO1xuICAgICAgICByZXR1cm4geyBwb2ludHM6IFtwb2ludF0uY29uY2F0KG90aGVyUG9pbnRzLnNsaWNlKDAsIDIpKSwgc2NvcmUgfTtcbiAgICB9KVxuICAgICAgICAuZmlsdGVyKHEgPT4gISFxKSAvLyBGaWx0ZXIgb3V0IGFueSByZWplY3RlZCBmaW5kZXIgcGF0dGVybnMgZnJvbSBhYm92ZVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5zY29yZSAtIGIuc2NvcmUpO1xuICAgIGlmIChmaW5kZXJQYXR0ZXJuR3JvdXBzLmxlbmd0aCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgeyB0b3BSaWdodCwgdG9wTGVmdCwgYm90dG9tTGVmdCB9ID0gcmVvcmRlckZpbmRlclBhdHRlcm5zKGZpbmRlclBhdHRlcm5Hcm91cHNbMF0ucG9pbnRzWzBdLCBmaW5kZXJQYXR0ZXJuR3JvdXBzWzBdLnBvaW50c1sxXSwgZmluZGVyUGF0dGVybkdyb3Vwc1swXS5wb2ludHNbMl0pO1xuICAgIC8vIE5vdyB0aGF0IHdlJ3ZlIGZvdW5kIHRoZSB0aHJlZSBmaW5kZXIgcGF0dGVybnMgd2UgY2FuIGRldGVybWluZSB0aGUgYmxvY2tTaXplIGFuZCB0aGUgc2l6ZSBvZiB0aGUgUVIgY29kZS5cbiAgICAvLyBXZSdsbCB1c2UgdGhlc2UgdG8gaGVscCBmaW5kIHRoZSBhbGlnbm1lbnQgcGF0dGVybiBidXQgYWxzbyBsYXRlciB3aGVuIHdlIGRvIHRoZSBleHRyYWN0aW9uLlxuICAgIGxldCBkaW1lbnNpb247XG4gICAgbGV0IG1vZHVsZVNpemU7XG4gICAgdHJ5IHtcbiAgICAgICAgKHsgZGltZW5zaW9uLCBtb2R1bGVTaXplIH0gPSBjb21wdXRlRGltZW5zaW9uKHRvcExlZnQsIHRvcFJpZ2h0LCBib3R0b21MZWZ0LCBtYXRyaXgpKTtcbiAgICB9XG4gICAgY2F0Y2ggKGUpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIC8vIE5vdyBmaW5kIHRoZSBhbGlnbm1lbnQgcGF0dGVyblxuICAgIGNvbnN0IGJvdHRvbVJpZ2h0RmluZGVyUGF0dGVybiA9IHtcbiAgICAgICAgeDogdG9wUmlnaHQueCAtIHRvcExlZnQueCArIGJvdHRvbUxlZnQueCxcbiAgICAgICAgeTogdG9wUmlnaHQueSAtIHRvcExlZnQueSArIGJvdHRvbUxlZnQueSxcbiAgICB9O1xuICAgIGNvbnN0IG1vZHVsZXNCZXR3ZWVuRmluZGVyUGF0dGVybnMgPSAoKGRpc3RhbmNlKHRvcExlZnQsIGJvdHRvbUxlZnQpICsgZGlzdGFuY2UodG9wTGVmdCwgdG9wUmlnaHQpKSAvIDIgLyBtb2R1bGVTaXplKTtcbiAgICBjb25zdCBjb3JyZWN0aW9uVG9Ub3BMZWZ0ID0gMSAtICgzIC8gbW9kdWxlc0JldHdlZW5GaW5kZXJQYXR0ZXJucyk7XG4gICAgY29uc3QgZXhwZWN0ZWRBbGlnbm1lbnRQYXR0ZXJuID0ge1xuICAgICAgICB4OiB0b3BMZWZ0LnggKyBjb3JyZWN0aW9uVG9Ub3BMZWZ0ICogKGJvdHRvbVJpZ2h0RmluZGVyUGF0dGVybi54IC0gdG9wTGVmdC54KSxcbiAgICAgICAgeTogdG9wTGVmdC55ICsgY29ycmVjdGlvblRvVG9wTGVmdCAqIChib3R0b21SaWdodEZpbmRlclBhdHRlcm4ueSAtIHRvcExlZnQueSksXG4gICAgfTtcbiAgICBjb25zdCBhbGlnbm1lbnRQYXR0ZXJucyA9IGFsaWdubWVudFBhdHRlcm5RdWFkc1xuICAgICAgICAubWFwKHEgPT4ge1xuICAgICAgICBjb25zdCB4ID0gKHEudG9wLnN0YXJ0WCArIHEudG9wLmVuZFggKyBxLmJvdHRvbS5zdGFydFggKyBxLmJvdHRvbS5lbmRYKSAvIDQ7XG4gICAgICAgIGNvbnN0IHkgPSAocS50b3AueSArIHEuYm90dG9tLnkgKyAxKSAvIDI7XG4gICAgICAgIGlmICghbWF0cml4LmdldChNYXRoLmZsb29yKHgpLCBNYXRoLmZsb29yKHkpKSkge1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGxlbmd0aHMgPSBbcS50b3AuZW5kWCAtIHEudG9wLnN0YXJ0WCwgcS5ib3R0b20uZW5kWCAtIHEuYm90dG9tLnN0YXJ0WCwgKHEuYm90dG9tLnkgLSBxLnRvcC55ICsgMSldO1xuICAgICAgICBjb25zdCBzaXplID0gc3VtKGxlbmd0aHMpIC8gbGVuZ3Rocy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHNpemVTY29yZSA9IHNjb3JlUGF0dGVybih7IHg6IE1hdGguZmxvb3IoeCksIHk6IE1hdGguZmxvb3IoeSkgfSwgWzEsIDEsIDFdLCBtYXRyaXgpO1xuICAgICAgICBjb25zdCBzY29yZSA9IHNpemVTY29yZSArIGRpc3RhbmNlKHsgeCwgeSB9LCBleHBlY3RlZEFsaWdubWVudFBhdHRlcm4pO1xuICAgICAgICByZXR1cm4geyB4LCB5LCBzY29yZSB9O1xuICAgIH0pXG4gICAgICAgIC5maWx0ZXIodiA9PiAhIXYpXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnNjb3JlIC0gYi5zY29yZSk7XG4gICAgLy8gSWYgdGhlcmUgYXJlIGxlc3MgdGhhbiAxNSBtb2R1bGVzIGJldHdlZW4gZmluZGVyIHBhdHRlcm5zIGl0J3MgYSB2ZXJzaW9uIDEgUVIgY29kZSBhbmQgYXMgc3VjaCBoYXMgbm8gYWxpZ25tZW1udCBwYXR0ZXJuXG4gICAgLy8gc28gd2UgY2FuIG9ubHkgdXNlIG91ciBiZXN0IGd1ZXNzLlxuICAgIGNvbnN0IGFsaWdubWVudFBhdHRlcm4gPSBtb2R1bGVzQmV0d2VlbkZpbmRlclBhdHRlcm5zID49IDE1ICYmIGFsaWdubWVudFBhdHRlcm5zLmxlbmd0aCA/IGFsaWdubWVudFBhdHRlcm5zWzBdIDogZXhwZWN0ZWRBbGlnbm1lbnRQYXR0ZXJuO1xuICAgIHJldHVybiB7XG4gICAgICAgIGFsaWdubWVudFBhdHRlcm46IHsgeDogYWxpZ25tZW50UGF0dGVybi54LCB5OiBhbGlnbm1lbnRQYXR0ZXJuLnkgfSxcbiAgICAgICAgYm90dG9tTGVmdDogeyB4OiBib3R0b21MZWZ0LngsIHk6IGJvdHRvbUxlZnQueSB9LFxuICAgICAgICBkaW1lbnNpb24sXG4gICAgICAgIHRvcExlZnQ6IHsgeDogdG9wTGVmdC54LCB5OiB0b3BMZWZ0LnkgfSxcbiAgICAgICAgdG9wUmlnaHQ6IHsgeDogdG9wUmlnaHQueCwgeTogdG9wUmlnaHQueSB9LFxuICAgIH07XG59XG5cbmZ1bmN0aW9uIHNjYW4obWF0cml4KSB7XG4gICAgY29uc3QgbG9jYXRpb24gPSBsb2NhdGUobWF0cml4KTtcbiAgICBpZiAoIWxvY2F0aW9uKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBleHRyYWN0ZWQgPSBleHRyYWN0KG1hdHJpeCwgbG9jYXRpb24pO1xuICAgIGNvbnN0IGRlY29kZWQgPSBkZWNvZGUkMihleHRyYWN0ZWQubWF0cml4KTtcbiAgICBpZiAoIWRlY29kZWQpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIHJldHVybiB7XG4gICAgICAgIGJpbmFyeURhdGE6IGRlY29kZWQuYnl0ZXMsXG4gICAgICAgIGRhdGE6IGRlY29kZWQudGV4dCxcbiAgICAgICAgY2h1bmtzOiBkZWNvZGVkLmNodW5rcyxcbiAgICAgICAgbG9jYXRpb246IHtcbiAgICAgICAgICAgIHRvcFJpZ2h0Q29ybmVyOiBleHRyYWN0ZWQubWFwcGluZ0Z1bmN0aW9uKGxvY2F0aW9uLmRpbWVuc2lvbiwgMCksXG4gICAgICAgICAgICB0b3BMZWZ0Q29ybmVyOiBleHRyYWN0ZWQubWFwcGluZ0Z1bmN0aW9uKDAsIDApLFxuICAgICAgICAgICAgYm90dG9tUmlnaHRDb3JuZXI6IGV4dHJhY3RlZC5tYXBwaW5nRnVuY3Rpb24obG9jYXRpb24uZGltZW5zaW9uLCBsb2NhdGlvbi5kaW1lbnNpb24pLFxuICAgICAgICAgICAgYm90dG9tTGVmdENvcm5lcjogZXh0cmFjdGVkLm1hcHBpbmdGdW5jdGlvbigwLCBsb2NhdGlvbi5kaW1lbnNpb24pLFxuICAgICAgICAgICAgdG9wUmlnaHRGaW5kZXJQYXR0ZXJuOiBsb2NhdGlvbi50b3BSaWdodCxcbiAgICAgICAgICAgIHRvcExlZnRGaW5kZXJQYXR0ZXJuOiBsb2NhdGlvbi50b3BMZWZ0LFxuICAgICAgICAgICAgYm90dG9tTGVmdEZpbmRlclBhdHRlcm46IGxvY2F0aW9uLmJvdHRvbUxlZnQsXG4gICAgICAgICAgICBib3R0b21SaWdodEFsaWdubWVudFBhdHRlcm46IGxvY2F0aW9uLmFsaWdubWVudFBhdHRlcm4sXG4gICAgICAgIH0sXG4gICAgfTtcbn1cbmNvbnN0IGRlZmF1bHRPcHRpb25zID0ge1xuICAgIGludmVyc2lvbkF0dGVtcHRzOiBcImF0dGVtcHRCb3RoXCIsXG4gICAgZ3JleVNjYWxlV2VpZ2h0czoge1xuICAgICAgICByZWQ6IDAuMjEyNixcbiAgICAgICAgZ3JlZW46IDAuNzE1MixcbiAgICAgICAgYmx1ZTogMC4wNzIyLFxuICAgICAgICB1c2VJbnRlZ2VyQXBwcm94aW1hdGlvbjogZmFsc2UsXG4gICAgfSxcbiAgICBjYW5PdmVyd3JpdGVJbWFnZTogdHJ1ZSxcbn07XG5mdW5jdGlvbiBtZXJnZU9iamVjdCh0YXJnZXQsIHNyYykge1xuICAgIE9iamVjdC5rZXlzKHNyYykuZm9yRWFjaChvcHQgPT4ge1xuICAgICAgICB0YXJnZXRbb3B0XSA9IHNyY1tvcHRdO1xuICAgIH0pO1xufVxuZnVuY3Rpb24ganNRUihkYXRhLCB3aWR0aCwgaGVpZ2h0LCBwcm92aWRlZE9wdGlvbnMgPSB7fSkge1xuICAgIGNvbnN0IG9wdGlvbnMgPSBPYmplY3QuY3JlYXRlKG51bGwpO1xuICAgIG1lcmdlT2JqZWN0KG9wdGlvbnMsIGRlZmF1bHRPcHRpb25zKTtcbiAgICBtZXJnZU9iamVjdChvcHRpb25zLCBwcm92aWRlZE9wdGlvbnMpO1xuICAgIGNvbnN0IHNob3VsZEludmVydCA9IG9wdGlvbnMuaW52ZXJzaW9uQXR0ZW1wdHMgPT09IFwiYXR0ZW1wdEJvdGhcIiB8fCBvcHRpb25zLmludmVyc2lvbkF0dGVtcHRzID09PSBcImludmVydEZpcnN0XCI7XG4gICAgY29uc3QgdHJ5SW52ZXJ0ZWRGaXJzdCA9IG9wdGlvbnMuaW52ZXJzaW9uQXR0ZW1wdHMgPT09IFwib25seUludmVydFwiIHx8IG9wdGlvbnMuaW52ZXJzaW9uQXR0ZW1wdHMgPT09IFwiaW52ZXJ0Rmlyc3RcIjtcbiAgICBjb25zdCB7IGJpbmFyaXplZCwgaW52ZXJ0ZWQgfSA9IGJpbmFyaXplKGRhdGEsIHdpZHRoLCBoZWlnaHQsIHNob3VsZEludmVydCwgb3B0aW9ucy5ncmV5U2NhbGVXZWlnaHRzLCBvcHRpb25zLmNhbk92ZXJ3cml0ZUltYWdlKTtcbiAgICBsZXQgcmVzdWx0ID0gc2Nhbih0cnlJbnZlcnRlZEZpcnN0ID8gaW52ZXJ0ZWQgOiBiaW5hcml6ZWQpO1xuICAgIGlmICghcmVzdWx0ICYmIChvcHRpb25zLmludmVyc2lvbkF0dGVtcHRzID09PSBcImF0dGVtcHRCb3RoXCIgfHwgb3B0aW9ucy5pbnZlcnNpb25BdHRlbXB0cyA9PT0gXCJpbnZlcnRGaXJzdFwiKSkge1xuICAgICAgICByZXN1bHQgPSBzY2FuKHRyeUludmVydGVkRmlyc3QgPyBiaW5hcml6ZWQgOiBpbnZlcnRlZCk7XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5qc1FSLmRlZmF1bHQgPSBqc1FSO1xuXG5leHBvcnQgZGVmYXVsdCBqc1FSO1xuLy8jIHNvdXJjZU1hcHBpbmdVUkw9anNRUi5qcy5tYXBcbiIsIlxuXG5cbnZhciB1bmRlZmluZWRIZWFkZXIgPSAvKiBhcnJheSAqL1tdO1xuXG5mdW5jdGlvbiBzb21lKHgpIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkge1xuICAgIHZhciBibG9jayA9IC8qIHR1cGxlICovW1xuICAgICAgdW5kZWZpbmVkSGVhZGVyLFxuICAgICAgMFxuICAgIF07XG4gICAgYmxvY2sudGFnID0gMjU2O1xuICAgIHJldHVybiBibG9jaztcbiAgfSBlbHNlIGlmICh4ICE9PSBudWxsICYmIHhbMF0gPT09IHVuZGVmaW5lZEhlYWRlcikge1xuICAgIHZhciBuaWQgPSB4WzFdICsgMSB8IDA7XG4gICAgdmFyIGJsb2NrJDEgPSAvKiB0dXBsZSAqL1tcbiAgICAgIHVuZGVmaW5lZEhlYWRlcixcbiAgICAgIG5pZFxuICAgIF07XG4gICAgYmxvY2skMS50YWcgPSAyNTY7XG4gICAgcmV0dXJuIGJsb2NrJDE7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHg7XG4gIH1cbn1cblxuZnVuY3Rpb24gbnVsbGFibGVfdG9fb3B0KHgpIHtcbiAgaWYgKHggPT09IG51bGwgfHwgeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc29tZSh4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB1bmRlZmluZWRfdG9fb3B0KHgpIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHNvbWUoeCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gbnVsbF90b19vcHQoeCkge1xuICBpZiAoeCA9PT0gbnVsbCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHNvbWUoeCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gdmFsRnJvbU9wdGlvbih4KSB7XG4gIGlmICh4ICE9PSBudWxsICYmIHhbMF0gPT09IHVuZGVmaW5lZEhlYWRlcikge1xuICAgIHZhciBkZXB0aCA9IHhbMV07XG4gICAgaWYgKGRlcHRoID09PSAwKSB7XG4gICAgICByZXR1cm4gdW5kZWZpbmVkO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gLyogdHVwbGUgKi9bXG4gICAgICAgICAgICAgIHVuZGVmaW5lZEhlYWRlcixcbiAgICAgICAgICAgICAgZGVwdGggLSAxIHwgMFxuICAgICAgICAgICAgXTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHg7XG4gIH1cbn1cblxuZnVuY3Rpb24gb3B0aW9uX2dldCh4KSB7XG4gIGlmICh4ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB2YWxGcm9tT3B0aW9uKHgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIG9wdGlvbl9nZXRfdW53cmFwKHgpIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbEZyb21PcHRpb24oeClbMV07XG4gIH1cbn1cblxuZXhwb3J0IHtcbiAgbnVsbGFibGVfdG9fb3B0ICxcbiAgdW5kZWZpbmVkX3RvX29wdCAsXG4gIG51bGxfdG9fb3B0ICxcbiAgdmFsRnJvbU9wdGlvbiAsXG4gIHNvbWUgLFxuICBvcHRpb25fZ2V0ICxcbiAgb3B0aW9uX2dldF91bndyYXAgLFxuICBcbn1cbi8qIE5vIHNpZGUgZWZmZWN0ICovXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQlVDS0xFU0NSSVBUIFZFUlNJT04gNS4wLjIsIFBMRUFTRSBFRElUIFdJVEggQ0FSRVxuXG5pbXBvcnQgKiBhcyBKc3FyRXM2IGZyb20gXCJqc3FyLWVzNlwiO1xuaW1wb3J0ICogYXMgQ2FtbF9vcHRpb24gZnJvbSBcIi4uL25vZGVfbW9kdWxlcy9icy1wbGF0Zm9ybS9saWIvZXM2L2NhbWxfb3B0aW9uLmpzXCI7XG5cbmZ1bmN0aW9uIHN0cmluZ19vZl9pbnZlcnRPcHRpb25zKHBhcmFtKSB7XG4gIHN3aXRjaCAocGFyYW0pIHtcbiAgICBjYXNlIDAgOiBcbiAgICAgICAgcmV0dXJuIFwiYXR0ZW1wdEJvdGhcIjtcbiAgICBjYXNlIDEgOiBcbiAgICAgICAgcmV0dXJuIFwiZG9udEludmVydFwiO1xuICAgIGNhc2UgMiA6IFxuICAgICAgICByZXR1cm4gXCJvbmx5SW52ZXJ0XCI7XG4gICAgY2FzZSAzIDogXG4gICAgICAgIHJldHVybiBcImludmVydEZpcnN0XCI7XG4gICAgXG4gIH1cbn1cblxuZnVuY3Rpb24ganNRUihkLCB3LCBoLCBpbnZlcnRPcHRpb25zKSB7XG4gIHZhciBvcHRTdHJpbmcgPSBzdHJpbmdfb2ZfaW52ZXJ0T3B0aW9ucyhpbnZlcnRPcHRpb25zKTtcbiAgcmV0dXJuIENhbWxfb3B0aW9uLm51bGxhYmxlX3RvX29wdChKc3FyRXM2LmRlZmF1bHQoZCwgdywgaCwge1xuICAgICAgICAgICAgICAgICAgaW52ZXJzaW9uQXR0ZW1wdHM6IG9wdFN0cmluZyxcbiAgICAgICAgICAgICAgICAgIGNhbk92ZXJ3cml0ZUltYWdlOiB0cnVlXG4gICAgICAgICAgICAgICAgfSkpO1xufVxuXG5leHBvcnQge1xuICBzdHJpbmdfb2ZfaW52ZXJ0T3B0aW9ucyAsXG4gIGpzUVIgLFxuICBcbn1cbi8qIGpzcXItZXM2IE5vdCBhIHB1cmUgbW9kdWxlICovXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQlVDS0xFU0NSSVBUIFZFUlNJT04gNS4wLjIsIFBMRUFTRSBFRElUIFdJVEggQ0FSRVxuXG5pbXBvcnQgKiBhcyBKc1FyJFF1ZWVyTG9vcCBmcm9tIFwiLi9Kc1FyLmJzLmpzXCI7XG5cbnNlbGYub25tZXNzYWdlID0gKGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIG1hdGNoID0gZS5kYXRhO1xuICAgIHZhciBtYXliZUNvZGUgPSBKc1FyJFF1ZWVyTG9vcC5qc1FSKG1hdGNoWzBdLCBtYXRjaFsxXSwgbWF0Y2hbMl0sIG1hdGNoWzNdKTtcbiAgICBwb3N0TWVzc2FnZShtYXliZUNvZGUpO1xuICAgIHJldHVybiAvKiAoKSAqLzA7XG4gIH0pO1xuXG5leHBvcnQge1xuICBcbn1cbi8qICBOb3QgYSBwdXJlIG1vZHVsZSAqL1xuIl0sIm5hbWVzIjpbImpzUVIiLCJDYW1sX29wdGlvbi5udWxsYWJsZV90b19vcHQiLCJKc3FyRXM2LmRlZmF1bHQiLCJKc1FyJFF1ZWVyTG9vcC5qc1FSIl0sIm1hcHBpbmdzIjoiOzs7SUFBQSxNQUFNLFNBQVMsQ0FBQztJQUNoQixJQUFJLE9BQU8sV0FBVyxDQUFDLEtBQUssRUFBRSxNQUFNLEVBQUU7SUFDdEMsUUFBUSxPQUFPLElBQUksU0FBUyxDQUFDLElBQUksaUJBQWlCLENBQUMsS0FBSyxHQUFHLE1BQU0sQ0FBQyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBQzNFLEtBQUs7SUFDTCxJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsS0FBSyxFQUFFO0lBQzdCLFFBQVEsSUFBSSxDQUFDLEtBQUssR0FBRyxLQUFLLENBQUM7SUFDM0IsUUFBUSxJQUFJLENBQUMsTUFBTSxHQUFHLElBQUksQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFD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QUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDeEMsUUFBUSxNQUFNLENBQUMsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsR0FBRyxFQUFFLENBQUMsR0FBRyxFQUFFLENBQUM7SUFDNUMsUUFBUSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQzNCLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLEVBQUUsRUFBRSxHQUFHLENBQUMsQ0FBQyxDQUFDO0lBQzNDLFFBQVEsSUFBSSxJQUFJLENBQUMsQ0FBQyxRQUFRLEVBQUUsR0FBRyxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzNELFFBQVEsTUFBTSxJQUFJLENBQUMsQ0FBQztJQUNwQixLQUFLO0lBQ0w7SUFDQSxJQUFJLElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtJQUN0QixRQUFRLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkMsUUFBUSxJQUFJLEdBQUcsSUFBSSxHQUFHLEVBQUU7SUFDeEIsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7SUFDOUQsU0FBUztJQUNULFFBQVEsTUFBTSxDQUFDLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLEdBQUcsRUFBRSxDQUFDLENBQUM7SUFDdkMsUUFBUSxNQUFNLENBQUMsR0FBRyxHQUFHLEdBQUcsRUFBRSxDQUFDO0lBQzNCLFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztJQUNuQyxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQzVDLEtBQUs7SUFDTCxTQUFTLElBQUksTUFBTSxLQUFLLENBQUMsRUFBRTtJQUMzQixRQUFRLE1BQU0sR0FBRyxHQUFHLE1BQU0sQ0FBQyxRQUFRLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDdkMsUUFBUSxJQUFJLEdBQUcsSUFBSSxFQUFFLEVBQUU7SUFDdkIsWUFBWSxNQUFNLElBQUksS0FBSyxDQUFDLCtCQUErQixDQUFDLENBQUM7SUFDN0QsU0FBUztJQUNULFFBQVEsS0FBSyxDQUFDLElBQUksQ0FBQyxFQUFFLEdBQUcsR0FBRyxDQUFDLENBQUM7SUFDN0IsUUFBUSxJQUFJLElBQUksR0FBRyxDQUFDLFFBQVEsRUFBRSxDQUFDO0lBQy9CLEtBQUs7SUFDTCxJQUFJLE9BQU8sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDM0IsQ0FBQztJQUNELE1BQU0sMEJBQTBCLEdBQUc7SUFDbkMsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFDL0MsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFDL0MsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFDL0MsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFDL0MsSUFBSSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsRUFBRSxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUc7SUFDL0MsQ0FBQyxDQUFDO0lBQ0YsU0FBUyxrQkFBa0IsQ0FBQyxNQUFNLEVBQUUsSUFBSSxF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QUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtJQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0lBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7SUFD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LElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztJQUN0RCxRQUFRLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztJQUN0RCxRQUFRLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztJQUN0RCxRQUFRLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztJQUN0RCxRQUFRLEdBQUcsRUFBRSxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRztJQUN0RCxLQUFLLENBQUM7SUFDTixDQUFDO0lBQ0QsU0FBUyxLQUFLLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRTtJQUNyQixJQUFJLE9BQU87SUFDWCxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUc7SUFDMUQsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHO0lBQzFELFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRztJQUMxRCxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUc7SUFDMUQsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHO0lBQzFELFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRztJQUMxRCxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUc7SUFDMUQsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHO0lBQzFELFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRztJQUMxRCxLQUFLLENBQUM7SUFDTixDQUFDO0lBQ0QsU0FBUyxPQUFPLENBQUMsS0FBSyxFQUFF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LENBQUM7SUFDaEYsSUFBSSxNQUFNLEtBQUssR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsTUFBTSxDQUFDLENBQUMsQ0FBQyxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUMsR0FBRyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDMUUsSUFBSSxJQUFJLEtBQUssQ0FBQztJQUNkLElBQUksSUFBSSxLQUFLLENBQUM7SUFDZCxJQUFJLElBQUksR0FBRyxDQUFDO0lBQ1osSUFBSSxJQUFJLEdBQUcsQ0FBQztJQUNaLElBQUksSUFBSSxLQUFLLEVBQUU7SUFDZixRQUFRLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxRQUFRLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNyQyxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztJQUNoQyxLQUFLO0lBQ0wsU0FBUztJQUNULFFBQVEsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLFFBQVEsS0FBSyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ3JDLFFBQVEsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLFFBQVEsR0FBRyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQyxDQUFDO0lBQ2hDLEtBQUs7SUFDTCxJQUFJLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFH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QUFDLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDLEVBQUU7SUFDdkQsWUFBWSxPQUFPO0lBQ25CLFNBQVM7SUFDVCxRQUFRLE1BQU0sT0FBTyxHQUFHLENBQUMsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxJQUFJLEdBQUcsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxDQUFDLE1BQU0sQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7SUFDL0csUUFBUSxNQUFNLElBQUksR0FBRyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsT0FBTyxDQUFDLE1BQU0sQ0FBQztJQUNuRCxRQUFRLE1BQU0sS0FBSyxHQUFHLFlBQVksQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLENBQUMsRUFBRSxJQUFJLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxFQUFFLEVBQUUsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7SUFDcEcsUUFBUSxPQUFPLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxDQUFDLEVBQUUsSUFBSSxFQUFFLENBQUM7SUFDckMsS0FBSyxDQUFDO0lBQ04sU0FBUyxNQUFNLENBQUMsQ0FBQyxJQUFJLENBQUMsQ0FBQyxDQUFDLENBQUM7SUFDekIsU0FBUyxJQUFJLENBQUMsQ0FBQyxDQUFDLEVBQUUsQ0FBQyxLQUFLLENBQUMsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxDQUFDLEtBQUssQ0FBQztJQUMxQztJQUNBLFNBQVMsR0FBRyxDQUFDLENBQUMsS0FBSyxFQUFFLENBQUMsRUFBRSxjQUFjLEtBQUs7SUFDM0MsUUFBUSxJQUFJLENBQUMsR0FBRyw0QkFBNEIs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
