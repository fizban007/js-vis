// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------
var socket = io.connect('http://localhost:4000');
// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;
var paused = false;

// document.addEventListener('mousedown', function() {
//     paused = !paused;
// }, false);
document.body.onkeyup = function() {
    paused = !paused;
};

var camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 );

camera.position.y = -10;
// camera.position.x = 7;
camera.lookAt([0, 0, 0]);
camera.up = new THREE.Vector3(0, 0, 1);
camera.updateProjectionMatrix();
var controls = new THREE.OrbitControls( camera );

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
var particleSystem, uniforms, pGeometry;
var particles = 5000000;
var vert_shader, frag_shader;
var pos_e = new Float32Array(particles * 3), pos_p = new Float32Array(particles * 3);
var geometry_e = new THREE.BufferGeometry();
var geometry_p = new THREE.BufferGeometry();
geometry_e.addAttribute( 'position', new THREE.BufferAttribute(pos_e, 3) );
geometry_p.addAttribute( 'position', new THREE.BufferAttribute(pos_p, 3) );

// Create a Sphere Mesh with basic material
var geometry = new THREE.SphereGeometry( 1, 32, 32 );
var material = new THREE.MeshBasicMaterial( { color: "#888888",
                                              depthTest: true,
                                              depthWrite: true,
                                              transparent: true } );
var sphere = new THREE.Mesh( geometry, material );
sphere.matrixAutoUpdate = false;
// Add cube to Scene
scene.add( sphere );

// Load the vertex and fragment shaders from external file
ShaderLoader("shaders/particle.vert", "shaders/particle.frag", function (vs, fs) {
    start(vs, fs);
});

function start(vs, fs) {
    var uniforms_e = {
        texture:  { value: new THREE.TextureLoader().load( "textures/sprites/spark1.png" ) },
       uCol: new THREE.Uniform(new THREE.Color(0.01, 0.01, 1.0))
    };
    var uniforms_p = {
        texture:  { value: new THREE.TextureLoader().load( "textures/sprites/spark1.png" ) },
        uCol: new THREE.Uniform(new THREE.Color(1.0, 0.01, 0.01))
    };
    var shaderMaterial_e = new THREE.ShaderMaterial( {
        uniforms:       uniforms_e,
        vertexShader:   vs,
        fragmentShader: fs,
        blending:       THREE.CustomBlending,
        blendEquation:  THREE.AddEquation,
        blendSrc:       THREE.SrcAlphaFactor,
        blendDst:       THREE.OneFactor,
        depthWrite:      false,
        transparent:    true,
        vertexColors:   true
    });
    var shaderMaterial_p = new THREE.ShaderMaterial( {
        uniforms:       uniforms_p,
        vertexShader:   vs,
        fragmentShader: fs,
        blending:       THREE.CustomBlending,
        blendEquation:  THREE.AddEquation,
        blendSrc:       THREE.SrcAlphaFactor,
        blendDst:       THREE.OneFactor,
        depthWrite:      false,
        transparent:    true,
        vertexColors:   true
    });
    var radius = 5;

    var electrons = new THREE.Points(geometry_e, shaderMaterial_e);
    var positrons = new THREE.Points(geometry_p, shaderMaterial_p);

    scene.add(electrons);
    scene.add(positrons);

    // Read the files into array buffers
    var loader = new THREE.FileLoader();
    loader.setResponseType('arraybuffer');

    // Read an arraybuffer of particle positions
    function update_particles(data, species) {
        var floatView = new Float32Array(data);
        var len = floatView.length;
        if (species == 'e') {
            for (var i = 0; i < len/3; i++) {
                pos_e[i * 3] = floatView[i * 3];
                pos_e[i * 3 + 1] = floatView[i * 3 + 1];
                pos_e[i * 3 + 2] = floatView[i * 3 + 2];
            }
            electrons.geometry.attributes.position.needsUpdate = true;
        } else if (species == 'p') {
            for (var i = 0; i < len/3; i++) {
                pos_p[i * 3] = floatView[i * 3];
                pos_p[i * 3 + 1] = floatView[i * 3 + 1];
                pos_p[i * 3 + 2] = floatView[i * 3 + 2];
            }
            positrons.geometry.attributes.position.needsUpdate = true;
        }
    };
    var frame = 0;
    var startTime = Date.now();

    function onWindowResize() {
		    camera.aspect = window.innerWidth / window.innerHeight;
		    camera.updateProjectionMatrix();
		    renderer.setSize( window.innerWidth, window.innerHeight );
    }
    function animate() {
		    requestAnimationFrame( animate );
        var time = Date.now();
        if (!paused && time - startTime > 1000/20) {
            startTime = Date.now();
            if (frame < -200) {
                frame += 200;
            } else {
                frame = 0;
                for (var i = 0; i < pos_e.length; i++) {
                    pos_e[i] = 0.0;
                    pos_p[i] = 0.0;
                }
                electrons.geometry.attributes.position.needsUpdate = true;
                positrons.geometry.attributes.position.needsUpdate = true;
            }
            // loader.load("data/twist1/pos_e_" + ("000" + frame).slice(-6),
            loader.load("pos_e_140000",
                        // Function when resource is loaded
                        function(data) {
                            update_particles(data, 'e');
                        });
            // loader.load("data/twist1/pos_p_" + ("000" + frame).slice(-6),
            loader.load("pos_p_140000",
                        // Function when resource is loaded
                        function(data) {
                            update_particles(data, 'p');
                        });
            paused = true;
        }

        // required if controls.enableDamping or controls.autoRotate are set to true
        controls.update();
        camera.updateProjectionMatrix();
		    render();
		    // stats.update();
    }

    function render() {
		    var time = (Date.now() - startTime) * 0.005;
        // frame += 200;
		    positrons.rotation.z = 0.01 * time;
		    electrons.rotation.z = 0.01 * time;
		    // var sizes = pGeometry.attributes.size.array;
		    // for ( var i = 0; i < particles; i++ ) {
				//     sizes[ i ] = 1 * ( 1 + Math.sin( 0.1 * i + time ) );
		    // }
		    // pGeometry.attributes.size.needsUpdate = true;
        // cube.rotation.x += 0.01;
        // cube.rotation.y += 0.01;
        // uniforms.uniform1 = 1.0 * (1.0 + Math.sin(0.1 + time));
        // uniforms.uniform1.value = 1.0 * (1.0 + 0.5 * Math.sin(0.1 + time));
		    renderer.render( scene, camera );

        // if (positrons.rotation.z < 6.283) {
        //     socket.emit('render-frame', {
        //         frame: frame++,
        //         file: document.querySelector('canvas').toDataURL()
        //     });
        // }
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
