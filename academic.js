(() => {
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
  const filters = [...document.querySelectorAll("[data-filter]")];
  const papers = [...document.querySelectorAll("[data-topics]")];
  const status = document.querySelector("[data-pub-status]");
  const alternateName = document.querySelector(".alt-name");
  const dialog = document.querySelector(".figure-dialog");
  const dialogTitle = dialog.querySelector("h2");
  const dialogContent = dialog.querySelector(".dialog-content");
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
    if (announce) {
      status.textContent = language === "zh"
        ? `显示 ${visible} 篇论文`
        : `${visible} ${visible === 1 ? "paper" : "papers"} shown`;
    }
  }

  function selectLanguage(value, remember = false) {
    language = value === "zh" ? "zh" : "en";
    const chinese = language === "zh";
    document.documentElement.lang = chinese ? "zh-CN" : "en";
    document.title = chinese ? "廖静娴 · 科学机器学习与控制" : "Jingxian Liao · Scientific Machine Learning and Control";
    alternateName.lang = chinese ? "en" : "zh-CN";
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
    selectFilter(filter, Boolean(status.textContent));
  }

  function revealTarget(hash = window.location.hash) {
    const target = document.getElementById(hash.slice(1));
    if (!target) return;
    let changed = false;
    if (target.matches("[data-topics][hidden]")) {
      selectFilter("all", true);
      changed = true;
    }
    for (let detail = target.closest("details"); detail; detail = detail.parentElement.closest("details")) {
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
  document.querySelector(".language").hidden = false;
  document.querySelector(".filters").hidden = false;

  window.addEventListener("hashchange", () => revealTarget());
  for (const link of document.querySelectorAll('a[href^="#"]')) {
    link.addEventListener("click", () => revealTarget(link.hash));
  }
  revealTarget();

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
