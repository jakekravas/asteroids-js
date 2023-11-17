const canvas = document.querySelector('canvas');
const c = canvas.getContext('2d');

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;


c.fillStyle = 'black';

// x, y, width, height
c.fillRect(0, 0, canvas.width, canvas.height);

class Player {
  constructor({ position, velocity }) {
    this.position = position; // {x, y}
    this.velocity = velocity;
  }

  draw() {
    c.arc(this.position.x, this.position.y, 5, 0, Math.PI * 2, false);
    c.fillStyle = 'red';
    c.fill()

    c.moveTo(this.position.x + 30, this.position.y);
    //note: for canvas, when you're going down, you're ADDING y vals, when going up, SUBTRACGING y vals
    c.lineTo(this.position.x - 10, this.position.y - 10);
    c.lineTo(this.position.x - 10, this.position.y + 10); 
    c.closePath();

    c.strokeStyle = 'white';
    c.stroke();
  }

  update() {
    this.draw();
    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;
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
  }
}

function animate() {
  window.requestAnimationFrame(animate);

  player.update();
  
  if (keys.w.pressed) {
    player.velocity.x = 1;
    console.log('aaaa')
  }
}

animate();

window.addEventListener('keydown', event => {
  switch(event.code) {
    case 'KeyW':
      console.log('w pr')
      keys.w.pressed = true;
      break;
    case 'KeyA':
      console.log('A pr')
      break;
    case 'KeyD':
      console.log('D pr')
      break;
    case 'KeyS':
      console.log('S pr')
      break;
  }
  // console.log(event);
});