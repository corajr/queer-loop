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

let addToPast: string => unit =
  dataUrl => {
    let img = DocumentRe.createElement("img", document);
    setSrc(img, dataUrl);
    withQuerySelector("#past", past => HtmlElementRe.appendChild(img, past))
    |> ignore;
  };

let setCode = input =>
  switch (takeSnapshot()) {
  | Some(snapshotUrl) =>
    let text = "https://" ++ domain ++ "/#" ++ input;

    Hash.hexDigest("SHA-1", text)
    |> Js.Promise.then_(hash => {
         setBackground(
           "body",
           "#" ++ Js.String.slice(~from=0, ~to_=6, hash),
         );

         let code =
           Belt.Option.getWithDefault(
             QrCode.encodeText(text, Ecc.medium),
             defaultCode,
           );

         withQuerySelectorDom("#snapshotCanvas", snapshotCanvas =>
           withQuerySelector("#current", img => {
             previousCodes := Belt.Set.String.add(previousCodes^, hash);

             let url =
               QueerCode.getSvgDataUri(
                 code,
                 currentSignature^ !== "" ? Some(snapshotUrl) : None,
               );
             setSrc(img, url);
             if (currentSignature^ !== "") {
               addToPast(url);
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

let getHash = _ => DomRe.Location.hash(WindowRe.location(window));

let setHash = hash =>
  DomRe.Location.setHash(WindowRe.location(window), hash);

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

    let initialHash = getHash();
    if (initialHash == "") {
      /* setHash(defaultHash); */
      setHash(
        Js.Date.toISOString(Js.Date.make()),
      );
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
             if (hexHash === currentSignature^
                 || ! Belt.Set.String.has(previousCodes^, hexHash)) {
               setHash(Js.Date.toISOString(Js.Date.make()));
             };
             Js.Promise.resolve();
           })
        |> ignore;
      };

    /* WindowRe.addEventListener( */
    /*   "click", */
    /*   _ => setHash(Js.Date.toISOString(Js.Date.make())), */
    /*   window, */
    /* ); */

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
