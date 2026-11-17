(function () {
  const motion = document.getElementById("lap-motion");
  if (!motion) return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    motion.remove();
  }
})();
