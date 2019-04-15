open Instascan;
open Webapi.Dom;

let videoEl = document |> Document.querySelector(".preview");

let instascanOpts = Scanner.options(~video=Js.Nullable.fromOption(videoEl));

let scanner = Scanner.newScanner(instascanOpts);

Scanner.addListener(scanner, Js.log);

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
   });
