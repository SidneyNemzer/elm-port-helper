# elm-port-helper

Elm's ports allow Elm to communicate with JavaScript.

I've noticed several things about ports:

* If the JavaScript you wrote for a port throws an errors, it may crash your Elm program
* You might forget to connect a port on the JavaScript side
* Returning a result to Elm uses the same pattern

I created elm-port-helper to fix address these.
