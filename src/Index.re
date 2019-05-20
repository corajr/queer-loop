open Canvas;
open Color;
open Hash;
open QrCodeGen;
open Util;
open Webapi.Dom;

let domain = "qqq.lu";

type options = {
  background: string,
  includeDomain: bool,
  includeQueryString: bool,
  includeHash: bool,
  opacity: float,
  cameraIndices: array(int),
};

let defaultOptions = {
  background: "",
  includeDomain: true,
  includeQueryString: true,
  includeHash: true,
  opacity: 0.1,
  cameraIndices: [|0|],
};

let currentOptions = ref(defaultOptions);

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

let takeSnapshot = _ =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
    let snapshotCtx = getContext(snapshotCanvas);
    toDataURLjpg(snapshotCanvas, 0.9);
  });

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
    switch (Js.Dict.get(dataSeen, hash)) {
    | Some(data) =>
      Js.log(Js.String.sliceToEnd(~from=16, data));
      setHash(Js.String.sliceToEnd(~from=16, data));
    | None => ()
    }
  | None => setHashToNow()
  };
};

let addToPast: (string, string) => unit =
  (hash, dataUrl) => {
    let img = DocumentRe.createElement("img", document);
    setSrc(img, dataUrl);
    ElementRe.setId(img, "x" ++ hash);
    ElementRe.addEventListener("click", onClick(Some(hash)), img);

    withQuerySelectorDom("#codes", past => ElementRe.appendChild(img, past));
    ();
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

         withQuerySelectorDom("body", root =>
           withQuerySelectorDom(".queer-loop", loopContainer =>
             switch (takeSnapshot()) {
             | Some(snapshotUrl) =>
               let maybePrevious =
                 ElementRe.querySelector("svg", loopContainer);
               switch (maybePrevious) {
               | Some(previous) =>
                 ElementRe.removeChild(previous, loopContainer) |> ignore
               | None => ()
               };

               /* let svg = */
               /*   QueerCode.createSvg( */
               /*     loopContainer, */
               /*     maybePrevious, */
               /*     Some(snapshotUrl), */
               /*     hash, */
               /*     code, */
               /*   ); */

               let (timestamp, localeString) = getTimestampAndLocaleString();

               let svg =
                 QueerCode.createSimpleSvg(
                   text,
                   code,
                   6,
                   timestamp,
                   localeString,
                   hasChanged^ ? Some(snapshotUrl) : None,
                 );

               ElementRe.appendChild(svg, loopContainer);
               let url = QueerCode.svgToDataURL(svg);

               withQuerySelectorDom("#codes", container => {
                 let img =
                   DocumentRe.createElementNS(htmlNs, "img", document);
                 ElementRe.setAttribute("src", url, img);
                 ElementRe.appendChild(img, container);
               });

               currentSignature := hash;
             | None => ()
             }
           )
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

let urlToString: UrlRe.t => string = [%bs.raw url => "return url.toString()"];

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

let setOpacity = (elQuery, opacity) =>
  Belt.Option.(
    document
    |> Document.querySelector(elQuery)
    |. flatMap(DomRe.Element.asHtmlElement)
    |. map(body =>
         DomRe.CssStyleDeclaration.setProperty(
           "opacity",
           string_of_float(opacity),
           "",
           HtmlElementRe.style(body),
         )
       )
  );

let frameCount = ref(0);

let lastUpdated = ref(0.0);

let rec onTick = ts => {
  frameCount := frameCount^ + 1;
  if (frameCount^ mod 5 == 1) {
    copyVideoToSnapshotCanvas() |> ignore;
  };

  if (ts -. lastUpdated^ >= 10000.0) {
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
          ...currentOptions^,
          includeDomain: boolParam(true, URLSearchParamsRe.get("d", params)),
          includeQueryString:
            boolParam(true, URLSearchParamsRe.get("q", params)),
          includeHash: boolParam(true, URLSearchParamsRe.get("h", params)),
          opacity:
            Js.Float.fromString(
              Belt.Option.getWithDefault(
                URLSearchParamsRe.get("o", params),
                "0.1",
              ),
            ),
          background:
            decodeURIComponent(
              Belt.Option.getWithDefault(
                URLSearchParamsRe.get("b", params),
                "",
              ),
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

    withQuerySelectorDom(".queer-loop", el =>
      ElementRe.addEventListener("click", onClick(None), el)
    );

    withQuerySelectorDom("#codeContents", el =>
      ElementRe.addEventListener("blur", _evt => onInput(), el)
    );

    let response = input =>
      if (input !== "") {
        Hash.hexDigest("SHA-1", input)
        |> Js.Promise.then_(hexHash => {
             if (! hasChanged^) {
               hasChanged := true;
             };
             let alreadySeen =
               Belt.Option.isSome(Js.Dict.get(dataSeen, hexHash));

             if (hexHash === currentSignature^ || ! alreadySeen) {
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
