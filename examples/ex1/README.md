# Example 1 - Quick Usage

This example demonstrates how you'd quickly set up `elm-port-helper` in your
project. This example only has two source files (`index.js` and `Main.elm`).
The other files describe the required packages and how to build the project.

The Elm code creates a page where the user can get or set strings in their
browser's localStorage. Since Elm doesn't support localStorage yet, ports are
used to allow Elm to access localStorage.

## Running this example

I recommend running a local copy of the example so that you can play with the
code and see what happens!

These commands will download the repo, install the required packages, and
start the dev server:

```sh
$ git clone https://github.com/SidneyNemzer/elm-port-helper
$ cd ./elm-port-helper
$ npm install
$ cd ./examples/ex1
$ npm install && elm package install
$ npm start
```

Once the dev server starts, open a web browser and open the URL
[localhost:8080](http://localhost:8080)
