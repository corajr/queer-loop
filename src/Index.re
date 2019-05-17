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

let codeRegex =
  Js.Re.fromString("https:\/\/" ++ domain ++ "\/#([^|]+)\|(.+)");

let defaultCode = QrCode._encodeText("https://" ++ domain, Ecc.low);

let defaultColor = "fff";

let defaultHash = "1DmDcC0JpKSBKQbo9YxoTdujAy7e+JUuGzTuLUW8uXg=|ZmZm";

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

let setCode = input =>
  hmacSign(input)
  |> Js.Promise.then_(b64 => {
       let parts = Js.String.split("|", b64);
       let text = "https://" ++ domain ++ "/#" ++ b64;
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
            currentSignature := parts[0];
            Js.Dict.set(previousCodes, parts[0], url);
          })
       |> ignore;

       withQuerySelector("#current", img => {
         let url =
           QueerCode.getSvgDataUri(code, Js.Dict.values(previousCodes));
         setSrc(img, url);
       })
       |> ignore;

       Js.Promise.resolve();
     });

let signAndSetHash = input =>
  hmacSign(input)
  |> Js.Promise.then_(b64 => {
       DomRe.Location.setHash(WindowRe.location(window), b64);
       Js.Promise.resolve();
     })
  |> ignore;

let onHashChange = _ => {
  let hash =
    Js.String.sliceToEnd(
      ~from=1,
      DomRe.Location.hash(WindowRe.location(window)),
    );

  if (Js.String.indexOf("|", hash) === (-1)) {
    signAndSetHash(hash);
  } else {
    hmacVerify(hash)
    |> Js.Promise.then_(((hex, data)) => {
         setBackground("body", "#" ++ Js.String.slice(~from=0, ~to_=6, hex));

         withQuerySelector("#codeContents", contents =>
           HtmlElementRe.setInnerText(contents, data)
         );

         setCode(data);

         Js.Promise.resolve();
       })
    |> Js.Promise.catch(err => {
         Js.log(err);
         Js.Promise.resolve();
       })
    |> ignore;
  };
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
    signAndSetHash(text);
  })
  |> ignore;

let onInput = Debouncer.make(~wait=500, _onInput);

let init: unit => unit =
  _ => {
    let initialHash = DomRe.Location.hash(WindowRe.location(window));
    if (initialHash == "") {
      DomRe.Location.setHash(WindowRe.location(window), defaultHash);
    } else {
      onHashChange();
    };

    withQuerySelector("#codeContents", el =>
      HtmlElementRe.addEventListener("input", evt => onInput(), el)
    );

    /* Webapi.requestAnimationFrame(onTick); */

    let response = input =>
      Js.Re.exec_(codeRegex, input)
      |. Belt.Option.map(Js.Re.captures)
      |. Belt.Option.map(captures =>
           switch (
             Js.Nullable.toOption(captures[1]),
             Js.Nullable.toOption(captures[2]),
           ) {
           | (Some(signature), Some(data)) =>
             switch (
               signature === currentSignature^,
               Js.Dict.get(previousCodes, signature),
             ) {
             | (false, Some(img)) => ()
             | (true, Some(_))
             | (_, None) =>
               hmacVerify(signature ++ "|" ++ data)
               |> Js.Promise.then_(((_hex, data)) =>
                    Hash.hexDigest(
                      "SHA-256",
                      DomRe.Location.hash(WindowRe.location(window)) ++ data,
                    )
                  )
               |> Js.Promise.then_(hexHash => {
                    DomRe.Location.setHash(
                      WindowRe.location(window),
                      hexHash,
                    );
                    Js.Promise.resolve();
                  })
               |> Js.Promise.catch(err => {
                    Js.log(err);
                    Js.Promise.resolve();
                  })
               |> ignore
             }
           | _ => Js.log("no match: " ++ input)
           }
         )
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
