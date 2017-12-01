// const path = require('path');
// const fs = require('fs');
// const createControls = require('orbit-controls');

// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------

// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;

var camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 );

var controls = new THREE.OrbitControls( camera );

camera.position.z = 4;
camera.updateProjectionMatrix();
controls.update();

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({antialias:true});

// Configure renderer clear color
renderer.setClearColor("#000000");

// Configure renderer size
// renderer.setSize( window.innerWidth, window.innerHeight );
renderer.setSize( width, height );

// Append Renderer to DOM
const canvas = renderer.domElement;
document.body.appendChild( canvas );


// ------------------------------------------------
// FUN STARTS HERE
// ------------------------------------------------
// var renderer, scene, camera, stats;
var particleSystem, uniforms, pGeometry;
var particles = 100000;
var vert_shader, frag_shader;
ShaderLoader("shaders/particle.vert", "shaders/particle.frag", function (vs, fs) {
    start(vs, fs);
});

function start(vs, fs) {
    uniforms = {
        // texture:   { value: new THREE.TextureLoader().load( "textures/sprites/spark1.png" ) }
        texture:   { value: new THREE.ImageUtils.loadTexture( "textures/sprites/spark1.png" ) }
    };
    var shaderMaterial = new THREE.ShaderMaterial( {
        uniforms:       uniforms,
        // vertexShader:   document.getElementById( 'vertexshader' ).textContent,
        vertexShader:   vs,
        // fragmentShader: document.getElementById( 'fragmentshader' ).textContent,
        fragmentShader: fs,
        blending:       THREE.AdditiveBlending,
        depthTest:      false,
        transparent:    true,
        vertexColors:   true
    });
    var radius = 10;
    pGeometry = new THREE.BufferGeometry();
    var positions = [];
    var colors = [];
    var sizes = [];
    var color = new THREE.Color();
    for ( var i = 0; i < particles; i ++ ) {
        positions.push( ( Math.random() * 2 - 1 ) * radius );
        positions.push( ( Math.random() * 2 - 1 ) * radius );
        positions.push( ( Math.random() * 2 - 1 ) * radius );
        color.setHSL( i / particles, 1.0, 0.5 );
        colors.push( color.r, color.g, color.b );
        sizes.push( 0.1 );;
    }
    pGeometry.addAttribute( 'position', new THREE.Float32BufferAttribute( positions, 3 ) );
    pGeometry.addAttribute( 'color', new THREE.Float32BufferAttribute( colors, 3 ) );
    pGeometry.addAttribute( 'size', new THREE.Float32BufferAttribute( sizes, 1 ).setDynamic( true ) );
    particleSystem = new THREE.Points( pGeometry, shaderMaterial );


    // create the particle variables
    // var particleCount = 1800,
    //     particles = new THREE.Geometry(),
    //     pMaterial = new THREE.PointsMaterial({
    //         color: 0xFFFFFF
    //         // size: 20
    //     });

    // // now create the individual particles
    // for (var p = 0; p < particleCount; p++) {

    //     // create a particle with random
    //     // position values, -250 -> 250
    //     var pX = THREE.Math.randFloatSpread(500) - 250,
    //         pY = THREE.Math.randFloatSpread(500) - 250,
    //         pZ = THREE.Math.randFloatSpread(500) - 250,
    //         // particle = new THREE.Vertex(
    //         particle = new THREE.Vector3(pX, pY, pZ);
    //         // );

    //     // add it to the geometry
    //     particles.vertices.push(particle);
    // }

    // // create the particle system
    // var particleSystem = new THREE.ParticleSystem(
    //     particles,
    //     pMaterial);

    // // add it to the scene
    // // scene.addChild(particleSystem);
    scene.add( particleSystem );
    // Create a Cube Mesh with basic material
    var geometry = new THREE.SphereGeometry( 1, 32, 32 );
    var material = new THREE.MeshBasicMaterial( { color: "#AAAAAA" } );
    var sphere = new THREE.Mesh( geometry, material );

    // Add cube to Scene
    scene.add( sphere );

    // Render Loop
    // var render = function () {
    //   requestAnimationFrame( render );

    //   cube.rotation.x += 0.01;
    //   cube.rotation.y += 0.01;

    //   // Render the scene
    //   renderer.render(scene, camera);
    // };

    // render();


    // // init();
    // // function init() {
    // camera = new THREE.PerspectiveCamera( 40, window.innerWidth / window.innerHeight, 1, 10000 );
    // camera.position.z = 300;
    // scene = new THREE.Scene();
    // renderer = new THREE.WebGLRenderer();
    // renderer.setPixelRatio( window.devicePixelRatio );
    // renderer.setSize( window.innerWidth, window.innerHeight );
    // var container = document.getElementById( 'container' );
    // container.appendChild( renderer.domElement );
    // stats = new Stats();
    // container.appendChild( stats.dom );
    // //
    // window.addEventListener( 'resize', onWindowResize, false );
    // // }

    function onWindowResize() {
		    camera.aspect = window.innerWidth / window.innerHeight;
		    camera.updateProjectionMatrix();
		    renderer.setSize( window.innerWidth, window.innerHeight );
    }
    function animate() {
		    requestAnimationFrame( animate );
        // required if controls.enableDamping or controls.autoRotate are set to true
        controls.update();
        camera.updateProjectionMatrix();
		    render();
		    stats.update();
    }
    function render() {
		    var time = Date.now() * 0.005;
		    particleSystem.rotation.y = 0.01 * time;
		    // var sizes = pGeometry.attributes.size.array;
		    // for ( var i = 0; i < particles; i++ ) {
				//     sizes[ i ] = 1 * ( 1 + Math.sin( 0.1 * i + time ) );
		    // }
		    // pGeometry.attributes.size.needsUpdate = true;
        // cube.rotation.x += 0.01;
        // cube.rotation.y += 0.01;
		    renderer.render( scene, camera );
    }

    animate();
}

// This is a basic asyncronous shader loader for THREE.js.
function ShaderLoader(vertex_url, fragment_url, onLoad, onProgress, onError) {
    var vertex_loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
    vertex_loader.setResponseType('text');
    vertex_loader.load(vertex_url, function (vertex_text) {
        var fragment_loader = new THREE.XHRLoader(THREE.DefaultLoadingManager);
        fragment_loader.setResponseType('text');
        fragment_loader.load(fragment_url, function (fragment_text) {
            onLoad(vertex_text, fragment_text);
        });
    }, onProgress, onError);
}
