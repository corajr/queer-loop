open Util;
open QrCodeGen;
open Webapi.Dom;

let getPathString: (QrCode.t, int) => string =
  (code, border) => {
    let size = QrCode.size(code);
    let modules = QrCode.getModules(code);
    let parts = [||];
    for (y in 0 to size - 1) {
      for (x in 0 to size - 1) {
        if (modules[y][x]) {
          Js.Array.push(
            "M"
            ++ string_of_int(x + border)
            ++ ","
            ++ string_of_int(y + border)
            ++ "h1v1h-1z",
            parts,
          )
          |> ignore;
        };
      };
    };

    Js.Array.joinWith(" ", parts);
  };

let svgNs = "http://www.w3.org/2000/svg";

let createQrCodePathElement: (QrCode.t, int) => Dom.element =
  (code, border) => {
    let path = DocumentRe.createElementNS(svgNs, "path", document);
    ElementRe.setAttribute("d", getPathString(code, border), path);
    path;
  };

let createRainbowGradient: float => Dom.element =
  lightness => {
    let gradient =
      DocumentRe.createElementNS(svgNs, "linearGradient", document);

    ElementRe.setId(gradient, "rainbow");
    for (i in 0 to 7) {
      let stop = DocumentRe.createElementNS(svgNs, "stop", document);
      ElementRe.setAttribute(
        "offset",
        Js.Float.toString(100.0 *. float_of_int(i) /. 7.0) ++ "%",
        stop,
      );
      ElementRe.setAttribute(
        "stop-color",
        "hsl("
        ++ Js.Float.toString(float_of_int(i) /. 8.0)
        ++ "turn,100%,"
        ++ Js.Float.toString(lightness *. 100.0)
        ++ "%)",
        stop,
      );
      ElementRe.appendChild(stop, gradient);
    };

    ElementRe.setAttribute("gradientTransform", "rotate(45)", gradient);

    gradient;
  };

let makeAnimate = (values, duration) => {
  let animBegin = "+0s";
  let animate = DocumentRe.createElementNS(svgNs, "animate", document);
  ElementRe.setAttribute("attributeName", "opacity", animate);
  ElementRe.setAttribute("values", values, animate);
  ElementRe.setAttribute("dur", duration, animate);
  ElementRe.setAttribute("begin", animBegin, animate);
  ElementRe.setAttribute("fill", "freeze", animate);
  ElementRe.setAttribute("calcMode", "spline", animate);
  ElementRe.setAttribute("keyTimes", "0;0.5;1", animate);
  let spline = ".5 0 .5 1";
  ElementRe.setAttribute(
    "keySplines",
    Js.Array.joinWith(";", Array.make(2, spline)),
    animate,
  );
  ElementRe.setAttribute("repeatCount", "indefinite", animate);

  animate;
};

let createSimpleSvg:
  (QrCode.t, int, string, string, option(string)) => Dom.element =
  (code, border, timestamp, localeString, maybeDataURL) => {
    let size = QrCode.size(code);
    let sizeWithBorder = size + border * 2;
    let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

    let svg = DocumentRe.createElementNS(svgNs, "svg", document);
    ElementRe.setAttribute("viewBox", viewBox, svg);

    let defs = DocumentRe.createElementNS(svgNs, "defs", document);
    let rainbowGradient = createRainbowGradient(0.85);
    ElementRe.appendChild(rainbowGradient, defs);
    ElementRe.appendChild(defs, svg);

    switch (maybeDataURL) {
    | Some(url) =>
      let background = DocumentRe.createElementNS(svgNs, "image", document);
      ElementRe.setAttribute("x", "0", background);
      ElementRe.setAttribute("y", "0", background);
      ElementRe.setAttribute("width", "100%", background);
      ElementRe.setAttribute("height", "100%", background);
      ElementRe.setAttribute("href", url, background);
      ElementRe.setAttribute("style", "opacity: 0.5", background);
      let bgAnimate = makeAnimate("0;1;0", "6s");
      ElementRe.appendChild(bgAnimate, background);
      ElementRe.appendChild(background, svg);
    | None => ()
    };

    let codeGroup = DocumentRe.createElementNS(svgNs, "g", document);
    ElementRe.setId(codeGroup, "codeGroup");

    let rainbow = DocumentRe.createElementNS(svgNs, "rect", document);
    ElementRe.setId(rainbow, "rainbowMask");
    ElementRe.setAttribute("width", "100%", rainbow);
    ElementRe.setAttribute("height", "100%", rainbow);
    ElementRe.setAttribute("fill", "url(#rainbow)", rainbow);
    ElementRe.appendChild(rainbow, codeGroup);

    let path = createQrCodePathElement(code, border);
    ElementRe.appendChild(path, codeGroup);

    ElementRe.appendChild(codeGroup, svg);

    let codeGroupAnimate = makeAnimate("1;0;1", "6s");
    ElementRe.appendChild(codeGroupAnimate, codeGroup);

    let timeText = DocumentRe.createElementNS(svgNs, "text", document);
    ElementRe.setAttribute(
      "x",
      Js.Float.toString(float_of_int(sizeWithBorder) /. 2.0),
      timeText,
    );
    ElementRe.setAttribute(
      "y",
      Js.Float.toString(float_of_int(border) /. 2.0),
      timeText,
    );
    ElementRe.setAttribute(
      "font-size",
      Js.Float.toString(float_of_int(border) /. 2.0) ++ "px",
      timeText,
    );
    ElementRe.setAttribute("text-anchor", "middle", timeText);
    ElementRe.setAttribute("alignment-baseline", "middle", timeText);
    ElementRe.setAttribute(
      "style",
      "text-align: center; font-family: \"Courier New\", monospace;",
      timeText,
    );
    ElementRe.setAttribute("textLength", "90%", timeText);
    ElementRe.setAttribute("fill", "#FFFFFF", timeText);
    ElementRe.setAttribute("style", "mix-blend-mode: difference", timeText);
    ElementRe.setTextContent(timeText, localeString);

    ElementRe.appendChild(timeText, svg);

    svg;
  };

let createSvg:
  (Dom.element, option(Dom.element), option(string), string, QrCode.t) =>
  Dom.element =
  (parent, maybePrevious, maybeSnapshot, hash, code) => {
    let size = QrCode.size(code);
    let border = 4;
    let sizeWithBorder = size + border * 2;
    let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

    let childSvg = DocumentRe.createElementNS(svgNs, "svg", document);
    ElementRe.setAttribute("viewBox", viewBox, childSvg);

    let past = DocumentRe.createElementNS(svgNs, "g", document);
    let scaleFactor = 1.0 -. 2.0 /. float_of_int(sizeWithBorder);
    let cornerOffset = 1;
    /* let scaleFactor = 3.0 /. float_of_int(sizeWithBorder); */
    /* let cornerOffset = border + 2; */
    let scaleFactorString = Js.Float.toString(scaleFactor);
    ElementRe.setAttribute(
      "transform",
      {j|translate($cornerOffset,$cornerOffset) scale($scaleFactor)|j},
      past,
    );

    switch (maybePrevious) {
    | Some(previous) => ElementRe.appendChild(previous, past)
    | None => ()
    };

    ElementRe.appendChild(past, childSvg);

    switch (maybeSnapshot) {
    | Some(snapshotURL) =>
      let snapshotImage =
        DocumentRe.createElementNS(svgNs, "image", document);
      ElementRe.setAttribute("href", snapshotURL, snapshotImage);
      ElementRe.setAttribute("x", "0", snapshotImage);
      ElementRe.setAttribute("y", "0", snapshotImage);
      ElementRe.setAttribute(
        "width",
        string_of_int(sizeWithBorder),
        snapshotImage,
      );
      ElementRe.setAttribute(
        "height",
        string_of_int(sizeWithBorder),
        snapshotImage,
      );
      ElementRe.setAttribute("style", "opacity: 0.5", snapshotImage);
      ElementRe.appendChild(snapshotImage, childSvg);
    | None => ()
    };

    let mask = DocumentRe.createElementNS(svgNs, "mask", document);
    ElementRe.setId(mask, "m" ++ hash);

    let blank = DocumentRe.createElementNS(svgNs, "rect", document);
    ElementRe.setAttribute("width", "100%", blank);
    ElementRe.setAttribute("height", "100%", blank);
    ElementRe.setAttribute("fill", "#FFFFFF", blank);
    ElementRe.appendChild(blank, mask);

    let symbol = DocumentRe.createElementNS(svgNs, "symbol", document);
    ElementRe.setId(symbol, "s" ++ hash);

    let path = createQrCodePathElement(code, border);
    ElementRe.appendChild(path, symbol);
    ElementRe.appendChild(symbol, childSvg);

    let use = DocumentRe.createElementNS(svgNs, "use", document);
    ElementRe.setAttribute("href", "#s" ++ hash, use);
    ElementRe.setAttribute("fill", "#000000", use);
    ElementRe.appendChild(use, mask);

    ElementRe.appendChild(mask, childSvg);

    let rainbow = DocumentRe.createElementNS(svgNs, "rect", document);
    ElementRe.setAttribute("width", "100%", rainbow);
    ElementRe.setAttribute("height", "100%", rainbow);
    ElementRe.setAttribute("fill", "url(#rainbow)", rainbow);
    ElementRe.setAttribute("fill-opacity", "0.5", rainbow);
    ElementRe.setAttribute("mask", "url(#m" ++ hash ++ ")", rainbow);

    ElementRe.appendChild(rainbow, childSvg);

    let use2 = DocumentRe.createElementNS(svgNs, "use", document);
    ElementRe.setAttribute("href", "#s" ++ hash, use2);
    ElementRe.setAttribute("stroke-width", "0.01", use2);
    ElementRe.setAttribute("fill", "#000000", use2);
    ElementRe.setAttribute("fill-opacity", "0.5", use2);
    ElementRe.appendChild(use2, childSvg);

    ElementRe.appendChild(childSvg, parent);
    childSvg;
  };

module XMLSerializer = {
  type t;
  [@bs.new] external make : unit => t = "XMLSerializer";
  [@bs.send] external serializeToString : (t, Dom.element) => string = "";
};
let svgToDataURL: Dom.element => string =
  svg => {
    let xmlSerializer = XMLSerializer.make();
    let str = XMLSerializer.serializeToString(xmlSerializer, svg);
    "data:image/svg+xml;utf8," ++ encodeURIComponent(str);
  };

let drawCanvas: (Dom.element, QrCode.t) => unit =
  (canvas, code) => {
    open Canvas;
    let size = QrCode.size(code);
    let border = 2;
    let width = size + border * 2;

    if (getWidth(canvas) !== width) {
      setWidth(canvas, width);
      setHeight(canvas, width);
    };

    let ctx = getContext(canvas);
    Ctx.setGlobalCompositeOperation(ctx, "difference");
    Ctx.setFillStyle(ctx, "#FFFFFF");
    for (y in - border to size + border) {
      for (x in - border to size + border) {
        if (QrCode.getModule(code, x, y)) {
          Ctx.fillRect(ctx, x + border, y + border, 1, 1);
        };
      };
    };
  };
