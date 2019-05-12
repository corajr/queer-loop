module Ecc = {
  type t;

  [@bs.scope ("qrcodegen", "QrCode", "Ecc")] [@bs.val]
  external low : t = "LOW";
  [@bs.scope ("qrcodegen", "QrCode", "Ecc")] [@bs.val]
  external medium : t = "MEDIUM";
  [@bs.scope ("qrcodegen", "QrCode", "Ecc")] [@bs.val]
  external quartile : t = "QUARTILE";
  [@bs.scope ("qrcodegen", "QrCode", "Ecc")] [@bs.val]
  external high : t = "HIGH";
};

type t;

[@bs.scope ("qrcodegen", "QrCode")] [@bs.val]
external encodeText : (string, Ecc.t) => t = "encodeText";

[@bs.send] external drawCanvas : (t, int, int, Dom.element) => unit = "";

[@bs.send] external toSvgString : (t, int) => string = "";

let _setSvg: (string, Dom.element) => unit = [%bs.raw
  (t, el) => {|
     el.src = "data:image/svg+xml;utf8," + encodeURIComponent(t);
     |}
];

let setSvg: (t, Dom.element) => unit =
  (t, el) => _setSvg(toSvgString(t, 1), el);
