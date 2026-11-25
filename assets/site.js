(() => {
  const localized = [...document.querySelectorAll("[data-zh]")].map(element => ({
    element, english: element.textContent, chinese: element.dataset.zh
  }));
  const figureAlts = [...document.querySelectorAll("[data-alt-zh]")].map(image => ({image, english: image.alt, chinese: image.dataset.altZh}));
  const languages = [...document.querySelectorAll("[data-lang]")];
  const filters = [...document.querySelectorAll("[data-filter]")];
  const publications = [...document.querySelectorAll("[data-topics]")];
  const status = document.querySelector("[data-pub-status]");
  const tabs = [...document.querySelectorAll("[data-method]")];
  const panels = [...document.querySelectorAll("[data-method-panel]")];
  const dialog = document.querySelector(".figure-dialog");
  const dialogTitle = dialog.querySelector("h2");
  const dialogContent = dialog.querySelector(".dialog-content");
  const closeDialog = dialog.querySelector(".close-dialog");
  let language = "en";
  let filter = "all";

  function selectFilter(value, announce) {
    filter = value;
    let visible = 0;
    for (const publication of publications) {
      const matches = value === "all" || publication.dataset.topics.split(" ").includes(value);
      publication.hidden = !matches;
      if (matches) visible += 1;
    }
    for (const button of filters) button.setAttribute("aria-pressed", String(button.dataset.filter === value));
    if (announce) status.textContent = language === "zh" ? `显示 ${visible} 篇论文` : `${visible} publications shown`;
  }

  function selectLanguage(value, remember) {
    language = value === "zh" ? "zh" : "en";
    const chinese = language === "zh";
    document.documentElement.lang = chinese ? "zh-CN" : "en";
    document.title = chinese ? "廖静娴 · 科学机器学习与控制" : "Jingxian Liao · Scientific Machine Learning and Control";
    for (const entry of localized) entry.element.textContent = chinese ? entry.chinese : entry.english;
    document.querySelector(".alt-name").lang = chinese ? "en" : "zh-CN";
    document.querySelector(".filters").setAttribute("aria-label", chinese ? "筛选论文" : "Filter publications");
    document.querySelector(".nav-links").setAttribute("aria-label", chinese ? "页面栏目" : "Sections");
    document.querySelector(".method-tabs").setAttribute("aria-label", chinese ? "算法" : "Algorithms");
    document.querySelector(".method-demo").setAttribute("aria-label", chinese ? "算法概览" : "Algorithm overview");
    closeDialog.setAttribute("aria-label", chinese ? "关闭图片" : "Close figure");
    for (const {image, english, chinese: chineseAlt} of figureAlts) image.alt = chinese ? chineseAlt : english;
    for (const button of languages) button.setAttribute("aria-pressed", String(button.dataset.lang === language));
    if (remember) {
      try { window.localStorage.setItem("jl-site-language", language); } catch { /* Storage can be disabled. */ }
    }
    selectFilter(filter, Boolean(status.textContent));
  }

  function selectMethod(key, focus = false) {
    for (const tab of tabs) {
      const selected = tab.dataset.method === key;
      tab.setAttribute("aria-selected", String(selected));
      tab.tabIndex = selected ? 0 : -1;
      if (focus && selected) tab.focus();
    }
    for (const panel of panels) panel.hidden = panel.dataset.methodPanel !== key;
  }

  let preference;
  try { preference = window.localStorage.getItem("jl-site-language"); } catch { /* Use the document language. */ }
  selectLanguage(preference || "en", false);
  for (const button of languages) button.addEventListener("click", () => selectLanguage(button.dataset.lang, true));
  for (const button of filters) button.addEventListener("click", () => selectFilter(button.dataset.filter, true));
  for (const [index, tab] of tabs.entries()) {
    tab.addEventListener("click", () => selectMethod(tab.dataset.method));
    tab.addEventListener("keydown", event => {
      const next = { ArrowLeft: (index + tabs.length - 1) % tabs.length, ArrowRight: (index + 1) % tabs.length, Home: 0, End: tabs.length - 1 }[event.key];
      if (next === undefined) return;
      event.preventDefault();
      selectMethod(tabs[next].dataset.method, true);
    });
  }
  for (const trigger of document.querySelectorAll(".figure-preview, .publication-preview")) {
    trigger.addEventListener("click", () => {
      const figure = trigger.closest("figure");
      const frame = trigger.querySelector(".figure-frame").cloneNode(true);
      dialogTitle.textContent = figure.closest(".project, .paper").querySelector("h3").textContent;
      dialogContent.replaceChildren(frame);
      const detailed = figure.querySelector(".detail-notes");
      if (detailed) dialogContent.append(detailed.cloneNode(true));
      dialog.showModal();
    });
  }
  closeDialog.addEventListener("click", () => dialog.close());
  dialog.addEventListener("click", event => { if (event.target === dialog) dialog.close(); });
  document.querySelector(".language").hidden = false;
  document.querySelector(".filters").hidden = false;
})();
