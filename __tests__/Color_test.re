open Jest;
open Expect;

open Color;

describe("Color", () => {
  describe("rgbToHsv", () =>
    testAll(
      "in => out",
      [
        ((1.0, 1.0, 1.0), (0.0, 0.0, 1.0)),
        ((1.0, 0.0, 0.0), (0.0, 1.0, 1.0)),
        ((0.0, 1.0, 0.0), (1.0 /. 3.0, 1.0, 1.0)),
      ],
      (((r, g, b), hsv)) =>
      expect(rgbToHsv(r, g, b)) |> toEqual(hsv)
    )
  );
  describe("hsvToRgb", () =>
    testAll(
      "in => out",
      [
        ((0.0, 1.0, 1.0), (1.0, 0.0, 0.0)),
        ((0.0, 0.0, 1.0), (1.0, 1.0, 1.0)),
        ((0.0, 0.2, 1.0), (1.0, 0.8, 0.8)),
        ((1.0 /. 3.0, 1.0, 1.0), (0.0, 1.0, 0.0)),
      ],
      (((h, s, v), rgb)) =>
      expect(hsvToRgb(h, s, v)) |> toEqual(rgb)
    )
  );

  describe("getNextColor", () =>
    testAll(
      "in => out",
      [
        ("#fff", "#fcc"),
        ("#fcc", "#ffc"),
        ("#ffc", "#cfc"),
        ("#000", "#fff"),
      ],
      ((input, expected)) =>
      expect(getNextColor(input)) |> toEqual(expected)
    )
  );
  describe("getNextHsv", () =>
    testAll(
      "in => out",
      [
        ((0.0, 0.0, 1.0), (0.0, 0.2, 1.0)),
        ((0.0, 0.2, 1.0), (0.2, 0.2, 1.0)),
        ((0.2, 0.2, 1.0), (0.4, 0.2, 1.0)),
        ((0.6, 0.2, 1.0), (0.8, 0.2, 1.0)),
        ((0.8, 0.2, 1.0), (0.0, 0.4, 1.0)),
        ((0.8, 0.8, 1.0), (0.0, 1.0, 1.0)),
        ((0.0, 1.0, 1.0), (0.2, 1.0, 1.0)),
        ((0.8, 1.0, 1.0), (0.0, 0.0, 0.8)),
        ((0.8, 1.0, 0.4), (0.0, 0.0, 0.2)),
        ((0.0, 0.0, 0.2), (0.0, 0.0, 0.0)),
        ((0.0, 0.0, 0.0), (0.0, 0.0, 1.0)),
      ],
      ((input, expected)) =>
      expect(getNextHsv(input)) |> toEqual(expected)
    )
  );
});
