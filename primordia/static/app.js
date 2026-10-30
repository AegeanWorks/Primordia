/*
 * Primordia observatory: play, pause, step, start a new world and fire shocks.
 * Every rule stays on the server; this file only asks for a fresh HTML fragment.
 */
(() => {
  "use strict";

  const live = document.getElementById("live");
  const playButton = document.getElementById("play-toggle");
  const statusLine = document.getElementById("status");
  const speedInput = document.getElementById("speed");
  const speedValue = document.getElementById("speed-value");
  const dialog = document.getElementById("new-world-dialog");
  const toast = document.getElementById("toast");

  let playing = false;
  let speed = Number(speedInput ? speedInput.value : 8) || 8;
  let timer = null;
  let busy = false;
  let toastTimer = null;

  function showToast(message, isError = false) {
    if (!toast || !message) {
      return;
    }
    toast.textContent = message;
    toast.classList.toggle("error", Boolean(isError));
    toast.classList.add("show");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("show"), 4500);
  }

  function ticksPerPulse() {
    return Math.max(1, Math.round(speed / 2));
  }

  function describeStatus() {
    if (!statusLine) {
      return;
    }
    statusLine.textContent = playing ? `playing ${speed}x` : "paused";
    statusLine.dataset.state = playing ? "playing" : "paused";
  }

  function schedule() {
    window.clearInterval(timer);
    timer = null;
    if (playing) {
      timer = window.setInterval(pulse, 500);
    }
  }

  function setPlaying(value) {
    playing = Boolean(value);
    if (playButton) {
      playButton.textContent = playing ? "Pause" : "Play";
      playButton.setAttribute("aria-pressed", playing ? "true" : "false");
    }
    describeStatus();
    schedule();
  }

  async function load(step, notice = "") {
    if (busy || !live) {
      return null;
    }
    busy = true;
    try {
      let url = `/live?step=${encodeURIComponent(step)}`;
      if (notice) {
        url += `&notice=${encodeURIComponent(notice)}`;
      }
      const response = await fetch(url, {
        cache: "no-store",
        headers: { "X-Primordia-UI": "1" },
      });
      if (!response.ok) {
        let message = `request failed (${response.status})`;
        try {
          const data = await response.json();
          message = data.why || data.error || message;
        } catch (ignored) {
          /* a plain error page keeps the status message */
        }
        throw new Error(message);
      }
      live.innerHTML = await response.text();
      return true;
    } catch (error) {
      showToast(error.message || "the observatory did not answer", true);
      return false;
    } finally {
      busy = false;
    }
  }

  async function pulse() {
    if (!playing || busy) {
      return;
    }
    const ok = await load(ticksPerPulse());
    if (ok === false) {
      setPlaying(false);
    }
  }

  async function fetchJson(url, options) {
    const response = await fetch(url, options);
    let data = null;
    const type = response.headers.get("content-type") || "";
    if (type.includes("application/json")) {
      data = await response.json();
    }
    if (!response.ok) {
      const message = data && (data.why || data.error);
      throw new Error(message || `request failed (${response.status})`);
    }
    return data;
  }

  async function createWorld(form) {
    const submit = form.querySelector('button[type="submit"]');
    if (submit) {
      submit.disabled = true;
    }
    try {
      const data = await fetchJson("/new", {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Primordia-UI": "1" },
      });
      showToast((data && data.notice) || "new world started");
      window.location.assign("/?play=1");
    } catch (error) {
      showToast(error.message || "the world could not start", true);
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  }

  async function fire(form) {
    const action = new URL(form.getAttribute("action"), window.location.href).pathname;
    const submit = form.querySelector("button");
    if (submit) {
      submit.disabled = true;
    }
    try {
      const data = await fetchJson(action, {
        method: "POST",
        body: new FormData(form),
        headers: { "X-Primordia-UI": "1" },
      });
      const notice = (data && data.notice) || "";
      await load(0, notice);
      if (notice) {
        showToast(notice);
      }
    } catch (error) {
      showToast(error.message || "the intervention was refused", true);
    } finally {
      if (submit) {
        submit.disabled = false;
      }
    }
  }

  function openStartDialog() {
    setPlaying(false);
    if (!dialog) {
      return;
    }
    if (typeof dialog.showModal === "function") {
      dialog.showModal();
    } else {
      dialog.setAttribute("open", "");
    }
  }

  function closeStartDialog() {
    if (!dialog) {
      return;
    }
    if (typeof dialog.close === "function") {
      dialog.close();
    } else {
      dialog.removeAttribute("open");
    }
  }

  document.addEventListener("click", (event) => {
    const target = event.target.closest("button, a");
    if (!target) {
      return;
    }
    if (target.id === "play-toggle") {
      setPlaying(!playing);
      return;
    }
    if (target.id === "new-world-button") {
      openStartDialog();
      return;
    }
    if (target.id === "new-world-cancel") {
      closeStartDialog();
      return;
    }
    const step = target.getAttribute("data-step");
    if (step) {
      setPlaying(false);
      load(Number(step));
    }
  });

  document.addEventListener("submit", (event) => {
    const form = event.target;
    if (!(form instanceof HTMLFormElement)) {
      return;
    }
    if (form.id === "new-world-form") {
      event.preventDefault();
      createWorld(form);
      return;
    }
    const action = form.getAttribute("action") || "";
    if (action.startsWith("/god/")) {
      event.preventDefault();
      fire(form);
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) {
      return;
    }
    const tag = (event.target.tagName || "").toLowerCase();
    if (["input", "textarea", "select", "button", "a"].includes(tag)
        || event.target.isContentEditable || (dialog && dialog.open)) {
      return;
    }
    if (event.code === "Space") {
      event.preventDefault();
      setPlaying(!playing);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      setPlaying(false);
      load(1);
    } else if (event.key.toLowerCase() === "n") {
      event.preventDefault();
      openStartDialog();
    }
  });

  if (speedInput) {
    speedInput.addEventListener("input", () => {
      speed = Number(speedInput.value) || 1;
      if (speedValue) {
        speedValue.textContent = `${speed}\u00d7`;
      }
      if (playing) {
        schedule();
        describeStatus();
      }
    });
  }

  if (live) {
    live.addEventListener("focusin", (event) => {
      if (playing && event.target.matches("input, select, textarea")) {
        setPlaying(false);
      }
    });
  }

  if (document.body.dataset.autoplay === "1") {
    setPlaying(true);
  } else {
    describeStatus();
  }
})();
