const cache = new Map();

export function loadPartial(name) {
  if (!cache.has(name)) {
    cache.set(name, fetch("/layout/" + name + ".html").then((r) => {
      if (!r.ok) throw new Error("Could not load layout/" + name);
      return r.text();
    }));
  }
  return cache.get(name);
}

export function fillTemplate(tpl, data) {
  return tpl.replace(/\{\{(\w+)\}\}/g, (_, key) => (key in data ? data[key] : ""));
}

function configureHeader(frag, slot) {
  const header = frag.querySelector(".site-header");
  if (!header) return;
  if (slot.hasAttribute("data-compact")) header.classList.add("compact");
  if (slot.getAttribute("data-max")) header.style.setProperty("--bar-max", slot.getAttribute("data-max"));
  const back = frag.getElementById("backBtn");
  if (back && slot.hasAttribute("data-back")) back.hidden = false;
}

export async function mountLayout() {
  const slots = Array.from(document.querySelectorAll("[data-include]"));
  await Promise.all(slots.map(async (slot) => {
    try {
      const html = await loadPartial(slot.getAttribute("data-include"));
      const tpl = document.createElement("template");
      tpl.innerHTML = html;
      const frag = tpl.content;
      if (slot.getAttribute("data-include") === "header") configureHeader(frag, slot);
      slot.replaceWith(frag);
    } catch (err) {
      console.warn("[NPLcode]", err);
      slot.remove();
    }
  }));
  const year = document.getElementById("year");
  if (year) year.textContent = new Date().getFullYear();
}