open Jest;
open Expect;

open QueerCode;
open QrCodeGen;
open Webapi.Dom;

let qrCode = QrCode._encodeText("https://qqq.lu", Ecc.low);

describe("QueerCode", () => {
  Only.describe("createSimpleSvg", () =>
    test("translates QR code data into QueerCode SVG", () =>
      expect(svgToDataURL(createSimpleSvg(qrCode, 6, "", "", None)))
      |> toEqual("")
    )
  );

  describe("drawCanvas", () =>
    test("applies a QueerCode to a canvas", () => {
      let canvas = DocumentRe.createElement("canvas", document);
      drawCanvas(canvas, qrCode);
      let png = Canvas.toDataURL(canvas);
      let expected = "";
      expect(Canvas.toDataURL(canvas)) |> toEqual(expected);
    })
  );
});
