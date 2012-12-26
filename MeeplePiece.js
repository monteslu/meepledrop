define([
  'dojo/_base/declare',
  'frozen/box2d/PolygonEntity',
  'frozen/utils'
], function(declare, Polygon, utils){

  return declare([Polygon], {
    restitution: 0.7,
    density: 0.9,
    friction: 0.8,
    aliveTime: 0,
    meeplePiece: true,
    img: null,
    scale: 30,
    constructor: function(args){
      declare.safeMixin(this, args);
    },
    draw: function(ctx, scale){
      ctx.save();
      ctx.translate(this.x * scale, this.y * scale);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * scale, -(this.y) * scale);
      ctx.fillStyle = this.color;

      ctx.beginPath();
      ctx.moveTo((this.x + this.points[0].x) * scale, (this.y + this.points[0].y) * scale);
      for (var i = 1; i < this.points.length; i++) {
         ctx.lineTo((this.points[i].x + this.x) * scale, (this.points[i].y + this.y) * scale);
      }
      ctx.lineTo((this.x + this.points[0].x) * scale, (this.y + this.points[0].y) * scale);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  });

});