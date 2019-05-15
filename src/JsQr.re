[@bs.deriving abstract]
type code = {
  [@bs.as "data"]
  textData: string,
};

[@bs.deriving abstract]
type options = {inversionAttempts: string};

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

[@bs.module]
external _jsQR :
  (Js.Typed_array.Uint8ClampedArray.t, int, int, options) =>
  Js.Nullable.t(code) =
  "jsqr";

let jsQR:
  (Js.Typed_array.Uint8ClampedArray.t, int, int, invertOptions) =>
  option(code) =
  (d, w, h, invertOptions) => {
    let optString = string_of_invertOptions(invertOptions);
    Js.Nullable.toOption(
      _jsQR(d, w, h, options(~inversionAttempts=optString)),
    );
  };