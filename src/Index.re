open Canvas;
open Color;
open Hash;
open QrCodeGen;
open Util;
open Webapi.Dom;

let domain = "qqq.lu";

let setBackground = (selector, bgCss) =>
  withQuerySelector(selector, el =>
    DomRe.CssStyleDeclaration.setProperty(
      "background",
      bgCss,
      "",
      HtmlElementRe.style(el),
    )
  );

let codeRegex = Js.Re.fromString("https:\/\/" ++ domain ++ "\/#(.+)");

let defaultCode = QrCode._encodeText("https://" ++ domain, Ecc.low);

let defaultHash = "fff";

let camerasRef: ref(array(UserMedia.mediaDeviceInfo)) = ref([||]);
let cameraIndex = ref(0);

let cycleCameras = scanner => {
  let n = Array.length(camerasRef^);
  cameraIndex := (cameraIndex^ + 1) mod n;
  let nextCamera = camerasRef^[cameraIndex^];
  ();
};

let setSrc = [%bs.raw (img, src) => {|
     img.src = src;|}];

let previousCodes: ref(Belt.Set.String.t) = ref(Belt.Set.String.empty);

let dataSeen: Js.Dict.t(string) = Js.Dict.empty();

let currentSignature: ref(string) = ref("");

let canvasesRef: ref(array(Dom.element)) = ref([||]);

let copyVideoToSnapshotCanvas = _ =>
  withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
    let snapshotCtx = getContext(snapshotCanvas);

    Ctx.setGlobalAlpha(snapshotCtx, 0.1);
    Array.mapi(
      (i, canvas) => {
        let h = getHeight(canvas);
        let x = (getWidth(canvas) - h) / 2;
        Ctx.drawImageSourceRectDestRect(
          snapshotCtx,
          ~image=canvas,
          ~sx=0,
          ~sy=0,
          ~sw=getWidth(canvas),
          ~sh=getHeight(canvas),
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

let setHashToNow = _ => setHash(Js.Date.toISOString(Js.Date.make()));

let onClick = (maybeHash, _) =>
  switch (maybeHash) {
  | Some(hash) =>
    Js.log(hash);
    setBackground("body", "#" ++ Js.String.slice(~from=0, ~to_=6, hash));
    switch (Js.Dict.get(dataSeen, hash)) {
    | Some(data) => setHash(Js.String.sliceToEnd(~from=16, data))
    | None => ()
    };
  | None => setHashToNow()
  };

let addToPast: (string, string) => unit =
  (hash, dataUrl) => {
    let img = DocumentRe.createElement("img", document);
    setSrc(img, dataUrl);
    /* ElementRe.setClassName(img, "centeredSquareSmall queer-loop"); */
    ElementRe.setId(img, "x" ++ hash);
    ElementRe.addEventListener("click", onClick(Some(hash)), img);

    withQuerySelectorDom("#codes", past => ElementRe.appendChild(img, past));
    ();
  };

let setCode = input =>
  switch (takeSnapshot()) {
  | Some(snapshotUrl) =>
    let text = "https://" ++ domain ++ "/#" ++ input;

    Hash.hexDigest("SHA-1", text)
    |> Js.Promise.then_(hash => {
         Js.Dict.set(dataSeen, hash, text);

         setBackground(
           "body",
           "#" ++ Js.String.slice(~from=0, ~to_=6, hash),
         );

         let code =
           Belt.Option.getWithDefault(
             QrCode.encodeText(text, Ecc.medium),
             defaultCode,
           );

         withQuerySelectorDom(".queer-loop", loopSvg =>
           withQuerySelectorDom("#snapshotCanvas", snapshotCanvas => {
             previousCodes := Belt.Set.String.add(previousCodes^, hash);
             Js.Dict.set(dataSeen, hash, text);
             QueerCode.setCodeOnSvg(loopSvg, code);

             let url =
               QueerCode.getSvgDataUri(
                 code,
                 text,
                 currentSignature^ !== "" ? Some(snapshotUrl) : None,
               );
             if (currentSignature^ !== "") {
               addToPast(hash, url);
             };
             currentSignature := hash;
           })
         )
         |> ignore;
         Js.Promise.resolve();
       })
    |> ignore;
  | None => ()
  };

let onHashChange: unit => unit =
  _ => {
    let hash = Js.String.sliceToEnd(~from=1, getHash());

    setCode(hash);

    withQuerySelector("#codeContents", el =>
      HtmlElementRe.setInnerText(el, decodeURIComponent(hash))
    )
    |> ignore;
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

let rec onTick = ts => {
  frameCount := frameCount^ + 1;
  if (frameCount^ mod 5 == 1) {
    copyVideoToSnapshotCanvas() |> ignore;
  };
  Webapi.requestAnimationFrame(onTick);
};

let _onInput = _ =>
  withQuerySelector("#codeContents", el => {
    let text = HtmlElementRe.innerText(el);
    setHash(encodeURIComponent(text));
  })
  |> ignore;

let onInput = Debouncer.make(~wait=200, _onInput);

let init: unit => unit =
  _ => {
    withQuerySelectorDom("#snapshotCanvas", canvas => {
      setWidth(canvas, 480);
      setHeight(canvas, 480);
    });

    withQuerySelectorDom(".queer-loop", img =>
      ElementRe.addEventListener("click", onClick(None), img)
    );

    let initialHash = getHash();
    if (initialHash == "") {
      setHashToNow();
    } else {
      onHashChange();
    };

    withQuerySelector("#codeContents", el =>
      HtmlElementRe.addEventListener("input", evt => onInput(), el)
    );

    let response = input =>
      if (input !== "") {
        Hash.hexDigest("SHA-1", input)
        |> Js.Promise.then_(hexHash => {
             let alreadySeen = Belt.Set.String.has(previousCodes^, hexHash);

             if (hexHash === currentSignature^ || ! alreadySeen) {
               setHash(Js.Date.toISOString(Js.Date.make()));
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
               let videoEl = DocumentRe.createElement("video", document);
               withQuerySelector("body", body =>
                 HtmlElementRe.appendChild(videoEl, body)
               );

               Scanner.scanUsingDeviceId(
                 videoEl,
                 UserMedia.deviceIdGet(camera),
                 response,
               );
             },
             cameras,
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
         Js.Promise.resolve();
       })
    |> ignore;

    ();
  };

WindowRe.addEventListener("load", _ => init(), window);

WindowRe.addEventListener("hashchange", _ => onHashChange(), window);
