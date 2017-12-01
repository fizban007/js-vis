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
