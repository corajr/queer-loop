open Webapi.Dom;

module Camera = {
  type modT;
  type t;

  [@bs.module "instascan"] [@bs.val] external camera : modT = "Camera";

  [@bs.send]
  external _getCameras : (modT, unit) => Js.Promise.t(array(t)) =
    "getCameras";

  let getCameras = _getCameras(camera);
};

module Scanner = {
  type t;

  [@bs.deriving abstract]
  type options = {video: Js.Nullable.t(Dom.element)};

  [@bs.module "instascan"] [@bs.new]
  external newScanner : options => t = "Scanner";

  [@bs.send]
  external addListener : (t, [@bs.as "scan"] _, string => unit) => unit = "";

  [@bs.send] external start : (t, Camera.t) => unit = "";
  [@bs.send] external stop : (t, unit) => unit = "";
};

/*
   let scanner = new Instascan.Scanner({ video: document.getElementById('preview') });
   scanner.addListener('scan', function (content) {
   console.log(content);
   });
   Instascan.Camera.getCameras().then(function (cameras) {
   if (cameras.length > 0) {
   scanner.start(cameras[0]);
   } else {
   console.error('No cameras found.');
   }
   }).catch(function (e) {
   console.error(e);
   });


 */
