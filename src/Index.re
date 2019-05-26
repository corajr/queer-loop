open Canvas;
open Color;
open Hash;
open QrCodeGen;
open Options;
open SvgScript;
open Util;
open Webapi.Dom;

let domain = "qqq.lu";

let setBackground = (selector, bgCss) =>
  withQuerySelector(
    selector,
    el => {
      DomRe.CssStyleDeclaration.setProperty(
        "background",
        bgCss,
        "",
        HtmlElementRe.style(el),
      );
      Js.log(bgCss);
    },
  );

let codeRegex = Js.Re.fromString("https:\/\/" ++ domain ++ "\/#(.+)");

let defaultCode = QrCode._encodeText("https://" ++ domain, Ecc.low);

let defaultHash = "fff";

let initialHash: ref(string) = ref("");

let camerasRef: ref(array(UserMedia.mediaDeviceInfo)) = ref([||]);

let setSrc = [%bs.raw (img, src) => {|
     img.src = src;|}];

let dataSeen: Js.Dict.t(string) = Js.Dict.empty();

let currentSignature: ref(string) = ref("");

let canvasesRef: ref(array(Dom.element)) = ref([||]);

let getTimestamp = _ => Js.Date.toISOString(Js.Date.make());

let getTimestampAndLocaleString = _ => {
  let date = Js.Date.make();
  (Js.Date.toISOString(date), Js.Date.toLocaleString(date));
};

let asOfNow = f => Js.Date.make() |> f;

let setHashToNow = _ => setHash(getTimestamp());

let hasChanged = ref(false);

let onClick = (maybeHash, _) => {
  if (! hasChanged^) {
    hasChanged := true;
  };

  switch (maybeHash) {
  | Some(hash) =>
    let becameActive =
      switch (Js.Dict.get(dataSeen, hash)) {
      | Some(_) => toggleHash(hash)
      | None => false
      };
    ();
  | None => setHashToNow()
  };
};

let _writeLogEntry = ((timestamp, localeString, text, hash)) =>
  withQuerySelectorDom("#log", log => {
    let entry = DocumentRe.createElement("a", document);
    ElementRe.setAttribute("href", "#" ++ hash, entry);
    let linkClasses = ElementRe.classList(entry);
    DomTokenListRe.addMany(
      [|"log-entry", "codeLink", "code" ++ hash|],
      linkClasses,
    );

    ElementRe.addEventListener(
      "click",
      evt => {
        EventRe.preventDefault(evt);
        onClick(Some(hash), ());
      },
      entry,
    );

    let timeDiv = DocumentRe.createElement("div", document);
    let time = DocumentRe.createElement("time", document);
    ElementRe.setAttribute("datetime", timestamp, time);
    ElementRe.setTextContent(time, timestamp);

    let textChild = DocumentRe.createElement("span", document);
    ElementRe.setInnerText(textChild, text);

    let hashColor = Js.String.slice(~from=0, ~to_=6, hash);

    ElementRe.setAttribute(
      "style",
      {j|background-color: #$(hashColor)66;|j},
      entry,
    );

    ElementRe.appendChild(time, timeDiv);
    ElementRe.appendChild(timeDiv, entry);
    ElementRe.appendChild(textChild, entry);
    ElementRe.appendChild(entry, log);
  })
  |> ignore;

let writeLogEntry = Debouncer.make(~wait=100, _writeLogEntry);

let takeSnapshot = codeImg =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
    let snapshotCtx = getContext(snapshotCanvas);
    toDataURLjpg(snapshotCanvas, 0.9);
  });

let copySnapshotToIcon = _ =>
  withQuerySelectorDom("#iconCanvas", iconCanvas =>
    withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
      let iconCtx = getContext(iconCanvas);

      Ctx.setGlobalAlpha(iconCtx, 1.0);
      Ctx.drawImageSourceRectDestRect(
        iconCtx,
        ~image=snapshotCanvas,
        ~sx=0,
        ~sy=0,
        ~sw=getWidth(snapshotCanvas),
        ~sh=getHeight(snapshotCanvas),
        ~dx=0,
        ~dy=0,
        ~dw=getWidth(iconCanvas),
        ~dh=getHeight(iconCanvas),
      );
    })
  );

type svgOrHtml =
  | Svg
  | Html;

let hasBody = [%bs.raw () => "return !!document.body;"];

let withRootSvg = (hash, f: Dom.element => unit) : unit =>
  if (hasBody()) {
    withQuerySelectorDom("#queer-loop", loopContainer =>
      switch (ElementRe.querySelector("svg", loopContainer)) {
      | Some(svg) => f(svg)
      | None =>
        let svg = QueerCode.createSvgSkeleton(hash);
        ElementRe.addEventListener("click", onClick(None), svg);
        ElementRe.appendChild(svg, loopContainer);
        f(svg);
      }
    )
    |> ignore;
  } else {
    withQuerySelectorDom("svg.root", f) |> ignore;
  };

let setCode = text =>
  Hash.hexDigest("SHA-1", text)
  |> Js.Promise.then_(hash => {
       withRootSvg(
         hash,
         rootSvg => {
           let alreadySeen = Belt.Option.isSome(Js.Dict.get(dataSeen, hash));

           if (! alreadySeen) {
             Js.Dict.set(dataSeen, hash, text);

             let code =
               Belt.Option.getWithDefault(
                 QrCode.encodeText(text, Ecc.medium),
                 defaultCode,
               );
             let border = 6;
             let sizeWithBorder = QrCode.size(code) + border * 2;

             let (timestamp, localeString) = getTimestampAndLocaleString();

             let codeSvg =
               QueerCode.createCodeSvg(
                 ~href=text,
                 ~hash,
                 ~code,
                 ~border,
                 ~localeString,
                 ~timestamp,
                 ~invert=currentOptions^.invert,
               );

             let codeImg = QueerCode.svgToImg(codeSvg);

             ElementRe.addEventListener(
               "load",
               _ =>
                 withQuerySelectorDom("#centralGroup", centralGroup =>
                   switch (takeSnapshot()) {
                   | Some(snapshotUrl) =>
                     QueerCode.addBackground(
                       ~codeSvg,
                       ~dataURL=snapshotUrl,
                       ~sizeWithBorder,
                     );

                     ElementRe.appendChild(codeSvg, centralGroup);

                     if (currentOptions^.animate) {
                       ElementRe.setAttribute(
                         "class",
                         "root animationsEnabled",
                         rootSvg,
                       );
                     };

                     setAnimacy(rootSvg, hash);

                     let iconCodeImg =
                       QueerCode.codeToImage(~code, ~border, ~hash);
                     ElementRe.addEventListener(
                       "load",
                       _evt =>
                         switch (
                           withQuerySelectorDom("#iconCanvas", iconCanvas => {
                             setWidth(iconCanvas, sizeWithBorder);
                             setHeight(iconCanvas, sizeWithBorder);
                             let ctx = getContext(iconCanvas);
                             copySnapshotToIcon();
                             Ctx.setGlobalAlpha(ctx, 0.5);
                             Ctx.drawImage(
                               ctx,
                               ~image=iconCodeImg,
                               ~dx=0,
                               ~dy=0,
                             );
                             toDataURL(iconCanvas);
                           })
                         ) {
                         | Some(iconUrl) =>
                           withQuerySelectorDom("#codes", container => {
                             let a =
                               DocumentRe.createElementNS(
                                 htmlNs,
                                 "a",
                                 document,
                               );
                             ElementRe.setAttribute("href", "#" ++ hash, a);
                             let linkClasses = ElementRe.classList(a);
                             DomTokenListRe.addMany(
                               [|"codeLink", "code" ++ hash|],
                               linkClasses,
                             );

                             let img =
                               DocumentRe.createElementNS(
                                 htmlNs,
                                 "img",
                                 document,
                               );
                             ElementRe.setAttribute("src", iconUrl, img);

                             ElementRe.appendChild(img, a);
                             ElementRe.addEventListener(
                               "click",
                               evt => {
                                 EventRe.preventDefault(evt);
                                 onClick(Some(hash), ());
                               },
                               a,
                             );
                             ElementRe.appendChild(a, container);
                           })
                           |> ignore
                         | None => ()
                         },
                       iconCodeImg,
                     );

                     let url = QueerCode.svgToDataURL(rootSvg);

                     withQuerySelectorDom("#download", a => {
                       ElementRe.setAttribute(
                         "download",
                         timestamp ++ ".svg",
                         a,
                       );
                       ElementRe.setAttribute("href", url, a);
                     });

                     currentSignature := hash;
                   | None => ()
                   }
                 )
                 |> ignore,
               codeImg,
             );
           };
         },
       );

       Js.Promise.resolve();
     })
  |> ignore;

let setText =
  Debouncer.make(~wait=200, hash =>
    withQuerySelectorDom("#codeContents", el =>
      ElementRe.setInnerText(el, decodeURIComponent(hash))
    )
    |> ignore
  );

let onHashChange = _evt => {
  let opts = currentOptions^;

  let url = UrlRe.make(DomRe.Location.href(WindowRe.location(window)));

  let (timestamp, localeString) = getTimestampAndLocaleString();
  withQuerySelectorDom("title", title =>
    ElementRe.setInnerText(title, localeString)
  );

  withQuerySelectorDom("time", time => {
    ElementRe.setAttribute("datetime", timestamp, time);
    ElementRe.setInnerText(time, localeString);
  });
  let urlText =
    (opts.includeDomain ? UrlRe.origin(url) : "")
    ++ (opts.includeQueryString ? UrlRe.search(url) : "")
    ++ (opts.includeHash ? UrlRe.hash(url) : "");

  setCode(urlText);
  setText(urlText);
};

let frameCount = ref(0);

let lastFrame = ref(0.0);
let lastUpdated = ref(0.0);

let rec onTick = ts => {
  frameCount := frameCount^ + 1;

  if (ts -. lastUpdated^ >= 10000.0) {
    /* withQuerySelectorDom("svg", svg => { */
    /*   let newSize = Js.Float.toString(sin(ts) ** 2.0); */
    /*   ElementRe.setAttributeNS(svgNs, "width", {j|0 0 $newSize $newSize|j}); */
    /* }); */
    setHashToNow();
  };

  lastUpdated := ts;

  Webapi.requestAnimationFrame(onTick);
};

let maybeUrl: string => option(UrlRe.t) =
  s =>
    switch (UrlRe.make(s)) {
    | url => Some(url)
    | exception e =>
      Js_console.error2("Could not parse URL", e);
      None;
    };

let _onInput = _ =>
  withQuerySelectorDom("#codeContents", el => {
    let text = ElementRe.innerText(el);
    maybeUrl(text)
    |. Belt.Option.map(url => {
         DomRe.Location.setSearch(WindowRe.location(window));
         DomRe.Location.setHash(WindowRe.location(window), UrlRe.hash(url));
       });
  })
  |> ignore;

let onInput = Debouncer.make(~wait=100, _onInput);

let boolParam: (bool, option(string)) => bool =
  default =>
    fun
    | None => default
    | Some(s) => s === "true" || s === "1" || s === "y" || s === "";

let pick: (array('a), array(int)) => array('a) =
  (ary, indices) => Array.map(i => ary[i], indices);

let init = _evt => {
  withQuerySelectorDom("#snapshotCanvas", canvas => {
    setWidth(canvas, 480);
    setHeight(canvas, 480);
  });

  let queryString = getQueryString();
  if (queryString !== "") {
    let params = URLSearchParamsRe.make(queryString);

    let cameraIndices =
      Array.map(int_of_string, URLSearchParamsRe.getAll("c", params));

    currentOptions :=
      {
        includeDomain:
          boolParam(
            currentOptions^.includeDomain,
            URLSearchParamsRe.get("d", params),
          ),
        includeQueryString:
          boolParam(
            currentOptions^.includeQueryString,
            URLSearchParamsRe.get("q", params),
          ),
        includeHash:
          boolParam(
            currentOptions^.includeHash,
            URLSearchParamsRe.get("h", params),
          ),
        invert:
          boolParam(
            currentOptions^.invert,
            URLSearchParamsRe.get("i", params),
          ),
        animate:
          boolParam(
            currentOptions^.invert,
            URLSearchParamsRe.get("a", params),
          ),
        opacity:
          Belt.Option.getWithDefault(
            Belt.Option.map(
              URLSearchParamsRe.get("o", params),
              Js.Float.fromString,
            ),
            currentOptions^.opacity,
          ),
        background:
          Belt.Option.getWithDefault(
            Belt.Option.map(
              URLSearchParamsRe.get("b", params),
              decodeURIComponent,
            ),
            currentOptions^.background,
          ),
        cameraIndices:
          Array.length(cameraIndices) == 0 ? [|0|] : cameraIndices,
      };
  };

  if (currentOptions^.background != "") {
    setBackground(".background", currentOptions^.background) |> ignore;
  };

  initialHash := Js.String.sliceToEnd(~from=1, getHash());
  if (initialHash^ == "") {
    initialHash := getTimestamp();
    setHash(initialHash^);
  } else {
    onHashChange();
  };

  if (! hasBody()) {
    withQuerySelectorDom("svg.root", svg =>
      ElementRe.addEventListener("click", onClick(None), svg)
    )
    |> ignore;
  };

  withQuerySelectorDom("#codeContents", el =>
    ElementRe.addEventListener("blur", _evt => onInput(), el)
  );

  let response = (srcCanvas, inputCode) => {
    let input = JsQr.textDataGet(inputCode);
    if (input !== "") {
      Hash.hexDigest("SHA-1", input)
      |> Js.Promise.then_(hexHash => {
           let (timestamp, localeString) = getTimestampAndLocaleString();
           if (! hasChanged^) {
             hasChanged := true;
           };

           let alreadySeen =
             Belt.Option.isSome(Js.Dict.get(dataSeen, hexHash));
           let isSelf = hexHash === currentSignature^;

           if (isSelf || ! alreadySeen) {
             Js.Dict.set(dataSeen, hexHash, input);

             writeLogEntry((
               timestamp,
               localeString,
               isSelf ? "queer-loop" : input,
               hexHash,
             ));

             withQuerySelectorDom("#inputCanvas", destCanvas => {
               open JsQr;
               let location = locationGet(inputCode);
               let rect = extractAABB(location);
               let dw = rect.w;
               let dh = rect.h;
               if (getWidth(destCanvas) !== dw) {
                 setWidth(destCanvas, dw);
                 setHeight(destCanvas, dh);
               };
               let ctx = getContext(destCanvas);

               Ctx.drawImageSourceRectDestRect(
                 ctx,
                 ~image=srcCanvas,
                 ~sx=rect.x,
                 ~sy=rect.y,
                 ~sw=rect.w,
                 ~sh=rect.h,
                 ~dx=0,
                 ~dy=0,
                 ~dw,
                 ~dh,
               );
             });

             setHashToNow();
           };
           Js.Promise.resolve();
         })
      |> ignore;
    };
  };

  UserMedia.getCameras()
  |> Js.Promise.then_(cameras => {
       camerasRef := cameras;
       Js.log2("Cameras found:", cameras);

       Js.Promise.all(
         Array.map(
           camera => {
             let videoEl =
               DocumentRe.createElementNS(htmlNs, "video", document);
             withQuerySelectorDom(".htmlContainer", body =>
               ElementRe.appendChild(videoEl, body)
             );

             Scanner.scanUsingDeviceId(
               videoEl,
               UserMedia.deviceIdGet(camera),
               currentOptions,
               response,
             );
           },
           pick(cameras, currentOptions^.cameraIndices),
         ),
       );
     })
  |> Js.Promise.then_(canvases => {
       canvasesRef := canvases;

       Webapi.requestAnimationFrame(onTick);

       Js.log("Initalization complete.");

       Js.Promise.resolve();
     })
  |> Js.Promise.catch(err => {
       Js.Console.log("Camera input disabled.");
       Js.log("Initalization complete.");
       withQuerySelectorDom("#welcome", welcome =>
         ElementRe.setAttribute("style", "display: block;", welcome)
       );
       Js.Promise.resolve();
     })
  |> ignore;

  ();
};

[@bs.val] [@bs.scope "window"] external queerLoop : bool = "";

let activateQueerLoop: unit => unit = [%bs.raw
  () => "window.queerLoop = true;"
];

if (! queerLoop) {
  Js.log("Initializing queer-loop...");
  activateQueerLoop();
  WindowRe.addEventListener("load", init, window);
  WindowRe.addEventListener("hashchange", onHashChange, window);
};
