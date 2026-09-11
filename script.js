const API_BASE = "https://mansick-ml-project.onrender.com";

/* ---------- nav toggle ---------- */

const navToggle = document.getElementById("nav-toggle");
const navLinks = document.getElementById("nav-links");

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("is-open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navLinks.querySelectorAll("a").forEach((link) => {
  link.addEventListener("click", () => {
    navLinks.classList.remove("is-open");
    navToggle.setAttribute("aria-expanded", "false");
  });
});

/* ---------- assessment form ---------- */

const form = document.getElementById("assessment-form");
const resultCard = document.getElementById("result-card");
const submitBtn = document.getElementById("submit-btn");
const formError = document.getElementById("form-error");

const scoreValueEl = document.getElementById("score-value");
const scoreScaleEl = document.getElementById("score-scale");
const scoreLabelEl = document.getElementById("score-label");
const retryBtn = document.getElementById("retry-btn");

const scoreMeter = document.getElementById("score-meter");
const meterTag = document.getElementById("meter-tag");
const meterTagValue = document.getElementById("meter-tag-value");

form.addEventListener("submit", handleSubmit);
retryBtn.addEventListener("click", resetToForm);

async function handleSubmit(event) {
  event.preventDefault();
  hideError();

  if (!form.reportValidity()) {
    return;
  }

  const payload = buildPayload();
  setLoading(true);

  try {
    const response = await fetch(`${API_BASE}/predict`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const body = await safeJson(response);
      throw new Error(describeError(response.status, body));
    }

    const data = await response.json();
    showResult(data.predicted_mental_health_score);
  } catch (err) {
    showError(err.message || "Something went wrong while reaching the API.");
  } finally {
    setLoading(false);
  }
}

function buildPayload() {
  const data = new FormData(form);

  return {
    age: Number(data.get("age")),
    gender: data.get("gender"),
    country: data.get("country"),
    academic_level: data.get("academic_level"),
    most_used_platform: data.get("most_used_platform"),
    purpose_of_use: data.get("purpose_of_use"),
    avg_daily_usage_hours: Number(data.get("avg_daily_usage_hours")),
    daily_unlocks: Number(data.get("daily_unlocks")),
    study_hours: Number(data.get("study_hours")),
    physical_activity_hours: Number(data.get("physical_activity_hours")),
    sleep_hours_per_night: Number(data.get("sleep_hours_per_night")),
    stress_level: data.get("stress_level"),
  };
}

function setLoading(isLoading) {
  submitBtn.classList.toggle("is-loading", isLoading);
  submitBtn.disabled = isLoading;
}

function showError(message) {
  formError.textContent = message;
  formError.hidden = false;
}

function hideError() {
  formError.hidden = true;
  formError.textContent = "";
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch (_) {
    return null;
  }
}

function describeError(status, body) {
  if (body && Array.isArray(body.detail)) {
    return body.detail.map((item) => item.msg).join(", ");
  }
  if (body && typeof body.detail === "string") {
    return body.detail;
  }
  if (status === 0) {
    return `Can't reach the API at ${API_BASE}. Make sure the server is running.`;
  }
  return `The API returned an error (status ${status}).`;
}

/* ---------- result + meter ---------- */

function showResult(rawScore) {
  const score = Number(rawScore);
  const maxScale = score > 10 ? 100 : 10;
  const percent = clamp((score / maxScale) * 100, 0, 100);
  const zone = zoneFor(percent);

  scoreValueEl.textContent = Number.isInteger(score) ? score : score.toFixed(1);
  scoreScaleEl.textContent = `/ ${maxScale}`;
  scoreLabelEl.textContent = zone.longLabel;

  updateMeter(percent, zone);

  form.hidden = true;
  resultCard.hidden = false;
  resultCard.classList.remove("animate-in");
  void resultCard.offsetWidth; // restart the reveal animation
  resultCard.classList.add("animate-in");

  scoreMeter.scrollIntoView({ behavior: "smooth", block: "center" });
  window.setTimeout(() => {
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 700);
}

function updateMeter(percent, zone) {
  meterTag.classList.remove("zone-neutral", "zone-poor", "zone-low", "zone-fair", "zone-good", "zone-great");
  meterTag.classList.add(zone.className);
  meterTagValue.textContent = zone.shortLabel;
  meterTag.style.left = `${percent}%`;
}

function zoneFor(percent) {
  if (percent < 20) return { className: "zone-poor", shortLabel: "Poor", longLabel: "Needs attention" };
  if (percent < 40) return { className: "zone-low", shortLabel: "Low", longLabel: "Struggling a bit" };
  if (percent < 60) return { className: "zone-fair", shortLabel: "Fair", longLabel: "Holding steady" };
  if (percent < 80) return { className: "zone-good", shortLabel: "Good", longLabel: "Doing well" };
  return { className: "zone-great", shortLabel: "Great", longLabel: "Thriving" };
}

function resetToForm() {
  resultCard.hidden = true;
  form.hidden = false;
  meterTag.classList.remove("zone-poor", "zone-low", "zone-fair", "zone-good", "zone-great");
  meterTag.classList.add("zone-neutral");
  meterTagValue.textContent = "—";
  meterTag.style.left = "50%";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}