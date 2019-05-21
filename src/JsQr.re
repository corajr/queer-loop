[@bs.deriving abstract]
type point = {
  x: float,
  y: float,
};

[@bs.deriving abstract]
type location = {
  topRightCorner: point,
  topLeftCorner: point,
  bottomRightCorner: point,
  bottomLeftCorner: point,
  topRightFinderPattern: point,
  topLeftFinderPattern: point,
  bottomLeftFinderPattern: point,
};

type locationRect = {
  x: int,
  y: int,
  w: int,
  h: int,
};

let getPointAsFloats: point => (float, float) = p => (xGet(p), yGet(p));

let getMinAndMax: array(float) => (float, float) =
  ary => {
    let currentMin = ref(infinity);
    let currentMax = ref(neg_infinity);
    Array.iter(
      x => {
        if (x < currentMin^) {
          currentMin := x;
        };
        if (x > currentMax^) {
          currentMax := x;
        };
      },
      ary,
    );
    (currentMin^, currentMax^);
  };

let extractAABB: location => locationRect =
  loc => {
    let (tlX, tlY) = getPointAsFloats(topLeftCornerGet(loc));
    let (trX, trY) = getPointAsFloats(topRightCornerGet(loc));
    let (brX, brY) = getPointAsFloats(bottomRightCornerGet(loc));
    let (blX, blY) = getPointAsFloats(bottomLeftCornerGet(loc));

    let (minX, maxX) = getMinAndMax([|tlX, trX, brX, blX|]);
    let (minY, maxY) = getMinAndMax([|tlY, trY, brY, blY|]);

    {
      x: int_of_float(minX),
      y: int_of_float(minY),
      w: int_of_float(ceil(maxX -. minX)),
      h: int_of_float(ceil(maxY -. minY)),
    };
  };

[@bs.deriving abstract]
type code = {
  [@bs.as "data"]
  textData: string,
  binaryData: string,
  location,
};

[@bs.deriving abstract]
type options = {
  inversionAttempts: string,
  canOverwriteImage: bool,
};

type invertOptions =
  | AttemptBoth
  | DontInvert
  | OnlyInvert
  | InvertFirst;

let string_of_invertOptions =
  fun
  | AttemptBoth => "attemptBoth"
  | DontInvert => "dontInvert"
  | OnlyInvert => "onlyInvert"
  | InvertFirst => "invertFirst";

[@bs.module "jsqr-es6"]
external _jsQR :
  (Js.Typed_array.Uint8ClampedArray.t, int, int, options) =>
  Js.Nullable.t(code) =
  "default";

let defaultInversion = DontInvert;

let jsQR:
  (Js.Typed_array.Uint8ClampedArray.t, int, int, invertOptions) =>
  option(code) =
  (d, w, h, invertOptions) => {
    let optString = string_of_invertOptions(invertOptions);
    Js.Nullable.toOption(
      _jsQR(
        d,
        w,
        h,
        options(~inversionAttempts=optString, ~canOverwriteImage=true),
      ),
    );
  };
