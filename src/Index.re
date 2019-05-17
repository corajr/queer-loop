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

let previousCodes: Js.Dict.t(string) = Js.Dict.empty();
let currentSignature: ref(string) = ref("");

let setCode = input => {
  let text = "https://" ++ domain ++ "/#" ++ input;

  Hash.hexDigest("SHA-256", text)
  |> Js.Promise.then_(hash => {
       setBackground("body", "#" ++ Js.String.slice(~from=0, ~to_=6, hash));

       let code =
         Belt.Option.getWithDefault(
           QrCode.encodeText(text, Ecc.medium),
           defaultCode,
         );

       document
       |> Document.querySelector("#codeCanvas")
       |. Belt.Option.map(canvas => {
            QueerCode.drawCanvas(canvas, code);
            let url = toDataURL(canvas);
            currentSignature := hash;
            Js.Dict.set(previousCodes, hash, url);
          })
       |> ignore;

       withQuerySelector("#current", img => {
         let url =
           QueerCode.getSvgDataUri(code, Js.Dict.values(previousCodes));
         setSrc(img, url);
       })
       |> ignore;
       Js.Promise.resolve();
     })
  |> ignore;
};

let getHash = _ => DomRe.Location.hash(WindowRe.location(window));

let setHash = hash =>
  DomRe.Location.setHash(WindowRe.location(window), hash);

let onHashChange: unit => unit =
  _ => {
    let hash = Js.String.sliceToEnd(~from=1, getHash());

    setCode(hash);

    withQuerySelector("#codeContents", el =>
      HtmlElementRe.setInnerText(el, hash)
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

let _onInput = _ =>
  withQuerySelector("#codeContents", el => {
    let text = HtmlElementRe.innerText(el);
    setHash(encodeURIComponent(text));
  })
  |> ignore;

let onInput = Debouncer.make(~wait=200, _onInput);

let init: unit => unit =
  _ => {
    let initialHash = getHash();
    if (initialHash == "") {
      setHash(defaultHash);
    } else {
      onHashChange();
    };

    withQuerySelector("#codeContents", el =>
      HtmlElementRe.addEventListener("input", evt => onInput(), el)
    );

    /* Webapi.requestAnimationFrame(onTick); */

    let response = input =>
      if (input !== "") {
        Hash.hexDigest("SHA-256", input)
        |> Js.Promise.then_(hexHash => {
             if (hexHash === currentSignature^
                 || Belt.Option.isNone(Js.Dict.get(previousCodes, hexHash))) {
               setHash(hexHash);
             };
             Js.Promise.resolve();
           })
        |> ignore;
      };

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
