type domStringList;

type key;

external asKey : 'a => key = "%identity";

let stringListAsArrray: domStringList => array(string) = [%bs.raw
  domStringList => {| return Array.from(domStringList); |}
];

[@bs.deriving abstract]
type request('a) = {
  [@bs.as "error"]
  requestError: exn,
  [@bs.as "result"]
  requestResult: 'a,
  readyState: string,
  /* [@bs.as "transaction"] */
  /* requestTransaction: Transaction.t, */
};

external asEventTarget : 'a => Dom.eventTarget = "%identity";

let asPromise: request('a) => Js.Promise.t('a) =
  request =>
    Js.Promise.make((~resolve, ~reject) => {
      EventTargetRe.addEventListener(
        "error",
        _evt => reject(. requestErrorGet(request)),
        asEventTarget(request),
      );
      EventTargetRe.addEventListener(
        "success",
        _evt => resolve(. requestResultGet(request)),
        asEventTarget(request),
      );
    });

module DB = {
  type factory;
  [@bs.val] [@bs.scope "window"] external indexedDB : factory = "";

  [@bs.deriving abstract]
  type t = {
    [@bs.as "name"]
    dbName: string,
    [@bs.as "version"]
    dbVersion: int,
    [@bs.as "objectStoreNames"]
    dbObjectStoreNames: domStringList,
  };

  external eventTargetAsDBRequest : Dom.eventTarget => t = "%identity";

  [@bs.send]
  external _open :
    (factory, ~name: string, ~version: int=?, unit) => request(t) =
    "open";

  let open_ =
      (
        ~name,
        ~version,
        ~upgradeNeededHandler=db => {
                                Js.log("Upgrading database...");
                                ();
                              },
        unit,
      )
      : Js.Promise.t(t) => {
    let request = _open(indexedDB, ~name, ~version, ());
    EventTargetRe.addEventListener(
      "upgradeneeded",
      upgradeNeededHandler,
      asEventTarget(request),
    );
    asPromise(request);
  };
};

module KeyRange = {
  type factory;
  [@bs.val] [@bs.scope "window"] external factory : factory = "IDBKeyRange";

  type t = {
    lower: key,
    upper: key,
    lowerOpen: bool,
    upperOpen: bool,
  };

  [@bs.send] external _only : (factory, key) => t = "only";
  [@bs.send] external _bound : (factory, key, key, bool, bool) => t = "bound";
  [@bs.send] external _lowerBound : (factory, key) => t = "bound";
  [@bs.send] external _upperBound : (factory, key) => t = "bound";

  let only = _only(factory);
  let bound = _bound(factory);
  let lowerBound = _lowerBound(factory);
  let upperBound = _upperBound(factory);

  [@bs.send] external includes : (t, key) => bool = "";
};

module Cursor = {
  type t;
};

module CursorWithValue = {
  type t;
};

module Index = {
  type t;
};

module ObjectStore = {
  [@bs.deriving abstract]
  type t = {
    indexNames: array(string),
    keyPath: Js.Nullable.t(string),
    mutable name: string,
    autoIncrement: bool,
  };

  [@bs.send]
  external _add : (t, ~value: 'v, ~key: key=?) => request(unit) = "add";
  [@bs.send] external _clear : t => request(unit) = "clear";
  [@bs.send] external _count : t => request(int) = "count";
  [@bs.send] external _countKey : (t, key) => request(int) = "count";
  [@bs.send]
  external _countKeyRange : (t, KeyRange.t) => request(int) = "count";

  [@bs.send]
  external _createIndex :
    (t, ~indexName: string, ~keyPath: string) => request(Index.t) =
    "createIndex";

  [@bs.send]
  external _createIndexKeyPathArray :
    (t, ~indexName: string, ~keyPathArray: array(string)) => request(Index.t) =
    "createIndex";
  [@bs.send] external _delete : (t, key) => unit = "delete";
  [@bs.send] external _deleteIndex : (t, string) => unit = "deleteIndex";

  [@bs.send] external _get : (t, key) => request('a) = "get";
  [@bs.send] external _getKey : (t, key) => request(key) = "getKey";
  [@bs.send]
  external _getKeyWithKeyRange : (t, KeyRange.t) => request(key) = "getKey";

  [@bs.send] external _index : (t, 'a) => request(unit) = "put";

  [@bs.send]
  external _openCursor : t => request(CursorWithValue.t) = "openCursor";

  [@bs.send]
  external _openCursorKeyRange : (t, KeyRange.t) => request(CursorWithValue.t) =
    "openCursor";

  [@bs.send]
  external _openCursorKeyRangeDirection :
    (
      t,
      KeyRange.t,
      [@bs.string] [ | `next | `nextunique | `prev | `prevunique]
    ) =>
    request(CursorWithValue.t) =
    "openCursor";

  [@bs.send]
  external _openKeyCursor : t => request(Cursor.t) = "openKeyCursor";

  [@bs.send]
  external _openKeyCursorKeyRange : (t, KeyRange.t) => request(Cursor.t) =
    "openKeyCursor";

  [@bs.send]
  external _openKeyCursorKeyRangeDirection :
    (
      t,
      KeyRange.t,
      [@bs.string] [ | `next | `nextunique | `prev | `prevunique]
    ) =>
    request(Cursor.t) =
    "openKeyCursor";

  [@bs.send] external _put : (t, 'a) => request(unit) = "put";
  [@bs.send] external _putWithKey : (t, 'a, key) => request(unit) = "put";
};

module Transaction = {
  [@bs.deriving abstract]
  type t = {
    [@bs.as "db"]
    transactionDb: DB.t,
    [@bs.as "error"]
    transactionError: exn,
    [@bs.as "mode"]
    transactionMode: string,
    [@bs.as "objectStoreNames"]
    transactionObjectStoreNames: string,
  };

  [@bs.send] external abort : t => unit = "";
  [@bs.send] external objectStore : (t, string) => ObjectStore.t = "";
};
