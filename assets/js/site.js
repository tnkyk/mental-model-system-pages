document.addEventListener("DOMContentLoaded", () => {
  const path = (location.pathname.split("/").pop() || "index.html").toLowerCase();
  document.querySelectorAll(".site-nav a[href]").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("/").pop().toLowerCase();
    if (href === path) a.setAttribute("aria-current", "page");
  });

  // Active TOC highlighting (sticky "このページ" rail + mobile details)
  const tocLinks = Array.from(document.querySelectorAll(".toc-nav a.toc-link[href^='#']"));
  if (!tocLinks.length) return;

  const idToLinks = new Map();
  for (const a of tocLinks) {
    const id = (a.getAttribute("href") || "").slice(1);
    if (!id) continue;
    if (!idToLinks.has(id)) idToLinks.set(id, []);
    idToLinks.get(id).push(a);
  }

  const sections = Array.from(idToLinks.keys())
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  const setActive = (id) => {
    tocLinks.forEach((a) => a.classList.remove("active"));
    const links = idToLinks.get(id) || [];
    links.forEach((a) => a.classList.add("active"));
  };

  if (!("IntersectionObserver" in window) || !sections.length) {
    if (sections[0]) setActive(sections[0].id);
    return;
  }

  let current = sections[0].id;
  const ratios = new Map();

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
      }
      let bestId = current;
      let best = 0;
      for (const [id, ratio] of ratios) {
        if (ratio > best) {
          best = ratio;
          bestId = id;
        }
      }
      // Prefer the topmost section with meaningful visibility when ties are close
      if (best < 0.08) {
        const headerOffset = 90;
        let nearest = current;
        let nearestDist = Infinity;
        for (const sec of sections) {
          const top = sec.getBoundingClientRect().top;
          const dist = Math.abs(top - headerOffset);
          if (top - headerOffset <= 40 && dist < nearestDist) {
            nearestDist = dist;
            nearest = sec.id;
          }
        }
        bestId = nearest;
      }
      if (bestId && bestId !== current) {
        current = bestId;
        setActive(current);
      }
    },
    {
      root: null,
      rootMargin: "-12% 0px -55% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
    }
  );

  sections.forEach((sec) => observer.observe(sec));
  setActive(current);
});
