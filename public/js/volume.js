// import loadImage from './load-image';
// import transferFunction from './transfer-function';
var strDownloadMime = "image/octet-stream";
var saveFile =
    function(strData, filename) {
	var link = document.createElement('a');
	if (typeof link.download === 'string') {
	    document.body.appendChild(
		link); // Firefox requires the link to be in the body
	    link.download = filename;
	    link.href = strData;
	    link.click();
	    document.body.removeChild(link); // remove the link when done
	} else {
	    location.replace(uri);
	}
    }

var Menu = function() {
    this.electrons = true;
    this.positrons = true;
    // this.fieldLines = true;
    this.alpha_correction = 1.0;
    this.star_radius = 0.055;
    this.star_color = "#666666";
    this.color1 = "#ffffff";
    this.stepPos1 = 0.1;
    this.color2 = "#ff9900";
    this.stepPos2 = 0.5;
    this.color3 = "#ff0000";
    this.stepPos3 = 1.0;
    this.species = 0;
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

var stats = new Stats();
stats.showPanel( 0 ); // 0: fps, 1: ms, 2: mb, 3+: custom
document.body.appendChild( stats.dom );

function updateTransferFunction() {
    var canvas = document.createElement('canvas');
    canvas.height = 16;
    canvas.width = 256;
    var ctx = canvas.getContext('2d');
    var grd = ctx.createLinearGradient(0, 0, canvas.width -1 , canvas.height - 1);
    grd.addColorStop(menu.stepPos1, menu.color1);
    grd.addColorStop(menu.stepPos2, menu.color2);
    grd.addColorStop(menu.stepPos3, menu.color3);
    ctx.fillStyle = grd;
    ctx.fillRect(0,0,canvas.width ,canvas.height );
    // var img = document.getElementById("transferFunctionImg");
    // img.src = canvas.toDataURL();
    // img.style.width = "256 px";
    // img.style.height = "128 px";
    // var strMime = "image/png";
    // var data = canvas.toDataURL(strMime);
    // saveFile(data.replace(strMime, strDownloadMime), "colors.png");

    var transferTexture =  new THREE.CanvasTexture(canvas);
    transferTexture.wrapS = transferTexture.wrapT =  THREE.ClampToEdgeWrapping;
    transferTexture.minFilter = transferTexture.magFilter = THREE.LinearFilter;
    transferTexture.format = THREE.RGBAFormat;
    transferTexture.needsUpdate = true;
    return transferTexture;
}
// var transferTex = new THREE.CanvasTexture({
//     canvas: transferFunction()
// });

// Create an empty scene
var scene = new THREE.Scene();
// scene.background = new THREE.Color(0x000000);
var scenefbo = new THREE.Scene();
// scenefbo.background = new THREE.Color(0x000000);

// Create a basic perspective camera
const width = window.innerWidth;
const height = window.innerHeight;
const aspect = width / height;
var paused = false;

// Create a renderer with Antialiasing
var renderer = new THREE.WebGLRenderer(
    {alpha : false,
     antialias : true,
     preserveDrawingBuffer : true});
renderer.setPixelRatio( window.devicePixelRatio );
renderer.setClearColor("#000000");

// Configure renderer size
renderer.setSize(width, height);
renderer.autoClear = true;

// Append Renderer to DOM
var canvas = renderer.domElement;
document.body.appendChild(canvas);
// var context = canvas.getContext( 'webgl2' );

// document.addEventListener('mousedown', function() {
//     paused = !paused;
// }, false);
var camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);

camera.position.y = -1;
camera.position.z = 1;
// camera.position.x = 7;
camera.lookAt([ 0, 0, 0 ]);
camera.up = new THREE.Vector3(0, 0, 1);
camera.updateProjectionMatrix();
var controls = new THREE.OrbitControls(camera, renderer.domElement);

controls.update();


var manager = new THREE.LoadingManager();
var loader = new THREE.FileLoader(manager);
var imgloader = new THREE.TextureLoader(manager);
var vs1, fs1, vs2, fs2, vs3, fs3, dataTex, transTex;
loader.setResponseType('text');
loader.load("shaders/first-pass.vert.glsl", function(f) {vs1 = f;});
loader.load("shaders/first-pass.frag.glsl", function(f) {fs1 = f;});
loader.load("shaders/second-pass.vert.glsl", function(f) {vs2 = f;});
loader.load("shaders/second-pass.frag.glsl", function(f) {fs2 = f;});
loader.load("shaders/test.vert.glsl", function(f) {vs3 = f;});
loader.load("shaders/test.frag.glsl", function(f) {fs3 = f;});
imgloader.load("textures/test512b.png", function(f) {
    dataTex = f;
    dataTex.flipY = false;
    dataTex.minFilter = THREE.LinearFilter;
    dataTex.magFilter = THREE.LinearFilter;
    dataTex.type = THREE.UnsignedByteType;
    console.info("Loaded Simulation Data");
});
transTex = updateTransferFunction();
// imgloader.load("textures/colors.png", function(f) {
//     transTex = f;
//     transTex.minFilter = THREE.LinearFilter;
//     transTex.magFilter = THREE.LinearFilter;
//     transTex.type = THREE.UnsignedByteType;
// });
manager.onLoad = function() { start(); };

var start = function() {
    // Setup dat.gui
    var gui = new dat.GUI();
    gui.add(menu, 'alpha_correction', 0, 4.0).listen();
    gui.add(menu, 'star_radius', 0, 0.1).listen();
    ctlStarColor = gui.addColor(menu, 'star_color');
    ctlColor1 = gui.addColor(menu, 'color1');
    ctlStep1 = gui.add(menu, 'stepPos1', 0, 1);
    ctlColor2 = gui.addColor(menu, 'color2');
    ctlStep2 = gui.add(menu, 'stepPos2', 0, 1);
    ctlColor3 = gui.addColor(menu, 'color3');
    ctlStep3 = gui.add(menu, 'stepPos3', 0, 1);
    ctlSpecies = gui.add(menu, 'species', {Both: 0, Electrons: 1,
					   Positrons: 2, Difference: 3}).listen();
    gui.add(menu, 'screenshot');

    ctlStarColor.onChange(updateTexture);
    ctlColor1.onChange(updateTexture);
    ctlColor2.onChange(updateTexture);
    ctlColor3.onChange(updateTexture);
    ctlStep1.onChange(updateTexture);
    ctlStep2.onChange(updateTexture);
    ctlStep3.onChange(updateTexture);
    ctlSpecies.onChange(updateSpecies);

    var rtTexture = new THREE.WebGLRenderTarget(
	window.innerWidth, window.innerHeight, {
	    minFilter: THREE.LinearFilter,
	    magFilter: THREE.LinearFilter,
	    wrapS:  THREE.ClampToEdgeWrapping,
	    wrapT:  THREE.ClampToEdgeWrapping,
	    format: THREE.RGBAFormat,
	    type: THREE.FloatType,
	    // generateMipmaps: false,
	    // flipY: false,
	    // depthBuffer: false,
	    // stencilBuffer: false
	} );

    // First pass
    var mat1 = new THREE.ShaderMaterial({
	// uniforms: {},
	vertexShader: vs1,
	fragmentShader: fs1,
	side: THREE.BackSide
	// vertexColors: true
    });

    var mat2 = new THREE.ShaderMaterial({
	uniforms: {
	    tex: {type: "t", value: rtTexture.texture},
	    cubeTex: { type: "t", value: dataTex},
	    transferTex: { type: "t", value: transTex},
	    starColor: { type: "c", value: new THREE.Color(menu.star_color)},
	    steps: {type: "f", value: 256.0},
	    alphaCorrection: {type: "f", value: 1.0},
	    res: {type: "f", value: 512.0},
	    row: {type: "f", value: 32.0},
	    star_radius: {value: menu.star_radius},
	    species: {type: "i", value: menu.species}
	},
	vertexShader: vs2,
	fragmentShader: fs2,
	side: THREE.FrontSide,
	// depthWrite: true,
	// transparent: true
    });

    var mat3 = new THREE.ShaderMaterial({
	uniforms: {
	    cubeTex: { value: dataTex},
	    transferTex: { value: transTex},
	    localCamPos: { type: "v3", value: camera.position},
	    steps: {type: "f", value: 256.0},
	    alphaCorrection: {type: "f", value: 0.2},
	    res: {type: "f", value: 512.0},
	    row: {type: "f", value: 32.0},
	},
	vertexShader: vs3,
	fragmentShader: fs3,
	side: THREE.BackSide
    });

    // Add a cube
    var cube_geometry = new THREE.BoxGeometry(1, 1, 1);

    var cube1 = new THREE.Mesh(cube_geometry, mat1);
    scenefbo.add(cube1);
    var cube2 = new THREE.Mesh(cube_geometry, mat2);
    scene.add(cube2);

    // var sph = new THREE.SphereGeometry(0.06, 32, 32);
    // var sphmat = new THREE.MeshBasicMaterial( {color: 0x888888} );
    // var star = new THREE.Mesh(sph, sphmat);
    // scene.add(star);

    function updateTexture(value) {
	mat2.uniforms.starColor.value = new THREE.Color(menu.star_color);
	mat2.uniforms.transferTex.value = updateTransferFunction();
    }

    function updateSpecies(value) {
	mat2.uniforms.species.value = menu.species;
    }

    function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
    }

    function animate() {
	requestAnimationFrame(animate);
	stats.begin();
	// required if controls.enableDamping or controls.autoRotate are set to true
	controls.update();
	camera.updateProjectionMatrix();
	// console.log(camera.position);
	render();
	stats.end();
    }

    function render() {
	// console.log(menu.star_radius);
	mat2.uniforms.star_radius.value = menu.star_radius;
	mat2.uniforms.alphaCorrection.value = menu.alpha_correction;
	renderer.render(scenefbo, camera, rtTexture, true);
	renderer.render(scene, camera);
    }

    document.body.onkeydown = function(event) {
	// var key = event.which || event.keyCode || 0;
	var key = event.code || 0;
	// console.log(key);
	if (key === 'KeyQ') { // Q key
	    menu.alpha_correction -= 0.02;
	} else if (key === 'KeyW') { // W key
	    menu.alpha_correction += 0.02;
	}
    };

    animate();

}
