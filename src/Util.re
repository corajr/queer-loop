open Webapi.Dom;

let withQuerySelectorDom = (query, f) =>
  document |> Document.querySelector(query) |. Belt.Option.map(f);

let withQuerySelector = (query, f) =>
  document
  |> Document.querySelector(query)
  |. Belt.Option.flatMap(DomRe.Element.asHtmlElement)
  |. Belt.Option.map(f);

let withQuerySelectorAll = (query, f) =>
  document
  |> Document.querySelectorAll(query)
  |> DomRe.NodeList.toArray
  |> Array.map(f);

let withQuerySelectorSub = (query, childQuery, f) =>
  document
  |> Document.querySelector(query)
  |. Belt.Option.flatMap(ElementRe.querySelector(childQuery))
  |. Belt.Option.map(f);

[@bs.val]
external encodeURIComponent : string => string = "encodeURIComponent";

[@bs.val]
external decodeURIComponent : string => string = "decodeURIComponent";

let getHash = _ => DomRe.Location.hash(WindowRe.location(window));

let setHash = hash =>
  DomRe.Location.setHash(WindowRe.location(window), hash);
