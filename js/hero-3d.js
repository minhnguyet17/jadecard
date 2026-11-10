// ======================================================================
// THẺ CHARIZARD 3D Ở TRANG CHỦ (three.js)
//
// Ý tưởng: dựng một "lá thẻ" gồm 2 mặt phẳng úp lưng vào nhau:
//   - mặt trước: ảnh thẻ Charizard (lấy từ máy chủ TCGdex, có bật CORS);
//   - mặt sau: mặt lưng tự vẽ bằng canvas (logo JadeCard).
// Thẻ tự lắc nhẹ, nghiêng theo chuột / ngón tay, và có ánh sáng chạy qua
// tạo cảm giác holo. Nếu trình duyệt không hỗ trợ WebGL hoặc ảnh không tải
// được, trang vẫn giữ ảnh tĩnh (bản CSS của Buổi 2), không bị lỗi.
// ======================================================================

(function () {
  const container = document.getElementById("hero-3d");
  const fallback = document.getElementById("hero-fallback");
  // Ảnh lấy từ TCGdex vì máy chủ này cho phép dùng làm texture (CORS),
  // kể cả khi mở trang bằng cách nhấp đúp file index.html.
  const CARD_IMAGE = "https://assets.tcgdex.net/en/base/base1/4/high.webp";
  const CARD_W = 2.5; // tỉ lệ thẻ thật 2,5 x 3,5 inch
  const CARD_H = 3.5;

  if (!container || typeof THREE === "undefined") {
    return; // không có three.js: giữ ảnh tĩnh
  }
  // Kiểm tra trình duyệt có hỗ trợ WebGL không
  const testCanvas = document.createElement("canvas");
  if (!(testCanvas.getContext("webgl2") || testCanvas.getContext("webgl"))) {
    return;
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  // Vẽ một hình chữ nhật bo góc lên canvas (để thẻ có góc tròn như thẻ thật)
  function roundedRect(ctx, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.arcTo(w, 0, w, h, r);
    ctx.arcTo(w, h, 0, h, r);
    ctx.arcTo(0, h, 0, 0, r);
    ctx.arcTo(0, 0, w, 0, r);
    ctx.closePath();
  }

  // Mặt trước: vẽ ảnh thẻ vào canvas có bo góc, phần góc trong suốt
  function makeFrontTexture(image) {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 840;
    const ctx = canvas.getContext("2d");
    roundedRect(ctx, canvas.width, canvas.height, 28);
    ctx.clip();
    ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Mặt sau: tự vẽ nền tối, viền holo và chữ JADECARD
  function makeBackTexture() {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 840;
    const ctx = canvas.getContext("2d");
    roundedRect(ctx, 600, 840, 28);
    ctx.clip();
    const bg = ctx.createLinearGradient(0, 0, 600, 840);
    bg.addColorStop(0, "#0d1b2a");
    bg.addColorStop(0.5, "#1b1035");
    bg.addColorStop(1, "#2a0f24");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 600, 840);
    const rim = ctx.createLinearGradient(0, 0, 600, 840);
    rim.addColorStop(0, "#00f2fe");
    rim.addColorStop(0.5, "#a855f7");
    rim.addColorStop(1, "#facc15");
    ctx.strokeStyle = rim;
    ctx.lineWidth = 18;
    roundedRect(ctx, 600, 840, 28);
    ctx.stroke();
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.font = "800 64px 'Be Vietnam Pro', Arial, sans-serif";
    ctx.fillText("JADECARD", 300, 430);
    ctx.fillStyle = "#00e5ff";
    ctx.font = "500 26px 'JetBrains Mono', monospace";
    ctx.fillText("POKÉMON TCG SHOP", 300, 480);
    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    return texture;
  }

  // Tải ảnh thẻ; thành công thì mới dựng cảnh 3D
  const image = new Image();
  image.crossOrigin = "anonymous";
  image.onload = function () { start(image); };
  image.onerror = function () { /* giữ ảnh tĩnh */ };
  image.src = CARD_IMAGE;

  function start(cardImage) {
    // 1. Renderer: vẽ lên canvas trong suốt, đặt vào khung #hero-3d
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    // Màn hình độ nét cao (điện thoại DPR 2–3): vẽ nét hơn nhưng tối đa 2 lần cho nhẹ máy
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    // Canvas luôn bằng đúng khung chứa. Thiếu dòng này, trên điện thoại canvas bị
    // phóng to gấp đôi (bằng số điểm ảnh thật) và thẻ bị cắt mất một nửa.
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
    container.appendChild(renderer.domElement);

    // 2. Cảnh và camera
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
    camera.position.set(0, 0, 6.3);

    // 3. Ánh sáng: ánh sáng nền + 2 đèn màu cyan/tím chạy quanh thẻ (hiệu ứng holo)
    scene.add(new THREE.AmbientLight(0xffffff, 1.6));
    const cyanLight = new THREE.PointLight(0x00e5ff, 30, 12);
    const purpleLight = new THREE.PointLight(0xa855f7, 26, 12);
    scene.add(cyanLight, purpleLight);

    // 4. Lá thẻ: 2 mặt phẳng úp lưng vào nhau trong một nhóm
    const card = new THREE.Group();
    const geometry = new THREE.PlaneGeometry(CARD_W, CARD_H);
    const frontMaterial = new THREE.MeshStandardMaterial({ map: makeFrontTexture(cardImage), transparent: true, roughness: 0.35, metalness: 0.35 });
    const backMaterial = new THREE.MeshStandardMaterial({ map: makeBackTexture(), transparent: true, roughness: 0.4, metalness: 0.4 });
    const front = new THREE.Mesh(geometry, frontMaterial);
    const back = new THREE.Mesh(geometry, backMaterial);
    back.rotation.y = Math.PI; // quay mặt sau ra phía sau
    back.position.z = -0.01;
    card.add(front, back);
    scene.add(card);

    // 5. Chuột: thẻ nghiêng theo con trỏ. Ngón tay / chuột: kéo ngang để xoay thẻ.
    const pointer = { x: 0, y: 0 };
    let spin = 0;
    let dragging = false;
    let lastX = 0;
    container.addEventListener("pointermove", function (event) {
      if (event.pointerType === "mouse") {
        const rect = container.getBoundingClientRect();
        pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        pointer.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
      }
      if (dragging) {
        spin += (event.clientX - lastX) * 0.012;
        lastX = event.clientX;
      }
    });
    container.addEventListener("pointerdown", function (event) {
      dragging = true;
      lastX = event.clientX;
      container.setPointerCapture(event.pointerId);
    });
    function stopDrag() {
      dragging = false;
    }
    container.addEventListener("pointerup", stopDrag);
    container.addEventListener("pointercancel", stopDrag); // trình duyệt chuyển sang cuộn trang
    container.addEventListener("pointerleave", function () { pointer.x = 0; pointer.y = 0; });

    // 6. Khớp kích thước vùng vẽ với khung chứa (khung đổi cỡ khi xoay ngang điện thoại...)
    function resize() {
      const width = container.clientWidth;
      const height = container.clientHeight;
      if (width === 0 || height === 0) {
        return; // khung đang ẩn thì chưa cần vẽ
      }
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
    if ("ResizeObserver" in window) {
      new ResizeObserver(resize).observe(container);
    } else {
      window.addEventListener("resize", resize);
    }

    // 7. Vòng lặp vẽ: mỗi khung hình cập nhật góc nghiêng và vị trí đèn.
    // Thẻ cuộn khỏi màn hình thì dừng vẽ cho đỡ tốn pin.
    const clock = new THREE.Clock();
    let onScreen = true;
    let frameId = 0;
    function animate() {
      const t = clock.getElapsedTime();
      const sway = reduceMotion ? 0 : Math.sin(t * 0.8) * 0.35; // lắc nhẹ qua lại
      const targetY = spin + sway + pointer.x * 0.5;
      const targetX = pointer.y * 0.3 + (reduceMotion ? 0 : Math.sin(t * 0.6) * 0.05);
      // Di chuyển dần về góc mong muốn để chuyển động mượt
      card.rotation.y += (targetY - card.rotation.y) * 0.08;
      card.rotation.x += (targetX - card.rotation.x) * 0.08;
      card.position.y = reduceMotion ? 0 : Math.sin(t * 1.2) * 0.06; // nổi lên xuống

      cyanLight.position.set(Math.sin(t * 0.9) * 3 + pointer.x * 2, Math.cos(t * 0.7) * 2, 3);
      purpleLight.position.set(-Math.sin(t * 0.9) * 3, -Math.cos(t * 0.7) * 2 - pointer.y, 3);

      renderer.render(scene, camera);
      frameId = onScreen ? requestAnimationFrame(animate) : 0;
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (onScreen && frameId === 0) {
          frameId = requestAnimationFrame(animate);
        }
      }).observe(container);
    }

    // Dựng xong thì ẩn ảnh tĩnh, hiện khung 3D
    fallback.classList.add("hidden");
    container.classList.remove("hidden");
    resize();
    animate();
  }
})();
