const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');
let score = 0;

// let shootSound = new Audio('audio/shoot.mp3');s

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

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
    c.fillStyle = 'cyan';
    c.fill()
    c.closePath();

    c.beginPath();
    c.moveTo(this.position.x + 30, this.position.y);
    //note: for canvas, when you're going down, you're ADDING y vals, when going up, SUBTRACTING y vals
    c.lineTo(this.position.x - 10, this.position.y - 10);
    c.lineTo(this.position.x - 10, this.position.y + 10); 
    c.closePath();

    c.strokeStyle = 'white';
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
  // console.log('TCC')
  // console.log(triangleVertices)

  for (let i = 0; i < triangleVertices.length; i++) {
    let xDifference = circle.position.x - triangleVertices[i].x;
    let yDifference = circle.position.y - triangleVertices[i].y;

    // pythagorean theorem to get distance between center of circle and triangle vertice
    let distance = Math.sqrt((xDifference * xDifference) + (yDifference * yDifference));

    // if distance <= sum of both radiuses, they must be touching
    if (distance <= circle.radius) {
      console.log('SHIP HAS BEEN HIT')
      gameOverSound.play();
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
    c.fillStyle = 'white'
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
    c.strokeStyle = 'white'
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

player.draw();

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

// const SPEED = 3;
// const ROTATIONAL_SPEED = 0.05;
// const FRICTION = 0.97
// const PROJECTILE_SPEED = 3;

const SPEED = 4;
const ROTATIONAL_SPEED = 0.1;
const FRICTION = 0
const PROJECTILE_SPEED = 7;
// const ASTEROID_SPEED = 4;
const ASTEROID_SPAWN_INTERVAL = 2000;

const projectiles = [];
const asteroids = [];

// spawn new asteroid every 3 seconds
window.setInterval(() => {
  const randomDirection = Math.floor(Math.random() * 4); // random # 0-3
  const randomVelocity = Math.floor(Math.random() * 5) + 2; // random # 2-6
  let x, y;
  let vx, vy; //vel x, vel y
  let randomRadius = 50 * Math.random() + 10

  // make asteroid come in from left/right/top/bottom based on randomDirection
  switch (randomDirection) {
    case 0: // left side of screen
      x = 0 - randomRadius;
      y = Math.random() * canvas.height;
      vx = randomVelocity;
      vy = 0;
      break;
    case 1: // bottom of screen
      x = Math.random() * canvas.width;
      y = canvas.height + randomRadius;
      vx = 0;
      vy = -randomVelocity;
      break;
    case 2: // right side of screen
      x = canvas.width + randomRadius;
      y = Math.random() * canvas.height;
      vx = -randomVelocity;
      vy = 0;
      break;
    case 3: // top of screen
      x = Math.random() * canvas.width;
      y = 0 - randomRadius;
      vx = 0;
      vy = randomVelocity;
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

  // console.log(asteroids)
}, ASTEROID_SPAWN_INTERVAL);


// returns true/false of whether two circles are touching
function circleCollision(circle1, circle2) {
  const xDifference = circle2.position.x - circle1.position.x;
  const yDifference = circle2.position.y - circle1.position.y;

  // pythagorean theorem to get distance between centers of circle1 and circle2
  const distance = Math.sqrt((xDifference * xDifference) + (yDifference * yDifference));

  // if distance <= sum of both radiuses, they must be touching
  if (distance <= circle1.radius + circle2.radius) {
    console.log('two have collided')
    return true;
  }

  return false;
}

// function getPlayerVertices() {
//   let vertice1 = {  }
// }

function animate() {
  // console.log(player.rotation)
  // console.log(player.position.x)
  // console.log(player.position.y)
  window.requestAnimationFrame(animate);

  c.fillStyle = 'black';
  // x, y, width, height
  c.fillRect(0, 0, canvas.width, canvas.height);
  
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
      console.log('GAME OVER')
      // window.cancelAnimationFrame(animationId)
      // clearInterval(intervalId)
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
    player.velocity.x = Math.cos(player.rotation) * SPEED;
    player.velocity.y = Math.sin(player.rotation) * SPEED;

  // if accelerate key is released, decelerate ship
  } else if (!keys.w.pressed) {
    player.velocity.x *= FRICTION;
    player.velocity.y *= FRICTION;
  }

  // rotate speed
  if (keys.d.pressed) player.rotation += ROTATIONAL_SPEED;
  else if (keys.a.pressed) player.rotation -= ROTATIONAL_SPEED;


}

animate();

window.addEventListener('keydown', event => {
  // console.log(event.code)


  // move player's ship up/left/right
  if (event.code == 'KeyW' || event.code == 'ArrowUp') {
    keys.w.pressed = true;
  } else if (event.code == 'KeyA' || event.code == 'ArrowLeft') {
    keys.a.pressed = true;
  } else if (event.code == 'KeyD' || event.code == 'ArrowRight') {
    keys.d.pressed = true;
  } else if (event.code == 'Space') {
    const shootSound = new Audio('audio/shoot.mp3');
    // const shootSound = new Audio('audio/shoott.m4a');
    shootSound.pause();

    projectiles.push(new Projectile({
      position: {
        x: player.position.x + Math.cos(player.rotation) * 30,
        y: player.position.y + Math.sin(player.rotation) * 30,
      },
      velocity: {
        x: Math.cos(player.rotation) * PROJECTILE_SPEED,
        y: Math.sin(player.rotation) * PROJECTILE_SPEED
      }
    }));

    shootSound.play();
  } else if (event.code == 'KeyG') {
    console.log(player.getVertices())
    // console.log(player);
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
