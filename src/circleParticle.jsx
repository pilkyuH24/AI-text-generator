export class CircleParticle {
    constructor(ctx) {
      this.ctx = ctx;
  
      // Particle system properties
      this.circleParticles = [];
      this.numParticles = 2000;
      this.radius = 1000;
      this.pov = 1500;
  
      this.rotationX = 0;
      this.rotationY = 0;
  
      // Set canvas dimensions
      this.ctx.canvas.width = window.innerWidth;
      this.ctx.canvas.height = window.innerHeight;
  
      // Initialize particles
      this.initParticles();
  
      // Bind the animate method to ensure 'this' refers to the class instance
      this.animate = this.animate.bind(this);
  
      // Add mouse movement listener
      this.addMouseListener();
  
      // Start the animation
      requestAnimationFrame(this.animate);
    }
  
    initParticles() {
      for (let i = 0; i < this.numParticles; i++) {
        const angle = Math.random() * Math.PI * 2;
        const height = (Math.random() - 0.5) * 2000;
        const speed = 0.001 + Math.random() * 0.0001;
        const radiusVariation = this.radius + Math.random() * 300;
        const particle = {
          angle: angle,
          height: height,
          radius: radiusVariation,
          speed: speed,
          color: this.randomColor(),
        };
        this.circleParticles.push(particle);
      }
    }
  
    update(particle) {
      particle.angle += particle.speed;
      if (particle.angle > Math.PI * 2) {
        particle.angle -= Math.PI * 2;
      }
    }
  
    draw(particle) {
      let x3d = particle.radius * Math.cos(particle.angle);
      let y3d = particle.height;
      let z3d = particle.radius * Math.sin(particle.angle);
  
      const cosX = Math.cos(this.rotationX);
      const sinX = Math.sin(this.rotationX);
      let y = y3d * cosX - z3d * sinX;
      let z = y3d * sinX + z3d * cosX;
  
      const cosY = Math.cos(this.rotationY);
      const sinY = Math.sin(this.rotationY);
      let x = x3d * cosY + z * sinY;
      z = -x3d * sinY + z * cosY;
  
      const scale = this.pov / (this.pov + z);
  
      if (scale < 0) return;
  
      const x2d = x * scale + this.ctx.canvas.width / 2;
      const y2d = y * scale + this.ctx.canvas.height / 2;
  
      this.ctx.beginPath();
      this.ctx.arc(x2d, y2d, 2 * scale, 0, Math.PI * 2);
      this.ctx.fillStyle = particle.color;
      this.ctx.fill();
      this.ctx.closePath();
    }
  
    randomColor() {
      const hue = Math.floor(Math.random() * 360);
      const saturation = Math.floor(Math.random() * 20) + 60;
      const lightness = Math.floor(Math.random() * 20) + 50;
      return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
    }
  
    addMouseListener() {
      window.addEventListener('mousemove', (event) => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        const mouseX = event.clientX - centerX;
        const mouseY = event.clientY - centerY;
  
        const rotationSensitivity = Math.PI / 50;
        this.rotationY = (mouseX / centerX) * rotationSensitivity;
        this.rotationX = (mouseY / centerY) * rotationSensitivity;
      });
    }
  
    animate() {
      this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
  
      for (const particle of this.circleParticles) {
        this.update(particle);
        this.draw(particle);
      }
  
      requestAnimationFrame(this.animate);
    }
  }
  