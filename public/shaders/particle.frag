uniform sampler2D texture;
uniform vec3 uCol;
// varying vec3 vColor;

void main() {
  gl_FragColor = vec4( uCol, 0.6 );
  // gl_FragColor = gl_FragColor * texture2D( texture, gl_PointCoord );
}
