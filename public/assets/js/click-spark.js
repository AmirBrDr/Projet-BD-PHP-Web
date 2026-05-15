(() => {
  const DEFAULTS = {
    sparkColor: "#ffffff",
    sparkSize: 15,
    sparkRadius: 35,
    sparkCount: 8,
    duration: 400,
    easing: "ease-out",
    extraScale: 1,
    zIndex: 4000,
  };

  let state = null;

  function getAccentFallback() {
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    return (
      styles.getPropertyValue("--shell-accent").trim() ||
      styles.getPropertyValue("--accent").trim() ||
      DEFAULTS.sparkColor
    );
  }

  function easeFor(type, t) {
    switch (type) {
      case "linear":
        return t;
      case "ease-in":
        return t * t;
      case "ease-in-out":
        return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
      default:
        return t * (2 - t);
    }
  }

  /**
   * Initialise l'effet de particules au clic sur l'ensemble du document.
   * @param {Object} options - Configuration des particules (couleur, taille, durée, etc.)
   */
  function init(options = {}) {
    if (state) {
      return;
    }

    const config = {
      ...DEFAULTS,
      ...options,
    };
    if (!options.sparkColor) {
      config.sparkColor = getAccentFallback();
    }

    const canvas = document.createElement("canvas");
    canvas.className = "gp-click-spark";
    canvas.style.position = "fixed";
    canvas.style.inset = "0";
    canvas.style.zIndex = String(config.zIndex);
    canvas.style.pointerEvents = "none";
    canvas.style.display = "block";

    document.body.appendChild(canvas);

    const ctx = canvas.getContext("2d");
    const sparks = [];
    let rafId = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const width = window.innerWidth;
      const height = window.innerHeight;
      canvas.width = Math.max(1, Math.floor(width * dpr));
      canvas.height = Math.max(1, Math.floor(height * dpr));
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (timestamp) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const next = [];
      for (const spark of sparks) {
        const elapsed = timestamp - spark.startTime;
        if (elapsed >= config.duration) {
          continue;
        }

        const progress = elapsed / config.duration;
        const eased = easeFor(config.easing, progress);

        const distance = eased * config.sparkRadius * config.extraScale;
        const lineLength = config.sparkSize * (1 - eased);

        const x1 = spark.x + distance * Math.cos(spark.angle);
        const y1 = spark.y + distance * Math.sin(spark.angle);
        const x2 = spark.x + (distance + lineLength) * Math.cos(spark.angle);
        const y2 = spark.y + (distance + lineLength) * Math.sin(spark.angle);

        ctx.strokeStyle = config.sparkColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        next.push(spark);
      }

      sparks.length = 0;
      sparks.push(...next);

      if (sparks.length > 0) {
        rafId = requestAnimationFrame(draw);
      } else {
        rafId = 0;
      }
    };

    const handlePointer = (event) => {
      const now = performance.now();
      const x = event.clientX;
      const y = event.clientY;

      for (let i = 0; i < config.sparkCount; i += 1) {
        sparks.push({
          x,
          y,
          angle: (2 * Math.PI * i) / config.sparkCount,
          startTime: now,
        });
      }

      if (!rafId) {
        rafId = requestAnimationFrame(draw);
      }
    };

    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", handlePointer);
    resize();

    state = {
      canvas,
      resize,
      handlePointer,
      rafId,
    };
  }

  /**
   * Nettoie et supprime l'effet de particules du document.
   */
  function destroy() {
    if (!state) {
      return;
    }

    window.removeEventListener("resize", state.resize);
    window.removeEventListener("pointerdown", state.handlePointer);
    if (state.rafId) {
      cancelAnimationFrame(state.rafId);
    }
    if (state.canvas && state.canvas.parentNode) {
      state.canvas.parentNode.removeChild(state.canvas);
    }

    state = null;
  }

  window.GPClickSpark = {
    init,
    destroy,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => init());
  } else {
    init();
  }
})();
