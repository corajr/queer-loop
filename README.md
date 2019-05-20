# <a href="https://qqq.lu"><img width="64" height="64" src="queer-loop.svg" alt="a QR code for queer-loop"/> queer-loop</a>

[queer-loop](https://qqq.lu) is a simple [ReasonML](https://reasonml.github.io/)
app that generates and reads Q(uee)R codes. Q(uee)R codes are QR codes that
attempt to encapsulate a particular moment in time.

Tested on:
- Chrome (desktop and Android mobile)

**NOTE: this only works in iOS version 11 and higher. I'm still working on optimizations and compatibility.**

## Usage

The prototypical use is to hold queer-loop up to a mirror. Here are a few
other ways I've found so far to play with queer-loop:

- open two copies of it on different devices and point their screens/cameras at
  each other
- hook up a capture card (I use the ClonerAlliance Flint LXT) to a Chromecast,
  and cast...:
    - a phone camera to it
    - the tab to itself

There are also some configuration options, which may be set by query parameter.

### Query Parameters

#### c (camera)

If you have more than one camera, you can set the camera(s) using e.g. `?c=1` or `?c=0&c=1`.

Examples:

[`https://qqq.lu/?c=0&c=1`](https://qqq.lu/?c=0&c=1)
[`https://qqq.lu/?c=1`](https://qqq.lu/?c=1)

#### bg

`bg` sets the "background" CSS property of the document's body.

Examples:

[`https://qqq.lu/?bg=url("queer-loop.svg")`](https://qqq.lu/?bg=url("queer-loop.svg"))
[`https://qqq.lu/?bg=lightpink`](https://qqq.lu/?bg=lightpink)
[`https://qqq.lu/?bg=%23faa`](https://qqq.lu/?bg=%23faa) (must use "%23" since `#` is reserved for the timestamp)

#### d

`d` sets whether to include the domain in the Q(uee)r code.

Examples:

[`https://qqq.lu/?d=0`](https://qqq.lu/?d=0)


## Development

<img width="256" height="256" src="development.svg" alt="a version of queer-loop pointed to localhost" />

This is very much a WIP, so the ergonomics of working with the code are poor at
present. License is GPL v3.

### Requirements

- [yarn](https://yarnpkg.com/)

Development has only tested on Ubuntu 18.10, but should work anywhere Node does.

### Build + Watch

In different terminals (or tmux splits), run:

```
yarn start
```

```
rollup -c -w
```

### Build for Production

```
yarn build && rollup -c
```
