Demo of a Node.js webserver to do WebGL visualization
==================================================================

You need `node` and `npm` installed for this to work. Clone the repo and run under the root

    npm install

It will download the necessary packages from the internet, in this case only
`express` because we use it to serve the webpage. Then run the following command

    bower install

This will download `three.js` and put it under `public/vendor` directory. If you
don't have `bower`, you can install it using `npm install -g bower`. It is a
package manager similar to `npm`, but it manages client side packages instead.
After installing everything, you should be able to start the server using

    node server.js

Then open with your favorite (GL enabled) browser `localhost:4000`. You should
see a sphere and a bunch of colorful stars that you can interact with.

Explanation of the code structure
-----------------------------------------

Everything except the javascript entry point `server.js` is under the `public`
directory. `index.html` is basically the entire webpage, which pulls in the
required dependency by including the right `three.js` source files. Then it
simply includes the `particles.js` file which creates the scene, adds a bunch of
stars and a sphere, and renders and animates it.

The CSS style sheet used is very simple: it basically gets rid of the default
margin of the webpage so the canvas can fill the page. The shaders under
`shaders` directory are responsible for rendering the particle positions and
colors. The `sprites` directory simply contains a texture for the individual
star.
