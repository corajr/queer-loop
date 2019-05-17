open Util;
open QrCodeGen;

let boolToHex = b => b ? "f" : "0";

let moduleArrayToRgbHex: array(array(bool)) => array(array(string)) =
  modules => {
    let width = Array.length(modules);
    let height = Array.length(modules[0]);
    let rgbModules = Array.make_matrix(width, height, "#fff");

    let rgbWidth = width / 3;
    let rgbHeight = height;

    for (i in 0 to rgbWidth - 1) {
      for (j in 0 to rgbHeight - 1) {
        let x = i * 3;
        let y = j;

        let r = modules[y][x];
        let g = x + 1 < rgbWidth ? modules[y][x + 1] : false;
        let b = x + 2 < rgbWidth ? modules[y][x + 2] : false;

        rgbModules[i][j] =
          "#" ++ String.concat("", List.map(boolToHex, [r, g, b]));
      };
    };

    rgbModules;
  };

let rgbModulesToSvgString: array(array(string)) => string = [%bs.raw
  modules => {|

     var border = 4;
     var width = modules[0].length;
     var height = modules.length;

		 if (border < 0)
		 throw "Border must be non-negative";
		 var rects = [];
		 for (var y = 0; y < height; y++) {
		 for (var x = 0; x < width; x++) {
     rects.push(
       '<rect width="1" height="1" fill="' + modules[x][y] +
       '" x="' + (x + border) + '" y="' + (y + border) +  '" />');

		 }
		 }
		 return '<?xml version="1.0" encoding="UTF-8"?>\n' +
		 '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
		 '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' +
		 (width + border * 2) + ' ' + (height + border * 2) + '" stroke="none">\n' +
		 '<rect width="100%" height="100%" fill="#FFFFFF"/>\n' +
     rects.join(" ") +
		 '</svg>\n';
     |}
];

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

let modulesToSvgString: (array(array(bool)), array(string)) => string = [%bs.raw
  (modules, foreignCodes) => {|
     var border = 4;
     var size = modules.length;

		 if (border < 0)
		 throw "Border must be non-negative";
		 var parts = [];
     var n = ~~((size + (border * 2)) / 2);
     var meta = foreignCodes.map((code, i) => {
       var x = i % n;
       var y = ~~(i / n);
       return '<image href="' + code + '" x="' + x * 2 + '" y="' + y * 2 + '" width="2" height="2" />'
     });
		 for (var y = 0; y < size; y++) {
		 for (var x = 0; x < size; x++) {

     if (modules[y][x]) {
		 parts.push("M" + (x + border) + "," + (y + border) + "h1v1h-1z");
     }
		 }
		 }
		 return '<?xml version="1.0" encoding="UTF-8"?>\n' +
		 '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
		 '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' +
		 (size + border * 2) + ' ' + (size + border * 2) + '" stroke="none">' +
     '<symbol id="code"><path d="' + parts.join(" ") + '" /></symbol>' +
     '<defs>' +
     '<mask id="mask">' +
     '<rect width="100%" height="100%" fill="#FFFFFF" />\n' +
     '<use href="#code" fill="#000000" />' +
     '</mask>' +
     '<linearGradient id="rainbow">' +
     '<stop offset="0.000%" stop-color="#ffb5b5" />' +
     '<stop offset="14.286%" stop-color="#fcdc85" />' +
     '<stop offset="28.571%" stop-color="#caf79c" />' +
     '<stop offset="42.857%" stop-color="#a8fdbf" />' +
     '<stop offset="57.143%" stop-color="#70feff" />' +
     '<stop offset="71.429%" stop-color="#a8bffd" />' +
     '<stop offset="85.714%" stop-color="#ca9cf7" />' +
     '<stop offset="100.000%" stop-color="#fc85dc" />' +
     '</linearGradient></defs>' +
     '<rect width="100%" height="100%" fill="url(#rainbow)" mask="url(#mask)" />\n' +
     '<use href="#code" fill="#000000" />' +
     '<g>' + meta.join("") + '</g>' +
		 '</svg>';
     |}
];

let _getSvgDataUri: (QrCode.t, array(string)) => string =
  (code, foreignCodes) => {
    let moduleArray = QrCode.getModules(code);
    let svg = modulesToSvgString(moduleArray, foreignCodes);
    "data:image/svg+xml;utf8," ++ encodeURIComponent(svg);
  };

let getSvgDataUri: (QrCode.t, option(string)) => string =
  (code, maybePastUrl) => {
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
     <rect width="100%" height="100%" fill="white" fill-opacity="0.2" />
     <path d="$pathString" fill="black" />
     </svg>|j};

    /* <rect width="100%" height="100%" fill="url(#rainbow)" fill-opacity="0.5" /> */

    "data:image/svg+xml;utf8," ++ encodeURIComponent(svg);
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
