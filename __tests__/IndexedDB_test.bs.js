// Generated by BUCKLESCRIPT, PLEASE EDIT WITH CARE

import * as Jest from "@glennsl/bs-jest/src/jest.js";
import * as IndexedDB$QueerLoop from "../src/IndexedDB.bs.js";

Jest.describe("open", (function (param) {
        return Jest.test("opens a connection to the database", (function (param) {
                      var request = function (param, param$1) {
                        return IndexedDB$QueerLoop.DB.open_("test", 1, param, param$1);
                      };
                      return Jest.ExpectJs.toBeTruthy(Jest.ExpectJs.expect(request));
                    }));
      }));

export {
  
}
/*  Not a pure module */
