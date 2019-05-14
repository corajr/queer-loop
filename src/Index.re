open Color;
open Instascan;
open QrCodeGen;
open Webapi.Dom;

let maybeSetCode: (option(Dom.element), string) => unit =
  (maybeEl, text) =>
    ignore(
      Belt.Option.map(maybeEl, el =>
        QueerCode.setSvg(QrCode.encodeText(text, Ecc.high), el)
      ),
    );

let domain = "qqq.lu";

let codeRegex = Js.Re.fromString("https:\/\/" ++ domain ++ "\/#([0-f]{3})");
let defaultHash = "fff";

let getNextHash = current => {
  let i =
    switch (int_of_string("0x" ++ Js.String.sliceToEnd(~from=1, current))) {
    | i => i
    | exception _ => 0
    };

  Printf.sprintf("#%03x", (i + 1) mod 4096);
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

let moveCode = (x, y) => {
  let currentQrEl = document |> Document.querySelector("#current");
  Belt.Option.(
    currentQrEl
    |. flatMap(DomRe.Element.asHtmlElement)
    |. map(current => {
         DomRe.CssStyleDeclaration.setProperty(
           "top",
           string_of_float(y *. 100.0) ++ "%",
           "",
           HtmlElementRe.style(current),
         );
         DomRe.CssStyleDeclaration.setProperty(
           "left",
           string_of_float(x *. 100.0) ++ "%",
           "",
           HtmlElementRe.style(current),
         );
       })
  );
  ();
};

let rec onTick = ts => {
  let scaled = ts *. 0.0005;
  let newX = 0.5 +. cos(scaled) *. 0.25;
  let newY = 0.5 +. sin(scaled *. 2.0) *. 0.25;
  moveCode(newX, newY);

  Webapi.requestAnimationFrame(onTick);
};

let onHashChange = _ => {
  let hash = DomRe.Location.hash(WindowRe.location(window));
  setBgColor(hash);
  let currentQrEl = document |> Document.querySelector("#current");
  maybeSetCode(currentQrEl, "https://" ++ domain ++ "/" ++ hash);
  ();
};

let init: unit => unit =
  _ => {
    Webapi.requestAnimationFrame(onTick);
    let videoEl = document |> Document.querySelector("#preview");

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

    let instascanOpts =
      Scanner.options(
        ~video=Js.Nullable.fromOption(videoEl),
        ~mirror=false,
        ~backgroundScan=false,
        ~scanPeriod=5,
        (),
      );

    let scanner = Scanner.newScanner(instascanOpts);

    let response = input =>
      switch (Js.Re.exec_(codeRegex, input)) {
      | Some(result) =>
        switch (Js.Nullable.toOption(Js.Re.captures(result)[1])) {
        | Some(hash) =>
          maybeSetCode(previousQrEl, "https://" ++ domain ++ "/#" ++ hash);
          let nextHash = getNextHash(hash);
          DomRe.Location.setHash(WindowRe.location(window), nextHash);
        | None => ()
        }
      | None => Js.log("Ignoring (external barcode): " ++ input)
      /* TODO: maybe hash such barcodes as alternative entrances to loop? */
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

WindowRe.addEventListener("hashchange", _ => onHashChange(), window);
