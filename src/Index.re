open Canvas;
open Color;
open Hash;
open QrCodeGen;
open Options;
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

let copyVideoToSnapshotCanvas = _ =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
    let snapshotCtx = getContext(snapshotCanvas);

    Ctx.setGlobalCompositeOperation(snapshotCtx, "source-over");
    Ctx.setGlobalAlpha(snapshotCtx, currentOptions^.opacity);
    Array.mapi(
      (i, canvas) => {
        let h = getHeight(canvas);
        let x = (getWidth(canvas) - h) / 2;
        Ctx.drawImageSourceRectDestRect(
          snapshotCtx,
          ~image=canvas,
          ~sx=x,
          ~sy=0,
          ~sw=h,
          ~sh=h,
          ~dx=0,
          ~dy=0,
          ~dw=getWidth(snapshotCanvas),
          ~dh=getHeight(snapshotCanvas),
        );
      },
      canvasesRef^,
    );
  });

let _writeLogEntry = ((timestamp, text, hash)) =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas =>
    withQuerySelectorDom("#log", log => {
      let entry = DocumentRe.createElement("div", document);

      let time = DocumentRe.createElement("time", document);
      let textChild = DocumentRe.createElement("span", document);
      ElementRe.setInnerText(textChild, text);

      let hashColor = Js.String.slice(~from=0, ~to_=6, hash);

      ElementRe.setAttribute("style", {j|color: #$hashColor;|j}, entry);
      ElementRe.appendChild(time, entry);
      ElementRe.appendChild(textChild, entry);
      ElementRe.appendChild(entry, log);
    })
  )
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

let getTimestamp = _ => Js.Date.toISOString(Js.Date.make());

let getTimestampAndLocaleString = _ => {
  let date = Js.Date.make();
  (Js.Date.toISOString(date), Js.Date.toLocaleString(date));
};

let asOfNow = f => Js.Date.make() |> f;

let setHashToNow = _ => setHash(getTimestamp());

let hasChanged = ref(false);

let setAnimacy = (svg, hash) => {
  withQuerySelectorAllFrom(
    ".animate",
    svg,
    Array.map(animated =>
      ElementRe.setAttribute("class", "code previous", animated)
    ),
  );
  withQuerySelectorAllFrom(
    ".previous",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );
  withQuerySelectorAllFrom(
    ".selected",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  ElementRe.querySelector("#code" ++ hash, svg)
  |. Belt.Option.map(toAnimate =>
       ElementRe.setAttribute("class", "code animate", toAnimate)
     );
};
let setSelection = (svg, hash) => {
  withQuerySelectorAllFrom(
    ".animate",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  withQuerySelectorAllFrom(
    ".previous",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );
  withQuerySelectorAllFrom(
    ".selected",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  ElementRe.querySelector("#code" ++ hash, svg)
  |. Belt.Option.map(toAnimate =>
       ElementRe.setAttribute("class", "code selected", toAnimate)
     );
};

let onClick = (maybeHash, _) => {
  if (! hasChanged^) {
    hasChanged := true;
  };

  switch (maybeHash) {
  | Some(hash) =>
    switch (Js.Dict.get(dataSeen, hash)) {
    | Some(_) =>
      withQuerySelectorDom("#queer-loop svg", svg => setSelection(svg, hash))
      |> ignore
    | None => ()
    }
  | None => setHashToNow()
  };
};

let setCode = text =>
  Hash.hexDigest("SHA-1", text)
  |> Js.Promise.then_(hash => {
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
             withQuerySelectorDom("#queer-loop", loopContainer =>
               switch (takeSnapshot()) {
               | Some(snapshotUrl) =>
                 QueerCode.addBackground(
                   ~codeSvg,
                   ~dataURL=snapshotUrl,
                   ~sizeWithBorder,
                 );

                 let rootSvg =
                   switch (ElementRe.querySelector("svg", loopContainer)) {
                   | Some(svg) => svg
                   | None =>
                     let svg = QueerCode.createSvgSkeleton(hash);
                     ElementRe.appendChild(svg, loopContainer);
                     svg;
                   };

                 ElementRe.appendChild(codeSvg, rootSvg);

                 setAnimacy(rootSvg, hash);

                 let url = QueerCode.svgToDataURL(rootSvg);

                 withQuerySelectorDom("#download", a => {
                   ElementRe.setAttribute("download", timestamp ++ ".svg", a);
                   ElementRe.setAttribute("href", url, a);
                 });

                 let iconCodeImg = QueerCode.codeToImage(~code, ~border);
                 ElementRe.addEventListener(
                   "load",
                   _evt =>
                     switch (
                       withQuerySelectorDom("#iconCanvas", iconCanvas => {
                         setWidth(iconCanvas, sizeWithBorder);
                         setHeight(iconCanvas, sizeWithBorder);
                         let ctx = getContext(iconCanvas);
                         copySnapshotToIcon();
                         toDataURL(iconCanvas);
                       })
                     ) {
                     | Some(iconUrl) =>
                       withQuerySelectorDom("#codes", container => {
                         let img =
                           DocumentRe.createElementNS(
                             htmlNs,
                             "img",
                             document,
                           );
                         ElementRe.setAttribute("src", iconUrl, img);

                         ElementRe.addEventListener(
                           "click",
                           onClick(Some(hash)),
                           img,
                         );
                         ElementRe.appendChild(img, container);
                       })
                       |> ignore
                     | None => ()
                     },
                   iconCodeImg,
                 );

                 currentSignature := hash;
               | None => ()
               }
             )
             |> ignore,
           codeImg,
         )
         |> ignore;
       };

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

let onHashChange: unit => unit =
  _ => {
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
  if (frameCount^ mod 5 == 1) {
    copyVideoToSnapshotCanvas() |> ignore;
  };

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

let init: unit => unit =
  _ => {
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
      setBackground("body", currentOptions^.background) |> ignore;
    };

    initialHash := Js.String.sliceToEnd(~from=1, getHash());
    if (initialHash^ == "") {
      initialHash := getTimestamp();
      setHash(initialHash^);
    } else {
      onHashChange();
    };

    withQuerySelectorDom("#queer-loop", el =>
      ElementRe.addEventListener("click", onClick(None), el)
    );

    withQuerySelectorDom("#codeContents", el =>
      ElementRe.addEventListener("blur", _evt => onInput(), el)
    );

    let response = input =>
      if (input !== "") {
        Hash.hexDigest("SHA-1", input)
        |> Js.Promise.then_(hexHash => {
             let timestamp = getTimestamp();
             if (! hasChanged^) {
               hasChanged := true;
             };

             let alreadySeen =
               Belt.Option.isSome(Js.Dict.get(dataSeen, hexHash));
             let isSelf = hexHash === currentSignature^;

             if (isSelf) {
               writeLogEntry((timestamp, {j|queer-loop detected|j}, hexHash));
             } else if (! alreadySeen) {
               writeLogEntry((timestamp, input, hexHash));
             };

             if (isSelf || ! alreadySeen) {
               Js.Dict.set(dataSeen, hexHash, input);

               setHashToNow();
             };
             Js.Promise.resolve();
           })
        |> ignore;
      };

    UserMedia.getCameras()
    |> Js.Promise.then_(cameras => {
         camerasRef := cameras;

         Js.Promise.all(
           Array.map(
             camera => {
               let videoEl =
                 DocumentRe.createElementNS(htmlNs, "video", document);
               withQuerySelectorDom("#htmlContainer", body =>
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

         Js.Promise.resolve();
       })
    |> Js.Promise.catch(err => {
         Js.Console.error2("getCameras failed", err);
         withQuerySelectorDom("#welcome", welcome =>
           ElementRe.setAttribute("style", "display: block;", welcome)
         );
         Js.Promise.resolve();
       })
    |> ignore;

    ();
  };

WindowRe.addEventListener("load", _ => init(), window);

WindowRe.addEventListener("hashchange", _ => onHashChange(), window);
