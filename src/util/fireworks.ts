// 礼花特效工具函数

import { getCurrentClickPosition } from "./click-position";

export interface Position {
  x: number;
  y: number;
}

export function createFireworks(position?: Position | null) {
  // 创建画布元素
  const canvas = document.createElement("canvas");
  canvas.style.position = "fixed";
  canvas.style.top = "0";
  canvas.style.left = "0";
  canvas.style.pointerEvents = "none";
  canvas.style.zIndex = "9999";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  // 设置画布大小
  const resizeCanvas = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  // 礼花爆炸位置（优先使用传入的位置，其次是屏幕中心）
  let x, y;

  // 检查是否有有效的位置信息
  if (position && position.x > 0 && position.y > 0) {
    x = position.x;
    y = position.y;
  } else {
    position = getCurrentClickPosition();
    if (position && position.x > 0 && position.y > 0) {
      x = position.x;
      y = position.y;
    } else {
      // 如果没有位置信息，使用屏幕中心
      x = canvas.width / 2;
      y = canvas.height / 2;
    }
  }

  // 创建粒子
  const particles: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    color: string;
    radius: number;
    alpha: number;
    gravity: number;
    friction: number;
  }[] = [];
  const particleCount = 150;
  const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8", "#F7DC6F", "#BB8FCE", "#85C1E9"];

  for (let i = 0; i < particleCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2 + Math.random() * 6;

    particles.push({
      x: x,
      y: y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: colors[Math.floor(Math.random() * colors.length)],
      radius: 1 + Math.random() * 3,
      alpha: 1,
      gravity: 0.05,
      friction: 0.98,
    });
  }

  // 动画循环
  const animate = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    let activeParticles = false;

    particles.forEach((particle) => {
      // 更新位置
      particle.vy += particle.gravity;
      particle.vx *= particle.friction;
      particle.vy *= particle.friction;
      particle.x += particle.vx;
      particle.y += particle.vy;

      // 淡出效果
      particle.alpha -= 0.01;

      if (particle.alpha > 0) {
        activeParticles = true;

        // 绘制粒子
        ctx.save();
        ctx.globalAlpha = particle.alpha;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    });

    if (activeParticles) {
      requestAnimationFrame(animate);
    } else {
      // 清理画布
      window.removeEventListener("resize", resizeCanvas);
      setTimeout(() => {
        if (document.body.contains(canvas)) {
          document.body.removeChild(canvas);
        }
      }, 100);
    }
  };

  animate();
}
