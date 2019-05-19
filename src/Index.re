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

let initialHash: ref(string) = ref("");

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
let setHashToNow = _ => setHash(getTimestamp());

let onClick = (maybeHash, _) =>
  switch (maybeHash) {
  | Some(hash) =>
    setBackground("body", "#" ++ Js.String.slice(~from=0, ~to_=6, hash));
    switch (Js.Dict.get(dataSeen, hash)) {
    | Some(data) =>
      Js.log(Js.String.sliceToEnd(~from=16, data));
      setHash(Js.String.sliceToEnd(~from=16, data));
    | None => ()
    };
  | None => setHashToNow()
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

let setCode = input => {
  let text = "https://" ++ domain ++ "/#" ++ input;

  Hash.hexDigest("SHA-1", text)
  |> Js.Promise.then_(hash => {
       let alreadySeen = Belt.Option.isSome(Js.Dict.get(dataSeen, hash));

       if (! alreadySeen) {
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

         withQuerySelectorDom("body", root =>
           withQuerySelectorDom(".queer-loop", loopContainer =>
             switch (takeSnapshot()) {
             | Some(snapshotUrl) =>
               let maybePrevious =
                 ElementRe.querySelector("svg", loopContainer);
               Js.log("hey");
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

               let svg =
                 QueerCode.createSimpleSvg(
                   code,
                   4,
                   input !== initialHash^ ? Some(snapshotUrl) : None,
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
};

let setText =
  Debouncer.make(~wait=200, hash =>
    withQuerySelectorDom("#codeContents", el =>
      ElementRe.setInnerText(el, decodeURIComponent(hash))
    )
    |> ignore
  );

let onHashChange: unit => unit =
  _ => {
    let hash = Js.String.sliceToEnd(~from=1, getHash());

    /* let hexPromise = */
    /*     Hash.hexDigest(hash) */
    /*     |> Js.Promise.then_(hexHashOfLocationHash => { */
    /*          Js.log(hexHashOfLocationHash); */
    /*          Js.Promise.resolve(); */
    /*        }); */

    setCode(hash);
    setText(hash);
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
  withQuerySelectorDom("#codeContents", el => {
    let text = ElementRe.innerText(el);
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

    withQuerySelectorDom(".codes", img =>
      ElementRe.addEventListener("click", onClick(None), img)
    );

    initialHash := Js.String.sliceToEnd(~from=1, getHash());
    if (initialHash^ == "") {
      initialHash := getTimestamp();
      setHash(initialHash^);
    } else {
      onHashChange();
    };

    withQuerySelectorDom("#codeContents", el =>
      ElementRe.addEventListener("input", _evt => onInput(), el)
    );

    let response = input =>
      if (input !== "") {
        Hash.hexDigest("SHA-1", input)
        |> Js.Promise.then_(hexHash => {
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
             /* Js.Array.slice(~start=0, ~end_=1, cameras), */
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
