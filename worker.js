(function () {
  'use strict';

  var out_of_memory = /* tuple */[
    "Out_of_memory",
    0
  ];

  var sys_error = /* tuple */[
    "Sys_error",
    -1
  ];

  var failure = /* tuple */[
    "Failure",
    -2
  ];

  var invalid_argument = /* tuple */[
    "Invalid_argument",
    -3
  ];

  var end_of_file = /* tuple */[
    "End_of_file",
    -4
  ];

  var division_by_zero = /* tuple */[
    "Division_by_zero",
    -5
  ];

  var not_found = /* tuple */[
    "Not_found",
    -6
  ];

  var match_failure = /* tuple */[
    "Match_failure",
    -7
  ];

  var stack_overflow = /* tuple */[
    "Stack_overflow",
    -8
  ];

  var sys_blocked_io = /* tuple */[
    "Sys_blocked_io",
    -9
  ];

  var assert_failure = /* tuple */[
    "Assert_failure",
    -10
  ];

  var undefined_recursive_module = /* tuple */[
    "Undefined_recursive_module",
    -11
  ];

  out_of_memory.tag = 248;

  sys_error.tag = 248;

  failure.tag = 248;

  invalid_argument.tag = 248;

  end_of_file.tag = 248;

  division_by_zero.tag = 248;

  not_found.tag = 248;

  match_failure.tag = 248;

  stack_overflow.tag = 248;

  sys_blocked_io.tag = 248;

  assert_failure.tag = 248;

  undefined_recursive_module.tag = 248;
  /*  Not a pure module */

  /* No side effect */

  /* No side effect */

  var id = /* record */[/* contents */0];

  function caml_fresh_oo_id(param) {
    id[0] += 1;
    return id[0];
  }

  function create(str) {
    var v_001 = caml_fresh_oo_id(/* () */0);
    var v = /* tuple */[
      str,
      v_001
    ];
    v.tag = 248;
    return v;
  }
  /* No side effect */

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

  var $$Error = create("Caml_js_exceptions.Error");
  /* No side effect */

  var Bottom = create("Array.Bottom");
  /* No side effect */

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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoid29ya2VyLmpzIiwic291cmNlcyI6WyJub2RlX21vZHVsZXMvYnMtcGxhdGZvcm0vbGliL2VzNi9jYW1sX2J1aWx0aW5fZXhjZXB0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9icy1wbGF0Zm9ybS9saWIvZXM2L2NhbWxfYXJyYXkuanMiLCJub2RlX21vZHVsZXMvYnMtcGxhdGZvcm0vbGliL2VzNi9jdXJyeS5qcyIsIm5vZGVfbW9kdWxlcy9icy1wbGF0Zm9ybS9saWIvZXM2L2NhbWxfZXhjZXB0aW9ucy5qcyIsIm5vZGVfbW9kdWxlcy9icy1wbGF0Zm9ybS9saWIvZXM2L2NhbWxfb3B0aW9uLmpzIiwibm9kZV9tb2R1bGVzL2JzLXBsYXRmb3JtL2xpYi9lczYvY2FtbF9qc19leGNlcHRpb25zLmpzIiwibm9kZV9tb2R1bGVzL2JzLXBsYXRmb3JtL2xpYi9lczYvYXJyYXkuanMiLCJub2RlX21vZHVsZXMvanNxci1lczYvZGlzdC9qc1FSLmpzIiwic3JjL0pzUXIuYnMuanMiLCJzcmMvRGVjb2RlV29ya2VyLmJzLmpzIl0sInNvdXJjZXNDb250ZW50IjpbIlxuXG5cbnZhciBvdXRfb2ZfbWVtb3J5ID0gLyogdHVwbGUgKi9bXG4gIFwiT3V0X29mX21lbW9yeVwiLFxuICAwXG5dO1xuXG52YXIgc3lzX2Vycm9yID0gLyogdHVwbGUgKi9bXG4gIFwiU3lzX2Vycm9yXCIsXG4gIC0xXG5dO1xuXG52YXIgZmFpbHVyZSA9IC8qIHR1cGxlICovW1xuICBcIkZhaWx1cmVcIixcbiAgLTJcbl07XG5cbnZhciBpbnZhbGlkX2FyZ3VtZW50ID0gLyogdHVwbGUgKi9bXG4gIFwiSW52YWxpZF9hcmd1bWVudFwiLFxuICAtM1xuXTtcblxudmFyIGVuZF9vZl9maWxlID0gLyogdHVwbGUgKi9bXG4gIFwiRW5kX29mX2ZpbGVcIixcbiAgLTRcbl07XG5cbnZhciBkaXZpc2lvbl9ieV96ZXJvID0gLyogdHVwbGUgKi9bXG4gIFwiRGl2aXNpb25fYnlfemVyb1wiLFxuICAtNVxuXTtcblxudmFyIG5vdF9mb3VuZCA9IC8qIHR1cGxlICovW1xuICBcIk5vdF9mb3VuZFwiLFxuICAtNlxuXTtcblxudmFyIG1hdGNoX2ZhaWx1cmUgPSAvKiB0dXBsZSAqL1tcbiAgXCJNYXRjaF9mYWlsdXJlXCIsXG4gIC03XG5dO1xuXG52YXIgc3RhY2tfb3ZlcmZsb3cgPSAvKiB0dXBsZSAqL1tcbiAgXCJTdGFja19vdmVyZmxvd1wiLFxuICAtOFxuXTtcblxudmFyIHN5c19ibG9ja2VkX2lvID0gLyogdHVwbGUgKi9bXG4gIFwiU3lzX2Jsb2NrZWRfaW9cIixcbiAgLTlcbl07XG5cbnZhciBhc3NlcnRfZmFpbHVyZSA9IC8qIHR1cGxlICovW1xuICBcIkFzc2VydF9mYWlsdXJlXCIsXG4gIC0xMFxuXTtcblxudmFyIHVuZGVmaW5lZF9yZWN1cnNpdmVfbW9kdWxlID0gLyogdHVwbGUgKi9bXG4gIFwiVW5kZWZpbmVkX3JlY3Vyc2l2ZV9tb2R1bGVcIixcbiAgLTExXG5dO1xuXG5vdXRfb2ZfbWVtb3J5LnRhZyA9IDI0ODtcblxuc3lzX2Vycm9yLnRhZyA9IDI0ODtcblxuZmFpbHVyZS50YWcgPSAyNDg7XG5cbmludmFsaWRfYXJndW1lbnQudGFnID0gMjQ4O1xuXG5lbmRfb2ZfZmlsZS50YWcgPSAyNDg7XG5cbmRpdmlzaW9uX2J5X3plcm8udGFnID0gMjQ4O1xuXG5ub3RfZm91bmQudGFnID0gMjQ4O1xuXG5tYXRjaF9mYWlsdXJlLnRhZyA9IDI0ODtcblxuc3RhY2tfb3ZlcmZsb3cudGFnID0gMjQ4O1xuXG5zeXNfYmxvY2tlZF9pby50YWcgPSAyNDg7XG5cbmFzc2VydF9mYWlsdXJlLnRhZyA9IDI0ODtcblxudW5kZWZpbmVkX3JlY3Vyc2l2ZV9tb2R1bGUudGFnID0gMjQ4O1xuXG5leHBvcnQge1xuICBvdXRfb2ZfbWVtb3J5ICxcbiAgc3lzX2Vycm9yICxcbiAgZmFpbHVyZSAsXG4gIGludmFsaWRfYXJndW1lbnQgLFxuICBlbmRfb2ZfZmlsZSAsXG4gIGRpdmlzaW9uX2J5X3plcm8gLFxuICBub3RfZm91bmQgLFxuICBtYXRjaF9mYWlsdXJlICxcbiAgc3RhY2tfb3ZlcmZsb3cgLFxuICBzeXNfYmxvY2tlZF9pbyAsXG4gIGFzc2VydF9mYWlsdXJlICxcbiAgdW5kZWZpbmVkX3JlY3Vyc2l2ZV9tb2R1bGUgLFxuICBcbn1cbi8qICBOb3QgYSBwdXJlIG1vZHVsZSAqL1xuIiwiXG5cbmltcG9ydCAqIGFzIENhbWxfYnVpbHRpbl9leGNlcHRpb25zIGZyb20gXCIuL2NhbWxfYnVpbHRpbl9leGNlcHRpb25zLmpzXCI7XG5cbmZ1bmN0aW9uIGNhbWxfYXJyYXlfc3ViKHgsIG9mZnNldCwgbGVuKSB7XG4gIHZhciByZXN1bHQgPSBuZXcgQXJyYXkobGVuKTtcbiAgdmFyIGogPSAwO1xuICB2YXIgaSA9IG9mZnNldDtcbiAgd2hpbGUoaiA8IGxlbikge1xuICAgIHJlc3VsdFtqXSA9IHhbaV07XG4gICAgaiA9IGogKyAxIHwgMDtcbiAgICBpID0gaSArIDEgfCAwO1xuICB9O1xuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBsZW4oX2FjYywgX2wpIHtcbiAgd2hpbGUodHJ1ZSkge1xuICAgIHZhciBsID0gX2w7XG4gICAgdmFyIGFjYyA9IF9hY2M7XG4gICAgaWYgKGwpIHtcbiAgICAgIF9sID0gbFsxXTtcbiAgICAgIF9hY2MgPSBsWzBdLmxlbmd0aCArIGFjYyB8IDA7XG4gICAgICBjb250aW51ZSA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhY2M7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBmaWxsKGFyciwgX2ksIF9sKSB7XG4gIHdoaWxlKHRydWUpIHtcbiAgICB2YXIgbCA9IF9sO1xuICAgIHZhciBpID0gX2k7XG4gICAgaWYgKGwpIHtcbiAgICAgIHZhciB4ID0gbFswXTtcbiAgICAgIHZhciBsJDEgPSB4Lmxlbmd0aDtcbiAgICAgIHZhciBrID0gaTtcbiAgICAgIHZhciBqID0gMDtcbiAgICAgIHdoaWxlKGogPCBsJDEpIHtcbiAgICAgICAgYXJyW2tdID0geFtqXTtcbiAgICAgICAgayA9IGsgKyAxIHwgMDtcbiAgICAgICAgaiA9IGogKyAxIHwgMDtcbiAgICAgIH07XG4gICAgICBfbCA9IGxbMV07XG4gICAgICBfaSA9IGs7XG4gICAgICBjb250aW51ZSA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAvKiAoKSAqLzA7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBjYW1sX2FycmF5X2NvbmNhdChsKSB7XG4gIHZhciB2ID0gbGVuKDAsIGwpO1xuICB2YXIgcmVzdWx0ID0gbmV3IEFycmF5KHYpO1xuICBmaWxsKHJlc3VsdCwgMCwgbCk7XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIGNhbWxfYXJyYXlfc2V0KHhzLCBpbmRleCwgbmV3dmFsKSB7XG4gIGlmIChpbmRleCA8IDAgfHwgaW5kZXggPj0geHMubGVuZ3RoKSB7XG4gICAgdGhyb3cgW1xuICAgICAgICAgIENhbWxfYnVpbHRpbl9leGNlcHRpb25zLmludmFsaWRfYXJndW1lbnQsXG4gICAgICAgICAgXCJpbmRleCBvdXQgb2YgYm91bmRzXCJcbiAgICAgICAgXTtcbiAgfSBlbHNlIHtcbiAgICB4c1tpbmRleF0gPSBuZXd2YWw7XG4gICAgcmV0dXJuIC8qICgpICovMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBjYW1sX2FycmF5X2dldCh4cywgaW5kZXgpIHtcbiAgaWYgKGluZGV4IDwgMCB8fCBpbmRleCA+PSB4cy5sZW5ndGgpIHtcbiAgICB0aHJvdyBbXG4gICAgICAgICAgQ2FtbF9idWlsdGluX2V4Y2VwdGlvbnMuaW52YWxpZF9hcmd1bWVudCxcbiAgICAgICAgICBcImluZGV4IG91dCBvZiBib3VuZHNcIlxuICAgICAgICBdO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiB4c1tpbmRleF07XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FtbF9tYWtlX3ZlY3QobGVuLCBpbml0KSB7XG4gIHZhciBiID0gbmV3IEFycmF5KGxlbik7XG4gIGZvcih2YXIgaSA9IDAgLGlfZmluaXNoID0gbGVuIC0gMSB8IDA7IGkgPD0gaV9maW5pc2g7ICsraSl7XG4gICAgYltpXSA9IGluaXQ7XG4gIH1cbiAgcmV0dXJuIGI7XG59XG5cbmZ1bmN0aW9uIGNhbWxfbWFrZV9mbG9hdF92ZWN0KGxlbikge1xuICB2YXIgYiA9IG5ldyBBcnJheShsZW4pO1xuICBmb3IodmFyIGkgPSAwICxpX2ZpbmlzaCA9IGxlbiAtIDEgfCAwOyBpIDw9IGlfZmluaXNoOyArK2kpe1xuICAgIGJbaV0gPSAwO1xuICB9XG4gIHJldHVybiBiO1xufVxuXG5mdW5jdGlvbiBjYW1sX2FycmF5X2JsaXQoYTEsIGkxLCBhMiwgaTIsIGxlbikge1xuICBpZiAoaTIgPD0gaTEpIHtcbiAgICBmb3IodmFyIGogPSAwICxqX2ZpbmlzaCA9IGxlbiAtIDEgfCAwOyBqIDw9IGpfZmluaXNoOyArK2ope1xuICAgICAgYTJbaiArIGkyIHwgMF0gPSBhMVtqICsgaTEgfCAwXTtcbiAgICB9XG4gICAgcmV0dXJuIC8qICgpICovMDtcbiAgfSBlbHNlIHtcbiAgICBmb3IodmFyIGokMSA9IGxlbiAtIDEgfCAwOyBqJDEgPj0gMDsgLS1qJDEpe1xuICAgICAgYTJbaiQxICsgaTIgfCAwXSA9IGExW2okMSArIGkxIHwgMF07XG4gICAgfVxuICAgIHJldHVybiAvKiAoKSAqLzA7XG4gIH1cbn1cblxuZnVuY3Rpb24gY2FtbF9hcnJheV9kdXAocHJpbSkge1xuICByZXR1cm4gcHJpbS5zbGljZSgwKTtcbn1cblxuZXhwb3J0IHtcbiAgY2FtbF9hcnJheV9kdXAgLFxuICBjYW1sX2FycmF5X3N1YiAsXG4gIGNhbWxfYXJyYXlfY29uY2F0ICxcbiAgY2FtbF9tYWtlX3ZlY3QgLFxuICBjYW1sX21ha2VfZmxvYXRfdmVjdCAsXG4gIGNhbWxfYXJyYXlfYmxpdCAsXG4gIGNhbWxfYXJyYXlfZ2V0ICxcbiAgY2FtbF9hcnJheV9zZXQgLFxuICBcbn1cbi8qIE5vIHNpZGUgZWZmZWN0ICovXG4iLCJcblxuaW1wb3J0ICogYXMgQ2FtbF9hcnJheSBmcm9tIFwiLi9jYW1sX2FycmF5LmpzXCI7XG5cbmZ1bmN0aW9uIGFwcChfZiwgX2FyZ3MpIHtcbiAgd2hpbGUodHJ1ZSkge1xuICAgIHZhciBhcmdzID0gX2FyZ3M7XG4gICAgdmFyIGYgPSBfZjtcbiAgICB2YXIgaW5pdF9hcml0eSA9IGYubGVuZ3RoO1xuICAgIHZhciBhcml0eSA9IGluaXRfYXJpdHkgPT09IDAgPyAxIDogaW5pdF9hcml0eTtcbiAgICB2YXIgbGVuID0gYXJncy5sZW5ndGg7XG4gICAgdmFyIGQgPSBhcml0eSAtIGxlbiB8IDA7XG4gICAgaWYgKGQgPT09IDApIHtcbiAgICAgIHJldHVybiBmLmFwcGx5KG51bGwsIGFyZ3MpO1xuICAgIH0gZWxzZSBpZiAoZCA8IDApIHtcbiAgICAgIF9hcmdzID0gQ2FtbF9hcnJheS5jYW1sX2FycmF5X3N1YihhcmdzLCBhcml0eSwgLWQgfCAwKTtcbiAgICAgIF9mID0gZi5hcHBseShudWxsLCBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc3ViKGFyZ3MsIDAsIGFyaXR5KSk7XG4gICAgICBjb250aW51ZSA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAoZnVuY3Rpb24oZixhcmdzKXtcbiAgICAgIHJldHVybiBmdW5jdGlvbiAoeCkge1xuICAgICAgICByZXR1cm4gYXBwKGYsIGFyZ3MuY29uY2F0KC8qIGFycmF5ICovW3hdKSk7XG4gICAgICB9XG4gICAgICB9KGYsYXJncykpO1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gY3VycnlfMShvLCBhMCwgYXJpdHkpIHtcbiAgc3dpdGNoIChhcml0eSkge1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gbyhhMCk7XG4gICAgY2FzZSAyIDogXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKHBhcmFtKSB7XG4gICAgICAgICAgICByZXR1cm4gbyhhMCwgcGFyYW0pO1xuICAgICAgICAgIH0pO1xuICAgIGNhc2UgMyA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSwgcGFyYW0kMSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIHBhcmFtLCBwYXJhbSQxKTtcbiAgICAgICAgICB9KTtcbiAgICBjYXNlIDQgOiBcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAocGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIpIHtcbiAgICAgICAgICAgIHJldHVybiBvKGEwLCBwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMik7XG4gICAgICAgICAgfSk7XG4gICAgY2FzZSA1IDogXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKHBhcmFtLCBwYXJhbSQxLCBwYXJhbSQyLCBwYXJhbSQzKSB7XG4gICAgICAgICAgICByZXR1cm4gbyhhMCwgcGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIsIHBhcmFtJDMpO1xuICAgICAgICAgIH0pO1xuICAgIGNhc2UgNiA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMiwgcGFyYW0kMywgcGFyYW0kNCkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIHBhcmFtLCBwYXJhbSQxLCBwYXJhbSQyLCBwYXJhbSQzLCBwYXJhbSQ0KTtcbiAgICAgICAgICB9KTtcbiAgICBjYXNlIDcgOiBcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAocGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIsIHBhcmFtJDMsIHBhcmFtJDQsIHBhcmFtJDUpIHtcbiAgICAgICAgICAgIHJldHVybiBvKGEwLCBwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMiwgcGFyYW0kMywgcGFyYW0kNCwgcGFyYW0kNSk7XG4gICAgICAgICAgfSk7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBhcHAobywgLyogYXJyYXkgKi9bYTBdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfMShvLCBhMCkge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSAxKSB7XG4gICAgcmV0dXJuIG8oYTApO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjdXJyeV8xKG8sIGEwLCBhcml0eSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX18xKG8pIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gMSkge1xuICAgIHJldHVybiBvO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoZnVuY3Rpb24gKGEwKSB7XG4gICAgICAgIHJldHVybiBfMShvLCBhMCk7XG4gICAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjdXJyeV8yKG8sIGEwLCBhMSwgYXJpdHkpIHtcbiAgc3dpdGNoIChhcml0eSkge1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTApLCAvKiBhcnJheSAqL1thMV0pO1xuICAgIGNhc2UgMiA6IFxuICAgICAgICByZXR1cm4gbyhhMCwgYTEpO1xuICAgIGNhc2UgMyA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBwYXJhbSk7XG4gICAgICAgICAgfSk7XG4gICAgY2FzZSA0IDogXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKHBhcmFtLCBwYXJhbSQxKSB7XG4gICAgICAgICAgICByZXR1cm4gbyhhMCwgYTEsIHBhcmFtLCBwYXJhbSQxKTtcbiAgICAgICAgICB9KTtcbiAgICBjYXNlIDUgOiBcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAocGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIpIHtcbiAgICAgICAgICAgIHJldHVybiBvKGEwLCBhMSwgcGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIpO1xuICAgICAgICAgIH0pO1xuICAgIGNhc2UgNiA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMiwgcGFyYW0kMykge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMiwgcGFyYW0kMyk7XG4gICAgICAgICAgfSk7XG4gICAgY2FzZSA3IDogXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKHBhcmFtLCBwYXJhbSQxLCBwYXJhbSQyLCBwYXJhbSQzLCBwYXJhbSQ0KSB7XG4gICAgICAgICAgICByZXR1cm4gbyhhMCwgYTEsIHBhcmFtLCBwYXJhbSQxLCBwYXJhbSQyLCBwYXJhbSQzLCBwYXJhbSQ0KTtcbiAgICAgICAgICB9KTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGFwcChvLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgIGEwLFxuICAgICAgICAgICAgICAgICAgYTFcbiAgICAgICAgICAgICAgICBdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfMihvLCBhMCwgYTEpIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gMikge1xuICAgIHJldHVybiBvKGEwLCBhMSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJ5XzIobywgYTAsIGExLCBhcml0eSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX18yKG8pIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gMikge1xuICAgIHJldHVybiBvO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoZnVuY3Rpb24gKGEwLCBhMSkge1xuICAgICAgICByZXR1cm4gXzIobywgYTAsIGExKTtcbiAgICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGN1cnJ5XzMobywgYTAsIGExLCBhMiwgYXJpdHkpIHtcbiAgc3dpdGNoIChhcml0eSkge1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTApLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgICAgYTEsXG4gICAgICAgICAgICAgICAgICAgIGEyXG4gICAgICAgICAgICAgICAgICBdKTtcbiAgICBjYXNlIDIgOiBcbiAgICAgICAgcmV0dXJuIGFwcChvKGEwLCBhMSksIC8qIGFycmF5ICovW2EyXSk7XG4gICAgY2FzZSAzIDogXG4gICAgICAgIHJldHVybiBvKGEwLCBhMSwgYTIpO1xuICAgIGNhc2UgNCA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgcGFyYW0pO1xuICAgICAgICAgIH0pO1xuICAgIGNhc2UgNSA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSwgcGFyYW0kMSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgcGFyYW0sIHBhcmFtJDEpO1xuICAgICAgICAgIH0pO1xuICAgIGNhc2UgNiA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMikge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgcGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIpO1xuICAgICAgICAgIH0pO1xuICAgIGNhc2UgNyA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSwgcGFyYW0kMSwgcGFyYW0kMiwgcGFyYW0kMykge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgcGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIsIHBhcmFtJDMpO1xuICAgICAgICAgIH0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYXBwKG8sIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgYTAsXG4gICAgICAgICAgICAgICAgICBhMSxcbiAgICAgICAgICAgICAgICAgIGEyXG4gICAgICAgICAgICAgICAgXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gXzMobywgYTAsIGExLCBhMikge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSAzKSB7XG4gICAgcmV0dXJuIG8oYTAsIGExLCBhMik7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJ5XzMobywgYTAsIGExLCBhMiwgYXJpdHkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9fMyhvKSB7XG4gIHZhciBhcml0eSA9IG8ubGVuZ3RoO1xuICBpZiAoYXJpdHkgPT09IDMpIHtcbiAgICByZXR1cm4gbztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uIChhMCwgYTEsIGEyKSB7XG4gICAgICAgIHJldHVybiBfMyhvLCBhMCwgYTEsIGEyKTtcbiAgICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGN1cnJ5XzQobywgYTAsIGExLCBhMiwgYTMsIGFyaXR5KSB7XG4gIHN3aXRjaCAoYXJpdHkpIHtcbiAgICBjYXNlIDEgOiBcbiAgICAgICAgcmV0dXJuIGFwcChvKGEwKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGExLFxuICAgICAgICAgICAgICAgICAgICBhMixcbiAgICAgICAgICAgICAgICAgICAgYTNcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgMiA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhM1xuICAgICAgICAgICAgICAgICAgXSk7XG4gICAgY2FzZSAzIDogXG4gICAgICAgIHJldHVybiBhcHAobyhhMCwgYTEsIGEyKSwgLyogYXJyYXkgKi9bYTNdKTtcbiAgICBjYXNlIDQgOiBcbiAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMpO1xuICAgIGNhc2UgNSA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIHBhcmFtKTtcbiAgICAgICAgICB9KTtcbiAgICBjYXNlIDYgOiBcbiAgICAgICAgcmV0dXJuIChmdW5jdGlvbiAocGFyYW0sIHBhcmFtJDEpIHtcbiAgICAgICAgICAgIHJldHVybiBvKGEwLCBhMSwgYTIsIGEzLCBwYXJhbSwgcGFyYW0kMSk7XG4gICAgICAgICAgfSk7XG4gICAgY2FzZSA3IDogXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKHBhcmFtLCBwYXJhbSQxLCBwYXJhbSQyKSB7XG4gICAgICAgICAgICByZXR1cm4gbyhhMCwgYTEsIGEyLCBhMywgcGFyYW0sIHBhcmFtJDEsIHBhcmFtJDIpO1xuICAgICAgICAgIH0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYXBwKG8sIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgYTAsXG4gICAgICAgICAgICAgICAgICBhMSxcbiAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgYTNcbiAgICAgICAgICAgICAgICBdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfNChvLCBhMCwgYTEsIGEyLCBhMykge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSA0KSB7XG4gICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjdXJyeV80KG8sIGEwLCBhMSwgYTIsIGEzLCBhcml0eSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX180KG8pIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gNCkge1xuICAgIHJldHVybiBvO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzKSB7XG4gICAgICAgIHJldHVybiBfNChvLCBhMCwgYTEsIGEyLCBhMyk7XG4gICAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjdXJyeV81KG8sIGEwLCBhMSwgYTIsIGEzLCBhNCwgYXJpdHkpIHtcbiAgc3dpdGNoIChhcml0eSkge1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTApLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgICAgYTEsXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTRcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgMiA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTRcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgMyA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiksIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTRcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNCA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMpLCAvKiBhcnJheSAqL1thNF0pO1xuICAgIGNhc2UgNSA6IFxuICAgICAgICByZXR1cm4gbyhhMCwgYTEsIGEyLCBhMywgYTQpO1xuICAgIGNhc2UgNiA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIGE0LCBwYXJhbSk7XG4gICAgICAgICAgfSk7XG4gICAgY2FzZSA3IDogXG4gICAgICAgIHJldHVybiAoZnVuY3Rpb24gKHBhcmFtLCBwYXJhbSQxKSB7XG4gICAgICAgICAgICByZXR1cm4gbyhhMCwgYTEsIGEyLCBhMywgYTQsIHBhcmFtLCBwYXJhbSQxKTtcbiAgICAgICAgICB9KTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIGFwcChvLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgIGEwLFxuICAgICAgICAgICAgICAgICAgYTEsXG4gICAgICAgICAgICAgICAgICBhMixcbiAgICAgICAgICAgICAgICAgIGEzLFxuICAgICAgICAgICAgICAgICAgYTRcbiAgICAgICAgICAgICAgICBdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfNShvLCBhMCwgYTEsIGEyLCBhMywgYTQpIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gNSkge1xuICAgIHJldHVybiBvKGEwLCBhMSwgYTIsIGEzLCBhNCk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJ5XzUobywgYTAsIGExLCBhMiwgYTMsIGE0LCBhcml0eSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX181KG8pIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gNSkge1xuICAgIHJldHVybiBvO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzLCBhNCkge1xuICAgICAgICByZXR1cm4gXzUobywgYTAsIGExLCBhMiwgYTMsIGE0KTtcbiAgICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGN1cnJ5XzYobywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYXJpdHkpIHtcbiAgc3dpdGNoIChhcml0eSkge1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTApLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgICAgYTEsXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1XG4gICAgICAgICAgICAgICAgICBdKTtcbiAgICBjYXNlIDIgOiBcbiAgICAgICAgcmV0dXJuIGFwcChvKGEwLCBhMSksIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgICBhMixcbiAgICAgICAgICAgICAgICAgICAgYTMsXG4gICAgICAgICAgICAgICAgICAgIGE0LFxuICAgICAgICAgICAgICAgICAgICBhNVxuICAgICAgICAgICAgICAgICAgXSk7XG4gICAgY2FzZSAzIDogXG4gICAgICAgIHJldHVybiBhcHAobyhhMCwgYTEsIGEyKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGEzLFxuICAgICAgICAgICAgICAgICAgICBhNCxcbiAgICAgICAgICAgICAgICAgICAgYTVcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNCA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMpLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1XG4gICAgICAgICAgICAgICAgICBdKTtcbiAgICBjYXNlIDUgOiBcbiAgICAgICAgcmV0dXJuIGFwcChvKGEwLCBhMSwgYTIsIGEzLCBhNCksIC8qIGFycmF5ICovW2E1XSk7XG4gICAgY2FzZSA2IDogXG4gICAgICAgIHJldHVybiBvKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUpO1xuICAgIGNhc2UgNyA6IFxuICAgICAgICByZXR1cm4gKGZ1bmN0aW9uIChwYXJhbSkge1xuICAgICAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgcGFyYW0pO1xuICAgICAgICAgIH0pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYXBwKG8sIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgYTAsXG4gICAgICAgICAgICAgICAgICBhMSxcbiAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgYTMsXG4gICAgICAgICAgICAgICAgICBhNCxcbiAgICAgICAgICAgICAgICAgIGE1XG4gICAgICAgICAgICAgICAgXSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gXzYobywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSkge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSA2KSB7XG4gICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGN1cnJ5XzYobywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYXJpdHkpO1xuICB9XG59XG5cbmZ1bmN0aW9uIF9fNihvKSB7XG4gIHZhciBhcml0eSA9IG8ubGVuZ3RoO1xuICBpZiAoYXJpdHkgPT09IDYpIHtcbiAgICByZXR1cm4gbztcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gKGZ1bmN0aW9uIChhMCwgYTEsIGEyLCBhMywgYTQsIGE1KSB7XG4gICAgICAgIHJldHVybiBfNihvLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1KTtcbiAgICAgIH0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIGN1cnJ5XzcobywgYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGFyaXR5KSB7XG4gIHN3aXRjaCAoYXJpdHkpIHtcbiAgICBjYXNlIDEgOiBcbiAgICAgICAgcmV0dXJuIGFwcChvKGEwKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGExLFxuICAgICAgICAgICAgICAgICAgICBhMixcbiAgICAgICAgICAgICAgICAgICAgYTMsXG4gICAgICAgICAgICAgICAgICAgIGE0LFxuICAgICAgICAgICAgICAgICAgICBhNSxcbiAgICAgICAgICAgICAgICAgICAgYTZcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgMiA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNlxuICAgICAgICAgICAgICAgICAgXSk7XG4gICAgY2FzZSAzIDogXG4gICAgICAgIHJldHVybiBhcHAobyhhMCwgYTEsIGEyKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGEzLFxuICAgICAgICAgICAgICAgICAgICBhNCxcbiAgICAgICAgICAgICAgICAgICAgYTUsXG4gICAgICAgICAgICAgICAgICAgIGE2XG4gICAgICAgICAgICAgICAgICBdKTtcbiAgICBjYXNlIDQgOiBcbiAgICAgICAgcmV0dXJuIGFwcChvKGEwLCBhMSwgYTIsIGEzKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGE0LFxuICAgICAgICAgICAgICAgICAgICBhNSxcbiAgICAgICAgICAgICAgICAgICAgYTZcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMsIGE0KSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNlxuICAgICAgICAgICAgICAgICAgXSk7XG4gICAgY2FzZSA2IDogXG4gICAgICAgIHJldHVybiBhcHAobyhhMCwgYTEsIGEyLCBhMywgYTQsIGE1KSwgLyogYXJyYXkgKi9bYTZdKTtcbiAgICBjYXNlIDcgOiBcbiAgICAgICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYXBwKG8sIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgYTAsXG4gICAgICAgICAgICAgICAgICBhMSxcbiAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgYTMsXG4gICAgICAgICAgICAgICAgICBhNCxcbiAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgYTZcbiAgICAgICAgICAgICAgICBdKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfNyhvLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNikge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSA3KSB7XG4gICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBjdXJyeV83KG8sIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhcml0eSk7XG4gIH1cbn1cblxuZnVuY3Rpb24gX183KG8pIHtcbiAgdmFyIGFyaXR5ID0gby5sZW5ndGg7XG4gIGlmIChhcml0eSA9PT0gNykge1xuICAgIHJldHVybiBvO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiAoZnVuY3Rpb24gKGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2KSB7XG4gICAgICAgIHJldHVybiBfNyhvLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNik7XG4gICAgICB9KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBjdXJyeV84KG8sIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNywgYXJpdHkpIHtcbiAgc3dpdGNoIChhcml0eSkge1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTApLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgICAgYTEsXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNixcbiAgICAgICAgICAgICAgICAgICAgYTdcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgMiA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExKSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNixcbiAgICAgICAgICAgICAgICAgICAgYTdcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgMyA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiksIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgICBhMyxcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNixcbiAgICAgICAgICAgICAgICAgICAgYTdcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNCA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMpLCAvKiBhcnJheSAqL1tcbiAgICAgICAgICAgICAgICAgICAgYTQsXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNixcbiAgICAgICAgICAgICAgICAgICAgYTdcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNSA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMsIGE0KSwgLyogYXJyYXkgKi9bXG4gICAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgICBhNixcbiAgICAgICAgICAgICAgICAgICAgYTdcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNiA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSksIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgICBhNixcbiAgICAgICAgICAgICAgICAgICAgYTdcbiAgICAgICAgICAgICAgICAgIF0pO1xuICAgIGNhc2UgNyA6IFxuICAgICAgICByZXR1cm4gYXBwKG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYpLCAvKiBhcnJheSAqL1thN10pO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gYXBwKG8sIC8qIGFycmF5ICovW1xuICAgICAgICAgICAgICAgICAgYTAsXG4gICAgICAgICAgICAgICAgICBhMSxcbiAgICAgICAgICAgICAgICAgIGEyLFxuICAgICAgICAgICAgICAgICAgYTMsXG4gICAgICAgICAgICAgICAgICBhNCxcbiAgICAgICAgICAgICAgICAgIGE1LFxuICAgICAgICAgICAgICAgICAgYTYsXG4gICAgICAgICAgICAgICAgICBhN1xuICAgICAgICAgICAgICAgIF0pO1xuICB9XG59XG5cbmZ1bmN0aW9uIF84KG8sIGEwLCBhMSwgYTIsIGEzLCBhNCwgYTUsIGE2LCBhNykge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSA4KSB7XG4gICAgcmV0dXJuIG8oYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3KTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gY3VycnlfOChvLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcsIGFyaXR5KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBfXzgobykge1xuICB2YXIgYXJpdHkgPSBvLmxlbmd0aDtcbiAgaWYgKGFyaXR5ID09PSA4KSB7XG4gICAgcmV0dXJuIG87XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIChmdW5jdGlvbiAoYTAsIGExLCBhMiwgYTMsIGE0LCBhNSwgYTYsIGE3KSB7XG4gICAgICAgIHJldHVybiBfOChvLCBhMCwgYTEsIGEyLCBhMywgYTQsIGE1LCBhNiwgYTcpO1xuICAgICAgfSk7XG4gIH1cbn1cblxuZXhwb3J0IHtcbiAgYXBwICxcbiAgY3VycnlfMSAsXG4gIF8xICxcbiAgX18xICxcbiAgY3VycnlfMiAsXG4gIF8yICxcbiAgX18yICxcbiAgY3VycnlfMyAsXG4gIF8zICxcbiAgX18zICxcbiAgY3VycnlfNCAsXG4gIF80ICxcbiAgX180ICxcbiAgY3VycnlfNSAsXG4gIF81ICxcbiAgX181ICxcbiAgY3VycnlfNiAsXG4gIF82ICxcbiAgX182ICxcbiAgY3VycnlfNyAsXG4gIF83ICxcbiAgX183ICxcbiAgY3VycnlfOCAsXG4gIF84ICxcbiAgX184ICxcbiAgXG59XG4vKiBObyBzaWRlIGVmZmVjdCAqL1xuIiwiXG5cblxudmFyIGlkID0gLyogcmVjb3JkICovWy8qIGNvbnRlbnRzICovMF07XG5cbmZ1bmN0aW9uIGNhbWxfc2V0X29vX2lkKGIpIHtcbiAgYlsxXSA9IGlkWzBdO1xuICBpZFswXSArPSAxO1xuICByZXR1cm4gYjtcbn1cblxuZnVuY3Rpb24gY2FtbF9mcmVzaF9vb19pZChwYXJhbSkge1xuICBpZFswXSArPSAxO1xuICByZXR1cm4gaWRbMF07XG59XG5cbmZ1bmN0aW9uIGNyZWF0ZShzdHIpIHtcbiAgdmFyIHZfMDAxID0gY2FtbF9mcmVzaF9vb19pZCgvKiAoKSAqLzApO1xuICB2YXIgdiA9IC8qIHR1cGxlICovW1xuICAgIHN0cixcbiAgICB2XzAwMVxuICBdO1xuICB2LnRhZyA9IDI0ODtcbiAgcmV0dXJuIHY7XG59XG5cbmZ1bmN0aW9uIGNhbWxfaXNfZXh0ZW5zaW9uKGUpIHtcbiAgaWYgKGUgPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiBmYWxzZTtcbiAgfSBlbHNlIGlmIChlLnRhZyA9PT0gMjQ4KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSB7XG4gICAgdmFyIHNsb3QgPSBlWzBdO1xuICAgIGlmIChzbG90ICE9PSB1bmRlZmluZWQpIHtcbiAgICAgIHJldHVybiBzbG90LnRhZyA9PT0gMjQ4O1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICB9XG59XG5cbmV4cG9ydCB7XG4gIGNhbWxfc2V0X29vX2lkICxcbiAgY2FtbF9mcmVzaF9vb19pZCAsXG4gIGNyZWF0ZSAsXG4gIGNhbWxfaXNfZXh0ZW5zaW9uICxcbiAgXG59XG4vKiBObyBzaWRlIGVmZmVjdCAqL1xuIiwiXG5cblxudmFyIHVuZGVmaW5lZEhlYWRlciA9IC8qIGFycmF5ICovW107XG5cbmZ1bmN0aW9uIHNvbWUoeCkge1xuICBpZiAoeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgdmFyIGJsb2NrID0gLyogdHVwbGUgKi9bXG4gICAgICB1bmRlZmluZWRIZWFkZXIsXG4gICAgICAwXG4gICAgXTtcbiAgICBibG9jay50YWcgPSAyNTY7XG4gICAgcmV0dXJuIGJsb2NrO1xuICB9IGVsc2UgaWYgKHggIT09IG51bGwgJiYgeFswXSA9PT0gdW5kZWZpbmVkSGVhZGVyKSB7XG4gICAgdmFyIG5pZCA9IHhbMV0gKyAxIHwgMDtcbiAgICB2YXIgYmxvY2skMSA9IC8qIHR1cGxlICovW1xuICAgICAgdW5kZWZpbmVkSGVhZGVyLFxuICAgICAgbmlkXG4gICAgXTtcbiAgICBibG9jayQxLnRhZyA9IDI1NjtcbiAgICByZXR1cm4gYmxvY2skMTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4geDtcbiAgfVxufVxuXG5mdW5jdGlvbiBudWxsYWJsZV90b19vcHQoeCkge1xuICBpZiAoeCA9PT0gbnVsbCB8fCB4ID09PSB1bmRlZmluZWQpIHtcbiAgICByZXR1cm4gdW5kZWZpbmVkO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBzb21lKHgpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHVuZGVmaW5lZF90b19vcHQoeCkge1xuICBpZiAoeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc29tZSh4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiBudWxsX3RvX29wdCh4KSB7XG4gIGlmICh4ID09PSBudWxsKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gc29tZSh4KTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxGcm9tT3B0aW9uKHgpIHtcbiAgaWYgKHggIT09IG51bGwgJiYgeFswXSA9PT0gdW5kZWZpbmVkSGVhZGVyKSB7XG4gICAgdmFyIGRlcHRoID0geFsxXTtcbiAgICBpZiAoZGVwdGggPT09IDApIHtcbiAgICAgIHJldHVybiB1bmRlZmluZWQ7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiAvKiB0dXBsZSAqL1tcbiAgICAgICAgICAgICAgdW5kZWZpbmVkSGVhZGVyLFxuICAgICAgICAgICAgICBkZXB0aCAtIDEgfCAwXG4gICAgICAgICAgICBdO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4geDtcbiAgfVxufVxuXG5mdW5jdGlvbiBvcHRpb25fZ2V0KHgpIHtcbiAgaWYgKHggPT09IHVuZGVmaW5lZCkge1xuICAgIHJldHVybiB1bmRlZmluZWQ7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHZhbEZyb21PcHRpb24oeCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gb3B0aW9uX2dldF91bndyYXAoeCkge1xuICBpZiAoeCA9PT0gdW5kZWZpbmVkKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdmFsRnJvbU9wdGlvbih4KVsxXTtcbiAgfVxufVxuXG5leHBvcnQge1xuICBudWxsYWJsZV90b19vcHQgLFxuICB1bmRlZmluZWRfdG9fb3B0ICxcbiAgbnVsbF90b19vcHQgLFxuICB2YWxGcm9tT3B0aW9uICxcbiAgc29tZSAsXG4gIG9wdGlvbl9nZXQgLFxuICBvcHRpb25fZ2V0X3Vud3JhcCAsXG4gIFxufVxuLyogTm8gc2lkZSBlZmZlY3QgKi9cbiIsIlxuXG5pbXBvcnQgKiBhcyBDYW1sX29wdGlvbiBmcm9tIFwiLi9jYW1sX29wdGlvbi5qc1wiO1xuaW1wb3J0ICogYXMgQ2FtbF9leGNlcHRpb25zIGZyb20gXCIuL2NhbWxfZXhjZXB0aW9ucy5qc1wiO1xuXG52YXIgJCRFcnJvciA9IENhbWxfZXhjZXB0aW9ucy5jcmVhdGUoXCJDYW1sX2pzX2V4Y2VwdGlvbnMuRXJyb3JcIik7XG5cbmZ1bmN0aW9uIGludGVybmFsVG9PQ2FtbEV4Y2VwdGlvbihlKSB7XG4gIGlmIChDYW1sX2V4Y2VwdGlvbnMuY2FtbF9pc19leHRlbnNpb24oZSkpIHtcbiAgICByZXR1cm4gZTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gW1xuICAgICAgICAgICAgJCRFcnJvcixcbiAgICAgICAgICAgIGVcbiAgICAgICAgICBdO1xuICB9XG59XG5cbmZ1bmN0aW9uIGNhbWxfYXNfanNfZXhuKGV4bikge1xuICBpZiAoZXhuWzBdID09PSAkJEVycm9yKSB7XG4gICAgcmV0dXJuIENhbWxfb3B0aW9uLnNvbWUoZXhuWzFdKTtcbiAgfVxuICBcbn1cblxuZXhwb3J0IHtcbiAgJCRFcnJvciAsXG4gIGludGVybmFsVG9PQ2FtbEV4Y2VwdGlvbiAsXG4gIGNhbWxfYXNfanNfZXhuICxcbiAgXG59XG4vKiBObyBzaWRlIGVmZmVjdCAqL1xuIiwiXG5cbmltcG9ydCAqIGFzIEN1cnJ5IGZyb20gXCIuL2N1cnJ5LmpzXCI7XG5pbXBvcnQgKiBhcyBDYW1sX2FycmF5IGZyb20gXCIuL2NhbWxfYXJyYXkuanNcIjtcbmltcG9ydCAqIGFzIENhbWxfZXhjZXB0aW9ucyBmcm9tIFwiLi9jYW1sX2V4Y2VwdGlvbnMuanNcIjtcbmltcG9ydCAqIGFzIENhbWxfanNfZXhjZXB0aW9ucyBmcm9tIFwiLi9jYW1sX2pzX2V4Y2VwdGlvbnMuanNcIjtcbmltcG9ydCAqIGFzIENhbWxfYnVpbHRpbl9leGNlcHRpb25zIGZyb20gXCIuL2NhbWxfYnVpbHRpbl9leGNlcHRpb25zLmpzXCI7XG5cbmZ1bmN0aW9uIGluaXQobCwgZikge1xuICBpZiAobCA9PT0gMCkge1xuICAgIHJldHVybiAvKiBhcnJheSAqL1tdO1xuICB9IGVsc2UgaWYgKGwgPCAwKSB7XG4gICAgdGhyb3cgW1xuICAgICAgICAgIENhbWxfYnVpbHRpbl9leGNlcHRpb25zLmludmFsaWRfYXJndW1lbnQsXG4gICAgICAgICAgXCJBcnJheS5pbml0XCJcbiAgICAgICAgXTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgcmVzID0gQ2FtbF9hcnJheS5jYW1sX21ha2VfdmVjdChsLCBDdXJyeS5fMShmLCAwKSk7XG4gICAgZm9yKHZhciBpID0gMSAsaV9maW5pc2ggPSBsIC0gMSB8IDA7IGkgPD0gaV9maW5pc2g7ICsraSl7XG4gICAgICByZXNbaV0gPSBDdXJyeS5fMShmLCBpKTtcbiAgICB9XG4gICAgcmV0dXJuIHJlcztcbiAgfVxufVxuXG5mdW5jdGlvbiBtYWtlX21hdHJpeChzeCwgc3ksIGluaXQpIHtcbiAgdmFyIHJlcyA9IENhbWxfYXJyYXkuY2FtbF9tYWtlX3ZlY3Qoc3gsIC8qIGFycmF5ICovW10pO1xuICBmb3IodmFyIHggPSAwICx4X2ZpbmlzaCA9IHN4IC0gMSB8IDA7IHggPD0geF9maW5pc2g7ICsreCl7XG4gICAgcmVzW3hdID0gQ2FtbF9hcnJheS5jYW1sX21ha2VfdmVjdChzeSwgaW5pdCk7XG4gIH1cbiAgcmV0dXJuIHJlcztcbn1cblxuZnVuY3Rpb24gY29weShhKSB7XG4gIHZhciBsID0gYS5sZW5ndGg7XG4gIGlmIChsID09PSAwKSB7XG4gICAgcmV0dXJuIC8qIGFycmF5ICovW107XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIENhbWxfYXJyYXkuY2FtbF9hcnJheV9zdWIoYSwgMCwgbCk7XG4gIH1cbn1cblxuZnVuY3Rpb24gYXBwZW5kKGExLCBhMikge1xuICB2YXIgbDEgPSBhMS5sZW5ndGg7XG4gIGlmIChsMSA9PT0gMCkge1xuICAgIHJldHVybiBjb3B5KGEyKTtcbiAgfSBlbHNlIGlmIChhMi5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm4gQ2FtbF9hcnJheS5jYW1sX2FycmF5X3N1YihhMSwgMCwgbDEpO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBhMS5jb25jYXQoYTIpO1xuICB9XG59XG5cbmZ1bmN0aW9uIHN1YihhLCBvZnMsIGxlbikge1xuICBpZiAobGVuIDwgMCB8fCBvZnMgPiAoYS5sZW5ndGggLSBsZW4gfCAwKSkge1xuICAgIHRocm93IFtcbiAgICAgICAgICBDYW1sX2J1aWx0aW5fZXhjZXB0aW9ucy5pbnZhbGlkX2FyZ3VtZW50LFxuICAgICAgICAgIFwiQXJyYXkuc3ViXCJcbiAgICAgICAgXTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gQ2FtbF9hcnJheS5jYW1sX2FycmF5X3N1YihhLCBvZnMsIGxlbik7XG4gIH1cbn1cblxuZnVuY3Rpb24gZmlsbChhLCBvZnMsIGxlbiwgdikge1xuICBpZiAob2ZzIDwgMCB8fCBsZW4gPCAwIHx8IG9mcyA+IChhLmxlbmd0aCAtIGxlbiB8IDApKSB7XG4gICAgdGhyb3cgW1xuICAgICAgICAgIENhbWxfYnVpbHRpbl9leGNlcHRpb25zLmludmFsaWRfYXJndW1lbnQsXG4gICAgICAgICAgXCJBcnJheS5maWxsXCJcbiAgICAgICAgXTtcbiAgfSBlbHNlIHtcbiAgICBmb3IodmFyIGkgPSBvZnMgLGlfZmluaXNoID0gKG9mcyArIGxlbiB8IDApIC0gMSB8IDA7IGkgPD0gaV9maW5pc2g7ICsraSl7XG4gICAgICBhW2ldID0gdjtcbiAgICB9XG4gICAgcmV0dXJuIC8qICgpICovMDtcbiAgfVxufVxuXG5mdW5jdGlvbiBibGl0KGExLCBvZnMxLCBhMiwgb2ZzMiwgbGVuKSB7XG4gIGlmIChsZW4gPCAwIHx8IG9mczEgPCAwIHx8IG9mczEgPiAoYTEubGVuZ3RoIC0gbGVuIHwgMCkgfHwgb2ZzMiA8IDAgfHwgb2ZzMiA+IChhMi5sZW5ndGggLSBsZW4gfCAwKSkge1xuICAgIHRocm93IFtcbiAgICAgICAgICBDYW1sX2J1aWx0aW5fZXhjZXB0aW9ucy5pbnZhbGlkX2FyZ3VtZW50LFxuICAgICAgICAgIFwiQXJyYXkuYmxpdFwiXG4gICAgICAgIF07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIENhbWxfYXJyYXkuY2FtbF9hcnJheV9ibGl0KGExLCBvZnMxLCBhMiwgb2ZzMiwgbGVuKTtcbiAgfVxufVxuXG5mdW5jdGlvbiBpdGVyKGYsIGEpIHtcbiAgZm9yKHZhciBpID0gMCAsaV9maW5pc2ggPSBhLmxlbmd0aCAtIDEgfCAwOyBpIDw9IGlfZmluaXNoOyArK2kpe1xuICAgIEN1cnJ5Ll8xKGYsIGFbaV0pO1xuICB9XG4gIHJldHVybiAvKiAoKSAqLzA7XG59XG5cbmZ1bmN0aW9uIG1hcChmLCBhKSB7XG4gIHZhciBsID0gYS5sZW5ndGg7XG4gIGlmIChsID09PSAwKSB7XG4gICAgcmV0dXJuIC8qIGFycmF5ICovW107XG4gIH0gZWxzZSB7XG4gICAgdmFyIHIgPSBDYW1sX2FycmF5LmNhbWxfbWFrZV92ZWN0KGwsIEN1cnJ5Ll8xKGYsIGFbMF0pKTtcbiAgICBmb3IodmFyIGkgPSAxICxpX2ZpbmlzaCA9IGwgLSAxIHwgMDsgaSA8PSBpX2ZpbmlzaDsgKytpKXtcbiAgICAgIHJbaV0gPSBDdXJyeS5fMShmLCBhW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cbn1cblxuZnVuY3Rpb24gaXRlcmkoZiwgYSkge1xuICBmb3IodmFyIGkgPSAwICxpX2ZpbmlzaCA9IGEubGVuZ3RoIC0gMSB8IDA7IGkgPD0gaV9maW5pc2g7ICsraSl7XG4gICAgQ3VycnkuXzIoZiwgaSwgYVtpXSk7XG4gIH1cbiAgcmV0dXJuIC8qICgpICovMDtcbn1cblxuZnVuY3Rpb24gbWFwaShmLCBhKSB7XG4gIHZhciBsID0gYS5sZW5ndGg7XG4gIGlmIChsID09PSAwKSB7XG4gICAgcmV0dXJuIC8qIGFycmF5ICovW107XG4gIH0gZWxzZSB7XG4gICAgdmFyIHIgPSBDYW1sX2FycmF5LmNhbWxfbWFrZV92ZWN0KGwsIEN1cnJ5Ll8yKGYsIDAsIGFbMF0pKTtcbiAgICBmb3IodmFyIGkgPSAxICxpX2ZpbmlzaCA9IGwgLSAxIHwgMDsgaSA8PSBpX2ZpbmlzaDsgKytpKXtcbiAgICAgIHJbaV0gPSBDdXJyeS5fMihmLCBpLCBhW2ldKTtcbiAgICB9XG4gICAgcmV0dXJuIHI7XG4gIH1cbn1cblxuZnVuY3Rpb24gdG9fbGlzdChhKSB7XG4gIHZhciBfaSA9IGEubGVuZ3RoIC0gMSB8IDA7XG4gIHZhciBfcmVzID0gLyogW10gKi8wO1xuICB3aGlsZSh0cnVlKSB7XG4gICAgdmFyIHJlcyA9IF9yZXM7XG4gICAgdmFyIGkgPSBfaTtcbiAgICBpZiAoaSA8IDApIHtcbiAgICAgIHJldHVybiByZXM7XG4gICAgfSBlbHNlIHtcbiAgICAgIF9yZXMgPSAvKiA6OiAqL1tcbiAgICAgICAgYVtpXSxcbiAgICAgICAgcmVzXG4gICAgICBdO1xuICAgICAgX2kgPSBpIC0gMSB8IDA7XG4gICAgICBjb250aW51ZSA7XG4gICAgfVxuICB9O1xufVxuXG5mdW5jdGlvbiBsaXN0X2xlbmd0aChfYWNjdSwgX3BhcmFtKSB7XG4gIHdoaWxlKHRydWUpIHtcbiAgICB2YXIgcGFyYW0gPSBfcGFyYW07XG4gICAgdmFyIGFjY3UgPSBfYWNjdTtcbiAgICBpZiAocGFyYW0pIHtcbiAgICAgIF9wYXJhbSA9IHBhcmFtWzFdO1xuICAgICAgX2FjY3UgPSBhY2N1ICsgMSB8IDA7XG4gICAgICBjb250aW51ZSA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBhY2N1O1xuICAgIH1cbiAgfTtcbn1cblxuZnVuY3Rpb24gb2ZfbGlzdChsKSB7XG4gIGlmIChsKSB7XG4gICAgdmFyIGEgPSBDYW1sX2FycmF5LmNhbWxfbWFrZV92ZWN0KGxpc3RfbGVuZ3RoKDAsIGwpLCBsWzBdKTtcbiAgICB2YXIgX2kgPSAxO1xuICAgIHZhciBfcGFyYW0gPSBsWzFdO1xuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgIHZhciBwYXJhbSA9IF9wYXJhbTtcbiAgICAgIHZhciBpID0gX2k7XG4gICAgICBpZiAocGFyYW0pIHtcbiAgICAgICAgYVtpXSA9IHBhcmFtWzBdO1xuICAgICAgICBfcGFyYW0gPSBwYXJhbVsxXTtcbiAgICAgICAgX2kgPSBpICsgMSB8IDA7XG4gICAgICAgIGNvbnRpbnVlIDtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgICAgfVxuICAgIH07XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIC8qIGFycmF5ICovW107XG4gIH1cbn1cblxuZnVuY3Rpb24gZm9sZF9sZWZ0KGYsIHgsIGEpIHtcbiAgdmFyIHIgPSB4O1xuICBmb3IodmFyIGkgPSAwICxpX2ZpbmlzaCA9IGEubGVuZ3RoIC0gMSB8IDA7IGkgPD0gaV9maW5pc2g7ICsraSl7XG4gICAgciA9IEN1cnJ5Ll8yKGYsIHIsIGFbaV0pO1xuICB9XG4gIHJldHVybiByO1xufVxuXG5mdW5jdGlvbiBmb2xkX3JpZ2h0KGYsIGEsIHgpIHtcbiAgdmFyIHIgPSB4O1xuICBmb3IodmFyIGkgPSBhLmxlbmd0aCAtIDEgfCAwOyBpID49IDA7IC0taSl7XG4gICAgciA9IEN1cnJ5Ll8yKGYsIGFbaV0sIHIpO1xuICB9XG4gIHJldHVybiByO1xufVxuXG52YXIgQm90dG9tID0gQ2FtbF9leGNlcHRpb25zLmNyZWF0ZShcIkFycmF5LkJvdHRvbVwiKTtcblxuZnVuY3Rpb24gc29ydChjbXAsIGEpIHtcbiAgdmFyIG1heHNvbiA9IGZ1bmN0aW9uIChsLCBpKSB7XG4gICAgdmFyIGkzMSA9ICgoaSArIGkgfCAwKSArIGkgfCAwKSArIDEgfCAwO1xuICAgIHZhciB4ID0gaTMxO1xuICAgIGlmICgoaTMxICsgMiB8IDApIDwgbCkge1xuICAgICAgaWYgKEN1cnJ5Ll8yKGNtcCwgQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCBpMzEpLCBDYW1sX2FycmF5LmNhbWxfYXJyYXlfZ2V0KGEsIGkzMSArIDEgfCAwKSkgPCAwKSB7XG4gICAgICAgIHggPSBpMzEgKyAxIHwgMDtcbiAgICAgIH1cbiAgICAgIGlmIChDdXJyeS5fMihjbXAsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgeCksIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgaTMxICsgMiB8IDApKSA8IDApIHtcbiAgICAgICAgeCA9IGkzMSArIDIgfCAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIHg7XG4gICAgfSBlbHNlIGlmICgoaTMxICsgMSB8IDApIDwgbCAmJiBDdXJyeS5fMihjbXAsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgaTMxKSwgQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCBpMzEgKyAxIHwgMCkpIDwgMCkge1xuICAgICAgcmV0dXJuIGkzMSArIDEgfCAwO1xuICAgIH0gZWxzZSBpZiAoaTMxIDwgbCkge1xuICAgICAgcmV0dXJuIGkzMTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgW1xuICAgICAgICAgICAgQm90dG9tLFxuICAgICAgICAgICAgaVxuICAgICAgICAgIF07XG4gICAgfVxuICB9O1xuICB2YXIgdHJpY2tsZSA9IGZ1bmN0aW9uIChsLCBpLCBlKSB7XG4gICAgdHJ5IHtcbiAgICAgIHZhciBsJDEgPSBsO1xuICAgICAgdmFyIF9pID0gaTtcbiAgICAgIHZhciBlJDEgPSBlO1xuICAgICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICB2YXIgaSQxID0gX2k7XG4gICAgICAgIHZhciBqID0gbWF4c29uKGwkMSwgaSQxKTtcbiAgICAgICAgaWYgKEN1cnJ5Ll8yKGNtcCwgQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCBqKSwgZSQxKSA+IDApIHtcbiAgICAgICAgICBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc2V0KGEsIGkkMSwgQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCBqKSk7XG4gICAgICAgICAgX2kgPSBqO1xuICAgICAgICAgIGNvbnRpbnVlIDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gQ2FtbF9hcnJheS5jYW1sX2FycmF5X3NldChhLCBpJDEsIGUkMSk7XG4gICAgICAgIH1cbiAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChyYXdfZXhuKXtcbiAgICAgIHZhciBleG4gPSBDYW1sX2pzX2V4Y2VwdGlvbnMuaW50ZXJuYWxUb09DYW1sRXhjZXB0aW9uKHJhd19leG4pO1xuICAgICAgaWYgKGV4blswXSA9PT0gQm90dG9tKSB7XG4gICAgICAgIHJldHVybiBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc2V0KGEsIGV4blsxXSwgZSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBleG47XG4gICAgICB9XG4gICAgfVxuICB9O1xuICB2YXIgYnViYmxlID0gZnVuY3Rpb24gKGwsIGkpIHtcbiAgICB0cnkge1xuICAgICAgdmFyIGwkMSA9IGw7XG4gICAgICB2YXIgX2kgPSBpO1xuICAgICAgd2hpbGUodHJ1ZSkge1xuICAgICAgICB2YXIgaSQxID0gX2k7XG4gICAgICAgIHZhciBqID0gbWF4c29uKGwkMSwgaSQxKTtcbiAgICAgICAgQ2FtbF9hcnJheS5jYW1sX2FycmF5X3NldChhLCBpJDEsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgaikpO1xuICAgICAgICBfaSA9IGo7XG4gICAgICAgIGNvbnRpbnVlIDtcbiAgICAgIH07XG4gICAgfVxuICAgIGNhdGNoIChyYXdfZXhuKXtcbiAgICAgIHZhciBleG4gPSBDYW1sX2pzX2V4Y2VwdGlvbnMuaW50ZXJuYWxUb09DYW1sRXhjZXB0aW9uKHJhd19leG4pO1xuICAgICAgaWYgKGV4blswXSA9PT0gQm90dG9tKSB7XG4gICAgICAgIHJldHVybiBleG5bMV07XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aHJvdyBleG47XG4gICAgICB9XG4gICAgfVxuICB9O1xuICB2YXIgdHJpY2tsZXVwID0gZnVuY3Rpb24gKF9pLCBlKSB7XG4gICAgd2hpbGUodHJ1ZSkge1xuICAgICAgdmFyIGkgPSBfaTtcbiAgICAgIHZhciBmYXRoZXIgPSAoaSAtIDEgfCAwKSAvIDMgfCAwO1xuICAgICAgaWYgKGkgPT09IGZhdGhlcikge1xuICAgICAgICB0aHJvdyBbXG4gICAgICAgICAgICAgIENhbWxfYnVpbHRpbl9leGNlcHRpb25zLmFzc2VydF9mYWlsdXJlLFxuICAgICAgICAgICAgICAvKiB0dXBsZSAqL1tcbiAgICAgICAgICAgICAgICBcImFycmF5Lm1sXCIsXG4gICAgICAgICAgICAgICAgMTczLFxuICAgICAgICAgICAgICAgIDRcbiAgICAgICAgICAgICAgXVxuICAgICAgICAgICAgXTtcbiAgICAgIH1cbiAgICAgIGlmIChDdXJyeS5fMihjbXAsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgZmF0aGVyKSwgZSkgPCAwKSB7XG4gICAgICAgIENhbWxfYXJyYXkuY2FtbF9hcnJheV9zZXQoYSwgaSwgQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCBmYXRoZXIpKTtcbiAgICAgICAgaWYgKGZhdGhlciA+IDApIHtcbiAgICAgICAgICBfaSA9IGZhdGhlcjtcbiAgICAgICAgICBjb250aW51ZSA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIENhbWxfYXJyYXkuY2FtbF9hcnJheV9zZXQoYSwgMCwgZSk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc2V0KGEsIGksIGUpO1xuICAgICAgfVxuICAgIH07XG4gIH07XG4gIHZhciBsID0gYS5sZW5ndGg7XG4gIGZvcih2YXIgaSA9ICgobCArIDEgfCAwKSAvIDMgfCAwKSAtIDEgfCAwOyBpID49IDA7IC0taSl7XG4gICAgdHJpY2tsZShsLCBpLCBDYW1sX2FycmF5LmNhbWxfYXJyYXlfZ2V0KGEsIGkpKTtcbiAgfVxuICBmb3IodmFyIGkkMSA9IGwgLSAxIHwgMDsgaSQxID49IDI7IC0taSQxKXtcbiAgICB2YXIgZSA9IENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgaSQxKTtcbiAgICBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc2V0KGEsIGkkMSwgQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCAwKSk7XG4gICAgdHJpY2tsZXVwKGJ1YmJsZShpJDEsIDApLCBlKTtcbiAgfVxuICBpZiAobCA+IDEpIHtcbiAgICB2YXIgZSQxID0gQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCAxKTtcbiAgICBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc2V0KGEsIDEsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgMCkpO1xuICAgIHJldHVybiBDYW1sX2FycmF5LmNhbWxfYXJyYXlfc2V0KGEsIDAsIGUkMSk7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIDA7XG4gIH1cbn1cblxuZnVuY3Rpb24gc3RhYmxlX3NvcnQoY21wLCBhKSB7XG4gIHZhciBtZXJnZSA9IGZ1bmN0aW9uIChzcmMxb2ZzLCBzcmMxbGVuLCBzcmMyLCBzcmMyb2ZzLCBzcmMybGVuLCBkc3QsIGRzdG9mcykge1xuICAgIHZhciBzcmMxciA9IHNyYzFvZnMgKyBzcmMxbGVuIHwgMDtcbiAgICB2YXIgc3JjMnIgPSBzcmMyb2ZzICsgc3JjMmxlbiB8IDA7XG4gICAgdmFyIF9pMSA9IHNyYzFvZnM7XG4gICAgdmFyIF9zMSA9IENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgc3JjMW9mcyk7XG4gICAgdmFyIF9pMiA9IHNyYzJvZnM7XG4gICAgdmFyIF9zMiA9IENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoc3JjMiwgc3JjMm9mcyk7XG4gICAgdmFyIF9kID0gZHN0b2ZzO1xuICAgIHdoaWxlKHRydWUpIHtcbiAgICAgIHZhciBkID0gX2Q7XG4gICAgICB2YXIgczIgPSBfczI7XG4gICAgICB2YXIgaTIgPSBfaTI7XG4gICAgICB2YXIgczEgPSBfczE7XG4gICAgICB2YXIgaTEgPSBfaTE7XG4gICAgICBpZiAoQ3VycnkuXzIoY21wLCBzMSwgczIpIDw9IDApIHtcbiAgICAgICAgQ2FtbF9hcnJheS5jYW1sX2FycmF5X3NldChkc3QsIGQsIHMxKTtcbiAgICAgICAgdmFyIGkxJDEgPSBpMSArIDEgfCAwO1xuICAgICAgICBpZiAoaTEkMSA8IHNyYzFyKSB7XG4gICAgICAgICAgX2QgPSBkICsgMSB8IDA7XG4gICAgICAgICAgX3MxID0gQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChhLCBpMSQxKTtcbiAgICAgICAgICBfaTEgPSBpMSQxO1xuICAgICAgICAgIGNvbnRpbnVlIDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYmxpdChzcmMyLCBpMiwgZHN0LCBkICsgMSB8IDAsIHNyYzJyIC0gaTIgfCAwKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgQ2FtbF9hcnJheS5jYW1sX2FycmF5X3NldChkc3QsIGQsIHMyKTtcbiAgICAgICAgdmFyIGkyJDEgPSBpMiArIDEgfCAwO1xuICAgICAgICBpZiAoaTIkMSA8IHNyYzJyKSB7XG4gICAgICAgICAgX2QgPSBkICsgMSB8IDA7XG4gICAgICAgICAgX3MyID0gQ2FtbF9hcnJheS5jYW1sX2FycmF5X2dldChzcmMyLCBpMiQxKTtcbiAgICAgICAgICBfaTIgPSBpMiQxO1xuICAgICAgICAgIGNvbnRpbnVlIDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICByZXR1cm4gYmxpdChhLCBpMSwgZHN0LCBkICsgMSB8IDAsIHNyYzFyIC0gaTEgfCAwKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH07XG4gIH07XG4gIHZhciBpc29ydHRvID0gZnVuY3Rpb24gKHNyY29mcywgZHN0LCBkc3RvZnMsIGxlbikge1xuICAgIGZvcih2YXIgaSA9IDAgLGlfZmluaXNoID0gbGVuIC0gMSB8IDA7IGkgPD0gaV9maW5pc2g7ICsraSl7XG4gICAgICB2YXIgZSA9IENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgc3Jjb2ZzICsgaSB8IDApO1xuICAgICAgdmFyIGogPSAoZHN0b2ZzICsgaSB8IDApIC0gMSB8IDA7XG4gICAgICB3aGlsZShqID49IGRzdG9mcyAmJiBDdXJyeS5fMihjbXAsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoZHN0LCBqKSwgZSkgPiAwKSB7XG4gICAgICAgIENhbWxfYXJyYXkuY2FtbF9hcnJheV9zZXQoZHN0LCBqICsgMSB8IDAsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoZHN0LCBqKSk7XG4gICAgICAgIGogPSBqIC0gMSB8IDA7XG4gICAgICB9O1xuICAgICAgQ2FtbF9hcnJheS5jYW1sX2FycmF5X3NldChkc3QsIGogKyAxIHwgMCwgZSk7XG4gICAgfVxuICAgIHJldHVybiAvKiAoKSAqLzA7XG4gIH07XG4gIHZhciBzb3J0dG8gPSBmdW5jdGlvbiAoc3Jjb2ZzLCBkc3QsIGRzdG9mcywgbGVuKSB7XG4gICAgaWYgKGxlbiA8PSA1KSB7XG4gICAgICByZXR1cm4gaXNvcnR0byhzcmNvZnMsIGRzdCwgZHN0b2ZzLCBsZW4pO1xuICAgIH0gZWxzZSB7XG4gICAgICB2YXIgbDEgPSBsZW4gLyAyIHwgMDtcbiAgICAgIHZhciBsMiA9IGxlbiAtIGwxIHwgMDtcbiAgICAgIHNvcnR0byhzcmNvZnMgKyBsMSB8IDAsIGRzdCwgZHN0b2ZzICsgbDEgfCAwLCBsMik7XG4gICAgICBzb3J0dG8oc3Jjb2ZzLCBhLCBzcmNvZnMgKyBsMiB8IDAsIGwxKTtcbiAgICAgIHJldHVybiBtZXJnZShzcmNvZnMgKyBsMiB8IDAsIGwxLCBkc3QsIGRzdG9mcyArIGwxIHwgMCwgbDIsIGRzdCwgZHN0b2ZzKTtcbiAgICB9XG4gIH07XG4gIHZhciBsID0gYS5sZW5ndGg7XG4gIGlmIChsIDw9IDUpIHtcbiAgICByZXR1cm4gaXNvcnR0bygwLCBhLCAwLCBsKTtcbiAgfSBlbHNlIHtcbiAgICB2YXIgbDEgPSBsIC8gMiB8IDA7XG4gICAgdmFyIGwyID0gbCAtIGwxIHwgMDtcbiAgICB2YXIgdCA9IENhbWxfYXJyYXkuY2FtbF9tYWtlX3ZlY3QobDIsIENhbWxfYXJyYXkuY2FtbF9hcnJheV9nZXQoYSwgMCkpO1xuICAgIHNvcnR0byhsMSwgdCwgMCwgbDIpO1xuICAgIHNvcnR0bygwLCBhLCBsMiwgbDEpO1xuICAgIHJldHVybiBtZXJnZShsMiwgbDEsIHQsIDAsIGwyLCBhLCAwKTtcbiAgfVxufVxuXG52YXIgY3JlYXRlX21hdHJpeCA9IG1ha2VfbWF0cml4O1xuXG52YXIgY29uY2F0ID0gQ2FtbF9hcnJheS5jYW1sX2FycmF5X2NvbmNhdDtcblxudmFyIGZhc3Rfc29ydCA9IHN0YWJsZV9zb3J0O1xuXG5leHBvcnQge1xuICBpbml0ICxcbiAgbWFrZV9tYXRyaXggLFxuICBjcmVhdGVfbWF0cml4ICxcbiAgYXBwZW5kICxcbiAgY29uY2F0ICxcbiAgc3ViICxcbiAgY29weSAsXG4gIGZpbGwgLFxuICBibGl0ICxcbiAgdG9fbGlzdCAsXG4gIG9mX2xpc3QgLFxuICBpdGVyICxcbiAgbWFwICxcbiAgaXRlcmkgLFxuICBtYXBpICxcbiAgZm9sZF9sZWZ0ICxcbiAgZm9sZF9yaWdodCAsXG4gIHNvcnQgLFxuICBzdGFibGVfc29ydCAsXG4gIGZhc3Rfc29ydCAsXG4gIFxufVxuLyogTm8gc2lkZSBlZmZlY3QgKi9cbiIsImNsYXNzIEJpdE1hdHJpeCB7XG4gICAgc3RhdGljIGNyZWF0ZUVtcHR5KHdpZHRoLCBoZWlnaHQpIHtcbiAgICAgICAgcmV0dXJuIG5ldyBCaXRNYXRyaXgobmV3IFVpbnQ4Q2xhbXBlZEFycmF5KHdpZHRoICogaGVpZ2h0KSwgd2lkdGgpO1xuICAgIH1cbiAgICBjb25zdHJ1Y3RvcihkYXRhLCB3aWR0aCkge1xuICAgICAgICB0aGlzLndpZHRoID0gd2lkdGg7XG4gICAgICAgIHRoaXMuaGVpZ2h0ID0gZGF0YS5sZW5ndGggLyB3aWR0aDtcbiAgICAgICAgdGhpcy5kYXRhID0gZGF0YTtcbiAgICB9XG4gICAgZ2V0KHgsIHkpIHtcbiAgICAgICAgaWYgKHggPCAwIHx8IHggPj0gdGhpcy53aWR0aCB8fCB5IDwgMCB8fCB5ID49IHRoaXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuICEhdGhpcy5kYXRhW3kgKiB0aGlzLndpZHRoICsgeF07XG4gICAgfVxuICAgIHNldCh4LCB5LCB2KSB7XG4gICAgICAgIHRoaXMuZGF0YVt5ICogdGhpcy53aWR0aCArIHhdID0gdiA/IDEgOiAwO1xuICAgIH1cbiAgICBzZXRSZWdpb24obGVmdCwgdG9wLCB3aWR0aCwgaGVpZ2h0LCB2KSB7XG4gICAgICAgIGZvciAobGV0IHkgPSB0b3A7IHkgPCB0b3AgKyBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IGxlZnQ7IHggPCBsZWZ0ICsgd2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIHRoaXMuc2V0KHgsIHksICEhdik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG59XG5cbmNvbnN0IFJFR0lPTl9TSVpFID0gODtcbmNvbnN0IE1JTl9EWU5BTUlDX1JBTkdFID0gMjQ7XG5mdW5jdGlvbiBudW1CZXR3ZWVuKHZhbHVlLCBtaW4sIG1heCkge1xuICAgIHJldHVybiB2YWx1ZSA8IG1pbiA/IG1pbiA6IHZhbHVlID4gbWF4ID8gbWF4IDogdmFsdWU7XG59XG4vLyBMaWtlIEJpdE1hdHJpeCBidXQgYWNjZXB0cyBhcmJpdHJ5IFVpbnQ4IHZhbHVlc1xuY2xhc3MgTWF0cml4IHtcbiAgICBjb25zdHJ1Y3Rvcih3aWR0aCwgaGVpZ2h0LCBidWZmZXIpIHtcbiAgICAgICAgdGhpcy53aWR0aCA9IHdpZHRoO1xuICAgICAgICBjb25zdCBidWZmZXJTaXplID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgICAgIGlmIChidWZmZXIgJiYgYnVmZmVyLmxlbmd0aCAhPT0gYnVmZmVyU2l6ZSkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiV3JvbmcgYnVmZmVyIHNpemVcIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5kYXRhID0gYnVmZmVyIHx8IG5ldyBVaW50OENsYW1wZWRBcnJheShidWZmZXJTaXplKTtcbiAgICB9XG4gICAgZ2V0KHgsIHkpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZGF0YVt5ICogdGhpcy53aWR0aCArIHhdO1xuICAgIH1cbiAgICBzZXQoeCwgeSwgdmFsdWUpIHtcbiAgICAgICAgdGhpcy5kYXRhW3kgKiB0aGlzLndpZHRoICsgeF0gPSB2YWx1ZTtcbiAgICB9XG59XG5mdW5jdGlvbiBiaW5hcml6ZShkYXRhLCB3aWR0aCwgaGVpZ2h0LCByZXR1cm5JbnZlcnRlZCwgZ3JleXNjYWxlV2VpZ2h0cywgY2FuT3ZlcndyaXRlSW1hZ2UpIHtcbiAgICBjb25zdCBwaXhlbENvdW50ID0gd2lkdGggKiBoZWlnaHQ7XG4gICAgaWYgKGRhdGEubGVuZ3RoICE9PSBwaXhlbENvdW50ICogNCkge1xuICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJNYWxmb3JtZWQgZGF0YSBwYXNzZWQgdG8gYmluYXJpemVyLlwiKTtcbiAgICB9XG4gICAgLy8gYXNzaWduIHRoZSBncmV5c2NhbGUgYW5kIGJpbmFyeSBpbWFnZSB3aXRoaW4gdGhlIHJnYmEgYnVmZmVyIGFzIHRoZSByZ2JhIGltYWdlIHdpbGwgbm90IGJlIG5lZWRlZCBhZnRlciBjb252ZXJzaW9uXG4gICAgbGV0IGJ1ZmZlck9mZnNldCA9IDA7XG4gICAgLy8gQ29udmVydCBpbWFnZSB0byBncmV5c2NhbGVcbiAgICBsZXQgZ3JleXNjYWxlQnVmZmVyO1xuICAgIGlmIChjYW5PdmVyd3JpdGVJbWFnZSkge1xuICAgICAgICBncmV5c2NhbGVCdWZmZXIgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoZGF0YS5idWZmZXIsIGJ1ZmZlck9mZnNldCwgcGl4ZWxDb3VudCk7XG4gICAgICAgIGJ1ZmZlck9mZnNldCArPSBwaXhlbENvdW50O1xuICAgIH1cbiAgICBjb25zdCBncmV5c2NhbGVQaXhlbHMgPSBuZXcgTWF0cml4KHdpZHRoLCBoZWlnaHQsIGdyZXlzY2FsZUJ1ZmZlcik7XG4gICAgaWYgKGdyZXlzY2FsZVdlaWdodHMudXNlSW50ZWdlckFwcHJveGltYXRpb24pIHtcbiAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBoZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCB3aWR0aDsgeCsrKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgcGl4ZWxQb3NpdGlvbiA9ICh5ICogd2lkdGggKyB4KSAqIDQ7XG4gICAgICAgICAgICAgICAgY29uc3QgciA9IGRhdGFbcGl4ZWxQb3NpdGlvbl07XG4gICAgICAgICAgICAgICAgY29uc3QgZyA9IGRhdGFbcGl4ZWxQb3NpdGlvbiArIDFdO1xuICAgICAgICAgICAgICAgIGNvbnN0IGIgPSBkYXRhW3BpeGVsUG9zaXRpb24gKyAyXTtcbiAgICAgICAgICAgICAgICBncmV5c2NhbGVQaXhlbHMuc2V0KHgsIHksIFxuICAgICAgICAgICAgICAgIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZSBuby1iaXR3aXNlXG4gICAgICAgICAgICAgICAgKGdyZXlzY2FsZVdlaWdodHMucmVkICogciArIGdyZXlzY2FsZVdlaWdodHMuZ3JlZW4gKiBnICsgZ3JleXNjYWxlV2VpZ2h0cy5ibHVlICogYiArIDEyOCkgPj4gOCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZvciAobGV0IHkgPSAwOyB5IDwgaGVpZ2h0OyB5KyspIHtcbiAgICAgICAgICAgIGZvciAobGV0IHggPSAwOyB4IDwgd2lkdGg7IHgrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsUG9zaXRpb24gPSAoeSAqIHdpZHRoICsgeCkgKiA0O1xuICAgICAgICAgICAgICAgIGNvbnN0IHIgPSBkYXRhW3BpeGVsUG9zaXRpb25dO1xuICAgICAgICAgICAgICAgIGNvbnN0IGcgPSBkYXRhW3BpeGVsUG9zaXRpb24gKyAxXTtcbiAgICAgICAgICAgICAgICBjb25zdCBiID0gZGF0YVtwaXhlbFBvc2l0aW9uICsgMl07XG4gICAgICAgICAgICAgICAgZ3JleXNjYWxlUGl4ZWxzLnNldCh4LCB5LCBncmV5c2NhbGVXZWlnaHRzLnJlZCAqIHIgKyBncmV5c2NhbGVXZWlnaHRzLmdyZWVuICogZyArIGdyZXlzY2FsZVdlaWdodHMuYmx1ZSAqIGIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGhvcml6b250YWxSZWdpb25Db3VudCA9IE1hdGguY2VpbCh3aWR0aCAvIFJFR0lPTl9TSVpFKTtcbiAgICBjb25zdCB2ZXJ0aWNhbFJlZ2lvbkNvdW50ID0gTWF0aC5jZWlsKGhlaWdodCAvIFJFR0lPTl9TSVpFKTtcbiAgICBjb25zdCBibGFja1BvaW50c0NvdW50ID0gaG9yaXpvbnRhbFJlZ2lvbkNvdW50ICogdmVydGljYWxSZWdpb25Db3VudDtcbiAgICBsZXQgYmxhY2tQb2ludHNCdWZmZXI7XG4gICAgaWYgKGNhbk92ZXJ3cml0ZUltYWdlKSB7XG4gICAgICAgIGJsYWNrUG9pbnRzQnVmZmVyID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGRhdGEuYnVmZmVyLCBidWZmZXJPZmZzZXQsIGJsYWNrUG9pbnRzQ291bnQpO1xuICAgICAgICBidWZmZXJPZmZzZXQgKz0gYmxhY2tQb2ludHNDb3VudDtcbiAgICB9XG4gICAgY29uc3QgYmxhY2tQb2ludHMgPSBuZXcgTWF0cml4KGhvcml6b250YWxSZWdpb25Db3VudCwgdmVydGljYWxSZWdpb25Db3VudCwgYmxhY2tQb2ludHNCdWZmZXIpO1xuICAgIGZvciAobGV0IHZlcnRpY2FsUmVnaW9uID0gMDsgdmVydGljYWxSZWdpb24gPCB2ZXJ0aWNhbFJlZ2lvbkNvdW50OyB2ZXJ0aWNhbFJlZ2lvbisrKSB7XG4gICAgICAgIGZvciAobGV0IGhvcnRpem9udGFsUmVnaW9uID0gMDsgaG9ydGl6b250YWxSZWdpb24gPCBob3Jpem9udGFsUmVnaW9uQ291bnQ7IGhvcnRpem9udGFsUmVnaW9uKyspIHtcbiAgICAgICAgICAgIGxldCBtaW4gPSBJbmZpbml0eTtcbiAgICAgICAgICAgIGxldCBtYXggPSAwO1xuICAgICAgICAgICAgZm9yIChsZXQgeSA9IDA7IHkgPCBSRUdJT05fU0laRTsgeSsrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBSRUdJT05fU0laRTsgeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHBpeGVsTHVtb3NpdHkgPSBncmV5c2NhbGVQaXhlbHMuZ2V0KGhvcnRpem9udGFsUmVnaW9uICogUkVHSU9OX1NJWkUgKyB4LCB2ZXJ0aWNhbFJlZ2lvbiAqIFJFR0lPTl9TSVpFICsgeSk7XG4gICAgICAgICAgICAgICAgICAgIG1pbiA9IE1hdGgubWluKG1pbiwgcGl4ZWxMdW1vc2l0eSk7XG4gICAgICAgICAgICAgICAgICAgIG1heCA9IE1hdGgubWF4KG1heCwgcGl4ZWxMdW1vc2l0eSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgLy8gV2UgY291bGQgYWxzbyBjb21wdXRlIHRoZSByZWFsIGF2ZXJhZ2Ugb2YgYWxsIHBpeGVscyBidXQgZm9sbG93aW5nIHRoZSBhc3N1bXB0aW9uIHRoYXQgdGhlIHFyIGNvZGUgY29uc2lzdHNcbiAgICAgICAgICAgIC8vIG9mIGJyaWdodCBhbmQgZGFyayBwaXhlbHMgYW5kIGVzc2VudGlhbGx5IG5vdCBtdWNoIGluIGJldHdlZW4sIGJ5IChtaW4gKyBtYXgpLzIgd2UgbWFrZSB0aGUgY3V0IHJlYWxseSBiZXR3ZWVuXG4gICAgICAgICAgICAvLyB0aG9zZSB0d28gY2xhc3Nlcy4gSWYgdXNpbmcgdGhlIGF2ZXJhZ2Ugb3ZlciBhbGwgcGl4ZWwgaW4gYSBibG9jayBvZiBtb3N0bHkgYnJpZ2h0IHBpeGVscyBhbmQgZmV3IGRhcmsgcGl4ZWxzLFxuICAgICAgICAgICAgLy8gdGhlIGF2ZyB3b3VsZCB0ZW5kIHRvIHRoZSBicmlnaHQgc2lkZSBhbmQgZGFya2VyIGJyaWdodCBwaXhlbHMgY291bGQgYmUgaW50ZXJwcmV0ZWQgYXMgZGFyay5cbiAgICAgICAgICAgIGxldCBhdmVyYWdlID0gKG1pbiArIG1heCkgLyAyO1xuICAgICAgICAgICAgLy8gU21hbGwgYmlhcyB0b3dhcmRzIGJsYWNrIGJ5IG1vdmluZyB0aGUgdGhyZXNob2xkIHVwLiBXZSBkbyB0aGlzLCBhcyBpbiB0aGUgZmluZGVyIHBhdHRlcm5zIHdoaXRlIGhvbGVzIHRlbmRcbiAgICAgICAgICAgIC8vIHRvIGFwcGVhciB3aGljaCBtYWtlcyB0aGVtIHVuZGV0ZWN0YWJsZS5cbiAgICAgICAgICAgIGNvbnN0IGJsYWNrQmlhcyA9IDEuMTtcbiAgICAgICAgICAgIGF2ZXJhZ2UgPSBNYXRoLm1pbigyNTUsIGF2ZXJhZ2UgKiBibGFja0JpYXMpO1xuICAgICAgICAgICAgaWYgKG1heCAtIG1pbiA8PSBNSU5fRFlOQU1JQ19SQU5HRSkge1xuICAgICAgICAgICAgICAgIC8vIElmIHZhcmlhdGlvbiB3aXRoaW4gdGhlIGJsb2NrIGlzIGxvdywgYXNzdW1lIHRoaXMgaXMgYSBibG9jayB3aXRoIG9ubHkgbGlnaHQgb3Igb25seVxuICAgICAgICAgICAgICAgIC8vIGRhcmsgcGl4ZWxzLiBJbiB0aGF0IGNhc2Ugd2UgZG8gbm90IHdhbnQgdG8gdXNlIHRoZSBhdmVyYWdlLCBhcyBpdCB3b3VsZCBkaXZpZGUgdGhpc1xuICAgICAgICAgICAgICAgIC8vIGxvdyBjb250cmFzdCBhcmVhIGludG8gYmxhY2sgYW5kIHdoaXRlIHBpeGVscywgZXNzZW50aWFsbHkgY3JlYXRpbmcgZGF0YSBvdXQgb2Ygbm9pc2UuXG4gICAgICAgICAgICAgICAgLy9cbiAgICAgICAgICAgICAgICAvLyBEZWZhdWx0IHRoZSBibGFja3BvaW50IGZvciB0aGVzZSBibG9ja3MgdG8gYmUgaGFsZiB0aGUgbWluIC0gZWZmZWN0aXZlbHkgd2hpdGUgdGhlbSBvdXRcbiAgICAgICAgICAgICAgICBhdmVyYWdlID0gbWluIC8gMjtcbiAgICAgICAgICAgICAgICBpZiAodmVydGljYWxSZWdpb24gPiAwICYmIGhvcnRpem9udGFsUmVnaW9uID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAvLyBDb3JyZWN0IHRoZSBcIndoaXRlIGJhY2tncm91bmRcIiBhc3N1bXB0aW9uIGZvciBibG9ja3MgdGhhdCBoYXZlIG5laWdoYm9ycyBieSBjb21wYXJpbmdcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIHBpeGVscyBpbiB0aGlzIGJsb2NrIHRvIHRoZSBwcmV2aW91c2x5IGNhbGN1bGF0ZWQgYmxhY2sgcG9pbnRzLiBUaGlzIGlzIGJhc2VkIG9uXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoZSBmYWN0IHRoYXQgZGFyayBiYXJjb2RlIHN5bWJvbG9neSBpcyBhbHdheXMgc3Vycm91bmRlZCBieSBzb21lIGFtb3VudCBvZiBsaWdodFxuICAgICAgICAgICAgICAgICAgICAvLyBiYWNrZ3JvdW5kIGZvciB3aGljaCByZWFzb25hYmxlIGJsYWNrIHBvaW50IGVzdGltYXRlcyB3ZXJlIG1hZGUuIFRoZSBicCBlc3RpbWF0ZWQgYXRcbiAgICAgICAgICAgICAgICAgICAgLy8gdGhlIGJvdW5kYXJpZXMgaXMgdXNlZCBmb3IgdGhlIGludGVyaW9yLlxuICAgICAgICAgICAgICAgICAgICAvLyBUaGUgKG1pbiA8IGJwKSBpcyBhcmJpdHJhcnkgYnV0IHdvcmtzIGJldHRlciB0aGFuIG90aGVyIGhldXJpc3RpY3MgdGhhdCB3ZXJlIHRyaWVkLlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBhdmVyYWdlTmVpZ2hib3JCbGFja1BvaW50ID0gKGJsYWNrUG9pbnRzLmdldChob3J0aXpvbnRhbFJlZ2lvbiwgdmVydGljYWxSZWdpb24gLSAxKSArXG4gICAgICAgICAgICAgICAgICAgICAgICAoMiAqIGJsYWNrUG9pbnRzLmdldChob3J0aXpvbnRhbFJlZ2lvbiAtIDEsIHZlcnRpY2FsUmVnaW9uKSkgK1xuICAgICAgICAgICAgICAgICAgICAgICAgYmxhY2tQb2ludHMuZ2V0KGhvcnRpem9udGFsUmVnaW9uIC0gMSwgdmVydGljYWxSZWdpb24gLSAxKSkgLyA0O1xuICAgICAgICAgICAgICAgICAgICBpZiAobWluIDwgYXZlcmFnZU5laWdoYm9yQmxhY2tQb2ludCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXZlcmFnZSA9IGF2ZXJhZ2VOZWlnaGJvckJsYWNrUG9pbnQ7IC8vIG5vIG5lZWQgdG8gYXBwbHkgYmxhY2sgYmlhcyBhcyBhbHJlYWR5IGFwcGxpZWQgdG8gbmVpZ2hib3JzXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBibGFja1BvaW50cy5zZXQoaG9ydGl6b250YWxSZWdpb24sIHZlcnRpY2FsUmVnaW9uLCBhdmVyYWdlKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBsZXQgYmluYXJpemVkO1xuICAgIGlmIChjYW5PdmVyd3JpdGVJbWFnZSkge1xuICAgICAgICBjb25zdCBiaW5hcml6ZWRCdWZmZXIgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoZGF0YS5idWZmZXIsIGJ1ZmZlck9mZnNldCwgcGl4ZWxDb3VudCk7XG4gICAgICAgIGJ1ZmZlck9mZnNldCArPSBwaXhlbENvdW50O1xuICAgICAgICBiaW5hcml6ZWQgPSBuZXcgQml0TWF0cml4KGJpbmFyaXplZEJ1ZmZlciwgd2lkdGgpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgYmluYXJpemVkID0gQml0TWF0cml4LmNyZWF0ZUVtcHR5KHdpZHRoLCBoZWlnaHQpO1xuICAgIH1cbiAgICBsZXQgaW52ZXJ0ZWQgPSBudWxsO1xuICAgIGlmIChyZXR1cm5JbnZlcnRlZCkge1xuICAgICAgICBpZiAoY2FuT3ZlcndyaXRlSW1hZ2UpIHtcbiAgICAgICAgICAgIGNvbnN0IGludmVydGVkQnVmZmVyID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGRhdGEuYnVmZmVyLCBidWZmZXJPZmZzZXQsIHBpeGVsQ291bnQpO1xuICAgICAgICAgICAgaW52ZXJ0ZWQgPSBuZXcgQml0TWF0cml4KGludmVydGVkQnVmZmVyLCB3aWR0aCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICBpbnZlcnRlZCA9IEJpdE1hdHJpeC5jcmVhdGVFbXB0eSh3aWR0aCwgaGVpZ2h0KTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBmb3IgKGxldCB2ZXJ0aWNhbFJlZ2lvbiA9IDA7IHZlcnRpY2FsUmVnaW9uIDwgdmVydGljYWxSZWdpb25Db3VudDsgdmVydGljYWxSZWdpb24rKykge1xuICAgICAgICBmb3IgKGxldCBob3J0aXpvbnRhbFJlZ2lvbiA9IDA7IGhvcnRpem9udGFsUmVnaW9uIDwgaG9yaXpvbnRhbFJlZ2lvbkNvdW50OyBob3J0aXpvbnRhbFJlZ2lvbisrKSB7XG4gICAgICAgICAgICBjb25zdCBsZWZ0ID0gbnVtQmV0d2Vlbihob3J0aXpvbnRhbFJlZ2lvbiwgMiwgaG9yaXpvbnRhbFJlZ2lvbkNvdW50IC0gMyk7XG4gICAgICAgICAgICBjb25zdCB0b3AgPSBudW1CZXR3ZWVuKHZlcnRpY2FsUmVnaW9uLCAyLCB2ZXJ0aWNhbFJlZ2lvbkNvdW50IC0gMyk7XG4gICAgICAgICAgICBsZXQgc3VtID0gMDtcbiAgICAgICAgICAgIGZvciAobGV0IHhSZWdpb24gPSAtMjsgeFJlZ2lvbiA8PSAyOyB4UmVnaW9uKyspIHtcbiAgICAgICAgICAgICAgICBmb3IgKGxldCB5UmVnaW9uID0gLTI7IHlSZWdpb24gPD0gMjsgeVJlZ2lvbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIHN1bSArPSBibGFja1BvaW50cy5nZXQobGVmdCArIHhSZWdpb24sIHRvcCArIHlSZWdpb24pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGNvbnN0IHRocmVzaG9sZCA9IHN1bSAvIDI1O1xuICAgICAgICAgICAgZm9yIChsZXQgeFJlZ2lvbiA9IDA7IHhSZWdpb24gPCBSRUdJT05fU0laRTsgeFJlZ2lvbisrKSB7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgeVJlZ2lvbiA9IDA7IHlSZWdpb24gPCBSRUdJT05fU0laRTsgeVJlZ2lvbisrKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IHggPSBob3J0aXpvbnRhbFJlZ2lvbiAqIFJFR0lPTl9TSVpFICsgeFJlZ2lvbjtcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgeSA9IHZlcnRpY2FsUmVnaW9uICogUkVHSU9OX1NJWkUgKyB5UmVnaW9uO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsdW0gPSBncmV5c2NhbGVQaXhlbHMuZ2V0KHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBiaW5hcml6ZWQuc2V0KHgsIHksIGx1bSA8PSB0aHJlc2hvbGQpO1xuICAgICAgICAgICAgICAgICAgICBpZiAocmV0dXJuSW52ZXJ0ZWQpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGludmVydGVkLnNldCh4LCB5LCAhKGx1bSA8PSB0aHJlc2hvbGQpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAocmV0dXJuSW52ZXJ0ZWQpIHtcbiAgICAgICAgcmV0dXJuIHsgYmluYXJpemVkLCBpbnZlcnRlZCB9O1xuICAgIH1cbiAgICByZXR1cm4geyBiaW5hcml6ZWQgfTtcbn1cblxuLy8gdHNsaW50OmRpc2FibGU6bm8tYml0d2lzZVxuY2xhc3MgQml0U3RyZWFtIHtcbiAgICBjb25zdHJ1Y3RvcihieXRlcykge1xuICAgICAgICB0aGlzLmJ5dGVPZmZzZXQgPSAwO1xuICAgICAgICB0aGlzLmJpdE9mZnNldCA9IDA7XG4gICAgICAgIHRoaXMuYnl0ZXMgPSBieXRlcztcbiAgICB9XG4gICAgcmVhZEJpdHMobnVtQml0cykge1xuICAgICAgICBpZiAobnVtQml0cyA8IDEgfHwgbnVtQml0cyA+IDMyIHx8IG51bUJpdHMgPiB0aGlzLmF2YWlsYWJsZSgpKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJDYW5ub3QgcmVhZCBcIiArIG51bUJpdHMudG9TdHJpbmcoKSArIFwiIGJpdHNcIik7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgICAgIC8vIEZpcnN0LCByZWFkIHJlbWFpbmRlciBmcm9tIGN1cnJlbnQgYnl0ZVxuICAgICAgICBpZiAodGhpcy5iaXRPZmZzZXQgPiAwKSB7XG4gICAgICAgICAgICBjb25zdCBiaXRzTGVmdCA9IDggLSB0aGlzLmJpdE9mZnNldDtcbiAgICAgICAgICAgIGNvbnN0IHRvUmVhZCA9IG51bUJpdHMgPCBiaXRzTGVmdCA/IG51bUJpdHMgOiBiaXRzTGVmdDtcbiAgICAgICAgICAgIGNvbnN0IGJpdHNUb05vdFJlYWQgPSBiaXRzTGVmdCAtIHRvUmVhZDtcbiAgICAgICAgICAgIGNvbnN0IG1hc2sgPSAoMHhGRiA+PiAoOCAtIHRvUmVhZCkpIDw8IGJpdHNUb05vdFJlYWQ7XG4gICAgICAgICAgICByZXN1bHQgPSAodGhpcy5ieXRlc1t0aGlzLmJ5dGVPZmZzZXRdICYgbWFzaykgPj4gYml0c1RvTm90UmVhZDtcbiAgICAgICAgICAgIG51bUJpdHMgLT0gdG9SZWFkO1xuICAgICAgICAgICAgdGhpcy5iaXRPZmZzZXQgKz0gdG9SZWFkO1xuICAgICAgICAgICAgaWYgKHRoaXMuYml0T2Zmc2V0ID09PSA4KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5iaXRPZmZzZXQgPSAwO1xuICAgICAgICAgICAgICAgIHRoaXMuYnl0ZU9mZnNldCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIC8vIE5leHQgcmVhZCB3aG9sZSBieXRlc1xuICAgICAgICBpZiAobnVtQml0cyA+IDApIHtcbiAgICAgICAgICAgIHdoaWxlIChudW1CaXRzID49IDgpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSAocmVzdWx0IDw8IDgpIHwgKHRoaXMuYnl0ZXNbdGhpcy5ieXRlT2Zmc2V0XSAmIDB4RkYpO1xuICAgICAgICAgICAgICAgIHRoaXMuYnl0ZU9mZnNldCsrO1xuICAgICAgICAgICAgICAgIG51bUJpdHMgLT0gODtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIEZpbmFsbHkgcmVhZCBhIHBhcnRpYWwgYnl0ZVxuICAgICAgICAgICAgaWYgKG51bUJpdHMgPiAwKSB7XG4gICAgICAgICAgICAgICAgY29uc3QgYml0c1RvTm90UmVhZCA9IDggLSBudW1CaXRzO1xuICAgICAgICAgICAgICAgIGNvbnN0IG1hc2sgPSAoMHhGRiA+PiBiaXRzVG9Ob3RSZWFkKSA8PCBiaXRzVG9Ob3RSZWFkO1xuICAgICAgICAgICAgICAgIHJlc3VsdCA9IChyZXN1bHQgPDwgbnVtQml0cykgfCAoKHRoaXMuYnl0ZXNbdGhpcy5ieXRlT2Zmc2V0XSAmIG1hc2spID4+IGJpdHNUb05vdFJlYWQpO1xuICAgICAgICAgICAgICAgIHRoaXMuYml0T2Zmc2V0ICs9IG51bUJpdHM7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG4gICAgYXZhaWxhYmxlKCkge1xuICAgICAgICByZXR1cm4gOCAqICh0aGlzLmJ5dGVzLmxlbmd0aCAtIHRoaXMuYnl0ZU9mZnNldCkgLSB0aGlzLmJpdE9mZnNldDtcbiAgICB9XG59XG5cbi8vIHRzbGludDpkaXNhYmxlOm5vLWJpdHdpc2VcbnZhciBNb2RlO1xuKGZ1bmN0aW9uIChNb2RlKSB7XG4gICAgTW9kZVtcIk51bWVyaWNcIl0gPSBcIm51bWVyaWNcIjtcbiAgICBNb2RlW1wiQWxwaGFudW1lcmljXCJdID0gXCJhbHBoYW51bWVyaWNcIjtcbiAgICBNb2RlW1wiQnl0ZVwiXSA9IFwiYnl0ZVwiO1xuICAgIE1vZGVbXCJLYW5qaVwiXSA9IFwia2FuamlcIjtcbiAgICBNb2RlW1wiRUNJXCJdID0gXCJlY2lcIjtcbn0pKE1vZGUgfHwgKE1vZGUgPSB7fSkpO1xudmFyIE1vZGVCeXRlO1xuKGZ1bmN0aW9uIChNb2RlQnl0ZSkge1xuICAgIE1vZGVCeXRlW01vZGVCeXRlW1wiVGVybWluYXRvclwiXSA9IDBdID0gXCJUZXJtaW5hdG9yXCI7XG4gICAgTW9kZUJ5dGVbTW9kZUJ5dGVbXCJOdW1lcmljXCJdID0gMV0gPSBcIk51bWVyaWNcIjtcbiAgICBNb2RlQnl0ZVtNb2RlQnl0ZVtcIkFscGhhbnVtZXJpY1wiXSA9IDJdID0gXCJBbHBoYW51bWVyaWNcIjtcbiAgICBNb2RlQnl0ZVtNb2RlQnl0ZVtcIkJ5dGVcIl0gPSA0XSA9IFwiQnl0ZVwiO1xuICAgIE1vZGVCeXRlW01vZGVCeXRlW1wiS2FuamlcIl0gPSA4XSA9IFwiS2FuamlcIjtcbiAgICBNb2RlQnl0ZVtNb2RlQnl0ZVtcIkVDSVwiXSA9IDddID0gXCJFQ0lcIjtcbiAgICAvLyBTdHJ1Y3R1cmVkQXBwZW5kID0gMHgzLFxuICAgIC8vIEZOQzFGaXJzdFBvc2l0aW9uID0gMHg1LFxuICAgIC8vIEZOQzFTZWNvbmRQb3NpdGlvbiA9IDB4OSxcbn0pKE1vZGVCeXRlIHx8IChNb2RlQnl0ZSA9IHt9KSk7XG5mdW5jdGlvbiBkZWNvZGVOdW1lcmljKHN0cmVhbSwgc2l6ZSkge1xuICAgIGNvbnN0IGJ5dGVzID0gW107XG4gICAgbGV0IHRleHQgPSBcIlwiO1xuICAgIGNvbnN0IGNoYXJhY3RlckNvdW50U2l6ZSA9IFsxMCwgMTIsIDE0XVtzaXplXTtcbiAgICBsZXQgbGVuZ3RoID0gc3RyZWFtLnJlYWRCaXRzKGNoYXJhY3RlckNvdW50U2l6ZSk7XG4gICAgLy8gUmVhZCBkaWdpdHMgaW4gZ3JvdXBzIG9mIDNcbiAgICB3aGlsZSAobGVuZ3RoID49IDMpIHtcbiAgICAgICAgY29uc3QgbnVtID0gc3RyZWFtLnJlYWRCaXRzKDEwKTtcbiAgICAgICAgaWYgKG51bSA+PSAxMDAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG51bWVyaWMgdmFsdWUgYWJvdmUgOTk5XCIpO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IGEgPSBNYXRoLmZsb29yKG51bSAvIDEwMCk7XG4gICAgICAgIGNvbnN0IGIgPSBNYXRoLmZsb29yKG51bSAvIDEwKSAlIDEwO1xuICAgICAgICBjb25zdCBjID0gbnVtICUgMTA7XG4gICAgICAgIGJ5dGVzLnB1c2goNDggKyBhLCA0OCArIGIsIDQ4ICsgYyk7XG4gICAgICAgIHRleHQgKz0gYS50b1N0cmluZygpICsgYi50b1N0cmluZygpICsgYy50b1N0cmluZygpO1xuICAgICAgICBsZW5ndGggLT0gMztcbiAgICB9XG4gICAgLy8gSWYgdGhlIG51bWJlciBvZiBkaWdpdHMgYXJlbid0IGEgbXVsdGlwbGUgb2YgMywgdGhlIHJlbWFpbmluZyBkaWdpdHMgYXJlIHNwZWNpYWwgY2FzZWQuXG4gICAgaWYgKGxlbmd0aCA9PT0gMikge1xuICAgICAgICBjb25zdCBudW0gPSBzdHJlYW0ucmVhZEJpdHMoNyk7XG4gICAgICAgIGlmIChudW0gPj0gMTAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIG51bWVyaWMgdmFsdWUgYWJvdmUgOTlcIik7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3QgYSA9IE1hdGguZmxvb3IobnVtIC8gMTApO1xuICAgICAgICBjb25zdCBiID0gbnVtICUgMTA7XG4gICAgICAgIGJ5dGVzLnB1c2goNDggKyBhLCA0OCArIGIpO1xuICAgICAgICB0ZXh0ICs9IGEudG9TdHJpbmcoKSArIGIudG9TdHJpbmcoKTtcbiAgICB9XG4gICAgZWxzZSBpZiAobGVuZ3RoID09PSAxKSB7XG4gICAgICAgIGNvbnN0IG51bSA9IHN0cmVhbS5yZWFkQml0cyg0KTtcbiAgICAgICAgaWYgKG51bSA+PSAxMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiSW52YWxpZCBudW1lcmljIHZhbHVlIGFib3ZlIDlcIik7XG4gICAgICAgIH1cbiAgICAgICAgYnl0ZXMucHVzaCg0OCArIG51bSk7XG4gICAgICAgIHRleHQgKz0gbnVtLnRvU3RyaW5nKCk7XG4gICAgfVxuICAgIHJldHVybiB7IGJ5dGVzLCB0ZXh0IH07XG59XG5jb25zdCBBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2RlcyA9IFtcbiAgICBcIjBcIiwgXCIxXCIsIFwiMlwiLCBcIjNcIiwgXCI0XCIsIFwiNVwiLCBcIjZcIiwgXCI3XCIsIFwiOFwiLFxuICAgIFwiOVwiLCBcIkFcIiwgXCJCXCIsIFwiQ1wiLCBcIkRcIiwgXCJFXCIsIFwiRlwiLCBcIkdcIiwgXCJIXCIsXG4gICAgXCJJXCIsIFwiSlwiLCBcIktcIiwgXCJMXCIsIFwiTVwiLCBcIk5cIiwgXCJPXCIsIFwiUFwiLCBcIlFcIixcbiAgICBcIlJcIiwgXCJTXCIsIFwiVFwiLCBcIlVcIiwgXCJWXCIsIFwiV1wiLCBcIlhcIiwgXCJZXCIsIFwiWlwiLFxuICAgIFwiIFwiLCBcIiRcIiwgXCIlXCIsIFwiKlwiLCBcIitcIiwgXCItXCIsIFwiLlwiLCBcIi9cIiwgXCI6XCIsXG5dO1xuZnVuY3Rpb24gZGVjb2RlQWxwaGFudW1lcmljKHN0cmVhbSwgc2l6ZSkge1xuICAgIGNvbnN0IGJ5dGVzID0gW107XG4gICAgbGV0IHRleHQgPSBcIlwiO1xuICAgIGNvbnN0IGNoYXJhY3RlckNvdW50U2l6ZSA9IFs5LCAxMSwgMTNdW3NpemVdO1xuICAgIGxldCBsZW5ndGggPSBzdHJlYW0ucmVhZEJpdHMoY2hhcmFjdGVyQ291bnRTaXplKTtcbiAgICB3aGlsZSAobGVuZ3RoID49IDIpIHtcbiAgICAgICAgY29uc3QgdiA9IHN0cmVhbS5yZWFkQml0cygxMSk7XG4gICAgICAgIGNvbnN0IGEgPSBNYXRoLmZsb29yKHYgLyA0NSk7XG4gICAgICAgIGNvbnN0IGIgPSB2ICUgNDU7XG4gICAgICAgIGJ5dGVzLnB1c2goQWxwaGFudW1lcmljQ2hhcmFjdGVyQ29kZXNbYV0uY2hhckNvZGVBdCgwKSwgQWxwaGFudW1lcmljQ2hhcmFjdGVyQ29kZXNbYl0uY2hhckNvZGVBdCgwKSk7XG4gICAgICAgIHRleHQgKz0gQWxwaGFudW1lcmljQ2hhcmFjdGVyQ29kZXNbYV0gKyBBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2Rlc1tiXTtcbiAgICAgICAgbGVuZ3RoIC09IDI7XG4gICAgfVxuICAgIGlmIChsZW5ndGggPT09IDEpIHtcbiAgICAgICAgY29uc3QgYSA9IHN0cmVhbS5yZWFkQml0cyg2KTtcbiAgICAgICAgYnl0ZXMucHVzaChBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2Rlc1thXS5jaGFyQ29kZUF0KDApKTtcbiAgICAgICAgdGV4dCArPSBBbHBoYW51bWVyaWNDaGFyYWN0ZXJDb2Rlc1thXTtcbiAgICB9XG4gICAgcmV0dXJuIHsgYnl0ZXMsIHRleHQgfTtcbn1cbmZ1bmN0aW9uIGRlY29kZUJ5dGUoc3RyZWFtLCBzaXplKSB7XG4gICAgY29uc3QgYnl0ZXMgPSBbXTtcbiAgICBsZXQgdGV4dCA9IFwiXCI7XG4gICAgY29uc3QgY2hhcmFjdGVyQ291bnRTaXplID0gWzgsIDE2LCAxNl1bc2l6ZV07XG4gICAgY29uc3QgbGVuZ3RoID0gc3RyZWFtLnJlYWRCaXRzKGNoYXJhY3RlckNvdW50U2l6ZSk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBiID0gc3RyZWFtLnJlYWRCaXRzKDgpO1xuICAgICAgICBieXRlcy5wdXNoKGIpO1xuICAgIH1cbiAgICB0cnkge1xuICAgICAgICB0ZXh0ICs9IGRlY29kZVVSSUNvbXBvbmVudChieXRlcy5tYXAoYiA9PiBgJSR7KFwiMFwiICsgYi50b1N0cmluZygxNikpLnN1YnN0cigtMil9YCkuam9pbihcIlwiKSk7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICAvLyBmYWlsZWQgdG8gZGVjb2RlXG4gICAgfVxuICAgIHJldHVybiB7IGJ5dGVzLCB0ZXh0IH07XG59XG5mdW5jdGlvbiBkZWNvZGVLYW5qaShzdHJlYW0sIHNpemUpIHtcbiAgICBjb25zdCBieXRlcyA9IFtdO1xuICAgIGNvbnN0IGNoYXJhY3RlckNvdW50U2l6ZSA9IFs4LCAxMCwgMTJdW3NpemVdO1xuICAgIGNvbnN0IGxlbmd0aCA9IHN0cmVhbS5yZWFkQml0cyhjaGFyYWN0ZXJDb3VudFNpemUpO1xuICAgIGZvciAobGV0IGkgPSAwOyBpIDwgbGVuZ3RoOyBpKyspIHtcbiAgICAgICAgY29uc3QgayA9IHN0cmVhbS5yZWFkQml0cygxMyk7XG4gICAgICAgIGxldCBjID0gKE1hdGguZmxvb3IoayAvIDB4QzApIDw8IDgpIHwgKGsgJSAweEMwKTtcbiAgICAgICAgaWYgKGMgPCAweDFGMDApIHtcbiAgICAgICAgICAgIGMgKz0gMHg4MTQwO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgYyArPSAweEMxNDA7XG4gICAgICAgIH1cbiAgICAgICAgYnl0ZXMucHVzaChjID4+IDgsIGMgJiAweEZGKTtcbiAgICB9XG4gICAgY29uc3QgdGV4dCA9IG5ldyBUZXh0RGVjb2RlcihcInNoaWZ0LWppc1wiKS5kZWNvZGUoVWludDhBcnJheS5mcm9tKGJ5dGVzKSk7XG4gICAgcmV0dXJuIHsgYnl0ZXMsIHRleHQgfTtcbn1cbmZ1bmN0aW9uIGRlY29kZShkYXRhLCB2ZXJzaW9uKSB7XG4gICAgY29uc3Qgc3RyZWFtID0gbmV3IEJpdFN0cmVhbShkYXRhKTtcbiAgICAvLyBUaGVyZSBhcmUgMyAnc2l6ZXMnIGJhc2VkIG9uIHRoZSB2ZXJzaW9uLiAxLTkgaXMgc21hbGwgKDApLCAxMC0yNiBpcyBtZWRpdW0gKDEpIGFuZCAyNy00MCBpcyBsYXJnZSAoMikuXG4gICAgY29uc3Qgc2l6ZSA9IHZlcnNpb24gPD0gOSA/IDAgOiB2ZXJzaW9uIDw9IDI2ID8gMSA6IDI7XG4gICAgY29uc3QgcmVzdWx0ID0ge1xuICAgICAgICB0ZXh0OiBcIlwiLFxuICAgICAgICBieXRlczogW10sXG4gICAgICAgIGNodW5rczogW10sXG4gICAgfTtcbiAgICB3aGlsZSAoc3RyZWFtLmF2YWlsYWJsZSgpID49IDQpIHtcbiAgICAgICAgY29uc3QgbW9kZSA9IHN0cmVhbS5yZWFkQml0cyg0KTtcbiAgICAgICAgaWYgKG1vZGUgPT09IE1vZGVCeXRlLlRlcm1pbmF0b3IpIHtcbiAgICAgICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gTW9kZUJ5dGUuRUNJKSB7XG4gICAgICAgICAgICBpZiAoc3RyZWFtLnJlYWRCaXRzKDEpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNodW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTW9kZS5FQ0ksXG4gICAgICAgICAgICAgICAgICAgIGFzc2lnbm1lbnROdW1iZXI6IHN0cmVhbS5yZWFkQml0cyg3KSxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2UgaWYgKHN0cmVhbS5yZWFkQml0cygxKSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIHJlc3VsdC5jaHVua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIHR5cGU6IE1vZGUuRUNJLFxuICAgICAgICAgICAgICAgICAgICBhc3NpZ25tZW50TnVtYmVyOiBzdHJlYW0ucmVhZEJpdHMoMTQpLFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSBpZiAoc3RyZWFtLnJlYWRCaXRzKDEpID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0LmNodW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgdHlwZTogTW9kZS5FQ0ksXG4gICAgICAgICAgICAgICAgICAgIGFzc2lnbm1lbnROdW1iZXI6IHN0cmVhbS5yZWFkQml0cygyMSksXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAvLyBFQ0kgZGF0YSBzZWVtcyBjb3JydXB0ZWRcbiAgICAgICAgICAgICAgICByZXN1bHQuY2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICB0eXBlOiBNb2RlLkVDSSxcbiAgICAgICAgICAgICAgICAgICAgYXNzaWdubWVudE51bWJlcjogLTEsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gTW9kZUJ5dGUuTnVtZXJpYykge1xuICAgICAgICAgICAgY29uc3QgbnVtZXJpY1Jlc3VsdCA9IGRlY29kZU51bWVyaWMoc3RyZWFtLCBzaXplKTtcbiAgICAgICAgICAgIHJlc3VsdC50ZXh0ICs9IG51bWVyaWNSZXN1bHQudGV4dDtcbiAgICAgICAgICAgIHJlc3VsdC5ieXRlcy5wdXNoKC4uLm51bWVyaWNSZXN1bHQuYnl0ZXMpO1xuICAgICAgICAgICAgcmVzdWx0LmNodW5rcy5wdXNoKHtcbiAgICAgICAgICAgICAgICB0eXBlOiBNb2RlLk51bWVyaWMsXG4gICAgICAgICAgICAgICAgdGV4dDogbnVtZXJpY1Jlc3VsdC50ZXh0LFxuICAgICAgICAgICAgfSk7XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSBpZiAobW9kZSA9PT0gTW9kZUJ5dGUuQWxwaGFudW1lcmljKSB7XG4gICAgICAgICAgICBjb25zdCBhbHBoYW51bWVyaWNSZXN1bHQgPSBkZWNvZGVBbHBoYW51bWVyaWMoc3RyZWFtLCBzaXplKTtcbiAgICAgICAgICAgIHJlc3VsdC50ZXh0ICs9IGFscGhhbnVtZXJpY1Jlc3VsdC50ZXh0O1xuICAgICAgICAgICAgcmVzdWx0LmJ5dGVzLnB1c2goLi4uYWxwaGFudW1lcmljUmVzdWx0LmJ5dGVzKTtcbiAgICAgICAgICAgIHJlc3VsdC5jaHVua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogTW9kZS5BbHBoYW51bWVyaWMsXG4gICAgICAgICAgICAgICAgdGV4dDogYWxwaGFudW1lcmljUmVzdWx0LnRleHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtb2RlID09PSBNb2RlQnl0ZS5CeXRlKSB7XG4gICAgICAgICAgICBjb25zdCBieXRlUmVzdWx0ID0gZGVjb2RlQnl0ZShzdHJlYW0sIHNpemUpO1xuICAgICAgICAgICAgcmVzdWx0LnRleHQgKz0gYnl0ZVJlc3VsdC50ZXh0O1xuICAgICAgICAgICAgcmVzdWx0LmJ5dGVzLnB1c2goLi4uYnl0ZVJlc3VsdC5ieXRlcyk7XG4gICAgICAgICAgICByZXN1bHQuY2h1bmtzLnB1c2goe1xuICAgICAgICAgICAgICAgIHR5cGU6IE1vZGUuQnl0ZSxcbiAgICAgICAgICAgICAgICBieXRlczogYnl0ZVJlc3VsdC5ieXRlcyxcbiAgICAgICAgICAgICAgICB0ZXh0OiBieXRlUmVzdWx0LnRleHQsXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgICBlbHNlIGlmIChtb2RlID09PSBNb2RlQnl0ZS5LYW5qaSkge1xuICAgICAgICAgICAgY29uc3Qga2FuamlSZXN1bHQgPSBkZWNvZGVLYW5qaShzdHJlYW0sIHNpemUpO1xuICAgICAgICAgICAgcmVzdWx0LnRleHQgKz0ga2FuamlSZXN1bHQudGV4dDtcbiAgICAgICAgICAgIHJlc3VsdC5ieXRlcy5wdXNoKC4uLmthbmppUmVzdWx0LmJ5dGVzKTtcbiAgICAgICAgICAgIHJlc3VsdC5jaHVua3MucHVzaCh7XG4gICAgICAgICAgICAgICAgdHlwZTogTW9kZS5LYW5qaSxcbiAgICAgICAgICAgICAgICBieXRlczoga2FuamlSZXN1bHQuYnl0ZXMsXG4gICAgICAgICAgICAgICAgdGV4dDoga2FuamlSZXN1bHQudGV4dCxcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgfVxuICAgIC8vIElmIHRoZXJlIGlzIG5vIGRhdGEgbGVmdCwgb3IgdGhlIHJlbWFpbmluZyBiaXRzIGFyZSBhbGwgMCwgdGhlbiB0aGF0IGNvdW50cyBhcyBhIHRlcm1pbmF0aW9uIG1hcmtlclxuICAgIGlmIChzdHJlYW0uYXZhaWxhYmxlKCkgPT09IDAgfHwgc3RyZWFtLnJlYWRCaXRzKHN0cmVhbS5hdmFpbGFibGUoKSkgPT09IDApIHtcbiAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICB9XG59XG5cbmNsYXNzIEdlbmVyaWNHRlBvbHkge1xuICAgIGNvbnN0cnVjdG9yKGZpZWxkLCBjb2VmZmljaWVudHMpIHtcbiAgICAgICAgaWYgKGNvZWZmaWNpZW50cy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNvZWZmaWNpZW50cy5cIik7XG4gICAgICAgIH1cbiAgICAgICAgdGhpcy5maWVsZCA9IGZpZWxkO1xuICAgICAgICBjb25zdCBjb2VmZmljaWVudHNMZW5ndGggPSBjb2VmZmljaWVudHMubGVuZ3RoO1xuICAgICAgICBpZiAoY29lZmZpY2llbnRzTGVuZ3RoID4gMSAmJiBjb2VmZmljaWVudHNbMF0gPT09IDApIHtcbiAgICAgICAgICAgIC8vIExlYWRpbmcgdGVybSBtdXN0IGJlIG5vbi16ZXJvIGZvciBhbnl0aGluZyBleGNlcHQgdGhlIGNvbnN0YW50IHBvbHlub21pYWwgXCIwXCJcbiAgICAgICAgICAgIGxldCBmaXJzdE5vblplcm8gPSAxO1xuICAgICAgICAgICAgd2hpbGUgKGZpcnN0Tm9uWmVybyA8IGNvZWZmaWNpZW50c0xlbmd0aCAmJiBjb2VmZmljaWVudHNbZmlyc3ROb25aZXJvXSA9PT0gMCkge1xuICAgICAgICAgICAgICAgIGZpcnN0Tm9uWmVybysrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGZpcnN0Tm9uWmVybyA9PT0gY29lZmZpY2llbnRzTGVuZ3RoKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb2VmZmljaWVudHMgPSBmaWVsZC56ZXJvLmNvZWZmaWNpZW50cztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHRoaXMuY29lZmZpY2llbnRzID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGNvZWZmaWNpZW50c0xlbmd0aCAtIGZpcnN0Tm9uWmVybyk7XG4gICAgICAgICAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLmNvZWZmaWNpZW50c1tpXSA9IGNvZWZmaWNpZW50c1tmaXJzdE5vblplcm8gKyBpXTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICB0aGlzLmNvZWZmaWNpZW50cyA9IGNvZWZmaWNpZW50cztcbiAgICAgICAgfVxuICAgIH1cbiAgICBkZWdyZWUoKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGggLSAxO1xuICAgIH1cbiAgICBpc1plcm8oKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvZWZmaWNpZW50c1swXSA9PT0gMDtcbiAgICB9XG4gICAgZ2V0Q29lZmZpY2llbnQoZGVncmVlKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmNvZWZmaWNpZW50c1t0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGggLSAxIC0gZGVncmVlXTtcbiAgICB9XG4gICAgYWRkT3JTdWJ0cmFjdChvdGhlcikge1xuICAgICAgICBpZiAodGhpcy5pc1plcm8oKSkge1xuICAgICAgICAgICAgcmV0dXJuIG90aGVyO1xuICAgICAgICB9XG4gICAgICAgIGlmIChvdGhlci5pc1plcm8oKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICAgICAgbGV0IHNtYWxsZXJDb2VmZmljaWVudHMgPSB0aGlzLmNvZWZmaWNpZW50cztcbiAgICAgICAgbGV0IGxhcmdlckNvZWZmaWNpZW50cyA9IG90aGVyLmNvZWZmaWNpZW50cztcbiAgICAgICAgaWYgKHNtYWxsZXJDb2VmZmljaWVudHMubGVuZ3RoID4gbGFyZ2VyQ29lZmZpY2llbnRzLmxlbmd0aCkge1xuICAgICAgICAgICAgW3NtYWxsZXJDb2VmZmljaWVudHMsIGxhcmdlckNvZWZmaWNpZW50c10gPSBbbGFyZ2VyQ29lZmZpY2llbnRzLCBzbWFsbGVyQ29lZmZpY2llbnRzXTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzdW1EaWZmID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGxhcmdlckNvZWZmaWNpZW50cy5sZW5ndGgpO1xuICAgICAgICBjb25zdCBsZW5ndGhEaWZmID0gbGFyZ2VyQ29lZmZpY2llbnRzLmxlbmd0aCAtIHNtYWxsZXJDb2VmZmljaWVudHMubGVuZ3RoO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxlbmd0aERpZmY7IGkrKykge1xuICAgICAgICAgICAgc3VtRGlmZltpXSA9IGxhcmdlckNvZWZmaWNpZW50c1tpXTtcbiAgICAgICAgfVxuICAgICAgICBmb3IgKGxldCBpID0gbGVuZ3RoRGlmZjsgaSA8IGxhcmdlckNvZWZmaWNpZW50cy5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgc3VtRGlmZltpXSA9IGFkZE9yU3VidHJhY3RHRihzbWFsbGVyQ29lZmZpY2llbnRzW2kgLSBsZW5ndGhEaWZmXSwgbGFyZ2VyQ29lZmZpY2llbnRzW2ldKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEdlbmVyaWNHRlBvbHkodGhpcy5maWVsZCwgc3VtRGlmZik7XG4gICAgfVxuICAgIG11bHRpcGx5KHNjYWxhcikge1xuICAgICAgICBpZiAoc2NhbGFyID09PSAwKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5maWVsZC56ZXJvO1xuICAgICAgICB9XG4gICAgICAgIGlmIChzY2FsYXIgPT09IDEpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgICAgIGNvbnN0IHNpemUgPSB0aGlzLmNvZWZmaWNpZW50cy5sZW5ndGg7XG4gICAgICAgIGNvbnN0IHByb2R1Y3QgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoc2l6ZSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgc2l6ZTsgaSsrKSB7XG4gICAgICAgICAgICBwcm9kdWN0W2ldID0gdGhpcy5maWVsZC5tdWx0aXBseSh0aGlzLmNvZWZmaWNpZW50c1tpXSwgc2NhbGFyKTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEdlbmVyaWNHRlBvbHkodGhpcy5maWVsZCwgcHJvZHVjdCk7XG4gICAgfVxuICAgIG11bHRpcGx5UG9seShvdGhlcikge1xuICAgICAgICBpZiAodGhpcy5pc1plcm8oKSB8fCBvdGhlci5pc1plcm8oKSkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuZmllbGQuemVybztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBhQ29lZmZpY2llbnRzID0gdGhpcy5jb2VmZmljaWVudHM7XG4gICAgICAgIGNvbnN0IGFMZW5ndGggPSBhQ29lZmZpY2llbnRzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgYkNvZWZmaWNpZW50cyA9IG90aGVyLmNvZWZmaWNpZW50cztcbiAgICAgICAgY29uc3QgYkxlbmd0aCA9IGJDb2VmZmljaWVudHMubGVuZ3RoO1xuICAgICAgICBjb25zdCBwcm9kdWN0ID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGFMZW5ndGggKyBiTGVuZ3RoIC0gMSk7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYUxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBjb25zdCBhQ29lZmYgPSBhQ29lZmZpY2llbnRzW2ldO1xuICAgICAgICAgICAgZm9yIChsZXQgaiA9IDA7IGogPCBiTGVuZ3RoOyBqKyspIHtcbiAgICAgICAgICAgICAgICBwcm9kdWN0W2kgKyBqXSA9IGFkZE9yU3VidHJhY3RHRihwcm9kdWN0W2kgKyBqXSwgdGhpcy5maWVsZC5tdWx0aXBseShhQ29lZmYsIGJDb2VmZmljaWVudHNbal0pKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gbmV3IEdlbmVyaWNHRlBvbHkodGhpcy5maWVsZCwgcHJvZHVjdCk7XG4gICAgfVxuICAgIG11bHRpcGx5QnlNb25vbWlhbChkZWdyZWUsIGNvZWZmaWNpZW50KSB7XG4gICAgICAgIGlmIChkZWdyZWUgPCAwKSB7XG4gICAgICAgICAgICB0aHJvdyBuZXcgRXJyb3IoXCJJbnZhbGlkIGRlZ3JlZSBsZXNzIHRoYW4gMFwiKTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoY29lZmZpY2llbnQgPT09IDApIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLmZpZWxkLnplcm87XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgc2l6ZSA9IHRoaXMuY29lZmZpY2llbnRzLmxlbmd0aDtcbiAgICAgICAgY29uc3QgcHJvZHVjdCA9IG5ldyBVaW50OENsYW1wZWRBcnJheShzaXplICsgZGVncmVlKTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaXplOyBpKyspIHtcbiAgICAgICAgICAgIHByb2R1Y3RbaV0gPSB0aGlzLmZpZWxkLm11bHRpcGx5KHRoaXMuY29lZmZpY2llbnRzW2ldLCBjb2VmZmljaWVudCk7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG5ldyBHZW5lcmljR0ZQb2x5KHRoaXMuZmllbGQsIHByb2R1Y3QpO1xuICAgIH1cbiAgICBldmFsdWF0ZUF0KGEpIHtcbiAgICAgICAgbGV0IHJlc3VsdCA9IDA7XG4gICAgICAgIGlmIChhID09PSAwKSB7XG4gICAgICAgICAgICAvLyBKdXN0IHJldHVybiB0aGUgeF4wIGNvZWZmaWNpZW50XG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRDb2VmZmljaWVudCgwKTtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzaXplID0gdGhpcy5jb2VmZmljaWVudHMubGVuZ3RoO1xuICAgICAgICBpZiAoYSA9PT0gMSkge1xuICAgICAgICAgICAgLy8gSnVzdCB0aGUgc3VtIG9mIHRoZSBjb2VmZmljaWVudHNcbiAgICAgICAgICAgIHRoaXMuY29lZmZpY2llbnRzLmZvckVhY2goKGNvZWZmaWNpZW50KSA9PiB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gYWRkT3JTdWJ0cmFjdEdGKHJlc3VsdCwgY29lZmZpY2llbnQpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9XG4gICAgICAgIHJlc3VsdCA9IHRoaXMuY29lZmZpY2llbnRzWzBdO1xuICAgICAgICBmb3IgKGxldCBpID0gMTsgaSA8IHNpemU7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0ID0gYWRkT3JTdWJ0cmFjdEdGKHRoaXMuZmllbGQubXVsdGlwbHkoYSwgcmVzdWx0KSwgdGhpcy5jb2VmZmljaWVudHNbaV0pO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxufVxuXG5mdW5jdGlvbiBhZGRPclN1YnRyYWN0R0YoYSwgYikge1xuICAgIHJldHVybiBhIF4gYjsgLy8gdHNsaW50OmRpc2FibGUtbGluZTpuby1iaXR3aXNlXG59XG5jbGFzcyBHZW5lcmljR0Yge1xuICAgIGNvbnN0cnVjdG9yKHByaW1pdGl2ZSwgc2l6ZSwgZ2VuQmFzZSkge1xuICAgICAgICB0aGlzLnByaW1pdGl2ZSA9IHByaW1pdGl2ZTtcbiAgICAgICAgdGhpcy5zaXplID0gc2l6ZTtcbiAgICAgICAgdGhpcy5nZW5lcmF0b3JCYXNlID0gZ2VuQmFzZTtcbiAgICAgICAgdGhpcy5leHBUYWJsZSA9IG5ldyBBcnJheSh0aGlzLnNpemUpO1xuICAgICAgICB0aGlzLmxvZ1RhYmxlID0gbmV3IEFycmF5KHRoaXMuc2l6ZSk7XG4gICAgICAgIGxldCB4ID0gMTtcbiAgICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB0aGlzLnNpemU7IGkrKykge1xuICAgICAgICAgICAgdGhpcy5leHBUYWJsZVtpXSA9IHg7XG4gICAgICAgICAgICB4ID0geCAqIDI7XG4gICAgICAgICAgICBpZiAoeCA+PSB0aGlzLnNpemUpIHtcbiAgICAgICAgICAgICAgICB4ID0gKHggXiB0aGlzLnByaW1pdGl2ZSkgJiAodGhpcy5zaXplIC0gMSk7IC8vIHRzbGludDpkaXNhYmxlLWxpbmU6bm8tYml0d2lzZVxuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgdGhpcy5zaXplIC0gMTsgaSsrKSB7XG4gICAgICAgICAgICB0aGlzLmxvZ1RhYmxlW3RoaXMuZXhwVGFibGVbaV1dID0gaTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnplcm8gPSBuZXcgR2VuZXJpY0dGUG9seSh0aGlzLCBVaW50OENsYW1wZWRBcnJheS5mcm9tKFswXSkpO1xuICAgICAgICB0aGlzLm9uZSA9IG5ldyBHZW5lcmljR0ZQb2x5KHRoaXMsIFVpbnQ4Q2xhbXBlZEFycmF5LmZyb20oWzFdKSk7XG4gICAgfVxuICAgIG11bHRpcGx5KGEsIGIpIHtcbiAgICAgICAgaWYgKGEgPT09IDAgfHwgYiA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIDA7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhwVGFibGVbKHRoaXMubG9nVGFibGVbYV0gKyB0aGlzLmxvZ1RhYmxlW2JdKSAlICh0aGlzLnNpemUgLSAxKV07XG4gICAgfVxuICAgIGludmVyc2UoYSkge1xuICAgICAgICBpZiAoYSA9PT0gMCkge1xuICAgICAgICAgICAgdGhyb3cgbmV3IEVycm9yKFwiQ2FuJ3QgaW52ZXJ0IDBcIik7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHRoaXMuZXhwVGFibGVbdGhpcy5zaXplIC0gdGhpcy5sb2dUYWJsZVthXSAtIDFdO1xuICAgIH1cbiAgICBidWlsZE1vbm9taWFsKGRlZ3JlZSwgY29lZmZpY2llbnQpIHtcbiAgICAgICAgaWYgKGRlZ3JlZSA8IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbW9ub21pYWwgZGVncmVlIGxlc3MgdGhhbiAwXCIpO1xuICAgICAgICB9XG4gICAgICAgIGlmIChjb2VmZmljaWVudCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIHRoaXMuemVybztcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBjb2VmZmljaWVudHMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkoZGVncmVlICsgMSk7XG4gICAgICAgIGNvZWZmaWNpZW50c1swXSA9IGNvZWZmaWNpZW50O1xuICAgICAgICByZXR1cm4gbmV3IEdlbmVyaWNHRlBvbHkodGhpcywgY29lZmZpY2llbnRzKTtcbiAgICB9XG4gICAgbG9nKGEpIHtcbiAgICAgICAgaWYgKGEgPT09IDApIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkNhbid0IHRha2UgbG9nKDApXCIpO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB0aGlzLmxvZ1RhYmxlW2FdO1xuICAgIH1cbiAgICBleHAoYSkge1xuICAgICAgICByZXR1cm4gdGhpcy5leHBUYWJsZVthXTtcbiAgICB9XG59XG5cbmZ1bmN0aW9uIHJ1bkV1Y2xpZGVhbkFsZ29yaXRobShmaWVsZCwgYSwgYiwgUikge1xuICAgIC8vIEFzc3VtZSBhJ3MgZGVncmVlIGlzID49IGInc1xuICAgIGlmIChhLmRlZ3JlZSgpIDwgYi5kZWdyZWUoKSkge1xuICAgICAgICBbYSwgYl0gPSBbYiwgYV07XG4gICAgfVxuICAgIGxldCByTGFzdCA9IGE7XG4gICAgbGV0IHIgPSBiO1xuICAgIGxldCB0TGFzdCA9IGZpZWxkLnplcm87XG4gICAgbGV0IHQgPSBmaWVsZC5vbmU7XG4gICAgLy8gUnVuIEV1Y2xpZGVhbiBhbGdvcml0aG0gdW50aWwgcidzIGRlZ3JlZSBpcyBsZXNzIHRoYW4gUi8yXG4gICAgd2hpbGUgKHIuZGVncmVlKCkgPj0gUiAvIDIpIHtcbiAgICAgICAgY29uc3Qgckxhc3RMYXN0ID0gckxhc3Q7XG4gICAgICAgIGNvbnN0IHRMYXN0TGFzdCA9IHRMYXN0O1xuICAgICAgICByTGFzdCA9IHI7XG4gICAgICAgIHRMYXN0ID0gdDtcbiAgICAgICAgLy8gRGl2aWRlIHJMYXN0TGFzdCBieSByTGFzdCwgd2l0aCBxdW90aWVudCBpbiBxIGFuZCByZW1haW5kZXIgaW4gclxuICAgICAgICBpZiAockxhc3QuaXNaZXJvKCkpIHtcbiAgICAgICAgICAgIC8vIEV1Y2xpZGVhbiBhbGdvcml0aG0gYWxyZWFkeSB0ZXJtaW5hdGVkP1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgciA9IHJMYXN0TGFzdDtcbiAgICAgICAgbGV0IHEgPSBmaWVsZC56ZXJvO1xuICAgICAgICBjb25zdCBkZW5vbWluYXRvckxlYWRpbmdUZXJtID0gckxhc3QuZ2V0Q29lZmZpY2llbnQockxhc3QuZGVncmVlKCkpO1xuICAgICAgICBjb25zdCBkbHRJbnZlcnNlID0gZmllbGQuaW52ZXJzZShkZW5vbWluYXRvckxlYWRpbmdUZXJtKTtcbiAgICAgICAgd2hpbGUgKHIuZGVncmVlKCkgPj0gckxhc3QuZGVncmVlKCkgJiYgIXIuaXNaZXJvKCkpIHtcbiAgICAgICAgICAgIGNvbnN0IGRlZ3JlZURpZmYgPSByLmRlZ3JlZSgpIC0gckxhc3QuZGVncmVlKCk7XG4gICAgICAgICAgICBjb25zdCBzY2FsZSA9IGZpZWxkLm11bHRpcGx5KHIuZ2V0Q29lZmZpY2llbnQoci5kZWdyZWUoKSksIGRsdEludmVyc2UpO1xuICAgICAgICAgICAgcSA9IHEuYWRkT3JTdWJ0cmFjdChmaWVsZC5idWlsZE1vbm9taWFsKGRlZ3JlZURpZmYsIHNjYWxlKSk7XG4gICAgICAgICAgICByID0gci5hZGRPclN1YnRyYWN0KHJMYXN0Lm11bHRpcGx5QnlNb25vbWlhbChkZWdyZWVEaWZmLCBzY2FsZSkpO1xuICAgICAgICB9XG4gICAgICAgIHQgPSBxLm11bHRpcGx5UG9seSh0TGFzdCkuYWRkT3JTdWJ0cmFjdCh0TGFzdExhc3QpO1xuICAgICAgICBpZiAoci5kZWdyZWUoKSA+PSByTGFzdC5kZWdyZWUoKSkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc2lnbWFUaWxkZUF0WmVybyA9IHQuZ2V0Q29lZmZpY2llbnQoMCk7XG4gICAgaWYgKHNpZ21hVGlsZGVBdFplcm8gPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IGludmVyc2UgPSBmaWVsZC5pbnZlcnNlKHNpZ21hVGlsZGVBdFplcm8pO1xuICAgIHJldHVybiBbdC5tdWx0aXBseShpbnZlcnNlKSwgci5tdWx0aXBseShpbnZlcnNlKV07XG59XG5mdW5jdGlvbiBmaW5kRXJyb3JMb2NhdGlvbnMoZmllbGQsIGVycm9yTG9jYXRvcikge1xuICAgIC8vIFRoaXMgaXMgYSBkaXJlY3QgYXBwbGljYXRpb24gb2YgQ2hpZW4ncyBzZWFyY2hcbiAgICBjb25zdCBudW1FcnJvcnMgPSBlcnJvckxvY2F0b3IuZGVncmVlKCk7XG4gICAgaWYgKG51bUVycm9ycyA9PT0gMSkge1xuICAgICAgICByZXR1cm4gW2Vycm9yTG9jYXRvci5nZXRDb2VmZmljaWVudCgxKV07XG4gICAgfVxuICAgIGNvbnN0IHJlc3VsdCA9IG5ldyBBcnJheShudW1FcnJvcnMpO1xuICAgIGxldCBlcnJvckNvdW50ID0gMDtcbiAgICBmb3IgKGxldCBpID0gMTsgaSA8IGZpZWxkLnNpemUgJiYgZXJyb3JDb3VudCA8IG51bUVycm9yczsgaSsrKSB7XG4gICAgICAgIGlmIChlcnJvckxvY2F0b3IuZXZhbHVhdGVBdChpKSA9PT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0W2Vycm9yQ291bnRdID0gZmllbGQuaW52ZXJzZShpKTtcbiAgICAgICAgICAgIGVycm9yQ291bnQrKztcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoZXJyb3JDb3VudCAhPT0gbnVtRXJyb3JzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuZnVuY3Rpb24gZmluZEVycm9yTWFnbml0dWRlcyhmaWVsZCwgZXJyb3JFdmFsdWF0b3IsIGVycm9yTG9jYXRpb25zKSB7XG4gICAgLy8gVGhpcyBpcyBkaXJlY3RseSBhcHBseWluZyBGb3JuZXkncyBGb3JtdWxhXG4gICAgY29uc3QgcyA9IGVycm9yTG9jYXRpb25zLmxlbmd0aDtcbiAgICBjb25zdCByZXN1bHQgPSBuZXcgQXJyYXkocyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzOyBpKyspIHtcbiAgICAgICAgY29uc3QgeGlJbnZlcnNlID0gZmllbGQuaW52ZXJzZShlcnJvckxvY2F0aW9uc1tpXSk7XG4gICAgICAgIGxldCBkZW5vbWluYXRvciA9IDE7XG4gICAgICAgIGZvciAobGV0IGogPSAwOyBqIDwgczsgaisrKSB7XG4gICAgICAgICAgICBpZiAoaSAhPT0gaikge1xuICAgICAgICAgICAgICAgIGRlbm9taW5hdG9yID0gZmllbGQubXVsdGlwbHkoZGVub21pbmF0b3IsIGFkZE9yU3VidHJhY3RHRigxLCBmaWVsZC5tdWx0aXBseShlcnJvckxvY2F0aW9uc1tqXSwgeGlJbnZlcnNlKSkpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHJlc3VsdFtpXSA9IGZpZWxkLm11bHRpcGx5KGVycm9yRXZhbHVhdG9yLmV2YWx1YXRlQXQoeGlJbnZlcnNlKSwgZmllbGQuaW52ZXJzZShkZW5vbWluYXRvcikpO1xuICAgICAgICBpZiAoZmllbGQuZ2VuZXJhdG9yQmFzZSAhPT0gMCkge1xuICAgICAgICAgICAgcmVzdWx0W2ldID0gZmllbGQubXVsdGlwbHkocmVzdWx0W2ldLCB4aUludmVyc2UpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiByZXN1bHQ7XG59XG5mdW5jdGlvbiBkZWNvZGUkMShieXRlcywgdHdvUykge1xuICAgIGNvbnN0IG91dHB1dEJ5dGVzID0gbmV3IFVpbnQ4Q2xhbXBlZEFycmF5KGJ5dGVzLmxlbmd0aCk7XG4gICAgb3V0cHV0Qnl0ZXMuc2V0KGJ5dGVzKTtcbiAgICBjb25zdCBmaWVsZCA9IG5ldyBHZW5lcmljR0YoMHgwMTFELCAyNTYsIDApOyAvLyB4XjggKyB4XjQgKyB4XjMgKyB4XjIgKyAxXG4gICAgY29uc3QgcG9seSA9IG5ldyBHZW5lcmljR0ZQb2x5KGZpZWxkLCBvdXRwdXRCeXRlcyk7XG4gICAgY29uc3Qgc3luZHJvbWVDb2VmZmljaWVudHMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodHdvUyk7XG4gICAgbGV0IGVycm9yID0gZmFsc2U7XG4gICAgZm9yIChsZXQgcyA9IDA7IHMgPCB0d29TOyBzKyspIHtcbiAgICAgICAgY29uc3QgZXZhbHVhdGlvbiA9IHBvbHkuZXZhbHVhdGVBdChmaWVsZC5leHAocyArIGZpZWxkLmdlbmVyYXRvckJhc2UpKTtcbiAgICAgICAgc3luZHJvbWVDb2VmZmljaWVudHNbc3luZHJvbWVDb2VmZmljaWVudHMubGVuZ3RoIC0gMSAtIHNdID0gZXZhbHVhdGlvbjtcbiAgICAgICAgaWYgKGV2YWx1YXRpb24gIT09IDApIHtcbiAgICAgICAgICAgIGVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWVycm9yKSB7XG4gICAgICAgIHJldHVybiBvdXRwdXRCeXRlcztcbiAgICB9XG4gICAgY29uc3Qgc3luZHJvbWUgPSBuZXcgR2VuZXJpY0dGUG9seShmaWVsZCwgc3luZHJvbWVDb2VmZmljaWVudHMpO1xuICAgIGNvbnN0IHNpZ21hT21lZ2EgPSBydW5FdWNsaWRlYW5BbGdvcml0aG0oZmllbGQsIGZpZWxkLmJ1aWxkTW9ub21pYWwodHdvUywgMSksIHN5bmRyb21lLCB0d29TKTtcbiAgICBpZiAoc2lnbWFPbWVnYSA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZXJyb3JMb2NhdGlvbnMgPSBmaW5kRXJyb3JMb2NhdGlvbnMoZmllbGQsIHNpZ21hT21lZ2FbMF0pO1xuICAgIGlmIChlcnJvckxvY2F0aW9ucyA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCBlcnJvck1hZ25pdHVkZXMgPSBmaW5kRXJyb3JNYWduaXR1ZGVzKGZpZWxkLCBzaWdtYU9tZWdhWzFdLCBlcnJvckxvY2F0aW9ucyk7XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBlcnJvckxvY2F0aW9ucy5sZW5ndGg7IGkrKykge1xuICAgICAgICBjb25zdCBwb3NpdGlvbiA9IG91dHB1dEJ5dGVzLmxlbmd0aCAtIDEgLSBmaWVsZC5sb2coZXJyb3JMb2NhdGlvbnNbaV0pO1xuICAgICAgICBpZiAocG9zaXRpb24gPCAwKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBvdXRwdXRCeXRlc1twb3NpdGlvbl0gPSBhZGRPclN1YnRyYWN0R0Yob3V0cHV0Qnl0ZXNbcG9zaXRpb25dLCBlcnJvck1hZ25pdHVkZXNbaV0pO1xuICAgIH1cbiAgICByZXR1cm4gb3V0cHV0Qnl0ZXM7XG59XG5cbmNvbnN0IFZFUlNJT05TID0gW1xuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IG51bGwsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDEsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogNyxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE5IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxMyxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxNyxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDkgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogbnVsbCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAxOF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDEwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMzQgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjggfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjIgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogbnVsbCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMyxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyMl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE1LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNTUgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDQgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTMgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogbnVsbCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogNCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogODAgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMzIgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOSB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiBudWxsLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiA1LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMDggfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDMgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDE4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IG51bGwsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDYsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzRdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDY4IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAxNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI3IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE5IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MDdDOTQsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDcsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjIsIDM4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA3OCB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzMSB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwODVCQyxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogOCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNCwgNDJdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDk3IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzOCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzOSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE4IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE5IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MDlBOTksXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDksXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjYsIDQ2XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFt7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTYgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIyLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDM3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwQTREMyxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTAsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjgsIDUwXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMTgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNjggfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNjkgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0MyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE5IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIwIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MEJCRjYsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDExLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1NF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDIwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogODEgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDUwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDUxIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgwQzc2MixcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTIsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzIsIDU4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOTIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOTMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIxIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MEQ4NDcsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDEzLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDM0LCA2Ml0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTA3IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyMixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzNyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAzOCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIxIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDBFNjBELFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAxNCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNiwgNDYsIDY2XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQwIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQxIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDExLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDExLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDBGOTI4LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAxNSxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNiwgNDgsIDcwXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjIsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogODcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogODggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0MSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0MiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDExLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEzIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDEwQjc4LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAxNixcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNiwgNTAsIDc0XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjQsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOTggfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogOTkgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI0LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxOSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxMTQ1RCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMTcsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU0LCA3OF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEwNyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMDggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTJBMTcsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDE4LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1NiwgODJdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjAgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIxIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDMgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDQgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTM1MzIsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDE5LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1OCwgODZdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTMgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE0IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDExLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIxIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDIyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjYsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTMgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE0IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDE0OUE2LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyMCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzNCwgNjIsIDkwXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTA3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEwOCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQxIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0MiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTU2ODMsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDIxLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI4LCA1MCwgNzIsIDk0XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI2LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDE3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQyIH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MTY4QzksXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDIyLFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA1MCwgNzQsIDk4XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTExIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExMiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbeyBudW1CbG9ja3M6IDE3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ2IH1dLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAzNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMyB9XSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDE3N0VDLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyMyxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTQsIDc0LCAxMDJdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjEgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDExLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MThFQzQsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDI0LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI4LCA1NCwgODAsIDEwNl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDE5MUUxLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyNSxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMiwgNTgsIDg0LCAxMTBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyNixcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMDYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTA3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgxQUZBQixcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMjYsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU4LCA4NiwgMTE0XSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEwLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MUIwOEUsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDI3LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDM0LCA2MiwgOTAsIDExOF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDI4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDFDQzFBLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyOCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNiwgNTAsIDc0LCA5OCwgMTIyXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDFEMzNGLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAyOSxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTQsIDc4LCAxMDIsIDEyNl0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyMyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDI2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDFFRDc1LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzMCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAyNiwgNTIsIDc4LCAxMDQsIDEzMF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0OCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjUsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDI1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDFGMjUwLFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzMSxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTYsIDgyLCAxMDgsIDEzNF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDI5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIzLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyMDlENSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzIsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzQsIDYwLCA4NiwgMTEyLCAxMzhdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW3sgbnVtQmxvY2tzOiAxNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTUgfV0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDM1LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzNSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyMTZGMCxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzMsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzAsIDU4LCA4NiwgMTE0LCAxNDJdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDExLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0NiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyMjhCQSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzQsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMzQsIDYyLCA5MCwgMTE4LCAxNDZdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NiB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDcsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNTksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTcgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4MjM3OUYsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDM1LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDMwLCA1NCwgNzgsIDEwMiwgMTI2LCAxNTBdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIxIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDggfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzksIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjQgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI1IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDIyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0MSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyNEIwQixcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzYsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjQsIDUwLCA3NiwgMTAyLCAxMjgsIDE1NF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDEyMSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIyIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDYsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDM0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQ2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE1IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA2NCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNiB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICBdLFxuICAgIH0sXG4gICAge1xuICAgICAgICBpbmZvQml0czogMHgyNTQyRSxcbiAgICAgICAgdmVyc2lvbk51bWJlcjogMzcsXG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5DZW50ZXJzOiBbNiwgMjgsIDU0LCA4MCwgMTA2LCAxMzIsIDE1OF0sXG4gICAgICAgIGVycm9yQ29ycmVjdGlvbkxldmVsczogW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjIgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIzIH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMjgsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDI5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ2IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0OSwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQ2LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDI2QTY0LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiAzOCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMiwgNTgsIDg0LCAxMTAsIDEzNiwgMTYyXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTIyIH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxOCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMjMgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTMsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDYgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMyLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ3IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDQ4LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAxNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0MiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMzIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuICAgIHtcbiAgICAgICAgaW5mb0JpdHM6IDB4Mjc1NDEsXG4gICAgICAgIHZlcnNpb25OdW1iZXI6IDM5LFxuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuQ2VudGVyczogWzYsIDI2LCA1NCwgODIsIDExMCwgMTM4LCAxNjZdLFxuICAgICAgICBlcnJvckNvcnJlY3Rpb25MZXZlbHM6IFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTE3IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExOCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDI4LFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0MCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0NyB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiA0OCB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiA0MywgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMjIsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMjUgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAzMCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTAsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTUgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDY3LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDE2IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgIF0sXG4gICAgfSxcbiAgICB7XG4gICAgICAgIGluZm9CaXRzOiAweDI4QzY5LFxuICAgICAgICB2ZXJzaW9uTnVtYmVyOiA0MCxcbiAgICAgICAgYWxpZ25tZW50UGF0dGVybkNlbnRlcnM6IFs2LCAzMCwgNTgsIDg2LCAxMTQsIDE0MiwgMTcwXSxcbiAgICAgICAgZXJyb3JDb3JyZWN0aW9uTGV2ZWxzOiBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDE5LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDExOCB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNiwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxMTkgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBlY0NvZGV3b3Jkc1BlckJsb2NrOiAyOCxcbiAgICAgICAgICAgICAgICBlY0Jsb2NrczogW1xuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogMTgsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogNDcgfSxcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDMxLCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDQ4IH0sXG4gICAgICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgZWNDb2Rld29yZHNQZXJCbG9jazogMzAsXG4gICAgICAgICAgICAgICAgZWNCbG9ja3M6IFtcbiAgICAgICAgICAgICAgICAgICAgeyBudW1CbG9ja3M6IDM0LCBkYXRhQ29kZXdvcmRzUGVyQmxvY2s6IDI0IH0sXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAzNCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAyNSB9LFxuICAgICAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGVjQ29kZXdvcmRzUGVyQmxvY2s6IDMwLFxuICAgICAgICAgICAgICAgIGVjQmxvY2tzOiBbXG4gICAgICAgICAgICAgICAgICAgIHsgbnVtQmxvY2tzOiAyMCwgZGF0YUNvZGV3b3Jkc1BlckJsb2NrOiAxNSB9LFxuICAgICAgICAgICAgICAgICAgICB7IG51bUJsb2NrczogNjEsIGRhdGFDb2Rld29yZHNQZXJCbG9jazogMTYgfSxcbiAgICAgICAgICAgICAgICBdLFxuICAgICAgICAgICAgfSxcbiAgICAgICAgXSxcbiAgICB9LFxuXTtcblxuLy8gdHNsaW50OmRpc2FibGU6bm8tYml0d2lzZVxuZnVuY3Rpb24gbnVtQml0c0RpZmZlcmluZyh4LCB5KSB7XG4gICAgbGV0IHogPSB4IF4geTtcbiAgICBsZXQgYml0Q291bnQgPSAwO1xuICAgIHdoaWxlICh6KSB7XG4gICAgICAgIGJpdENvdW50Kys7XG4gICAgICAgIHogJj0geiAtIDE7XG4gICAgfVxuICAgIHJldHVybiBiaXRDb3VudDtcbn1cbmZ1bmN0aW9uIHB1c2hCaXQoYml0LCBieXRlKSB7XG4gICAgcmV0dXJuIChieXRlIDw8IDEpIHwgYml0O1xufVxuLy8gdHNsaW50OmVuYWJsZTpuby1iaXR3aXNlXG5jb25zdCBGT1JNQVRfSU5GT19UQUJMRSA9IFtcbiAgICB7IGJpdHM6IDB4NTQxMiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMSwgZGF0YU1hc2s6IDAgfSB9LFxuICAgIHsgYml0czogMHg1MTI1LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAxLCBkYXRhTWFzazogMSB9IH0sXG4gICAgeyBiaXRzOiAweDVFN0MsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDEsIGRhdGFNYXNrOiAyIH0gfSxcbiAgICB7IGJpdHM6IDB4NUI0QiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMSwgZGF0YU1hc2s6IDMgfSB9LFxuICAgIHsgYml0czogMHg0NUY5LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAxLCBkYXRhTWFzazogNCB9IH0sXG4gICAgeyBiaXRzOiAweDQwQ0UsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDEsIGRhdGFNYXNrOiA1IH0gfSxcbiAgICB7IGJpdHM6IDB4NEY5NywgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMSwgZGF0YU1hc2s6IDYgfSB9LFxuICAgIHsgYml0czogMHg0QUEwLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAxLCBkYXRhTWFzazogNyB9IH0sXG4gICAgeyBiaXRzOiAweDc3QzQsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDAsIGRhdGFNYXNrOiAwIH0gfSxcbiAgICB7IGJpdHM6IDB4NzJGMywgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMCwgZGF0YU1hc2s6IDEgfSB9LFxuICAgIHsgYml0czogMHg3REFBLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAwLCBkYXRhTWFzazogMiB9IH0sXG4gICAgeyBiaXRzOiAweDc4OUQsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDAsIGRhdGFNYXNrOiAzIH0gfSxcbiAgICB7IGJpdHM6IDB4NjYyRiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMCwgZGF0YU1hc2s6IDQgfSB9LFxuICAgIHsgYml0czogMHg2MzE4LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAwLCBkYXRhTWFzazogNSB9IH0sXG4gICAgeyBiaXRzOiAweDZDNDEsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDAsIGRhdGFNYXNrOiA2IH0gfSxcbiAgICB7IGJpdHM6IDB4Njk3NiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMCwgZGF0YU1hc2s6IDcgfSB9LFxuICAgIHsgYml0czogMHgxNjg5LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAzLCBkYXRhTWFzazogMCB9IH0sXG4gICAgeyBiaXRzOiAweDEzQkUsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDMsIGRhdGFNYXNrOiAxIH0gfSxcbiAgICB7IGJpdHM6IDB4MUNFNywgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMywgZGF0YU1hc2s6IDIgfSB9LFxuICAgIHsgYml0czogMHgxOUQwLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAzLCBkYXRhTWFzazogMyB9IH0sXG4gICAgeyBiaXRzOiAweDA3NjIsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDMsIGRhdGFNYXNrOiA0IH0gfSxcbiAgICB7IGJpdHM6IDB4MDI1NSwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMywgZGF0YU1hc2s6IDUgfSB9LFxuICAgIHsgYml0czogMHgwRDBDLCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAzLCBkYXRhTWFzazogNiB9IH0sXG4gICAgeyBiaXRzOiAweDA4M0IsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDMsIGRhdGFNYXNrOiA3IH0gfSxcbiAgICB7IGJpdHM6IDB4MzU1RiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMiwgZGF0YU1hc2s6IDAgfSB9LFxuICAgIHsgYml0czogMHgzMDY4LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAyLCBkYXRhTWFzazogMSB9IH0sXG4gICAgeyBiaXRzOiAweDNGMzEsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDIsIGRhdGFNYXNrOiAyIH0gfSxcbiAgICB7IGJpdHM6IDB4M0EwNiwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMiwgZGF0YU1hc2s6IDMgfSB9LFxuICAgIHsgYml0czogMHgyNEI0LCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAyLCBkYXRhTWFzazogNCB9IH0sXG4gICAgeyBiaXRzOiAweDIxODMsIGZvcm1hdEluZm86IHsgZXJyb3JDb3JyZWN0aW9uTGV2ZWw6IDIsIGRhdGFNYXNrOiA1IH0gfSxcbiAgICB7IGJpdHM6IDB4MkVEQSwgZm9ybWF0SW5mbzogeyBlcnJvckNvcnJlY3Rpb25MZXZlbDogMiwgZGF0YU1hc2s6IDYgfSB9LFxuICAgIHsgYml0czogMHgyQkVELCBmb3JtYXRJbmZvOiB7IGVycm9yQ29ycmVjdGlvbkxldmVsOiAyLCBkYXRhTWFzazogNyB9IH0sXG5dO1xuY29uc3QgREFUQV9NQVNLUyA9IFtcbiAgICAocCkgPT4gKChwLnkgKyBwLngpICUgMikgPT09IDAsXG4gICAgKHApID0+IChwLnkgJSAyKSA9PT0gMCxcbiAgICAocCkgPT4gcC54ICUgMyA9PT0gMCxcbiAgICAocCkgPT4gKHAueSArIHAueCkgJSAzID09PSAwLFxuICAgIChwKSA9PiAoTWF0aC5mbG9vcihwLnkgLyAyKSArIE1hdGguZmxvb3IocC54IC8gMykpICUgMiA9PT0gMCxcbiAgICAocCkgPT4gKChwLnggKiBwLnkpICUgMikgKyAoKHAueCAqIHAueSkgJSAzKSA9PT0gMCxcbiAgICAocCkgPT4gKCgoKHAueSAqIHAueCkgJSAyKSArIChwLnkgKiBwLngpICUgMykgJSAyKSA9PT0gMCxcbiAgICAocCkgPT4gKCgoKHAueSArIHAueCkgJSAyKSArIChwLnkgKiBwLngpICUgMykgJSAyKSA9PT0gMCxcbl07XG5mdW5jdGlvbiBidWlsZEZ1bmN0aW9uUGF0dGVybk1hc2sodmVyc2lvbikge1xuICAgIGNvbnN0IGRpbWVuc2lvbiA9IDE3ICsgNCAqIHZlcnNpb24udmVyc2lvbk51bWJlcjtcbiAgICBjb25zdCBtYXRyaXggPSBCaXRNYXRyaXguY3JlYXRlRW1wdHkoZGltZW5zaW9uLCBkaW1lbnNpb24pO1xuICAgIG1hdHJpeC5zZXRSZWdpb24oMCwgMCwgOSwgOSwgdHJ1ZSk7IC8vIFRvcCBsZWZ0IGZpbmRlciBwYXR0ZXJuICsgc2VwYXJhdG9yICsgZm9ybWF0XG4gICAgbWF0cml4LnNldFJlZ2lvbihkaW1lbnNpb24gLSA4LCAwLCA4LCA5LCB0cnVlKTsgLy8gVG9wIHJpZ2h0IGZpbmRlciBwYXR0ZXJuICsgc2VwYXJhdG9yICsgZm9ybWF0XG4gICAgbWF0cml4LnNldFJlZ2lvbigwLCBkaW1lbnNpb24gLSA4LCA5LCA4LCB0cnVlKTsgLy8gQm90dG9tIGxlZnQgZmluZGVyIHBhdHRlcm4gKyBzZXBhcmF0b3IgKyBmb3JtYXRcbiAgICAvLyBBbGlnbm1lbnQgcGF0dGVybnNcbiAgICBmb3IgKGNvbnN0IHggb2YgdmVyc2lvbi5hbGlnbm1lbnRQYXR0ZXJuQ2VudGVycykge1xuICAgICAgICBmb3IgKGNvbnN0IHkgb2YgdmVyc2lvbi5hbGlnbm1lbnRQYXR0ZXJuQ2VudGVycykge1xuICAgICAgICAgICAgaWYgKCEoeCA9PT0gNiAmJiB5ID09PSA2IHx8IHggPT09IDYgJiYgeSA9PT0gZGltZW5zaW9uIC0gNyB8fCB4ID09PSBkaW1lbnNpb24gLSA3ICYmIHkgPT09IDYpKSB7XG4gICAgICAgICAgICAgICAgbWF0cml4LnNldFJlZ2lvbih4IC0gMiwgeSAtIDIsIDUsIDUsIHRydWUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfVxuICAgIG1hdHJpeC5zZXRSZWdpb24oNiwgOSwgMSwgZGltZW5zaW9uIC0gMTcsIHRydWUpOyAvLyBWZXJ0aWNhbCB0aW1pbmcgcGF0dGVyblxuICAgIG1hdHJpeC5zZXRSZWdpb24oOSwgNiwgZGltZW5zaW9uIC0gMTcsIDEsIHRydWUpOyAvLyBIb3Jpem9udGFsIHRpbWluZyBwYXR0ZXJuXG4gICAgaWYgKHZlcnNpb24udmVyc2lvbk51bWJlciA+IDYpIHtcbiAgICAgICAgbWF0cml4LnNldFJlZ2lvbihkaW1lbnNpb24gLSAxMSwgMCwgMywgNiwgdHJ1ZSk7IC8vIFZlcnNpb24gaW5mbywgdG9wIHJpZ2h0XG4gICAgICAgIG1hdHJpeC5zZXRSZWdpb24oMCwgZGltZW5zaW9uIC0gMTEsIDYsIDMsIHRydWUpOyAvLyBWZXJzaW9uIGluZm8sIGJvdHRvbSBsZWZ0XG4gICAgfVxuICAgIHJldHVybiBtYXRyaXg7XG59XG5mdW5jdGlvbiByZWFkQ29kZXdvcmRzKG1hdHJpeCwgdmVyc2lvbiwgZm9ybWF0SW5mbykge1xuICAgIGNvbnN0IGRhdGFNYXNrID0gREFUQV9NQVNLU1tmb3JtYXRJbmZvLmRhdGFNYXNrXTtcbiAgICBjb25zdCBkaW1lbnNpb24gPSBtYXRyaXguaGVpZ2h0O1xuICAgIGNvbnN0IGZ1bmN0aW9uUGF0dGVybk1hc2sgPSBidWlsZEZ1bmN0aW9uUGF0dGVybk1hc2sodmVyc2lvbik7XG4gICAgY29uc3QgY29kZXdvcmRzID0gW107XG4gICAgbGV0IGN1cnJlbnRCeXRlID0gMDtcbiAgICBsZXQgYml0c1JlYWQgPSAwO1xuICAgIC8vIFJlYWQgY29sdW1ucyBpbiBwYWlycywgZnJvbSByaWdodCB0byBsZWZ0XG4gICAgbGV0IHJlYWRpbmdVcCA9IHRydWU7XG4gICAgZm9yIChsZXQgY29sdW1uSW5kZXggPSBkaW1lbnNpb24gLSAxOyBjb2x1bW5JbmRleCA+IDA7IGNvbHVtbkluZGV4IC09IDIpIHtcbiAgICAgICAgaWYgKGNvbHVtbkluZGV4ID09PSA2KSB7IC8vIFNraXAgd2hvbGUgY29sdW1uIHdpdGggdmVydGljYWwgYWxpZ25tZW50IHBhdHRlcm47XG4gICAgICAgICAgICBjb2x1bW5JbmRleC0tO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGltZW5zaW9uOyBpKyspIHtcbiAgICAgICAgICAgIGNvbnN0IHkgPSByZWFkaW5nVXAgPyBkaW1lbnNpb24gLSAxIC0gaSA6IGk7XG4gICAgICAgICAgICBmb3IgKGxldCBjb2x1bW5PZmZzZXQgPSAwOyBjb2x1bW5PZmZzZXQgPCAyOyBjb2x1bW5PZmZzZXQrKykge1xuICAgICAgICAgICAgICAgIGNvbnN0IHggPSBjb2x1bW5JbmRleCAtIGNvbHVtbk9mZnNldDtcbiAgICAgICAgICAgICAgICBpZiAoIWZ1bmN0aW9uUGF0dGVybk1hc2suZ2V0KHgsIHkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGJpdHNSZWFkKys7XG4gICAgICAgICAgICAgICAgICAgIGxldCBiaXQgPSBtYXRyaXguZ2V0KHgsIHkpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YU1hc2soeyB5LCB4IH0pKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBiaXQgPSAhYml0O1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGN1cnJlbnRCeXRlID0gcHVzaEJpdChiaXQsIGN1cnJlbnRCeXRlKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGJpdHNSZWFkID09PSA4KSB7IC8vIFdob2xlIGJ5dGVzXG4gICAgICAgICAgICAgICAgICAgICAgICBjb2Rld29yZHMucHVzaChjdXJyZW50Qnl0ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBiaXRzUmVhZCA9IDA7XG4gICAgICAgICAgICAgICAgICAgICAgICBjdXJyZW50Qnl0ZSA9IDA7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcmVhZGluZ1VwID0gIXJlYWRpbmdVcDtcbiAgICB9XG4gICAgcmV0dXJuIGNvZGV3b3Jkcztcbn1cbmZ1bmN0aW9uIHJlYWRWZXJzaW9uKG1hdHJpeCkge1xuICAgIGNvbnN0IGRpbWVuc2lvbiA9IG1hdHJpeC5oZWlnaHQ7XG4gICAgY29uc3QgcHJvdmlzaW9uYWxWZXJzaW9uID0gTWF0aC5mbG9vcigoZGltZW5zaW9uIC0gMTcpIC8gNCk7XG4gICAgaWYgKHByb3Zpc2lvbmFsVmVyc2lvbiA8PSA2KSB7IC8vIDYgYW5kIHVuZGVyIGRvbnQgaGF2ZSB2ZXJzaW9uIGluZm8gaW4gdGhlIFFSIGNvZGVcbiAgICAgICAgcmV0dXJuIFZFUlNJT05TW3Byb3Zpc2lvbmFsVmVyc2lvbiAtIDFdO1xuICAgIH1cbiAgICBsZXQgdG9wUmlnaHRWZXJzaW9uQml0cyA9IDA7XG4gICAgZm9yIChsZXQgeSA9IDU7IHkgPj0gMDsgeS0tKSB7XG4gICAgICAgIGZvciAobGV0IHggPSBkaW1lbnNpb24gLSA5OyB4ID49IGRpbWVuc2lvbiAtIDExOyB4LS0pIHtcbiAgICAgICAgICAgIHRvcFJpZ2h0VmVyc2lvbkJpdHMgPSBwdXNoQml0KG1hdHJpeC5nZXQoeCwgeSksIHRvcFJpZ2h0VmVyc2lvbkJpdHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGxldCBib3R0b21MZWZ0VmVyc2lvbkJpdHMgPSAwO1xuICAgIGZvciAobGV0IHggPSA1OyB4ID49IDA7IHgtLSkge1xuICAgICAgICBmb3IgKGxldCB5ID0gZGltZW5zaW9uIC0gOTsgeSA+PSBkaW1lbnNpb24gLSAxMTsgeS0tKSB7XG4gICAgICAgICAgICBib3R0b21MZWZ0VmVyc2lvbkJpdHMgPSBwdXNoQml0KG1hdHJpeC5nZXQoeCwgeSksIGJvdHRvbUxlZnRWZXJzaW9uQml0cyk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgbGV0IGJlc3REaWZmZXJlbmNlID0gSW5maW5pdHk7XG4gICAgbGV0IGJlc3RWZXJzaW9uO1xuICAgIGZvciAoY29uc3QgdmVyc2lvbiBvZiBWRVJTSU9OUykge1xuICAgICAgICBpZiAodmVyc2lvbi5pbmZvQml0cyA9PT0gdG9wUmlnaHRWZXJzaW9uQml0cyB8fCB2ZXJzaW9uLmluZm9CaXRzID09PSBib3R0b21MZWZ0VmVyc2lvbkJpdHMpIHtcbiAgICAgICAgICAgIHJldHVybiB2ZXJzaW9uO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaWZmZXJlbmNlID0gbnVtQml0c0RpZmZlcmluZyh0b3BSaWdodFZlcnNpb25CaXRzLCB2ZXJzaW9uLmluZm9CaXRzKTtcbiAgICAgICAgaWYgKGRpZmZlcmVuY2UgPCBiZXN0RGlmZmVyZW5jZSkge1xuICAgICAgICAgICAgYmVzdFZlcnNpb24gPSB2ZXJzaW9uO1xuICAgICAgICAgICAgYmVzdERpZmZlcmVuY2UgPSBkaWZmZXJlbmNlO1xuICAgICAgICB9XG4gICAgICAgIGRpZmZlcmVuY2UgPSBudW1CaXRzRGlmZmVyaW5nKGJvdHRvbUxlZnRWZXJzaW9uQml0cywgdmVyc2lvbi5pbmZvQml0cyk7XG4gICAgICAgIGlmIChkaWZmZXJlbmNlIDwgYmVzdERpZmZlcmVuY2UpIHtcbiAgICAgICAgICAgIGJlc3RWZXJzaW9uID0gdmVyc2lvbjtcbiAgICAgICAgICAgIGJlc3REaWZmZXJlbmNlID0gZGlmZmVyZW5jZTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBXZSBjYW4gdG9sZXJhdGUgdXAgdG8gMyBiaXRzIG9mIGVycm9yIHNpbmNlIG5vIHR3byB2ZXJzaW9uIGluZm8gY29kZXdvcmRzIHdpbGxcbiAgICAvLyBkaWZmZXIgaW4gbGVzcyB0aGFuIDggYml0cy5cbiAgICBpZiAoYmVzdERpZmZlcmVuY2UgPD0gMykge1xuICAgICAgICByZXR1cm4gYmVzdFZlcnNpb247XG4gICAgfVxufVxuZnVuY3Rpb24gcmVhZEZvcm1hdEluZm9ybWF0aW9uKG1hdHJpeCkge1xuICAgIGxldCB0b3BMZWZ0Rm9ybWF0SW5mb0JpdHMgPSAwO1xuICAgIGZvciAobGV0IHggPSAwOyB4IDw9IDg7IHgrKykge1xuICAgICAgICBpZiAoeCAhPT0gNikgeyAvLyBTa2lwIHRpbWluZyBwYXR0ZXJuIGJpdFxuICAgICAgICAgICAgdG9wTGVmdEZvcm1hdEluZm9CaXRzID0gcHVzaEJpdChtYXRyaXguZ2V0KHgsIDgpLCB0b3BMZWZ0Rm9ybWF0SW5mb0JpdHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGZvciAobGV0IHkgPSA3OyB5ID49IDA7IHktLSkge1xuICAgICAgICBpZiAoeSAhPT0gNikgeyAvLyBTa2lwIHRpbWluZyBwYXR0ZXJuIGJpdFxuICAgICAgICAgICAgdG9wTGVmdEZvcm1hdEluZm9CaXRzID0gcHVzaEJpdChtYXRyaXguZ2V0KDgsIHkpLCB0b3BMZWZ0Rm9ybWF0SW5mb0JpdHMpO1xuICAgICAgICB9XG4gICAgfVxuICAgIGNvbnN0IGRpbWVuc2lvbiA9IG1hdHJpeC5oZWlnaHQ7XG4gICAgbGV0IHRvcFJpZ2h0Qm90dG9tUmlnaHRGb3JtYXRJbmZvQml0cyA9IDA7XG4gICAgZm9yIChsZXQgeSA9IGRpbWVuc2lvbiAtIDE7IHkgPj0gZGltZW5zaW9uIC0gNzsgeS0tKSB7IC8vIGJvdHRvbSBsZWZ0XG4gICAgICAgIHRvcFJpZ2h0Qm90dG9tUmlnaHRGb3JtYXRJbmZvQml0cyA9IHB1c2hCaXQobWF0cml4LmdldCg4LCB5KSwgdG9wUmlnaHRCb3R0b21SaWdodEZvcm1hdEluZm9CaXRzKTtcbiAgICB9XG4gICAgZm9yIChsZXQgeCA9IGRpbWVuc2lvbiAtIDg7IHggPCBkaW1lbnNpb247IHgrKykgeyAvLyB0b3AgcmlnaHRcbiAgICAgICAgdG9wUmlnaHRCb3R0b21SaWdodEZvcm1hdEluZm9CaXRzID0gcHVzaEJpdChtYXRyaXguZ2V0KHgsIDgpLCB0b3BSaWdodEJvdHRvbVJpZ2h0Rm9ybWF0SW5mb0JpdHMpO1xuICAgIH1cbiAgICBsZXQgYmVzdERpZmZlcmVuY2UgPSBJbmZpbml0eTtcbiAgICBsZXQgYmVzdEZvcm1hdEluZm8gPSBudWxsO1xuICAgIGZvciAoY29uc3QgeyBiaXRzLCBmb3JtYXRJbmZvIH0gb2YgRk9STUFUX0lORk9fVEFCTEUpIHtcbiAgICAgICAgaWYgKGJpdHMgPT09IHRvcExlZnRGb3JtYXRJbmZvQml0cyB8fCBiaXRzID09PSB0b3BSaWdodEJvdHRvbVJpZ2h0Rm9ybWF0SW5mb0JpdHMpIHtcbiAgICAgICAgICAgIHJldHVybiBmb3JtYXRJbmZvO1xuICAgICAgICB9XG4gICAgICAgIGxldCBkaWZmZXJlbmNlID0gbnVtQml0c0RpZmZlcmluZyh0b3BMZWZ0Rm9ybWF0SW5mb0JpdHMsIGJpdHMpO1xuICAgICAgICBpZiAoZGlmZmVyZW5jZSA8IGJlc3REaWZmZXJlbmNlKSB7XG4gICAgICAgICAgICBiZXN0Rm9ybWF0SW5mbyA9IGZvcm1hdEluZm87XG4gICAgICAgICAgICBiZXN0RGlmZmVyZW5jZSA9IGRpZmZlcmVuY2U7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKHRvcExlZnRGb3JtYXRJbmZvQml0cyAhPT0gdG9wUmlnaHRCb3R0b21SaWdodEZvcm1hdEluZm9CaXRzKSB7IC8vIGFsc28gdHJ5IHRoZSBvdGhlciBvcHRpb25cbiAgICAgICAgICAgIGRpZmZlcmVuY2UgPSBudW1CaXRzRGlmZmVyaW5nKHRvcFJpZ2h0Qm90dG9tUmlnaHRGb3JtYXRJbmZvQml0cywgYml0cyk7XG4gICAgICAgICAgICBpZiAoZGlmZmVyZW5jZSA8IGJlc3REaWZmZXJlbmNlKSB7XG4gICAgICAgICAgICAgICAgYmVzdEZvcm1hdEluZm8gPSBmb3JtYXRJbmZvO1xuICAgICAgICAgICAgICAgIGJlc3REaWZmZXJlbmNlID0gZGlmZmVyZW5jZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBIYW1taW5nIGRpc3RhbmNlIG9mIHRoZSAzMiBtYXNrZWQgY29kZXMgaXMgNywgYnkgY29uc3RydWN0aW9uLCBzbyA8PSAzIGJpdHMgZGlmZmVyaW5nIG1lYW5zIHdlIGZvdW5kIGEgbWF0Y2hcbiAgICBpZiAoYmVzdERpZmZlcmVuY2UgPD0gMykge1xuICAgICAgICByZXR1cm4gYmVzdEZvcm1hdEluZm87XG4gICAgfVxuICAgIHJldHVybiBudWxsO1xufVxuZnVuY3Rpb24gZ2V0RGF0YUJsb2Nrcyhjb2Rld29yZHMsIHZlcnNpb24sIGVjTGV2ZWwpIHtcbiAgICBjb25zdCBlY0luZm8gPSB2ZXJzaW9uLmVycm9yQ29ycmVjdGlvbkxldmVsc1tlY0xldmVsXTtcbiAgICBjb25zdCBkYXRhQmxvY2tzID0gW107XG4gICAgbGV0IHRvdGFsQ29kZXdvcmRzID0gMDtcbiAgICBlY0luZm8uZWNCbG9ja3MuZm9yRWFjaChibG9jayA9PiB7XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgYmxvY2subnVtQmxvY2tzOyBpKyspIHtcbiAgICAgICAgICAgIGRhdGFCbG9ja3MucHVzaCh7IG51bURhdGFDb2Rld29yZHM6IGJsb2NrLmRhdGFDb2Rld29yZHNQZXJCbG9jaywgY29kZXdvcmRzOiBbXSB9KTtcbiAgICAgICAgICAgIHRvdGFsQ29kZXdvcmRzICs9IGJsb2NrLmRhdGFDb2Rld29yZHNQZXJCbG9jayArIGVjSW5mby5lY0NvZGV3b3Jkc1BlckJsb2NrO1xuICAgICAgICB9XG4gICAgfSk7XG4gICAgLy8gSW4gc29tZSBjYXNlcyB0aGUgUVIgY29kZSB3aWxsIGJlIG1hbGZvcm1lZCBlbm91Z2ggdGhhdCB3ZSBwdWxsIG9mZiBtb3JlIG9yIGxlc3MgdGhhbiB3ZSBzaG91bGQuXG4gICAgLy8gSWYgd2UgcHVsbCBvZmYgbGVzcyB0aGVyZSdzIG5vdGhpbmcgd2UgY2FuIGRvLlxuICAgIC8vIElmIHdlIHB1bGwgb2ZmIG1vcmUgd2UgY2FuIHNhZmVseSB0cnVuY2F0ZVxuICAgIGlmIChjb2Rld29yZHMubGVuZ3RoIDwgdG90YWxDb2Rld29yZHMpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvZGV3b3JkcyA9IGNvZGV3b3Jkcy5zbGljZSgwLCB0b3RhbENvZGV3b3Jkcyk7XG4gICAgY29uc3Qgc2hvcnRCbG9ja1NpemUgPSBlY0luZm8uZWNCbG9ja3NbMF0uZGF0YUNvZGV3b3Jkc1BlckJsb2NrO1xuICAgIC8vIFB1bGwgY29kZXdvcmRzIHRvIGZpbGwgdGhlIGJsb2NrcyB1cCB0byB0aGUgbWluaW11bSBzaXplXG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBzaG9ydEJsb2NrU2l6ZTsgaSsrKSB7XG4gICAgICAgIGZvciAoY29uc3QgZGF0YUJsb2NrIG9mIGRhdGFCbG9ja3MpIHtcbiAgICAgICAgICAgIGRhdGFCbG9jay5jb2Rld29yZHMucHVzaChjb2Rld29yZHMuc2hpZnQoKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgLy8gSWYgdGhlcmUgYXJlIGFueSBsYXJnZSBibG9ja3MsIHB1bGwgY29kZXdvcmRzIHRvIGZpbGwgdGhlIGxhc3QgZWxlbWVudCBvZiB0aG9zZVxuICAgIGlmIChlY0luZm8uZWNCbG9ja3MubGVuZ3RoID4gMSkge1xuICAgICAgICBjb25zdCBzbWFsbEJsb2NrQ291bnQgPSBlY0luZm8uZWNCbG9ja3NbMF0ubnVtQmxvY2tzO1xuICAgICAgICBjb25zdCBsYXJnZUJsb2NrQ291bnQgPSBlY0luZm8uZWNCbG9ja3NbMV0ubnVtQmxvY2tzO1xuICAgICAgICBmb3IgKGxldCBpID0gMDsgaSA8IGxhcmdlQmxvY2tDb3VudDsgaSsrKSB7XG4gICAgICAgICAgICBkYXRhQmxvY2tzW3NtYWxsQmxvY2tDb3VudCArIGldLmNvZGV3b3Jkcy5wdXNoKGNvZGV3b3Jkcy5zaGlmdCgpKTtcbiAgICAgICAgfVxuICAgIH1cbiAgICAvLyBBZGQgdGhlIHJlc3Qgb2YgdGhlIGNvZGV3b3JkcyB0byB0aGUgYmxvY2tzLiBUaGVzZSBhcmUgdGhlIGVycm9yIGNvcnJlY3Rpb24gY29kZXdvcmRzLlxuICAgIHdoaWxlIChjb2Rld29yZHMubGVuZ3RoID4gMCkge1xuICAgICAgICBmb3IgKGNvbnN0IGRhdGFCbG9jayBvZiBkYXRhQmxvY2tzKSB7XG4gICAgICAgICAgICBkYXRhQmxvY2suY29kZXdvcmRzLnB1c2goY29kZXdvcmRzLnNoaWZ0KCkpO1xuICAgICAgICB9XG4gICAgfVxuICAgIHJldHVybiBkYXRhQmxvY2tzO1xufVxuZnVuY3Rpb24gZGVjb2RlTWF0cml4KG1hdHJpeCkge1xuICAgIGNvbnN0IHZlcnNpb24gPSByZWFkVmVyc2lvbihtYXRyaXgpO1xuICAgIGlmICghdmVyc2lvbikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZm9ybWF0SW5mbyA9IHJlYWRGb3JtYXRJbmZvcm1hdGlvbihtYXRyaXgpO1xuICAgIGlmICghZm9ybWF0SW5mbykge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgY29kZXdvcmRzID0gcmVhZENvZGV3b3JkcyhtYXRyaXgsIHZlcnNpb24sIGZvcm1hdEluZm8pO1xuICAgIGNvbnN0IGRhdGFCbG9ja3MgPSBnZXREYXRhQmxvY2tzKGNvZGV3b3JkcywgdmVyc2lvbiwgZm9ybWF0SW5mby5lcnJvckNvcnJlY3Rpb25MZXZlbCk7XG4gICAgaWYgKCFkYXRhQmxvY2tzKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvLyBDb3VudCB0b3RhbCBudW1iZXIgb2YgZGF0YSBieXRlc1xuICAgIGNvbnN0IHRvdGFsQnl0ZXMgPSBkYXRhQmxvY2tzLnJlZHVjZSgoYSwgYikgPT4gYSArIGIubnVtRGF0YUNvZGV3b3JkcywgMCk7XG4gICAgY29uc3QgcmVzdWx0Qnl0ZXMgPSBuZXcgVWludDhDbGFtcGVkQXJyYXkodG90YWxCeXRlcyk7XG4gICAgbGV0IHJlc3VsdEluZGV4ID0gMDtcbiAgICBmb3IgKGNvbnN0IGRhdGFCbG9jayBvZiBkYXRhQmxvY2tzKSB7XG4gICAgICAgIGNvbnN0IGNvcnJlY3RlZEJ5dGVzID0gZGVjb2RlJDEoZGF0YUJsb2NrLmNvZGV3b3JkcywgZGF0YUJsb2NrLmNvZGV3b3Jkcy5sZW5ndGggLSBkYXRhQmxvY2subnVtRGF0YUNvZGV3b3Jkcyk7XG4gICAgICAgIGlmICghY29ycmVjdGVkQnl0ZXMpIHtcbiAgICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIGZvciAobGV0IGkgPSAwOyBpIDwgZGF0YUJsb2NrLm51bURhdGFDb2Rld29yZHM7IGkrKykge1xuICAgICAgICAgICAgcmVzdWx0Qnl0ZXNbcmVzdWx0SW5kZXgrK10gPSBjb3JyZWN0ZWRCeXRlc1tpXTtcbiAgICAgICAgfVxuICAgIH1cbiAgICB0cnkge1xuICAgICAgICByZXR1cm4gZGVjb2RlKHJlc3VsdEJ5dGVzLCB2ZXJzaW9uLnZlcnNpb25OdW1iZXIpO1xuICAgIH1cbiAgICBjYXRjaCAoX2EpIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxufVxuZnVuY3Rpb24gZGVjb2RlJDIobWF0cml4KSB7XG4gICAgaWYgKG1hdHJpeCA9PSBudWxsKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICBjb25zdCByZXN1bHQgPSBkZWNvZGVNYXRyaXgobWF0cml4KTtcbiAgICBpZiAocmVzdWx0KSB7XG4gICAgICAgIHJldHVybiByZXN1bHQ7XG4gICAgfVxuICAgIC8vIERlY29kaW5nIGRpZG4ndCB3b3JrLCB0cnkgbWlycm9yaW5nIHRoZSBRUiBhY3Jvc3MgdGhlIHRvcExlZnQgLT4gYm90dG9tUmlnaHQgbGluZS5cbiAgICBmb3IgKGxldCB4ID0gMDsgeCA8IG1hdHJpeC53aWR0aDsgeCsrKSB7XG4gICAgICAgIGZvciAobGV0IHkgPSB4ICsgMTsgeSA8IG1hdHJpeC5oZWlnaHQ7IHkrKykge1xuICAgICAgICAgICAgaWYgKG1hdHJpeC5nZXQoeCwgeSkgIT09IG1hdHJpeC5nZXQoeSwgeCkpIHtcbiAgICAgICAgICAgICAgICBtYXRyaXguc2V0KHgsIHksICFtYXRyaXguZ2V0KHgsIHkpKTtcbiAgICAgICAgICAgICAgICBtYXRyaXguc2V0KHksIHgsICFtYXRyaXguZ2V0KHksIHgpKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gZGVjb2RlTWF0cml4KG1hdHJpeCk7XG59XG5cbmZ1bmN0aW9uIHNxdWFyZVRvUXVhZHJpbGF0ZXJhbChwMSwgcDIsIHAzLCBwNCkge1xuICAgIGNvbnN0IGR4MyA9IHAxLnggLSBwMi54ICsgcDMueCAtIHA0Lng7XG4gICAgY29uc3QgZHkzID0gcDEueSAtIHAyLnkgKyBwMy55IC0gcDQueTtcbiAgICBpZiAoZHgzID09PSAwICYmIGR5MyA9PT0gMCkgeyAvLyBBZmZpbmVcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIGExMTogcDIueCAtIHAxLngsXG4gICAgICAgICAgICBhMTI6IHAyLnkgLSBwMS55LFxuICAgICAgICAgICAgYTEzOiAwLFxuICAgICAgICAgICAgYTIxOiBwMy54IC0gcDIueCxcbiAgICAgICAgICAgIGEyMjogcDMueSAtIHAyLnksXG4gICAgICAgICAgICBhMjM6IDAsXG4gICAgICAgICAgICBhMzE6IHAxLngsXG4gICAgICAgICAgICBhMzI6IHAxLnksXG4gICAgICAgICAgICBhMzM6IDEsXG4gICAgICAgIH07XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBjb25zdCBkeDEgPSBwMi54IC0gcDMueDtcbiAgICAgICAgY29uc3QgZHgyID0gcDQueCAtIHAzLng7XG4gICAgICAgIGNvbnN0IGR5MSA9IHAyLnkgLSBwMy55O1xuICAgICAgICBjb25zdCBkeTIgPSBwNC55IC0gcDMueTtcbiAgICAgICAgY29uc3QgZGVub21pbmF0b3IgPSBkeDEgKiBkeTIgLSBkeDIgKiBkeTE7XG4gICAgICAgIGNvbnN0IGExMyA9IChkeDMgKiBkeTIgLSBkeDIgKiBkeTMpIC8gZGVub21pbmF0b3I7XG4gICAgICAgIGNvbnN0IGEyMyA9IChkeDEgKiBkeTMgLSBkeDMgKiBkeTEpIC8gZGVub21pbmF0b3I7XG4gICAgICAgIHJldHVybiB7XG4gICAgICAgICAgICBhMTE6IHAyLnggLSBwMS54ICsgYTEzICogcDIueCxcbiAgICAgICAgICAgIGExMjogcDIueSAtIHAxLnkgKyBhMTMgKiBwMi55LFxuICAgICAgICAgICAgYTEzLFxuICAgICAgICAgICAgYTIxOiBwNC54IC0gcDEueCArIGEyMyAqIHA0LngsXG4gICAgICAgICAgICBhMjI6IHA0LnkgLSBwMS55ICsgYTIzICogcDQueSxcbiAgICAgICAgICAgIGEyMyxcbiAgICAgICAgICAgIGEzMTogcDEueCxcbiAgICAgICAgICAgIGEzMjogcDEueSxcbiAgICAgICAgICAgIGEzMzogMSxcbiAgICAgICAgfTtcbiAgICB9XG59XG5mdW5jdGlvbiBxdWFkcmlsYXRlcmFsVG9TcXVhcmUocDEsIHAyLCBwMywgcDQpIHtcbiAgICAvLyBIZXJlLCB0aGUgYWRqb2ludCBzZXJ2ZXMgYXMgdGhlIGludmVyc2U6XG4gICAgY29uc3Qgc1RvUSA9IHNxdWFyZVRvUXVhZHJpbGF0ZXJhbChwMSwgcDIsIHAzLCBwNCk7XG4gICAgcmV0dXJuIHtcbiAgICAgICAgYTExOiBzVG9RLmEyMiAqIHNUb1EuYTMzIC0gc1RvUS5hMjMgKiBzVG9RLmEzMixcbiAgICAgICAgYTEyOiBzVG9RLmExMyAqIHNUb1EuYTMyIC0gc1RvUS5hMTIgKiBzVG9RLmEzMyxcbiAgICAgICAgYTEzOiBzVG9RLmExMiAqIHNUb1EuYTIzIC0gc1RvUS5hMTMgKiBzVG9RLmEyMixcbiAgICAgICAgYTIxOiBzVG9RLmEyMyAqIHNUb1EuYTMxIC0gc1RvUS5hMjEgKiBzVG9RLmEzMyxcbiAgICAgICAgYTIyOiBzVG9RLmExMSAqIHNUb1EuYTMzIC0gc1RvUS5hMTMgKiBzVG9RLmEzMSxcbiAgICAgICAgYTIzOiBzVG9RLmExMyAqIHNUb1EuYTIxIC0gc1RvUS5hMTEgKiBzVG9RLmEyMyxcbiAgICAgICAgYTMxOiBzVG9RLmEyMSAqIHNUb1EuYTMyIC0gc1RvUS5hMjIgKiBzVG9RLmEzMSxcbiAgICAgICAgYTMyOiBzVG9RLmExMiAqIHNUb1EuYTMxIC0gc1RvUS5hMTEgKiBzVG9RLmEzMixcbiAgICAgICAgYTMzOiBzVG9RLmExMSAqIHNUb1EuYTIyIC0gc1RvUS5hMTIgKiBzVG9RLmEyMSxcbiAgICB9O1xufVxuZnVuY3Rpb24gdGltZXMoYSwgYikge1xuICAgIHJldHVybiB7XG4gICAgICAgIGExMTogYS5hMTEgKiBiLmExMSArIGEuYTIxICogYi5hMTIgKyBhLmEzMSAqIGIuYTEzLFxuICAgICAgICBhMTI6IGEuYTEyICogYi5hMTEgKyBhLmEyMiAqIGIuYTEyICsgYS5hMzIgKiBiLmExMyxcbiAgICAgICAgYTEzOiBhLmExMyAqIGIuYTExICsgYS5hMjMgKiBiLmExMiArIGEuYTMzICogYi5hMTMsXG4gICAgICAgIGEyMTogYS5hMTEgKiBiLmEyMSArIGEuYTIxICogYi5hMjIgKyBhLmEzMSAqIGIuYTIzLFxuICAgICAgICBhMjI6IGEuYTEyICogYi5hMjEgKyBhLmEyMiAqIGIuYTIyICsgYS5hMzIgKiBiLmEyMyxcbiAgICAgICAgYTIzOiBhLmExMyAqIGIuYTIxICsgYS5hMjMgKiBiLmEyMiArIGEuYTMzICogYi5hMjMsXG4gICAgICAgIGEzMTogYS5hMTEgKiBiLmEzMSArIGEuYTIxICogYi5hMzIgKyBhLmEzMSAqIGIuYTMzLFxuICAgICAgICBhMzI6IGEuYTEyICogYi5hMzEgKyBhLmEyMiAqIGIuYTMyICsgYS5hMzIgKiBiLmEzMyxcbiAgICAgICAgYTMzOiBhLmExMyAqIGIuYTMxICsgYS5hMjMgKiBiLmEzMiArIGEuYTMzICogYi5hMzMsXG4gICAgfTtcbn1cbmZ1bmN0aW9uIGV4dHJhY3QoaW1hZ2UsIGxvY2F0aW9uKSB7XG4gICAgY29uc3QgcVRvUyA9IHF1YWRyaWxhdGVyYWxUb1NxdWFyZSh7IHg6IDMuNSwgeTogMy41IH0sIHsgeDogbG9jYXRpb24uZGltZW5zaW9uIC0gMy41LCB5OiAzLjUgfSwgeyB4OiBsb2NhdGlvbi5kaW1lbnNpb24gLSA2LjUsIHk6IGxvY2F0aW9uLmRpbWVuc2lvbiAtIDYuNSB9LCB7IHg6IDMuNSwgeTogbG9jYXRpb24uZGltZW5zaW9uIC0gMy41IH0pO1xuICAgIGNvbnN0IHNUb1EgPSBzcXVhcmVUb1F1YWRyaWxhdGVyYWwobG9jYXRpb24udG9wTGVmdCwgbG9jYXRpb24udG9wUmlnaHQsIGxvY2F0aW9uLmFsaWdubWVudFBhdHRlcm4sIGxvY2F0aW9uLmJvdHRvbUxlZnQpO1xuICAgIGNvbnN0IHRyYW5zZm9ybSA9IHRpbWVzKHNUb1EsIHFUb1MpO1xuICAgIGNvbnN0IG1hdHJpeCA9IEJpdE1hdHJpeC5jcmVhdGVFbXB0eShsb2NhdGlvbi5kaW1lbnNpb24sIGxvY2F0aW9uLmRpbWVuc2lvbik7XG4gICAgY29uc3QgbWFwcGluZ0Z1bmN0aW9uID0gKHgsIHkpID0+IHtcbiAgICAgICAgY29uc3QgZGVub21pbmF0b3IgPSB0cmFuc2Zvcm0uYTEzICogeCArIHRyYW5zZm9ybS5hMjMgKiB5ICsgdHJhbnNmb3JtLmEzMztcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgIHg6ICh0cmFuc2Zvcm0uYTExICogeCArIHRyYW5zZm9ybS5hMjEgKiB5ICsgdHJhbnNmb3JtLmEzMSkgLyBkZW5vbWluYXRvcixcbiAgICAgICAgICAgIHk6ICh0cmFuc2Zvcm0uYTEyICogeCArIHRyYW5zZm9ybS5hMjIgKiB5ICsgdHJhbnNmb3JtLmEzMikgLyBkZW5vbWluYXRvcixcbiAgICAgICAgfTtcbiAgICB9O1xuICAgIGZvciAobGV0IHkgPSAwOyB5IDwgbG9jYXRpb24uZGltZW5zaW9uOyB5KyspIHtcbiAgICAgICAgZm9yIChsZXQgeCA9IDA7IHggPCBsb2NhdGlvbi5kaW1lbnNpb247IHgrKykge1xuICAgICAgICAgICAgY29uc3QgeFZhbHVlID0geCArIDAuNTtcbiAgICAgICAgICAgIGNvbnN0IHlWYWx1ZSA9IHkgKyAwLjU7XG4gICAgICAgICAgICBjb25zdCBzb3VyY2VQaXhlbCA9IG1hcHBpbmdGdW5jdGlvbih4VmFsdWUsIHlWYWx1ZSk7XG4gICAgICAgICAgICBtYXRyaXguc2V0KHgsIHksIGltYWdlLmdldChNYXRoLmZsb29yKHNvdXJjZVBpeGVsLngpLCBNYXRoLmZsb29yKHNvdXJjZVBpeGVsLnkpKSk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIHtcbiAgICAgICAgbWF0cml4LFxuICAgICAgICBtYXBwaW5nRnVuY3Rpb24sXG4gICAgfTtcbn1cblxuY29uc3QgTUFYX0ZJTkRFUlBBVFRFUk5TX1RPX1NFQVJDSCA9IDQ7XG5jb25zdCBNSU5fUVVBRF9SQVRJTyA9IDAuNTtcbmNvbnN0IE1BWF9RVUFEX1JBVElPID0gMS41O1xuY29uc3QgZGlzdGFuY2UgPSAoYSwgYikgPT4gTWF0aC5zcXJ0KE1hdGgucG93KChiLnggLSBhLngpLCAyKSArIE1hdGgucG93KChiLnkgLSBhLnkpLCAyKSk7XG5mdW5jdGlvbiBzdW0odmFsdWVzKSB7XG4gICAgcmV0dXJuIHZhbHVlcy5yZWR1Y2UoKGEsIGIpID0+IGEgKyBiKTtcbn1cbi8vIFRha2VzIHRocmVlIGZpbmRlciBwYXR0ZXJucyBhbmQgb3JnYW5pemVzIHRoZW0gaW50byB0b3BMZWZ0LCB0b3BSaWdodCwgZXRjXG5mdW5jdGlvbiByZW9yZGVyRmluZGVyUGF0dGVybnMocGF0dGVybjEsIHBhdHRlcm4yLCBwYXR0ZXJuMykge1xuICAgIC8vIEZpbmQgZGlzdGFuY2VzIGJldHdlZW4gcGF0dGVybiBjZW50ZXJzXG4gICAgY29uc3Qgb25lVHdvRGlzdGFuY2UgPSBkaXN0YW5jZShwYXR0ZXJuMSwgcGF0dGVybjIpO1xuICAgIGNvbnN0IHR3b1RocmVlRGlzdGFuY2UgPSBkaXN0YW5jZShwYXR0ZXJuMiwgcGF0dGVybjMpO1xuICAgIGNvbnN0IG9uZVRocmVlRGlzdGFuY2UgPSBkaXN0YW5jZShwYXR0ZXJuMSwgcGF0dGVybjMpO1xuICAgIGxldCBib3R0b21MZWZ0O1xuICAgIGxldCB0b3BMZWZ0O1xuICAgIGxldCB0b3BSaWdodDtcbiAgICAvLyBBc3N1bWUgb25lIGNsb3Nlc3QgdG8gb3RoZXIgdHdvIGlzIEI7IEEgYW5kIEMgd2lsbCBqdXN0IGJlIGd1ZXNzZXMgYXQgZmlyc3RcbiAgICBpZiAodHdvVGhyZWVEaXN0YW5jZSA+PSBvbmVUd29EaXN0YW5jZSAmJiB0d29UaHJlZURpc3RhbmNlID49IG9uZVRocmVlRGlzdGFuY2UpIHtcbiAgICAgICAgW2JvdHRvbUxlZnQsIHRvcExlZnQsIHRvcFJpZ2h0XSA9IFtwYXR0ZXJuMiwgcGF0dGVybjEsIHBhdHRlcm4zXTtcbiAgICB9XG4gICAgZWxzZSBpZiAob25lVGhyZWVEaXN0YW5jZSA+PSB0d29UaHJlZURpc3RhbmNlICYmIG9uZVRocmVlRGlzdGFuY2UgPj0gb25lVHdvRGlzdGFuY2UpIHtcbiAgICAgICAgW2JvdHRvbUxlZnQsIHRvcExlZnQsIHRvcFJpZ2h0XSA9IFtwYXR0ZXJuMSwgcGF0dGVybjIsIHBhdHRlcm4zXTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIFtib3R0b21MZWZ0LCB0b3BMZWZ0LCB0b3BSaWdodF0gPSBbcGF0dGVybjEsIHBhdHRlcm4zLCBwYXR0ZXJuMl07XG4gICAgfVxuICAgIC8vIFVzZSBjcm9zcyBwcm9kdWN0IHRvIGZpZ3VyZSBvdXQgd2hldGhlciBib3R0b21MZWZ0IChBKSBhbmQgdG9wUmlnaHQgKEMpIGFyZSBjb3JyZWN0IG9yIGZsaXBwZWQgaW4gcmVsYXRpb24gdG8gdG9wTGVmdCAoQilcbiAgICAvLyBUaGlzIGFza3Mgd2hldGhlciBCQyB4IEJBIGhhcyBhIHBvc2l0aXZlIHogY29tcG9uZW50LCB3aGljaCBpcyB0aGUgYXJyYW5nZW1lbnQgd2Ugd2FudC4gSWYgaXQncyBuZWdhdGl2ZSwgdGhlblxuICAgIC8vIHdlJ3ZlIGdvdCBpdCBmbGlwcGVkIGFyb3VuZCBhbmQgc2hvdWxkIHN3YXAgdG9wUmlnaHQgYW5kIGJvdHRvbUxlZnQuXG4gICAgaWYgKCgodG9wUmlnaHQueCAtIHRvcExlZnQueCkgKiAoYm90dG9tTGVmdC55IC0gdG9wTGVmdC55KSkgLSAoKHRvcFJpZ2h0LnkgLSB0b3BMZWZ0LnkpICogKGJvdHRvbUxlZnQueCAtIHRvcExlZnQueCkpIDwgMCkge1xuICAgICAgICBbYm90dG9tTGVmdCwgdG9wUmlnaHRdID0gW3RvcFJpZ2h0LCBib3R0b21MZWZ0XTtcbiAgICB9XG4gICAgcmV0dXJuIHsgYm90dG9tTGVmdCwgdG9wTGVmdCwgdG9wUmlnaHQgfTtcbn1cbi8vIENvbXB1dGVzIHRoZSBkaW1lbnNpb24gKG51bWJlciBvZiBtb2R1bGVzIG9uIGEgc2lkZSkgb2YgdGhlIFFSIENvZGUgYmFzZWQgb24gdGhlIHBvc2l0aW9uIG9mIHRoZSBmaW5kZXIgcGF0dGVybnNcbmZ1bmN0aW9uIGNvbXB1dGVEaW1lbnNpb24odG9wTGVmdCwgdG9wUmlnaHQsIGJvdHRvbUxlZnQsIG1hdHJpeCkge1xuICAgIGNvbnN0IG1vZHVsZVNpemUgPSAoc3VtKGNvdW50QmxhY2tXaGl0ZVJ1bih0b3BMZWZ0LCBib3R0b21MZWZ0LCBtYXRyaXgsIDUpKSAvIDcgKyAvLyBEaXZpZGUgYnkgNyBzaW5jZSB0aGUgcmF0aW8gaXMgMToxOjM6MToxXG4gICAgICAgIHN1bShjb3VudEJsYWNrV2hpdGVSdW4odG9wTGVmdCwgdG9wUmlnaHQsIG1hdHJpeCwgNSkpIC8gNyArXG4gICAgICAgIHN1bShjb3VudEJsYWNrV2hpdGVSdW4oYm90dG9tTGVmdCwgdG9wTGVmdCwgbWF0cml4LCA1KSkgLyA3ICtcbiAgICAgICAgc3VtKGNvdW50QmxhY2tXaGl0ZVJ1bih0b3BSaWdodCwgdG9wTGVmdCwgbWF0cml4LCA1KSkgLyA3KSAvIDQ7XG4gICAgaWYgKG1vZHVsZVNpemUgPCAxKSB7XG4gICAgICAgIHRocm93IG5ldyBFcnJvcihcIkludmFsaWQgbW9kdWxlIHNpemVcIik7XG4gICAgfVxuICAgIGNvbnN0IHRvcERpbWVuc2lvbiA9IE1hdGgucm91bmQoZGlzdGFuY2UodG9wTGVmdCwgdG9wUmlnaHQpIC8gbW9kdWxlU2l6ZSk7XG4gICAgY29uc3Qgc2lkZURpbWVuc2lvbiA9IE1hdGgucm91bmQoZGlzdGFuY2UodG9wTGVmdCwgYm90dG9tTGVmdCkgLyBtb2R1bGVTaXplKTtcbiAgICBsZXQgZGltZW5zaW9uID0gTWF0aC5mbG9vcigodG9wRGltZW5zaW9uICsgc2lkZURpbWVuc2lvbikgLyAyKSArIDc7XG4gICAgc3dpdGNoIChkaW1lbnNpb24gJSA0KSB7XG4gICAgICAgIGNhc2UgMDpcbiAgICAgICAgICAgIGRpbWVuc2lvbisrO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIGNhc2UgMjpcbiAgICAgICAgICAgIGRpbWVuc2lvbi0tO1xuICAgICAgICAgICAgYnJlYWs7XG4gICAgfVxuICAgIHJldHVybiB7IGRpbWVuc2lvbiwgbW9kdWxlU2l6ZSB9O1xufVxuLy8gVGFrZXMgYW4gb3JpZ2luIHBvaW50IGFuZCBhbiBlbmQgcG9pbnQgYW5kIGNvdW50cyB0aGUgc2l6ZXMgb2YgdGhlIGJsYWNrIHdoaXRlIHJ1biBmcm9tIHRoZSBvcmlnaW4gdG93YXJkcyB0aGUgZW5kIHBvaW50LlxuLy8gUmV0dXJucyBhbiBhcnJheSBvZiBlbGVtZW50cywgcmVwcmVzZW50aW5nIHRoZSBwaXhlbCBzaXplIG9mIHRoZSBibGFjayB3aGl0ZSBydW4uXG4vLyBVc2VzIGEgdmFyaWFudCBvZiBodHRwOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0JyZXNlbmhhbSdzX2xpbmVfYWxnb3JpdGhtXG5mdW5jdGlvbiBjb3VudEJsYWNrV2hpdGVSdW5Ub3dhcmRzUG9pbnQob3JpZ2luLCBlbmQsIG1hdHJpeCwgbGVuZ3RoKSB7XG4gICAgY29uc3Qgc3dpdGNoUG9pbnRzID0gW3sgeDogTWF0aC5mbG9vcihvcmlnaW4ueCksIHk6IE1hdGguZmxvb3Iob3JpZ2luLnkpIH1dO1xuICAgIGNvbnN0IHN0ZWVwID0gTWF0aC5hYnMoZW5kLnkgLSBvcmlnaW4ueSkgPiBNYXRoLmFicyhlbmQueCAtIG9yaWdpbi54KTtcbiAgICBsZXQgZnJvbVg7XG4gICAgbGV0IGZyb21ZO1xuICAgIGxldCB0b1g7XG4gICAgbGV0IHRvWTtcbiAgICBpZiAoc3RlZXApIHtcbiAgICAgICAgZnJvbVggPSBNYXRoLmZsb29yKG9yaWdpbi55KTtcbiAgICAgICAgZnJvbVkgPSBNYXRoLmZsb29yKG9yaWdpbi54KTtcbiAgICAgICAgdG9YID0gTWF0aC5mbG9vcihlbmQueSk7XG4gICAgICAgIHRvWSA9IE1hdGguZmxvb3IoZW5kLngpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZnJvbVggPSBNYXRoLmZsb29yKG9yaWdpbi54KTtcbiAgICAgICAgZnJvbVkgPSBNYXRoLmZsb29yKG9yaWdpbi55KTtcbiAgICAgICAgdG9YID0gTWF0aC5mbG9vcihlbmQueCk7XG4gICAgICAgIHRvWSA9IE1hdGguZmxvb3IoZW5kLnkpO1xuICAgIH1cbiAgICBjb25zdCBkeCA9IE1hdGguYWJzKHRvWCAtIGZyb21YKTtcbiAgICBjb25zdCBkeSA9IE1hdGguYWJzKHRvWSAtIGZyb21ZKTtcbiAgICBsZXQgZXJyb3IgPSBNYXRoLmZsb29yKC1keCAvIDIpO1xuICAgIGNvbnN0IHhTdGVwID0gZnJvbVggPCB0b1ggPyAxIDogLTE7XG4gICAgY29uc3QgeVN0ZXAgPSBmcm9tWSA8IHRvWSA/IDEgOiAtMTtcbiAgICBsZXQgY3VycmVudFBpeGVsID0gdHJ1ZTtcbiAgICAvLyBMb29wIHVwIHVudGlsIHggPT0gdG9YLCBidXQgbm90IGJleW9uZFxuICAgIGZvciAobGV0IHggPSBmcm9tWCwgeSA9IGZyb21ZOyB4ICE9PSB0b1ggKyB4U3RlcDsgeCArPSB4U3RlcCkge1xuICAgICAgICAvLyBEb2VzIGN1cnJlbnQgcGl4ZWwgbWVhbiB3ZSBoYXZlIG1vdmVkIHdoaXRlIHRvIGJsYWNrIG9yIHZpY2UgdmVyc2E/XG4gICAgICAgIC8vIFNjYW5uaW5nIGJsYWNrIGluIHN0YXRlIDAsMiBhbmQgd2hpdGUgaW4gc3RhdGUgMSwgc28gaWYgd2UgZmluZCB0aGUgd3JvbmdcbiAgICAgICAgLy8gY29sb3IsIGFkdmFuY2UgdG8gbmV4dCBzdGF0ZSBvciBlbmQgaWYgd2UgYXJlIGluIHN0YXRlIDIgYWxyZWFkeVxuICAgICAgICBjb25zdCByZWFsWCA9IHN0ZWVwID8geSA6IHg7XG4gICAgICAgIGNvbnN0IHJlYWxZID0gc3RlZXAgPyB4IDogeTtcbiAgICAgICAgaWYgKG1hdHJpeC5nZXQocmVhbFgsIHJlYWxZKSAhPT0gY3VycmVudFBpeGVsKSB7XG4gICAgICAgICAgICBjdXJyZW50UGl4ZWwgPSAhY3VycmVudFBpeGVsO1xuICAgICAgICAgICAgc3dpdGNoUG9pbnRzLnB1c2goeyB4OiByZWFsWCwgeTogcmVhbFkgfSk7XG4gICAgICAgICAgICBpZiAoc3dpdGNoUG9pbnRzLmxlbmd0aCA9PT0gbGVuZ3RoICsgMSkge1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGVycm9yICs9IGR5O1xuICAgICAgICBpZiAoZXJyb3IgPiAwKSB7XG4gICAgICAgICAgICBpZiAoeSA9PT0gdG9ZKSB7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB5ICs9IHlTdGVwO1xuICAgICAgICAgICAgZXJyb3IgLT0gZHg7XG4gICAgICAgIH1cbiAgICB9XG4gICAgY29uc3QgZGlzdGFuY2VzID0gW107XG4gICAgZm9yIChsZXQgaSA9IDA7IGkgPCBsZW5ndGg7IGkrKykge1xuICAgICAgICBpZiAoc3dpdGNoUG9pbnRzW2ldICYmIHN3aXRjaFBvaW50c1tpICsgMV0pIHtcbiAgICAgICAgICAgIGRpc3RhbmNlcy5wdXNoKGRpc3RhbmNlKHN3aXRjaFBvaW50c1tpXSwgc3dpdGNoUG9pbnRzW2kgKyAxXSkpO1xuICAgICAgICB9XG4gICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgZGlzdGFuY2VzLnB1c2goMCk7XG4gICAgICAgIH1cbiAgICB9XG4gICAgcmV0dXJuIGRpc3RhbmNlcztcbn1cbi8vIFRha2VzIGFuIG9yaWdpbiBwb2ludCBhbmQgYW4gZW5kIHBvaW50IGFuZCBjb3VudHMgdGhlIHNpemVzIG9mIHRoZSBibGFjayB3aGl0ZSBydW4gaW4gdGhlIG9yaWdpbiBwb2ludFxuLy8gYWxvbmcgdGhlIGxpbmUgdGhhdCBpbnRlcnNlY3RzIHdpdGggdGhlIGVuZCBwb2ludC4gUmV0dXJucyBhbiBhcnJheSBvZiBlbGVtZW50cywgcmVwcmVzZW50aW5nIHRoZSBwaXhlbCBzaXplc1xuLy8gb2YgdGhlIGJsYWNrIHdoaXRlIHJ1bi4gVGFrZXMgYSBsZW5ndGggd2hpY2ggcmVwcmVzZW50cyB0aGUgbnVtYmVyIG9mIHN3aXRjaGVzIGZyb20gYmxhY2sgdG8gd2hpdGUgdG8gbG9vayBmb3IuXG5mdW5jdGlvbiBjb3VudEJsYWNrV2hpdGVSdW4ob3JpZ2luLCBlbmQsIG1hdHJpeCwgbGVuZ3RoKSB7XG4gICAgY29uc3QgcmlzZSA9IGVuZC55IC0gb3JpZ2luLnk7XG4gICAgY29uc3QgcnVuID0gZW5kLnggLSBvcmlnaW4ueDtcbiAgICBjb25zdCB0b3dhcmRzRW5kID0gY291bnRCbGFja1doaXRlUnVuVG93YXJkc1BvaW50KG9yaWdpbiwgZW5kLCBtYXRyaXgsIE1hdGguY2VpbChsZW5ndGggLyAyKSk7XG4gICAgY29uc3QgYXdheUZyb21FbmQgPSBjb3VudEJsYWNrV2hpdGVSdW5Ub3dhcmRzUG9pbnQob3JpZ2luLCB7IHg6IG9yaWdpbi54IC0gcnVuLCB5OiBvcmlnaW4ueSAtIHJpc2UgfSwgbWF0cml4LCBNYXRoLmNlaWwobGVuZ3RoIC8gMikpO1xuICAgIGNvbnN0IG1pZGRsZVZhbHVlID0gdG93YXJkc0VuZC5zaGlmdCgpICsgYXdheUZyb21FbmQuc2hpZnQoKSAtIDE7IC8vIFN1YnN0cmFjdCBvbmUgc28gd2UgZG9uJ3QgZG91YmxlIGNvdW50IGEgcGl4ZWxcbiAgICByZXR1cm4gYXdheUZyb21FbmQuY29uY2F0KG1pZGRsZVZhbHVlKS5jb25jYXQoLi4udG93YXJkc0VuZCk7XG59XG4vLyBUYWtlcyBpbiBhIGJsYWNrIHdoaXRlIHJ1biBhbmQgYW4gYXJyYXkgb2YgZXhwZWN0ZWQgcmF0aW9zLiBSZXR1cm5zIHRoZSBhdmVyYWdlIHNpemUgb2YgdGhlIHJ1biBhcyB3ZWxsIGFzIHRoZSBcImVycm9yXCIgLVxuLy8gdGhhdCBpcyB0aGUgYW1vdW50IHRoZSBydW4gZGl2ZXJnZXMgZnJvbSB0aGUgZXhwZWN0ZWQgcmF0aW9cbmZ1bmN0aW9uIHNjb3JlQmxhY2tXaGl0ZVJ1bihzZXF1ZW5jZSwgcmF0aW9zKSB7XG4gICAgY29uc3QgYXZlcmFnZVNpemUgPSBzdW0oc2VxdWVuY2UpIC8gc3VtKHJhdGlvcyk7XG4gICAgbGV0IGVycm9yID0gMDtcbiAgICByYXRpb3MuZm9yRWFjaCgocmF0aW8sIGkpID0+IHtcbiAgICAgICAgZXJyb3IgKz0gTWF0aC5wb3coKHNlcXVlbmNlW2ldIC0gcmF0aW8gKiBhdmVyYWdlU2l6ZSksIDIpO1xuICAgIH0pO1xuICAgIHJldHVybiB7IGF2ZXJhZ2VTaXplLCBlcnJvciB9O1xufVxuLy8gVGFrZXMgYW4gWCxZIHBvaW50IGFuZCBhbiBhcnJheSBvZiBzaXplcyBhbmQgc2NvcmVzIHRoZSBwb2ludCBhZ2FpbnN0IHRob3NlIHJhdGlvcy5cbi8vIEZvciBleGFtcGxlIGZvciBhIGZpbmRlciBwYXR0ZXJuIHRha2VzIHRoZSByYXRpbyBsaXN0IG9mIDE6MTozOjE6MSBhbmQgY2hlY2tzIGhvcml6b250YWwsIHZlcnRpY2FsIGFuZCBkaWFnb25hbCByYXRpb3Ncbi8vIGFnYWluc3QgdGhhdC5cbmZ1bmN0aW9uIHNjb3JlUGF0dGVybihwb2ludCwgcmF0aW9zLCBtYXRyaXgpIHtcbiAgICB0cnkge1xuICAgICAgICBjb25zdCBob3Jpem9udGFsUnVuID0gY291bnRCbGFja1doaXRlUnVuKHBvaW50LCB7IHg6IC0xLCB5OiBwb2ludC55IH0sIG1hdHJpeCwgcmF0aW9zLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHZlcnRpY2FsUnVuID0gY291bnRCbGFja1doaXRlUnVuKHBvaW50LCB7IHg6IHBvaW50LngsIHk6IC0xIH0sIG1hdHJpeCwgcmF0aW9zLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IHRvcExlZnRQb2ludCA9IHtcbiAgICAgICAgICAgIHg6IE1hdGgubWF4KDAsIHBvaW50LnggLSBwb2ludC55KSAtIDEsXG4gICAgICAgICAgICB5OiBNYXRoLm1heCgwLCBwb2ludC55IC0gcG9pbnQueCkgLSAxLFxuICAgICAgICB9O1xuICAgICAgICBjb25zdCB0b3BMZWZ0Qm90dG9tUmlnaHRSdW4gPSBjb3VudEJsYWNrV2hpdGVSdW4ocG9pbnQsIHRvcExlZnRQb2ludCwgbWF0cml4LCByYXRpb3MubGVuZ3RoKTtcbiAgICAgICAgY29uc3QgYm90dG9tTGVmdFBvaW50ID0ge1xuICAgICAgICAgICAgeDogTWF0aC5taW4obWF0cml4LndpZHRoLCBwb2ludC54ICsgcG9pbnQueSkgKyAxLFxuICAgICAgICAgICAgeTogTWF0aC5taW4obWF0cml4LmhlaWdodCwgcG9pbnQueSArIHBvaW50LngpICsgMSxcbiAgICAgICAgfTtcbiAgICAgICAgY29uc3QgYm90dG9tTGVmdFRvcFJpZ2h0UnVuID0gY291bnRCbGFja1doaXRlUnVuKHBvaW50LCBib3R0b21MZWZ0UG9pbnQsIG1hdHJpeCwgcmF0aW9zLmxlbmd0aCk7XG4gICAgICAgIGNvbnN0IGhvcnpFcnJvciA9IHNjb3JlQmxhY2tXaGl0ZVJ1bihob3Jpem9udGFsUnVuLCByYXRpb3MpO1xuICAgICAgICBjb25zdCB2ZXJ0RXJyb3IgPSBzY29yZUJsYWNrV2hpdGVSdW4odmVydGljYWxSdW4sIHJhdGlvcyk7XG4gICAgICAgIGNvbnN0IGRpYWdEb3duRXJyb3IgPSBzY29yZUJsYWNrV2hpdGVSdW4odG9wTGVmdEJvdHRvbVJpZ2h0UnVuLCByYXRpb3MpO1xuICAgICAgICBjb25zdCBkaWFnVXBFcnJvciA9IHNjb3JlQmxhY2tXaGl0ZVJ1bihib3R0b21MZWZ0VG9wUmlnaHRSdW4sIHJhdGlvcyk7XG4gICAgICAgIGNvbnN0IHJhdGlvRXJyb3IgPSBNYXRoLnNxcnQoaG9yekVycm9yLmVycm9yICogaG9yekVycm9yLmVycm9yICtcbiAgICAgICAgICAgIHZlcnRFcnJvci5lcnJvciAqIHZlcnRFcnJvci5lcnJvciArXG4gICAgICAgICAgICBkaWFnRG93bkVycm9yLmVycm9yICogZGlhZ0Rvd25FcnJvci5lcnJvciArXG4gICAgICAgICAgICBkaWFnVXBFcnJvci5lcnJvciAqIGRpYWdVcEVycm9yLmVycm9yKTtcbiAgICAgICAgY29uc3QgYXZnU2l6ZSA9IChob3J6RXJyb3IuYXZlcmFnZVNpemUgKyB2ZXJ0RXJyb3IuYXZlcmFnZVNpemUgKyBkaWFnRG93bkVycm9yLmF2ZXJhZ2VTaXplICsgZGlhZ1VwRXJyb3IuYXZlcmFnZVNpemUpIC8gNDtcbiAgICAgICAgY29uc3Qgc2l6ZUVycm9yID0gKE1hdGgucG93KChob3J6RXJyb3IuYXZlcmFnZVNpemUgLSBhdmdTaXplKSwgMikgK1xuICAgICAgICAgICAgTWF0aC5wb3coKHZlcnRFcnJvci5hdmVyYWdlU2l6ZSAtIGF2Z1NpemUpLCAyKSArXG4gICAgICAgICAgICBNYXRoLnBvdygoZGlhZ0Rvd25FcnJvci5hdmVyYWdlU2l6ZSAtIGF2Z1NpemUpLCAyKSArXG4gICAgICAgICAgICBNYXRoLnBvdygoZGlhZ1VwRXJyb3IuYXZlcmFnZVNpemUgLSBhdmdTaXplKSwgMikpIC8gYXZnU2l6ZTtcbiAgICAgICAgcmV0dXJuIHJhdGlvRXJyb3IgKyBzaXplRXJyb3I7XG4gICAgfVxuICAgIGNhdGNoIChfYSkge1xuICAgICAgICByZXR1cm4gSW5maW5pdHk7XG4gICAgfVxufVxuZnVuY3Rpb24gbG9jYXRlKG1hdHJpeCkge1xuICAgIGNvbnN0IGZpbmRlclBhdHRlcm5RdWFkcyA9IFtdO1xuICAgIGxldCBhY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMgPSBbXTtcbiAgICBjb25zdCBhbGlnbm1lbnRQYXR0ZXJuUXVhZHMgPSBbXTtcbiAgICBsZXQgYWN0aXZlQWxpZ25tZW50UGF0dGVyblF1YWRzID0gW107XG4gICAgZm9yIChsZXQgeSA9IDA7IHkgPD0gbWF0cml4LmhlaWdodDsgeSsrKSB7XG4gICAgICAgIGxldCBsZW5ndGggPSAwO1xuICAgICAgICBsZXQgbGFzdEJpdCA9IGZhbHNlO1xuICAgICAgICBsZXQgc2NhbnMgPSBbMCwgMCwgMCwgMCwgMF07XG4gICAgICAgIGZvciAobGV0IHggPSAtMTsgeCA8PSBtYXRyaXgud2lkdGg7IHgrKykge1xuICAgICAgICAgICAgY29uc3QgdiA9IG1hdHJpeC5nZXQoeCwgeSk7XG4gICAgICAgICAgICBpZiAodiA9PT0gbGFzdEJpdCkge1xuICAgICAgICAgICAgICAgIGxlbmd0aCsrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgc2NhbnMgPSBbc2NhbnNbMV0sIHNjYW5zWzJdLCBzY2Fuc1szXSwgc2NhbnNbNF0sIGxlbmd0aF07XG4gICAgICAgICAgICAgICAgbGVuZ3RoID0gMTtcbiAgICAgICAgICAgICAgICBsYXN0Qml0ID0gdjtcbiAgICAgICAgICAgICAgICAvLyBEbyB0aGUgbGFzdCA1IGNvbG9yIGNoYW5nZXMgfiBtYXRjaCB0aGUgZXhwZWN0ZWQgcmF0aW8gZm9yIGEgZmluZGVyIHBhdHRlcm4/IDE6MTozOjE6MSBvZiBiOnc6Yjp3OmJcbiAgICAgICAgICAgICAgICBjb25zdCBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSA9IHN1bShzY2FucykgLyA3O1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkRmluZGVyUGF0dGVybiA9IE1hdGguYWJzKHNjYW5zWzBdIC0gYXZlcmFnZUZpbmRlclBhdHRlcm5CbG9ja3NpemUpIDwgYXZlcmFnZUZpbmRlclBhdHRlcm5CbG9ja3NpemUgJiZcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoc2NhbnNbMV0gLSBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSkgPCBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSAmJlxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhzY2Fuc1syXSAtIDMgKiBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSkgPCAzICogYXZlcmFnZUZpbmRlclBhdHRlcm5CbG9ja3NpemUgJiZcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoc2NhbnNbM10gLSBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSkgPCBhdmVyYWdlRmluZGVyUGF0dGVybkJsb2Nrc2l6ZSAmJlxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhzY2Fuc1s0XSAtIGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplKSA8IGF2ZXJhZ2VGaW5kZXJQYXR0ZXJuQmxvY2tzaXplICYmXG4gICAgICAgICAgICAgICAgICAgICF2OyAvLyBBbmQgbWFrZSBzdXJlIHRoZSBjdXJyZW50IHBpeGVsIGlzIHdoaXRlIHNpbmNlIGZpbmRlciBwYXR0ZXJucyBhcmUgYm9yZGVyZWQgaW4gd2hpdGVcbiAgICAgICAgICAgICAgICAvLyBEbyB0aGUgbGFzdCAzIGNvbG9yIGNoYW5nZXMgfiBtYXRjaCB0aGUgZXhwZWN0ZWQgcmF0aW8gZm9yIGFuIGFsaWdubWVudCBwYXR0ZXJuPyAxOjE6MSBvZiB3OmI6d1xuICAgICAgICAgICAgICAgIGNvbnN0IGF2ZXJhZ2VBbGlnbm1lbnRQYXR0ZXJuQmxvY2tzaXplID0gc3VtKHNjYW5zLnNsaWNlKC0zKSkgLyAzO1xuICAgICAgICAgICAgICAgIGNvbnN0IHZhbGlkQWxpZ25tZW50UGF0dGVybiA9IE1hdGguYWJzKHNjYW5zWzJdIC0gYXZlcmFnZUFsaWdubWVudFBhdHRlcm5CbG9ja3NpemUpIDwgYXZlcmFnZUFsaWdubWVudFBhdHRlcm5CbG9ja3NpemUgJiZcbiAgICAgICAgICAgICAgICAgICAgTWF0aC5hYnMoc2NhbnNbM10gLSBhdmVyYWdlQWxpZ25tZW50UGF0dGVybkJsb2Nrc2l6ZSkgPCBhdmVyYWdlQWxpZ25tZW50UGF0dGVybkJsb2Nrc2l6ZSAmJlxuICAgICAgICAgICAgICAgICAgICBNYXRoLmFicyhzY2Fuc1s0XSAtIGF2ZXJhZ2VBbGlnbm1lbnRQYXR0ZXJuQmxvY2tzaXplKSA8IGF2ZXJhZ2VBbGlnbm1lbnRQYXR0ZXJuQmxvY2tzaXplICYmXG4gICAgICAgICAgICAgICAgICAgIHY7IC8vIElzIHRoZSBjdXJyZW50IHBpeGVsIGJsYWNrIHNpbmNlIGFsaWdubWVudCBwYXR0ZXJucyBhcmUgYm9yZGVyZWQgaW4gYmxhY2tcbiAgICAgICAgICAgICAgICBpZiAodmFsaWRGaW5kZXJQYXR0ZXJuKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIHN0YXJ0IGFuZCBlbmQgeCB2YWx1ZXMgb2YgdGhlIGxhcmdlIGNlbnRlciBibGFjayBzcXVhcmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5kWCA9IHggLSBzY2Fuc1szXSAtIHNjYW5zWzRdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBzdGFydFggPSBlbmRYIC0gc2NhbnNbMl07XG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IGxpbmUgPSB7IHN0YXJ0WCwgZW5kWCwgeSB9O1xuICAgICAgICAgICAgICAgICAgICAvLyBJcyB0aGVyZSBhIHF1YWQgZGlyZWN0bHkgYWJvdmUgdGhlIGN1cnJlbnQgc3BvdD8gSWYgc28sIGV4dGVuZCBpdCB3aXRoIHRoZSBuZXcgbGluZS4gT3RoZXJ3aXNlLCBjcmVhdGUgYSBuZXcgcXVhZCB3aXRoXG4gICAgICAgICAgICAgICAgICAgIC8vIHRoYXQgbGluZSBhcyB0aGUgc3RhcnRpbmcgcG9pbnQuXG4gICAgICAgICAgICAgICAgICAgIGNvbnN0IG1hdGNoaW5nUXVhZHMgPSBhY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMuZmlsdGVyKHEgPT4gKHN0YXJ0WCA+PSBxLmJvdHRvbS5zdGFydFggJiYgc3RhcnRYIDw9IHEuYm90dG9tLmVuZFgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoZW5kWCA+PSBxLmJvdHRvbS5zdGFydFggJiYgc3RhcnRYIDw9IHEuYm90dG9tLmVuZFgpIHx8XG4gICAgICAgICAgICAgICAgICAgICAgICAoc3RhcnRYIDw9IHEuYm90dG9tLnN0YXJ0WCAmJiBlbmRYID49IHEuYm90dG9tLmVuZFggJiYgKChzY2Fuc1syXSAvIChxLmJvdHRvbS5lbmRYIC0gcS5ib3R0b20uc3RhcnRYKSkgPCBNQVhfUVVBRF9SQVRJTyAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIChzY2Fuc1syXSAvIChxLmJvdHRvbS5lbmRYIC0gcS5ib3R0b20uc3RhcnRYKSkgPiBNSU5fUVVBRF9SQVRJTykpKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKG1hdGNoaW5nUXVhZHMubGVuZ3RoID4gMCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbWF0Y2hpbmdRdWFkc1swXS5ib3R0b20gPSBsaW5lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aXZlRmluZGVyUGF0dGVyblF1YWRzLnB1c2goeyB0b3A6IGxpbmUsIGJvdHRvbTogbGluZSB9KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAodmFsaWRBbGlnbm1lbnRQYXR0ZXJuKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIENvbXB1dGUgdGhlIHN0YXJ0IGFuZCBlbmQgeCB2YWx1ZXMgb2YgdGhlIGNlbnRlciBibGFjayBzcXVhcmVcbiAgICAgICAgICAgICAgICAgICAgY29uc3QgZW5kWCA9IHggLSBzY2Fuc1s0XTtcbiAgICAgICAgICAgICAgICAgICAgY29uc3Qgc3RhcnRYID0gZW5kWCAtIHNjYW5zWzNdO1xuICAgICAgICAgICAgICAgICAgICBjb25zdCBsaW5lID0geyBzdGFydFgsIHksIGVuZFggfTtcbiAgICAgICAgICAgICAgICAgICAgLy8gSXMgdGhlcmUgYSBxdWFkIGRpcmVjdGx5IGFib3ZlIHRoZSBjdXJyZW50IHNwb3Q/IElmIHNvLCBleHRlbmQgaXQgd2l0aCB0aGUgbmV3IGxpbmUuIE90aGVyd2lzZSwgY3JlYXRlIGEgbmV3IHF1YWQgd2l0aFxuICAgICAgICAgICAgICAgICAgICAvLyB0aGF0IGxpbmUgYXMgdGhlIHN0YXJ0aW5nIHBvaW50LlxuICAgICAgICAgICAgICAgICAgICBjb25zdCBtYXRjaGluZ1F1YWRzID0gYWN0aXZlQWxpZ25tZW50UGF0dGVyblF1YWRzLmZpbHRlcihxID0+IChzdGFydFggPj0gcS5ib3R0b20uc3RhcnRYICYmIHN0YXJ0WCA8PSBxLmJvdHRvbS5lbmRYKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKGVuZFggPj0gcS5ib3R0b20uc3RhcnRYICYmIHN0YXJ0WCA8PSBxLmJvdHRvbS5lbmRYKSB8fFxuICAgICAgICAgICAgICAgICAgICAgICAgKHN0YXJ0WCA8PSBxLmJvdHRvbS5zdGFydFggJiYgZW5kWCA+PSBxLmJvdHRvbS5lbmRYICYmICgoc2NhbnNbMl0gLyAocS5ib3R0b20uZW5kWCAtIHEuYm90dG9tLnN0YXJ0WCkpIDwgTUFYX1FVQURfUkFUSU8gJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAoc2NhbnNbMl0gLyAocS5ib3R0b20uZW5kWCAtIHEuYm90dG9tLnN0YXJ0WCkpID4gTUlOX1FVQURfUkFUSU8pKSk7XG4gICAgICAgICAgICAgICAgICAgIGlmIChtYXRjaGluZ1F1YWRzLmxlbmd0aCA+IDApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1hdGNoaW5nUXVhZHNbMF0uYm90dG9tID0gbGluZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGl2ZUFsaWdubWVudFBhdHRlcm5RdWFkcy5wdXNoKHsgdG9wOiBsaW5lLCBib3R0b206IGxpbmUgfSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgZmluZGVyUGF0dGVyblF1YWRzLnB1c2goLi4uYWN0aXZlRmluZGVyUGF0dGVyblF1YWRzLmZpbHRlcihxID0+IHEuYm90dG9tLnkgIT09IHkgJiYgcS5ib3R0b20ueSAtIHEudG9wLnkgPj0gMikpO1xuICAgICAgICBhY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMgPSBhY3RpdmVGaW5kZXJQYXR0ZXJuUXVhZHMuZmlsdGVyKHEgPT4gcS5ib3R0b20ueSA9PT0geSk7XG4gICAgICAgIGFsaWdubWVudFBhdHRlcm5RdWFkcy5wdXNoKC4uLmFjdGl2ZUFsaWdubWVudFBhdHRlcm5RdWFkcy5maWx0ZXIocSA9PiBxLmJvdHRvbS55ICE9PSB5KSk7XG4gICAgICAgIGFjdGl2ZUFsaWdubWVudFBhdHRlcm5RdWFkcyA9IGFjdGl2ZUFsaWdubWVudFBhdHRlcm5RdWFkcy5maWx0ZXIocSA9PiBxLmJvdHRvbS55ID09PSB5KTtcbiAgICB9XG4gICAgZmluZGVyUGF0dGVyblF1YWRzLnB1c2goLi4uYWN0aXZlRmluZGVyUGF0dGVyblF1YWRzLmZpbHRlcihxID0+IHEuYm90dG9tLnkgLSBxLnRvcC55ID49IDIpKTtcbiAgICBhbGlnbm1lbnRQYXR0ZXJuUXVhZHMucHVzaCguLi5hY3RpdmVBbGlnbm1lbnRQYXR0ZXJuUXVhZHMpO1xuICAgIGNvbnN0IGZpbmRlclBhdHRlcm5Hcm91cHMgPSBmaW5kZXJQYXR0ZXJuUXVhZHNcbiAgICAgICAgLmZpbHRlcihxID0+IHEuYm90dG9tLnkgLSBxLnRvcC55ID49IDIpIC8vIEFsbCBxdWFkcyBtdXN0IGJlIGF0IGxlYXN0IDJweCB0YWxsIHNpbmNlIHRoZSBjZW50ZXIgc3F1YXJlIGlzIGxhcmdlciB0aGFuIGEgYmxvY2tcbiAgICAgICAgLm1hcChxID0+IHtcbiAgICAgICAgY29uc3QgeCA9IChxLnRvcC5zdGFydFggKyBxLnRvcC5lbmRYICsgcS5ib3R0b20uc3RhcnRYICsgcS5ib3R0b20uZW5kWCkgLyA0O1xuICAgICAgICBjb25zdCB5ID0gKHEudG9wLnkgKyBxLmJvdHRvbS55ICsgMSkgLyAyO1xuICAgICAgICBpZiAoIW1hdHJpeC5nZXQoTWF0aC5yb3VuZCh4KSwgTWF0aC5yb3VuZCh5KSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsZW5ndGhzID0gW3EudG9wLmVuZFggLSBxLnRvcC5zdGFydFgsIHEuYm90dG9tLmVuZFggLSBxLmJvdHRvbS5zdGFydFgsIHEuYm90dG9tLnkgLSBxLnRvcC55ICsgMV07XG4gICAgICAgIGNvbnN0IHNpemUgPSBzdW0obGVuZ3RocykgLyBsZW5ndGhzLmxlbmd0aDtcbiAgICAgICAgY29uc3Qgc2NvcmUgPSBzY29yZVBhdHRlcm4oeyB4OiBNYXRoLnJvdW5kKHgpLCB5OiBNYXRoLnJvdW5kKHkpIH0sIFsxLCAxLCAzLCAxLCAxXSwgbWF0cml4KTtcbiAgICAgICAgcmV0dXJuIHsgc2NvcmUsIHgsIHksIHNpemUgfTtcbiAgICB9KVxuICAgICAgICAuZmlsdGVyKHEgPT4gISFxKSAvLyBGaWx0ZXIgb3V0IGFueSByZWplY3RlZCBxdWFkcyBmcm9tIGFib3ZlXG4gICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnNjb3JlIC0gYi5zY29yZSlcbiAgICAgICAgLy8gTm93IHRha2UgdGhlIHRvcCBmaW5kZXIgcGF0dGVybiBvcHRpb25zIGFuZCB0cnkgdG8gZmluZCAyIG90aGVyIG9wdGlvbnMgd2l0aCBhIHNpbWlsYXIgc2l6ZS5cbiAgICAgICAgLm1hcCgocG9pbnQsIGksIGZpbmRlclBhdHRlcm5zKSA9PiB7XG4gICAgICAgIGlmIChpID4gTUFYX0ZJTkRFUlBBVFRFUk5TX1RPX1NFQVJDSCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgIH1cbiAgICAgICAgY29uc3Qgb3RoZXJQb2ludHMgPSBmaW5kZXJQYXR0ZXJuc1xuICAgICAgICAgICAgLmZpbHRlcigocCwgaWkpID0+IGkgIT09IGlpKVxuICAgICAgICAgICAgLm1hcChwID0+ICh7IHg6IHAueCwgeTogcC55LCBzY29yZTogcC5zY29yZSArIChNYXRoLnBvdygocC5zaXplIC0gcG9pbnQuc2l6ZSksIDIpKSAvIHBvaW50LnNpemUsIHNpemU6IHAuc2l6ZSB9KSlcbiAgICAgICAgICAgIC5zb3J0KChhLCBiKSA9PiBhLnNjb3JlIC0gYi5zY29yZSk7XG4gICAgICAgIGlmIChvdGhlclBvaW50cy5sZW5ndGggPCAyKSB7XG4gICAgICAgICAgICByZXR1cm4gbnVsbDtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBzY29yZSA9IHBvaW50LnNjb3JlICsgb3RoZXJQb2ludHNbMF0uc2NvcmUgKyBvdGhlclBvaW50c1sxXS5zY29yZTtcbiAgICAgICAgcmV0dXJuIHsgcG9pbnRzOiBbcG9pbnRdLmNvbmNhdChvdGhlclBvaW50cy5zbGljZSgwLCAyKSksIHNjb3JlIH07XG4gICAgfSlcbiAgICAgICAgLmZpbHRlcihxID0+ICEhcSkgLy8gRmlsdGVyIG91dCBhbnkgcmVqZWN0ZWQgZmluZGVyIHBhdHRlcm5zIGZyb20gYWJvdmVcbiAgICAgICAgLnNvcnQoKGEsIGIpID0+IGEuc2NvcmUgLSBiLnNjb3JlKTtcbiAgICBpZiAoZmluZGVyUGF0dGVybkdyb3Vwcy5sZW5ndGggPT09IDApIHtcbiAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IHsgdG9wUmlnaHQsIHRvcExlZnQsIGJvdHRvbUxlZnQgfSA9IHJlb3JkZXJGaW5kZXJQYXR0ZXJucyhmaW5kZXJQYXR0ZXJuR3JvdXBzWzBdLnBvaW50c1swXSwgZmluZGVyUGF0dGVybkdyb3Vwc1swXS5wb2ludHNbMV0sIGZpbmRlclBhdHRlcm5Hcm91cHNbMF0ucG9pbnRzWzJdKTtcbiAgICAvLyBOb3cgdGhhdCB3ZSd2ZSBmb3VuZCB0aGUgdGhyZWUgZmluZGVyIHBhdHRlcm5zIHdlIGNhbiBkZXRlcm1pbmUgdGhlIGJsb2NrU2l6ZSBhbmQgdGhlIHNpemUgb2YgdGhlIFFSIGNvZGUuXG4gICAgLy8gV2UnbGwgdXNlIHRoZXNlIHRvIGhlbHAgZmluZCB0aGUgYWxpZ25tZW50IHBhdHRlcm4gYnV0IGFsc28gbGF0ZXIgd2hlbiB3ZSBkbyB0aGUgZXh0cmFjdGlvbi5cbiAgICBsZXQgZGltZW5zaW9uO1xuICAgIGxldCBtb2R1bGVTaXplO1xuICAgIHRyeSB7XG4gICAgICAgICh7IGRpbWVuc2lvbiwgbW9kdWxlU2l6ZSB9ID0gY29tcHV0ZURpbWVuc2lvbih0b3BMZWZ0LCB0b3BSaWdodCwgYm90dG9tTGVmdCwgbWF0cml4KSk7XG4gICAgfVxuICAgIGNhdGNoIChlKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICAvLyBOb3cgZmluZCB0aGUgYWxpZ25tZW50IHBhdHRlcm5cbiAgICBjb25zdCBib3R0b21SaWdodEZpbmRlclBhdHRlcm4gPSB7XG4gICAgICAgIHg6IHRvcFJpZ2h0LnggLSB0b3BMZWZ0LnggKyBib3R0b21MZWZ0LngsXG4gICAgICAgIHk6IHRvcFJpZ2h0LnkgLSB0b3BMZWZ0LnkgKyBib3R0b21MZWZ0LnksXG4gICAgfTtcbiAgICBjb25zdCBtb2R1bGVzQmV0d2VlbkZpbmRlclBhdHRlcm5zID0gKChkaXN0YW5jZSh0b3BMZWZ0LCBib3R0b21MZWZ0KSArIGRpc3RhbmNlKHRvcExlZnQsIHRvcFJpZ2h0KSkgLyAyIC8gbW9kdWxlU2l6ZSk7XG4gICAgY29uc3QgY29ycmVjdGlvblRvVG9wTGVmdCA9IDEgLSAoMyAvIG1vZHVsZXNCZXR3ZWVuRmluZGVyUGF0dGVybnMpO1xuICAgIGNvbnN0IGV4cGVjdGVkQWxpZ25tZW50UGF0dGVybiA9IHtcbiAgICAgICAgeDogdG9wTGVmdC54ICsgY29ycmVjdGlvblRvVG9wTGVmdCAqIChib3R0b21SaWdodEZpbmRlclBhdHRlcm4ueCAtIHRvcExlZnQueCksXG4gICAgICAgIHk6IHRvcExlZnQueSArIGNvcnJlY3Rpb25Ub1RvcExlZnQgKiAoYm90dG9tUmlnaHRGaW5kZXJQYXR0ZXJuLnkgLSB0b3BMZWZ0LnkpLFxuICAgIH07XG4gICAgY29uc3QgYWxpZ25tZW50UGF0dGVybnMgPSBhbGlnbm1lbnRQYXR0ZXJuUXVhZHNcbiAgICAgICAgLm1hcChxID0+IHtcbiAgICAgICAgY29uc3QgeCA9IChxLnRvcC5zdGFydFggKyBxLnRvcC5lbmRYICsgcS5ib3R0b20uc3RhcnRYICsgcS5ib3R0b20uZW5kWCkgLyA0O1xuICAgICAgICBjb25zdCB5ID0gKHEudG9wLnkgKyBxLmJvdHRvbS55ICsgMSkgLyAyO1xuICAgICAgICBpZiAoIW1hdHJpeC5nZXQoTWF0aC5mbG9vcih4KSwgTWF0aC5mbG9vcih5KSkpIHtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBjb25zdCBsZW5ndGhzID0gW3EudG9wLmVuZFggLSBxLnRvcC5zdGFydFgsIHEuYm90dG9tLmVuZFggLSBxLmJvdHRvbS5zdGFydFgsIChxLmJvdHRvbS55IC0gcS50b3AueSArIDEpXTtcbiAgICAgICAgY29uc3Qgc2l6ZSA9IHN1bShsZW5ndGhzKSAvIGxlbmd0aHMubGVuZ3RoO1xuICAgICAgICBjb25zdCBzaXplU2NvcmUgPSBzY29yZVBhdHRlcm4oeyB4OiBNYXRoLmZsb29yKHgpLCB5OiBNYXRoLmZsb29yKHkpIH0sIFsxLCAxLCAxXSwgbWF0cml4KTtcbiAgICAgICAgY29uc3Qgc2NvcmUgPSBzaXplU2NvcmUgKyBkaXN0YW5jZSh7IHgsIHkgfSwgZXhwZWN0ZWRBbGlnbm1lbnRQYXR0ZXJuKTtcbiAgICAgICAgcmV0dXJuIHsgeCwgeSwgc2NvcmUgfTtcbiAgICB9KVxuICAgICAgICAuZmlsdGVyKHYgPT4gISF2KVxuICAgICAgICAuc29ydCgoYSwgYikgPT4gYS5zY29yZSAtIGIuc2NvcmUpO1xuICAgIC8vIElmIHRoZXJlIGFyZSBsZXNzIHRoYW4gMTUgbW9kdWxlcyBiZXR3ZWVuIGZpbmRlciBwYXR0ZXJucyBpdCdzIGEgdmVyc2lvbiAxIFFSIGNvZGUgYW5kIGFzIHN1Y2ggaGFzIG5vIGFsaWdubWVtbnQgcGF0dGVyblxuICAgIC8vIHNvIHdlIGNhbiBvbmx5IHVzZSBvdXIgYmVzdCBndWVzcy5cbiAgICBjb25zdCBhbGlnbm1lbnRQYXR0ZXJuID0gbW9kdWxlc0JldHdlZW5GaW5kZXJQYXR0ZXJucyA+PSAxNSAmJiBhbGlnbm1lbnRQYXR0ZXJucy5sZW5ndGggPyBhbGlnbm1lbnRQYXR0ZXJuc1swXSA6IGV4cGVjdGVkQWxpZ25tZW50UGF0dGVybjtcbiAgICByZXR1cm4ge1xuICAgICAgICBhbGlnbm1lbnRQYXR0ZXJuOiB7IHg6IGFsaWdubWVudFBhdHRlcm4ueCwgeTogYWxpZ25tZW50UGF0dGVybi55IH0sXG4gICAgICAgIGJvdHRvbUxlZnQ6IHsgeDogYm90dG9tTGVmdC54LCB5OiBib3R0b21MZWZ0LnkgfSxcbiAgICAgICAgZGltZW5zaW9uLFxuICAgICAgICB0b3BMZWZ0OiB7IHg6IHRvcExlZnQueCwgeTogdG9wTGVmdC55IH0sXG4gICAgICAgIHRvcFJpZ2h0OiB7IHg6IHRvcFJpZ2h0LngsIHk6IHRvcFJpZ2h0LnkgfSxcbiAgICB9O1xufVxuXG5mdW5jdGlvbiBzY2FuKG1hdHJpeCkge1xuICAgIGNvbnN0IGxvY2F0aW9uID0gbG9jYXRlKG1hdHJpeCk7XG4gICAgaWYgKCFsb2NhdGlvbikge1xuICAgICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgZXh0cmFjdGVkID0gZXh0cmFjdChtYXRyaXgsIGxvY2F0aW9uKTtcbiAgICBjb25zdCBkZWNvZGVkID0gZGVjb2RlJDIoZXh0cmFjdGVkLm1hdHJpeCk7XG4gICAgaWYgKCFkZWNvZGVkKSB7XG4gICAgICAgIHJldHVybiBudWxsO1xuICAgIH1cbiAgICByZXR1cm4ge1xuICAgICAgICBiaW5hcnlEYXRhOiBkZWNvZGVkLmJ5dGVzLFxuICAgICAgICBkYXRhOiBkZWNvZGVkLnRleHQsXG4gICAgICAgIGNodW5rczogZGVjb2RlZC5jaHVua3MsXG4gICAgICAgIGxvY2F0aW9uOiB7XG4gICAgICAgICAgICB0b3BSaWdodENvcm5lcjogZXh0cmFjdGVkLm1hcHBpbmdGdW5jdGlvbihsb2NhdGlvbi5kaW1lbnNpb24sIDApLFxuICAgICAgICAgICAgdG9wTGVmdENvcm5lcjogZXh0cmFjdGVkLm1hcHBpbmdGdW5jdGlvbigwLCAwKSxcbiAgICAgICAgICAgIGJvdHRvbVJpZ2h0Q29ybmVyOiBleHRyYWN0ZWQubWFwcGluZ0Z1bmN0aW9uKGxvY2F0aW9uLmRpbWVuc2lvbiwgbG9jYXRpb24uZGltZW5zaW9uKSxcbiAgICAgICAgICAgIGJvdHRvbUxlZnRDb3JuZXI6IGV4dHJhY3RlZC5tYXBwaW5nRnVuY3Rpb24oMCwgbG9jYXRpb24uZGltZW5zaW9uKSxcbiAgICAgICAgICAgIHRvcFJpZ2h0RmluZGVyUGF0dGVybjogbG9jYXRpb24udG9wUmlnaHQsXG4gICAgICAgICAgICB0b3BMZWZ0RmluZGVyUGF0dGVybjogbG9jYXRpb24udG9wTGVmdCxcbiAgICAgICAgICAgIGJvdHRvbUxlZnRGaW5kZXJQYXR0ZXJuOiBsb2NhdGlvbi5ib3R0b21MZWZ0LFxuICAgICAgICAgICAgYm90dG9tUmlnaHRBbGlnbm1lbnRQYXR0ZXJuOiBsb2NhdGlvbi5hbGlnbm1lbnRQYXR0ZXJuLFxuICAgICAgICB9LFxuICAgIH07XG59XG5jb25zdCBkZWZhdWx0T3B0aW9ucyA9IHtcbiAgICBpbnZlcnNpb25BdHRlbXB0czogXCJhdHRlbXB0Qm90aFwiLFxuICAgIGdyZXlTY2FsZVdlaWdodHM6IHtcbiAgICAgICAgcmVkOiAwLjIxMjYsXG4gICAgICAgIGdyZWVuOiAwLjcxNTIsXG4gICAgICAgIGJsdWU6IDAuMDcyMixcbiAgICAgICAgdXNlSW50ZWdlckFwcHJveGltYXRpb246IGZhbHNlLFxuICAgIH0sXG4gICAgY2FuT3ZlcndyaXRlSW1hZ2U6IHRydWUsXG59O1xuZnVuY3Rpb24gbWVyZ2VPYmplY3QodGFyZ2V0LCBzcmMpIHtcbiAgICBPYmplY3Qua2V5cyhzcmMpLmZvckVhY2gob3B0ID0+IHtcbiAgICAgICAgdGFyZ2V0W29wdF0gPSBzcmNbb3B0XTtcbiAgICB9KTtcbn1cbmZ1bmN0aW9uIGpzUVIoZGF0YSwgd2lkdGgsIGhlaWdodCwgcHJvdmlkZWRPcHRpb25zID0ge30pIHtcbiAgICBjb25zdCBvcHRpb25zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiAgICBtZXJnZU9iamVjdChvcHRpb25zLCBkZWZhdWx0T3B0aW9ucyk7XG4gICAgbWVyZ2VPYmplY3Qob3B0aW9ucywgcHJvdmlkZWRPcHRpb25zKTtcbiAgICBjb25zdCBzaG91bGRJbnZlcnQgPSBvcHRpb25zLmludmVyc2lvbkF0dGVtcHRzID09PSBcImF0dGVtcHRCb3RoXCIgfHwgb3B0aW9ucy5pbnZlcnNpb25BdHRlbXB0cyA9PT0gXCJpbnZlcnRGaXJzdFwiO1xuICAgIGNvbnN0IHRyeUludmVydGVkRmlyc3QgPSBvcHRpb25zLmludmVyc2lvbkF0dGVtcHRzID09PSBcIm9ubHlJbnZlcnRcIiB8fCBvcHRpb25zLmludmVyc2lvbkF0dGVtcHRzID09PSBcImludmVydEZpcnN0XCI7XG4gICAgY29uc3QgeyBiaW5hcml6ZWQsIGludmVydGVkIH0gPSBiaW5hcml6ZShkYXRhLCB3aWR0aCwgaGVpZ2h0LCBzaG91bGRJbnZlcnQsIG9wdGlvbnMuZ3JleVNjYWxlV2VpZ2h0cywgb3B0aW9ucy5jYW5PdmVyd3JpdGVJbWFnZSk7XG4gICAgbGV0IHJlc3VsdCA9IHNjYW4odHJ5SW52ZXJ0ZWRGaXJzdCA/IGludmVydGVkIDogYmluYXJpemVkKTtcbiAgICBpZiAoIXJlc3VsdCAmJiAob3B0aW9ucy5pbnZlcnNpb25BdHRlbXB0cyA9PT0gXCJhdHRlbXB0Qm90aFwiIHx8IG9wdGlvbnMuaW52ZXJzaW9uQXR0ZW1wdHMgPT09IFwiaW52ZXJ0Rmlyc3RcIikpIHtcbiAgICAgICAgcmVzdWx0ID0gc2Nhbih0cnlJbnZlcnRlZEZpcnN0ID8gYmluYXJpemVkIDogaW52ZXJ0ZWQpO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xufVxuanNRUi5kZWZhdWx0ID0ganNRUjtcblxuZXhwb3J0IGRlZmF1bHQganNRUjtcbi8vIyBzb3VyY2VNYXBwaW5nVVJMPWpzUVIuanMubWFwXG4iLCIvLyBHZW5lcmF0ZWQgYnkgQlVDS0xFU0NSSVBUIFZFUlNJT04gNS4wLjIsIFBMRUFTRSBFRElUIFdJVEggQ0FSRVxuXG5pbXBvcnQgKiBhcyAkJEFycmF5IGZyb20gXCIuLi9ub2RlX21vZHVsZXMvYnMtcGxhdGZvcm0vbGliL2VzNi9hcnJheS5qc1wiO1xuaW1wb3J0ICogYXMgSnNxckVzNiBmcm9tIFwianNxci1lczZcIjtcbmltcG9ydCAqIGFzIENhbWxfb3B0aW9uIGZyb20gXCIuLi9ub2RlX21vZHVsZXMvYnMtcGxhdGZvcm0vbGliL2VzNi9jYW1sX29wdGlvbi5qc1wiO1xuXG5mdW5jdGlvbiBnZXRQb2ludEFzRmxvYXRzKHApIHtcbiAgcmV0dXJuIC8qIHR1cGxlICovW1xuICAgICAgICAgIHAueCxcbiAgICAgICAgICBwLnlcbiAgICAgICAgXTtcbn1cblxuZnVuY3Rpb24gZ2V0TWluQW5kTWF4KGFyeSkge1xuICB2YXIgY3VycmVudE1pbiA9IC8qIHJlY29yZCAqL1svKiBjb250ZW50cyAqL051bWJlci5QT1NJVElWRV9JTkZJTklUWV07XG4gIHZhciBjdXJyZW50TWF4ID0gLyogcmVjb3JkICovWy8qIGNvbnRlbnRzICovTnVtYmVyLk5FR0FUSVZFX0lORklOSVRZXTtcbiAgJCRBcnJheS5pdGVyKChmdW5jdGlvbiAoeCkge1xuICAgICAgICAgIGlmICh4IDwgY3VycmVudE1pblswXSkge1xuICAgICAgICAgICAgY3VycmVudE1pblswXSA9IHg7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmICh4ID4gY3VycmVudE1heFswXSkge1xuICAgICAgICAgICAgY3VycmVudE1heFswXSA9IHg7XG4gICAgICAgICAgICByZXR1cm4gLyogKCkgKi8wO1xuICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICByZXR1cm4gMDtcbiAgICAgICAgICB9XG4gICAgICAgIH0pLCBhcnkpO1xuICByZXR1cm4gLyogdHVwbGUgKi9bXG4gICAgICAgICAgY3VycmVudE1pblswXSxcbiAgICAgICAgICBjdXJyZW50TWF4WzBdXG4gICAgICAgIF07XG59XG5cbmZ1bmN0aW9uIGV4dHJhY3RBQUJCKGxvYykge1xuICB2YXIgbWF0Y2ggPSBnZXRQb2ludEFzRmxvYXRzKGxvYy50b3BMZWZ0Q29ybmVyKTtcbiAgdmFyIG1hdGNoJDEgPSBnZXRQb2ludEFzRmxvYXRzKGxvYy50b3BSaWdodENvcm5lcik7XG4gIHZhciBtYXRjaCQyID0gZ2V0UG9pbnRBc0Zsb2F0cyhsb2MuYm90dG9tUmlnaHRDb3JuZXIpO1xuICB2YXIgbWF0Y2gkMyA9IGdldFBvaW50QXNGbG9hdHMobG9jLmJvdHRvbUxlZnRDb3JuZXIpO1xuICB2YXIgbWF0Y2gkNCA9IGdldE1pbkFuZE1heCgvKiBhcnJheSAqL1tcbiAgICAgICAgbWF0Y2hbMF0sXG4gICAgICAgIG1hdGNoJDFbMF0sXG4gICAgICAgIG1hdGNoJDJbMF0sXG4gICAgICAgIG1hdGNoJDNbMF1cbiAgICAgIF0pO1xuICB2YXIgbWluWCA9IG1hdGNoJDRbMF07XG4gIHZhciBtYXRjaCQ1ID0gZ2V0TWluQW5kTWF4KC8qIGFycmF5ICovW1xuICAgICAgICBtYXRjaFsxXSxcbiAgICAgICAgbWF0Y2gkMVsxXSxcbiAgICAgICAgbWF0Y2gkMlsxXSxcbiAgICAgICAgbWF0Y2gkM1sxXVxuICAgICAgXSk7XG4gIHZhciBtaW5ZID0gbWF0Y2gkNVswXTtcbiAgcmV0dXJuIC8qIHJlY29yZCAqL1tcbiAgICAgICAgICAvKiB4ICovbWluWCB8IDAsXG4gICAgICAgICAgLyogeSAqL21pblkgfCAwLFxuICAgICAgICAgIC8qIHcgKi9NYXRoLmNlaWwobWF0Y2gkNFsxXSAtIG1pblgpIHwgMCxcbiAgICAgICAgICAvKiBoICovTWF0aC5jZWlsKG1hdGNoJDVbMV0gLSBtaW5ZKSB8IDBcbiAgICAgICAgXTtcbn1cblxuZnVuY3Rpb24gc3RyaW5nX29mX2ludmVydE9wdGlvbnMocGFyYW0pIHtcbiAgc3dpdGNoIChwYXJhbSkge1xuICAgIGNhc2UgMCA6IFxuICAgICAgICByZXR1cm4gXCJhdHRlbXB0Qm90aFwiO1xuICAgIGNhc2UgMSA6IFxuICAgICAgICByZXR1cm4gXCJkb250SW52ZXJ0XCI7XG4gICAgY2FzZSAyIDogXG4gICAgICAgIHJldHVybiBcIm9ubHlJbnZlcnRcIjtcbiAgICBjYXNlIDMgOiBcbiAgICAgICAgcmV0dXJuIFwiaW52ZXJ0Rmlyc3RcIjtcbiAgICBcbiAgfVxufVxuXG5mdW5jdGlvbiBqc1FSKGQsIHcsIGgsIGludmVydE9wdGlvbnMpIHtcbiAgdmFyIG9wdFN0cmluZyA9IHN0cmluZ19vZl9pbnZlcnRPcHRpb25zKGludmVydE9wdGlvbnMpO1xuICByZXR1cm4gQ2FtbF9vcHRpb24ubnVsbGFibGVfdG9fb3B0KEpzcXJFczYuZGVmYXVsdChkLCB3LCBoLCB7XG4gICAgICAgICAgICAgICAgICBpbnZlcnNpb25BdHRlbXB0czogb3B0U3RyaW5nLFxuICAgICAgICAgICAgICAgICAgY2FuT3ZlcndyaXRlSW1hZ2U6IHRydWVcbiAgICAgICAgICAgICAgICB9KSk7XG59XG5cbmV4cG9ydCB7XG4gIGdldFBvaW50QXNGbG9hdHMgLFxuICBnZXRNaW5BbmRNYXggLFxuICBleHRyYWN0QUFCQiAsXG4gIHN0cmluZ19vZl9pbnZlcnRPcHRpb25zICxcbiAganNRUiAsXG4gIFxufVxuLyoganNxci1lczYgTm90IGEgcHVyZSBtb2R1bGUgKi9cbiIsIi8vIEdlbmVyYXRlZCBieSBCVUNLTEVTQ1JJUFQgVkVSU0lPTiA1LjAuMiwgUExFQVNFIEVESVQgV0lUSCBDQVJFXG5cbmltcG9ydCAqIGFzIEpzUXIkUXVlZXJMb29wIGZyb20gXCIuL0pzUXIuYnMuanNcIjtcblxuc2VsZi5vbm1lc3NhZ2UgPSAoZnVuY3Rpb24gKGUpIHtcbiAgICB2YXIgbWF0Y2ggPSBlLmRhdGE7XG4gICAgdmFyIG1heWJlQ29kZSA9IEpzUXIkUXVlZXJMb29wLmpzUVIobWF0Y2hbMF0sIG1hdGNoWzFdLCBtYXRjaFsyXSwgbWF0Y2hbM10pO1xuICAgIHBvc3RNZXNzYWdlKG1heWJlQ29kZSk7XG4gICAgcmV0dXJuIC8qICgpICovMDtcbiAgfSk7XG5cbmV4cG9ydCB7XG4gIFxufVxuLyogIE5vdCBhIHB1cmUgbW9kdWxlICovXG4iXSwibmFtZXMiOlsiQ2FtbF9leGNlcHRpb25zLmNyZWF0ZSIsImpzUVIiLCJDYW1sX29wdGlvbi5udWxsYWJsZV90b19vcHQiLCJKc3FyRXM2LmRlZmF1bHQiLCJKc1FyJFF1ZWVyTG9vcC5qc1FSIl0sIm1hcHBpbmdzIjoiOzs7RUFHQSxJQUFJLGFBQWEsY0FBYztFQUMvQixFQUFFLGVBQWU7RUFDakIsRUFBRSxDQUFDO0VBQ0gsQ0FBQyxDQUFDOztFQUVGLElBQUksU0FBUyxjQUFjO0VBQzNCLEVBQUUsV0FBVztFQUNiLEVBQUUsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDOztFQUVGLElBQUksT0FBTyxjQUFjO0VBQ3pCLEVBQUUsU0FBUztFQUNYLEVBQUUsQ0FBQyxDQUFDO0VBQ0osQ0FBQyxDQUFDOztFQUVGLElBQUksZ0JBQWdCLGNBQWM7RUFDbEMsRUFBRSxrQkFBa0I7RUFDcEIsRUFBRSxDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7O0VBRUYsSUFBSSxXQUFXLGNBQWM7RUFDN0IsRUFBRSxhQUFhO0VBQ2YsRUFBRSxDQUFDLENBQUM7RUFDSixDQUFDLENBQUM7O0VBRUYsSUFBSSxnQkFBZ0IsY0FBYztFQUNsQyxFQUFFLGtCQUFrQjtFQUNwQixFQUFFLENBQUMsQ0FBQztFQUNKLENBQUMsQ0FBQzs7RUFFRixJQUFJLFNBQVMsY0FBYztFQUMzQixFQUFFLFdBQVc7RUFDYixFQUFFLENBQUMsQ0FBQztFQUNKLENBQUMsQ0FB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TSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztFQUMzQixRQUFRLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxFQUFFLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUMzQyxRQUFRLElBQUksSUFBSSxDQUFDLENBQUMsUUFBUSxFQUFFLEdBQUcsQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztFQUMzRCxRQUFRLE1BQU0sSUFBSSxDQUFDLENBQUM7RUFDcEIsS0FBSztFQUNMO0VBQ0EsSUFBSSxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7RUFDdEIsUUFBUSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLFFBQVEsSUFBSSxHQUFHLElBQUksR0FBRyxFQUFFO0VBQ3hCLFlBQVksTUFBTSxJQUFJLEtBQUssQ0FBQyxnQ0FBZ0MsQ0FBQyxDQUFDO0VBQzlELFNBQVM7RUFDVCxRQUFRLE1BQU0sQ0FBQyxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsR0FBRyxHQUFHLEVBQUUsQ0FBQyxDQUFDO0VBQ3ZDLFFBQVEsTUFBTSxDQUFDLEdBQUcsR0FBRyxHQUFHLEVBQUUsQ0FBQztFQUMzQixRQUFRLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRSxHQUFHLENBQUMsRUFBRSxFQUFFLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDbkMsUUFBUSxJQUFJLElBQUksQ0FBQyxDQUFDLFFBQVEsRUFBRSxHQUFHLENBQUMsQ0FBQyxRQUFRLEVBQUUsQ0FBQztFQUM1QyxLQUFLO0VBQ0wsU0FBUyxJQUFJLE1BQU0sS0FBSyxDQUFDLEVBQUU7RUFDM0IsUUFBUSxNQUFNLEdBQUcsR0FBRyxNQUFNLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLFFBQVEsSUFBSSxHQUFHLElBQUksRUFBRSxFQUFFO0VBQ3ZCLFlBQVksTUFBTSxJQUFJLEtBQUssQ0FBQywr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RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JBQW9CLEVBQUUsQ0FBQyxFQUFFLFFBQVEsRUFBRSxDQUFDLEVBQUUsRUFBRTtFQUMxRSxJQUFJLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxVQUFVLEVBQUUsRUFBRSxvQkFBb0IsRUFBRSxDQUFDLEVBQUUsUUFBUSxFQUFFLENBQUMsRUFBRSxFQUFFO0VBQzFFLElBQUksRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLFVBQVUsRUFBRSxFQUFFLG9CQUFvQixFQUFFLENBQUMsRUFBRSxRQUFRLEVBQUUsQ0FBQyxFQUFFLEVBQUU7RUFDMUUsSUFBSSxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLEVBQUUsb0JB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QUc7RUFDdEQsUUFBUSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUc7RUFDdEQsUUFBUSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUc7RUFDdEQsUUFBUSxHQUFHLEVBQUUsSUFBSSxDQUFDLEdBQUcsR0FBRyxJQUFJLENBQUMsR0FBRyxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsSUFBSSxDQUFDLEdBQUc7RUFDdEQsS0FBSyxDQUFDO0VBQ04sQ0FBQztFQUNELFNBQVMsS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQUU7RUFDckIsSUFBSSxPQUFPO0VBQ1gsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHO0VBQzFELFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRztFQUMxRCxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUc7RUFDMUQsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHO0VBQzFELFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRztFQUMxRCxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUc7RUFDMUQsUUFBUSxHQUFHLEVBQUUsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHO0VBQzFELFFBQVEsR0FBRyxFQUFFLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRztFQUMxRCxRQUFRLEdBQUcsRUFBRSxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsQ0FBQyxHQUFHLEdBQUcsQ0FBQyxDQUFDLEdBQUc7RUFDMUQsS0FBSyxDQUFDO0VBQ04sQ0FBQztFQUNELFNBQVMsT0FBTyxDQUFDLEtBQUssRUFBRSxRQUFRLEVBQUU7RUFDbEMsSUFBSSxNQUFNLElBQUksR0FBRyxxQkFBcUIsQ0FBQyxFQUFFLENBQUMsRUFBRSxHQUFHLEVBQUUsQ0FBQyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FBQyxFQUFFLFFBQVEsQ0FBQyxTQUFTLEdBQUcsR0FBRyxFQUFFLENBQUMs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QUMsQ0FBQyxDQUFDO0VBQzFFLElBQUksSUFBSSxLQUFLLENBQUM7RUFDZCxJQUFJLElBQUksS0FBSyxDQUFDO0VBQ2QsSUFBSSxJQUFJLEdBQUcsQ0FBQztFQUNaLElBQUksSUFBSSxHQUFHLENBQUM7RUFDWixJQUFJLElBQUksS0FBSyxFQUFFO0VBQ2YsUUFBUSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDckMsUUFBUSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDckMsUUFBUSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDaEMsUUFBUSxHQUFHLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDLENBQUM7RUFDaEMsS0FBSztFQUNMLFNBQVM7RUFDVCxRQUFRLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNyQyxRQUFRLEtBQUssR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNyQyxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNoQyxRQUFRLEdBQUcsR0FBRyxJQUFJLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUMsQ0FBQztFQUNoQyxLQUFLO0VBQ0wsSUFBSSxNQUFNLEVBQUUsR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLEdBQUcsR0FBRyxLQUFLLENBQUMsQ0FBQztFQUNyQyxJQUFJLE1BQU0sRUFBRSxHQUFHLElBQUksQ0FBQyxHQUFHLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxDQUFDO0VBQ3JDLElBQUksSUFBSSxLQUFLLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUUsR0FBRyxDQUFDLENBQUMsQ0FBQztFQUNwQyxJQUFJLE1BQU0sS0FBSyxHQUFHLEtBQUssR0FBRyxHQUFHLEdBQUcsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO0VBQ3ZDLElBQUksTUFBTSxLQUFLLEdBQUcsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDLENBQUM7RUFDdkMsSUFBSSxJQUFJLFlBQVksR0FBRyxJQUFJLENBQUM7RUFDNUI7RUFDQSxJQUFJLEtBQUssSUFBSSxDQUFDLEdBQUcsS0FBSyxFQUFFLENBQUMsR0FBRyxLQUFLLEVBQUUsQ0FBQyxLQUFLLEdBQUcsR0FBRyxLQUFLLEVBQUUsQ0FBQyxJQUFJLEtBQUssRUFBRTtFQUNsRTtFQUNBO0VBQ0E7RUFDQSxRQUFRLE1BQU0sS0FBSyxHQUFHLEtBQUssR0FBRyxDQUFDLEdBQUcsQ0FBQyxDQUFDO0VBQ3BDLFFBQVEsTUFBTSxLQUFLLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxDQUFDLENBQUM7RUFDcEMsUUFBUSxJQUFJLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxLQUFLLFlBQVksRUFBRTtFQUN2RCxZQUFZLFlBQVksR0FBRyxDQUFDLFlBQVksQ0FBQztFQUN6QyxZQUFZLFlBQVksQ0FBQyxJQUFJLENBQUMsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO0VBQ3RELFlBQVksSUFBSSxZQUFZLENBQUMsTUFBTSxLQUFLLE1BQU0sR0FBRyxDQUFDLEVBQUU7RUFDcEQsZ0JBQWdCLE1BQU07RUFDdEIsYUFBYTtFQUNiLFNBQVM7RUFDVCxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7RUFDcEIsUUFBUSxJQUFJLEtBQUssR0FBRyxDQUFDLEVBQUU7RUFDdkIsWUFBWSxJQUFJLENBQUMsS0FBSyxHQUFHLEVBQUU7RUFDM0IsZ0JBQWdCLE1BQU07RUFDdEIsYUFBYTtFQUNiLFlBQVksQ0FBQyxJQUFJLEtBQUssQ0FBQztFQUN2QixZQUFZLEtBQUss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
