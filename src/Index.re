open Color;
open QrCodeGen;
open Webapi.Dom;

let maybeSetCode: (option(Dom.element), string) => unit =
  (maybeEl, text) =>
    ignore(
      Belt.Option.map(maybeEl, el =>
        QueerCode.setSvg(QrCode.encodeText(text, Ecc.medium), el)
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

let camerasRef: ref(array(UserMedia.mediaDeviceInfo)) = ref([||]);
let cameraIndex = ref(0);

let cycleCameras = scanner => {
  let n = Array.length(camerasRef^);
  cameraIndex := (cameraIndex^ + 1) mod n;
  let nextCamera = camerasRef^[cameraIndex^];
  ();
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

let onHashChange = _ => {
  let hash = DomRe.Location.hash(WindowRe.location(window));
  setBgColor(hash);
  let currentQrEl = document |> Document.querySelector("#current");
  maybeSetCode(currentQrEl, "https://" ++ domain ++ "/" ++ hash);
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
  /* let videoOpacity = 0.5 +. cos(scaled) ** 2.0 *. 0.5; */
  /* setOpacity("#preview", videoOpacity); */
  setOpacity("#current", codeOpacity);
  Webapi.requestAnimationFrame(onTick);
};

let init: unit => unit =
  _ => {
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
    Webapi.requestAnimationFrame(onTick);

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

    /* WindowRe.addEventListener("click", _ => cycleCameras(scanner), window); */

    UserMedia.getCameras()
    |> Js.Promise.then_(cameras => {
         camerasRef := cameras;

         switch (videoEl) {
         | Some(videoEl) =>
           Scanner.scanUsingDeviceId(
             videoEl,
             UserMedia.deviceIdGet(cameras[0]),
             response,
           )
         | None => Js.Promise.resolve()
         };
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
