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
  type options = {
    [@bs.optional]
    video: Js.Nullable.t(Dom.element),
    [@bs.optional]
    mirror: bool,
    [@bs.optional]
    backgroundScan: bool,
    [@bs.optional]
    scanPeriod: int,
  };

  [@bs.module "instascan"] [@bs.new]
  external newScanner : options => t = "Scanner";

  [@bs.send]
  external addListener : (t, [@bs.as "scan"] _, string => unit) => unit = "";

  [@bs.send] external start : (t, Camera.t) => unit = "";
  [@bs.send] external stop : (t, unit) => unit = "";
};
