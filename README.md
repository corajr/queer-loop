# <a href="https://qqq.lu"><img width="64" height="64" src="queer-loop.svg" alt="a QR code for queer-loop"/> queer-loop</a>

[queer-loop](https://qqq.lu) is a simple [ReasonML](https://reasonml.github.io/)
app that generates and reads Q(uee)R codes. Q(uee)R codes are QR codes that
attempt to encapsulate a particular moment in time.

Tested on:
- Chrome (desktop and Android mobile)

**NOTE: this only works in iOS version 11 and higher. I'm still working on optimizations and compatibility.**

## Usage

You can set the "background" CSS property of the document's body using query
parameters, e.g.:

[`https://qqq.lu/?bg=url("queer-loop.svg")`](https://qqq.lu/?bg=url("queer-loop.svg"))
[`https://qqq.lu/?bg=lightpink`](https://qqq.lu/?bg=lightpink)
[`https://qqq.lu/?bg=%23faa`](https://qqq.lu/?bg=%23faa) (must use "%23" so that the hash is separate)

The prototypical use is to hold queer-loop up to a mirror. Here are a few
other ways I've found so far to play with queer-loop:

- open two copies of it on different devices and point their screens/cameras at
  each other
- hook up a capture card (I use the ClonerAlliance Flint LXT) to a Chromecast,
  and cast...:
    - a phone camera to it
    - the tab to itself

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
