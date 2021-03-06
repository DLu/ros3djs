/**
 * @author Russell Toris - rctoris@wpi.edu
 */

function get_color(data, color) {
  var val;
  if (data === 100){
    val = 0;
  } else if (data === 0) {
    val = 255;
  } else {
    val = 127;
  }
  
  return [ (val * color.r) / 255, (val * color.g) / 255, (val * color.b) / 255, 255 ];
}

/**
 * An OccupancyGrid can convert a ROS occupancy grid message into a THREE object.
 *
 * @constructor
 * @param options - object with following keys:
 *
 *   * message - the occupancy grid message
 *   * color (optional) - color of the visualized grid
 *   * opacity (optional) - opacity of the visualized grid (0.0 == fully transparent, 1.0 == opaque)
 */
ROS3D.OccupancyGrid = function(options) {
  options = options || {};
  var message = options.message;
  var color = options.color || {r:255,g:255,b:255};
  var opacity = options.opacity || 1.0;

  // create the geometry
  var width = message.info.width;
  var height = message.info.height;
  var geom = new THREE.PlaneGeometry(width, height);

  // internal drawing canvas
  var canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  var context = canvas.getContext('2d');
  // create the color material
  var imageData = context.createImageData(width, height);
  for ( var row = 0; row < height; row++) {
    for ( var col = 0; col < width; col++) {
      // determine the index into the map data
      var mapI = col + ((height - row - 1) * width);
      // determine the value
      var data = message.data[mapI];
      var val;
      // determine the index into the image data array
      var i = (col + (row * width)) * 4;
      var rgba;
      if(color.r){ rgba= get_color(data, color);}else{
        rgba = color(data);
      }

      imageData.data[i] = rgba[0];
      imageData.data[++i] = rgba[1];
      imageData.data[++i] = rgba[2];
      imageData.data[++i] = rgba[3];
    }
  }
  context.putImageData(imageData, 0, 0);

  var texture = new THREE.Texture(canvas);
  texture.needsUpdate = true;

  var material = new THREE.MeshBasicMaterial({
    map : texture,
    transparent : true,
    opacity : opacity
  });
  material.side = THREE.DoubleSide;

  // create the mesh
  THREE.Mesh.call(this, geom, material);
  // move the map so the corner is at X, Y and correct orientation (informations from message.info)
  this.useQuaternion = true;
  this.quaternion = message.info.origin.orientation;
  this.position.x = (width * message.info.resolution) / 2 + message.info.origin.position.x;
  this.position.y = (height * message.info.resolution) / 2 + message.info.origin.position.y;
  this.position.z = message.info.origin.position.z;
  this.scale.x = message.info.resolution;
  this.scale.y = message.info.resolution;
};
ROS3D.OccupancyGrid.prototype.__proto__ = THREE.Mesh.prototype;
