# Example 1 - Quick Usage

This example demonstrates how you'd quickly set up `elm-port-helper` in your
project. This example only has two source files (`index.js` and `Main.elm`).
The other files describe the required packages and how to build the project.

The Elm code creates a page where the user can get or set strings in your
browser's localStorage. Since Elm doesn't support localStorage yet, ports are
used to allow Elm to access localStorage.

## Viewing this example

To see this example in a web browser, clone the repo, navigate to this folder,
and run `npm install` and `elm package` (assumes you have NPM and Elm installed
on your computer). Then run `npm start` to start `webpack-dev-server`. The
built page can be visited at [localhost:8080](localhost:8080).
