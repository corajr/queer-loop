open Jest;
open Expect;

open Time;

describe("Timestamp parsing", () => {
  describe("parseTimestampFromText", () => {
    test("valid ISO string", () =>
      expect(parseTimestampFromText("2024-03-20T12:00:00.000Z")) |> toEqual(Some(1710936000000.0))
    );
    test("valid ISO string (no ms)", () =>
      expect(parseTimestampFromText("2024-03-20T12:00:00Z")) |> toEqual(Some(1710936000000.0))
    );
    test("invalid date", () =>
      expect(parseTimestampFromText("invalid date")) |> toEqual(None)
    );
    test("empty string", () =>
      expect(parseTimestampFromText("")) |> toEqual(None)
    );
  });

  describe("parseTimestampFromFragment", () => {
    test("href with Unix milliseconds", () =>
      expect(parseTimestampFromFragment("https://example.com/#1710936000000")) |> toEqual(Some(1710936000000.0))
    );
    test("href with ISO fragment", () =>
      expect(parseTimestampFromFragment("https://example.com/#2024-03-20T12:00:00.000Z")) |> toEqual(Some(1710936000000.0))
    );
    test("href with ISO fragment (no ms)", () =>
      expect(parseTimestampFromFragment("https://example.com/#2024-03-20T12:00:00Z")) |> toEqual(Some(1710936000000.0))
    );
    test("href with invalid fragment", () =>
      expect(parseTimestampFromFragment("https://example.com/#invalid")) |> toEqual(None)
    );
    test("href with no fragment", () =>
      expect(parseTimestampFromFragment("https://example.com/")) |> toEqual(None)
    );
    test("not a url", () =>
      expect(parseTimestampFromFragment("not a url")) |> toEqual(None)
    );
    test("empty string", () =>
      expect(parseTimestampFromFragment("")) |> toEqual(None)
    );
  });
}); 