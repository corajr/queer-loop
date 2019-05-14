// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE
'use strict';

var List = require("bs-platform/lib/js/list.js");
var $$Array = require("bs-platform/lib/js/array.js");
var $$String = require("bs-platform/lib/js/string.js");
var Caml_array = require("bs-platform/lib/js/caml_array.js");
var Caml_int32 = require("bs-platform/lib/js/caml_int32.js");
var QrCodeGen$QueerLoop = require("./QrCodeGen.bs.js");

function boolToHex(b) {
  if (b) {
    return "f";
  } else {
    return "0";
  }
}

function moduleArrayToRgbHex(modules) {
  var width = modules.length;
  var height = Caml_array.caml_array_get(modules, 0).length;
  var rgbModules = $$Array.make_matrix(width, height, "#fff");
  var rgbWidth = width / 3 | 0;
  for(var i = 0 ,i_finish = rgbWidth - 1 | 0; i <= i_finish; ++i){
    for(var j = 0 ,j_finish = height - 1 | 0; j <= j_finish; ++j){
      var x = Caml_int32.imul(i, 3);
      var r = Caml_array.caml_array_get(Caml_array.caml_array_get(modules, j), x);
      var match = (x + 1 | 0) < rgbWidth;
      var g = match ? Caml_array.caml_array_get(Caml_array.caml_array_get(modules, j), x + 1 | 0) : false;
      var match$1 = (x + 2 | 0) < rgbWidth;
      var b = match$1 ? Caml_array.caml_array_get(Caml_array.caml_array_get(modules, j), x + 2 | 0) : false;
      Caml_array.caml_array_set(Caml_array.caml_array_get(rgbModules, i), j, "#" + $$String.concat("", List.map(boolToHex, /* :: */[
                    r,
                    /* :: */[
                      g,
                      /* :: */[
                        b,
                        /* [] */0
                      ]
                    ]
                  ])));
    }
  }
  return rgbModules;
}

function rgbModulesToSvgString (modules){

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
     };

function modulesToSvgString (modules){

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
     '<rect width="100%" height="100%" fill="url(#rainbow)" fill-opacity="0.2" />\n' +
     '<path d="' + parts.join(" ") + '" fill="#FFFFFF" style="mix-blend-mode: difference;" />' +
		 '</svg>';
     };

function setSvg(t, el) {
  var moduleArray = t.getModules();
  var queerSvg = modulesToSvgString(moduleArray);
  return QrCodeGen$QueerLoop._setSvg(queerSvg, el);
}

exports.boolToHex = boolToHex;
exports.moduleArrayToRgbHex = moduleArrayToRgbHex;
exports.rgbModulesToSvgString = rgbModulesToSvgString;
exports.modulesToSvgString = modulesToSvgString;
exports.setSvg = setSvg;
/* QrCodeGen-QueerLoop Not a pure module */
