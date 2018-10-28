// ------------------------------------------------
// BASIC SETUP
// ------------------------------------------------
// var MeshLine = require( 'three.meshline' );
var socket = io.connect('http://localhost:4000');
var strDownloadMime = "image/octet-stream";

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

var folder = "data/pulsar_movie/";
var folder_lines = "data/"
var normalization = 1;
var shift = 0;
var total_steps = 110000;

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
    this.fieldLines = true;
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
    gui.add(menu, 'fieldLines');
    gui.add(menu, 'star');
    gui.add(menu, 'screenshot');
};
// Create an empty scene
var scene = new THREE.Scene();

// Create a basic perspective camera
const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;
var paused = true;
var rot_paused = true;

// document.addEventListener('mousedown', function() {
//     paused = !paused;
// }, false);
var camera = new THREE.PerspectiveCamera( 75, aspect, 0.1, 1000 );
var cam_radius = 10;
camera.position.y = -cam_radius;
// camera.position.x = 7;
camera.lookAt([0, 0, 0]);
camera.up = new THREE.Vector3(0, 0, 1);
camera.updateProjectionMatrix();
var controls = new THREE.OrbitControls( camera );

controls.update();

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer({
    antialias:true,
    preserveDrawingBuffer: true
});

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
       uCol: new THREE.Uniform(new THREE.Color(0.02, 0.02, 1.0))
    };
    var uniforms_p = {
        texture:  { value: new THREE.TextureLoader().load( "textures/sprites/spark1.png" ) },
        uCol: new THREE.Uniform(new THREE.Color(1.0, 0.02, 0.02))
    };
    var shaderMaterial_e = new THREE.ShaderMaterial( {
        uniforms:       uniforms_e,
        vertexShader:   vs,
        fragmentShader: fs,
        blending:       THREE.CustomBlending,
        blendEquation:  THREE.AddEquation,
        blendSrc:       THREE.SrcAlphaFactor,
        blendDst:       THREE.OneFactor,
        depthWrite:     false,
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
        depthWrite:     false,
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
        // var floatView = new Float32Array(data);
        var floatView = data;
        var len = data.length;
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

    function make_field_line(data, lines) {
        var floatView = new Float32Array(data);
        var geom = new THREE.Geometry();
        var len = floatView.length;
        for (var j = 0; j < len/3; j++) {
            var v = new THREE.Vector3(floatView[j*3], floatView[j*3+1], floatView[j*3+2]);
            geom.vertices.push(v);
        }
        var line = new MeshLine();
        line.setGeometry(geom, function(p) {
            // return p * (1.0 - p);
            // return 0.1 * p * (1.0 - p);
            return 0.010;
        });
        var mat = new MeshLineMaterial({
            color: new THREE.Color(0x6aed5a),
            opacity: 0.7,
            depthWrite: false,
            // depthTest: false,
            transparent: true
        });
        var mesh = new THREE.Mesh(line.geometry, mat);
        scene.add(mesh);
        lines.push(line);
    };

    function update_field_line(buffers, step, lines) {
        for (var j = 0; j < 10; j += 1) {
            var geom = lines[j].geometry;
            // var g = lines[j].g;
            for (var k = 0; k < geom.attributes.position.length/3; k += 1) {
                // geom[k] = buffers[j][step][k];
                geom.attributes.position[k*3] = buffers[j][step][k*3];
                geom.attributes.position[k*3 + 1] = buffers[j][step][k*3 + 1];
                geom.attributes.position[k*3 + 2] = buffers[j][step][k*3 + 2];
            }
            lines[j].setGeometry(geometry);
        }
    }

    var frame = 0;
    var startTime = Date.now();
    var pausedTime = Date.now();
    var rotation = 0.0;
    var lines = [];
    loader.load(folder_lines + "line_0_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_1_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_2_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_3_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_4_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_5_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_6_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_7_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_8_000400", function(data) {make_field_line(data, lines);});
    loader.load(folder_lines + "line_9_000400", function(data) {make_field_line(data, lines);});

    var buffers_e = [];
    var buffers_p = [];
    // var buffer_lines = [[], [], [], [], [], [], [], [], [], []];
    var buffer_lines = [];
    for (var j = 200; j < total_steps; j += 200) {
        loader.load(folder + "pos_e_" + ("000" + j).slice(-6),
                    function(data) {
                        var floatView = new Float32Array(data);
                        buffers_e.push(floatView);
                    });
        loader.load(folder + "pos_p_" + ("000" + j).slice(-6),
                    function(data) {
                        var floatView = new Float32Array(data);
                        buffers_p.push(floatView);
                    });
    }

    // for (var j = 0; j < 10; j += 1) {
    //     // buffer_lines.push([]);
    //     var l = [];
    //     for (var k = 1; k < total_steps/200; k += 1) {
    //         loader.load(folder_lines + "line_" + j + "_" + ("000" + k).slice(-6),
    //                     function(data) {
    //                         var v = new Float32Array(data);
    //                         l.push(v);
    //                     });
    //     }
    //     buffer_lines.push(l);
    // }

    function onWindowResize() {
		    camera.aspect = window.innerWidth / window.innerHeight;
		    camera.updateProjectionMatrix();
		    renderer.setSize( window.innerWidth, window.innerHeight );
    }
    function animate() {
		    requestAnimationFrame( animate );
        var time = Date.now();
        // if (!paused && time - startTime > 1000/20) {
        if (!paused) {
            // startTime = Date.now();
            if (frame <= total_steps) {
                frame += 200;
            } else {
                // frame = 0;
                // for (var i = 0; i < pos_e.length; i++) {
                //     pos_e[i] = 0.0;
                //     pos_p[i] = 0.0;
                // }
                // electrons.geometry.attributes.position.needsUpdate = true;
                // positrons.geometry.attributes.position.needsUpdate = true;
                paused = true;
            }
            update_particles(buffers_e[frame/200], 'e');
            update_particles(buffers_p[frame/200], 'p');
            // update_field_line(buffer_lines, frame/200, lines);
            // loader.load(folder + "pos_e_" + ("000" + frame).slice(-6),
            // // loader.load(folder + "pos_e",
            //             // Function when resource is loaded
            //             function(data) {
            //                 update_particles(data, 'e');
            //             });
            // loader.load(folder + "pos_p_" + ("000" + frame).slice(-6),
            // // loader.load(folder + "pos_p",
            //             // Function when resource is loaded
            //             function(data) {
            //                 update_particles(data, 'p');
            //             });
            // paused = true;
        }

        // required if controls.enableDamping or controls.autoRotate are set to true
        controls.update();
        camera.updateProjectionMatrix();
		    render();
		    // stats.update();
    }

    function render() {
		    var time = (Date.now() - startTime) * 0.004;
        startTime = Date.now();
        // frame += 200;
        positrons.visible = menu.positrons;
        electrons.visible = menu.electrons;
        lines.forEach(function(l, i){
            l.visible = menu.fieldLines;
        });
        sphere.visible = menu.star;

        if (!rot_paused) {
            cam_radius = Math.sqrt(camera.position.x * camera.position.x +
                                   camera.position.y * camera.position.y);
            rotation = Math.atan(-camera.position.x/camera.position.y);
            // rotation += 0.01 * time;
            // camera.position.y = -cam_radius * Math.cos( rotation );
            // camera.position.x = cam_radius * Math.sin( rotation );
            camera.position.y += 0.02 * camera.position.x / cam_radius;
            camera.position.x -= 0.02 * camera.position.y / cam_radius;
            // camera.position.z = 0.0;
        // camera.lookAt([0, 0, 0]);
        // camera.up = new THREE.Vector3(0, 0, 1);
            camera.updateProjectionMatrix();
        }
        // angle += 0.01;
		    // positrons.rotation.z = -0.01 * time;
		    // electrons.rotation.z = -0.01 * time;
        // lines.forEach(function(l, i){
        //     l.rotation.z = -0.01*time;
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

    document.body.onkeyup = function(event) {
        var key = event.which || event.keyCode || 0;
        if (key === 32) {
            paused = !paused;
            rot_paused = paused;
            if (!paused) {
                startTime = Date.now();
            }
        } else if (key === 82) {
            rot_paused = !rot_paused;
        }
        // renderer.render( scene, camera );
        // socket.emit('render-frame', {
        //     // frame: frame++,
        //     frame: 0,
        //     file: document.querySelector('canvas').toDataURL()
        // });
    };

    animate();
}

// This is a basic asyncronous shader loader for THREE.js.
function ShaderLoader(vertex_url, fragment_url, onLoad, onProgress, onError) {
    var vertex_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
    vertex_loader.setResponseType('text');
    vertex_loader.load(vertex_url, function (vertex_text) {
        var fragment_loader = new THREE.FileLoader(THREE.DefaultLoadingManager);
        fragment_loader.setResponseType('text');
        fragment_loader.load(fragment_url, function (fragment_text) {
            onLoad(vertex_text, fragment_text);
        });
    }, onProgress, onError);
}
