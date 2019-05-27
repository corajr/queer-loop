type hsvFloat = (float, float, float);

let floatFromHexDigits = digits => {
  let i =
    switch (int_of_string("0x" ++ digits)) {
    | i => i
    | exception _ => 0
    };
  float_of_int(i) /. 15.0;
};

let rgbFloatFromHash = hex => (
  floatFromHexDigits(Js.String.slice(~from=1, ~to_=2, hex)),
  floatFromHexDigits(Js.String.slice(~from=2, ~to_=3, hex)),
  floatFromHexDigits(Js.String.slice(~from=3, ~to_=4, hex)),
);

let wrap01: float => float =
  x =>
    if (x < 0.0) {
      1.0;
    } else if (x > 1.0) {
      0.0;
    } else {
      x;
    };

let getNextHsv: hsvFloat => hsvFloat =
  ((h, s, v)) => {
    let inc = 1.0 /. 5.0;
    let (h_, h_overflow) = modf(s != 0.0 ? h +. inc : h);
    let s_ = s == 0.0 && v == 1.0 || h_overflow != 0.0 ? s +. inc : s;
    let v_ = s_ == 0.0 || h == 0.8 && s == 1.0 ? v -. inc : v;
    (h_, wrap01(s_), wrap01(v_));
  };

let roundToFifth = x => floor((x +. 0.05) /. 0.2);

let rgbFloatToHex: (float, float, float) => string =
  (r, g, b) => {
    let (r_, g_, b_) = (
      int_of_float(roundToFifth(r)) * 3,
      int_of_float(roundToFifth(g)) * 3,
      int_of_float(roundToFifth(b)) * 3,
    );
    Printf.sprintf("#%0x%0x%0x", r_, g_, b_);
  };

/* Below 2 functions adapted from MIT licensed  TinyColor v1.4.1 */
/* https://github.com/bgrins/TinyColor/blob/96592a5cacdbf4d4d16cd7d39d4d6dd28da9bd5f/tinycolor.js#L446 */

let rgbToHsv: (float, float, float) => hsvFloat = [%bs.raw
  (r, g, b) => {|

     var max = Math.max(r, g, b), min = Math.min(r, g, b);
     var h, s, v = max;

     var d = max - min;
     s = max === 0 ? 0 : d / max;

     if(max == min) {
     h = 0; // achromatic
     }
     else {
     switch(max) {
     case r: h = (g - b) / d + (g < b ? 6 : 0); break;
     case g: h = (b - r) / d + 2; break;
     case b: h = (r - g) / d + 4; break;
     }
     h /= 6;
     }

     return [h, s, v];
     |}
];

let hsvToRgb: (float, float, float) => (float, float, float) = [%bs.raw
  (h, s, v) => {|
     h = h * 6;

     var i = Math.floor(h),
     f = h - i,
     p = v * (1 - s),
     q = v * (1 - f * s),
     t = v * (1 - (1 - f) * s),
     mod = i % 6,
     r = [v, q, p, p, t, v][mod],
     g = [t, v, v, q, p, p][mod],
     b = [p, p, t, v, v, q][mod];

     return [r, g, b];
     |}
];

let getNextColor = current => {
  let (r, g, b) = rgbFloatFromHash(current);
  let hsv = rgbToHsv(r, g, b);
  let (h_, s_, v_) = getNextHsv(hsv);
  let (r_, g_, b_) = hsvToRgb(h_, s_, v_);

  rgbFloatToHex(r_, g_, b_);
};

let sinebow: float => string = t => "";
