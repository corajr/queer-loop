open Util;
open QrCodeGen;
open Webapi.Dom;

let lightRainbowLightness = 0.95;
let darkRainbowLightness = 0.1;

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
    let path = Document.createElementNS(svgNs, "path", document);
    Element.setAttribute("d", getPathString(code, border), path);
    Element.setAttribute("class", "codePath", path);
    path;
  };

let createRainbowGradient: (float, string) => Dom.element =
  (lightness, id) => {
    let gradient =
      Document.createElementNS(svgNs, "linearGradient", document);

    Element.setId(gradient, id);
    for (i in 0 to 7) {
      let stop = Document.createElementNS(svgNs, "stop", document);
      Element.setAttribute(
        "offset",
        Js.Float.toString(100.0 *. float_of_int(i) /. 7.0) ++ "%",
        stop,
      );
      Element.setAttribute(
        "stop-color",
        "hsl("
        ++ Js.Float.toString(float_of_int(i) /. 8.0)
        ++ "turn,100%,"
        ++ Js.Float.toString(lightness *. 100.0)
        ++ "%)",
        stop,
      );
      Element.appendChild(stop, gradient);
    };

    Element.setAttribute("gradientTransform", "rotate(45)", gradient);

    gradient;
  };

let styleText = {|
   @namespace svg "http://www.w3.org/2000/svg";

   svg|svg svg|svg, .background {
     visibility: hidden;
     transition: visibility 0s, opacity 0.5s;
   }

   svg|svg.animate, svg|svg.previous, svg|svg.active {
      visibility: visible;
   }

   svg|svg.animate .background, svg|svg.previous .background, svg|svg.active .background {
      visibility: visible;
      opacity: 1.0;
   }

   svg|svg.animate.temporarilyInactive, svg|svg.animate.temporarilyInactive .background {
      visibility: hidden;
   }

   .codeBackdrop {
      fill: white;
   }

   .invert .codeBackdrop {
      fill: black;
   }

   .codePath {
      fill: url(#darkRainbow);
   }

   .invert .codePath {
      fill: url(#lightRainbow);
   }

   .text, a, a:visited {
      color: white;
      mix-blend-mode: difference;
   }

   svg|text {
      fill: url(#lightRainbow);
   }

   .invert svg|text {
      fill: url(#darkRainbow);
   }

   .text {
      font-size: 1.5px;
      text-align: center;
   }

   .iconText {
      font-size: 6px;
      color: black;
   }
   .invert .iconText {
      color: white;
   }


   svg|svg.previous g.codeGroup, svg|svg.active g.codeGroup {
       opacity: 0.1;
   }

   svg|svg.active {
       opacity: 1.0;
       mix-blend-mode: screen;
   }

   svg|svg.previous {
       opacity: 0.25;
   }
|};

let createScript = string : Dom.element => {
  let script = Document.createElementNS(svgNs, "script", document);

  Element.setTextContent(script, string);
  script;
};

let createStyle = () : Dom.element => {
  let style = Document.createElementNS(svgNs, "style", document);
  Element.setAttribute("type", "text/css", style);

  Element.setTextContent(style, styleText);
  style;
};

let addBackground =
    (~codeSvg: Dom.element, ~sizeWithBorder: int, ~dataURL: string) => {
  let background = Document.createElementNS(svgNs, "image", document);
  Element.setAttribute("x", "0", background);
  Element.setAttribute("y", "0", background);
  Element.setAttribute("width", string_of_int(sizeWithBorder), background);
  Element.setAttribute("height", string_of_int(sizeWithBorder), background);
  Element.setAttribute("href", dataURL, background);
  Element.setAttribute("class", "background", background);
  Element.querySelector(".codeGroup", codeSvg)
  |. Belt.Option.map(codeGroup =>
       Element.insertBefore(background, codeGroup, codeSvg)
     );
};

let createTimeLink =
    (~href, ~timestamp, ~localeString, ~sizeWithBorder, ~border) => {
  let timeText = Document.createElementNS(svgNs, "text", document);
  Element.setAttribute(
    "x",
    Js.Float.toString(float_of_int(sizeWithBorder) /. 2.0),
    timeText,
  );
  Element.setAttribute(
    "y",
    Js.Float.toString(float_of_int(border) /. 2.0),
    timeText,
  );
  Element.setAttribute(
    "font-size",
    Js.Float.toString(float_of_int(border) /. 2.0) ++ "px",
    timeText,
  );
  Element.setAttribute("text-anchor", "middle", timeText);
  Element.setAttribute("alignment-baseline", "middle", timeText);
  Element.setAttribute(
    "style",
    "text-align: center; font-family: \"Courier New\", monospace;",
    timeText,
  );
  Element.setAttribute("textLength", "90%", timeText);
  Element.setTextContent(timeText, localeString);

  let timeLink = Document.createElementNS(svgNs, "a", document);
  Element.setAttribute("href", href, timeLink);
  Element.appendChild(timeText, timeLink);
  timeLink;
};

let createTextBox =
    (
      ~text: string,
      ~border: int,
      ~sizeWithBorder: int,
      ~additionalClasses: array(string)=[||],
      unit,
    )
    : Dom.element => {
  let htmlContainer =
    Document.createElementNS(svgNs, "foreignObject", document);
  Element.setAttribute("x", "0", htmlContainer);
  Element.setAttribute(
    "y",
    string_of_int(sizeWithBorder - border + 1),
    htmlContainer,
  );
  Element.setAttribute(
    "width",
    string_of_int(sizeWithBorder),
    htmlContainer,
  );
  Element.setAttribute("height", string_of_int(border), htmlContainer);

  let textDiv = Document.createElementNS(htmlNs, "div", document);
  Element.setTextContent(textDiv, text);
  let classes = Element.classList(textDiv);
  DomTokenList.add("text", classes);
  DomTokenList.addMany(additionalClasses, classes);
  Element.appendChild(textDiv, htmlContainer);

  htmlContainer;
};

let createCodeSvg =
    (
      ~href: string,
      ~code: QrCode.t,
      ~hash: string,
      ~localeString: string,
      ~timestamp: string,
      ~border: int,
    )
    : Dom.element => {
  let size = QrCode.size(code);
  let sizeWithBorder = size + border * 2;
  let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

  let codeSvg = Document.createElementNS(svgNs, "svg", document);
  Element.setId(codeSvg, "code" ++ hash);
  Element.setAttribute("viewBox", viewBox, codeSvg);

  let codeGroup = Document.createElementNS(svgNs, "g", document);

  let scale = float_of_int(size) /. float_of_int(sizeWithBorder);

  Element.setAttribute(
    "transform",
    {j|translate($border,$border) scale($scale)|j},
    codeGroup,
  );

  let rect = Document.createElementNS(svgNs, "rect", document);
  Element.setAttribute("width", "100%", rect);
  Element.setAttribute("height", "100%", rect);
  Element.setAttribute("class", "codeBackdrop", rect);
  Element.appendChild(rect, codeGroup);

  let path = createQrCodePathElement(code, border);
  Element.appendChild(path, codeGroup);

  Element.setAttribute("class", "codeGroup", codeGroup);
  Element.appendChild(codeGroup, codeSvg);

  let metadataGroup = Document.createElementNS(svgNs, "g", document);
  Element.appendChild(
    createTimeLink(
      ~href,
      ~timestamp,
      ~localeString,
      ~border,
      ~sizeWithBorder,
    ),
    metadataGroup,
  );

  let codeText = createTextBox(~text=href, ~border, ~sizeWithBorder, ());
  Element.appendChild(codeText, metadataGroup);
  Element.appendChild(metadataGroup, codeSvg);

  codeSvg;
};

let createSvgSkeleton = hash => {
  let svg = Document.createElementNS(svgNs, "svg", document);
  Element.setAttribute("viewBox", "0 0 1 1", svg);
  Element.setAttribute("class", "root", svg);

  let defs = Document.createElementNS(svgNs, "defs", document);
  let lightRainbowGradient =
    createRainbowGradient(lightRainbowLightness, "lightRainbow");
  let darkRainbowGradient =
    createRainbowGradient(darkRainbowLightness, "darkRainbow");
  Element.appendChild(lightRainbowGradient, defs);
  Element.appendChild(darkRainbowGradient, defs);
  Element.appendChild(defs, svg);

  withQuerySelectorDom("script.main", main => {
    let script = createScript(Element.textContent(main));
    Element.appendChild(script, svg);
  });

  let style = createStyle();
  Element.appendChild(style, svg);

  let centralGroup = Document.createElementNS(svgNs, "g", document);
  Element.setId(centralGroup, "centralGroup");
  /* Element.setAttribute( */
  /*   "transform", */
  /*   {j|translate(0.5,0.5) scale(0.5)|j}, */
  /*   centralGroup, */
  /* ); */
  Element.appendChild(centralGroup, svg);

  /* let htmlContainer = */
  /*   Document.createElementNS(svgNs, "foreignObject", document); */
  /* Element.setAttribute("x", "0", htmlContainer); */
  /* Element.setAttribute("y", "0", htmlContainer); */
  /* Element.setAttribute("width", "1", htmlContainer); */
  /* Element.setAttribute("height", "1", htmlContainer); */
  /* Element.setAttribute("class", "htmlContainer", htmlContainer); */

  /* Element.appendChild(htmlContainer, svg); */

  svg;
};

let createIconSvg =
    (~code: QrCode.t, ~border: int, ~bg: bool, ~hash: string)
    : (Dom.element, int) => {
  let size = QrCode.size(code);
  let sizeWithBorder = size + border * 2;
  let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

  let svg = Document.createElementNS(svgNs, "svg", document);
  Element.setAttribute("viewBox", viewBox, svg);

  Element.setAttribute("class", "icon", svg);

  let defs = Document.createElementNS(svgNs, "defs", document);
  let lightRainbowGradient =
    createRainbowGradient(lightRainbowLightness, "lightRainbow");
  let darkRainbowGradient =
    createRainbowGradient(darkRainbowLightness, "darkRainbow");
  Element.appendChild(lightRainbowGradient, defs);
  Element.appendChild(darkRainbowGradient, defs);
  Element.appendChild(defs, svg);

  if (bg) {
    let rect = Document.createElementNS(svgNs, "rect", document);
    Element.setAttribute("width", "100%", rect);
    Element.setAttribute("height", "100%", rect);
    Element.setAttribute("class", "codeBackdrop", rect);
    Element.appendChild(rect, svg);
  };

  let rect = Document.createElementNS(svgNs, "rect", document);
  Element.setAttribute("width", "100%", rect);
  Element.setAttribute("height", "100%", rect);
  Element.setAttribute(
    "fill",
    "#" ++ Js.String.slice(~from=0, ~to_=6, hash),
    rect,
  );
  Element.appendChild(rect, svg);

  let path = createQrCodePathElement(code, border);
  Element.appendChild(path, svg);
  (svg, sizeWithBorder);
};

let createIconFromText = (~text: string) : Dom.element =>
  switch (QrCode.encodeText(text, Ecc.low)) {
  | Some(code) =>
    let size = QrCode.size(code);
    let border = 6;
    let sizeWithBorder = size + border * 2;
    let viewBox = {j|0 0 $sizeWithBorder $sizeWithBorder|j};

    let svg = Document.createElementNS(svgNs, "svg", document);
    Element.setAttribute("viewBox", viewBox, svg);

    Element.setAttribute("class", "icon", svg);

    let defs = Document.createElementNS(svgNs, "defs", document);
    let lightRainbowGradient =
      createRainbowGradient(lightRainbowLightness, "lightRainbow");
    let darkRainbowGradient =
      createRainbowGradient(darkRainbowLightness, "darkRainbow");
    Element.appendChild(lightRainbowGradient, defs);
    Element.appendChild(darkRainbowGradient, defs);
    Element.appendChild(defs, svg);

    let rect = Document.createElementNS(svgNs, "rect", document);
    Element.setAttribute("width", "100%", rect);
    Element.setAttribute("height", "100%", rect);
    Element.setAttribute("class", "codeBackdrop", rect);
    Element.appendChild(rect, svg);

    let path = createQrCodePathElement(code, border);
    Element.appendChild(path, svg);

    let codeText =
      createTextBox(
        ~text,
        ~border,
        ~sizeWithBorder,
        ~additionalClasses=[|"iconText"|],
        (),
      );
    Element.setAttribute(
      "y",
      string_of_int(sizeWithBorder - border),
      codeText,
    );

    Element.appendChild(codeText, svg);

    Element.setAttribute("width", string_of_int(sizeWithBorder * 2), svg);
    Element.setAttribute("height", string_of_int(sizeWithBorder * 2), svg);

    svg;
  | None => Document.createElementNS(htmlNs, "div", document)
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

let svgToBlob: Dom.element => Blob.t =
  svg => {
    let xmlSerializer = XMLSerializer.make();
    let str = XMLSerializer.serializeToString(xmlSerializer, svg);
    let blob =
      Blob.makeFromString(
        [|str|],
        Blob.opts(~mimeType="image/svg+xml;charset=utf-8"),
      );
    blob;
  };

let svgToImg = (~svg: Dom.element) : Dom.element => {
  let svgUrl = svgToDataURL(svg);
  let svgImg = Document.createElementNS(htmlNs, "img", document);

  Element.setAttribute("src", svgUrl, svgImg);
  Element.setAttribute("width", "480", svgImg);
  Element.setAttribute("height", "480", svgImg);

  svgImg;
};

let svgToBlobObjectURL = (~svg: Dom.element) => {
  let svgBlob = svgToBlob(svg);
  Webapi.Url.createObjectURL(Blob.asFileT(svgBlob));
};

let svgToPng =
    (~svg: Dom.element, ~width: int=480, ~height: int=480, unit)
    : Dom.element => {
  let svgBlob = svgToBlob(svg);
  let svgUrl = Webapi.Url.createObjectURL(Blob.asFileT(svgBlob));

  let svgImg = Document.createElementNS(htmlNs, "img", document);
  let widthStr = string_of_int(width);
  let heightStr = string_of_int(height);
  Element.addEventListener(
    "load",
    _ =>
      withQuerySelectorDom("#snapshotCanvas", canvas => {
        let ctx = Canvas.getContext(canvas);

        Canvas.Ctx.drawImage(ctx, ~image=svgImg, ~dx=0, ~dy=0);
        Webapi.Url.revokeObjectURL(svgUrl);
      })
      |> ignore,
    svgImg,
  );

  Element.setAttribute("src", svgUrl, svgImg);
  Element.setAttribute("width", widthStr, svgImg);
  Element.setAttribute("height", heightStr, svgImg);

  svgImg;
};

let codeToImage = (~code: QrCode.t, ~border: int, ~hash: string) : Dom.element => {
  let (iconSvg, sizeWithBorder) =
    createIconSvg(~code, ~border, ~hash, ~bg=false);
  let sizeStr = string_of_int(sizeWithBorder);

  let iconSvgUrl = svgToDataURL(iconSvg);
  let iconSvgImg = Document.createElementNS(htmlNs, "img", document);

  Element.setAttribute("src", iconSvgUrl, iconSvgImg);
  Element.setAttribute("width", sizeStr, iconSvgImg);
  Element.setAttribute("height", sizeStr, iconSvgImg);

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

let clipCanvas: (Dom.element, QrCode.t) => unit =
  (canvas, code) => {
    open Canvas;
    let size = QrCode.size(code);
    let border = 6;
    let width = size + border * 2;

    let scale = getWidth(canvas) / width;

    let ctx = getContext(canvas);
    Ctx.beginPath(ctx);
    for (y in - border to size + border) {
      for (x in - border to size + border) {
        if (! QrCode.getModule(code, x, y)) {
          Ctx.rect(
            ctx,
            (x + border) * scale,
            (y + border) * scale,
            scale,
            scale,
          );
        };
      };
    };
    Ctx.clip(ctx);
  };
