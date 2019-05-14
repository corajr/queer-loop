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

let modulesToSvgString: array(array(bool)) => string = [%bs.raw
  modules => {|

     var border = 4;
     var size = modules.length;

		 if (border < 0)
		 throw "Border must be non-negative";
		 var parts = [];
		 for (var y = 0; y < size; y++) {
		 for (var x = 0; x < size; x++) {
     if (modules[y][x])
		 parts.push("M" + (x + border) + "," + (y + border) + "h1v1h-1z");
		 }
		 }
		 return '<?xml version="1.0" encoding="UTF-8"?>\n' +
		 '<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
		 '<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' +
		 (size + border * 2) + ' ' + (size + border * 2) + '" stroke="none">' +
     '<defs>' +
     '<linearGradient id="rainbow">' +
     '<stop offset="0%" stop-color="hsl(300deg,100%,28%)" />' +
     '<stop offset="14.285%" stop-color="hsl(265deg,100%,30%)" />' +
     '<stop offset="28.571%" stop-color="hsl(180deg,100%,38%)" />' +
     '<stop offset="42.857%" stop-color="hsl(120deg,100%,28%)" />' +
     '<stop offset="57.142%" stop-color="hsl(60deg,100%,50%)" />' +
     '<stop offset="71.428%" stop-color="hsl(33deg,100%,50%)" />' +
     '<stop offset="85.712%" stop-color="hsl(0deg,100%,50%)" />' +
     '<stop offset="100%" stop-color="hsl(330deg,100%,71%)" />' +
     '</linearGradient></defs>' +
     '<rect width="100%" height="100%" fill="#FFFFFF" fill-opacity="0.99" />\n' +
     '<rect width="100%" height="100%" fill="url(#rainbow)" fill-opacity="0.05" />\n' +
     '<path d="' + parts.join(" ") + '" fill="#FFFFFF" style="mix-blend-mode: difference;" />' +
		 '</svg>';
     |}
];

let setSvg: (QrCode.t, Dom.element) => unit =
  (t, el) => {
    let moduleArray = QrCode.getModules(t);
    let queerSvg = modulesToSvgString(moduleArray);
    _setSvg(queerSvg, el);
  };
