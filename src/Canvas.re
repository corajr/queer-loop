[@bs.deriving abstract]
type imageData = {
  data: Js.Typed_array.Uint8ClampedArray.t,
  width: int,
  height: int,
};

module Ctx = {
  type t;
  type imageSource = Dom.element;

  [@bs.get] external globalAlpha : t => float = "";
  [@bs.set] external setGlobalAlpha : (t, float) => unit = "globalAlpha";

  [@bs.get] external globalCompositeOperation : t => string = "";
  [@bs.set]
  external setGlobalCompositeOperation : (t, string) => unit =
    "globalCompositeOperation";

  [@bs.set] external setFillStyle : (t, string) => unit = "fillStyle";

  [@bs.send] external fillRect : (t, int, int, int, int) => unit = "";
  [@bs.send] external fillText : (t, string, int, int) => unit = "";
  [@bs.set] external setFont : (t, string) => unit = "font";

  [@bs.send] external beginPath : t => unit = "";
  [@bs.send] external clip : t => unit = "";
  [@bs.send] external rect : (t, int, int, int, int) => unit = "";
  [@bs.send] external save : t => unit = "";
  [@bs.send] external restore : t => unit = "";

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

let invert: Dom.element => unit =
  canvas => {
    let ctx = getContext(canvas);
    let w = getWidth(canvas);
    let h = getHeight(canvas);
    let originalCompositeOperation = Ctx.globalCompositeOperation(ctx);
    Ctx.setGlobalCompositeOperation(ctx, "difference");
    Ctx.setFillStyle(ctx, "#FFFFFF");
    Ctx.fillRect(ctx, 0, 0, w, h);

    Ctx.setGlobalCompositeOperation(ctx, originalCompositeOperation);
  };
