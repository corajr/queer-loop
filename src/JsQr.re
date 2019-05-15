[@bs.deriving abstract]
type code = {
  [@bs.as "data"]
  content: string,
};

[@bs.module]
external _jsQR :
  (Js.Typed_array.Uint8ClampedArray.t, int, int) => Js.Nullable.t(code) =
  "jsqr";

let jsQR: (Js.Typed_array.Uint8ClampedArray.t, int, int) => option(code) =
  (d, w, h) => Js.Nullable.toOption(_jsQR(d, w, h));
