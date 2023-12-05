/*
Jake Kravas
this file is responsible for the game's functionality,
such as moving the player's ship, shooting projectiles,
spawning asteroids, handling collisions, and handling scoring
*/

const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
let levelUpSound = new Audio('audio/level_up.m4a')
let gameInPlay = false;
let gameOver = true;
let score = 0;
let level = 1;

let currentFps;
let desiredFps = 60;
let speedAdjustment;
let backgroundColor = 'black';
let shipOuterColor = 'white';
let shipInnerColor = 'cyan';
let projectileColor = 'white';
let asteroidColor = 'white';
let lvlUpTextAnimation = true;
let lvlUpFlashAnimation = true;
let soundEnabled = true;
let volume = 1.0;

const SPEED = 4;
const ROTATIONAL_SPEED = 0.1;
const FRICTION = 0
const PROJECTILE_SPEED = 7;
let asteroidSpawnInterval = 1000;

let projectiles = [];
let asteroids = [];
let asteroidIntervalId;

let asteroidVelocity = 1;

const startButton = document.getElementById('start-btn');
const settingsButton = document.getElementById('settings-btn');
const pauseButton = document.getElementById('pause-btn');
const resumeButton = document.getElementById('resume-btn');

// startButton.addEventListener('click', function() {
//     // c.fillStyle = backgroundColor;
//     // c.fillRect(0, 0, canvas.width, canvas.height); // x, y, width, height
//     if (!gameOver) {
//       startButton.blur()
//       gameInPlay = true;
//       animate();
//       spawnAsteroids();

//       document.getElementById('start-btn').style.display = 'none';
//       document.getElementById('settings-btn').style.display = 'none';
//       document.getElementById('pause-btn').style.display = 'initial';
//       document.getElementById('resume-btn').style.display = 'none';
//     }
// });

function startNewGame() {
    gameOver = false;
    projectiles = [];
    asteroids = [];
    score = 0;
    level = 1;
    asteroidVelocity = 1;

    player.position.x = canvas.width / 2;
    player.position.y = canvas.height / 2;


    startButton.blur()
    gameInPlay = true;
    animate();
    spawnAsteroids();

    document.getElementById('current-score').innerText = 0;
    document.getElementById('level').innerText = 1;

    toggleMenuButtons('play')
    // document.getElementById('start-btn').style.display = 'none';
    // document.getElementById('settings-btn').style.display = 'none';
    // document.getElementById('resume-btn').style.display = 'none';
    // document.getElementById('pause-btn').style.display = 'initial';

}


// get framerate of user's device (needed)
const getFPS = () =>
  new Promise(resolve =>
    requestAnimationFrame(t1 =>
      requestAnimationFrame(t2 => resolve(1000 / (t2 - t1)))
    )
  )

// Calling the function to get the FPS
getFPS().then(fps => {
  // console.log(fps)
  currentFps = Math.round(fps);
  speedAdjustment = desiredFps / currentFps;
  // console.log(speedAdjustment)
});

const gameOverSound = new Audio('audio/game-over.mp3')

class Player {
  constructor({ position, velocity }) {
    this.position = position; // {x, y}
    this.velocity = velocity;
    this.rotation = 0;
  }


  // draw player's ship
  draw() {
    c.save();

    c.translate(this.position.x, this.position.y);
    c.rotate(this.rotation);
    c.translate(-this.position.x, -this.position.y);

    c.beginPath();
    c.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
    c.fillStyle = shipInnerColor;
    c.fill()
    c.closePath();

    c.beginPath();
    c.moveTo(this.position.x + 30, this.position.y);
    //note: for canvas, when you're going down, you're ADDING y vals, when going up, SUBTRACTING y vals
    c.lineTo(this.position.x - 10, this.position.y - 10);
    c.lineTo(this.position.x - 10, this.position.y + 10); 
    c.closePath();

    c.strokeStyle = shipOuterColor;
    c.stroke();
    c.restore();
  }

  // move player's ship based on velocity
  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
  }

  getVertices() {
    const cos = Math.cos(this.rotation)
    const sin = Math.sin(this.rotation)
  
    return [
      {
        x: this.position.x + cos * 30 - sin * 0,
        y: this.position.y + sin * 30 + cos * 0,
      },
      {
        x: this.position.x + cos * -10 - sin * 10,
        y: this.position.y + sin * -10 + cos * 10,
      },
      {
        x: this.position.x + cos * -10 - sin * -10,
        y: this.position.y + sin * -10 + cos * -10,
      },
    ]
  }
}

function triangleCircleCollision(triangleVertices, circle) {

  for (let i = 0; i < triangleVertices.length; i++) {
    let xDifference = circle.position.x - triangleVertices[i].x;
    let yDifference = circle.position.y - triangleVertices[i].y;

    // pythagorean theorem to get distance between center of circle and triangle vertice
    let distance = Math.sqrt((xDifference * xDifference) + (yDifference * yDifference));

    // if distance <= sum of both radiuses, they must be touching
    // if (distance <= circle.radius) {
    if (distance < circle.radius) {
      if (soundEnabled) {
        gameOverSound.volume = volume;
        gameOverSound.play();
      }
      return true;
    }
  }

  return false;

}

class Projectile {
  constructor({ position, velocity }) {
    this.position = position
    this.velocity = velocity
    this.radius = 5
  }

  // draw projectile (thing user shoots)
  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.closePath()
    // c.fillStyle = 'white'
    c.fillStyle = projectileColor
    c.fill()
  }

  // move projectile based on velicty
  update () {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

class Asteroid {
  constructor({ position, velocity, radius }) {
    this.position = position
    this.velocity = velocity
    this.radius = radius
  }

  // draw asteroid
  draw() {
    c.beginPath()
    c.arc(this.position.x, this.position.y, this.radius, 0, Math.PI * 2, false)
    c.closePath()
    // c.strokeStyle = 'white'
    c.strokeStyle = asteroidColor
    c.stroke()
  }

  // move asteroid based on velocity
  update () {
    this.draw()
    this.position.x += this.velocity.x
    this.position.y += this.velocity.y
  }
}

const player = new Player({
  position: {x: canvas.width / 2, y: canvas.height / 2},
  velocity: {x: 0, y: 0}
});

// player.draw();

const keys = {
  w: {
    pressed: false
  },
  a: {
    pressed: false
  },
  d: {
    pressed: false
  },
}

// let asteroidVelocityLowerRange = 1;
// let asteroidVelocityUpperRange = 2;

function spawnAsteroids() {
  // spawn asteroids
  // const asteroidIntervalId = window.setInterval(() => {
  asteroidIntervalId = window.setInterval(() => {
    const randomDirection = Math.floor(Math.random() * 4); // random # 0-3
  
    let x, y;
    let vx, vy; //vel x, vel y
    let randomRadius = 50 * Math.random() + 10
  
    // make asteroid come in from left/right/top/bottom based on randomDirection
    switch (randomDirection) {
      case 0: // left side of screen
        x = 0 - randomRadius;
        y = Math.random() * canvas.height;
        vx = asteroidVelocity * speedAdjustment;
        vy = 0;
        break;
      case 1: // bottom of screen
        x = Math.random() * canvas.width;
        y = canvas.height + randomRadius;
        vx = 0;
        vy = -asteroidVelocity * speedAdjustment;
        break;
      case 2: // right side of screen
        x = canvas.width + randomRadius;
        y = Math.random() * canvas.height;
        vx = -asteroidVelocity * speedAdjustment;
        vy = 0;
        break;
      case 3: // top of screen
        x = Math.random() * canvas.width;
        y = 0 - randomRadius;
        vx = 0;
        vy = asteroidVelocity * speedAdjustment;
        break;
    }
  
    asteroids.push(new Asteroid({
      position: {
        x: x,
        y: y,
      },
      velocity: {
        x: vx,
        y: vy
      },
      // radius
      radius: randomRadius
    }));
    console.log('NEW ASTEROID')
  
    // console.log(asteroids)
  }, asteroidSpawnInterval);
}


// returns true/false of whether two circles are touching
function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;

  // pythagorean theorem to get distance between centers of circle1 and circle2
  const distance = Math.sqrt((xDifference * xDifference) + (yDifference * yDifference));

  // if distance <= sum of both radiuses, they must be touching
  if (distance <= circle1.radius + circle2.radius) {

    let hitSound = new Audio('audio/hit.m4a')
    if (soundEnabled) {
      hitSound.volume = volume;
      hitSound.play()
    }
    score++;
    document.getElementById('current-score').innerText = score;

    // level up
    if (score % 2 == 0) {
      handleLevelUp();
    }
    
    return true;
    }
    return false;
}

function handleLevelUp() {
  // clear asteroids
  asteroids = [];
  // increase level
  level++;

  if (soundEnabled) {
    levelUpSound.volume = volume;
    levelUpSound.play()
  }

  asteroidVelocity++;
  // asteroidVelocityLowerRange++;
  // asteroidVelocityUpperRange++;


  // update text display of level counter
  document.getElementById('level').innerText = level;

  if (lvlUpFlashAnimation) {
    let body = document.querySelector('body');
    body.style.animation = 'flashAnimation 1s ease';
  
    // Remove the animation property after it's complete
    setTimeout(function() {
      body.style.animation = '';
    }, 1000);
  }

  if (lvlUpTextAnimation) {
    let gif = document.getElementById('level-up-gif');
    gif.style.marginBottom = '0';
  
    // Remove the animation property after it's complete
    setTimeout(function() {
      gif.style.marginBottom = '-80px';
    }, 2000);
  }

}

let animationId;

function animate() {
  // const animationId = window.requestAnimationFrame(animate);
  animationId = window.requestAnimationFrame(animate);
  // c.fillStyle = 'black';
  c.fillStyle = backgroundColor;
  c.fillRect(0, 0, canvas.width, canvas.height); // x, y, width, height
  
  player.update();

  for(let i = projectiles.length - 1; i >= 0; i--) {
    const projectile =  projectiles[i];
    projectile.update();

    // if projectile is off screen, remove it from array
    if (projectile.position.x + projectile.radius < 0
      || projectile.position.x - projectile.radius > canvas.width
      || projectile.position.y - projectile.radius > canvas.height
      || projectile.position.y + projectile.radius < 0
      ) {
      projectiles.splice(i, 1);
    }
  }

  // asteroid management
  for(let i = asteroids.length - 1; i >= 0; i--) {
    const asteroid =  asteroids[i];
    asteroid.update();
    

    if (triangleCircleCollision(player.getVertices(), asteroid)) {
      handleGameOver();
    }

    // if projectile is off screen, remove it from array
    if (asteroid.position.x + asteroid.radius < 0
      || asteroid.position.x - asteroid.radius > canvas.width
      || asteroid.position.y - asteroid.radius > canvas.height
      || asteroid.position.y + asteroid.radius < 0
      ) {
      asteroids.splice(i, 1);
    }

    // for each asteroid, check every projectile and see if they're colliding
    for(let j = projectiles.length - 1; j >= 0; j--) {
      const projectile = projectiles[j];

      if (circleCollision(asteroid, projectile)) {
        // console.log(asteroid)
        console.log('HIT')
        asteroids.splice(i, 1);
        projectiles.splice(j, 1);
      }
    }

    // if (player.position.x < projectile.position.x)
    // console.log('ASTEROID X: ' + asteroid.position.x)
    // console.log('ASTEROID Y: ' + asteroid.position.y)
    // console.log('PLAYER X: ' + player.position.x)
    // console.log('PLAYER Y: ' + player.position.y)

    let asteroidRadiusRange = asteroid.radius;
    // console.log('RR: ' + asteroidRadiusRange)

    if (
      player.position.x <= asteroid.position.x + asteroid.radius
      && player.position.x >= asteroid.position.x - asteroid.radius
      && player.position.y >= asteroid.position.y - asteroid.radius
      && player.position.y <= asteroid.position.y + asteroid.radius
    ) {

      console.log('GAME OVER')

    }

  }
  

  // player.velocity.x = 0;
  // player.velocity.y = 0;
  if (keys.w.pressed) {

    // forward speed
    player.velocity.x = Math.cos(player.rotation) * SPEED * speedAdjustment;
    player.velocity.y = Math.sin(player.rotation) * SPEED * speedAdjustment;

  // if accelerate key is released, decelerate ship
  } else if (!keys.w.pressed) {
    player.velocity.x *= FRICTION;
    player.velocity.y *= FRICTION;
  }

  // rotate speed
  if (keys.d.pressed) player.rotation += ROTATIONAL_SPEED * speedAdjustment;
  else if (keys.a.pressed) player.rotation -= ROTATIONAL_SPEED * speedAdjustment;


}

// animate();

window.addEventListener('keydown', event => {

  if (gameInPlay) {
    // console.log(event.code)
  
  
    // move player's ship up/left/right
    if (event.code == 'KeyW' || event.code == 'ArrowUp') {
      event.preventDefault() // prevent automatic scroll-down
      keys.w.pressed = true;
    } else if (event.code == 'KeyA' || event.code == 'ArrowLeft') {
      event.preventDefault() // prevent automatic scroll-down
      keys.a.pressed = true;
    } else if (event.code == 'KeyD' || event.code == 'ArrowRight') {
      event.preventDefault() // prevent automatic scroll-down
      keys.d.pressed = true;
    } else if (event.code == 'Space') {
      event.preventDefault() // prevent automatic scroll-down
      const shootSound = new Audio('audio/shoot.mp3');
      // shootSound.volume = 1.0
      // const shootSound = new Audio('audio/shoott.m4a');
      shootSound.pause();
  
      projectiles.push(new Projectile({
        position: {
          x: player.position.x + Math.cos(player.rotation) * 30,
          y: player.position.y + Math.sin(player.rotation) * 30,
        },
        velocity: {
          x: Math.cos(player.rotation) * PROJECTILE_SPEED * speedAdjustment,
          y: Math.sin(player.rotation) * PROJECTILE_SPEED * speedAdjustment
        }
      }));
  
      if (soundEnabled) {
        shootSound.volume = volume;
        shootSound.play();
      }
    } else if (event.code == 'KeyG') {
      console.log(player.getVertices())
      // console.log(player);
    }
  }

});

window.addEventListener('keyup', event => {

  if (event.code == 'KeyW' || event.code == 'ArrowUp') {
    keys.w.pressed = false;

  } else if (event.code == 'KeyA' || event.code == 'ArrowLeft') {
    keys.a.pressed = false;
    
  } else if (event.code == 'KeyD' || event.code == 'ArrowRight') {
    keys.d.pressed = false;
    
  }
});


function handleGameOver() {
  console.log('GAME OVER');
  window.cancelAnimationFrame(animationId);
  clearInterval(asteroidIntervalId);
  gameInPlay = false;
  gameOver = true;
  // gameOver = true;
  toggleMenuButtons('game over');
}



function onSettingsChange() {

  backgroundColor = document.getElementById('background-color').value;
  shipInnerColor = document.getElementById('ship-inner-color').value;
  shipOuterColor = document.getElementById('ship-outer-color').value;
  projectileColor = document.getElementById('projectile-color').value;
  asteroidColor = document.getElementById('asteroid-color').value;
  lvlUpTextAnimation = document.getElementById('enable-lvl-up-text-animation').checked;
  lvlUpFlashAnimation = document.getElementById('enable-lvl-up-flash-animation').checked;
  soundEnabled = document.getElementById('enable-sound').checked;
  volume = document.getElementById('volume').value / 100;

  if (!soundEnabled) {
    document.getElementById('volume').disabled = true;
  } else {
    document.getElementById('volume').disabled = false;
  }

  console.log(volume);

}

function resetSettings() {

  document.getElementById('background-color').value = 'black';
  document.getElementById('ship-outer-color').value = 'white';
  document.getElementById('ship-inner-color').value = 'cyan';
  document.getElementById('projectile-color').value = 'white';
  document.getElementById('asteroid-color').value = 'white';
  document.getElementById('enable-lvl-up-text-animation').checked = true;
  document.getElementById('enable-lvl-up-flash-animation').checked = true;
  document.getElementById('enable-sound').checked = true;
  document.getElementById('volume').value = 100;
  document.getElementById('volume').disabled = false;

  backgroundColor = 'black';
  shipOuterColor = 'white';
  shipInnerColor = 'cyan';
  projectileColor = 'white';
  asteroidColor = 'white';
  soundEnabled = true;
  lvlUpTextAnimation = true;
  lvlUpFlashAnimation = true;
}

// function displayGame() {
//   document.getElementById('settings').style.display = 'none';
//   document.getElementById('asteroids-canvas').style.display = 'initial';
//   if (gameOver) {
//     toggleMenuButtons('game over');
//   } else {
//     toggleMenuButtons('pause');
//   }
// }

// function displaySettings() {
//   document.getElementById('asteroids-canvas').style.display = 'none';
//   document.getElementById('settings').style.display = 'initial';
//   toggleMenuButtons('settings');
// }

function displayGame() {
  document.getElementById('settings').style.display = 'none';
  document.getElementById('score-zone').style.display = 'flex';
  document.getElementById('asteroids-canvas').style.display = 'initial';

  if (gameOver) {
    toggleMenuButtons('game over');
  } else {
    toggleMenuButtons('pause');
  }

}

function displaySettings() {
  document.getElementById('asteroids-canvas').style.display = 'none';
  document.getElementById('score-zone').style.display = 'none';
  document.getElementById('settings').style.display = 'initial';
  toggleMenuButtons('settings');
}



function resumeGame() {
  animate();
  spawnAsteroids();
  gameInPlay = true;
  
  toggleMenuButtons('play');
}

function pauseGame() {
  window.cancelAnimationFrame(animationId)
  clearInterval(asteroidIntervalId)
  gameInPlay = false;

  toggleMenuButtons('pause');

}

function toggleMenuButtons(view) {
  if (view == 'play') {
    console.log('ASDFAs')
    // document.getElementById('start-btn').style.display = 'none';
    startButton.style.display = 'none';
    // document.getElementById('settings-btn').style.display = 'none';
    settingsButton.style.display = 'none';
    // document.getElementById('pause-btn').style.display = 'initial';
    pauseButton.style.display = 'initial';
    // document.getElementById('resume-btn').style.display = 'none';
    resumeButton.style.display = 'none';
  } else if (view == 'pause') {
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('settings-btn').style.display = 'initial';
    document.getElementById('resume-btn').style.display = 'initial';
  } else if (view == 'game over') {
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('resume-btn').style.display = 'none';
    document.getElementById('start-btn').style.display = 'initial';
    document.getElementById('settings-btn').style.display = 'initial';
  } else if (view == 'settings') {
    document.getElementById('start-btn').style.display = 'none';
    document.getElementById('pause-btn').style.display = 'none';
    document.getElementById('settings-btn').style.display = 'none';
    document.getElementById('resume-btn').style.display = 'none';
  }
}
