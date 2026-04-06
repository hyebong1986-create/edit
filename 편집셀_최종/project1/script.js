const canvasWrap = document.getElementById("canvasWrap");
const timelineScale = document.getElementById("timelineScale");
const timelineBoard = document.getElementById("timelineBoard");
const monthMarkerLayer = document.getElementById("monthMarkerLayer");
const scrollThumb = document.getElementById("scrollThumb");
const scrollTrack = document.getElementById("scrollTrack");

const todayLine = document.getElementById("todayLine");
const todayLabel = document.getElementById("todayLabel");
const plannedRange = document.getElementById("plannedRange");

const taskCard1 = document.getElementById("taskCard1");
const taskCard2 = document.getElementById("taskCard2");

const statusCard1 = document.getElementById("statusCard1");
const statusCard2 = document.getElementById("statusCard2");
const statusPercent1 = document.getElementById("statusPercent1");
const statusPercent2 = document.getElementById("statusPercent2");
const statusText1 = document.getElementById("statusText1");
const statusText2 = document.getElementById("statusText2");
const segbar1 = document.getElementById("segbar1");
const segbar2 = document.getElementById("segbar2");
const peopleGroup1 = document.getElementById("peopleGroup1");
const peopleGroup2 = document.getElementById("peopleGroup2");

const partnerText = document.getElementById("partnerText");
const detailList = document.getElementById("detailList");
const planDateStartText = document.getElementById("planDateStartText");
const planDateEndText = document.getElementById("planDateEndText");

const referenceSlides = document.querySelectorAll(".reference-slide");
const referenceDots = document.querySelectorAll(".ref-dot");
const refPrev = document.getElementById("refPrev");
const refNext = document.getElementById("refNext");

let offsetWeeks = 0;
let isDragging = false;
let dragStartX = 0;
let thumbStartLeft = 0;

const totalColumns = 11;
const mondayBase = new Date("2026-03-02T00:00:00");

function getTodayDate() {
  return new Date("2026-04-06T00:00:00");
}

const defaultState = {
  plannedStart: "2026-02-25",
  plannedEnd: "2026-04-20",

  task1Enabled: true,
  task1Name: "조감 IMG AI 제작",
  task1Start: "2026-02-25",
  task1End: "2026-03-30",
  task1Percent: 100,
  task1Workers: 2,
  statusText1: "3D·영상셀: 조감도IMG AI 제작",

  task2Enabled: true,
  task2Name: "보고서 편집",
  task2Start: "2026-03-30",
  task2End: "2026-04-06",
  task2Percent: 80,
  task2Workers: 2,
  statusText2: "편집셀: 보고서 한글편집",

  partner: "-",
  detailText: `(3.30) 조감도 이미지 AI 제작 완료
(3.30) 보고서 원고 수신
(4.3) 보고서 편집 진행 및 검토의견 반영하여 전달 완료
이후 피드백 반영`
};

const state = {
  reportDate: getTodayDate(),
  plannedStart: new Date(`${defaultState.plannedStart}T00:00:00`),
  plannedEnd: new Date(`${defaultState.plannedEnd}T00:00:00`),

  task1Enabled: defaultState.task1Enabled,
  task1Name: defaultState.task1Name,
  task1Start: new Date(`${defaultState.task1Start}T00:00:00`),
  task1End: new Date(`${defaultState.task1End}T00:00:00`),
  task1Percent: defaultState.task1Percent,
  task1Workers: defaultState.task1Workers,
  statusText1: defaultState.statusText1,

  task2Enabled: defaultState.task2Enabled,
  task2Name: defaultState.task2Name,
  task2Start: new Date(`${defaultState.task2Start}T00:00:00`),
  task2End: new Date(`${defaultState.task2End}T00:00:00`),
  task2Percent: defaultState.task2Percent,
  task2Workers: defaultState.task2Workers,
  statusText2: defaultState.statusText2,

  partner: defaultState.partner,
  detailText: defaultState.detailText
};

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

function diffDays(a, b) {
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function quarterOf(monthIndex) {
  return Math.floor(monthIndex / 3) + 1;
}

function formatDisplayDate(date, withPrefix = false) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return withPrefix ? `~ ${y}. ${m}. ${d}.` : `${y}. ${m}. ${d}.`;
}

function clampPercent(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(100, num));
}

function clampWorkers(value) {
  const num = Number(value);
  if (Number.isNaN(num)) return 0;
  return Math.max(0, Math.min(5, Math.round(num)));
}

function getMetrics() {
  const scaleWidth = timelineScale.clientWidth;
  const leftPadding = 18;
  const rightPadding = 18;
  const innerWidth = scaleWidth - leftPadding - rightPadding;
  const cellWidth = innerWidth / totalColumns;
  return { cellWidth, leftPadding };
}

function clearDynamic() {
  monthMarkerLayer.innerHTML = "";
  timelineScale.innerHTML = "";
  document.querySelectorAll(".vertical-grid").forEach((el) => el.remove());
}

function xFromDate(date) {
  const { cellWidth, leftPadding } = getMetrics();
  const startDate = addDays(mondayBase, offsetWeeks * 7);
  const days = diffDays(startDate, date);

  return leftPadding + (cellWidth / 2) + (days / 7) * cellWidth;
}

function buildScaleAndMarkers() {
  clearDynamic();

  const { cellWidth, leftPadding } = getMetrics();
  const dates = [];
  const plannedStartX = xFromDate(state.plannedStart);
  const plannedEndX = xFromDate(state.plannedEnd);

  for (let i = 0; i < totalColumns; i++) {
    const d = addDays(mondayBase, (offsetWeeks + i) * 7);
    dates.push(d);

    const item = document.createElement("div");
    item.className = "scale-item";

    const number = document.createElement("span");
    number.className = "scale-number";
    number.textContent = d.getDate();

    if (
      d.getFullYear() === state.reportDate.getFullYear() &&
      d.getMonth() === state.reportDate.getMonth() &&
      d.getDate() === state.reportDate.getDate()
    ) {
      item.classList.add("today-scale");
      number.textContent = String(state.reportDate.getDate());
    }

    item.appendChild(number);
    timelineScale.appendChild(item);
  }

  const seenMonths = new Set();

  dates.forEach((d, i) => {
    const key = `${d.getFullYear()}-${d.getMonth()}`;
    if (seenMonths.has(key)) return;
    seenMonths.add(key);

    const quarter = quarterOf(d.getMonth());
    const x = leftPadding + i * cellWidth + cellWidth / 2;

    const marker = document.createElement("div");
    marker.className = "month-marker";
    marker.style.left = `${x}px`;

    const quarterLabel = document.createElement("div");
    quarterLabel.className = "quarter-label";
    quarterLabel.textContent = `${d.getFullYear()}년 ${quarter}분기`;

    const monthLabel = document.createElement("div");
    monthLabel.className = "month-label";
    monthLabel.textContent = `${d.getMonth() + 1}월`;

    marker.appendChild(quarterLabel);
    marker.appendChild(monthLabel);

    if (x < plannedStartX || x > plannedEndX) {
      marker.classList.add("is-dim");
    }

    monthMarkerLayer.appendChild(marker);
  });
}

function renderVerticalGuides() {
  const { cellWidth, leftPadding } = getMetrics();
  const dates = [];

  for (let i = 0; i < totalColumns; i++) {
    dates.push(addDays(mondayBase, (offsetWeeks + i) * 7));
  }

  for (let i = 1; i < dates.length; i++) {
    const prev = dates[i - 1];
    const curr = dates[i];

    const isMonthBoundary =
      prev.getFullYear() !== curr.getFullYear() ||
      prev.getMonth() !== curr.getMonth();

    if (!isMonthBoundary) continue;

    const line = document.createElement("div");
    line.className = "vertical-grid";
    line.style.left = `${leftPadding + i * cellWidth}px`;
    timelineBoard.appendChild(line);
  }
}

function renderTodayMarker() {
  const x = xFromDate(state.reportDate);

  todayLine.style.left = `${x}px`;
  todayLabel.style.left = `${x}px`;
}

function renderPlannedRange() {
  const startX = xFromDate(state.plannedStart);
  const endX = xFromDate(state.plannedEnd);

  plannedRange.style.left = `${startX}px`;
  plannedRange.style.width = `${Math.max(0, endX - startX)}px`;
}

function renderTasks() {
  if (state.task1Enabled) {
    const task1X = xFromDate(state.task1Start);
    const task1EndX = xFromDate(state.task1End);
    taskCard1.textContent = state.task1Name;
    taskCard1.style.display = "block";
    taskCard1.style.left = `${task1X}px`;
    taskCard1.style.width = `${Math.max(220, task1EndX - task1X)}px`;
  } else {
    taskCard1.style.display = "none";
  }

  if (state.task2Enabled) {
    const task2X = xFromDate(state.task2Start);
    const task2EndX = xFromDate(state.task2End);
    taskCard2.textContent = state.task2Name;
    taskCard2.style.display = "block";
    taskCard2.style.left = `${task2X}px`;
    taskCard2.style.width = `${Math.max(240, task2EndX - task2X)}px`;
  } else {
    taskCard2.style.display = "none";
  }
}

function renderThumb() {
  const trackWidth = scrollTrack.clientWidth;
  const thumbWidth = scrollThumb.offsetWidth;
  const maxLeft = trackWidth - thumbWidth;
  const normalized = Math.max(-8, Math.min(8, offsetWeeks));
  const ratio = (normalized + 8) / 16;
  scrollThumb.style.left = `${ratio * maxLeft}px`;
}

function renderSegbar(container, percent) {
  container.innerHTML = "";
  const total = 10;
  const filled = Math.round(clampPercent(percent) / 10);

  for (let i = 0; i < total; i++) {
    const seg = document.createElement("span");
    seg.className = i < filled ? "seg fill" : "seg empty";
    container.appendChild(seg);
  }
}

function renderWorkerIcons(container, count) {
  container.innerHTML = "";
  const workers = clampWorkers(count);

  for (let i = 0; i < workers; i++) {
    const img = document.createElement("img");
    img.src = "img/people-gray.png";
    img.alt = "";
    img.className = "people-icon";
    container.appendChild(img);
  }
}

function renderDetailLines() {
  detailList.innerHTML = "";
  const lines = state.detailText
    .split("\n")
    .map((line) => line.trimEnd())
    .filter((line) => line.trim() !== "");

  lines.forEach((line, index) => {
    const p = document.createElement("p");
    p.textContent = line;

    if (index >= 2) p.classList.add("is-orange");
    if (index === 3) p.classList.add("is-indent");

    detailList.appendChild(p);
  });
}

function renderTexts() {
  planDateStartText.textContent = formatDisplayDate(state.plannedStart);
  planDateEndText.textContent = "~ 2026. 4월 중순";

  statusCard1.style.display = state.task1Enabled ? "block" : "none";
  statusCard2.style.display = state.task2Enabled ? "block" : "none";

  statusPercent1.textContent = `${clampPercent(state.task1Percent)}%`;
  statusPercent2.textContent = `${clampPercent(state.task2Percent)}%`;

  statusText1.textContent = state.statusText1;
  statusText2.textContent = state.statusText2;

  renderSegbar(segbar1, state.task1Percent);
  renderSegbar(segbar2, state.task2Percent);

  renderWorkerIcons(peopleGroup1, state.task1Workers);
  renderWorkerIcons(peopleGroup2, state.task2Workers);

  partnerText.textContent = `협업부서: ${state.partner}`;
  renderDetailLines();
}

function renderAll() {
  buildScaleAndMarkers();
  renderVerticalGuides();
  renderPlannedRange();
  renderTasks();
  renderThumb();
  renderTexts();
  requestAnimationFrame(renderTodayMarker);
}

scrollThumb.addEventListener("mousedown", (e) => {
  isDragging = true;
  dragStartX = e.clientX;
  thumbStartLeft = parseFloat(scrollThumb.style.left || "0");
  document.body.style.userSelect = "none";
});

window.addEventListener("mousemove", (e) => {
  if (!isDragging) return;

  const trackWidth = scrollTrack.clientWidth;
  const thumbWidth = scrollThumb.offsetWidth;
  const maxLeft = trackWidth - thumbWidth;

  let newLeft = thumbStartLeft + (e.clientX - dragStartX);
  newLeft = Math.max(0, Math.min(maxLeft, newLeft));

  const ratio = maxLeft === 0 ? 0 : newLeft / maxLeft;
  const nextOffset = Math.round(ratio * 16 - 8);

  if (nextOffset !== offsetWeeks) {
    offsetWeeks = nextOffset;
    renderAll();
  } else {
    scrollThumb.style.left = `${newLeft}px`;
  }
});

window.addEventListener("mouseup", () => {
  if (!isDragging) return;
  isDragging = false;
  document.body.style.userSelect = "";
  renderThumb();
});

window.addEventListener("resize", renderAll);

let currentSlide = 0;

function showSlide(index) {
  if (index < 0) index = referenceSlides.length - 1;
  if (index >= referenceSlides.length) index = 0;

  currentSlide = index;

  referenceSlides.forEach((slide, i) => {
    slide.classList.toggle("active", i === currentSlide);
  });

  referenceDots.forEach((dot, i) => {
    dot.classList.toggle("active", i === currentSlide);
  });
}

refPrev.addEventListener("click", () => showSlide(currentSlide - 1));
refNext.addEventListener("click", () => showSlide(currentSlide + 1));
referenceDots.forEach((dot) => {
  dot.addEventListener("click", () => showSlide(Number(dot.dataset.index)));
});

function init() {
  showSlide(0);
  renderAll();
}

init();