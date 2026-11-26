(() => {
  const page = document.body.dataset.page;
  const englishTitle = document.title;
  const chineseTitle = document.body.dataset.titleZh || englishTitle;
  const legacyAnchors = new Map([
    ["research", "research.html"],
    ["research-title", "research.html"],
    ["algorithms", "research.html"],
    ["publications", "publications.html"],
    ["publications-title", "publications.html"],
    ["selected-publications-title", "publications.html"],
    ["all-publications", "publications.html"],
    ["all-publications-title", "publications.html"],
    ["paper-aero", "publications.html"],
    ["paper-alloc", "publications.html"],
    ["paper-cad", "publications.html"],
    ["paper-tiltrotor", "publications.html"],
    ["patents", "publications.html"],
    ["projects", "projects.html"],
    ["project-guangdong", "projects.html"],
    ["project-helicopter", "projects.html"],
    ["project-shenzhen", "projects.html"],
    ["project-sichuan", "projects.html"],
    ["cv", "cv.html"],
    ["cv-title", "cv.html"],
    ["experience", "cv.html"],
    ["kaist", "cv.html"],
    ["teaching", "teaching.html"],
    ["teaching-title", "teaching.html"],
    ["contact", "contact.html"],
    ["contact-title", "contact.html"],
    ["visitors", "contact.html"],
    ["visitors-title", "contact.html"],
    ["visitor-map-title", "contact.html"]
  ]);

  function redirectLegacyAnchor() {
    if (page !== "about") return false;
    const destination = legacyAnchors.get(window.location.hash.slice(1));
    if (!destination) return false;
    const url = new URL(destination, window.location.href);
    url.search = window.location.search;
    url.hash = window.location.hash;
    window.location.replace(url.href);
    return true;
  }

  if (redirectLegacyAnchor()) return;

  const translatedText = [...document.querySelectorAll("[data-zh]")].map(element => ({
    element,
    en: element.textContent,
    zh: element.dataset.zh
  }));
  const translatedAttributes = [
    ["[data-alt-zh]", "alt", "altZh"],
    ["[data-label-zh]", "aria-label", "labelZh"]
  ].flatMap(([selector, attribute, key]) =>
    [...document.querySelectorAll(selector)].map(element => ({
      element,
      attribute,
      en: element.getAttribute(attribute),
      zh: element.dataset[key]
    })));
  const languages = [...document.querySelectorAll("[data-lang]")];
  const filterBar = document.querySelector(".filters");
  const filters = [...document.querySelectorAll("[data-filter]")];
  const papers = [...document.querySelectorAll("[data-topics]")];
  const status = document.querySelector("[data-pub-status]");
  const alternateName = document.querySelector(".alt-name");
  let language = "en";
  let filter = "all";

  function selectFilter(value, announce = false) {
    filter = value;
    let visible = 0;
    for (const paper of papers) {
      const matches = value === "all" || paper.dataset.topics.split(" ").includes(value);
      paper.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const button of filters) button.setAttribute("aria-pressed", String(button.dataset.filter === value));
    if (announce && status) {
      status.textContent = language === "zh"
        ? `显示 ${visible} 篇论文`
        : `${visible} ${visible === 1 ? "paper" : "papers"} shown`;
    }
  }

  function selectLanguage(value, remember = false) {
    language = value === "zh" ? "zh" : "en";
    const chinese = language === "zh";
    document.documentElement.lang = chinese ? "zh-CN" : "en";
    document.title = chinese ? chineseTitle : englishTitle;
    if (alternateName) alternateName.lang = chinese ? "en" : "zh-CN";
    for (const entry of translatedText) entry.element.textContent = entry[language];
    for (const entry of translatedAttributes) entry.element.setAttribute(entry.attribute, entry[language]);
    for (const button of languages) button.setAttribute("aria-pressed", String(button.dataset.lang === language));
    if (remember) {
      try {
        localStorage.setItem("jl-site-language", language);
      } catch {
        // The language still applies when storage is unavailable.
      }
    }
    if (filterBar) selectFilter(filter, Boolean(status?.textContent));
  }

  function revealTarget(hash = window.location.hash) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    let changed = false;
    if (target.matches("[data-topics][hidden]")) {
      selectFilter("all", true);
      changed = true;
    }
    for (let detail = target.closest("details"); detail; detail = detail.parentElement?.closest("details")) {
      if (!detail.open) {
        detail.open = true;
        changed = true;
      }
    }
    if (changed) requestAnimationFrame(() => target.scrollIntoView({ block: "start" }));
  }

  let preference;
  try {
    preference = localStorage.getItem("jl-site-language");
  } catch {
    // Use the document language when storage is unavailable.
  }
  selectLanguage(preference || "en");
  for (const button of languages) button.addEventListener("click", () => selectLanguage(button.dataset.lang, true));
  for (const button of filters) button.addEventListener("click", () => selectFilter(button.dataset.filter, true));
  const languageControl = document.querySelector(".language");
  if (languageControl) languageControl.hidden = false;
  if (filterBar) filterBar.hidden = false;

  window.addEventListener("hashchange", () => {
    if (!redirectLegacyAnchor()) revealTarget();
  });
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener("click", () => revealTarget(link.hash));
  }
  revealTarget();

  const dialog = document.querySelector(".figure-dialog");
  if (!dialog) return;
  const dialogTitle = dialog.querySelector("h2");
  const dialogContent = dialog.querySelector(".dialog-content");
  for (const trigger of document.querySelectorAll(".figure-preview, .publication-preview")) {
    trigger.addEventListener("click", () => {
      const figure = trigger.closest("figure");
      const frame = trigger.querySelector(".figure-frame");
      if (!frame) return;
      dialogTitle.textContent = figure.closest(".project, .paper").querySelector("h3").textContent;
      dialogContent.replaceChildren(frame.cloneNode(true));
      const notes = figure.querySelector(".detail-notes");
      if (notes) dialogContent.append(notes.cloneNode(true));
      dialog.showModal();
    });
  }
  dialog.querySelector(".close-dialog").addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => {
    if (event.target === dialog) dialog.close();
  });
})();
