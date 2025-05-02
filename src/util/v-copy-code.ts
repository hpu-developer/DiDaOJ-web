export function enhanceCodeCopy(container: HTMLElement) {
  const codeEls = container.querySelectorAll("pre > code:not([data-copy-attached])");
  codeEls.forEach((code: any) => {
    code.setAttribute("data-copy-attached", "true");

    const pre = code.parentElement!;
    const wrapper = document.createElement("div");
    wrapper.className = "copy-wrapper";

    const btn = document.createElement("button");
    btn.className = "copy-btn";
    btn.innerText = "复制";

    btn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.innerText);
        btn.innerText = "已复制";
        setTimeout(() => (btn.innerText = "复制"), 1500);
      } catch {
        btn.innerText = "失败";
      }
    });

    pre.replaceWith(wrapper);
    wrapper.appendChild(btn);
    wrapper.appendChild(pre);
  });
}
