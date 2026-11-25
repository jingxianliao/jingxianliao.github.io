(() => {
  const section = document.querySelector("#visitors");
  const map = section.querySelector(".visitor-world");
  const ranking = section.querySelector("[data-visitor-ranking]");
  const total = section.querySelector("[data-visitor-total]");
  const status = section.querySelector("[data-visitor-state]");
  const mapRegions = new Map();
  const svgNamespace = "http://www.w3.org/2000/svg";
  let countries;
  let refreshFailed = false;

  function appendShape(tag, parent, attributes) {
    const shape = document.createElementNS(svgNamespace, tag);
    for (const [name, value] of Object.entries(attributes)) shape.setAttribute(name, value);
    parent.append(shape);
    return shape;
  }

  function drawWorld(world) {
    map.setAttribute("viewBox", `0 0 ${world.width} ${world.height}`);
    for (const region of world.regions) {
      const group = appendShape("g", map, {class: "visitor-region"});
      const label = appendShape("title", group, {});
      for (const path of region.paths) {
        appendShape("path", group, {class: "visitor-land", d: path, "fill-rule": "evenodd"});
      }
      if (!region.paths.length && region.point) {
        const [cx, cy] = region.point;
        appendShape("circle", group, {class: "visitor-point", cx, cy, r: 2.05});
      }
      mapRegions.set(region.code, {group, label});
    }
    render();
  }

  function render() {
    const locale = document.documentElement.lang || "en";
    const chinese = locale.startsWith("zh");
    const names = new Intl.DisplayNames([locale], {type: "region"});
    const numbers = new Intl.NumberFormat(locale);
    const visits = countries || [];
    const byCode = new Map(visits.map(({code, visits}) => [code, visits]));
    const maxVisits = visits.reduce((max, entry) => Math.max(max, entry.visits), 1);
    const formatCount = (count) => chinese ? `${numbers.format(count)} 次访问` :
      `${numbers.format(count)} ${count === 1 ? "visit" : "visits"}`;

    for (const [code, {group, label}] of mapRegions) {
      const count = byCode.get(code) || 0;
      group.dataset.level = count ? String(Math.ceil(4 * Math.log1p(count) / Math.log1p(maxVisits))) : "0";
      label.textContent = `${names.of(code)} · ${formatCount(count)}`;
    }

    const rows = visits.map(({code, visits}) => {
      const row = document.createElement("li");
      const region = document.createElement("span");
      const count = document.createElement("strong");
      region.textContent = names.of(code);
      count.textContent = numbers.format(visits);
      row.append(region, count);
      return row;
    });
    ranking.replaceChildren(...rows);
    ranking.hidden = rows.length === 0;
    total.textContent = countries ? numbers.format(visits.reduce((sum, entry) => sum + entry.visits, 0)) : "—";
    status.hidden = !refreshFailed && rows.length > 0;
    if (refreshFailed) {
      status.textContent = chinese ? "暂时无法更新访问统计。" : "Visit counts could not be refreshed.";
    } else if (countries && rows.length === 0) {
      status.textContent = chinese ? "已有地区信息的访问将显示在这里。" : "Visits with an identifiable location will appear here.";
    } else if (!countries) {
      status.textContent = chinese ? "正在加载统计…" : "Loading statistics…";
    }
  }

  async function loadSnapshot() {
    try {
      const response = await fetch("assets/visitor-stats.json");
      if (!response.ok) throw new Error("Visit statistics unavailable");
      const data = await response.json();
      countries = data.countries.filter(({code, visits}) => /^[A-Z]{2}$/.test(code) &&
        Number.isSafeInteger(visits) && visits > 0);
      countries.sort((a, b) => b.visits - a.visits || a.code.localeCompare(b.code));
    } catch {
      refreshFailed = true;
    }
    render();
  }

  fetch("assets/visitor-world.json")
    .then((response) => response.ok ? response.json() : Promise.reject())
    .then(drawWorld).catch(() => { map.hidden = true; });
  new MutationObserver(render).observe(document.documentElement, {attributeFilter: ["lang"]});
  loadSnapshot();
})();
