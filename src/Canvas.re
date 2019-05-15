[@bs.deriving abstract]
type imageData = {
  data: Js.Typed_array.Uint8ClampedArray.t,
  width: int,
  height: int,
};

module Ctx = {
  type t;
  type imageSource = Dom.element;

  [@bs.send]
  external drawImage : (t, ~image: imageSource, ~dx: int, ~dy: int) => unit =
    "";
  [@bs.send]
  external getImageData :
    (t, ~sx: int, ~sy: int, ~sw: int, ~sh: int) => imageData =
    "";
};

[@bs.send]
external getContext : (Dom.element, [@bs.as "2d"] _) => Ctx.t = "getContext";

[@bs.set] external setHeight : (Dom.element, int) => unit = "height";
[@bs.set] external setWidth : (Dom.element, int) => unit = "width";