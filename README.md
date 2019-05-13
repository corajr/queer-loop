# queer-loop (WIP)

[queer-loop](https://qqq.lu) is a simple [ReasonML](https://reasonml.github.io/)
app that generates and reads QR codes. The QR codes follow a color sequence that
will only progress when the app recognizes another instance of itself. (The name
is a playful reference to the notion of a [strange
loop](https://en.wikipedia.org/wiki/Strange_loop) elaborated by Douglas
Hofstadter.)

## Usage

Clicking (or tapping the screen) will cycle between available cameras on your
device.

Here are a few ways I've found so far to play with queer-loop:

- open two copies of it on different devices and point their screens at each other
- hook up a capture card (I use the ClonerAlliance Flint LXT) to a Chromecast,
  and cast the tab to itself

So far, I've not been able to get queer-loop to work by pointing a phone's
front-facing camera at a mirror, though I figure it ought to be possible. I
suspect it's due to the difficulty in recognizing the barcode at an angle (at
least using the current library). I'd love to get that working -- suggestions
welcome!

## Development

This is very much a WIP, so the ergonomics of working with the code are poor at
present. License is GPL v3.

### Requirements

- [yarn](https://yarnpkg.com/)

Only tested on Ubuntu 18.10, but should work anywhere.


### Build + Watch

In different terminals (or tmux splits), run:

```
yarn start
```

```
webpack -w
```


```
http-server
```

(Alternatively, you could run all three in a subshell, viz.:. `( yarn start &; webpack -w &; http-server &; )`
