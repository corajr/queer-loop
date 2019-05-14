module Ecc = {
  type t;

  [@bs.deriving abstract]
  type ecc = {
    [@bs.as "LOW"]
    low: t,
    [@bs.as "MEDIUM"]
    medium: t,
    [@bs.as "QUARTILE"]
    quartile: t,
    [@bs.as "HIGH"]
    high: t,
  };

  [@bs.module "./qrcodegen"] [@bs.val] external ecc : ecc = "Ecc";

  let low: t = lowGet(ecc);
  let medium: t = mediumGet(ecc);
  let quartile: t = quartileGet(ecc);
  let high: t = highGet(ecc);
};

module QrCode = {
  type t;

  [@bs.module "./qrcodegen"] external encodeText : (string, Ecc.t) => t = "";

  [@bs.send] external drawCanvas : (t, int, int, Dom.element) => unit = "";

  [@bs.get] external size : t => string = "";

  [@bs.send] external getModule : (t, int, int) => bool = "";
  [@bs.send] external getModules : t => array(array(bool)) = "";

  [@bs.send] external toSvgString : (t, int) => string = "";
};

let _setSvg: (string, Dom.element) => unit = [%bs.raw
  (t, el) => {|
     el.src = "data:image/svg+xml;utf8," + encodeURIComponent(t);
     |}
];

let setSvg: (QrCode.t, Dom.element) => unit =
  (t, el) => _setSvg(QrCode.toSvgString(t, 4), el);
