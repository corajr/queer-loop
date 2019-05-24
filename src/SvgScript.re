open Util;

let setAnimacy = (svg, hash) => {
  withQuerySelectorAllFrom(
    ".animate",
    svg,
    Array.map(animated =>
      ElementRe.setAttribute("class", "code previous", animated)
    ),
  );
  withQuerySelectorAllFrom(
    ".previous",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );
  withQuerySelectorAllFrom(
    ".selected",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  ElementRe.querySelector("#code" ++ hash, svg)
  |. Belt.Option.map(toAnimate =>
       ElementRe.setAttribute("class", "code animate", toAnimate)
     );
};
let setSelection = (svg, hash) => {
  withQuerySelectorAllFrom(
    ".animate",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  withQuerySelectorAllFrom(
    ".previous",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );
  withQuerySelectorAllFrom(
    ".selected",
    svg,
    Array.map(animated => ElementRe.setAttribute("class", "code", animated)),
  );

  ElementRe.querySelector("#code" ++ hash, svg)
  |. Belt.Option.map(toAnimate =>
       ElementRe.setAttribute("class", "code selected", toAnimate)
     );
};

let activateHash = hash => {
  withQuerySelectorDom("#queer-loop svg", svg => setSelection(svg, hash))
  |> ignore;

  withQuerySelectorAll(
    ".codeLink.active",
    Array.map(link => {
      let linkClasses = ElementRe.classList(link);
      DomTokenListRe.remove("active", linkClasses);
    }),
  )
  |> ignore;

  withQuerySelectorAll(
    ".code" ++ hash,
    Array.map(link => {
      let linkClasses = ElementRe.classList(link);
      DomTokenListRe.add("active", linkClasses);
    }),
  )
  |> ignore;
};
