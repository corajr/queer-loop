open Canvas;
open Color;
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

let defaultColor = "fff";

let defaultHash = defaultColor;

let getNextHashInc: string => Js.Promise.t(string) =
  current => {
    let i =
      switch (int_of_string("0x" ++ Js.String.sliceToEnd(~from=1, current))) {
      | i => i
      | exception _ => 0
      };

    Js.Promise.resolve(Printf.sprintf("#%03x", (i + 1) mod 4096));
  };

let getNextHash: string => Js.Promise.t(string) =
  input => Hash.hexDigest("SHA-256", input);

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

let onHashChange = _ => {
  let hash = DomRe.Location.hash(WindowRe.location(window));
  if (Js.Re.test_([%bs.re "/[0-f]+/"], hash)) {
    setBackground("body", Js.String.slice(~from=0, ~to_=7, hash)) |> ignore;
  };
  withQuerySelector("#codeContents", contents =>
    HtmlElementRe.setInnerText(contents, QueerCode.decodeURIComponent(hash))
  );
  let code =
    Belt.Option.getWithDefault(
      QrCode.encodeText("https://" ++ domain ++ "/" ++ hash, Ecc.medium),
      defaultCode,
    );

  let codeAsImage =
    document
    |> Document.querySelector("#codeCanvas")
    |. Belt.Option.map(canvas => {
         QueerCode.drawCanvas(canvas, code);
         let url = toDataURL(canvas);
         setBackground("#overlay", "url(" ++ url ++ ")");
         ();
       });

  withQuerySelector("#current", img => {
    let url = QueerCode.getSvgDataUri(code);
    setSrc(img, url);
  });
  ();
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

let rec onTick = ts => {
  let scaled = ts *. 0.0005;
  let codeOpacity = 0.5 +. sin(scaled) ** 2.0 *. 0.5;

  let maybeCanvas = document |> Document.querySelector("#codeCanvas");
  switch (maybeCanvas) {
  | Some(canvas) =>
    let ctx = getContext(canvas);
    Ctx.setGlobalAlpha(ctx, codeOpacity);
  | None => ()
  };
  Webapi.requestAnimationFrame(onTick);
};

let init: unit => unit =
  _ => {
    let previousQrEl = document |> Document.querySelector("#previous");

    let initialHash = DomRe.Location.hash(WindowRe.location(window));
    let hash =
      if (initialHash == "") {
        DomRe.Location.setHash(WindowRe.location(window), defaultHash);
        defaultHash;
      } else {
        initialHash;
      };

    onHashChange();
    /* Webapi.requestAnimationFrame(onTick); */

    let response = input =>
      Hash.hexDigest("SHA-256", hash ++ input)
      |> Js.Promise.then_(nextHash => {
           DomRe.Location.setHash(WindowRe.location(window), nextHash);
           Js.Promise.resolve();
         })
      |> ignore;

    /* WindowRe.addEventListener("click", _ => cycleCameras(scanner), window); */

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

               Js.Promise.resolve();
             },
             cameras,
           ),
         );
       })
    |> Js.Promise.catch(err => {
         Js.Console.error2("getCameras failed", err);
         Js.Promise.resolve([||]);
       })
    |> ignore;

    ();
  };

WindowRe.addEventListener("load", _ => init(), window);

WindowRe.addEventListener("hashchange", _ => onHashChange(), window);
