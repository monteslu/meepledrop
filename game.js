//load the AMD modules we need
require(['frozen/GameCore', 'frozen/ResourceManager', 'dojo/keys', 'frozen/utils', 'frozen/box2d/Box', 'frozen/box2d/RectangleEntity', 'frozen/box2d/PolygonEntity', 'frozen/box2d/MultiPolygonEntity', 'frozen/box2d/CircleEntity', 'Die', 'Meeple', 'MeeplePiece', 'dojo/domReady!'],
 function(GameCore, ResourceManager, keys, utils, Box, Rectangle, Polygon, MulitPolygon, Circle, Die, Meeple, MeeplePiece){

  

  
  var speed = 3;

  var rm = new ResourceManager();
  var backImg = rm.loadImage('images/background.png');
  var blueMeeple = rm.loadImage('images/blueMeeple.png');
  var redMeeple = rm.loadImage('images/redMeeple.png');
  var meepleOutline = rm.loadImage('images/meepleOutline.png');
  var clack = rm.loadSound('sounds/clack.wav');
  var scream = rm.loadSound('sounds/scream.wav');
  var meepSounds = [
    rm.loadSound('sounds/yipee.wav'),
    rm.loadSound('sounds/yahoo.wav'),
    rm.loadSound('sounds/wee.wav')
  ];


  var PLANK_FRICTION = 1.9;

  var RAND_POSITION_OFFSET = 40;
  var SOUND_IMPULSE_THRESHOLD = 0.5;
  var SOUND_IMPULSE_MAX = 50;

  var SOUND_IMPULSE_THRESHOLD_MEEP = 1;
  var SOUND_IMPULSE_MAX_MEEP = 50;
  var MIN_TIME_BETWEEN_DROPS = 4000;
  var PIECE_ALIVE_TIME = 5000;
  var LIVES = 3;

  var box;
  var world = {};
  var meeps = [];
  var resetGame = false;


  //pixels per meter for box2d
  var SCALE = 30.0;

  //objects in box2d need an id
  var geomId = 1;

  //shapes in the box2 world, locations are their centers
  var ground, ceiling, leftWall, centerWall, rightWall, plank;
  var spikeTriangles = [
    [{x:0, y:580}]
  ];

  var meepStartPoint = null;
  var meepEndPoint = null;
  var meepAngle = 0;
  var dropBox = [{x: 60, y: 95}, {x: 330, y: 190}];
  var lastMeepDrop = 4000;
  var score = 0;
  var deathCount = 0;

  var spikePoints = [
    [{x: 0, y: 580}, {x: 25, y: 530}, {x: 50, y: 580}],
    [{x: 50, y: 580}, {x: 75, y: 530}, {x: 100, y: 580}],
    [{x: 100, y: 580}, {x: 125, y: 530}, {x: 150, y: 580}],
    [{x: 150, y: 580}, {x: 175, y: 530}, {x: 200, y: 580}],
    [{x: 200, y: 580}, {x: 225, y: 530}, {x: 250, y: 580}],
    [{x: 250, y: 580}, {x: 275, y: 530}, {x: 300, y: 580}],
    [{x: 300, y: 580}, {x: 325, y: 530}, {x: 350, y: 580}],
    [{x: 350, y: 580}, {x: 375, y: 530}, {x: 400, y: 580}]
  ];

  var spikes = [];
  var meepPieces = [];

  


  //create each of the shapes in the world
  ground = new Rectangle({
    id: geomId,
    x: 200 / SCALE,
    y: 600 / SCALE,
    halfWidth: 1000 / SCALE,
    halfHeight: 20 / SCALE,
    staticBody: true,
    friction: 0.05
  });
  world[geomId] = ground; //keep a reference to the shape for fast lookup

  geomId++;
  celing = new Rectangle({
    id: geomId,
    x: 385 / SCALE,
    y: -200 / SCALE,
    halfWidth: 1000 / SCALE,
    halfHeight: 40 / SCALE,
    staticBody: true
  });
  world[geomId] = celing;
  

  geomId++;
  leftWall = new Rectangle({
    id: geomId,
    x: -60 / SCALE,
    y: 0 / SCALE,
    halfWidth: 20 / SCALE,
    halfHeight: 580 / SCALE,
    staticBody: true,
    spike: true
  });
  world[geomId] = leftWall;


  geomId++;
  rightWall = new Rectangle({
    id: geomId,
    x: 460 / SCALE,
    y: 0 / SCALE,
    halfWidth: 20 / SCALE,
    halfHeight: 580 / SCALE,
    staticBody: true,
    spike: true
  });
  world[geomId] = rightWall;

  geomId++;
  plank = new Polygon({
    id: geomId,
    restitution: 0.1,
    points: utils.scalePoints([{x: 100, y: 420},{x: 300, y: 420},{x: 274, y: 440},{x: 124, y: 440}], 1/SCALE),
    staticBody: true,
    friction: PLANK_FRICTION
  });
  world[geomId] = plank;

  spikePoints.forEach(function(spikePointGroup){
    geomId++;
    var spike = new Polygon({
      id: geomId,
      staticBody: true,
      spike: true,
      points: utils.scalePoints(spikePointGroup, 1/SCALE)
    });
    world[geomId] = spike;
    spikes.push(spike);
  });





 var reloadBox = function(){

    // create our box2d instance
    box = new Box({intervalRate:60, adaptive:false, width:game.canvas.width, height:game.canvas.height, scale:SCALE, gravityY:9.8, resolveCollisions: true});
 
    box.addBody(ground);
    box.addBody(celing);
    box.addBody(leftWall);
    box.addBody(rightWall);
    box.addBody(plank);

    spikes.forEach(function(spike){
      box.addBody(spike);
    });

 };

  //setup a GameCore instance
  var game = new GameCore({
    canvasId: 'canvas',
    gameAreaId: 'gameArea',
    canvasPercentage: 0.95,
    resourceManager: rm,
    initInput: function(im){
      //tells the input manager to listen for key events
      im.addKeyAction('W');
      im.addKeyAction('A');
      im.addKeyAction('S');
      im.addKeyAction('D');

      im.addKeyAction(keys.SPACE, true);

    },
    handleInput: function(im){
      
      if(meeps[0]){
        if(im.keyActions['A'].isPressed()){
          box.applyImpulseDegrees(meeps[0].id, 270, speed);
        }

        if(im.keyActions['D'].isPressed()){
          box.applyImpulseDegrees(meeps[0].id, 90, speed);
        }

        if(im.keyActions['W'].isPressed()){
          box.applyImpulseDegrees(meeps[0].id, 0, speed);
        }

        if(im.keyActions['S'].isPressed()){
          box.applyImpulseDegrees(meeps[0].id, 180, speed);
        }
      }



      if(!meepStartPoint && (im.mouseAction.isPressed() || im.touchAction.isPressed()) && (lastMeepDrop > MIN_TIME_BETWEEN_DROPS)){
        //check if in box
        var startPoint;
        if(im.touchAction.isPressed()){
          startPoint = im.touchAction.position;
        }else{
          startPoint = im.mouseAction.position;
        }

        if((startPoint.x >= dropBox[0].x) && (startPoint.y >= dropBox[0].y) && (startPoint.x <= dropBox[1].x) && (startPoint.y <= dropBox[1].y)){
          meepStartPoint = startPoint;
          meepEndPoint = startPoint;
          meepAngle = 0;
        }

      }else if(meepStartPoint && (im.mouseAction.isPressed() || im.touchAction.isPressed())){
        var endPoint;
        if(im.touchAction.isPressed()){
          endPoint = im.touchAction.position;
        }else{
          endPoint = im.mouseAction.position;
        }
        meepEndPoint = endPoint;
        meepAngle = utils.radiansFromCenter(meepStartPoint, meepEndPoint);
      }else if(meepStartPoint && !(im.mouseAction.isPressed() || im.touchAction.isPressed())){
        //mouse touch was released

        //if inside canvas:
        if((meepEndPoint.x >= 0) && (meepEndPoint.y >= 0) && (meepEndPoint.x <= this.canvas.width) && (meepEndPoint.y <= this.canvas.height)){
          //drop a meeple!
          geomId++;
          var newMeep = new Meeple({
            id: geomId,
            img: (geomId % 2 === 0) ? blueMeeple : redMeeple
          });
          meeps.push(newMeep);
          world[geomId] = newMeep;
          box.addBody(newMeep);
          box.setPosition(newMeep.id, meepStartPoint.x / SCALE, meepStartPoint.y / SCALE);
          box.setAngle(newMeep.id, meepAngle);
          meepStartPoint = null;
          meepEndPoint = null;
          rm.playSound(meepSounds[Math.floor(Math.random() * 3)], false, 0);
          lastMeepDrop = 0;
          score++;
        }else{
          meepStartPoint = null;
          meepEndPoint = null;
        }
      }

    },
    update: function(millis){
      
      //have box2d do an interation
      box.update(millis);
      //have update local objects with box2d calculations
      box.updateExternalState(world);

      lastMeepDrop+= millis;

      var alivePieces = [];
      meepPieces.forEach(function(piece){
        if(piece.aliveTime === 0){
          box.applyImpulseDegrees(piece.id, 0, 0.7);
        }
        piece.aliveTime+= millis;

        if(piece.aliveTime > PIECE_ALIVE_TIME){
          piece.dead = true;
          box.removeBody(piece.id);
          delete world[piece.id];
        }else{
          alivePieces.push(piece);
        }
      });

      meepPieces = alivePieces;

      var aliveMeeps = [];
      meeps.forEach(function(meep){
        if(meep.collisions){
          meep.collisions.forEach(function(collision){
            
            if(world[collision.id] && world[collision.id].spike){
              rm.playSound(scream);
              if(!meep.dead){
                meep.dead = true;
                box.removeBody(meep.id);
                delete world[meep.id];
                score--;
                deathCount++;
                if(deathCount == LIVES){
                  resetGame = true;
                }
                meep.polys.forEach(function(poly){
                  geomId++;
                  var meepPiece = new MeeplePiece({
                    id: geomId,
                    points: poly,
                    angle: meep.angle,
                    color: (meep.img === redMeeple) ? '#F00' : '#00F'
                  });
                  box.addBody(meepPiece);
                  box.setPosition(meepPiece.id, meep.x, meep.y);
                  world[geomId] = meepPiece;
                  meepPieces.push(meepPiece);
                });
              }
              
            }else if(collision.impulse > SOUND_IMPULSE_THRESHOLD_MEEP){
                var gain = Math.min(collision.impulse, SOUND_IMPULSE_MAX_MEEP) / SOUND_IMPULSE_MAX_MEEP;
                rm.playSound(clack, false, 0, gain);
                meep.lastSound = 0;
                //console.log(collision.impulse, gain);
            }
          });
        }
      });

      meeps.forEach(function(meep){
        if(!meep.dead){
          aliveMeeps.push(meep);
        }
      });
        
      meeps = aliveMeeps;

      if(resetGame){
        score = 0;
        deathCount = 0;
        meeps.forEach(function(meep){
          box.removeBody(meep.id);
          delete world[meep.id];
        });
        resetGame = false;
        meeps = [];
      }
      

    },
    draw: function(context){
      context.drawImage(backImg, 0, 0, this.width, this.height);
      ground.draw(context, SCALE);
      leftWall.draw(context, SCALE);
      rightWall.draw(context, SCALE);
      //plank1.draw(context, SCALE);

      meeps.forEach(function(meep){
        meep.draw(context, SCALE);
      });

      meepPieces.forEach(function(meep){
        meep.draw(context, SCALE);
      });

      if(lastMeepDrop > MIN_TIME_BETWEEN_DROPS){
        context.lineWidth = 2;
        context.strokeStyle = '#FF0';
        context.strokeRect(dropBox[0].x, dropBox[0].y, dropBox[1].x - dropBox[0].x, dropBox[1].y - dropBox[0].y);
      }

      if(meepStartPoint){
        context.save();
        context.translate(meepStartPoint.x, meepStartPoint.y);
        context.rotate(meepAngle);
        context.translate(-(meepStartPoint.x), -(meepStartPoint.y));
        context.drawImage(meepleOutline, meepStartPoint.x - 20, meepStartPoint.y - 20);
        context.restore();
      }

      if(score){
        context.lineWidth = 2;
        context.fillStyle = '#FF0';
        context.strokeStyle = '#000';
        context.font = '40px';
        context.fillText(score, 10, 42);
        context.strokeText(score, 10, 42);
      }

      if(deathCount){
        context.lineWidth = 2;
        context.fillStyle = '#F00';
        context.strokeStyle = '#000';
        context.font = '40px';
        context.fillText(deathCount, 360, 42);
        context.strokeText(deathCount, 360, 42);
      }
      
    }
  });

  //if you want to take a look at the game object in dev tools
  console.log(game);

 

  //launch the game!
  game.run();

   reloadBox();
});
