// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------
// var MeshLine = require( 'three.meshline' );
// var socket = io.connect('http://localhost:4000');
// var strDownloadMime = "image/octet-stream";

var parseQueryString = function(url) {
    var urlParams = {};
    url.replace(
        new RegExp("([^?=&]+)(=([^&]*))?", "g"),
        function($0, $1, $2, $3) {
            urlParams[$1] = $3;
        }
    );
    return urlParams;
}

var urlToParse = location.search;
var result = parseQueryString(urlToParse );
// console.info(JSON.stringify(result));

var folder = "data/electrosphere/";
var normalization = 1;
var shift = 0;

// if (result.page == "pulsar") {
//     folder = "data/pulsar/";
// } else if (result.page == "pulsar_sasha") {
//     folder = "data/pulsar_sasha/";
//     normalization = 50;
//     shift = -630;
// }

var saveFile = function (strData, filename) {
    var link = document.createElement('a');
    if (typeof link.download === 'string') {
        document.body.appendChild(link); //Firefox requires the link to be in the body
        link.download = filename;
        link.href = strData;
        link.click();
        document.body.removeChild(link); //remove the link when done
    } else {
        location.replace(uri);
    }
}

var Menu = function() {
    this.electrons = true;
    this.positrons = true;
    // this.fieldLines = true;
    this.star = true;
    this.screenshot = function() {
        // renderer.render( scene, camera );
        // socket.emit('render-frame', {
        //     // frame: frame++,
        //     frame: 0,
        //     file: document.querySelector('canvas').toDataURL()
        // });
        var strMime = "image/png";
        var data = document.querySelector('canvas').toDataURL(strMime);
        saveFile(data.replace(strMime, strDownloadMime), "screenshot.png");
    };

};

var menu = new Menu();
window.onload = function() {
    var gui = new dat.GUI();
    gui.add(menu, 'electrons');
    gui.add(menu, 'positrons');
    // gui.add(menu, 'fieldLines');
    gui.add(menu, 'star');
    gui.add(menu, 'screenshot');
};
// Create an empty scene
var scene = new THREE.Scene();
scene.background = new THREE.Color( 0xdddddd );

// Create a basic perspective camera
const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;
var paused = false;

// document.addEventListener('mousedown', function() {
//     paused = !paused;
// }, false);
var camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 );

camera.position.y = -10;
// camera.position.x = 7;
camera.lookAt([0, 0, 0]);
camera.up = new THREE.Vector3(0, 0, 1);
camera.updateProjectionMatrix();
var controls = new THREE.OrbitControls( camera );

controls.update();

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({
    alpha:true,
    antialias:true,
    preserveDrawingBuffer: true
});

// Configure renderer clear color
// renderer.setClearColor("#000000");
renderer.setClearColor("#ffffff", 1);

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

var manager = new THREE.LoadingManager();
var loader = new THREE.FileLoader(manager);
var textureloader = new THREE.TextureLoader(manager);
var vs, fs;
loader.setResponseType('text');
loader.load("shaders/particle.vert", function(f) {
    vs = f;
});
loader.load("shaders/particle.frag", function(f) {
    fs = f;
});
var spark = textureloader.load("textures/sprites/spark1.png");

manager.onLoad = function() {
    start();
};

function start() {
    var uniforms_e = {
        texture:  { value: spark },
	uCol: new THREE.Uniform(new THREE.Color(0.0, 0.0, 0.9))
    };
    var uniforms_p = {
        texture:  { value: spark },
        uCol: new THREE.Uniform(new THREE.Color(0.9, 0.0, 0.0))
    };
    var shaderMaterial_e = new THREE.ShaderMaterial( {
        uniforms:       uniforms_e,
        vertexShader:   vs,
        fragmentShader: fs,
        blending:       THREE.CustomBlending,
        blendEquation:  THREE.AddEquation,
        blendSrc:       THREE.SrcAlphaFactor,
        blendDst:       THREE.OneMinusSrcAlphaFactor,
        depthWrite:     true,
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
        // blendDst:       THREE.OneFactor,
        blendDst:       THREE.OneMinusSrcAlphaFactor,
        depthWrite:     true,
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
                pos_e[i * 3] = (floatView[i * 3] + shift) / normalization;
                pos_e[i * 3 + 1] = (floatView[i * 3 + 1] + shift) / normalization;
                pos_e[i * 3 + 2] = (floatView[i * 3 + 2] + shift) / normalization;
            }
            electrons.geometry.attributes.position.needsUpdate = true;
        } else if (species == 'p') {
            for (var i = 0; i < len/3; i++) {
                pos_p[i * 3] = (floatView[i * 3] + shift) / normalization;
                pos_p[i * 3 + 1] = (floatView[i * 3 + 1] + shift) / normalization;
                pos_p[i * 3 + 2] = (floatView[i * 3 + 2] + shift) / normalization;
            }
            positrons.geometry.attributes.position.needsUpdate = true;
        }
    };

    // function make_field_line(data, lines) {
    //     var floatView = new Float32Array(data);
    //     var geom = new THREE.Geometry();
    //     var len = floatView.length;
    //     for (var j = 0; j < len/3; j++) {
    //         var v = new THREE.Vector3(floatView[j*3], floatView[j*3+1], floatView[j*3+2]);
    //         geom.vertices.push(v);
    //     }
    //     var line = new MeshLine();
    //     line.setGeometry(geom, function(p) {
    //         // return p * (1.0 - p);
    //         // return 0.1 * p * (1.0 - p);
    //         return 0.015;
    //     });
    //     var mat = new MeshLineMaterial({
    //         color: new THREE.Color(0x6aed5a),
    //         opacity: 1.0,
    //         depthWrite: false,
    //         // depthTest: false,
    //         transparent: true
    //     });
    //     var mesh = new THREE.Mesh(line.geometry, mat);
    //     scene.add(mesh);
    //     lines.push(mesh);
    // };

    var frame = 0;
    var startTime = Date.now();
    // var lines = [];
    // loader.load(folder + "line0", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line1", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line2", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line3", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line4", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line5", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line6", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line7", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line8", function(data) {make_field_line(data, lines);});
    // loader.load(folder + "line9", function(data) {make_field_line(data, lines);});

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
            loader.load(folder + "pos_e_280000",
                        // Function when resource is loaded
                        function(data) {
                            update_particles(data, 'e');
                        });
            // loader.load("data/twist1/pos_p_" + ("000" + frame).slice(-6),
            loader.load(folder + "pos_p_280000",
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
        positrons.visible = menu.positrons;
        electrons.visible = menu.electrons;
        // lines.forEach(function(l, i){
        //     l.visible = menu.fieldLines;
        // });
        sphere.visible = menu.star;

	positrons.rotation.z = 0.01 * time;
	electrons.rotation.z = 0.01 * time;
        // lines.forEach(function(l, i){
        //     l.rotation.z = 0.01*time;
        // });
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

    // document.body.onkeyup = function() {
    //     // paused = !paused;
    //     renderer.render( scene, camera );
    //     socket.emit('render-frame', {
    //         // frame: frame++,
    //         frame: 0,
    //         file: document.querySelector('canvas').toDataURL()
    //     });
    // };

    animate();
}
