uniform sampler2D texture;
uniform vec3 uCol;
// attribute float size;
// varying vec3 vColor;

float rand(vec2 n)
{
  return fract(sin(dot(n.xy, vec2(12.9898, 78.233)))* 43758.5453);
}

void main() {
  // vColor = color;
  // float theta = rand(position.xy) * 1.0;
  // float r = sqrt(position.x * position.x + position.y * position.y);

  // vec4 mvPosition = modelViewMatrix * vec4( position.x * cos(theta), position.y * cos(theta), r * sin(theta) , 1.0 );
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  // float x = texture2D(uTexture0, aUV)*10.0;
  // float z = texture2D(uTexture1, aUV)*10.0;
  // vec4 mvPosition = modelViewMatrix * vec4( x, z, 0.0, 1.0 );
  // gl_PointSize = s * size * ( 300.0 / -mvPosition.z );
  // gl_PointSize = uniform1 * size;
  // gl_PointSize = 1.5;
  gl_PointSize = 2.0;
  gl_Position = projectionMatrix * mvPosition;
}
