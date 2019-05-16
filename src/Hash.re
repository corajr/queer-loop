let abToStr: Js.Typed_array.ArrayBuffer.t => string = [%bs.raw
  buf => {|
  return String.fromCharCode.apply(null, new Uint8Array(buf));
     |}
];

let abToHexAndBase64Str: Js.Typed_array.ArrayBuffer.t => (string, string) = [%bs.raw
  buf => {|
     var uint8 = new Uint8Array(buf);
     var b64 = window.btoa(String.fromCharCode.apply(null, uint8));
     var hex = Array.prototype.map.call(uint8, x => ('00' + x.toString(16)).slice(-2)).join('');
     return [hex, b64];
     |}
];

let abToHexStr: Js.Typed_array.ArrayBuffer.t => string = [%bs.raw
  buf => {|
     return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('');
     |}
];

let str2ab: string => Js.Typed_array.ArrayBuffer.t = [%bs.raw
  str => {|
    var buf = new ArrayBuffer(str.length*2); // 2 bytes for each char
    var bufView = new Uint8Array(buf);
    for (var i=0, strLen=str.length; i < strLen; i++) {
    bufView[i] = str.charCodeAt(i);
  }
      return buf;
     |}
];

[@bs.val] [@bs.scope ("window", "crypto", "subtle")]
external _digest :
  (string, Js.Typed_array.ArrayBuffer.t) =>
  Js.Promise.t(Js.Typed_array.ArrayBuffer.t) =
  "digest";

let digest: (string, string) => Js.Promise.t(string) =
  (algorithm, input) =>
    _digest(algorithm, str2ab(input))
    |> Js.Promise.then_(output => Js.Promise.resolve(abToStr(output)));

let hexDigest: (string, string) => Js.Promise.t(string) =
  (algorithm, input) =>
    _digest(algorithm, str2ab(input))
    |> Js.Promise.then_(output => Js.Promise.resolve(abToHexStr(output)));

let hexAndBase64Digest: (string, string) => Js.Promise.t((string, string)) =
  (algorithm, input) =>
    _digest(algorithm, str2ab(input))
    |> Js.Promise.then_(output =>
         Js.Promise.resolve(abToHexAndBase64Str(output))
       );
