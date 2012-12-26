define([
  'dojo/_base/declare',
  'frozen/box2d/MultiPolygonEntity',
  'frozen/utils'
], function(declare, MultiPolygon, utils){

  return declare([MultiPolygon], {
    restitution: 0.2,
    density: 0.9,
    friction: 0.8,
    lastSound: 1000,
    img: null,
    scale: 30,
    constructor: function(args){
      declare.safeMixin(this, args);
      this.polys = utils.scalePoints(utils.translatePoints([
          [{x:34,y:20},{x:36,y:9},{x:42,y:2},{x:50,y:0},{x:58,y:2},{x:63,y:9},{x:66,y:20}],
          [{x:66,y:20},{x:96,y:35},{x:99,y:44},{x:92,y:48},{x:76,y:52}],
          [{x:76,y:52},{x:95,y:93},{x:95,y:99},{x:62,y:100},{x:50,y:78}],
          [{x:50,y:78},{x:38,y:100},{x:5,y:99},{x:5,y:91},{x:24,y:52}],
          [{x:24,y:52},{x:9,y:49},{x:0,y:44},{x:1,y:38},{x:7,y:32},{x:34,y:20}],
          [{x:34,y:20},{x:66,y:20},{x:76,y:52},{x:50,y:78},{x:24,y:52}]
        ], {x: -50,y: -50}), 0.4/this.scale);
    },
    draw: function(ctx, scale){
      ctx.save();
      ctx.translate(this.x * scale, this.y * scale);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * scale, -(this.y) * scale);
      ctx.drawImage(this.img, this.x * scale - 20, this.y * scale - 20);
      ctx.restore();
    }
  });

});