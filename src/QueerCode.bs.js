// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

import * as Caml_array from "../node_modules/bs-platform/lib/es6/caml_array.js";
import * as Belt_Option from "../node_modules/bs-platform/lib/es6/belt_Option.js";
import * as Caml_option from "../node_modules/bs-platform/lib/es6/caml_option.js";
import * as Util$QueerLoop from "./Util.bs.js";

function getPathString(code, border) {
  var size = code.size;
  var modules = code.getModules();
  var parts = /* array */[];
  for(var y = 0 ,y_finish = size - 1 | 0; y <= y_finish; ++y){
    for(var x = 0 ,x_finish = size - 1 | 0; x <= x_finish; ++x){
      if (Caml_array.caml_array_get(Caml_array.caml_array_get(modules, y), x)) {
        parts.push("M" + (String(x + border | 0) + ("," + (String(y + border | 0) + "h1v1h-1z"))));
      }
      
    }
  }
  return parts.join(" ");
}

var svgNs = "http://www.w3.org/2000/svg";

function createQrCodePathElement(code, border) {
  var path = document.createElementNS(svgNs, "path");
  path.setAttribute("d", getPathString(code, border));
  return path;
}

function createRainbowGradient(lightness) {
  var gradient = document.createElementNS(svgNs, "linearGradient");
  gradient.id = "rainbow";
  for(var i = 0; i <= 7; ++i){
    var stop = document.createElementNS(svgNs, "stop");
    stop.setAttribute("offset", (100.0 * i / 7.0).toString() + "%");
    stop.setAttribute("stop-color", "hsl(" + ((i / 8.0).toString() + ("turn,100%," + ((lightness * 100.0).toString() + "%)"))));
    gradient.appendChild(stop);
  }
  gradient.setAttribute("gradientTransform", "rotate(45)");
  return gradient;
}

function makeAnimate(values, duration, animBegin) {
  var animate = document.createElementNS(svgNs, "animate");
  animate.setAttribute("attributeName", "opacity");
  animate.setAttribute("values", values);
  animate.setAttribute("dur", duration);
  animate.setAttribute("begin", animBegin);
  animate.setAttribute("fill", "freeze");
  animate.setAttribute("keyTimes", "0;0.5;1");
  animate.setAttribute("repeatCount", "indefinite");
  return animate;
}

var scriptText = "\n   /* <![CDATA[ */\nfunction clearAnimacy() {\n   document.querySelectorAll(\"svg.animate\").forEach(function(x) { x.setAttribute(\"class\", \"code previous\"); });\n   document.querySelectorAll(\"svg.previous\").forEach(function(x) { x.setAttribute(\"class\", \"code\"); });\n}\n\nfunction init() {\n    if (!document.body) {\n        var nowShowing = 0;\n        const ids = Array.prototype.slice.call(document.querySelectorAll(\"svg.code\"), null).map(function(x, i) {\n            if (x.className.animVal.indexOf(\"animate\") !== -1) {\n                nowShowing = i;\n            }\n            return x.id;\n         });\n         var lastChanged = 0.0;\n         function tick(timestamp) {\n             if (timestamp - lastChanged > 4000.0) {\n                 var id = \"#\" + ids[nowShowing];\n                 clearAnimacy();\n                 document.querySelector(id).setAttribute(\"class\", \" code animate\");\n                 nowShowing = (nowShowing + 1) % ids.length;\n                 lastChanged = timestamp;\n             }\n             window.requestAnimationFrame(tick);\n         }\n         window.requestAnimationFrame(tick);\n    }\n}\n\nwindow.addEventListener(\"load\", init, false);\n   /* ]]> */\n";

var styleText = "\n   @namespace svg \"http://www.w3.org/2000/svg\";\n\n   @keyframes fadeIn {\n   from { opacity: 0.0; }\n   }\n\n   svg|svg svg|svg {\n     display: none;\n   }\n\n   svg|svg.animate, svg|svg.previous, svg|svg.selected {\n      display: block;\n   }\n\n   svg|svg.animate {\n      animation: fadeIn 2s infinite alternate;\n   }\n\n   svg|svg.previous {\n       animation: fadeIn 1s infinite alternate;\n   }\n   svg|svg.selected g.codeGroup {\n       opacity: 0.1;\n   }\n";

function createScript(param) {
  var script = document.createElementNS(svgNs, "script");
  script.textContent = scriptText;
  return script;
}

function createStyle(param) {
  var style = document.createElementNS(svgNs, "style");
  style.setAttribute("type", "text/css");
  style.textContent = styleText;
  return style;
}

function addBackground(codeSvg, sizeWithBorder, dataURL) {
  var background = document.createElementNS(svgNs, "image");
  background.setAttribute("x", "0");
  background.setAttribute("y", "0");
  background.setAttribute("width", String(sizeWithBorder));
  background.setAttribute("height", String(sizeWithBorder));
  background.setAttribute("href", dataURL);
  return Belt_Option.map(Caml_option.nullable_to_opt(codeSvg.querySelector(".codeGroup")), (function (codeGroup) {
                return codeSvg.insertBefore(background, codeGroup);
              }));
}

function createTimeLink(href, timestamp, localeString, sizeWithBorder, border) {
  var timeText = document.createElementNS(svgNs, "text");
  timeText.setAttribute("x", (sizeWithBorder / 2.0).toString());
  timeText.setAttribute("y", (border / 2.0).toString());
  timeText.setAttribute("font-size", (border / 2.0).toString() + "px");
  timeText.setAttribute("text-anchor", "middle");
  timeText.setAttribute("alignment-baseline", "middle");
  timeText.setAttribute("style", "text-align: center; font-family: \"Courier New\", monospace;");
  timeText.setAttribute("textLength", "90%");
  timeText.setAttribute("fill", "#FFFFFF");
  timeText.setAttribute("style", "mix-blend-mode: difference");
  timeText.textContent = localeString;
  var timeLink = document.createElementNS(svgNs, "a");
  timeLink.setAttribute("href", href);
  timeLink.appendChild(timeText);
  return timeLink;
}

function createCodeSvg(href, code, hash, localeString, timestamp, border, invert) {
  var size = code.size;
  var sizeWithBorder = size + (border << 1) | 0;
  var viewBox = "0 0 " + (String(sizeWithBorder) + (" " + (String(sizeWithBorder) + "")));
  var codeSvg = document.createElementNS(svgNs, "svg");
  codeSvg.id = "code" + hash;
  codeSvg.setAttribute("viewBox", viewBox);
  var codeGroup = document.createElementNS(svgNs, "g");
  var rect = document.createElementNS(svgNs, "rect");
  rect.setAttribute("width", "100%");
  rect.setAttribute("height", "100%");
  if (invert) {
    rect.setAttribute("fill", "#000000");
  } else {
    rect.setAttribute("fill", "url(#rainbow)");
  }
  codeGroup.appendChild(rect);
  var path = createQrCodePathElement(code, border);
  codeGroup.appendChild(path);
  if (invert) {
    path.setAttribute("fill", "#FFFFFF");
  }
  codeGroup.setAttribute("class", "codeGroup");
  codeSvg.appendChild(codeGroup);
  codeSvg.appendChild(createTimeLink(href, timestamp, localeString, sizeWithBorder, border));
  return codeSvg;
}

function createSvgSkeleton(hash) {
  var svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", "0 0 1 1");
  var defs = document.createElementNS(svgNs, "defs");
  var rainbowGradient = createRainbowGradient(0.85);
  defs.appendChild(rainbowGradient);
  svg.appendChild(defs);
  var script = createScript(/* () */0);
  svg.appendChild(script);
  var style = createStyle(/* () */0);
  svg.appendChild(style);
  return svg;
}

function createIconSvg(code, border, bg, invert) {
  var size = code.size;
  var sizeWithBorder = size + (border << 1) | 0;
  var viewBox = "0 0 " + (String(sizeWithBorder) + (" " + (String(sizeWithBorder) + "")));
  var svg = document.createElementNS(svgNs, "svg");
  svg.setAttribute("viewBox", viewBox);
  if (bg) {
    if (!invert) {
      var defs = document.createElementNS(svgNs, "defs");
      var rainbowGradient = createRainbowGradient(0.85);
      defs.appendChild(rainbowGradient);
      svg.appendChild(defs);
    }
    var rect = document.createElementNS(svgNs, "rect");
    rect.setAttribute("width", "100%");
    rect.setAttribute("height", "100%");
    if (invert) {
      rect.setAttribute("fill", "#000000");
      rect.setAttribute("fill-opacity", "0.8");
    } else {
      rect.setAttribute("fill", "url(#rainbow)");
    }
    svg.appendChild(rect);
  }
  var path = createQrCodePathElement(code, border);
  if (invert) {
    path.setAttribute("fill", "#FFFFFF");
  } else {
    path.setAttribute("fill", "#000000");
  }
  svg.appendChild(path);
  return /* tuple */[
          svg,
          sizeWithBorder
        ];
}

var $$XMLSerializer = /* module */[];

function svgToDataURL(svg) {
  var xmlSerializer = new XMLSerializer();
  var str = xmlSerializer.serializeToString(svg);
  return "data:image/svg+xml;utf8," + encodeURIComponent(str);
}

function svgToImg(svg) {
  var svgUrl = svgToDataURL(svg);
  var svgImg = document.createElementNS(Util$QueerLoop.htmlNs, "img");
  svgImg.setAttribute("src", svgUrl);
  svgImg.setAttribute("width", "480");
  svgImg.setAttribute("height", "480");
  return svgImg;
}

function codeToImage(code, border) {
  var match = createIconSvg(code, 6, false, true);
  var sizeStr = String(match[1]);
  var iconSvgUrl = svgToDataURL(match[0]);
  var iconSvgImg = document.createElementNS(Util$QueerLoop.htmlNs, "img");
  iconSvgImg.setAttribute("src", iconSvgUrl);
  iconSvgImg.setAttribute("width", sizeStr);
  iconSvgImg.setAttribute("height", sizeStr);
  return iconSvgImg;
}

function drawCanvas(canvas, code) {
  var size = code.size;
  var width = size + 4 | 0;
  if (canvas.width !== width) {
    canvas.width = width;
    canvas.height = width;
  }
  var ctx = canvas.getContext("2d");
  ctx.globalCompositeOperation = "difference";
  ctx.fillStyle = "#FFFFFF";
  for(var y = -2 ,y_finish = size + 2 | 0; y <= y_finish; ++y){
    for(var x = -2 ,x_finish = size + 2 | 0; x <= x_finish; ++x){
      if (code.getModule(x, y)) {
        ctx.fillRect(x + 2 | 0, y + 2 | 0, 1, 1);
      }
      
    }
  }
  return /* () */0;
}

export {
  getPathString ,
  svgNs ,
  createQrCodePathElement ,
  createRainbowGradient ,
  makeAnimate ,
  scriptText ,
  styleText ,
  createScript ,
  createStyle ,
  addBackground ,
  createTimeLink ,
  createCodeSvg ,
  createSvgSkeleton ,
  createIconSvg ,
  $$XMLSerializer ,
  svgToDataURL ,
  svgToImg ,
  codeToImage ,
  drawCanvas ,
  
}
/* Util-QueerLoop Not a pure module */
