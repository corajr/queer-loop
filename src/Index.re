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

let codeRegex = Js.Re.fromString("https:\/\/" ++ domain ++ "\/#([0-f]{3})");
let defaultHash = "fff";

let getNextHash = current => {
  let i =
    switch (int_of_string("0x" ++ current)) {
    | i => i
    | exception _ =>
      Js.log("Error: " ++ current ++ " is invalid.");
      0;
    };

  let nextI = (i + 1) mod 4096;

  Printf.sprintf("#%03x", nextI);
};

let camerasRef = ref([||]);
let cameraIndex = ref(0);

let cycleCameras = scanner => {
  let n = Array.length(camerasRef^);
  cameraIndex := (cameraIndex^ + 1) mod n;
  let nextCamera = camerasRef^[cameraIndex^];
  Scanner.start(scanner, nextCamera);
};

let setBgColor = color =>
  Belt.Option.(
    DocumentRe.asHtmlDocument(document)
    |. flatMap(HtmlDocumentRe.body)
    |. flatMap(DomRe.Element.asHtmlElement)
    |. map(body =>
         DomRe.CssStyleDeclaration.setProperty(
           "background-color",
           color,
           "",
           HtmlElementRe.style(body),
         )
       )
  );

let init: unit => unit =
  _ => {
    let videoEl = document |> Document.querySelector("#preview");

    let qrcodeEl = document |> Document.querySelector("#code");

    let initialHash = DomRe.Location.hash(WindowRe.location(window));
    let hash =
      if (initialHash == "") {
        DomRe.Location.setHash(WindowRe.location(window), defaultHash);
        defaultHash;
      } else {
        initialHash;
      };

    setBgColor(hash);
    maybeSetCode(qrcodeEl, "https://" ++ domain ++ "/" ++ hash);

    let instascanOpts =
      Scanner.options(~video=Js.Nullable.fromOption(videoEl));

    let scanner = Scanner.newScanner(instascanOpts);

    let response = input =>
      switch (Js.Re.exec_(codeRegex, input)) {
      | Some(result) =>
        switch (Js.Nullable.toOption(Js.Re.captures(result)[1])) {
        | Some(hash) =>
          Js.log(hash);
          let nextHash = getNextHash(hash);
          DomRe.Location.setHash(WindowRe.location(window), nextHash);
          setBgColor(nextHash);

          maybeSetCode(qrcodeEl, "https://" ++ domain ++ "/" ++ nextHash);
        | None => ()
        }
      | None => Js.log("Ignoring QR: " ++ input)
      };

    Scanner.addListener(scanner, response);

    WindowRe.addEventListener("click", _ => cycleCameras(scanner), window);

    Camera.getCameras()
    |> Js.Promise.then_(cameras => {
         camerasRef := cameras;

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
