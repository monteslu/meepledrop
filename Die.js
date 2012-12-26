define([
  'dojo/_base/declare',
  'frozen/box2d/RectangleEntity',
  'frozen/utils'
], function(declare, Rectangle, utils){

  return declare([Rectangle], {
    halfWidth: 1,
    halfHeight: 1,
    color: '#FFF',
    outlineColor: '#000',
    restitution: 0.6,
    density: 0.8,
    friction: 0.3,
    constructor: function(args){
      declare.safeMixin(this, args);
      this.values = this.getShuffledValues();
    },
    draw: function(ctx, scale){
      var positionMod = this.getPositionMod();
      ctx.save();
      ctx.translate(this.x * scale, this.y * scale);
      ctx.rotate(this.angle);
      ctx.translate(-(this.x) * scale, -(this.y) * scale);
      ctx.drawImage(this.img,
        positionMod * this.halfWidth * 2 * scale,
        0,
        this.halfWidth * scale * 2,
        this.halfHeight * scale * 2,
        (this.x - this.halfWidth) * scale,
        (this.y - this.halfHeight) * scale,
        this.halfWidth * scale * 2,
        this.halfHeight * scale * 2);
      ctx.restore();
    },
    getShuffledValues: function(){
      var myArray = [0,1,2,3,4,5];
      var i = 6;
      while ( --i ) {
         var j = Math.floor( Math.random() * ( i + 1 ) );
         var tempi = myArray[i];
         var tempj = myArray[j];
         myArray[i] = tempj;
         myArray[j] = tempi;
       }
      return myArray;
    },
    getPositionMod: function(){
      var degrees = utils.radiansToDegrees(this.angle) % 360;
      if(degrees < 0){
        degrees+= 360;
      }
      if(degrees >= 330 || degrees < 30){
        return this.values[0];
      }
      else if(degrees >= 30 && degrees < 90){
        return this.values[1];
      }
      else if(degrees >=90 && degrees < 150){
        return this.values[2];
      }
      else if(degrees >=150 && degrees < 210){
        return this.values[3];
      }
      else if(degrees >= 210 && degrees < 270){
        return this.values[4];
      }
      else{
        return this.values[5];
      }
    }
  });

});