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

let svgXmlns = "http://www.w3.org/2000/svg";

let createSvg:
  (Dom.element, option(Dom.element), option(string), QrCode.t) => Dom.element =
  (parent, maybePrevious, maybeSnapshot, code) => {
    let size = QrCode.size(code);
    let border = 4;
    let sizeWithBorder = size + border * 2;
    let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

    let childSvg = DocumentRe.createElementNS(svgXmlns, "svg", document);
    ElementRe.setAttribute("viewBox", viewBox, childSvg);

    let past = DocumentRe.createElementNS(svgXmlns, "g", document);
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
        DocumentRe.createElementNS(svgXmlns, "image", document);
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
      ElementRe.setAttribute("style", "opacity: 0.4", snapshotImage);
      ElementRe.appendChild(snapshotImage, childSvg);
    | None => ()
    };

    let rainbow = DocumentRe.createElementNS(svgXmlns, "rect", document);
    ElementRe.setAttribute("width", "100%", rainbow);
    ElementRe.setAttribute("height", "100%", rainbow);
    ElementRe.setAttribute("fill", "url(#rainbow)", rainbow);
    ElementRe.setAttribute("fill-opacity", "0.7", rainbow);

    ElementRe.appendChild(rainbow, childSvg);

    let path = DocumentRe.createElementNS(svgXmlns, "path", document);
    ElementRe.setAttribute("d", getPathString(code, border), path);
    ElementRe.setAttribute("fill", "#000000", path);
    ElementRe.setAttribute("fill-opacity", "0.5", path);
    ElementRe.appendChild(path, childSvg);

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
