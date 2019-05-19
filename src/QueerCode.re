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

let getSvgDataUri: (QrCode.t, string, option(string)) => string =
  (code, data, maybePastUrl) => {
    let border = 4;
    let pathString = getPathString(code, border);
    let sizeWithBorder = QrCode.size(code) + border * 2;
    let sizeWithBorderMinusOne = sizeWithBorder - 1;

    let pastData =
      switch (maybePastUrl) {
      | Some(pastUrl) => {j|<image href="$pastUrl" x="0" y="0" width="$sizeWithBorder" height="$sizeWithBorder" />|j}
      | None => ""
      };

    let svg = {j|<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 $sizeWithBorder $sizeWithBorder" stroke="none">
     <defs>
     <linearGradient id="rainbow">
     <stop offset="0.000%" stop-color="#ffb5b5" />
     <stop offset="14.286%" stop-color="#fcdc85" />
     <stop offset="28.571%" stop-color="#caf79c" />
     <stop offset="42.857%" stop-color="#a8fdbf" />
     <stop offset="57.143%" stop-color="#70feff" />
     <stop offset="71.429%" stop-color="#a8bffd" />
     <stop offset="85.714%" stop-color="#ca9cf7" />
     <stop offset="100.000%" stop-color="#fc85dc" />
     </linearGradient></defs>
     $pastData
     <rect width="100%" height="100%" fill="url(#rainbow)" fill-opacity="0.4" />
     <path d="$pathString" fill="black" />
     </svg>|j};

    "data:image/svg+xml;utf8," ++ encodeURIComponent(svg);
  };

let svgNs = "http://www.w3.org/2000/svg";

let createQrCodePathElement: (QrCode.t, int) => Dom.element =
  (code, border) => {
    let path = DocumentRe.createElementNS(svgNs, "path", document);
    ElementRe.setAttribute("d", getPathString(code, border), path);
    path;
  };

let createRainbowGradient: unit => Dom.element =
  _ => {
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
        ++ "turn,100%,85%)",
        stop,
      );
      ElementRe.appendChild(stop, gradient);
    };

    gradient;
  };

let createSimpleSvg: (QrCode.t, int, option(string)) => Dom.element =
  (code, border, maybeDataURL) => {
    let size = QrCode.size(code);
    let sizeWithBorder = size + border * 2;
    let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

    let svg = DocumentRe.createElementNS(svgNs, "svg", document);
    ElementRe.setAttribute("viewBox", viewBox, svg);

    let defs = DocumentRe.createElementNS(svgNs, "defs", document);
    let rainbowGradient = createRainbowGradient();
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
      ElementRe.appendChild(background, svg);
    | None => ()
    };

    let rainbow = DocumentRe.createElementNS(svgNs, "rect", document);
    ElementRe.setAttribute("width", "100%", rainbow);
    ElementRe.setAttribute("height", "100%", rainbow);
    ElementRe.setAttribute("fill", "url(#rainbow)", rainbow);
    ElementRe.setAttribute("fill-opacity", "0.5", rainbow);
    ElementRe.appendChild(rainbow, svg);

    let path = createQrCodePathElement(code, border);
    ElementRe.appendChild(path, svg);

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
