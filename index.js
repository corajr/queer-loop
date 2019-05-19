var index = (function (exports) {
  'use strict';

  var out_of_memory = /* tuple */[
    "Out_of_memory",
    0
  ];

  var sys_error = /* tuple */[
    "Sys_error",
    -1
  ];

  var failure = /* tuple */[
    "Failure",
    -2
  ];

  var invalid_argument = /* tuple */[
    "Invalid_argument",
    -3
  ];

  var end_of_file = /* tuple */[
    "End_of_file",
    -4
  ];

  var division_by_zero = /* tuple */[
    "Division_by_zero",
    -5
  ];

  var not_found = /* tuple */[
    "Not_found",
    -6
  ];

  var match_failure = /* tuple */[
    "Match_failure",
    -7
  ];

  var stack_overflow = /* tuple */[
    "Stack_overflow",
    -8
  ];

  var sys_blocked_io = /* tuple */[
    "Sys_blocked_io",
    -9
  ];

  var assert_failure = /* tuple */[
    "Assert_failure",
    -10
  ];

  var undefined_recursive_module = /* tuple */[
    "Undefined_recursive_module",
    -11
  ];

  out_of_memory.tag = 248;

  sys_error.tag = 248;

  failure.tag = 248;

  invalid_argument.tag = 248;

  end_of_file.tag = 248;

  division_by_zero.tag = 248;

  not_found.tag = 248;

  match_failure.tag = 248;

  stack_overflow.tag = 248;

  sys_blocked_io.tag = 248;

  assert_failure.tag = 248;

  undefined_recursive_module.tag = 248;
  /*  Not a pure module */

  function caml_array_sub(x, offset, len) {
    var result = new Array(len);
    var j = 0;
    var i = offset;
    while(j < len) {
      result[j] = x[i];
      j = j + 1 | 0;
      i = i + 1 | 0;
    }  return result;
  }

  function caml_array_get(xs, index) {
    if (index < 0 || index >= xs.length) {
      throw [
            invalid_argument,
            "index out of bounds"
          ];
    } else {
      return xs[index];
    }
  }

  function caml_make_vect(len, init) {
    var b = new Array(len);
    for(var i = 0 ,i_finish = len - 1 | 0; i <= i_finish; ++i){
      b[i] = init;
    }
    return b;
  }
  /* No side effect */

  function app(_f, _args) {
    while(true) {
      var args = _args;
      var f = _f;
      var init_arity = f.length;
      var arity = init_arity === 0 ? 1 : init_arity;
      var len = args.length;
      var d = arity - len | 0;
      if (d === 0) {
        return f.apply(null, args);
      } else if (d < 0) {
        _args = caml_array_sub(args, arity, -d | 0);
        _f = f.apply(null, caml_array_sub(args, 0, arity));
        continue ;
      } else {
        return (function(f,args){
        return function (x) {
          return app(f, args.concat(/* array */[x]));
        }
        }(f,args));
      }
    }}

  function curry_1(o, a0, arity) {
    switch (arity) {
      case 1 : 
          return o(a0);
      case 2 : 
          return (function (param) {
              return o(a0, param);
            });
      case 3 : 
          return (function (param, param$1) {
              return o(a0, param, param$1);
            });
      case 4 : 
          return (function (param, param$1, param$2) {
              return o(a0, param, param$1, param$2);
            });
      case 5 : 
          return (function (param, param$1, param$2, param$3) {
              return o(a0, param, param$1, param$2, param$3);
            });
      case 6 : 
          return (function (param, param$1, param$2, param$3, param$4) {
              return o(a0, param, param$1, param$2, param$3, param$4);
            });
      case 7 : 
          return (function (param, param$1, param$2, param$3, param$4, param$5) {
              return o(a0, param, param$1, param$2, param$3, param$4, param$5);
            });
      default:
        return app(o, /* array */[a0]);
    }
  }

  function _1(o, a0) {
    var arity = o.length;
    if (arity === 1) {
      return o(a0);
    } else {
      return curry_1(o, a0, arity);
    }
  }

  function __1(o) {
    var arity = o.length;
    if (arity === 1) {
      return o;
    } else {
      return (function (a0) {
          return _1(o, a0);
        });
    }
  }

  function curry_2(o, a0, a1, arity) {
    switch (arity) {
      case 1 : 
          return app(o(a0), /* array */[a1]);
      case 2 : 
          return o(a0, a1);
      case 3 : 
          return (function (param) {
              return o(a0, a1, param);
            });
      case 4 : 
          return (function (param, param$1) {
              return o(a0, a1, param, param$1);
            });
      case 5 : 
          return (function (param, param$1, param$2) {
              return o(a0, a1, param, param$1, param$2);
            });
      case 6 : 
          return (function (param, param$1, param$2, param$3) {
              return o(a0, a1, param, param$1, param$2, param$3);
            });
      case 7 : 
          return (function (param, param$1, param$2, param$3, param$4) {
              return o(a0, a1, param, param$1, param$2, param$3, param$4);
            });
      default:
        return app(o, /* array */[
                    a0,
                    a1
                  ]);
    }
  }

  function _2(o, a0, a1) {
    var arity = o.length;
    if (arity === 2) {
      return o(a0, a1);
    } else {
      return curry_2(o, a0, a1, arity);
    }
  }
  /* No side effect */

  var id = /* record */[/* contents */0];

  function caml_fresh_oo_id(param) {
    id[0] += 1;
    return id[0];
  }

  function create(str) {
    var v_001 = caml_fresh_oo_id(/* () */0);
    var v = /* tuple */[
      str,
      v_001
    ];
    v.tag = 248;
    return v;
  }

  function caml_is_extension(e) {
    if (e === undefined) {
      return false;
    } else if (e.tag === 248) {
      return true;
    } else {
      var slot = e[0];
      if (slot !== undefined) {
        return slot.tag === 248;
      } else {
        return false;
      }
    }
  }
  /* No side effect */

  var undefinedHeader = /* array */[];

  function some(x) {
    if (x === undefined) {
      var block = /* tuple */[
        undefinedHeader,
        0
      ];
      block.tag = 256;
      return block;
    } else if (x !== null && x[0] === undefinedHeader) {
      var nid = x[1] + 1 | 0;
      var block$1 = /* tuple */[
        undefinedHeader,
        nid
      ];
      block$1.tag = 256;
      return block$1;
    } else {
      return x;
    }
  }

  function nullable_to_opt(x) {
    if (x === null || x === undefined) {
      return undefined;
    } else {
      return some(x);
    }
  }

  function null_to_opt(x) {
    if (x === null) {
      return undefined;
    } else {
      return some(x);
    }
  }

  function valFromOption(x) {
    if (x !== null && x[0] === undefinedHeader) {
      var depth = x[1];
      if (depth === 0) {
        return undefined;
      } else {
        return /* tuple */[
                undefinedHeader,
                depth - 1 | 0
              ];
      }
    } else {
      return x;
    }
  }
  /* No side effect */

  var $$Error = create("Caml_js_exceptions.Error");

  function internalToOCamlException(e) {
    if (caml_is_extension(e)) {
      return e;
    } else {
      return [
              $$Error,
              e
            ];
    }
  }
  /* No side effect */

  function map(f, a) {
    var l = a.length;
    if (l === 0) {
      return /* array */[];
    } else {
      var r = caml_make_vect(l, _1(f, a[0]));
      for(var i = 1 ,i_finish = l - 1 | 0; i <= i_finish; ++i){
        r[i] = _1(f, a[i]);
      }
      return r;
    }
  }

  function mapi(f, a) {
    var l = a.length;
    if (l === 0) {
      return /* array */[];
    } else {
      var r = caml_make_vect(l, _2(f, 0, a[0]));
      for(var i = 1 ,i_finish = l - 1 | 0; i <= i_finish; ++i){
        r[i] = _2(f, i, a[i]);
      }
      return r;
    }
  }

  var Bottom = create("Array.Bottom");
  /* No side effect */

  function get(dict, k) {
    if ((k in dict)) {
      return some(dict[k]);
    }
    
  }
  /* No side effect */

  function mapU(opt, f) {
    if (opt !== undefined) {
      return some(f(valFromOption(opt)));
    }
    
  }

  function map$1(opt, f) {
    return mapU(opt, __1(f));
  }

  function flatMapU(opt, f) {
    if (opt !== undefined) {
      return f(valFromOption(opt));
    }
    
  }

  function flatMap(opt, f) {
    return flatMapU(opt, __1(f));
  }

  function getWithDefault(opt, $$default) {
    if (opt !== undefined) {
      return valFromOption(opt);
    } else {
      return $$default;
    }
  }

  function isSome(param) {
    return param !== undefined;
  }
  /* No side effect */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function makeCancelable($staropt$star, fn) {
    var wait = $staropt$star !== undefined ? $staropt$star : 100;
    var timerId = /* record */[/* contents */undefined];
    var lastArg = /* record */[/* contents */undefined];
    var lastCallTime = /* record */[/* contents */undefined];
    var shouldInvoke = function (time) {
      var match = lastCallTime[0];
      if (match !== undefined) {
        var timeSinceLastCall = time - match | 0;
        if (timeSinceLastCall >= wait) {
          return true;
        } else {
          return timeSinceLastCall < 0;
        }
      } else {
        return true;
      }
    };
    var remainingWait = function (time) {
      var match = lastCallTime[0];
      if (match !== undefined) {
        var timeSinceLastCall = time - match | 0;
        return wait - timeSinceLastCall | 0;
      } else {
        return wait;
      }
    };
    var timerExpired = function (param) {
      var match = timerId[0];
      if (match !== undefined) {
        clearTimeout(valFromOption(match));
      }
      var time = Date.now() | 0;
      if (shouldInvoke(time)) {
        var x = lastArg[0];
        if (x !== undefined) {
          lastArg[0] = undefined;
          timerId[0] = undefined;
          return _1(fn, valFromOption(x));
        } else {
          timerId[0] = undefined;
          return /* () */0;
        }
      } else {
        timerId[0] = some(setTimeout(timerExpired, remainingWait(time)));
        return /* () */0;
      }
    };
    var schedule = function (x) {
      var time = Date.now() | 0;
      lastArg[0] = some(x);
      lastCallTime[0] = time;
      timerId[0] = some(setTimeout(timerExpired, wait));
      return /* () */0;
    };
    var scheduled = function (param) {
      return isSome(timerId[0]);
    };
    var cancel = function (param) {
      var match = timerId[0];
      if (match !== undefined) {
        clearTimeout(valFromOption(match));
        timerId[0] = undefined;
        lastArg[0] = undefined;
        lastCallTime[0] = undefined;
        return /* () */0;
      } else {
        return /* () */0;
      }
    };
    var now = function (x) {
      cancel(/* () */0);
      return _1(fn, x);
    };
    return /* record */[
            /* invoke */now,
            /* schedule */schedule,
            /* scheduled */scheduled,
            /* cancel */cancel
          ];
  }

  function make(wait, fn) {
    return makeCancelable(wait, fn)[/* schedule */1];
  }
  /* No side effect */

  /* No side effect */

  /* No side effect */

  /*  Not a pure module */

  /* No side effect */

  /* No side effect */

  /* No side effect */

  /* No side effect */

  var asHtmlElement = (
      function (element) {
        // BEWARE: Assumes "contentEditable" uniquely identifies an HTMLELement
        return element.contentEditable !== undefined ?  element : null;
      }
    );

  function asHtmlElement$1(self) {
    return null_to_opt(_1(asHtmlElement, self));
  }
  /* include Not a pure module */

  function mod_(x, y) {
    if (y === 0) {
      throw division_by_zero;
    } else {
      return x % y;
    }
  }

  var imul = ( Math.imul || function (x,y) {
    y |= 0; return ((((x >> 16) * y) << 16) + (x & 0xffff) * y)|0; 
  }
  );
  /* imul Not a pure module */

  /* No side effect */

  /* No side effect */

  /* No side effect */

  /* No side effect */

  /* No side effect */

  /* Caml_int32 Not a pure module */

  function lowercase(c) {
    if (c >= /* "A" */65 && c <= /* "Z" */90 || c >= /* "\192" */192 && c <= /* "\214" */214 || c >= /* "\216" */216 && c <= /* "\222" */222) {
      return c + 32 | 0;
    } else {
      return c;
    }
  }

  function parse_format(fmt) {
    var len = fmt.length;
    if (len > 31) {
      throw [
            invalid_argument,
            "format_int: format too long"
          ];
    }
    var f = /* record */[
      /* justify */"+",
      /* signstyle */"-",
      /* filter */" ",
      /* alternate */false,
      /* base : Dec */2,
      /* signedconv */false,
      /* width */0,
      /* uppercase */false,
      /* sign */1,
      /* prec */-1,
      /* conv */"f"
    ];
    var _i = 0;
    while(true) {
      var i = _i;
      if (i >= len) {
        return f;
      } else {
        var c = fmt.charCodeAt(i);
        var exit = 0;
        if (c >= 69) {
          if (c >= 88) {
            if (c >= 121) {
              exit = 1;
            } else {
              switch (c - 88 | 0) {
                case 0 : 
                    f[/* base */4] = /* Hex */1;
                    f[/* uppercase */7] = true;
                    _i = i + 1 | 0;
                    continue ;
                case 13 : 
                case 14 : 
                case 15 : 
                    exit = 5;
                    break;
                case 12 : 
                case 17 : 
                    exit = 4;
                    break;
                case 23 : 
                    f[/* base */4] = /* Oct */0;
                    _i = i + 1 | 0;
                    continue ;
                case 29 : 
                    f[/* base */4] = /* Dec */2;
                    _i = i + 1 | 0;
                    continue ;
                case 1 : 
                case 2 : 
                case 3 : 
                case 4 : 
                case 5 : 
                case 6 : 
                case 7 : 
                case 8 : 
                case 9 : 
                case 10 : 
                case 11 : 
                case 16 : 
                case 18 : 
                case 19 : 
                case 20 : 
                case 21 : 
                case 22 : 
                case 24 : 
                case 25 : 
                case 26 : 
                case 27 : 
                case 28 : 
                case 30 : 
                case 31 : 
                    exit = 1;
                    break;
                case 32 : 
                    f[/* base */4] = /* Hex */1;
                    _i = i + 1 | 0;
                    continue ;
                
              }
            }
          } else if (c >= 72) {
            exit = 1;
          } else {
            f[/* signedconv */5] = true;
            f[/* uppercase */7] = true;
            f[/* conv */10] = String.fromCharCode(lowercase(c));
            _i = i + 1 | 0;
            continue ;
          }
        } else {
          switch (c) {
            case 35 : 
                f[/* alternate */3] = true;
                _i = i + 1 | 0;
                continue ;
            case 32 : 
            case 43 : 
                exit = 2;
                break;
            case 45 : 
                f[/* justify */0] = "-";
                _i = i + 1 | 0;
                continue ;
            case 46 : 
                f[/* prec */9] = 0;
                var j = i + 1 | 0;
                while((function(j){
                    return function () {
                      var w = fmt.charCodeAt(j) - /* "0" */48 | 0;
                      return w >= 0 && w <= 9;
                    }
                    }(j))()) {
                  f[/* prec */9] = (imul(f[/* prec */9], 10) + fmt.charCodeAt(j) | 0) - /* "0" */48 | 0;
                  j = j + 1 | 0;
                }              _i = j;
                continue ;
            case 33 : 
            case 34 : 
            case 36 : 
            case 37 : 
            case 38 : 
            case 39 : 
            case 40 : 
            case 41 : 
            case 42 : 
            case 44 : 
            case 47 : 
                exit = 1;
                break;
            case 48 : 
                f[/* filter */2] = "0";
                _i = i + 1 | 0;
                continue ;
            case 49 : 
            case 50 : 
            case 51 : 
            case 52 : 
            case 53 : 
            case 54 : 
            case 55 : 
            case 56 : 
            case 57 : 
                exit = 3;
                break;
            default:
              exit = 1;
          }
        }
        switch (exit) {
          case 1 : 
              _i = i + 1 | 0;
              continue ;
          case 2 : 
              f[/* signstyle */1] = String.fromCharCode(c);
              _i = i + 1 | 0;
              continue ;
          case 3 : 
              f[/* width */6] = 0;
              var j$1 = i;
              while((function(j$1){
                  return function () {
                    var w = fmt.charCodeAt(j$1) - /* "0" */48 | 0;
                    return w >= 0 && w <= 9;
                  }
                  }(j$1))()) {
                f[/* width */6] = (imul(f[/* width */6], 10) + fmt.charCodeAt(j$1) | 0) - /* "0" */48 | 0;
                j$1 = j$1 + 1 | 0;
              }            _i = j$1;
              continue ;
          case 4 : 
              f[/* signedconv */5] = true;
              f[/* base */4] = /* Dec */2;
              _i = i + 1 | 0;
              continue ;
          case 5 : 
              f[/* signedconv */5] = true;
              f[/* conv */10] = String.fromCharCode(c);
              _i = i + 1 | 0;
              continue ;
          
        }
      }
    }}

  function finish_formatting(config, rawbuffer) {
    var justify = config[/* justify */0];
    var signstyle = config[/* signstyle */1];
    var filter = config[/* filter */2];
    var alternate = config[/* alternate */3];
    var base = config[/* base */4];
    var signedconv = config[/* signedconv */5];
    var width = config[/* width */6];
    var uppercase = config[/* uppercase */7];
    var sign = config[/* sign */8];
    var len = rawbuffer.length;
    if (signedconv && (sign < 0 || signstyle !== "-")) {
      len = len + 1 | 0;
    }
    if (alternate) {
      if (base === /* Oct */0) {
        len = len + 1 | 0;
      } else if (base === /* Hex */1) {
        len = len + 2 | 0;
      }
      
    }
    var buffer = "";
    if (justify === "+" && filter === " ") {
      for(var i = len ,i_finish = width - 1 | 0; i <= i_finish; ++i){
        buffer = buffer + filter;
      }
    }
    if (signedconv) {
      if (sign < 0) {
        buffer = buffer + "-";
      } else if (signstyle !== "-") {
        buffer = buffer + signstyle;
      }
      
    }
    if (alternate && base === /* Oct */0) {
      buffer = buffer + "0";
    }
    if (alternate && base === /* Hex */1) {
      buffer = buffer + "0x";
    }
    if (justify === "+" && filter === "0") {
      for(var i$1 = len ,i_finish$1 = width - 1 | 0; i$1 <= i_finish$1; ++i$1){
        buffer = buffer + filter;
      }
    }
    buffer = uppercase ? buffer + rawbuffer.toUpperCase() : buffer + rawbuffer;
    if (justify === "-") {
      for(var i$2 = len ,i_finish$2 = width - 1 | 0; i$2 <= i_finish$2; ++i$2){
        buffer = buffer + " ";
      }
    }
    return buffer;
  }

  function caml_format_float(fmt, x) {
    var f = parse_format(fmt);
    var prec = f[/* prec */9] < 0 ? 6 : f[/* prec */9];
    var x$1 = x < 0 ? (f[/* sign */8] = -1, -x) : x;
    var s = "";
    if (isNaN(x$1)) {
      s = "nan";
      f[/* filter */2] = " ";
    } else if (isFinite(x$1)) {
      var match = f[/* conv */10];
      switch (match) {
        case "e" : 
            s = x$1.toExponential(prec);
            var i = s.length;
            if (s[i - 3 | 0] === "e") {
              s = s.slice(0, i - 1 | 0) + ("0" + s.slice(i - 1 | 0));
            }
            break;
        case "f" : 
            s = x$1.toFixed(prec);
            break;
        case "g" : 
            var prec$1 = prec !== 0 ? prec : 1;
            s = x$1.toExponential(prec$1 - 1 | 0);
            var j = s.indexOf("e");
            var exp = Number(s.slice(j + 1 | 0)) | 0;
            if (exp < -4 || x$1 >= 1e21 || x$1.toFixed().length > prec$1) {
              var i$1 = j - 1 | 0;
              while(s[i$1] === "0") {
                i$1 = i$1 - 1 | 0;
              }            if (s[i$1] === ".") {
                i$1 = i$1 - 1 | 0;
              }
              s = s.slice(0, i$1 + 1 | 0) + s.slice(j);
              var i$2 = s.length;
              if (s[i$2 - 3 | 0] === "e") {
                s = s.slice(0, i$2 - 1 | 0) + ("0" + s.slice(i$2 - 1 | 0));
              }
              
            } else {
              var p = prec$1;
              if (exp < 0) {
                p = p - (exp + 1 | 0) | 0;
                s = x$1.toFixed(p);
              } else {
                while((function () {
                        s = x$1.toFixed(p);
                        return s.length > (prec$1 + 1 | 0);
                      })()) {
                  p = p - 1 | 0;
                }            }
              if (p !== 0) {
                var k = s.length - 1 | 0;
                while(s[k] === "0") {
                  k = k - 1 | 0;
                }              if (s[k] === ".") {
                  k = k - 1 | 0;
                }
                s = s.slice(0, k + 1 | 0);
              }
              
            }
            break;
        default:
          
      }
    } else {
      s = "inf";
      f[/* filter */2] = " ";
    }
    return finish_formatting(f, s);
  }
  /* No side effect */

  function get$1(s, i) {
    if (i < 0 || i >= s.length) {
      throw [
            invalid_argument,
            "index out of bounds"
          ];
    } else {
      return s.charCodeAt(i);
    }
  }
  /* No side effect */

  /* No side effect */

  /* No side effect */

  /* No side effect */

  var Exit = create("Pervasives.Exit");

  function valid_float_lexem(s) {
    var l = s.length;
    var _i = 0;
    while(true) {
      var i = _i;
      if (i >= l) {
        return s + ".";
      } else {
        var match = get$1(s, i);
        if (match >= 48) {
          if (match >= 58) {
            return s;
          } else {
            _i = i + 1 | 0;
            continue ;
          }
        } else if (match !== 45) {
          return s;
        } else {
          _i = i + 1 | 0;
          continue ;
        }
      }
    }}

  function string_of_float(f) {
    return valid_float_lexem(caml_format_float("%.12g", f));
  }
  /* No side effect */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE


  var defaultHmac = {
    name: "HMAC",
    hash: "SHA-256"
  };

  function importKeyJWK(json) {
    var parsed = JSON.parse(json);
    return window.crypto.subtle.importKey("jwk", parsed, defaultHmac, true, /* array */[
                "sign",
                "verify"
              ]);
  }

  var defaultHmacKeyJSON = "{\"alg\":\"HS256\",\"ext\":true,\"k\":\"A-cS_q7opsDHm5vusaNtzSbaJcI153rl-2VVPXyliu2G5nKicquFkf-rcFNCyQkC50CDjzFdDhIh9WzzWSXXHw\",\"key_ops\":[\"sign\",\"verify\"],\"kty\":\"oct\"}";

  var defaultHmacKey = importKeyJWK(defaultHmacKeyJSON);
  /* defaultHmacKey Not a pure module */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function abToHexStr (buf){
       return Array.prototype.map.call(new Uint8Array(buf), x => ('00' + x.toString(16)).slice(-2)).join('');
       }
  function str2ab (str){
      var buf = new ArrayBuffer(str.length);
      var bufView = new Uint8Array(buf);
      for (var i=0, strLen=str.length; i < strLen; i++) {
      bufView[i] = str.charCodeAt(i);
    }
        return buf;
       }
  function hexDigest(algorithm, input) {
    return window.crypto.subtle.digest(algorithm, str2ab(input)).then((function (output) {
                  return Promise.resolve(abToHexStr(output));
                }));
  }
  /* SubtleCrypto-QueerLoop Not a pure module */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function withQuerySelectorDom(query, f) {
    return map$1(nullable_to_opt(document.querySelector(query)), f);
  }

  function withQuerySelector(query, f) {
    return map$1(flatMap(nullable_to_opt(document.querySelector(query)), asHtmlElement$1), f);
  }

  function getHash(param) {
    return window.location.hash;
  }

  function setHash(hash) {
    window.location.hash = hash;
    return /* () */0;
  }

  var htmlNs = "http://www.w3.org/1999/xhtml";
  /* ElementRe Not a pure module */

  class BitMatrix {
      static createEmpty(width, height) {
          return new BitMatrix(new Uint8ClampedArray(width * height), width);
      }
      constructor(data, width) {
          this.width = width;
          this.height = data.length / width;
          this.data = data;
      }
      get(x, y) {
          if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
              return false;
          }
          return !!this.data[y * this.width + x];
      }
      set(x, y, v) {
          this.data[y * this.width + x] = v ? 1 : 0;
      }
      setRegion(left, top, width, height, v) {
          for (let y = top; y < top + height; y++) {
              for (let x = left; x < left + width; x++) {
                  this.set(x, y, !!v);
              }
          }
      }
  }

  const REGION_SIZE = 8;
  const MIN_DYNAMIC_RANGE = 24;
  function numBetween(value, min, max) {
      return value < min ? min : value > max ? max : value;
  }
  // Like BitMatrix but accepts arbitry Uint8 values
  class Matrix {
      constructor(width, height, buffer) {
          this.width = width;
          const bufferSize = width * height;
          if (buffer && buffer.length !== bufferSize) {
              throw new Error("Wrong buffer size");
          }
          this.data = buffer || new Uint8ClampedArray(bufferSize);
      }
      get(x, y) {
          return this.data[y * this.width + x];
      }
      set(x, y, value) {
          this.data[y * this.width + x] = value;
      }
  }
  function binarize(data, width, height, returnInverted, greyscaleWeights, canOverwriteImage) {
      const pixelCount = width * height;
      if (data.length !== pixelCount * 4) {
          throw new Error("Malformed data passed to binarizer.");
      }
      // assign the greyscale and binary image within the rgba buffer as the rgba image will not be needed after conversion
      let bufferOffset = 0;
      // Convert image to greyscale
      let greyscaleBuffer;
      if (canOverwriteImage) {
          greyscaleBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
          bufferOffset += pixelCount;
      }
      const greyscalePixels = new Matrix(width, height, greyscaleBuffer);
      if (greyscaleWeights.useIntegerApproximation) {
          for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                  const pixelPosition = (y * width + x) * 4;
                  const r = data[pixelPosition];
                  const g = data[pixelPosition + 1];
                  const b = data[pixelPosition + 2];
                  greyscalePixels.set(x, y, 
                  // tslint:disable-next-line no-bitwise
                  (greyscaleWeights.red * r + greyscaleWeights.green * g + greyscaleWeights.blue * b + 128) >> 8);
              }
          }
      }
      else {
          for (let y = 0; y < height; y++) {
              for (let x = 0; x < width; x++) {
                  const pixelPosition = (y * width + x) * 4;
                  const r = data[pixelPosition];
                  const g = data[pixelPosition + 1];
                  const b = data[pixelPosition + 2];
                  greyscalePixels.set(x, y, greyscaleWeights.red * r + greyscaleWeights.green * g + greyscaleWeights.blue * b);
              }
          }
      }
      const horizontalRegionCount = Math.ceil(width / REGION_SIZE);
      const verticalRegionCount = Math.ceil(height / REGION_SIZE);
      const blackPointsCount = horizontalRegionCount * verticalRegionCount;
      let blackPointsBuffer;
      if (canOverwriteImage) {
          blackPointsBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, blackPointsCount);
          bufferOffset += blackPointsCount;
      }
      const blackPoints = new Matrix(horizontalRegionCount, verticalRegionCount, blackPointsBuffer);
      for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
          for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
              let min = Infinity;
              let max = 0;
              for (let y = 0; y < REGION_SIZE; y++) {
                  for (let x = 0; x < REGION_SIZE; x++) {
                      const pixelLumosity = greyscalePixels.get(hortizontalRegion * REGION_SIZE + x, verticalRegion * REGION_SIZE + y);
                      min = Math.min(min, pixelLumosity);
                      max = Math.max(max, pixelLumosity);
                  }
              }
              // We could also compute the real average of all pixels but following the assumption that the qr code consists
              // of bright and dark pixels and essentially not much in between, by (min + max)/2 we make the cut really between
              // those two classes. If using the average over all pixel in a block of mostly bright pixels and few dark pixels,
              // the avg would tend to the bright side and darker bright pixels could be interpreted as dark.
              let average = (min + max) / 2;
              // Small bias towards black by moving the threshold up. We do this, as in the finder patterns white holes tend
              // to appear which makes them undetectable.
              const blackBias = 1.1;
              average = Math.min(255, average * blackBias);
              if (max - min <= MIN_DYNAMIC_RANGE) {
                  // If variation within the block is low, assume this is a block with only light or only
                  // dark pixels. In that case we do not want to use the average, as it would divide this
                  // low contrast area into black and white pixels, essentially creating data out of noise.
                  //
                  // Default the blackpoint for these blocks to be half the min - effectively white them out
                  average = min / 2;
                  if (verticalRegion > 0 && hortizontalRegion > 0) {
                      // Correct the "white background" assumption for blocks that have neighbors by comparing
                      // the pixels in this block to the previously calculated black points. This is based on
                      // the fact that dark barcode symbology is always surrounded by some amount of light
                      // background for which reasonable black point estimates were made. The bp estimated at
                      // the boundaries is used for the interior.
                      // The (min < bp) is arbitrary but works better than other heuristics that were tried.
                      const averageNeighborBlackPoint = (blackPoints.get(hortizontalRegion, verticalRegion - 1) +
                          (2 * blackPoints.get(hortizontalRegion - 1, verticalRegion)) +
                          blackPoints.get(hortizontalRegion - 1, verticalRegion - 1)) / 4;
                      if (min < averageNeighborBlackPoint) {
                          average = averageNeighborBlackPoint; // no need to apply black bias as already applied to neighbors
                      }
                  }
              }
              blackPoints.set(hortizontalRegion, verticalRegion, average);
          }
      }
      let binarized;
      if (canOverwriteImage) {
          const binarizedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
          bufferOffset += pixelCount;
          binarized = new BitMatrix(binarizedBuffer, width);
      }
      else {
          binarized = BitMatrix.createEmpty(width, height);
      }
      let inverted = null;
      if (returnInverted) {
          if (canOverwriteImage) {
              const invertedBuffer = new Uint8ClampedArray(data.buffer, bufferOffset, pixelCount);
              inverted = new BitMatrix(invertedBuffer, width);
          }
          else {
              inverted = BitMatrix.createEmpty(width, height);
          }
      }
      for (let verticalRegion = 0; verticalRegion < verticalRegionCount; verticalRegion++) {
          for (let hortizontalRegion = 0; hortizontalRegion < horizontalRegionCount; hortizontalRegion++) {
              const left = numBetween(hortizontalRegion, 2, horizontalRegionCount - 3);
              const top = numBetween(verticalRegion, 2, verticalRegionCount - 3);
              let sum = 0;
              for (let xRegion = -2; xRegion <= 2; xRegion++) {
                  for (let yRegion = -2; yRegion <= 2; yRegion++) {
                      sum += blackPoints.get(left + xRegion, top + yRegion);
                  }
              }
              const threshold = sum / 25;
              for (let xRegion = 0; xRegion < REGION_SIZE; xRegion++) {
                  for (let yRegion = 0; yRegion < REGION_SIZE; yRegion++) {
                      const x = hortizontalRegion * REGION_SIZE + xRegion;
                      const y = verticalRegion * REGION_SIZE + yRegion;
                      const lum = greyscalePixels.get(x, y);
                      binarized.set(x, y, lum <= threshold);
                      if (returnInverted) {
                          inverted.set(x, y, !(lum <= threshold));
                      }
                  }
              }
          }
      }
      if (returnInverted) {
          return { binarized, inverted };
      }
      return { binarized };
  }

  // tslint:disable:no-bitwise
  class BitStream {
      constructor(bytes) {
          this.byteOffset = 0;
          this.bitOffset = 0;
          this.bytes = bytes;
      }
      readBits(numBits) {
          if (numBits < 1 || numBits > 32 || numBits > this.available()) {
              throw new Error("Cannot read " + numBits.toString() + " bits");
          }
          let result = 0;
          // First, read remainder from current byte
          if (this.bitOffset > 0) {
              const bitsLeft = 8 - this.bitOffset;
              const toRead = numBits < bitsLeft ? numBits : bitsLeft;
              const bitsToNotRead = bitsLeft - toRead;
              const mask = (0xFF >> (8 - toRead)) << bitsToNotRead;
              result = (this.bytes[this.byteOffset] & mask) >> bitsToNotRead;
              numBits -= toRead;
              this.bitOffset += toRead;
              if (this.bitOffset === 8) {
                  this.bitOffset = 0;
                  this.byteOffset++;
              }
          }
          // Next read whole bytes
          if (numBits > 0) {
              while (numBits >= 8) {
                  result = (result << 8) | (this.bytes[this.byteOffset] & 0xFF);
                  this.byteOffset++;
                  numBits -= 8;
              }
              // Finally read a partial byte
              if (numBits > 0) {
                  const bitsToNotRead = 8 - numBits;
                  const mask = (0xFF >> bitsToNotRead) << bitsToNotRead;
                  result = (result << numBits) | ((this.bytes[this.byteOffset] & mask) >> bitsToNotRead);
                  this.bitOffset += numBits;
              }
          }
          return result;
      }
      available() {
          return 8 * (this.bytes.length - this.byteOffset) - this.bitOffset;
      }
  }

  // tslint:disable:no-bitwise
  var Mode;
  (function (Mode) {
      Mode["Numeric"] = "numeric";
      Mode["Alphanumeric"] = "alphanumeric";
      Mode["Byte"] = "byte";
      Mode["Kanji"] = "kanji";
      Mode["ECI"] = "eci";
  })(Mode || (Mode = {}));
  var ModeByte;
  (function (ModeByte) {
      ModeByte[ModeByte["Terminator"] = 0] = "Terminator";
      ModeByte[ModeByte["Numeric"] = 1] = "Numeric";
      ModeByte[ModeByte["Alphanumeric"] = 2] = "Alphanumeric";
      ModeByte[ModeByte["Byte"] = 4] = "Byte";
      ModeByte[ModeByte["Kanji"] = 8] = "Kanji";
      ModeByte[ModeByte["ECI"] = 7] = "ECI";
      // StructuredAppend = 0x3,
      // FNC1FirstPosition = 0x5,
      // FNC1SecondPosition = 0x9,
  })(ModeByte || (ModeByte = {}));
  function decodeNumeric(stream, size) {
      const bytes = [];
      let text = "";
      const characterCountSize = [10, 12, 14][size];
      let length = stream.readBits(characterCountSize);
      // Read digits in groups of 3
      while (length >= 3) {
          const num = stream.readBits(10);
          if (num >= 1000) {
              throw new Error("Invalid numeric value above 999");
          }
          const a = Math.floor(num / 100);
          const b = Math.floor(num / 10) % 10;
          const c = num % 10;
          bytes.push(48 + a, 48 + b, 48 + c);
          text += a.toString() + b.toString() + c.toString();
          length -= 3;
      }
      // If the number of digits aren't a multiple of 3, the remaining digits are special cased.
      if (length === 2) {
          const num = stream.readBits(7);
          if (num >= 100) {
              throw new Error("Invalid numeric value above 99");
          }
          const a = Math.floor(num / 10);
          const b = num % 10;
          bytes.push(48 + a, 48 + b);
          text += a.toString() + b.toString();
      }
      else if (length === 1) {
          const num = stream.readBits(4);
          if (num >= 10) {
              throw new Error("Invalid numeric value above 9");
          }
          bytes.push(48 + num);
          text += num.toString();
      }
      return { bytes, text };
  }
  const AlphanumericCharacterCodes = [
      "0", "1", "2", "3", "4", "5", "6", "7", "8",
      "9", "A", "B", "C", "D", "E", "F", "G", "H",
      "I", "J", "K", "L", "M", "N", "O", "P", "Q",
      "R", "S", "T", "U", "V", "W", "X", "Y", "Z",
      " ", "$", "%", "*", "+", "-", ".", "/", ":",
  ];
  function decodeAlphanumeric(stream, size) {
      const bytes = [];
      let text = "";
      const characterCountSize = [9, 11, 13][size];
      let length = stream.readBits(characterCountSize);
      while (length >= 2) {
          const v = stream.readBits(11);
          const a = Math.floor(v / 45);
          const b = v % 45;
          bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0), AlphanumericCharacterCodes[b].charCodeAt(0));
          text += AlphanumericCharacterCodes[a] + AlphanumericCharacterCodes[b];
          length -= 2;
      }
      if (length === 1) {
          const a = stream.readBits(6);
          bytes.push(AlphanumericCharacterCodes[a].charCodeAt(0));
          text += AlphanumericCharacterCodes[a];
      }
      return { bytes, text };
  }
  function decodeByte(stream, size) {
      const bytes = [];
      let text = "";
      const characterCountSize = [8, 16, 16][size];
      const length = stream.readBits(characterCountSize);
      for (let i = 0; i < length; i++) {
          const b = stream.readBits(8);
          bytes.push(b);
      }
      try {
          text += decodeURIComponent(bytes.map(b => `%${("0" + b.toString(16)).substr(-2)}`).join(""));
      }
      catch (_a) {
          // failed to decode
      }
      return { bytes, text };
  }
  function decodeKanji(stream, size) {
      const bytes = [];
      const characterCountSize = [8, 10, 12][size];
      const length = stream.readBits(characterCountSize);
      for (let i = 0; i < length; i++) {
          const k = stream.readBits(13);
          let c = (Math.floor(k / 0xC0) << 8) | (k % 0xC0);
          if (c < 0x1F00) {
              c += 0x8140;
          }
          else {
              c += 0xC140;
          }
          bytes.push(c >> 8, c & 0xFF);
      }
      const text = new TextDecoder("shift-jis").decode(Uint8Array.from(bytes));
      return { bytes, text };
  }
  function decode(data, version) {
      const stream = new BitStream(data);
      // There are 3 'sizes' based on the version. 1-9 is small (0), 10-26 is medium (1) and 27-40 is large (2).
      const size = version <= 9 ? 0 : version <= 26 ? 1 : 2;
      const result = {
          text: "",
          bytes: [],
          chunks: [],
      };
      while (stream.available() >= 4) {
          const mode = stream.readBits(4);
          if (mode === ModeByte.Terminator) {
              return result;
          }
          else if (mode === ModeByte.ECI) {
              if (stream.readBits(1) === 0) {
                  result.chunks.push({
                      type: Mode.ECI,
                      assignmentNumber: stream.readBits(7),
                  });
              }
              else if (stream.readBits(1) === 0) {
                  result.chunks.push({
                      type: Mode.ECI,
                      assignmentNumber: stream.readBits(14),
                  });
              }
              else if (stream.readBits(1) === 0) {
                  result.chunks.push({
                      type: Mode.ECI,
                      assignmentNumber: stream.readBits(21),
                  });
              }
              else {
                  // ECI data seems corrupted
                  result.chunks.push({
                      type: Mode.ECI,
                      assignmentNumber: -1,
                  });
              }
          }
          else if (mode === ModeByte.Numeric) {
              const numericResult = decodeNumeric(stream, size);
              result.text += numericResult.text;
              result.bytes.push(...numericResult.bytes);
              result.chunks.push({
                  type: Mode.Numeric,
                  text: numericResult.text,
              });
          }
          else if (mode === ModeByte.Alphanumeric) {
              const alphanumericResult = decodeAlphanumeric(stream, size);
              result.text += alphanumericResult.text;
              result.bytes.push(...alphanumericResult.bytes);
              result.chunks.push({
                  type: Mode.Alphanumeric,
                  text: alphanumericResult.text,
              });
          }
          else if (mode === ModeByte.Byte) {
              const byteResult = decodeByte(stream, size);
              result.text += byteResult.text;
              result.bytes.push(...byteResult.bytes);
              result.chunks.push({
                  type: Mode.Byte,
                  bytes: byteResult.bytes,
                  text: byteResult.text,
              });
          }
          else if (mode === ModeByte.Kanji) {
              const kanjiResult = decodeKanji(stream, size);
              result.text += kanjiResult.text;
              result.bytes.push(...kanjiResult.bytes);
              result.chunks.push({
                  type: Mode.Kanji,
                  bytes: kanjiResult.bytes,
                  text: kanjiResult.text,
              });
          }
      }
      // If there is no data left, or the remaining bits are all 0, then that counts as a termination marker
      if (stream.available() === 0 || stream.readBits(stream.available()) === 0) {
          return result;
      }
  }

  class GenericGFPoly {
      constructor(field, coefficients) {
          if (coefficients.length === 0) {
              throw new Error("No coefficients.");
          }
          this.field = field;
          const coefficientsLength = coefficients.length;
          if (coefficientsLength > 1 && coefficients[0] === 0) {
              // Leading term must be non-zero for anything except the constant polynomial "0"
              let firstNonZero = 1;
              while (firstNonZero < coefficientsLength && coefficients[firstNonZero] === 0) {
                  firstNonZero++;
              }
              if (firstNonZero === coefficientsLength) {
                  this.coefficients = field.zero.coefficients;
              }
              else {
                  this.coefficients = new Uint8ClampedArray(coefficientsLength - firstNonZero);
                  for (let i = 0; i < this.coefficients.length; i++) {
                      this.coefficients[i] = coefficients[firstNonZero + i];
                  }
              }
          }
          else {
              this.coefficients = coefficients;
          }
      }
      degree() {
          return this.coefficients.length - 1;
      }
      isZero() {
          return this.coefficients[0] === 0;
      }
      getCoefficient(degree) {
          return this.coefficients[this.coefficients.length - 1 - degree];
      }
      addOrSubtract(other) {
          if (this.isZero()) {
              return other;
          }
          if (other.isZero()) {
              return this;
          }
          let smallerCoefficients = this.coefficients;
          let largerCoefficients = other.coefficients;
          if (smallerCoefficients.length > largerCoefficients.length) {
              [smallerCoefficients, largerCoefficients] = [largerCoefficients, smallerCoefficients];
          }
          const sumDiff = new Uint8ClampedArray(largerCoefficients.length);
          const lengthDiff = largerCoefficients.length - smallerCoefficients.length;
          for (let i = 0; i < lengthDiff; i++) {
              sumDiff[i] = largerCoefficients[i];
          }
          for (let i = lengthDiff; i < largerCoefficients.length; i++) {
              sumDiff[i] = addOrSubtractGF(smallerCoefficients[i - lengthDiff], largerCoefficients[i]);
          }
          return new GenericGFPoly(this.field, sumDiff);
      }
      multiply(scalar) {
          if (scalar === 0) {
              return this.field.zero;
          }
          if (scalar === 1) {
              return this;
          }
          const size = this.coefficients.length;
          const product = new Uint8ClampedArray(size);
          for (let i = 0; i < size; i++) {
              product[i] = this.field.multiply(this.coefficients[i], scalar);
          }
          return new GenericGFPoly(this.field, product);
      }
      multiplyPoly(other) {
          if (this.isZero() || other.isZero()) {
              return this.field.zero;
          }
          const aCoefficients = this.coefficients;
          const aLength = aCoefficients.length;
          const bCoefficients = other.coefficients;
          const bLength = bCoefficients.length;
          const product = new Uint8ClampedArray(aLength + bLength - 1);
          for (let i = 0; i < aLength; i++) {
              const aCoeff = aCoefficients[i];
              for (let j = 0; j < bLength; j++) {
                  product[i + j] = addOrSubtractGF(product[i + j], this.field.multiply(aCoeff, bCoefficients[j]));
              }
          }
          return new GenericGFPoly(this.field, product);
      }
      multiplyByMonomial(degree, coefficient) {
          if (degree < 0) {
              throw new Error("Invalid degree less than 0");
          }
          if (coefficient === 0) {
              return this.field.zero;
          }
          const size = this.coefficients.length;
          const product = new Uint8ClampedArray(size + degree);
          for (let i = 0; i < size; i++) {
              product[i] = this.field.multiply(this.coefficients[i], coefficient);
          }
          return new GenericGFPoly(this.field, product);
      }
      evaluateAt(a) {
          let result = 0;
          if (a === 0) {
              // Just return the x^0 coefficient
              return this.getCoefficient(0);
          }
          const size = this.coefficients.length;
          if (a === 1) {
              // Just the sum of the coefficients
              this.coefficients.forEach((coefficient) => {
                  result = addOrSubtractGF(result, coefficient);
              });
              return result;
          }
          result = this.coefficients[0];
          for (let i = 1; i < size; i++) {
              result = addOrSubtractGF(this.field.multiply(a, result), this.coefficients[i]);
          }
          return result;
      }
  }

  function addOrSubtractGF(a, b) {
      return a ^ b; // tslint:disable-line:no-bitwise
  }
  class GenericGF {
      constructor(primitive, size, genBase) {
          this.primitive = primitive;
          this.size = size;
          this.generatorBase = genBase;
          this.expTable = new Array(this.size);
          this.logTable = new Array(this.size);
          let x = 1;
          for (let i = 0; i < this.size; i++) {
              this.expTable[i] = x;
              x = x * 2;
              if (x >= this.size) {
                  x = (x ^ this.primitive) & (this.size - 1); // tslint:disable-line:no-bitwise
              }
          }
          for (let i = 0; i < this.size - 1; i++) {
              this.logTable[this.expTable[i]] = i;
          }
          this.zero = new GenericGFPoly(this, Uint8ClampedArray.from([0]));
          this.one = new GenericGFPoly(this, Uint8ClampedArray.from([1]));
      }
      multiply(a, b) {
          if (a === 0 || b === 0) {
              return 0;
          }
          return this.expTable[(this.logTable[a] + this.logTable[b]) % (this.size - 1)];
      }
      inverse(a) {
          if (a === 0) {
              throw new Error("Can't invert 0");
          }
          return this.expTable[this.size - this.logTable[a] - 1];
      }
      buildMonomial(degree, coefficient) {
          if (degree < 0) {
              throw new Error("Invalid monomial degree less than 0");
          }
          if (coefficient === 0) {
              return this.zero;
          }
          const coefficients = new Uint8ClampedArray(degree + 1);
          coefficients[0] = coefficient;
          return new GenericGFPoly(this, coefficients);
      }
      log(a) {
          if (a === 0) {
              throw new Error("Can't take log(0)");
          }
          return this.logTable[a];
      }
      exp(a) {
          return this.expTable[a];
      }
  }

  function runEuclideanAlgorithm(field, a, b, R) {
      // Assume a's degree is >= b's
      if (a.degree() < b.degree()) {
          [a, b] = [b, a];
      }
      let rLast = a;
      let r = b;
      let tLast = field.zero;
      let t = field.one;
      // Run Euclidean algorithm until r's degree is less than R/2
      while (r.degree() >= R / 2) {
          const rLastLast = rLast;
          const tLastLast = tLast;
          rLast = r;
          tLast = t;
          // Divide rLastLast by rLast, with quotient in q and remainder in r
          if (rLast.isZero()) {
              // Euclidean algorithm already terminated?
              return null;
          }
          r = rLastLast;
          let q = field.zero;
          const denominatorLeadingTerm = rLast.getCoefficient(rLast.degree());
          const dltInverse = field.inverse(denominatorLeadingTerm);
          while (r.degree() >= rLast.degree() && !r.isZero()) {
              const degreeDiff = r.degree() - rLast.degree();
              const scale = field.multiply(r.getCoefficient(r.degree()), dltInverse);
              q = q.addOrSubtract(field.buildMonomial(degreeDiff, scale));
              r = r.addOrSubtract(rLast.multiplyByMonomial(degreeDiff, scale));
          }
          t = q.multiplyPoly(tLast).addOrSubtract(tLastLast);
          if (r.degree() >= rLast.degree()) {
              return null;
          }
      }
      const sigmaTildeAtZero = t.getCoefficient(0);
      if (sigmaTildeAtZero === 0) {
          return null;
      }
      const inverse = field.inverse(sigmaTildeAtZero);
      return [t.multiply(inverse), r.multiply(inverse)];
  }
  function findErrorLocations(field, errorLocator) {
      // This is a direct application of Chien's search
      const numErrors = errorLocator.degree();
      if (numErrors === 1) {
          return [errorLocator.getCoefficient(1)];
      }
      const result = new Array(numErrors);
      let errorCount = 0;
      for (let i = 1; i < field.size && errorCount < numErrors; i++) {
          if (errorLocator.evaluateAt(i) === 0) {
              result[errorCount] = field.inverse(i);
              errorCount++;
          }
      }
      if (errorCount !== numErrors) {
          return null;
      }
      return result;
  }
  function findErrorMagnitudes(field, errorEvaluator, errorLocations) {
      // This is directly applying Forney's Formula
      const s = errorLocations.length;
      const result = new Array(s);
      for (let i = 0; i < s; i++) {
          const xiInverse = field.inverse(errorLocations[i]);
          let denominator = 1;
          for (let j = 0; j < s; j++) {
              if (i !== j) {
                  denominator = field.multiply(denominator, addOrSubtractGF(1, field.multiply(errorLocations[j], xiInverse)));
              }
          }
          result[i] = field.multiply(errorEvaluator.evaluateAt(xiInverse), field.inverse(denominator));
          if (field.generatorBase !== 0) {
              result[i] = field.multiply(result[i], xiInverse);
          }
      }
      return result;
  }
  function decode$1(bytes, twoS) {
      const outputBytes = new Uint8ClampedArray(bytes.length);
      outputBytes.set(bytes);
      const field = new GenericGF(0x011D, 256, 0); // x^8 + x^4 + x^3 + x^2 + 1
      const poly = new GenericGFPoly(field, outputBytes);
      const syndromeCoefficients = new Uint8ClampedArray(twoS);
      let error = false;
      for (let s = 0; s < twoS; s++) {
          const evaluation = poly.evaluateAt(field.exp(s + field.generatorBase));
          syndromeCoefficients[syndromeCoefficients.length - 1 - s] = evaluation;
          if (evaluation !== 0) {
              error = true;
          }
      }
      if (!error) {
          return outputBytes;
      }
      const syndrome = new GenericGFPoly(field, syndromeCoefficients);
      const sigmaOmega = runEuclideanAlgorithm(field, field.buildMonomial(twoS, 1), syndrome, twoS);
      if (sigmaOmega === null) {
          return null;
      }
      const errorLocations = findErrorLocations(field, sigmaOmega[0]);
      if (errorLocations == null) {
          return null;
      }
      const errorMagnitudes = findErrorMagnitudes(field, sigmaOmega[1], errorLocations);
      for (let i = 0; i < errorLocations.length; i++) {
          const position = outputBytes.length - 1 - field.log(errorLocations[i]);
          if (position < 0) {
              return null;
          }
          outputBytes[position] = addOrSubtractGF(outputBytes[position], errorMagnitudes[i]);
      }
      return outputBytes;
  }

  const VERSIONS = [
      {
          infoBits: null,
          versionNumber: 1,
          alignmentPatternCenters: [],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 7,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 19 }],
              },
              {
                  ecCodewordsPerBlock: 10,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
              },
              {
                  ecCodewordsPerBlock: 13,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 13 }],
              },
              {
                  ecCodewordsPerBlock: 17,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 9 }],
              },
          ],
      },
      {
          infoBits: null,
          versionNumber: 2,
          alignmentPatternCenters: [6, 18],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 10,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 34 }],
              },
              {
                  ecCodewordsPerBlock: 16,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 28 }],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 22 }],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 16 }],
              },
          ],
      },
      {
          infoBits: null,
          versionNumber: 3,
          alignmentPatternCenters: [6, 22],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 15,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 55 }],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 44 }],
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 17 }],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 13 }],
              },
          ],
      },
      {
          infoBits: null,
          versionNumber: 4,
          alignmentPatternCenters: [6, 26],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 80 }],
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 32 }],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 24 }],
              },
              {
                  ecCodewordsPerBlock: 16,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 9 }],
              },
          ],
      },
      {
          infoBits: null,
          versionNumber: 5,
          alignmentPatternCenters: [6, 30],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 1, dataCodewordsPerBlock: 108 }],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 43 }],
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 15 },
                      { numBlocks: 2, dataCodewordsPerBlock: 16 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 11 },
                      { numBlocks: 2, dataCodewordsPerBlock: 12 },
                  ],
              },
          ],
      },
      {
          infoBits: null,
          versionNumber: 6,
          alignmentPatternCenters: [6, 34],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 68 }],
              },
              {
                  ecCodewordsPerBlock: 16,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 27 }],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 19 }],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 15 }],
              },
          ],
      },
      {
          infoBits: 0x07C94,
          versionNumber: 7,
          alignmentPatternCenters: [6, 22, 38],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 78 }],
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 31 }],
              },
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 14 },
                      { numBlocks: 4, dataCodewordsPerBlock: 15 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 13 },
                      { numBlocks: 1, dataCodewordsPerBlock: 14 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x085BC,
          versionNumber: 8,
          alignmentPatternCenters: [6, 24, 42],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 97 }],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 38 },
                      { numBlocks: 2, dataCodewordsPerBlock: 39 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 18 },
                      { numBlocks: 2, dataCodewordsPerBlock: 19 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 14 },
                      { numBlocks: 2, dataCodewordsPerBlock: 15 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x09A99,
          versionNumber: 9,
          alignmentPatternCenters: [6, 26, 46],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 2, dataCodewordsPerBlock: 116 }],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 36 },
                      { numBlocks: 2, dataCodewordsPerBlock: 37 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 16 },
                      { numBlocks: 4, dataCodewordsPerBlock: 17 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 12 },
                      { numBlocks: 4, dataCodewordsPerBlock: 13 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x0A4D3,
          versionNumber: 10,
          alignmentPatternCenters: [6, 28, 50],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 18,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 68 },
                      { numBlocks: 2, dataCodewordsPerBlock: 69 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 43 },
                      { numBlocks: 1, dataCodewordsPerBlock: 44 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 19 },
                      { numBlocks: 2, dataCodewordsPerBlock: 20 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 15 },
                      { numBlocks: 2, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x0BBF6,
          versionNumber: 11,
          alignmentPatternCenters: [6, 30, 54],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 81 }],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 1, dataCodewordsPerBlock: 50 },
                      { numBlocks: 4, dataCodewordsPerBlock: 51 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 22 },
                      { numBlocks: 4, dataCodewordsPerBlock: 23 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 12 },
                      { numBlocks: 8, dataCodewordsPerBlock: 13 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x0C762,
          versionNumber: 12,
          alignmentPatternCenters: [6, 32, 58],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 92 },
                      { numBlocks: 2, dataCodewordsPerBlock: 93 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 36 },
                      { numBlocks: 2, dataCodewordsPerBlock: 37 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 20 },
                      { numBlocks: 6, dataCodewordsPerBlock: 21 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 7, dataCodewordsPerBlock: 14 },
                      { numBlocks: 4, dataCodewordsPerBlock: 15 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x0D847,
          versionNumber: 13,
          alignmentPatternCenters: [6, 34, 62],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 4, dataCodewordsPerBlock: 107 }],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 8, dataCodewordsPerBlock: 37 },
                      { numBlocks: 1, dataCodewordsPerBlock: 38 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 8, dataCodewordsPerBlock: 20 },
                      { numBlocks: 4, dataCodewordsPerBlock: 21 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 12, dataCodewordsPerBlock: 11 },
                      { numBlocks: 4, dataCodewordsPerBlock: 12 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x0E60D,
          versionNumber: 14,
          alignmentPatternCenters: [6, 26, 46, 66],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 115 },
                      { numBlocks: 1, dataCodewordsPerBlock: 116 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 40 },
                      { numBlocks: 5, dataCodewordsPerBlock: 41 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 20,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 16 },
                      { numBlocks: 5, dataCodewordsPerBlock: 17 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 12 },
                      { numBlocks: 5, dataCodewordsPerBlock: 13 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x0F928,
          versionNumber: 15,
          alignmentPatternCenters: [6, 26, 48, 70],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 22,
                  ecBlocks: [
                      { numBlocks: 5, dataCodewordsPerBlock: 87 },
                      { numBlocks: 1, dataCodewordsPerBlock: 88 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 5, dataCodewordsPerBlock: 41 },
                      { numBlocks: 5, dataCodewordsPerBlock: 42 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 5, dataCodewordsPerBlock: 24 },
                      { numBlocks: 7, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 12 },
                      { numBlocks: 7, dataCodewordsPerBlock: 13 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x10B78,
          versionNumber: 16,
          alignmentPatternCenters: [6, 26, 50, 74],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 5, dataCodewordsPerBlock: 98 },
                      { numBlocks: 1, dataCodewordsPerBlock: 99 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 7, dataCodewordsPerBlock: 45 },
                      { numBlocks: 3, dataCodewordsPerBlock: 46 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [
                      { numBlocks: 15, dataCodewordsPerBlock: 19 },
                      { numBlocks: 2, dataCodewordsPerBlock: 20 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 15 },
                      { numBlocks: 13, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1145D,
          versionNumber: 17,
          alignmentPatternCenters: [6, 30, 54, 78],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 1, dataCodewordsPerBlock: 107 },
                      { numBlocks: 5, dataCodewordsPerBlock: 108 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 10, dataCodewordsPerBlock: 46 },
                      { numBlocks: 1, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 1, dataCodewordsPerBlock: 22 },
                      { numBlocks: 15, dataCodewordsPerBlock: 23 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 14 },
                      { numBlocks: 17, dataCodewordsPerBlock: 15 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x12A17,
          versionNumber: 18,
          alignmentPatternCenters: [6, 30, 56, 82],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 5, dataCodewordsPerBlock: 120 },
                      { numBlocks: 1, dataCodewordsPerBlock: 121 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 9, dataCodewordsPerBlock: 43 },
                      { numBlocks: 4, dataCodewordsPerBlock: 44 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 17, dataCodewordsPerBlock: 22 },
                      { numBlocks: 1, dataCodewordsPerBlock: 23 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 14 },
                      { numBlocks: 19, dataCodewordsPerBlock: 15 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x13532,
          versionNumber: 19,
          alignmentPatternCenters: [6, 30, 58, 86],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 113 },
                      { numBlocks: 4, dataCodewordsPerBlock: 114 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 44 },
                      { numBlocks: 11, dataCodewordsPerBlock: 45 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 17, dataCodewordsPerBlock: 21 },
                      { numBlocks: 4, dataCodewordsPerBlock: 22 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 9, dataCodewordsPerBlock: 13 },
                      { numBlocks: 16, dataCodewordsPerBlock: 14 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x149A6,
          versionNumber: 20,
          alignmentPatternCenters: [6, 34, 62, 90],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 107 },
                      { numBlocks: 5, dataCodewordsPerBlock: 108 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 41 },
                      { numBlocks: 13, dataCodewordsPerBlock: 42 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 15, dataCodewordsPerBlock: 24 },
                      { numBlocks: 5, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 15, dataCodewordsPerBlock: 15 },
                      { numBlocks: 10, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x15683,
          versionNumber: 21,
          alignmentPatternCenters: [6, 28, 50, 72, 94],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 116 },
                      { numBlocks: 4, dataCodewordsPerBlock: 117 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 42 }],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 17, dataCodewordsPerBlock: 22 },
                      { numBlocks: 6, dataCodewordsPerBlock: 23 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 19, dataCodewordsPerBlock: 16 },
                      { numBlocks: 6, dataCodewordsPerBlock: 17 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x168C9,
          versionNumber: 22,
          alignmentPatternCenters: [6, 26, 50, 74, 98],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 111 },
                      { numBlocks: 7, dataCodewordsPerBlock: 112 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 46 }],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 7, dataCodewordsPerBlock: 24 },
                      { numBlocks: 16, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 24,
                  ecBlocks: [{ numBlocks: 34, dataCodewordsPerBlock: 13 }],
              },
          ],
      },
      {
          infoBits: 0x177EC,
          versionNumber: 23,
          alignmentPatternCenters: [6, 30, 54, 74, 102],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 121 },
                      { numBlocks: 5, dataCodewordsPerBlock: 122 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 47 },
                      { numBlocks: 14, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 24 },
                      { numBlocks: 14, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 16, dataCodewordsPerBlock: 15 },
                      { numBlocks: 14, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x18EC4,
          versionNumber: 24,
          alignmentPatternCenters: [6, 28, 54, 80, 106],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 117 },
                      { numBlocks: 4, dataCodewordsPerBlock: 118 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 45 },
                      { numBlocks: 14, dataCodewordsPerBlock: 46 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 24 },
                      { numBlocks: 16, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 30, dataCodewordsPerBlock: 16 },
                      { numBlocks: 2, dataCodewordsPerBlock: 17 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x191E1,
          versionNumber: 25,
          alignmentPatternCenters: [6, 32, 58, 84, 110],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 26,
                  ecBlocks: [
                      { numBlocks: 8, dataCodewordsPerBlock: 106 },
                      { numBlocks: 4, dataCodewordsPerBlock: 107 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 8, dataCodewordsPerBlock: 47 },
                      { numBlocks: 13, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 7, dataCodewordsPerBlock: 24 },
                      { numBlocks: 22, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 22, dataCodewordsPerBlock: 15 },
                      { numBlocks: 13, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1AFAB,
          versionNumber: 26,
          alignmentPatternCenters: [6, 30, 58, 86, 114],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 10, dataCodewordsPerBlock: 114 },
                      { numBlocks: 2, dataCodewordsPerBlock: 115 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 19, dataCodewordsPerBlock: 46 },
                      { numBlocks: 4, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 28, dataCodewordsPerBlock: 22 },
                      { numBlocks: 6, dataCodewordsPerBlock: 23 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 33, dataCodewordsPerBlock: 16 },
                      { numBlocks: 4, dataCodewordsPerBlock: 17 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1B08E,
          versionNumber: 27,
          alignmentPatternCenters: [6, 34, 62, 90, 118],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 8, dataCodewordsPerBlock: 122 },
                      { numBlocks: 4, dataCodewordsPerBlock: 123 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 22, dataCodewordsPerBlock: 45 },
                      { numBlocks: 3, dataCodewordsPerBlock: 46 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 8, dataCodewordsPerBlock: 23 },
                      { numBlocks: 26, dataCodewordsPerBlock: 24 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 12, dataCodewordsPerBlock: 15 },
                      { numBlocks: 28, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1CC1A,
          versionNumber: 28,
          alignmentPatternCenters: [6, 26, 50, 74, 98, 122],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 117 },
                      { numBlocks: 10, dataCodewordsPerBlock: 118 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 3, dataCodewordsPerBlock: 45 },
                      { numBlocks: 23, dataCodewordsPerBlock: 46 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 24 },
                      { numBlocks: 31, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 15 },
                      { numBlocks: 31, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1D33F,
          versionNumber: 29,
          alignmentPatternCenters: [6, 30, 54, 78, 102, 126],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 7, dataCodewordsPerBlock: 116 },
                      { numBlocks: 7, dataCodewordsPerBlock: 117 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 21, dataCodewordsPerBlock: 45 },
                      { numBlocks: 7, dataCodewordsPerBlock: 46 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 1, dataCodewordsPerBlock: 23 },
                      { numBlocks: 37, dataCodewordsPerBlock: 24 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 19, dataCodewordsPerBlock: 15 },
                      { numBlocks: 26, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1ED75,
          versionNumber: 30,
          alignmentPatternCenters: [6, 26, 52, 78, 104, 130],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 5, dataCodewordsPerBlock: 115 },
                      { numBlocks: 10, dataCodewordsPerBlock: 116 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 19, dataCodewordsPerBlock: 47 },
                      { numBlocks: 10, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 15, dataCodewordsPerBlock: 24 },
                      { numBlocks: 25, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 23, dataCodewordsPerBlock: 15 },
                      { numBlocks: 25, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x1F250,
          versionNumber: 31,
          alignmentPatternCenters: [6, 30, 56, 82, 108, 134],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 13, dataCodewordsPerBlock: 115 },
                      { numBlocks: 3, dataCodewordsPerBlock: 116 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 46 },
                      { numBlocks: 29, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 42, dataCodewordsPerBlock: 24 },
                      { numBlocks: 1, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 23, dataCodewordsPerBlock: 15 },
                      { numBlocks: 28, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x209D5,
          versionNumber: 32,
          alignmentPatternCenters: [6, 34, 60, 86, 112, 138],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [{ numBlocks: 17, dataCodewordsPerBlock: 115 }],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 10, dataCodewordsPerBlock: 46 },
                      { numBlocks: 23, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 10, dataCodewordsPerBlock: 24 },
                      { numBlocks: 35, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 19, dataCodewordsPerBlock: 15 },
                      { numBlocks: 35, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x216F0,
          versionNumber: 33,
          alignmentPatternCenters: [6, 30, 58, 86, 114, 142],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 17, dataCodewordsPerBlock: 115 },
                      { numBlocks: 1, dataCodewordsPerBlock: 116 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 14, dataCodewordsPerBlock: 46 },
                      { numBlocks: 21, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 29, dataCodewordsPerBlock: 24 },
                      { numBlocks: 19, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 11, dataCodewordsPerBlock: 15 },
                      { numBlocks: 46, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x228BA,
          versionNumber: 34,
          alignmentPatternCenters: [6, 34, 62, 90, 118, 146],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 13, dataCodewordsPerBlock: 115 },
                      { numBlocks: 6, dataCodewordsPerBlock: 116 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 14, dataCodewordsPerBlock: 46 },
                      { numBlocks: 23, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 44, dataCodewordsPerBlock: 24 },
                      { numBlocks: 7, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 59, dataCodewordsPerBlock: 16 },
                      { numBlocks: 1, dataCodewordsPerBlock: 17 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x2379F,
          versionNumber: 35,
          alignmentPatternCenters: [6, 30, 54, 78, 102, 126, 150],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 12, dataCodewordsPerBlock: 121 },
                      { numBlocks: 7, dataCodewordsPerBlock: 122 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 12, dataCodewordsPerBlock: 47 },
                      { numBlocks: 26, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 39, dataCodewordsPerBlock: 24 },
                      { numBlocks: 14, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 22, dataCodewordsPerBlock: 15 },
                      { numBlocks: 41, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x24B0B,
          versionNumber: 36,
          alignmentPatternCenters: [6, 24, 50, 76, 102, 128, 154],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 121 },
                      { numBlocks: 14, dataCodewordsPerBlock: 122 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 6, dataCodewordsPerBlock: 47 },
                      { numBlocks: 34, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 46, dataCodewordsPerBlock: 24 },
                      { numBlocks: 10, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 2, dataCodewordsPerBlock: 15 },
                      { numBlocks: 64, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x2542E,
          versionNumber: 37,
          alignmentPatternCenters: [6, 28, 54, 80, 106, 132, 158],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 17, dataCodewordsPerBlock: 122 },
                      { numBlocks: 4, dataCodewordsPerBlock: 123 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 29, dataCodewordsPerBlock: 46 },
                      { numBlocks: 14, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 49, dataCodewordsPerBlock: 24 },
                      { numBlocks: 10, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 24, dataCodewordsPerBlock: 15 },
                      { numBlocks: 46, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x26A64,
          versionNumber: 38,
          alignmentPatternCenters: [6, 32, 58, 84, 110, 136, 162],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 4, dataCodewordsPerBlock: 122 },
                      { numBlocks: 18, dataCodewordsPerBlock: 123 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 13, dataCodewordsPerBlock: 46 },
                      { numBlocks: 32, dataCodewordsPerBlock: 47 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 48, dataCodewordsPerBlock: 24 },
                      { numBlocks: 14, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 42, dataCodewordsPerBlock: 15 },
                      { numBlocks: 32, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x27541,
          versionNumber: 39,
          alignmentPatternCenters: [6, 26, 54, 82, 110, 138, 166],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 20, dataCodewordsPerBlock: 117 },
                      { numBlocks: 4, dataCodewordsPerBlock: 118 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 40, dataCodewordsPerBlock: 47 },
                      { numBlocks: 7, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 43, dataCodewordsPerBlock: 24 },
                      { numBlocks: 22, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 10, dataCodewordsPerBlock: 15 },
                      { numBlocks: 67, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
      {
          infoBits: 0x28C69,
          versionNumber: 40,
          alignmentPatternCenters: [6, 30, 58, 86, 114, 142, 170],
          errorCorrectionLevels: [
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 19, dataCodewordsPerBlock: 118 },
                      { numBlocks: 6, dataCodewordsPerBlock: 119 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 28,
                  ecBlocks: [
                      { numBlocks: 18, dataCodewordsPerBlock: 47 },
                      { numBlocks: 31, dataCodewordsPerBlock: 48 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 34, dataCodewordsPerBlock: 24 },
                      { numBlocks: 34, dataCodewordsPerBlock: 25 },
                  ],
              },
              {
                  ecCodewordsPerBlock: 30,
                  ecBlocks: [
                      { numBlocks: 20, dataCodewordsPerBlock: 15 },
                      { numBlocks: 61, dataCodewordsPerBlock: 16 },
                  ],
              },
          ],
      },
  ];

  // tslint:disable:no-bitwise
  function numBitsDiffering(x, y) {
      let z = x ^ y;
      let bitCount = 0;
      while (z) {
          bitCount++;
          z &= z - 1;
      }
      return bitCount;
  }
  function pushBit(bit, byte) {
      return (byte << 1) | bit;
  }
  // tslint:enable:no-bitwise
  const FORMAT_INFO_TABLE = [
      { bits: 0x5412, formatInfo: { errorCorrectionLevel: 1, dataMask: 0 } },
      { bits: 0x5125, formatInfo: { errorCorrectionLevel: 1, dataMask: 1 } },
      { bits: 0x5E7C, formatInfo: { errorCorrectionLevel: 1, dataMask: 2 } },
      { bits: 0x5B4B, formatInfo: { errorCorrectionLevel: 1, dataMask: 3 } },
      { bits: 0x45F9, formatInfo: { errorCorrectionLevel: 1, dataMask: 4 } },
      { bits: 0x40CE, formatInfo: { errorCorrectionLevel: 1, dataMask: 5 } },
      { bits: 0x4F97, formatInfo: { errorCorrectionLevel: 1, dataMask: 6 } },
      { bits: 0x4AA0, formatInfo: { errorCorrectionLevel: 1, dataMask: 7 } },
      { bits: 0x77C4, formatInfo: { errorCorrectionLevel: 0, dataMask: 0 } },
      { bits: 0x72F3, formatInfo: { errorCorrectionLevel: 0, dataMask: 1 } },
      { bits: 0x7DAA, formatInfo: { errorCorrectionLevel: 0, dataMask: 2 } },
      { bits: 0x789D, formatInfo: { errorCorrectionLevel: 0, dataMask: 3 } },
      { bits: 0x662F, formatInfo: { errorCorrectionLevel: 0, dataMask: 4 } },
      { bits: 0x6318, formatInfo: { errorCorrectionLevel: 0, dataMask: 5 } },
      { bits: 0x6C41, formatInfo: { errorCorrectionLevel: 0, dataMask: 6 } },
      { bits: 0x6976, formatInfo: { errorCorrectionLevel: 0, dataMask: 7 } },
      { bits: 0x1689, formatInfo: { errorCorrectionLevel: 3, dataMask: 0 } },
      { bits: 0x13BE, formatInfo: { errorCorrectionLevel: 3, dataMask: 1 } },
      { bits: 0x1CE7, formatInfo: { errorCorrectionLevel: 3, dataMask: 2 } },
      { bits: 0x19D0, formatInfo: { errorCorrectionLevel: 3, dataMask: 3 } },
      { bits: 0x0762, formatInfo: { errorCorrectionLevel: 3, dataMask: 4 } },
      { bits: 0x0255, formatInfo: { errorCorrectionLevel: 3, dataMask: 5 } },
      { bits: 0x0D0C, formatInfo: { errorCorrectionLevel: 3, dataMask: 6 } },
      { bits: 0x083B, formatInfo: { errorCorrectionLevel: 3, dataMask: 7 } },
      { bits: 0x355F, formatInfo: { errorCorrectionLevel: 2, dataMask: 0 } },
      { bits: 0x3068, formatInfo: { errorCorrectionLevel: 2, dataMask: 1 } },
      { bits: 0x3F31, formatInfo: { errorCorrectionLevel: 2, dataMask: 2 } },
      { bits: 0x3A06, formatInfo: { errorCorrectionLevel: 2, dataMask: 3 } },
      { bits: 0x24B4, formatInfo: { errorCorrectionLevel: 2, dataMask: 4 } },
      { bits: 0x2183, formatInfo: { errorCorrectionLevel: 2, dataMask: 5 } },
      { bits: 0x2EDA, formatInfo: { errorCorrectionLevel: 2, dataMask: 6 } },
      { bits: 0x2BED, formatInfo: { errorCorrectionLevel: 2, dataMask: 7 } },
  ];
  const DATA_MASKS = [
      (p) => ((p.y + p.x) % 2) === 0,
      (p) => (p.y % 2) === 0,
      (p) => p.x % 3 === 0,
      (p) => (p.y + p.x) % 3 === 0,
      (p) => (Math.floor(p.y / 2) + Math.floor(p.x / 3)) % 2 === 0,
      (p) => ((p.x * p.y) % 2) + ((p.x * p.y) % 3) === 0,
      (p) => ((((p.y * p.x) % 2) + (p.y * p.x) % 3) % 2) === 0,
      (p) => ((((p.y + p.x) % 2) + (p.y * p.x) % 3) % 2) === 0,
  ];
  function buildFunctionPatternMask(version) {
      const dimension = 17 + 4 * version.versionNumber;
      const matrix = BitMatrix.createEmpty(dimension, dimension);
      matrix.setRegion(0, 0, 9, 9, true); // Top left finder pattern + separator + format
      matrix.setRegion(dimension - 8, 0, 8, 9, true); // Top right finder pattern + separator + format
      matrix.setRegion(0, dimension - 8, 9, 8, true); // Bottom left finder pattern + separator + format
      // Alignment patterns
      for (const x of version.alignmentPatternCenters) {
          for (const y of version.alignmentPatternCenters) {
              if (!(x === 6 && y === 6 || x === 6 && y === dimension - 7 || x === dimension - 7 && y === 6)) {
                  matrix.setRegion(x - 2, y - 2, 5, 5, true);
              }
          }
      }
      matrix.setRegion(6, 9, 1, dimension - 17, true); // Vertical timing pattern
      matrix.setRegion(9, 6, dimension - 17, 1, true); // Horizontal timing pattern
      if (version.versionNumber > 6) {
          matrix.setRegion(dimension - 11, 0, 3, 6, true); // Version info, top right
          matrix.setRegion(0, dimension - 11, 6, 3, true); // Version info, bottom left
      }
      return matrix;
  }
  function readCodewords(matrix, version, formatInfo) {
      const dataMask = DATA_MASKS[formatInfo.dataMask];
      const dimension = matrix.height;
      const functionPatternMask = buildFunctionPatternMask(version);
      const codewords = [];
      let currentByte = 0;
      let bitsRead = 0;
      // Read columns in pairs, from right to left
      let readingUp = true;
      for (let columnIndex = dimension - 1; columnIndex > 0; columnIndex -= 2) {
          if (columnIndex === 6) { // Skip whole column with vertical alignment pattern;
              columnIndex--;
          }
          for (let i = 0; i < dimension; i++) {
              const y = readingUp ? dimension - 1 - i : i;
              for (let columnOffset = 0; columnOffset < 2; columnOffset++) {
                  const x = columnIndex - columnOffset;
                  if (!functionPatternMask.get(x, y)) {
                      bitsRead++;
                      let bit = matrix.get(x, y);
                      if (dataMask({ y, x })) {
                          bit = !bit;
                      }
                      currentByte = pushBit(bit, currentByte);
                      if (bitsRead === 8) { // Whole bytes
                          codewords.push(currentByte);
                          bitsRead = 0;
                          currentByte = 0;
                      }
                  }
              }
          }
          readingUp = !readingUp;
      }
      return codewords;
  }
  function readVersion(matrix) {
      const dimension = matrix.height;
      const provisionalVersion = Math.floor((dimension - 17) / 4);
      if (provisionalVersion <= 6) { // 6 and under dont have version info in the QR code
          return VERSIONS[provisionalVersion - 1];
      }
      let topRightVersionBits = 0;
      for (let y = 5; y >= 0; y--) {
          for (let x = dimension - 9; x >= dimension - 11; x--) {
              topRightVersionBits = pushBit(matrix.get(x, y), topRightVersionBits);
          }
      }
      let bottomLeftVersionBits = 0;
      for (let x = 5; x >= 0; x--) {
          for (let y = dimension - 9; y >= dimension - 11; y--) {
              bottomLeftVersionBits = pushBit(matrix.get(x, y), bottomLeftVersionBits);
          }
      }
      let bestDifference = Infinity;
      let bestVersion;
      for (const version of VERSIONS) {
          if (version.infoBits === topRightVersionBits || version.infoBits === bottomLeftVersionBits) {
              return version;
          }
          let difference = numBitsDiffering(topRightVersionBits, version.infoBits);
          if (difference < bestDifference) {
              bestVersion = version;
              bestDifference = difference;
          }
          difference = numBitsDiffering(bottomLeftVersionBits, version.infoBits);
          if (difference < bestDifference) {
              bestVersion = version;
              bestDifference = difference;
          }
      }
      // We can tolerate up to 3 bits of error since no two version info codewords will
      // differ in less than 8 bits.
      if (bestDifference <= 3) {
          return bestVersion;
      }
  }
  function readFormatInformation(matrix) {
      let topLeftFormatInfoBits = 0;
      for (let x = 0; x <= 8; x++) {
          if (x !== 6) { // Skip timing pattern bit
              topLeftFormatInfoBits = pushBit(matrix.get(x, 8), topLeftFormatInfoBits);
          }
      }
      for (let y = 7; y >= 0; y--) {
          if (y !== 6) { // Skip timing pattern bit
              topLeftFormatInfoBits = pushBit(matrix.get(8, y), topLeftFormatInfoBits);
          }
      }
      const dimension = matrix.height;
      let topRightBottomRightFormatInfoBits = 0;
      for (let y = dimension - 1; y >= dimension - 7; y--) { // bottom left
          topRightBottomRightFormatInfoBits = pushBit(matrix.get(8, y), topRightBottomRightFormatInfoBits);
      }
      for (let x = dimension - 8; x < dimension; x++) { // top right
          topRightBottomRightFormatInfoBits = pushBit(matrix.get(x, 8), topRightBottomRightFormatInfoBits);
      }
      let bestDifference = Infinity;
      let bestFormatInfo = null;
      for (const { bits, formatInfo } of FORMAT_INFO_TABLE) {
          if (bits === topLeftFormatInfoBits || bits === topRightBottomRightFormatInfoBits) {
              return formatInfo;
          }
          let difference = numBitsDiffering(topLeftFormatInfoBits, bits);
          if (difference < bestDifference) {
              bestFormatInfo = formatInfo;
              bestDifference = difference;
          }
          if (topLeftFormatInfoBits !== topRightBottomRightFormatInfoBits) { // also try the other option
              difference = numBitsDiffering(topRightBottomRightFormatInfoBits, bits);
              if (difference < bestDifference) {
                  bestFormatInfo = formatInfo;
                  bestDifference = difference;
              }
          }
      }
      // Hamming distance of the 32 masked codes is 7, by construction, so <= 3 bits differing means we found a match
      if (bestDifference <= 3) {
          return bestFormatInfo;
      }
      return null;
  }
  function getDataBlocks(codewords, version, ecLevel) {
      const ecInfo = version.errorCorrectionLevels[ecLevel];
      const dataBlocks = [];
      let totalCodewords = 0;
      ecInfo.ecBlocks.forEach(block => {
          for (let i = 0; i < block.numBlocks; i++) {
              dataBlocks.push({ numDataCodewords: block.dataCodewordsPerBlock, codewords: [] });
              totalCodewords += block.dataCodewordsPerBlock + ecInfo.ecCodewordsPerBlock;
          }
      });
      // In some cases the QR code will be malformed enough that we pull off more or less than we should.
      // If we pull off less there's nothing we can do.
      // If we pull off more we can safely truncate
      if (codewords.length < totalCodewords) {
          return null;
      }
      codewords = codewords.slice(0, totalCodewords);
      const shortBlockSize = ecInfo.ecBlocks[0].dataCodewordsPerBlock;
      // Pull codewords to fill the blocks up to the minimum size
      for (let i = 0; i < shortBlockSize; i++) {
          for (const dataBlock of dataBlocks) {
              dataBlock.codewords.push(codewords.shift());
          }
      }
      // If there are any large blocks, pull codewords to fill the last element of those
      if (ecInfo.ecBlocks.length > 1) {
          const smallBlockCount = ecInfo.ecBlocks[0].numBlocks;
          const largeBlockCount = ecInfo.ecBlocks[1].numBlocks;
          for (let i = 0; i < largeBlockCount; i++) {
              dataBlocks[smallBlockCount + i].codewords.push(codewords.shift());
          }
      }
      // Add the rest of the codewords to the blocks. These are the error correction codewords.
      while (codewords.length > 0) {
          for (const dataBlock of dataBlocks) {
              dataBlock.codewords.push(codewords.shift());
          }
      }
      return dataBlocks;
  }
  function decodeMatrix(matrix) {
      const version = readVersion(matrix);
      if (!version) {
          return null;
      }
      const formatInfo = readFormatInformation(matrix);
      if (!formatInfo) {
          return null;
      }
      const codewords = readCodewords(matrix, version, formatInfo);
      const dataBlocks = getDataBlocks(codewords, version, formatInfo.errorCorrectionLevel);
      if (!dataBlocks) {
          return null;
      }
      // Count total number of data bytes
      const totalBytes = dataBlocks.reduce((a, b) => a + b.numDataCodewords, 0);
      const resultBytes = new Uint8ClampedArray(totalBytes);
      let resultIndex = 0;
      for (const dataBlock of dataBlocks) {
          const correctedBytes = decode$1(dataBlock.codewords, dataBlock.codewords.length - dataBlock.numDataCodewords);
          if (!correctedBytes) {
              return null;
          }
          for (let i = 0; i < dataBlock.numDataCodewords; i++) {
              resultBytes[resultIndex++] = correctedBytes[i];
          }
      }
      try {
          return decode(resultBytes, version.versionNumber);
      }
      catch (_a) {
          return null;
      }
  }
  function decode$2(matrix) {
      if (matrix == null) {
          return null;
      }
      const result = decodeMatrix(matrix);
      if (result) {
          return result;
      }
      // Decoding didn't work, try mirroring the QR across the topLeft -> bottomRight line.
      for (let x = 0; x < matrix.width; x++) {
          for (let y = x + 1; y < matrix.height; y++) {
              if (matrix.get(x, y) !== matrix.get(y, x)) {
                  matrix.set(x, y, !matrix.get(x, y));
                  matrix.set(y, x, !matrix.get(y, x));
              }
          }
      }
      return decodeMatrix(matrix);
  }

  function squareToQuadrilateral(p1, p2, p3, p4) {
      const dx3 = p1.x - p2.x + p3.x - p4.x;
      const dy3 = p1.y - p2.y + p3.y - p4.y;
      if (dx3 === 0 && dy3 === 0) { // Affine
          return {
              a11: p2.x - p1.x,
              a12: p2.y - p1.y,
              a13: 0,
              a21: p3.x - p2.x,
              a22: p3.y - p2.y,
              a23: 0,
              a31: p1.x,
              a32: p1.y,
              a33: 1,
          };
      }
      else {
          const dx1 = p2.x - p3.x;
          const dx2 = p4.x - p3.x;
          const dy1 = p2.y - p3.y;
          const dy2 = p4.y - p3.y;
          const denominator = dx1 * dy2 - dx2 * dy1;
          const a13 = (dx3 * dy2 - dx2 * dy3) / denominator;
          const a23 = (dx1 * dy3 - dx3 * dy1) / denominator;
          return {
              a11: p2.x - p1.x + a13 * p2.x,
              a12: p2.y - p1.y + a13 * p2.y,
              a13,
              a21: p4.x - p1.x + a23 * p4.x,
              a22: p4.y - p1.y + a23 * p4.y,
              a23,
              a31: p1.x,
              a32: p1.y,
              a33: 1,
          };
      }
  }
  function quadrilateralToSquare(p1, p2, p3, p4) {
      // Here, the adjoint serves as the inverse:
      const sToQ = squareToQuadrilateral(p1, p2, p3, p4);
      return {
          a11: sToQ.a22 * sToQ.a33 - sToQ.a23 * sToQ.a32,
          a12: sToQ.a13 * sToQ.a32 - sToQ.a12 * sToQ.a33,
          a13: sToQ.a12 * sToQ.a23 - sToQ.a13 * sToQ.a22,
          a21: sToQ.a23 * sToQ.a31 - sToQ.a21 * sToQ.a33,
          a22: sToQ.a11 * sToQ.a33 - sToQ.a13 * sToQ.a31,
          a23: sToQ.a13 * sToQ.a21 - sToQ.a11 * sToQ.a23,
          a31: sToQ.a21 * sToQ.a32 - sToQ.a22 * sToQ.a31,
          a32: sToQ.a12 * sToQ.a31 - sToQ.a11 * sToQ.a32,
          a33: sToQ.a11 * sToQ.a22 - sToQ.a12 * sToQ.a21,
      };
  }
  function times(a, b) {
      return {
          a11: a.a11 * b.a11 + a.a21 * b.a12 + a.a31 * b.a13,
          a12: a.a12 * b.a11 + a.a22 * b.a12 + a.a32 * b.a13,
          a13: a.a13 * b.a11 + a.a23 * b.a12 + a.a33 * b.a13,
          a21: a.a11 * b.a21 + a.a21 * b.a22 + a.a31 * b.a23,
          a22: a.a12 * b.a21 + a.a22 * b.a22 + a.a32 * b.a23,
          a23: a.a13 * b.a21 + a.a23 * b.a22 + a.a33 * b.a23,
          a31: a.a11 * b.a31 + a.a21 * b.a32 + a.a31 * b.a33,
          a32: a.a12 * b.a31 + a.a22 * b.a32 + a.a32 * b.a33,
          a33: a.a13 * b.a31 + a.a23 * b.a32 + a.a33 * b.a33,
      };
  }
  function extract(image, location) {
      const qToS = quadrilateralToSquare({ x: 3.5, y: 3.5 }, { x: location.dimension - 3.5, y: 3.5 }, { x: location.dimension - 6.5, y: location.dimension - 6.5 }, { x: 3.5, y: location.dimension - 3.5 });
      const sToQ = squareToQuadrilateral(location.topLeft, location.topRight, location.alignmentPattern, location.bottomLeft);
      const transform = times(sToQ, qToS);
      const matrix = BitMatrix.createEmpty(location.dimension, location.dimension);
      const mappingFunction = (x, y) => {
          const denominator = transform.a13 * x + transform.a23 * y + transform.a33;
          return {
              x: (transform.a11 * x + transform.a21 * y + transform.a31) / denominator,
              y: (transform.a12 * x + transform.a22 * y + transform.a32) / denominator,
          };
      };
      for (let y = 0; y < location.dimension; y++) {
          for (let x = 0; x < location.dimension; x++) {
              const xValue = x + 0.5;
              const yValue = y + 0.5;
              const sourcePixel = mappingFunction(xValue, yValue);
              matrix.set(x, y, image.get(Math.floor(sourcePixel.x), Math.floor(sourcePixel.y)));
          }
      }
      return {
          matrix,
          mappingFunction,
      };
  }

  const MAX_FINDERPATTERNS_TO_SEARCH = 4;
  const MIN_QUAD_RATIO = 0.5;
  const MAX_QUAD_RATIO = 1.5;
  const distance = (a, b) => Math.sqrt(Math.pow((b.x - a.x), 2) + Math.pow((b.y - a.y), 2));
  function sum(values) {
      return values.reduce((a, b) => a + b);
  }
  // Takes three finder patterns and organizes them into topLeft, topRight, etc
  function reorderFinderPatterns(pattern1, pattern2, pattern3) {
      // Find distances between pattern centers
      const oneTwoDistance = distance(pattern1, pattern2);
      const twoThreeDistance = distance(pattern2, pattern3);
      const oneThreeDistance = distance(pattern1, pattern3);
      let bottomLeft;
      let topLeft;
      let topRight;
      // Assume one closest to other two is B; A and C will just be guesses at first
      if (twoThreeDistance >= oneTwoDistance && twoThreeDistance >= oneThreeDistance) {
          [bottomLeft, topLeft, topRight] = [pattern2, pattern1, pattern3];
      }
      else if (oneThreeDistance >= twoThreeDistance && oneThreeDistance >= oneTwoDistance) {
          [bottomLeft, topLeft, topRight] = [pattern1, pattern2, pattern3];
      }
      else {
          [bottomLeft, topLeft, topRight] = [pattern1, pattern3, pattern2];
      }
      // Use cross product to figure out whether bottomLeft (A) and topRight (C) are correct or flipped in relation to topLeft (B)
      // This asks whether BC x BA has a positive z component, which is the arrangement we want. If it's negative, then
      // we've got it flipped around and should swap topRight and bottomLeft.
      if (((topRight.x - topLeft.x) * (bottomLeft.y - topLeft.y)) - ((topRight.y - topLeft.y) * (bottomLeft.x - topLeft.x)) < 0) {
          [bottomLeft, topRight] = [topRight, bottomLeft];
      }
      return { bottomLeft, topLeft, topRight };
  }
  // Computes the dimension (number of modules on a side) of the QR Code based on the position of the finder patterns
  function computeDimension(topLeft, topRight, bottomLeft, matrix) {
      const moduleSize = (sum(countBlackWhiteRun(topLeft, bottomLeft, matrix, 5)) / 7 + // Divide by 7 since the ratio is 1:1:3:1:1
          sum(countBlackWhiteRun(topLeft, topRight, matrix, 5)) / 7 +
          sum(countBlackWhiteRun(bottomLeft, topLeft, matrix, 5)) / 7 +
          sum(countBlackWhiteRun(topRight, topLeft, matrix, 5)) / 7) / 4;
      if (moduleSize < 1) {
          throw new Error("Invalid module size");
      }
      const topDimension = Math.round(distance(topLeft, topRight) / moduleSize);
      const sideDimension = Math.round(distance(topLeft, bottomLeft) / moduleSize);
      let dimension = Math.floor((topDimension + sideDimension) / 2) + 7;
      switch (dimension % 4) {
          case 0:
              dimension++;
              break;
          case 2:
              dimension--;
              break;
      }
      return { dimension, moduleSize };
  }
  // Takes an origin point and an end point and counts the sizes of the black white run from the origin towards the end point.
  // Returns an array of elements, representing the pixel size of the black white run.
  // Uses a variant of http://en.wikipedia.org/wiki/Bresenham's_line_algorithm
  function countBlackWhiteRunTowardsPoint(origin, end, matrix, length) {
      const switchPoints = [{ x: Math.floor(origin.x), y: Math.floor(origin.y) }];
      const steep = Math.abs(end.y - origin.y) > Math.abs(end.x - origin.x);
      let fromX;
      let fromY;
      let toX;
      let toY;
      if (steep) {
          fromX = Math.floor(origin.y);
          fromY = Math.floor(origin.x);
          toX = Math.floor(end.y);
          toY = Math.floor(end.x);
      }
      else {
          fromX = Math.floor(origin.x);
          fromY = Math.floor(origin.y);
          toX = Math.floor(end.x);
          toY = Math.floor(end.y);
      }
      const dx = Math.abs(toX - fromX);
      const dy = Math.abs(toY - fromY);
      let error = Math.floor(-dx / 2);
      const xStep = fromX < toX ? 1 : -1;
      const yStep = fromY < toY ? 1 : -1;
      let currentPixel = true;
      // Loop up until x == toX, but not beyond
      for (let x = fromX, y = fromY; x !== toX + xStep; x += xStep) {
          // Does current pixel mean we have moved white to black or vice versa?
          // Scanning black in state 0,2 and white in state 1, so if we find the wrong
          // color, advance to next state or end if we are in state 2 already
          const realX = steep ? y : x;
          const realY = steep ? x : y;
          if (matrix.get(realX, realY) !== currentPixel) {
              currentPixel = !currentPixel;
              switchPoints.push({ x: realX, y: realY });
              if (switchPoints.length === length + 1) {
                  break;
              }
          }
          error += dy;
          if (error > 0) {
              if (y === toY) {
                  break;
              }
              y += yStep;
              error -= dx;
          }
      }
      const distances = [];
      for (let i = 0; i < length; i++) {
          if (switchPoints[i] && switchPoints[i + 1]) {
              distances.push(distance(switchPoints[i], switchPoints[i + 1]));
          }
          else {
              distances.push(0);
          }
      }
      return distances;
  }
  // Takes an origin point and an end point and counts the sizes of the black white run in the origin point
  // along the line that intersects with the end point. Returns an array of elements, representing the pixel sizes
  // of the black white run. Takes a length which represents the number of switches from black to white to look for.
  function countBlackWhiteRun(origin, end, matrix, length) {
      const rise = end.y - origin.y;
      const run = end.x - origin.x;
      const towardsEnd = countBlackWhiteRunTowardsPoint(origin, end, matrix, Math.ceil(length / 2));
      const awayFromEnd = countBlackWhiteRunTowardsPoint(origin, { x: origin.x - run, y: origin.y - rise }, matrix, Math.ceil(length / 2));
      const middleValue = towardsEnd.shift() + awayFromEnd.shift() - 1; // Substract one so we don't double count a pixel
      return awayFromEnd.concat(middleValue).concat(...towardsEnd);
  }
  // Takes in a black white run and an array of expected ratios. Returns the average size of the run as well as the "error" -
  // that is the amount the run diverges from the expected ratio
  function scoreBlackWhiteRun(sequence, ratios) {
      const averageSize = sum(sequence) / sum(ratios);
      let error = 0;
      ratios.forEach((ratio, i) => {
          error += Math.pow((sequence[i] - ratio * averageSize), 2);
      });
      return { averageSize, error };
  }
  // Takes an X,Y point and an array of sizes and scores the point against those ratios.
  // For example for a finder pattern takes the ratio list of 1:1:3:1:1 and checks horizontal, vertical and diagonal ratios
  // against that.
  function scorePattern(point, ratios, matrix) {
      try {
          const horizontalRun = countBlackWhiteRun(point, { x: -1, y: point.y }, matrix, ratios.length);
          const verticalRun = countBlackWhiteRun(point, { x: point.x, y: -1 }, matrix, ratios.length);
          const topLeftPoint = {
              x: Math.max(0, point.x - point.y) - 1,
              y: Math.max(0, point.y - point.x) - 1,
          };
          const topLeftBottomRightRun = countBlackWhiteRun(point, topLeftPoint, matrix, ratios.length);
          const bottomLeftPoint = {
              x: Math.min(matrix.width, point.x + point.y) + 1,
              y: Math.min(matrix.height, point.y + point.x) + 1,
          };
          const bottomLeftTopRightRun = countBlackWhiteRun(point, bottomLeftPoint, matrix, ratios.length);
          const horzError = scoreBlackWhiteRun(horizontalRun, ratios);
          const vertError = scoreBlackWhiteRun(verticalRun, ratios);
          const diagDownError = scoreBlackWhiteRun(topLeftBottomRightRun, ratios);
          const diagUpError = scoreBlackWhiteRun(bottomLeftTopRightRun, ratios);
          const ratioError = Math.sqrt(horzError.error * horzError.error +
              vertError.error * vertError.error +
              diagDownError.error * diagDownError.error +
              diagUpError.error * diagUpError.error);
          const avgSize = (horzError.averageSize + vertError.averageSize + diagDownError.averageSize + diagUpError.averageSize) / 4;
          const sizeError = (Math.pow((horzError.averageSize - avgSize), 2) +
              Math.pow((vertError.averageSize - avgSize), 2) +
              Math.pow((diagDownError.averageSize - avgSize), 2) +
              Math.pow((diagUpError.averageSize - avgSize), 2)) / avgSize;
          return ratioError + sizeError;
      }
      catch (_a) {
          return Infinity;
      }
  }
  function locate(matrix) {
      const finderPatternQuads = [];
      let activeFinderPatternQuads = [];
      const alignmentPatternQuads = [];
      let activeAlignmentPatternQuads = [];
      for (let y = 0; y <= matrix.height; y++) {
          let length = 0;
          let lastBit = false;
          let scans = [0, 0, 0, 0, 0];
          for (let x = -1; x <= matrix.width; x++) {
              const v = matrix.get(x, y);
              if (v === lastBit) {
                  length++;
              }
              else {
                  scans = [scans[1], scans[2], scans[3], scans[4], length];
                  length = 1;
                  lastBit = v;
                  // Do the last 5 color changes ~ match the expected ratio for a finder pattern? 1:1:3:1:1 of b:w:b:w:b
                  const averageFinderPatternBlocksize = sum(scans) / 7;
                  const validFinderPattern = Math.abs(scans[0] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      Math.abs(scans[1] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      Math.abs(scans[2] - 3 * averageFinderPatternBlocksize) < 3 * averageFinderPatternBlocksize &&
                      Math.abs(scans[3] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      Math.abs(scans[4] - averageFinderPatternBlocksize) < averageFinderPatternBlocksize &&
                      !v; // And make sure the current pixel is white since finder patterns are bordered in white
                  // Do the last 3 color changes ~ match the expected ratio for an alignment pattern? 1:1:1 of w:b:w
                  const averageAlignmentPatternBlocksize = sum(scans.slice(-3)) / 3;
                  const validAlignmentPattern = Math.abs(scans[2] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                      Math.abs(scans[3] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                      Math.abs(scans[4] - averageAlignmentPatternBlocksize) < averageAlignmentPatternBlocksize &&
                      v; // Is the current pixel black since alignment patterns are bordered in black
                  if (validFinderPattern) {
                      // Compute the start and end x values of the large center black square
                      const endX = x - scans[3] - scans[4];
                      const startX = endX - scans[2];
                      const line = { startX, endX, y };
                      // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                      // that line as the starting point.
                      const matchingQuads = activeFinderPatternQuads.filter(q => (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
                          (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
                          (startX <= q.bottom.startX && endX >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                              (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO)));
                      if (matchingQuads.length > 0) {
                          matchingQuads[0].bottom = line;
                      }
                      else {
                          activeFinderPatternQuads.push({ top: line, bottom: line });
                      }
                  }
                  if (validAlignmentPattern) {
                      // Compute the start and end x values of the center black square
                      const endX = x - scans[4];
                      const startX = endX - scans[3];
                      const line = { startX, y, endX };
                      // Is there a quad directly above the current spot? If so, extend it with the new line. Otherwise, create a new quad with
                      // that line as the starting point.
                      const matchingQuads = activeAlignmentPatternQuads.filter(q => (startX >= q.bottom.startX && startX <= q.bottom.endX) ||
                          (endX >= q.bottom.startX && startX <= q.bottom.endX) ||
                          (startX <= q.bottom.startX && endX >= q.bottom.endX && ((scans[2] / (q.bottom.endX - q.bottom.startX)) < MAX_QUAD_RATIO &&
                              (scans[2] / (q.bottom.endX - q.bottom.startX)) > MIN_QUAD_RATIO)));
                      if (matchingQuads.length > 0) {
                          matchingQuads[0].bottom = line;
                      }
                      else {
                          activeAlignmentPatternQuads.push({ top: line, bottom: line });
                      }
                  }
              }
          }
          finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y !== y && q.bottom.y - q.top.y >= 2));
          activeFinderPatternQuads = activeFinderPatternQuads.filter(q => q.bottom.y === y);
          alignmentPatternQuads.push(...activeAlignmentPatternQuads.filter(q => q.bottom.y !== y));
          activeAlignmentPatternQuads = activeAlignmentPatternQuads.filter(q => q.bottom.y === y);
      }
      finderPatternQuads.push(...activeFinderPatternQuads.filter(q => q.bottom.y - q.top.y >= 2));
      alignmentPatternQuads.push(...activeAlignmentPatternQuads);
      const finderPatternGroups = finderPatternQuads
          .filter(q => q.bottom.y - q.top.y >= 2) // All quads must be at least 2px tall since the center square is larger than a block
          .map(q => {
          const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
          const y = (q.top.y + q.bottom.y + 1) / 2;
          if (!matrix.get(Math.round(x), Math.round(y))) {
              return;
          }
          const lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, q.bottom.y - q.top.y + 1];
          const size = sum(lengths) / lengths.length;
          const score = scorePattern({ x: Math.round(x), y: Math.round(y) }, [1, 1, 3, 1, 1], matrix);
          return { score, x, y, size };
      })
          .filter(q => !!q) // Filter out any rejected quads from above
          .sort((a, b) => a.score - b.score)
          // Now take the top finder pattern options and try to find 2 other options with a similar size.
          .map((point, i, finderPatterns) => {
          if (i > MAX_FINDERPATTERNS_TO_SEARCH) {
              return null;
          }
          const otherPoints = finderPatterns
              .filter((p, ii) => i !== ii)
              .map(p => ({ x: p.x, y: p.y, score: p.score + (Math.pow((p.size - point.size), 2)) / point.size, size: p.size }))
              .sort((a, b) => a.score - b.score);
          if (otherPoints.length < 2) {
              return null;
          }
          const score = point.score + otherPoints[0].score + otherPoints[1].score;
          return { points: [point].concat(otherPoints.slice(0, 2)), score };
      })
          .filter(q => !!q) // Filter out any rejected finder patterns from above
          .sort((a, b) => a.score - b.score);
      if (finderPatternGroups.length === 0) {
          return null;
      }
      const { topRight, topLeft, bottomLeft } = reorderFinderPatterns(finderPatternGroups[0].points[0], finderPatternGroups[0].points[1], finderPatternGroups[0].points[2]);
      // Now that we've found the three finder patterns we can determine the blockSize and the size of the QR code.
      // We'll use these to help find the alignment pattern but also later when we do the extraction.
      let dimension;
      let moduleSize;
      try {
          ({ dimension, moduleSize } = computeDimension(topLeft, topRight, bottomLeft, matrix));
      }
      catch (e) {
          return null;
      }
      // Now find the alignment pattern
      const bottomRightFinderPattern = {
          x: topRight.x - topLeft.x + bottomLeft.x,
          y: topRight.y - topLeft.y + bottomLeft.y,
      };
      const modulesBetweenFinderPatterns = ((distance(topLeft, bottomLeft) + distance(topLeft, topRight)) / 2 / moduleSize);
      const correctionToTopLeft = 1 - (3 / modulesBetweenFinderPatterns);
      const expectedAlignmentPattern = {
          x: topLeft.x + correctionToTopLeft * (bottomRightFinderPattern.x - topLeft.x),
          y: topLeft.y + correctionToTopLeft * (bottomRightFinderPattern.y - topLeft.y),
      };
      const alignmentPatterns = alignmentPatternQuads
          .map(q => {
          const x = (q.top.startX + q.top.endX + q.bottom.startX + q.bottom.endX) / 4;
          const y = (q.top.y + q.bottom.y + 1) / 2;
          if (!matrix.get(Math.floor(x), Math.floor(y))) {
              return;
          }
          const lengths = [q.top.endX - q.top.startX, q.bottom.endX - q.bottom.startX, (q.bottom.y - q.top.y + 1)];
          const size = sum(lengths) / lengths.length;
          const sizeScore = scorePattern({ x: Math.floor(x), y: Math.floor(y) }, [1, 1, 1], matrix);
          const score = sizeScore + distance({ x, y }, expectedAlignmentPattern);
          return { x, y, score };
      })
          .filter(v => !!v)
          .sort((a, b) => a.score - b.score);
      // If there are less than 15 modules between finder patterns it's a version 1 QR code and as such has no alignmemnt pattern
      // so we can only use our best guess.
      const alignmentPattern = modulesBetweenFinderPatterns >= 15 && alignmentPatterns.length ? alignmentPatterns[0] : expectedAlignmentPattern;
      return {
          alignmentPattern: { x: alignmentPattern.x, y: alignmentPattern.y },
          bottomLeft: { x: bottomLeft.x, y: bottomLeft.y },
          dimension,
          topLeft: { x: topLeft.x, y: topLeft.y },
          topRight: { x: topRight.x, y: topRight.y },
      };
  }

  function scan(matrix) {
      const location = locate(matrix);
      if (!location) {
          return null;
      }
      const extracted = extract(matrix, location);
      const decoded = decode$2(extracted.matrix);
      if (!decoded) {
          return null;
      }
      return {
          binaryData: decoded.bytes,
          data: decoded.text,
          chunks: decoded.chunks,
          location: {
              topRightCorner: extracted.mappingFunction(location.dimension, 0),
              topLeftCorner: extracted.mappingFunction(0, 0),
              bottomRightCorner: extracted.mappingFunction(location.dimension, location.dimension),
              bottomLeftCorner: extracted.mappingFunction(0, location.dimension),
              topRightFinderPattern: location.topRight,
              topLeftFinderPattern: location.topLeft,
              bottomLeftFinderPattern: location.bottomLeft,
              bottomRightAlignmentPattern: location.alignmentPattern,
          },
      };
  }
  const defaultOptions = {
      inversionAttempts: "attemptBoth",
      greyScaleWeights: {
          red: 0.2126,
          green: 0.7152,
          blue: 0.0722,
          useIntegerApproximation: false,
      },
      canOverwriteImage: true,
  };
  function mergeObject(target, src) {
      Object.keys(src).forEach(opt => {
          target[opt] = src[opt];
      });
  }
  function jsQR(data, width, height, providedOptions = {}) {
      const options = Object.create(null);
      mergeObject(options, defaultOptions);
      mergeObject(options, providedOptions);
      const shouldInvert = options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst";
      const tryInvertedFirst = options.inversionAttempts === "onlyInvert" || options.inversionAttempts === "invertFirst";
      const { binarized, inverted } = binarize(data, width, height, shouldInvert, options.greyScaleWeights, options.canOverwriteImage);
      let result = scan(tryInvertedFirst ? inverted : binarized);
      if (!result && (options.inversionAttempts === "attemptBoth" || options.inversionAttempts === "invertFirst")) {
          result = scan(tryInvertedFirst ? binarized : inverted);
      }
      return result;
  }
  jsQR.default = jsQR;
  //# sourceMappingURL=jsQR.js.map

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function string_of_invertOptions(param) {
    switch (param) {
      case 0 : 
          return "attemptBoth";
      case 1 : 
          return "dontInvert";
      case 2 : 
          return "onlyInvert";
      case 3 : 
          return "invertFirst";
      
    }
  }

  function jsQR$1(d, w, h, invertOptions) {
    var optString = string_of_invertOptions(invertOptions);
    return nullable_to_opt(jsQR(d, w, h, {
                    inversionAttempts: optString,
                    canOverwriteImage: true
                  }));
  }
  /* jsqr-es6 Not a pure module */

  /* No side effect */

  /* No side effect */

  function keepU(a, f) {
    var l = a.length;
    var r = new Array(l);
    var j = 0;
    for(var i = 0 ,i_finish = l - 1 | 0; i <= i_finish; ++i){
      var v = a[i];
      if (f(v)) {
        r[j] = v;
        j = j + 1 | 0;
      }
      
    }
    r.length = j;
    return r;
  }

  function keep(a, f) {
    return keepU(a, __1(f));
  }
  /* No side effect */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function getCameras(param) {
    return window.navigator.mediaDevices.enumerateDevices().then((function (devices) {
                  return Promise.resolve(keep(devices, (function (x) {
                                    return x.kind === "videoinput";
                                  })));
                }));
  }

  function initStreamByDeviceId(videoEl, deviceId) {
    return window.navigator.mediaDevices.getUserMedia({
                  video: {
                    deviceId: deviceId
                  }
                }).then((function (stream) {
                  videoEl.srcObject = stream;
                  var match = asHtmlElement$1(videoEl);
                  if (match !== undefined) {
                    valFromOption(match).setAttribute("playsinline", "true");
                  }
                  videoEl.play();
                  return Promise.resolve(videoEl);
                }));
  }
  /* ElementRe Not a pure module */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function syncScan(scanCallback, imageData) {
    var match = jsQR$1(imageData.data, imageData.width, imageData.height, /* DontInvert */1);
    if (match !== undefined) {
      return _1(scanCallback, valFromOption(match).data);
    } else {
      return /* () */0;
    }
  }

  function scanUsingDeviceId(videoEl, deviceId, scanCallback) {
    return initStreamByDeviceId(videoEl, deviceId).then((function (video) {
                  var canvas = document.createElementNS(htmlNs, "canvas");
                  withQuerySelectorDom("#htmlContainer", (function (body) {
                          body.appendChild(canvas);
                          return /* () */0;
                        }));
                  var maybeWorker;
                  var exit = 0;
                  var worker;
                  try {
                    worker = new Worker("worker.js");
                    exit = 1;
                  }
                  catch (raw_e){
                    var e = internalToOCamlException(raw_e);
                    console.log("Could not initialize worker, falling back to synchronous scan.");
                    console.log(e);
                    maybeWorker = undefined;
                  }
                  if (exit === 1) {
                    maybeWorker = some(worker);
                  }
                  if (maybeWorker !== undefined) {
                    var msgBackHandler = function (e) {
                      var maybeCode = e.data;
                      if (maybeCode !== undefined) {
                        return _1(scanCallback, valFromOption(maybeCode).data);
                      } else {
                        return /* () */0;
                      }
                    };
                    valFromOption(maybeWorker).onmessage = msgBackHandler;
                  }
                  var frameCount = /* record */[/* contents */0];
                  var onTick = function (param) {
                    if (video.readyState === 4) {
                      var width = video.videoWidth;
                      var height = video.videoHeight;
                      if (canvas.width !== width) {
                        canvas.width = width;
                        canvas.height = height;
                      }
                      if (frameCount[0] % 5 === 0) {
                        var ctx = canvas.getContext("2d");
                        ctx.drawImage(video, 0, 0);
                        var imageData = ctx.getImageData(0, 0, width, height);
                        if (maybeWorker !== undefined) {
                          valFromOption(maybeWorker).postMessage(/* tuple */[
                                imageData.data,
                                width,
                                height
                              ]);
                        } else {
                          syncScan(scanCallback, imageData);
                        }
                      }
                      
                    }
                    frameCount[0] = frameCount[0] + 1 | 0;
                    requestAnimationFrame(onTick);
                    return /* () */0;
                  };
                  requestAnimationFrame(onTick);
                  return Promise.resolve(canvas);
                }));
  }
  /* JsQr-QueerLoop Not a pure module */

  /*
   * QR Code generator library (JavaScript)
   * 
   * Copyright (c) Project Nayuki. (MIT License)
   * https://www.nayuki.io/page/qr-code-generator-library
   * 
   * Permission is hereby granted, free of charge, to any person obtaining a copy of
   * this software and associated documentation files (the "Software"), to deal in
   * the Software without restriction, including without limitation the rights to
   * use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
   * the Software, and to permit persons to whom the Software is furnished to do so,
   * subject to the following conditions:
   * - The above copyright notice and this permission notice shall be included in
   *   all copies or substantial portions of the Software.
   * - The Software is provided "as is", without warranty of any kind, express or
   *   implied, including but not limited to the warranties of merchantability,
   *   fitness for a particular purpose and noninfringement. In no event shall the
   *   authors or copyright holders be liable for any claim, damages or other
   *   liability, whether in an action of contract, tort or otherwise, arising from,
   *   out of or in connection with the Software or the use or other dealings in the
   *   Software.
   */



  /* 
   * Module "qrcodegen", public members:
   * - Class QrCode:
   *   - Function encodeText(str text, QrCode.Ecc ecl) -> QrCode
   *   - Function encodeBinary(list<byte> data, QrCode.Ecc ecl) -> QrCode
   *   - Function encodeSegments(list<QrSegment> segs, QrCode.Ecc ecl,
   *         int minVersion=1, int maxVersion=40, mask=-1, boostEcl=true) -> QrCode
   *   - Constants int MIN_VERSION, MAX_VERSION
   *   - Constructor QrCode(int version, QrCode.Ecc ecl, list<byte> dataCodewords, int mask)
   *   - Fields int version, size, mask
   *   - Field QrCode.Ecc errorCorrectionLevel
   *   - Method getModule(int x, int y) -> bool
   *   - Method drawCanvas(int scale, int border, HTMLCanvasElement canvas) -> void
   *   - Method toSvgString(int border) -> str
   *   - Enum Ecc:
   *     - Constants LOW, MEDIUM, QUARTILE, HIGH
   *     - Field int ordinal
   * - Class QrSegment:
   *   - Function makeBytes(list<byte> data) -> QrSegment
   *   - Function makeNumeric(str data) -> QrSegment
   *   - Function makeAlphanumeric(str data) -> QrSegment
   *   - Function makeSegments(str text) -> list<QrSegment>
   *   - Function makeEci(int assignVal) -> QrSegment
   *   - Constructor QrSegment(QrSegment.Mode mode, int numChars, list<int> bitData)
   *   - Field QrSegment.Mode mode
   *   - Field int numChars
   *   - Method getData() -> list<int>
   *   - Constants RegExp NUMERIC_REGEX, ALPHANUMERIC_REGEX
   *   - Enum Mode:
   *     - Constants NUMERIC, ALPHANUMERIC, BYTE, KANJI, ECI
   */
  var qrcodegen = new function() {
  	
  	/*---- QR Code symbol class ----*/
  	
  	/* 
  	 * A class that represents a QR Code symbol, which is a type of two-dimension barcode.
  	 * Invented by Denso Wave and described in the ISO/IEC 18004 standard.
  	 * Instances of this class represent an immutable square grid of black and white cells.
  	 * The class provides static factory functions to create a QR Code from text or binary data.
  	 * The class covers the QR Code Model 2 specification, supporting all versions (sizes)
  	 * from 1 to 40, all 4 error correction levels, and 4 character encoding modes.
  	 * 
  	 * Ways to create a QR Code object:
  	 * - High level: Take the payload data and call QrCode.encodeText() or QrCode.encodeBinary().
  	 * - Mid level: Custom-make the list of segments and call QrCode.encodeSegments().
  	 * - Low level: Custom-make the array of data codeword bytes (including
  	 *   segment headers and final padding, excluding error correction codewords),
  	 *   supply the appropriate version number, and call the QrCode() constructor.
  	 * (Note that all ways require supplying the desired error correction level.)
  	 * 
  	 * This constructor creates a new QR Code with the given version number,
  	 * error correction level, data codeword bytes, and mask number.
  	 * This is a low-level API that most users should not use directly.
  	 * A mid-level API is the encodeSegments() function.
  	 */
  	this.QrCode = function(version, errCorLvl, dataCodewords, mask) {
  		
  		/*---- Constructor (low level) ----*/
  		
  		// Check scalar arguments
  		if (version < MIN_VERSION || version > MAX_VERSION)
  			throw "Version value out of range";
  		if (mask < -1 || mask > 7)
  			throw "Mask value out of range";
  		if (!(errCorLvl instanceof Ecc))
  			throw "QrCode.Ecc expected";
  		var size = version * 4 + 17;
  		
  		// Initialize both grids to be size*size arrays of Boolean false
  		var row = [];
  		for (var i = 0; i < size; i++)
  			row.push(false);
  		var modules    = [];  // Initially all white
  		var isFunction = [];
  		for (var i = 0; i < size; i++) {
  			modules   .push(row.slice());
  			isFunction.push(row.slice());
  		}
  		
  		// Compute ECC, draw modules
  		drawFunctionPatterns();
  		var allCodewords = addEccAndInterleave(dataCodewords);
  		drawCodewords(allCodewords);
  		
  		// Do masking
  		if (mask == -1) {  // Automatically choose best mask
  			var minPenalty = Infinity;
  			for (var i = 0; i < 8; i++) {
  				applyMask(i);
  				drawFormatBits(i);
  				var penalty = getPenaltyScore();
  				if (penalty < minPenalty) {
  					mask = i;
  					minPenalty = penalty;
  				}
  				applyMask(i);  // Undoes the mask due to XOR
  			}
  		}
  		if (mask < 0 || mask > 7)
  			throw "Assertion error";
  		applyMask(mask);  // Apply the final choice of mask
  		drawFormatBits(mask);  // Overwrite old format bits
  		
  		isFunction = null;
  		
  		
  		/*---- Read-only instance properties ----*/
  		
  		// The version number of this QR Code, which is between 1 and 40 (inclusive).
  		// This determines the size of this barcode.
  		Object.defineProperty(this, "version", {value:version});
  		
  		// The width and height of this QR Code, measured in modules, between
  		// 21 and 177 (inclusive). This is equal to version * 4 + 17.
  		Object.defineProperty(this, "size", {value:size});
  		
  		// The error correction level used in this QR Code.
  		Object.defineProperty(this, "errorCorrectionLevel", {value:errCorLvl});
  		
  		// The index of the mask pattern used in this QR Code, which is between 0 and 7 (inclusive).
  		// Even if a QR Code is created with automatic masking requested (mask = -1),
  		// the resulting object still has a mask value between 0 and 7.
  		Object.defineProperty(this, "mask", {value:mask});
  		
  		
  		/*---- Accessor methods ----*/
  		
  		// Returns the color of the module (pixel) at the given coordinates, which is false
  		// for white or true for black. The top left corner has the coordinates (x=0, y=0).
  		// If the given coordinates are out of bounds, then false (white) is returned.
  		this.getModule = function(x, y) {
  			return 0 <= x && x < size && 0 <= y && y < size && modules[y][x];
  		};

      this.getModules = function () { return modules; };
  		
  		
  		/*---- Public instance methods ----*/
  		
  		// Draws this QR Code, with the given module scale and border modules, onto the given HTML
  		// canvas element. The canvas's width and height is resized to (this.size + border * 2) * scale.
  		// The drawn image is be purely black and white, and fully opaque.
  		// The scale must be a positive integer and the border must be a non-negative integer.
  		this.drawCanvas = function(scale, border, canvas) {
  			if (scale <= 0 || border < 0)
  				throw "Value out of range";
  			var width = (size + border * 2) * scale;
        if (canvas.width != width) {
            canvas.width = width;
            canvas.height = width;
        }      var ctx = canvas.getContext("2d");
  			for (var y = -border; y < size + border; y++) {
  				for (var x = -border; x < size + border; x++) {
  					ctx.fillStyle = this.getModule(x, y) ? "#000000" : "#FFFFFF";
  					ctx.fillRect((x + border) * scale, (y + border) * scale, scale, scale);
  				}
  			}
  		};
  		
  		// Returns a string of SVG code for an image depicting this QR Code, with the given number
  		// of border modules. The string always uses Unix newlines (\n), regardless of the platform.
  		this.toSvgString = function(border) {
  			if (border < 0)
  				throw "Border must be non-negative";
  			var parts = [];
  			for (var y = 0; y < size; y++) {
  				for (var x = 0; x < size; x++) {
  					if (this.getModule(x, y))
  						parts.push("M" + (x + border) + "," + (y + border) + "h1v1h-1z");
  				}
  			}
  			return '<?xml version="1.0" encoding="UTF-8"?>\n' +
  				'<!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">\n' +
  				'<svg xmlns="http://www.w3.org/2000/svg" version="1.1" viewBox="0 0 ' +
  					(size + border * 2) + ' ' + (size + border * 2) + '" stroke="none">\n' +
  				'\t<rect width="100%" height="100%" fill="#FFFFFF"/>\n' +
  				'\t<path d="' + parts.join(" ") + '" fill="#000000"/>\n' +
  				'</svg>\n';
  		};
  		
  		
  		/*---- Private helper methods for constructor: Drawing function modules ----*/
  		
  		// Reads this object's version field, and draws and marks all function modules.
  		function drawFunctionPatterns() {
  			// Draw horizontal and vertical timing patterns
  			for (var i = 0; i < size; i++) {
  				setFunctionModule(6, i, i % 2 == 0);
  				setFunctionModule(i, 6, i % 2 == 0);
  			}
  			
  			// Draw 3 finder patterns (all corners except bottom right; overwrites some timing modules)
  			drawFinderPattern(3, 3);
  			drawFinderPattern(size - 4, 3);
  			drawFinderPattern(3, size - 4);
  			
  			// Draw numerous alignment patterns
  			var alignPatPos = getAlignmentPatternPositions();
  			var numAlign = alignPatPos.length;
  			for (var i = 0; i < numAlign; i++) {
  				for (var j = 0; j < numAlign; j++) {
  					// Don't draw on the three finder corners
  					if (!(i == 0 && j == 0 || i == 0 && j == numAlign - 1 || i == numAlign - 1 && j == 0))
  						drawAlignmentPattern(alignPatPos[i], alignPatPos[j]);
  				}
  			}
  			
  			// Draw configuration data
  			drawFormatBits(0);  // Dummy mask value; overwritten later in the constructor
  			drawVersion();
  		}
  		
  		
  		// Draws two copies of the format bits (with its own error correction code)
  		// based on the given mask and this object's error correction level field.
  		function drawFormatBits(mask) {
  			// Calculate error correction code and pack bits
  			var data = errCorLvl.formatBits << 3 | mask;  // errCorrLvl is uint2, mask is uint3
  			var rem = data;
  			for (var i = 0; i < 10; i++)
  				rem = (rem << 1) ^ ((rem >>> 9) * 0x537);
  			var bits = (data << 10 | rem) ^ 0x5412;  // uint15
  			if (bits >>> 15 != 0)
  				throw "Assertion error";
  			
  			// Draw first copy
  			for (var i = 0; i <= 5; i++)
  				setFunctionModule(8, i, getBit(bits, i));
  			setFunctionModule(8, 7, getBit(bits, 6));
  			setFunctionModule(8, 8, getBit(bits, 7));
  			setFunctionModule(7, 8, getBit(bits, 8));
  			for (var i = 9; i < 15; i++)
  				setFunctionModule(14 - i, 8, getBit(bits, i));
  			
  			// Draw second copy
  			for (var i = 0; i < 8; i++)
  				setFunctionModule(size - 1 - i, 8, getBit(bits, i));
  			for (var i = 8; i < 15; i++)
  				setFunctionModule(8, size - 15 + i, getBit(bits, i));
  			setFunctionModule(8, size - 8, true);  // Always black
  		}
  		
  		
  		// Draws two copies of the version bits (with its own error correction code),
  		// based on this object's version field, iff 7 <= version <= 40.
  		function drawVersion() {
  			if (version < 7)
  				return;
  			
  			// Calculate error correction code and pack bits
  			var rem = version;  // version is uint6, in the range [7, 40]
  			for (var i = 0; i < 12; i++)
  				rem = (rem << 1) ^ ((rem >>> 11) * 0x1F25);
  			var bits = version << 12 | rem;  // uint18
  			if (bits >>> 18 != 0)
  				throw "Assertion error";
  			
  			// Draw two copies
  			for (var i = 0; i < 18; i++) {
  				var bit = getBit(bits, i);
  				var a = size - 11 + i % 3;
  				var b = Math.floor(i / 3);
  				setFunctionModule(a, b, bit);
  				setFunctionModule(b, a, bit);
  			}
  		}
  		
  		
  		// Draws a 9*9 finder pattern including the border separator,
  		// with the center module at (x, y). Modules can be out of bounds.
  		function drawFinderPattern(x, y) {
  			for (var dy = -4; dy <= 4; dy++) {
  				for (var dx = -4; dx <= 4; dx++) {
  					var dist = Math.max(Math.abs(dx), Math.abs(dy));  // Chebyshev/infinity norm
  					var xx = x + dx, yy = y + dy;
  					if (0 <= xx && xx < size && 0 <= yy && yy < size)
  						setFunctionModule(xx, yy, dist != 2 && dist != 4);
  				}
  			}
  		}
  		
  		
  		// Draws a 5*5 alignment pattern, with the center module
  		// at (x, y). All modules must be in bounds.
  		function drawAlignmentPattern(x, y) {
  			for (var dy = -2; dy <= 2; dy++) {
  				for (var dx = -2; dx <= 2; dx++)
  					setFunctionModule(x + dx, y + dy, Math.max(Math.abs(dx), Math.abs(dy)) != 1);
  			}
  		}
  		
  		
  		// Sets the color of a module and marks it as a function module.
  		// Only used by the constructor. Coordinates must be in bounds.
  		function setFunctionModule(x, y, isBlack) {
  			modules[y][x] = isBlack;
  			isFunction[y][x] = true;
  		}
  		
  		
  		/*---- Private helper methods for constructor: Codewords and masking ----*/
  		
  		// Returns a new byte string representing the given data with the appropriate error correction
  		// codewords appended to it, based on this object's version and error correction level.
  		function addEccAndInterleave(data) {
  			if (data.length != QrCode.getNumDataCodewords(version, errCorLvl))
  				throw "Invalid argument";
  			
  			// Calculate parameter numbers
  			var numBlocks = QrCode.NUM_ERROR_CORRECTION_BLOCKS[errCorLvl.ordinal][version];
  			var blockEccLen = QrCode.ECC_CODEWORDS_PER_BLOCK  [errCorLvl.ordinal][version];
  			var rawCodewords = Math.floor(QrCode.getNumRawDataModules(version) / 8);
  			var numShortBlocks = numBlocks - rawCodewords % numBlocks;
  			var shortBlockLen = Math.floor(rawCodewords / numBlocks);
  			
  			// Split data into blocks and append ECC to each block
  			var blocks = [];
  			var rs = new ReedSolomonGenerator(blockEccLen);
  			for (var i = 0, k = 0; i < numBlocks; i++) {
  				var dat = data.slice(k, k + shortBlockLen - blockEccLen + (i < numShortBlocks ? 0 : 1));
  				k += dat.length;
  				var ecc = rs.getRemainder(dat);
  				if (i < numShortBlocks)
  					dat.push(0);
  				blocks.push(dat.concat(ecc));
  			}
  			
  			// Interleave (not concatenate) the bytes from every block into a single sequence
  			var result = [];
  			for (var i = 0; i < blocks[0].length; i++) {
  				for (var j = 0; j < blocks.length; j++) {
  					// Skip the padding byte in short blocks
  					if (i != shortBlockLen - blockEccLen || j >= numShortBlocks)
  						result.push(blocks[j][i]);
  				}
  			}
  			if (result.length != rawCodewords)
  				throw "Assertion error";
  			return result;
  		}
  		
  		
  		// Draws the given sequence of 8-bit codewords (data and error correction) onto the entire
  		// data area of this QR Code. Function modules need to be marked off before this is called.
  		function drawCodewords(data) {
  			if (data.length != Math.floor(QrCode.getNumRawDataModules(version) / 8))
  				throw "Invalid argument";
  			var i = 0;  // Bit index into the data
  			// Do the funny zigzag scan
  			for (var right = size - 1; right >= 1; right -= 2) {  // Index of right column in each column pair
  				if (right == 6)
  					right = 5;
  				for (var vert = 0; vert < size; vert++) {  // Vertical counter
  					for (var j = 0; j < 2; j++) {
  						var x = right - j;  // Actual x coordinate
  						var upward = ((right + 1) & 2) == 0;
  						var y = upward ? size - 1 - vert : vert;  // Actual y coordinate
  						if (!isFunction[y][x] && i < data.length * 8) {
  							modules[y][x] = getBit(data[i >>> 3], 7 - (i & 7));
  							i++;
  						}
  						// If this QR Code has any remainder bits (0 to 7), they were assigned as
  						// 0/false/white by the constructor and are left unchanged by this method
  					}
  				}
  			}
  			if (i != data.length * 8)
  				throw "Assertion error";
  		}
  		
  		
  		// XORs the codeword modules in this QR Code with the given mask pattern.
  		// The function modules must be marked and the codeword bits must be drawn
  		// before masking. Due to the arithmetic of XOR, calling applyMask() with
  		// the same mask value a second time will undo the mask. A final well-formed
  		// QR Code needs exactly one (not zero, two, etc.) mask applied.
  		function applyMask(mask) {
  			if (mask < 0 || mask > 7)
  				throw "Mask value out of range";
  			for (var y = 0; y < size; y++) {
  				for (var x = 0; x < size; x++) {
  					var invert;
  					switch (mask) {
  						case 0:  invert = (x + y) % 2 == 0;                                  break;
  						case 1:  invert = y % 2 == 0;                                        break;
  						case 2:  invert = x % 3 == 0;                                        break;
  						case 3:  invert = (x + y) % 3 == 0;                                  break;
  						case 4:  invert = (Math.floor(x / 3) + Math.floor(y / 2)) % 2 == 0;  break;
  						case 5:  invert = x * y % 2 + x * y % 3 == 0;                        break;
  						case 6:  invert = (x * y % 2 + x * y % 3) % 2 == 0;                  break;
  						case 7:  invert = ((x + y) % 2 + x * y % 3) % 2 == 0;                break;
  						default:  throw "Assertion error";
  					}
  					if (!isFunction[y][x] && invert)
  						modules[y][x] = !modules[y][x];
  				}
  			}
  		}
  		
  		
  		// Calculates and returns the penalty score based on state of this QR Code's current modules.
  		// This is used by the automatic mask choice algorithm to find the mask pattern that yields the lowest score.
  		function getPenaltyScore() {
  			var result = 0;
  			
  			// Adjacent modules in row having same color, and finder-like patterns
  			for (var y = 0; y < size; y++) {
  				var runHistory = [0,0,0,0,0,0,0];
  				var color = false;
  				var runX = 0;
  				for (var x = 0; x < size; x++) {
  					if (modules[y][x] == color) {
  						runX++;
  						if (runX == 5)
  							result += QrCode.PENALTY_N1;
  						else if (runX > 5)
  							result++;
  					} else {
  						QrCode.addRunToHistory(runX, runHistory);
  						if (!color && QrCode.hasFinderLikePattern(runHistory))
  							result += QrCode.PENALTY_N3;
  						color = modules[y][x];
  						runX = 1;
  					}
  				}
  				QrCode.addRunToHistory(runX, runHistory);
  				if (color)
  					QrCode.addRunToHistory(0, runHistory);  // Dummy run of white
  				if (QrCode.hasFinderLikePattern(runHistory))
  					result += QrCode.PENALTY_N3;
  			}
  			// Adjacent modules in column having same color, and finder-like patterns
  			for (var x = 0; x < size; x++) {
  				var runHistory = [0,0,0,0,0,0,0];
  				var color = false;
  				var runY = 0;
  				for (var y = 0; y < size; y++) {
  					if (modules[y][x] == color) {
  						runY++;
  						if (runY == 5)
  							result += QrCode.PENALTY_N1;
  						else if (runY > 5)
  							result++;
  					} else {
  						QrCode.addRunToHistory(runY, runHistory);
  						if (!color && QrCode.hasFinderLikePattern(runHistory))
  							result += QrCode.PENALTY_N3;
  						color = modules[y][x];
  						runY = 1;
  					}
  				}
  				QrCode.addRunToHistory(runY, runHistory);
  				if (color)
  					QrCode.addRunToHistory(0, runHistory);  // Dummy run of white
  				if (QrCode.hasFinderLikePattern(runHistory))
  					result += QrCode.PENALTY_N3;
  			}
  			
  			// 2*2 blocks of modules having same color
  			for (var y = 0; y < size - 1; y++) {
  				for (var x = 0; x < size - 1; x++) {
  					var   color = modules[y][x];
  					if (  color == modules[y][x + 1] &&
  					      color == modules[y + 1][x] &&
  					      color == modules[y + 1][x + 1])
  						result += QrCode.PENALTY_N2;
  				}
  			}
  			
  			// Balance of black and white modules
  			var black = 0;
  			modules.forEach(function(row) {
  				row.forEach(function(color) {
  					if (color)
  						black++;
  				});
  			});
  			var total = size * size;  // Note that size is odd, so black/total != 1/2
  			// Compute the smallest integer k >= 0 such that (45-5k)% <= black/total <= (55+5k)%
  			var k = Math.ceil(Math.abs(black * 20 - total * 10) / total) - 1;
  			result += k * QrCode.PENALTY_N4;
  			return result;
  		}
  		
  		
  		// Returns an ascending list of positions of alignment patterns for this version number.
  		// Each position is in the range [0,177), and are used on both the x and y axes.
  		// This could be implemented as lookup table of 40 variable-length lists of integers.
  		function getAlignmentPatternPositions() {
  			if (version == 1)
  				return [];
  			else {
  				var numAlign = Math.floor(version / 7) + 2;
  				var step = (version == 32) ? 26 :
  					Math.ceil((size - 13) / (numAlign*2 - 2)) * 2;
  				var result = [6];
  				for (var pos = size - 7; result.length < numAlign; pos -= step)
  					result.splice(1, 0, pos);
  				return result;
  			}
  		}
  		
  		
  		// Returns true iff the i'th bit of x is set to 1.
  		function getBit(x, i) {
  			return ((x >>> i) & 1) != 0;
  		}
  	};
  	
  	
  	/*---- Static factory functions (high level) for QrCode ----*/
  	
  	/* 
  	 * Returns a QR Code representing the given Unicode text string at the given error correction level.
  	 * As a conservative upper bound, this function is guaranteed to succeed for strings that have 738 or fewer
  	 * Unicode code points (not UTF-16 code units) if the low error correction level is used. The smallest possible
  	 * QR Code version is automatically chosen for the output. The ECC level of the result may be higher than the
  	 * ecl argument if it can be done without increasing the version.
  	 */
  	this.QrCode.encodeText = function(text, ecl) {
  		var segs = qrcodegen.QrSegment.makeSegments(text);
  		return this.encodeSegments(segs, ecl);
  	};
  	
  	
  	/* 
  	 * Returns a QR Code representing the given binary data at the given error correction level.
  	 * This function always encodes using the binary segment mode, not any text mode. The maximum number of
  	 * bytes allowed is 2953. The smallest possible QR Code version is automatically chosen for the output.
  	 * The ECC level of the result may be higher than the ecl argument if it can be done without increasing the version.
  	 */
  	this.QrCode.encodeBinary = function(data, ecl) {
  		var seg = qrcodegen.QrSegment.makeBytes(data);
  		return this.encodeSegments([seg], ecl);
  	};
  	
  	
  	/*---- Static factory functions (mid level) for QrCode ----*/
  	
  	/* 
  	 * Returns a QR Code representing the given segments with the given encoding parameters.
  	 * The smallest possible QR Code version within the given range is automatically
  	 * chosen for the output. Iff boostEcl is true, then the ECC level of the result
  	 * may be higher than the ecl argument if it can be done without increasing the
  	 * version. The mask number is either between 0 to 7 (inclusive) to force that
  	 * mask, or -1 to automatically choose an appropriate mask (which may be slow).
  	 * This function allows the user to create a custom sequence of segments that switches
  	 * between modes (such as alphanumeric and byte) to encode text in less space.
  	 * This is a mid-level API; the high-level API is encodeText() and encodeBinary().
  	 */
  	this.QrCode.encodeSegments = function(segs, ecl, minVersion, maxVersion, mask, boostEcl) {
  		if (minVersion == undefined) minVersion = MIN_VERSION;
  		if (maxVersion == undefined) maxVersion = MAX_VERSION;
  		if (mask == undefined) mask = -1;
  		if (boostEcl == undefined) boostEcl = true;
  		if (!(MIN_VERSION <= minVersion && minVersion <= maxVersion && maxVersion <= MAX_VERSION) || mask < -1 || mask > 7)
  			throw "Invalid value";
  		
  		// Find the minimal version number to use
  		var version, dataUsedBits;
  		for (version = minVersion; ; version++) {
  			var dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;  // Number of data bits available
  			dataUsedBits = qrcodegen.QrSegment.getTotalBits(segs, version);
  			if (dataUsedBits <= dataCapacityBits)
  				break;  // This version number is found to be suitable
  			if (version >= maxVersion)  // All versions in the range could not fit the given data
  				throw "Data too long";
  		}
  		
  		// Increase the error correction level while the data still fits in the current version number
  		[this.Ecc.MEDIUM, this.Ecc.QUARTILE, this.Ecc.HIGH].forEach(function(newEcl) {  // From low to high
  			if (boostEcl && dataUsedBits <= QrCode.getNumDataCodewords(version, newEcl) * 8)
  				ecl = newEcl;
  		});
  		
  		// Concatenate all segments to create the data bit string
  		var bb = new BitBuffer();
  		segs.forEach(function(seg) {
  			bb.appendBits(seg.mode.modeBits, 4);
  			bb.appendBits(seg.numChars, seg.mode.numCharCountBits(version));
  			seg.getData().forEach(function(bit) {
  				bb.push(bit);
  			});
  		});
  		if (bb.length != dataUsedBits)
  			throw "Assertion error";
  		
  		// Add terminator and pad up to a byte if applicable
  		var dataCapacityBits = QrCode.getNumDataCodewords(version, ecl) * 8;
  		if (bb.length > dataCapacityBits)
  			throw "Assertion error";
  		bb.appendBits(0, Math.min(4, dataCapacityBits - bb.length));
  		bb.appendBits(0, (8 - bb.length % 8) % 8);
  		if (bb.length % 8 != 0)
  			throw "Assertion error";
  		
  		// Pad with alternating bytes until data capacity is reached
  		for (var padByte = 0xEC; bb.length < dataCapacityBits; padByte ^= 0xEC ^ 0x11)
  			bb.appendBits(padByte, 8);
  		
  		// Pack bits into bytes in big endian
  		var dataCodewords = [];
  		while (dataCodewords.length * 8 < bb.length)
  			dataCodewords.push(0);
  		bb.forEach(function(bit, i) {
  			dataCodewords[i >>> 3] |= bit << (7 - (i & 7));
  		});
  		
  		// Create the QR Code object
  		return new this(version, ecl, dataCodewords, mask);
  	};
  	
  	
  	/*---- Private static helper functions for QrCode ----*/
  	
  	var QrCode = {};  // Private object to assign properties to. Not the same object as 'this.QrCode'.
  	
  	
  	// Returns the number of data bits that can be stored in a QR Code of the given version number, after
  	// all function modules are excluded. This includes remainder bits, so it might not be a multiple of 8.
  	// The result is in the range [208, 29648]. This could be implemented as a 40-entry lookup table.
  	QrCode.getNumRawDataModules = function(ver) {
  		if (ver < MIN_VERSION || ver > MAX_VERSION)
  			throw "Version number out of range";
  		var result = (16 * ver + 128) * ver + 64;
  		if (ver >= 2) {
  			var numAlign = Math.floor(ver / 7) + 2;
  			result -= (25 * numAlign - 10) * numAlign - 55;
  			if (ver >= 7)
  				result -= 36;
  		}
  		return result;
  	};
  	
  	
  	// Returns the number of 8-bit data (i.e. not error correction) codewords contained in any
  	// QR Code of the given version number and error correction level, with remainder bits discarded.
  	// This stateless pure function could be implemented as a (40*4)-cell lookup table.
  	QrCode.getNumDataCodewords = function(ver, ecl) {
  		return Math.floor(QrCode.getNumRawDataModules(ver) / 8) -
  			QrCode.ECC_CODEWORDS_PER_BLOCK    [ecl.ordinal][ver] *
  			QrCode.NUM_ERROR_CORRECTION_BLOCKS[ecl.ordinal][ver];
  	};
  	
  	
  	// Inserts the given value to the front of the given array, which shifts over the
  	// existing values and deletes the last value. A helper function for getPenaltyScore().
  	QrCode.addRunToHistory = function(run, history) {
  		history.pop();
  		history.unshift(run);
  	};
  	
  	
  	// Tests whether the given run history has the pattern of ratio 1:1:3:1:1 in the middle, and
  	// surrounded by at least 4 on either or both ends. A helper function for getPenaltyScore().
  	// Must only be called immediately after a run of white modules has ended.
  	QrCode.hasFinderLikePattern = function(runHistory) {
  		var n = runHistory[1];
  		return n > 0 && runHistory[2] == n && runHistory[4] == n && runHistory[5] == n
  			&& runHistory[3] == n * 3 && Math.max(runHistory[0], runHistory[6]) >= n * 4;
  	};
  	
  	
  	/*---- Constants and tables for QrCode ----*/
  	
  	var MIN_VERSION =  1;  // The minimum version number supported in the QR Code Model 2 standard
  	var MAX_VERSION = 40;  // The maximum version number supported in the QR Code Model 2 standard
  	Object.defineProperty(this.QrCode, "MIN_VERSION", {value:MIN_VERSION});
  	Object.defineProperty(this.QrCode, "MAX_VERSION", {value:MAX_VERSION});
  	
  	// For use in getPenaltyScore(), when evaluating which mask is best.
  	QrCode.PENALTY_N1 =  3;
  	QrCode.PENALTY_N2 =  3;
  	QrCode.PENALTY_N3 = 40;
  	QrCode.PENALTY_N4 = 10;
  	
  	QrCode.ECC_CODEWORDS_PER_BLOCK = [
  		// Version: (note that index 0 is for padding, and is set to an illegal value)
  		//  0,  1,  2,  3,  4,  5,  6,  7,  8,  9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  		[null,  7, 10, 15, 20, 26, 18, 20, 24, 30, 18, 20, 24, 26, 30, 22, 24, 28, 30, 28, 28, 28, 28, 30, 30, 26, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Low
  		[null, 10, 16, 26, 18, 24, 16, 18, 22, 22, 26, 30, 22, 22, 24, 24, 28, 28, 26, 26, 26, 26, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28, 28],  // Medium
  		[null, 13, 22, 18, 26, 18, 24, 18, 22, 20, 24, 28, 26, 24, 20, 30, 24, 28, 28, 26, 30, 28, 30, 30, 30, 30, 28, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // Quartile
  		[null, 17, 28, 22, 16, 22, 28, 26, 26, 24, 28, 24, 28, 22, 24, 24, 30, 28, 28, 26, 28, 30, 24, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30],  // High
  	];
  	
  	QrCode.NUM_ERROR_CORRECTION_BLOCKS = [
  		// Version: (note that index 0 is for padding, and is set to an illegal value)
  		//  0, 1, 2, 3, 4, 5, 6, 7, 8, 9,10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 39, 40    Error correction level
  		[null, 1, 1, 1, 1, 1, 2, 2, 2, 2, 4,  4,  4,  4,  4,  6,  6,  6,  6,  7,  8,  8,  9,  9, 10, 12, 12, 12, 13, 14, 15, 16, 17, 18, 19, 19, 20, 21, 22, 24, 25],  // Low
  		[null, 1, 1, 1, 2, 2, 4, 4, 4, 5, 5,  5,  8,  9,  9, 10, 10, 11, 13, 14, 16, 17, 17, 18, 20, 21, 23, 25, 26, 28, 29, 31, 33, 35, 37, 38, 40, 43, 45, 47, 49],  // Medium
  		[null, 1, 1, 2, 2, 4, 4, 6, 6, 8, 8,  8, 10, 12, 16, 12, 17, 16, 18, 21, 20, 23, 23, 25, 27, 29, 34, 34, 35, 38, 40, 43, 45, 48, 51, 53, 56, 59, 62, 65, 68],  // Quartile
  		[null, 1, 1, 2, 4, 4, 4, 5, 6, 8, 8, 11, 11, 16, 16, 18, 16, 19, 21, 25, 25, 25, 34, 30, 32, 35, 37, 40, 42, 45, 48, 51, 54, 57, 60, 63, 66, 70, 74, 77, 81],  // High
  	];
  	
  	
  	/*---- Public helper enumeration ----*/
  	
  	/* 
  	 * The error correction level in a QR Code symbol. Immutable.
  	 */
  	this.QrCode.Ecc = {
  		LOW     : new Ecc(0, 1),  // The QR Code can tolerate about  7% erroneous codewords
  		MEDIUM  : new Ecc(1, 0),  // The QR Code can tolerate about 15% erroneous codewords
  		QUARTILE: new Ecc(2, 3),  // The QR Code can tolerate about 25% erroneous codewords
  		HIGH    : new Ecc(3, 2),  // The QR Code can tolerate about 30% erroneous codewords
  	};
  	
  	
  	// Private constructor.
  	function Ecc(ord, fb) {
  		// (Public) In the range 0 to 3 (unsigned 2-bit integer)
  		Object.defineProperty(this, "ordinal", {value:ord});
  		
  		// (Package-private) In the range 0 to 3 (unsigned 2-bit integer)
  		Object.defineProperty(this, "formatBits", {value:fb});
  	}
  	
  	
  	
  	/*---- Data segment class ----*/
  	
  	/* 
  	 * A segment of character/binary/control data in a QR Code symbol.
  	 * Instances of this class are immutable.
  	 * The mid-level way to create a segment is to take the payload data
  	 * and call a static factory function such as QrSegment.makeNumeric().
  	 * The low-level way to create a segment is to custom-make the bit buffer
  	 * and call the QrSegment() constructor with appropriate values.
  	 * This segment class imposes no length restrictions, but QR Codes have restrictions.
  	 * Even in the most favorable conditions, a QR Code can only hold 7089 characters of data.
  	 * Any segment longer than this is meaningless for the purpose of generating QR Codes.
  	 * This constructor creates a QR Code segment with the given attributes and data.
  	 * The character count (numChars) must agree with the mode and the bit buffer length,
  	 * but the constraint isn't checked. The given bit buffer is cloned and stored.
  	 */
  	this.QrSegment = function(mode, numChars, bitData) {
  		/*---- Constructor (low level) ----*/
  		if (numChars < 0 || !(mode instanceof Mode))
  			throw "Invalid argument";
  		
  		// The data bits of this segment. Accessed through getData().
  		bitData = bitData.slice();  // Make defensive copy
  		
  		// The mode indicator of this segment.
  		Object.defineProperty(this, "mode", {value:mode});
  		
  		// The length of this segment's unencoded data. Measured in characters for
  		// numeric/alphanumeric/kanji mode, bytes for byte mode, and 0 for ECI mode.
  		// Always zero or positive. Not the same as the data's bit length.
  		Object.defineProperty(this, "numChars", {value:numChars});
  		
  		// Returns a new copy of the data bits of this segment.
  		this.getData = function() {
  			return bitData.slice();  // Make defensive copy
  		};
  	};
  	
  	
  	/*---- Static factory functions (mid level) for QrSegment ----*/
  	
  	/* 
  	 * Returns a segment representing the given binary data encoded in
  	 * byte mode. All input byte arrays are acceptable. Any text string
  	 * can be converted to UTF-8 bytes and encoded as a byte mode segment.
  	 */
  	this.QrSegment.makeBytes = function(data) {
  		var bb = new BitBuffer();
  		data.forEach(function(b) {
  			bb.appendBits(b, 8);
  		});
  		return new this(this.Mode.BYTE, data.length, bb);
  	};
  	
  	
  	/* 
  	 * Returns a segment representing the given string of decimal digits encoded in numeric mode.
  	 */
  	this.QrSegment.makeNumeric = function(digits) {
  		if (!this.NUMERIC_REGEX.test(digits))
  			throw "String contains non-numeric characters";
  		var bb = new BitBuffer();
  		for (var i = 0; i < digits.length; ) {  // Consume up to 3 digits per iteration
  			var n = Math.min(digits.length - i, 3);
  			bb.appendBits(parseInt(digits.substring(i, i + n), 10), n * 3 + 1);
  			i += n;
  		}
  		return new this(this.Mode.NUMERIC, digits.length, bb);
  	};
  	
  	
  	/* 
  	 * Returns a segment representing the given text string encoded in alphanumeric mode.
  	 * The characters allowed are: 0 to 9, A to Z (uppercase only), space,
  	 * dollar, percent, asterisk, plus, hyphen, period, slash, colon.
  	 */
  	this.QrSegment.makeAlphanumeric = function(text) {
  		if (!this.ALPHANUMERIC_REGEX.test(text))
  			throw "String contains unencodable characters in alphanumeric mode";
  		var bb = new BitBuffer();
  		var i;
  		for (i = 0; i + 2 <= text.length; i += 2) {  // Process groups of 2
  			var temp = QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)) * 45;
  			temp += QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i + 1));
  			bb.appendBits(temp, 11);
  		}
  		if (i < text.length)  // 1 character remaining
  			bb.appendBits(QrSegment.ALPHANUMERIC_CHARSET.indexOf(text.charAt(i)), 6);
  		return new this(this.Mode.ALPHANUMERIC, text.length, bb);
  	};
  	
  	
  	/* 
  	 * Returns a new mutable list of zero or more segments to represent the given Unicode text string.
  	 * The result may use various segment modes and switch modes to optimize the length of the bit stream.
  	 */
  	this.QrSegment.makeSegments = function(text) {
  		// Select the most efficient segment encoding automatically
  		if (text == "")
  			return [];
  		else if (this.NUMERIC_REGEX.test(text))
  			return [this.makeNumeric(text)];
  		else if (this.ALPHANUMERIC_REGEX.test(text))
  			return [this.makeAlphanumeric(text)];
  		else
  			return [this.makeBytes(toUtf8ByteArray(text))];
  	};
  	
  	
  	/* 
  	 * Returns a segment representing an Extended Channel Interpretation
  	 * (ECI) designator with the given assignment value.
  	 */
  	this.QrSegment.makeEci = function(assignVal) {
  		var bb = new BitBuffer();
  		if (assignVal < 0)
  			throw "ECI assignment value out of range";
  		else if (assignVal < (1 << 7))
  			bb.appendBits(assignVal, 8);
  		else if (assignVal < (1 << 14)) {
  			bb.appendBits(2, 2);
  			bb.appendBits(assignVal, 14);
  		} else if (assignVal < 1000000) {
  			bb.appendBits(6, 3);
  			bb.appendBits(assignVal, 21);
  		} else
  			throw "ECI assignment value out of range";
  		return new this(this.Mode.ECI, 0, bb);
  	};
  	
  	
  	// (Package-private) Calculates and returns the number of bits needed to encode the given segments at the
  	// given version. The result is infinity if a segment has too many characters to fit its length field.
  	this.QrSegment.getTotalBits = function(segs, version) {
  		var result = 0;
  		for (var i = 0; i < segs.length; i++) {
  			var seg = segs[i];
  			var ccbits = seg.mode.numCharCountBits(version);
  			if (seg.numChars >= (1 << ccbits))
  				return Infinity;  // The segment's length doesn't fit the field's bit width
  			result += 4 + ccbits + seg.getData().length;
  		}
  		return result;
  	};
  	
  	
  	/*---- Constants for QrSegment ----*/
  	
  	var QrSegment = {};  // Private object to assign properties to. Not the same object as 'this.QrSegment'.
  	
  	// (Public) Describes precisely all strings that are encodable in numeric mode.
  	// To test whether a string s is encodable: var ok = NUMERIC_REGEX.test(s);
  	// A string is encodable iff each character is in the range 0 to 9.
  	this.QrSegment.NUMERIC_REGEX = /^[0-9]*$/;
  	
  	// (Public) Describes precisely all strings that are encodable in alphanumeric mode.
  	// To test whether a string s is encodable: var ok = ALPHANUMERIC_REGEX.test(s);
  	// A string is encodable iff each character is in the following set: 0 to 9, A to Z
  	// (uppercase only), space, dollar, percent, asterisk, plus, hyphen, period, slash, colon.
  	this.QrSegment.ALPHANUMERIC_REGEX = /^[A-Z0-9 $%*+.\/:-]*$/;
  	
  	// (Private) The set of all legal characters in alphanumeric mode,
  	// where each character value maps to the index in the string.
  	QrSegment.ALPHANUMERIC_CHARSET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ $%*+-./:";
  	
  	
  	/*---- Public helper enumeration ----*/
  	
  	/* 
  	 * Describes how a segment's data bits are interpreted. Immutable.
  	 */
  	this.QrSegment.Mode = {  // Constants
  		NUMERIC     : new Mode(0x1, [10, 12, 14]),
  		ALPHANUMERIC: new Mode(0x2, [ 9, 11, 13]),
  		BYTE        : new Mode(0x4, [ 8, 16, 16]),
  		KANJI       : new Mode(0x8, [ 8, 10, 12]),
  		ECI         : new Mode(0x7, [ 0,  0,  0]),
  	};
  	
  	
  	// Private constructor.
  	function Mode(mode, ccbits) {
  		// (Package-private) The mode indicator bits, which is a uint4 value (range 0 to 15).
  		Object.defineProperty(this, "modeBits", {value:mode});
  		
  		// (Package-private) Returns the bit width of the character count field for a segment in
  		// this mode in a QR Code at the given version number. The result is in the range [0, 16].
  		this.numCharCountBits = function(ver) {
  			return ccbits[Math.floor((ver + 7) / 17)];
  		};
  	}
  	
  	
  	
  	/*---- Private helper functions and classes ----*/
  	
  	// Returns a new array of bytes representing the given string encoded in UTF-8.
  	function toUtf8ByteArray(str) {
  		str = encodeURI(str);
  		var result = [];
  		for (var i = 0; i < str.length; i++) {
  			if (str.charAt(i) != "%")
  				result.push(str.charCodeAt(i));
  			else {
  				result.push(parseInt(str.substring(i + 1, i + 3), 16));
  				i += 2;
  			}
  		}
  		return result;
  	}
  	
  	
  	
  	/* 
  	 * A private helper class that computes the Reed-Solomon error correction codewords for a sequence of
  	 * data codewords at a given degree. Objects are immutable, and the state only depends on the degree.
  	 * This class exists because each data block in a QR Code shares the same the divisor polynomial.
  	 * This constructor creates a Reed-Solomon ECC generator for the given degree. This could be implemented
  	 * as a lookup table over all possible parameter values, instead of as an algorithm.
  	 */
  	function ReedSolomonGenerator(degree) {
  		if (degree < 1 || degree > 255)
  			throw "Degree out of range";
  		
  		// Coefficients of the divisor polynomial, stored from highest to lowest power, excluding the leading term which
  		// is always 1. For example the polynomial x^3 + 255x^2 + 8x + 93 is stored as the uint8 array {255, 8, 93}.
  		var coefficients = [];
  		
  		// Start with the monomial x^0
  		for (var i = 0; i < degree - 1; i++)
  			coefficients.push(0);
  		coefficients.push(1);
  		
  		// Compute the product polynomial (x - r^0) * (x - r^1) * (x - r^2) * ... * (x - r^{degree-1}),
  		// drop the highest term, and store the rest of the coefficients in order of descending powers.
  		// Note that r = 0x02, which is a generator element of this field GF(2^8/0x11D).
  		var root = 1;
  		for (var i = 0; i < degree; i++) {
  			// Multiply the current product by (x - r^i)
  			for (var j = 0; j < coefficients.length; j++) {
  				coefficients[j] = ReedSolomonGenerator.multiply(coefficients[j], root);
  				if (j + 1 < coefficients.length)
  					coefficients[j] ^= coefficients[j + 1];
  			}
  			root = ReedSolomonGenerator.multiply(root, 0x02);
  		}
  		
  		// Computes and returns the Reed-Solomon error correction codewords for the given
  		// sequence of data codewords. The returned object is always a new byte array.
  		// This method does not alter this object's state (because it is immutable).
  		this.getRemainder = function(data) {
  			// Compute the remainder by performing polynomial division
  			var result = coefficients.map(function() { return 0; });
  			data.forEach(function(b) {
  				var factor = b ^ result.shift();
  				result.push(0);
  				coefficients.forEach(function(coef, i) {
  					result[i] ^= ReedSolomonGenerator.multiply(coef, factor);
  				});
  			});
  			return result;
  		};
  	}
  	
  	// This static function returns the product of the two given field elements modulo GF(2^8/0x11D). The arguments and
  	// result are unsigned 8-bit integers. This could be implemented as a lookup table of 256*256 entries of uint8.
  	ReedSolomonGenerator.multiply = function(x, y) {
  		if (x >>> 8 != 0 || y >>> 8 != 0)
  			throw "Byte out of range";
  		// Russian peasant multiplication
  		var z = 0;
  		for (var i = 7; i >= 0; i--) {
  			z = (z << 1) ^ ((z >>> 7) * 0x11D);
  			z ^= ((y >>> i) & 1) * x;
  		}
  		if (z >>> 8 != 0)
  			throw "Assertion error";
  		return z;
  	};
  	
  	
  	
  	/* 
  	 * A private helper class that represents an appendable sequence of bits (0s and 1s).
  	 * Mainly used by QrSegment. This constructor creates an empty bit buffer (length 0).
  	 */
  	function BitBuffer() {
  		Array.call(this);
  		
  		// Appends the given number of low-order bits of the given value
  		// to this buffer. Requires 0 <= len <= 31 and 0 <= val < 2^len.
  		this.appendBits = function(val, len) {
  			if (len < 0 || len > 31 || val >>> len != 0)
  				throw "Value out of range";
  		for (var i = len - 1; i >= 0; i--)  // Append bit by bit
  				this.push((val >>> i) & 1);
  		};
  	}
  	
  	BitBuffer.prototype = Object.create(Array.prototype);
  	BitBuffer.prototype.constructor = BitBuffer;
  	
  };

  function encodeText() {
      return qrcodegen.QrCode.encodeText.apply(qrcodegen.QrCode, arguments);
  }const Ecc = qrcodegen.QrCode.Ecc;

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  var low = Ecc.LOW;

  var medium = Ecc.MEDIUM;

  var quartile = Ecc.QUARTILE;

  var high = Ecc.HIGH;

  var Ecc$1 = /* module */[
    /* low */low,
    /* medium */medium,
    /* quartile */quartile,
    /* high */high
  ];

  function _encodeText(prim, prim$1) {
    return encodeText(prim, prim$1);
  }

  function encodeText$1(text, ecc) {
    var exit = 0;
    var code;
    try {
      code = encodeText(text, ecc);
      exit = 1;
    }
    catch (exn){
      return undefined;
    }
    if (exit === 1) {
      return some(code);
    }
    
  }

  var QrCode = /* module */[
    /* _encodeText */_encodeText,
    /* encodeText */encodeText$1
  ];
  /* low Not a pure module */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  function getPathString(code, border) {
    var size = code.size;
    var modules = code.getModules();
    var parts = /* array */[];
    for(var y = 0 ,y_finish = size - 1 | 0; y <= y_finish; ++y){
      for(var x = 0 ,x_finish = size - 1 | 0; x <= x_finish; ++x){
        if (caml_array_get(caml_array_get(modules, y), x)) {
          parts.push("M" + (String(x + border | 0) + ("," + (String(y + border | 0) + "h1v1h-1z"))));
        }
        
      }
    }
    return parts.join(" ");
  }

  var svgNs = "http://www.w3.org/2000/svg";

  function createQrCodePathElement(code, border) {
    var path = document.createElementNS(svgNs, "path");
    path.setAttribute("d", getPathString(code, border));
    return path;
  }

  function createRainbowGradient(param) {
    var gradient = document.createElementNS(svgNs, "linearGradient");
    gradient.id = "rainbow";
    for(var i = 0; i <= 7; ++i){
      var stop = document.createElementNS(svgNs, "stop");
      stop.setAttribute("offset", (100.0 * i / 7.0).toString() + "%");
      stop.setAttribute("stop-color", "hsl(" + ((i / 8.0).toString() + "turn,100%,85%)"));
      gradient.appendChild(stop);
    }
    return gradient;
  }

  function createSimpleSvg(code, border, maybeDataURL) {
    var size = code.size;
    var sizeWithBorder = size + (border << 1) | 0;
    var viewBox = "0 0 " + (String(sizeWithBorder) + (" " + (String(sizeWithBorder) + "")));
    var svg = document.createElementNS(svgNs, "svg");
    svg.setAttribute("viewBox", viewBox);
    var defs = document.createElementNS(svgNs, "defs");
    var rainbowGradient = createRainbowGradient(/* () */0);
    defs.appendChild(rainbowGradient);
    svg.appendChild(defs);
    if (maybeDataURL !== undefined) {
      var background = document.createElementNS(svgNs, "image");
      background.setAttribute("x", "0");
      background.setAttribute("y", "0");
      background.setAttribute("width", "100%");
      background.setAttribute("height", "100%");
      background.setAttribute("href", maybeDataURL);
      svg.appendChild(background);
    }
    var rainbow = document.createElementNS(svgNs, "rect");
    rainbow.setAttribute("width", "100%");
    rainbow.setAttribute("height", "100%");
    rainbow.setAttribute("fill", "url(#rainbow)");
    rainbow.setAttribute("fill-opacity", "0.5");
    svg.appendChild(rainbow);
    var path = createQrCodePathElement(code, border);
    svg.appendChild(path);
    return svg;
  }

  function svgToDataURL(svg) {
    var xmlSerializer = new XMLSerializer();
    var str = xmlSerializer.serializeToString(svg);
    return "data:image/svg+xml;utf8," + encodeURIComponent(str);
  }
  /* No side effect */

  // Generated by BUCKLESCRIPT VERSION 5.0.2, PLEASE EDIT WITH CARE

  var domain = "qqq.lu";

  function setBackground(selector, bgCss) {
    return withQuerySelector(selector, (function (el) {
                  el.style.setProperty("background", bgCss, "");
                  return /* () */0;
                }));
  }

  var codeRegex = new RegExp("https:\\/\\/qqq.lu\\/#(.+)");

  var defaultCode = QrCode[/* _encodeText */0]("https://qqq.lu", Ecc$1[/* low */0]);

  var initialHash = /* record */[/* contents */""];

  var camerasRef = /* record */[/* contents : array */[]];

  var cameraIndex = /* record */[/* contents */0];

  function cycleCameras(scanner) {
    var n = camerasRef[0].length;
    cameraIndex[0] = mod_(cameraIndex[0] + 1 | 0, n);
    return /* () */0;
  }

  function setSrc (img,src){
       img.src = src;}
  var dataSeen = { };

  var currentSignature = /* record */[/* contents */""];

  var canvasesRef = /* record */[/* contents : array */[]];

  function copyVideoToSnapshotCanvas(param) {
    return withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                  var snapshotCtx = snapshotCanvas.getContext("2d");
                  snapshotCtx.globalAlpha = 0.1;
                  return mapi((function (i, canvas) {
                                var h = canvas.height;
                                var x = (canvas.width - h | 0) / 2 | 0;
                                snapshotCtx.drawImage(canvas, x, 0, h, h, 0, 0, snapshotCanvas.width, snapshotCanvas.height);
                                return /* () */0;
                              }), canvasesRef[0]);
                }));
  }

  function takeSnapshot(param) {
    return withQuerySelectorDom("#snapshotCanvas", (function (snapshotCanvas) {
                  snapshotCanvas.getContext("2d");
                  return snapshotCanvas.toDataURL("image/jpeg", 0.9);
                }));
  }

  function getTimestamp(param) {
    return new Date().toISOString();
  }

  function setHashToNow(param) {
    return setHash(new Date().toISOString());
  }

  function onClick(maybeHash, param) {
    if (maybeHash !== undefined) {
      var hash = maybeHash;
      setBackground("body", "#" + hash.slice(0, 6));
      var match = get(dataSeen, hash);
      if (match !== undefined) {
        var data = match;
        console.log(data.slice(16));
        return setHash(data.slice(16));
      } else {
        return /* () */0;
      }
    } else {
      return setHash(new Date().toISOString());
    }
  }

  function addToPast(hash, dataUrl) {
    var img = document.createElement("img");
    setSrc(img, dataUrl);
    img.id = "x" + hash;
    var partial_arg = hash;
    img.addEventListener("click", (function (param) {
            return onClick(partial_arg, param);
          }));
    withQuerySelectorDom("#codes", (function (past) {
            past.appendChild(img);
            return /* () */0;
          }));
    return /* () */0;
  }

  function setCode(input) {
    var text = "https://" + (domain + ("/#" + input));
    hexDigest("SHA-1", text).then((function (hash) {
            var alreadySeen = isSome(get(dataSeen, hash));
            if (!alreadySeen) {
              dataSeen[hash] = text;
              setBackground("body", "#" + hash.slice(0, 6));
              var code = getWithDefault(QrCode[/* encodeText */1](text, Ecc$1[/* medium */1]), defaultCode);
              withQuerySelectorDom("svg", (function (root) {
                      return withQuerySelectorDom("#localGroup", (function (loopContainer) {
                                    var match = takeSnapshot(/* () */0);
                                    if (match !== undefined) {
                                      var maybePrevious = loopContainer.querySelector("svg");
                                      if (!(maybePrevious == null)) {
                                        loopContainer.removeChild(maybePrevious);
                                      }
                                      var match$1 = input !== initialHash[0];
                                      var svg = createSimpleSvg(code, 4, match$1 ? match : undefined);
                                      loopContainer.appendChild(svg);
                                      var url = svgToDataURL(svg);
                                      withQuerySelectorDom("#codes", (function (container) {
                                              var img = document.createElementNS(htmlNs, "img");
                                              img.setAttribute("src", url);
                                              container.appendChild(img);
                                              return /* () */0;
                                            }));
                                      currentSignature[0] = hash;
                                      return /* () */0;
                                    } else {
                                      return /* () */0;
                                    }
                                  }));
                    }));
            }
            return Promise.resolve(/* () */0);
          }));
    return /* () */0;
  }

  var setText = make(200, (function (hash) {
          withQuerySelectorDom("#codeContents", (function (el) {
                  el.innerText = decodeURIComponent(hash);
                  return /* () */0;
                }));
          return /* () */0;
        }));

  function onHashChange(param) {
    var hash = getHash(/* () */0).slice(1);
    setCode(hash);
    return _1(setText, hash);
  }

  function setOpacity(elQuery, opacity) {
    return map$1(flatMap(nullable_to_opt(document.querySelector(elQuery)), asHtmlElement$1), (function (body) {
                  body.style.setProperty("opacity", string_of_float(opacity), "");
                  return /* () */0;
                }));
  }

  var frameCount = /* record */[/* contents */0];

  function onTick(ts) {
    frameCount[0] = frameCount[0] + 1 | 0;
    if (frameCount[0] % 5 === 1) {
      copyVideoToSnapshotCanvas(/* () */0);
    }
    requestAnimationFrame(onTick);
    return /* () */0;
  }

  function _onInput(param) {
    withQuerySelectorDom("#codeContents", (function (el) {
            var text = el.innerText;
            return setHash(encodeURIComponent(text));
          }));
    return /* () */0;
  }

  var onInput = make(200, _onInput);

  function init(param) {
    withQuerySelectorDom("#snapshotCanvas", (function (canvas) {
            canvas.width = 480;
            canvas.height = 480;
            return /* () */0;
          }));
    withQuerySelectorDom(".codes", (function (img) {
            img.addEventListener("click", (function (param) {
                    return onClick(undefined, param);
                  }));
            return /* () */0;
          }));
    initialHash[0] = getHash(/* () */0).slice(1);
    if (initialHash[0] === "") {
      initialHash[0] = new Date().toISOString();
      setHash(initialHash[0]);
    } else {
      onHashChange(/* () */0);
    }
    withQuerySelectorDom("#codeContents", (function (el) {
            el.addEventListener("input", (function (_evt) {
                    return _1(onInput, /* () */0);
                  }));
            return /* () */0;
          }));
    var response = function (input) {
      if (input !== "") {
        hexDigest("SHA-1", input).then((function (hexHash) {
                var alreadySeen = isSome(get(dataSeen, hexHash));
                if (hexHash === currentSignature[0] || !alreadySeen) {
                  setHash(new Date().toISOString());
                }
                return Promise.resolve(/* () */0);
              }));
        return /* () */0;
      } else {
        return 0;
      }
    };
    getCameras(/* () */0).then((function (cameras) {
                camerasRef[0] = cameras;
                return Promise.all(map((function (camera) {
                                  var videoEl = document.createElementNS(htmlNs, "video");
                                  withQuerySelectorDom("#htmlContainer", (function (body) {
                                          body.appendChild(videoEl);
                                          return /* () */0;
                                        }));
                                  return scanUsingDeviceId(videoEl, camera.deviceId, response);
                                }), cameras.slice(0, 1)));
              })).then((function (canvases) {
              canvasesRef[0] = canvases;
              requestAnimationFrame(onTick);
              return Promise.resolve(/* () */0);
            })).catch((function (err) {
            console.error("getCameras failed", err);
            return Promise.resolve(/* () */0);
          }));
    return /* () */0;
  }

  window.addEventListener("load", (function (param) {
          return init(/* () */0);
        }));

  window.addEventListener("hashchange", (function (param) {
          return onHashChange(/* () */0);
        }));

  var defaultHash = "fff";
  /* codeRegex Not a pure module */

  exports._onInput = _onInput;
  exports.addToPast = addToPast;
  exports.cameraIndex = cameraIndex;
  exports.camerasRef = camerasRef;
  exports.canvasesRef = canvasesRef;
  exports.codeRegex = codeRegex;
  exports.copyVideoToSnapshotCanvas = copyVideoToSnapshotCanvas;
  exports.currentSignature = currentSignature;
  exports.cycleCameras = cycleCameras;
  exports.dataSeen = dataSeen;
  exports.defaultCode = defaultCode;
  exports.defaultHash = defaultHash;
  exports.domain = domain;
  exports.frameCount = frameCount;
  exports.getTimestamp = getTimestamp;
  exports.init = init;
  exports.initialHash = initialHash;
  exports.onClick = onClick;
  exports.onHashChange = onHashChange;
  exports.onInput = onInput;
  exports.onTick = onTick;
  exports.setBackground = setBackground;
  exports.setCode = setCode;
  exports.setHashToNow = setHashToNow;
  exports.setOpacity = setOpacity;
  exports.setSrc = setSrc;
  exports.setText = setText;
  exports.takeSnapshot = takeSnapshot;

  return exports;

}({}));
