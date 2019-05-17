[@bs.deriving abstract]
type imageData = {
  data: Js.Typed_array.Uint8ClampedArray.t,
  width: int,
  height: int,
};

module Ctx = {
  type t;
  type imageSource = Dom.element;

  [@bs.set] external setGlobalAlpha : (t, float) => unit = "globalAlpha";

  [@bs.set]
  external setGlobalCompositeOperation : (t, string) => unit =
    "globalCompositeOperation";

  [@bs.set] external setFillStyle : (t, string) => unit = "fillStyle";

  [@bs.send] external fillRect : (t, int, int, int, int) => unit = "";

  [@bs.send] external clearRect : (t, int, int, int, int) => unit = "";

  [@bs.send]
  external drawImage : (t, ~image: imageSource, ~dx: int, ~dy: int) => unit =
    "";

  [@bs.send]
  external drawImageDestRect :
    (t, ~image: imageSource, ~dx: int, ~dy: int, ~dw: int, ~dh: int) => unit =
    "drawImage";

  [@bs.send]
  external drawImageSourceRectDestRect :
    (
      t,
      ~image: imageSource,
      ~sx: int,
      ~sy: int,
      ~sw: int,
      ~sh: int,
      ~dx: int,
      ~dy: int,
      ~dw: int,
      ~dh: int
    ) =>
    unit =
    "drawImage";

  [@bs.send]
  external getImageData :
    (t, ~sx: int, ~sy: int, ~sw: int, ~sh: int) => imageData =
    "";
};

[@bs.send]
external getContext : (Dom.element, [@bs.as "2d"] _) => Ctx.t = "getContext";

[@bs.send] external toDataURL : Dom.element => string = "";
[@bs.send]
external toDataURLjpg : (Dom.element, [@bs.as "image/jpeg"] _, float) => string =
  "toDataURL";

[@bs.get] external getHeight : Dom.element => int = "height";
[@bs.get] external getWidth : Dom.element => int = "width";

[@bs.set] external setHeight : (Dom.element, int) => unit = "height";
[@bs.set] external setWidth : (Dom.element, int) => unit = "width";
