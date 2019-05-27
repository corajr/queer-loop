open Util;
open QrCodeGen;
open Webapi.Dom;

let lightRainbowLightness = 0.95;

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

let createRainbowGradient: (float, string) => Dom.element =
  (lightness, id) => {
    let gradient =
      DocumentRe.createElementNS(svgNs, "linearGradient", document);

    ElementRe.setId(gradient, id);
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

let styleText = {|
   @namespace svg "http://www.w3.org/2000/svg";

   @keyframes fadeIn {
   from { opacity: 0.0; }
   }

   svg|svg svg|svg {
     display: none;
   }

   svg|svg.animate, svg|svg.previous, svg|svg.active {
      display: block;
   }

   svg|svg.animate.temporarilyInactive {
      display: none;
   }

   svg|svg.animationsEnabled svg|svg.animate {
     animation: fadeIn 2s infinite alternate;
   }

   svg|svg.previous g.codeGroup, svg|svg.active g.codeGroup {
       opacity: 0.1;
   }
   svg|svg.active {
       mix-blend-mode: screen;
   }
|};

let createScript = string : Dom.element => {
  let script = DocumentRe.createElementNS(svgNs, "script", document);

  ElementRe.setTextContent(script, string);
  script;
};

let createStyle = () : Dom.element => {
  let style = DocumentRe.createElementNS(svgNs, "style", document);
  ElementRe.setAttribute("type", "text/css", style);

  ElementRe.setTextContent(style, styleText);
  style;
};

let addBackground =
    (~codeSvg: Dom.element, ~sizeWithBorder: int, ~dataURL: string) => {
  let background = DocumentRe.createElementNS(svgNs, "image", document);
  ElementRe.setAttribute("x", "0", background);
  ElementRe.setAttribute("y", "0", background);
  ElementRe.setAttribute("width", string_of_int(sizeWithBorder), background);
  ElementRe.setAttribute(
    "height",
    string_of_int(sizeWithBorder),
    background,
  );
  ElementRe.setAttribute("href", dataURL, background);
  ElementRe.querySelector(".codeGroup", codeSvg)
  |. Belt.Option.map(codeGroup =>
       ElementRe.insertBefore(background, codeGroup, codeSvg)
     );
};

let createTimeLink =
    (~href, ~timestamp, ~localeString, ~sizeWithBorder, ~border) => {
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
  timeLink;
};

let createCodeSvg =
    (
      ~href: string,
      ~code: QrCode.t,
      ~hash: string,
      ~localeString: string,
      ~timestamp: string,
      ~border: int,
      ~invert: bool,
    )
    : Dom.element => {
  let size = QrCode.size(code);
  let sizeWithBorder = size + border * 2;
  let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

  let codeSvg = DocumentRe.createElementNS(svgNs, "svg", document);
  ElementRe.setId(codeSvg, "code" ++ hash);
  ElementRe.setAttribute("viewBox", viewBox, codeSvg);

  let codeGroup = DocumentRe.createElementNS(svgNs, "g", document);

  let scale = float_of_int(size) /. float_of_int(sizeWithBorder);

  ElementRe.setAttribute(
    "transform",
    {j|translate($border,$border) scale($scale)|j},
    codeGroup,
  );

  let rect = DocumentRe.createElementNS(svgNs, "rect", document);
  ElementRe.setAttribute("width", "100%", rect);
  ElementRe.setAttribute("height", "100%", rect);

  if (! invert) {
    ElementRe.setAttribute("fill", "#FFFFFF", rect);
  } else {
    ElementRe.setAttribute("fill", "#000000", rect);
  };

  ElementRe.appendChild(rect, codeGroup);

  let path = createQrCodePathElement(code, border);
  ElementRe.appendChild(path, codeGroup);

  if (invert) {
    ElementRe.setAttribute("fill", "url(#lightRainbow)", path);
  } else {
    ElementRe.setAttribute("fill", "url(#darkRainbow)", path);
  };
  ElementRe.setAttribute("class", "codeGroup", codeGroup);

  ElementRe.appendChild(codeGroup, codeSvg);

  let metadataGroup = DocumentRe.createElementNS(svgNs, "g", document);
  ElementRe.appendChild(
    createTimeLink(
      ~href,
      ~timestamp,
      ~localeString,
      ~border,
      ~sizeWithBorder,
    ),
    metadataGroup,
  );
  ElementRe.appendChild(metadataGroup, codeSvg);

  codeSvg;
};

let createSvgSkeleton = hash => {
  let svg = DocumentRe.createElementNS(svgNs, "svg", document);
  ElementRe.setAttribute("viewBox", "0 0 1 1", svg);
  ElementRe.setAttribute("class", "root", svg);

  let defs = DocumentRe.createElementNS(svgNs, "defs", document);
  let lightRainbowGradient =
    createRainbowGradient(lightRainbowLightness, "lightRainbow");
  let darkRainbowGradient = createRainbowGradient(0.1, "darkRainbow");
  ElementRe.appendChild(lightRainbowGradient, defs);
  ElementRe.appendChild(darkRainbowGradient, defs);
  ElementRe.appendChild(defs, svg);

  withQuerySelectorDom("script.main", main => {
    let script = createScript(ElementRe.textContent(main));
    ElementRe.appendChild(script, svg);
  });

  let style = createStyle();
  ElementRe.appendChild(style, svg);

  let centralGroup = DocumentRe.createElementNS(svgNs, "g", document);
  ElementRe.setId(centralGroup, "centralGroup");
  /* ElementRe.setAttribute( */
  /*   "transform", */
  /*   {j|translate(0.5,0.5) scale(0.5)|j}, */
  /*   centralGroup, */
  /* ); */
  ElementRe.appendChild(centralGroup, svg);

  /* let htmlContainer = */
  /*   DocumentRe.createElementNS(svgNs, "foreignObject", document); */
  /* ElementRe.setAttribute("x", "0", htmlContainer); */
  /* ElementRe.setAttribute("y", "0", htmlContainer); */
  /* ElementRe.setAttribute("width", "1", htmlContainer); */
  /* ElementRe.setAttribute("height", "1", htmlContainer); */
  /* ElementRe.setAttribute("class", "htmlContainer", htmlContainer); */

  /* ElementRe.appendChild(htmlContainer, svg); */

  svg;
};

let createIconSvg =
    (~code: QrCode.t, ~border: int, ~bg: bool, ~hash: string, ~invert: bool)
    : (Dom.element, int) => {
  let size = QrCode.size(code);
  let sizeWithBorder = size + border * 2;
  let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

  let svg = DocumentRe.createElementNS(svgNs, "svg", document);
  ElementRe.setAttribute("viewBox", viewBox, svg);

  ElementRe.setAttribute("class", "icon", svg);

  let defs = DocumentRe.createElementNS(svgNs, "defs", document);
  let lightRainbowGradient =
    createRainbowGradient(lightRainbowLightness, "lightRainbow");
  let darkRainbowGradient = createRainbowGradient(0.1, "darkRainbow");
  ElementRe.appendChild(lightRainbowGradient, defs);
  ElementRe.appendChild(darkRainbowGradient, defs);
  ElementRe.appendChild(defs, svg);

  if (bg) {
    let rect = DocumentRe.createElementNS(svgNs, "rect", document);
    ElementRe.setAttribute("width", "100%", rect);
    ElementRe.setAttribute("height", "100%", rect);

    if (! invert) {
      ElementRe.setAttribute("fill", "#FFFFFF", rect);
    } else {
      ElementRe.setAttribute("fill", "#000000", rect);
    };
    ElementRe.appendChild(rect, svg);
  };

  let rect = DocumentRe.createElementNS(svgNs, "rect", document);
  ElementRe.setAttribute("width", "100%", rect);
  ElementRe.setAttribute("height", "100%", rect);
  ElementRe.setAttribute(
    "fill",
    "#" ++ Js.String.slice(~from=0, ~to_=6, hash),
    rect,
  );
  ElementRe.appendChild(rect, svg);

  let path = createQrCodePathElement(code, border);
  if (invert) {
    ElementRe.setAttribute("fill", "url(#lightRainbow)", path);
  } else {
    ElementRe.setAttribute("fill", "url(#darkRainbow)", path);
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

let svgToImg = (~svg: Dom.element) : Dom.element => {
  let svgUrl = svgToDataURL(svg);
  let svgImg = DocumentRe.createElementNS(htmlNs, "img", document);

  ElementRe.setAttribute("src", svgUrl, svgImg);
  ElementRe.setAttribute("width", "480", svgImg);
  ElementRe.setAttribute("height", "480", svgImg);

  svgImg;
};

let codeToImage = (~code: QrCode.t, ~border: int, ~hash: string) : Dom.element => {
  let (iconSvg, sizeWithBorder) =
    createIconSvg(~code, ~border, ~invert=true, ~hash, ~bg=false);
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
