var createScene = function(canvas, engine) {

  // image resources for textures
  var urlRoof = "http://jerome.bousquie.fr/BJS/images/rooftile2.jpg";
  var urlWall = "http://jerome.bousquie.fr/BJS/images/stonewall.jpg";
  var urlGrass = "http://jerome.bousquie.fr/BJS/images/grass.jpg";
  var urlSkyBox = "http://jerome.bousquie.fr/BJS/images/skybox/skybox";

  // let's create a scene with a hemispheric light
  var scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color3( .4, .6, 1);
  var light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0.2), scene);
  light.intensity = 0.7;

  // then the sky with a Skybox
  var skybox = BABYLON.Mesh.CreateBox("skyBox", 2000.0, scene, false, BABYLON.Mesh.BACKSIDE);
  var skyboxMaterial = new BABYLON.StandardMaterial("skyBox", scene);
  skyboxMaterial.reflectionTexture = new BABYLON.CubeTexture(urlSkyBox, scene);
  skyboxMaterial.reflectionTexture.coordinatesMode = BABYLON.Texture.SKYBOX_MODE;
  skyboxMaterial.diffuseColor = new BABYLON.Color3(0, 0, 0);
  skyboxMaterial.specularColor = new BABYLON.Color3(0, 0, 0);
  skybox.material = skyboxMaterial;

  // then the ground with a textured big disc
  var ground = BABYLON.Mesh.CreateDisc("ground", 800, 60, scene);
  ground.rotation.x = Math.PI / 2;
  var matGround = new BABYLON.StandardMaterial("mg", scene);
  ground.material = matGround;
  var groundTexture = new BABYLON.Texture(urlGrass, scene);
  groundTexture.uScale = 100;
  groundTexture.vScale = 100;
  matGround.diffuseTexture = groundTexture;
  matGround.specularColor = BABYLON.Color3.Black();

  // Now we will draw the roller coaster rails
  // We set a closed curve by concatenating 5 different curves :
  // 1 - a set of three chained loops
  // 2 - a  left turn
  // 3 - a hill
  // 4 - a  right turn
  // 5 - a tiny hermite spline to close the curve
  // curve computation ============================================
  var points;
  var continued;
  var x, y, z;

  // loops : cosinus and sinus
  var loops = [];
  var nbpt = 200;
  var pi6 = Math.PI * 6;
  for (var lp = 0; lp < nbpt; lp++) {
    x = lp - nbpt / 2  + (nbpt / 5 -  lp /  8) * Math.cos(pi6 * lp / nbpt);
    y = nbpt / 5  + (nbpt / 5  - lp / 8) * Math.sin(pi6 * lp / nbpt);
    z = lp - nbpt;
    loops.push(new BABYLON.Vector3(x, y, z));
  }

  // first turn : cosinus and sinus
  var turn1 = [];
  var ang = Math.PI ;
  nbpt = 40;
  for (var tp = 0; tp < nbpt; tp++) {
    x = 30 * Math.cos(ang * tp / nbpt - 0.8);
    y = 30 * Math.sin(ang * tp / nbpt);
    z = 30 * Math.sin(ang * tp / nbpt - 0.8);
    turn1.push(new BABYLON.Vector3(x, y, z));
  }

  // hill : exponential
  var hill = [];
  nbpt = 80;
  for (var hp = 0; hp < nbpt; hp++) {
    x =  - hp * 2;
    y =  80 * Math.exp(-(hp - nbpt/3) * (hp - nbpt/3) / (nbpt * 5));
    z = - hp * 3.2;
    hill.push(new BABYLON.Vector3(x, y, z));
  }

  // second turn : cosinus and sinus
  var turn2 = [];
  nbpt = 60;
  ang = -Math.PI * 3 / 2;
  for (tp = 0; tp < nbpt; tp++) {
    x = 30 * Math.cos(ang * tp / nbpt - 0.6);
    y = - tp / 2.5;
    z = 30 * Math.sin(ang * tp / nbpt - 0.6);
    turn2.push(new BABYLON.Vector3(x, y, z));
  }

  // close rails with hermite
  var curloops = new BABYLON.Curve3(loops);
  var curturn1 = new BABYLON.Curve3(turn1);
  var curhill = new BABYLON.Curve3(hill);
  var curturn2 = new BABYLON.Curve3(turn2);
  continued = (curloops).continue(curturn1).continue(curhill).continue(curturn2);
  points = continued.getPoints();
  
  var p1 = points[points.length - 1];
  var t1 = (p1.subtract(points[points.length - 2])).scale(10);
  var p2 = points[0];
  var t2 = (points[1].subtract(p2)).scale(30);
  var hermite = BABYLON.Curve3.CreateHermiteSpline(p1, t1, p2, t2, 15);

  // full final curve
  continued = hermite.continue(continued);
  points = continued.getPoints();
  // curve computed ===========================================

  // let's now define a simple triangular shape for the rails
  var shape = [
    new BABYLON.Vector3(0, 2, 0),
    new BABYLON.Vector3(-1, 0, 0),
    new BABYLON.Vector3(0, -2, 0),
  ];
  shape.push(shape[0]);

  // Let's now extrude this shape along the curve to draw
  // the whole roller coaster
  var origin = BABYLON.Vector3.Zero();
  var rollerCoaster = BABYLON.Mesh.ExtrudeShape("rc", shape, points, 2, 0, BABYLON.Mesh.NO_CAP, scene);
  var mat = new BABYLON.StandardMaterial("mat1", scene);
  mat.diffuseColor = new BABYLON.Color3(1, 0.8, 1.0);
  mat.wireframe = true;
  rollerCoaster.material = mat;
  rollerCoaster.position = origin;

  // As the first and final extruded shape may not fit along
  // a closed curve, we hide this junction with a little house
  var house = BABYLON.Mesh.CreateBox("house", 10, scene);
  house.scaling.x = 2;
  house.scaling.z = 1.5;
  house.rotation.y = 0.6;
  house.position = points[0];
  var roof = BABYLON.Mesh.CreateCylinder("roof", 22, 20, 20, 3, 1, scene);
  roof.rotation.y = house.rotation.y;
  roof.rotation.z = Math.PI / 2;
  roof.position.x = house.position.x;
  roof.position.y = 12;
  roof.position.z = house.position.z;
  var wallTexture = new BABYLON.Texture(urlWall, scene);
  var houseMat = new BABYLON.StandardMaterial("housemat", scene);
  houseMat.diffuseTexture = wallTexture;
  house.material = houseMat;
  var roofTexture = new BABYLON.Texture(urlRoof, scene);
  roofTexture.uScale = 10;
  roofTexture.vScale = 5;
  var roofMat = new BABYLON.StandardMaterial("roofmat", scene);
  roofMat.diffuseTexture = roofTexture;
  roof.material = roofMat;
  roof.material.specularColor = BABYLON.Color3.Black();

  
  // All immobile meshes can be now frozen to avoid
  // un-needed matrix computations
  skybox.freezeWorldMatrix();
  ground.freezeWorldMatrix();
  house.freezeWorldMatrix();
  roof.freezeWorldMatrix();

  // We've got the rails, we need now a wagon !
  var wagon = BABYLON.Mesh.CreateBox("wagon", 4, scene);
  wagon.scaling.x = 2;
  var matWagon = new BABYLON.StandardMaterial("mw", scene);
  matWagon.diffuseColor = new BABYLON.Color3(1, 0, .8);
  wagon.material = matWagon;
  wagon.position = origin;
  
  // Just in case you want to set the roller coaster somewhere else
  // translate the relative curve points to the same origin than the mesh
  var lg = points.length;
  for (var pt = 0; pt < lg; pt++) {
    points[pt].addInPlace(origin);
  }
  
  // Let's add a Follow Camera.
  // It is set initially very far from the roller-coaster
  // in order to get an "approach"" effect on start 
  var followCam = new BABYLON.FollowCamera("fcam", new BABYLON.Vector3(20, 200, -800), scene);
  followCam.lockedTarget = wagon;
  followCam.radius = 50;
  followCam.maxCameraSpeed = 1;
  scene.activeCamera = followCam;

  // All the meshes and the cam are set, so now let's handle the wagon trajectory
  // Let's create a Path3D object with the curve
  var path3d = new BABYLON.Path3D(points);
  var tgts = path3d.getTangents();
  var norms = path3d.getNormals();
  var binorms = path3d.getBinormals();
  
  // let's scale the normals, where the wagon will be attached, 
  // to be a little farther from the rails
  var shift = 2;
  for (var n = 0; n < lg; n++) {
    norms[n].scaleInPlace(shift);
  }

  
  // let's initialize now some variables for updating
  // the wagon position each frame
  var i = 0; // curve current point 
  var j = 1; // curve next current point
  var curvect = points[j].subtract(points[i]); // curve current segment
  var rot = BABYLON.Vector3.RotationFromAxis(tgts[i], norms[i], binorms[i]);  // wagon current rotation
  var pos = BABYLON.Vector3.Zero(); // wagon current position
  var scaled = BABYLON.Vector3.Zero(); // current scaled segment
  var step = 3;   // nb steps on each segment
  var k = 0;      // counter


  // Animation
  // the wagon slides many steps on each curve segment
  scene.registerBeforeRender(function () {
  curvect.scaleToRef(k / step, scaled);
    points[i].addToRef(scaled, pos);
    pos.addInPlace(norms[i]);
    wagon.position = pos;
    wagon.rotation = rot;
    k++;
    // next segment
    if (k == step) {
      i = (i + 1) % lg;
      j = (i + 1) % lg;
      rot = BABYLON.Vector3.RotationFromAxis(tgts[i], norms[i], binorms[i]);
      points[j].subtractToRef(points[i], curvect);
      k = 0;
    if (i == 0) {
      followCam.radius = 50 + 200 * Math.random();
    }
    }
  });
  return scene;
};




var init = function() {
  var canvas = document.querySelector('#renderCanvas');
  var engine = new BABYLON.Engine(canvas, true);
  var scene = createScene(canvas, engine);
  window.addEventListener("resize", function() {
    engine.resize();
  });

  engine.runRenderLoop(function(){
    scene.render();
  });
};

