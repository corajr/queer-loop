open Util;
open QrCodeGen;

let getPathString: QrCode.t => string =
  code => {
    let size = QrCode.size(code);
    let border = 4;
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
    let pathString = getPathString(code);
    let border = 4;
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
     <rect width="100%" height="100%" fill="url(#rainbow)" fill-opacity="0.5" />
     <path d="$pathString" fill="black" />
     </svg>|j};

    "data:image/svg+xml;utf8," ++ encodeURIComponent(svg);
  };

let setCodeOnSvg: (Dom.element, QrCode.t) => unit =
  (svg, code) => {
    let size = QrCode.size(code);
    let border = 4;
    let sizeWithBorder = size + border * 2;
    let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

    ElementRe.setAttribute("viewBox", viewBox, svg);
    ElementRe.querySelector("#current", svg)
    |. Belt.Option.map(currentPath =>
         ElementRe.setAttribute("d", getPathString(code), currentPath)
       );

    ();
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
