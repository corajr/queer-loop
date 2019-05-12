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

let domain = "qqq.lu";

let codeRegex = Js.Re.fromString("https:\/\/" ++ domain ++ "\/#(.+)");

let init: unit => unit =
  _ => {
    let videoEl = document |> Document.querySelector("#preview");

    let qrcodeEl = document |> Document.querySelector("#code");

    let initialHash = DomRe.Location.hash(WindowRe.location(window));
    let hash =
      if (initialHash == "") {
        DomRe.Location.setHash(WindowRe.location(window), "0");
        "#0";
      } else {
        initialHash;
      };

    maybeSetCode(qrcodeEl, "https://" ++ domain ++ "/" ++ hash);

    let instascanOpts =
      Scanner.options(~video=Js.Nullable.fromOption(videoEl));

    let scanner = Scanner.newScanner(instascanOpts);

    let response = input =>
      switch (Js.Re.exec_(codeRegex, input)) {
      | Some(result) =>
        switch (Js.Nullable.toOption(Js.Re.captures(result)[1])) {
        | Some(hash) =>
          let i =
            switch (int_of_string(hash)) {
            | i => i
            | exception _ =>
              Js.log("Error: " ++ hash ++ " is invalid.");
              0;
            };

          let nextHash = string_of_int(i + 1);
          DomRe.Location.setHash(WindowRe.location(window), nextHash);

          maybeSetCode(qrcodeEl, "https://" ++ domain ++ "/#" ++ nextHash);
        | None => ()
        }
      | None => ()
      };

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
