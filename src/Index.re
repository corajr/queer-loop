open Instascan;
open QrCodeGen;
open Webapi.Dom;

let maybeSetCode: (option(Dom.element), string) => unit =
  (maybeEl, text) =>
    ignore(
      Belt.Option.map(maybeEl, el =>
        setSvg(encodeText(text, Ecc.medium), el)
      ),
    );

let init: unit => unit =
  _ => {
    let videoEl = document |> Document.querySelector("#preview");

    let qrcodeEl = document |> Document.querySelector("#code");

    maybeSetCode(qrcodeEl, "hello");

    let instascanOpts =
      Scanner.options(~video=Js.Nullable.fromOption(videoEl));

    let scanner = Scanner.newScanner(instascanOpts);

    let response = input => maybeSetCode(qrcodeEl, input ++ "1");

    Scanner.addListener(scanner, response);

    Camera.getCameras()
    |> Js.Promise.then_(cameras => {
         if (Array.length(cameras) > 0) {
           Scanner.start(scanner, cameras[0]);
         } else {
           Js.Console.error("No cameras found!");
         };
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
