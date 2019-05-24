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

let makeAnimate = (values, duration, animBegin) => {
  let animate = DocumentRe.createElementNS(svgNs, "animate", document);
  ElementRe.setAttribute("attributeName", "opacity", animate);
  ElementRe.setAttribute("values", values, animate);
  ElementRe.setAttribute("dur", duration, animate);
  ElementRe.setAttribute("begin", animBegin, animate);
  ElementRe.setAttribute("fill", "freeze", animate);
  ElementRe.setAttribute("keyTimes", "0;0.5;1", animate);
  ElementRe.setAttribute("repeatCount", "indefinite", animate);

  animate;
};

let scriptText = {|
function clearAnimacy() {
   document.querySelectorAll("svg.animate").forEach(function(x) { x.setAttribute("class", "code previous"); });
   document.querySelectorAll("svg.previous").forEach(function(x) { x.setAttribute("class", "code"); });
}

function init() {
    if (!document.body) {
        var nowShowing = 0;
        const ids = Array.prototype.slice.call(document.querySelectorAll("svg.code"), null).map(function(x, i) {
            if (x.className.animVal.indexOf("animate") !== -1) {
                nowShowing = i;
            }
            return x.id;
         });
         var lastChanged = 0.0;
         function tick(timestamp) {
             if (timestamp - lastChanged > 4000.0) {
                 var id = "#" + ids[nowShowing];
                 clearAnimacy();
                 document.querySelector(id).setAttribute("class", " code animate");
                 nowShowing = (nowShowing + 1) % ids.length;
                 lastChanged = timestamp;
             }
             window.requestAnimationFrame(tick);
         }
         window.requestAnimationFrame(tick);
    }
}

window.addEventListener("load", init, false);
|};

[@bs.set] external setText : (Dom.element, string) => unit = "text";

let styleText = {|
   /* <![CDATA[ */
   @namespace svg "http://www.w3.org/2000/svg";

   @keyframes fadeOut {
   from { opacity: 1; }
   }

   svg|svg svg|svg {
     display: none;
   }

   svg|svg.animate, svg|svg.previous {
      display: block;
   }

   image, g.codeGroup {
       mix-blend-mode: difference;
   }

   svg|svg.animate g.codeGroup {
      animation: fadeIn 2s infinite alternate;
   }
   svg|svg.previous g.codeGroup {
      animation: fadeIn 4s infinite alternate;
   }
   /* ]]> */

|};

let createScript = () : Dom.element => {
  let script = DocumentRe.createElementNS(svgNs, "script", document);

  ElementRe.setTextContent(script, scriptText);
  script;
};
let createStyle = () : Dom.element => {
  let style = DocumentRe.createElementNS(svgNs, "style", document);

  ElementRe.setTextContent(style, styleText);
  style;
};

let createSymbol =
    (
      ~href: string,
      ~code: QrCode.t,
      ~hash: string,
      ~maybeDataURL: option(string),
      ~localeString: string,
      ~border: int,
      ~invert: bool,
      ~animated: bool,
    )
    : Dom.element => {
  let size = QrCode.size(code);
  let sizeWithBorder = size + border * 2;
  let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

  let symbol = DocumentRe.createElementNS(svgNs, "symbol", document);
  ElementRe.setId(symbol, "code" ++ hash);
  ElementRe.setAttribute("viewBox", viewBox, symbol);

  switch (maybeDataURL) {
  | Some(url) =>
    let background = DocumentRe.createElementNS(svgNs, "image", document);
    ElementRe.setAttribute("x", "0", background);
    ElementRe.setAttribute("y", "0", background);
    ElementRe.setAttribute(
      "width",
      string_of_int(sizeWithBorder),
      background,
    );
    ElementRe.setAttribute(
      "height",
      string_of_int(sizeWithBorder),
      background,
    );
    ElementRe.setAttribute("href", url, background);

    if (animated) {
      let bgAnimate = makeAnimate("0;1;0", "6s", "0s");
      ElementRe.appendChild(bgAnimate, background);
    };
    ElementRe.appendChild(background, symbol);
  | None => ()
  };

  let codeGroup = DocumentRe.createElementNS(svgNs, "g", document);

  let rect = DocumentRe.createElementNS(svgNs, "rect", document);
  ElementRe.setAttribute("width", "100%", rect);
  ElementRe.setAttribute("height", "100%", rect);

  if (! invert) {
    ElementRe.setAttribute("fill", "url(#rainbow)", rect);
  } else {
    ElementRe.setAttribute("fill", "#000000", rect);
  };

  if (! animated) {
    ElementRe.setAttribute("fill-opacity", "0.9", rect);
  };

  ElementRe.appendChild(rect, codeGroup);

  let path = createQrCodePathElement(code, border);
  ElementRe.appendChild(path, codeGroup);

  if (invert) {
    ElementRe.setAttribute("fill", "#FFFFFF", path);
  };

  if (animated) {
    let codeGroupAnimate = makeAnimate("1;0;1", "6s", "0s");
    ElementRe.appendChild(codeGroupAnimate, codeGroup);
  };
  ElementRe.appendChild(codeGroup, symbol);

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

  let timeLink = DocumentRe.createElementNS(svgNs, "a", document);
  ElementRe.setAttribute("href", href, timeLink);
  ElementRe.appendChild(timeText, timeLink);

  ElementRe.appendChild(timeLink, symbol);

  symbol;
};

let createSvgSkeleton = hash => {
  let svg = DocumentRe.createElementNS(svgNs, "svg", document);
  ElementRe.setAttribute("viewBox", "0 0 1 1", svg);

  let defs = DocumentRe.createElementNS(svgNs, "defs", document);
  let rainbowGradient = createRainbowGradient(0.95);
  ElementRe.appendChild(rainbowGradient, defs);
  ElementRe.appendChild(defs, svg);

  let script = createScript();
  ElementRe.appendChild(script, svg);

  let use = DocumentRe.createElementNS(svgNs, "use", document);
  ElementRe.setAttribute("href", "#code" ++ hash, use);
  ElementRe.appendChild(use, svg);

  svg;
};

let createIconSvg =
    (~code: QrCode.t, ~border: int, ~bg: bool, ~invert: bool)
    : (Dom.element, int) => {
  let size = QrCode.size(code);
  let sizeWithBorder = size + border * 2;
  let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

  let svg = DocumentRe.createElementNS(svgNs, "svg", document);
  ElementRe.setAttribute("viewBox", viewBox, svg);

  if (bg) {
    if (! invert) {
      let defs = DocumentRe.createElementNS(svgNs, "defs", document);
      let rainbowGradient = createRainbowGradient(0.85);
      ElementRe.appendChild(rainbowGradient, defs);
      ElementRe.appendChild(defs, svg);
    };

    let rect = DocumentRe.createElementNS(svgNs, "rect", document);
    ElementRe.setAttribute("width", "100%", rect);
    ElementRe.setAttribute("height", "100%", rect);

    if (! invert) {
      ElementRe.setAttribute("fill", "url(#rainbow)", rect);
    } else {
      ElementRe.setAttribute("fill", "#000000", rect);
    };
    ElementRe.appendChild(rect, svg);
  };

  let path = createQrCodePathElement(code, border);
  if (invert) {
    ElementRe.setAttribute("fill", "#FFFFFF", path);
  } else {
    ElementRe.setAttribute("fill", "#000000", path);
  };
  ElementRe.appendChild(path, svg);
  (svg, sizeWithBorder);
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

let codeToImage = (~code: QrCode.t, ~border: int) : Dom.element => {
  let (iconSvg, sizeWithBorder) =
    createIconSvg(~code, ~border=6, ~invert=true, ~bg=false);
  let sizeStr = string_of_int(sizeWithBorder);

  let iconSvgUrl = svgToDataURL(iconSvg);
  let iconSvgImg = DocumentRe.createElementNS(htmlNs, "img", document);

  ElementRe.setAttribute("src", iconSvgUrl, iconSvgImg);
  ElementRe.setAttribute("width", sizeStr, iconSvgImg);
  ElementRe.setAttribute("height", sizeStr, iconSvgImg);

  iconSvgImg;
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
