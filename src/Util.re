open Webapi.Dom;

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
