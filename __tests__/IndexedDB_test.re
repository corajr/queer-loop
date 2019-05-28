open Jest;
open Expect;

open IndexedDB;

describe("open", () =>
  ExpectJs.(
    test("opens a connection to the database", () => {
      let request = DB.open_(~name="test", ~version=1);
      expect(request) |> toBeTruthy;
    })
  )
);
