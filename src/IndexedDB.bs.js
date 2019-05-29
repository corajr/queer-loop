// Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE


function stringListAsArrray (domStringList){ return Array.from(domStringList); };

function asPromise(request) {
  return new Promise((function (resolve, reject) {
                request.addEventListener("error", (function (_evt) {
                        return reject(request.error);
                      }));
                request.addEventListener("success", (function (_evt) {
                        return resolve(request.result);
                      }));
                return /* () */0;
              }));
}

function open_(name, version, $staropt$star, unit) {
  var upgradeNeededHandler = $staropt$star !== undefined ? $staropt$star : (function (db) {
        console.log("Upgrading database...");
        return /* () */0;
      });
  var request = window.indexedDB.open(name, version);
  request.addEventListener("upgradeneeded", upgradeNeededHandler);
  return asPromise(request);
}

var DB = /* module */[/* open_ */open_];

var partial_arg = window.IDBKeyRange;

function only(param) {
  return partial_arg.only(param);
}

var partial_arg$1 = window.IDBKeyRange;

function bound(param, param$1, param$2, param$3) {
  return partial_arg$1.bound(param, param$1, param$2, param$3);
}

var partial_arg$2 = window.IDBKeyRange;

function lowerBound(param) {
  return partial_arg$2.bound(param);
}

var partial_arg$3 = window.IDBKeyRange;

function upperBound(param) {
  return partial_arg$3.bound(param);
}

var KeyRange = /* module */[
  /* only */only,
  /* bound */bound,
  /* lowerBound */lowerBound,
  /* upperBound */upperBound
];

var Cursor = /* module */[];

var CursorWithValue = /* module */[];

var Index = /* module */[];

var ObjectStore = /* module */[];

var Transaction = /* module */[];

export {
  stringListAsArrray ,
  asPromise ,
  DB ,
  KeyRange ,
  Cursor ,
  CursorWithValue ,
  Index ,
  ObjectStore ,
  Transaction ,
  
}
/* partial_arg Not a pure module */
