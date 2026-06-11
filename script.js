"use strict";

const MEDIAPIPE_MODULE_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs";
const MEDIAPIPE_WASM_URL =
  "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const FACE_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/latest/blaze_face_short_range.tflite";

const screens = {
  intro: document.querySelector("#introScreen"),
  input: document.querySelector("#inputScreen"),
  loading: document.querySelector("#loadingScreen"),
  result: document.querySelector("#resultScreen"),
};

const elements = {
  brandButton: document.querySelector("#brandButton"),
  todayLabel: document.querySelector("#todayLabel"),
  startButton: document.querySelector("#startButton"),
  fortuneForm: document.querySelector("#fortuneForm"),
  nameInput: document.querySelector("#nameInput"),
  nameCount: document.querySelector("#nameCount"),
  nameError: document.querySelector("#nameError"),
  nameReadyItem: document.querySelector("#nameReadyItem"),
  nameReadyText: document.querySelector("#nameReadyText"),
  photoReadyItem: document.querySelector("#photoReadyItem"),
  photoReadyText: document.querySelector("#photoReadyText"),
  readyCount: document.querySelector("#readyCount"),
  cameraFrame: document.querySelector("#cameraFrame"),
  cameraVideo: document.querySelector("#cameraVideo"),
  captureCanvas: document.querySelector("#captureCanvas"),
  capturedImage: document.querySelector("#capturedImage"),
  cameraPlaceholder: document.querySelector("#cameraPlaceholder"),
  faceGuide: document.querySelector("#faceGuide"),
  cameraStatus: document.querySelector("#cameraStatus"),
  cameraStatusText: document.querySelector("#cameraStatusText"),
  cameraButton: document.querySelector("#cameraButton"),
  captureButton: document.querySelector("#captureButton"),
  retakeButton: document.querySelector("#retakeButton"),
  submitButton: document.querySelector("#submitButton"),
  loadingPhoto: document.querySelector("#loadingPhoto"),
  loadingTitle: document.querySelector("#loadingTitle"),
  loadingSubtext: document.querySelector("#loadingSubtext"),
  loadingProgress: document.querySelector("#loadingProgress"),
  loadingPercent: document.querySelector("#loadingPercent"),
  resultName: document.querySelector("#resultName"),
  resultDate: document.querySelector("#resultDate"),
  resultTitle: document.querySelector("#resultTitle"),
  resultSubtitle: document.querySelector("#resultSubtitle"),
  resultScore: document.querySelector("#resultScore"),
  scoreTrack: document.querySelector("#scoreTrack"),
  scoreFill: document.querySelector("#scoreFill"),
  scoreMarker: document.querySelector("#scoreMarker"),
  resultDescription: document.querySelector("#resultDescription"),
  rerollButton: document.querySelector("#rerollButton"),
  homeButton: document.querySelector("#homeButton"),
};

const state = {
  faceDetector: null,
  detectorLoading: false,
  detectorUnavailable: false,
  stream: null,
  detectionFrame: null,
  lastDetectionAt: 0,
  faceDetected: false,
  photoDataUrl: "",
  capturedAt: null,
  rerollCount: 0,
  sessionVariation: createSessionVariation(),
};

const warningTargets = [
  {
    subject: "길 위의 바나나를",
    endings: ["조심하세요.", "가볍게 보지 마세요."],
    tone: "unexpected",
  },
  {
    subject: "커피 뚜껑을",
    endings: ["너무 믿지 마세요.", "끝까지 확인하세요."],
    tone: "routine",
  },
  {
    subject: "자동문 앞에서",
    endings: ["너무 당당하지 마세요.", "반 박자만 천천히 움직이세요."],
    tone: "timing",
  },
  {
    subject: "가까운 모서리를",
    endings: ["조심하세요.", "평소보다 조금 더 의식하세요."],
    tone: "routine",
  },
  {
    subject: "급하게 닫히는 엘리베이터 문을",
    endings: ["몸으로 설득하지 마세요.", "한 번 보내줄 줄도 아세요."],
    tone: "timing",
  },
  {
    subject: "방금 내려놓은 물건의 위치를",
    endings: ["너무 확신하지 마세요.", "한 번 더 기억해두세요."],
    tone: "memory",
  },
  {
    subject: "주머니 속 열린 펜을",
    endings: ["조심하세요.", "늦기 전에 확인하세요."],
    tone: "routine",
  },
  {
    subject: "의자처럼 보이는 모든 것을",
    endings: ["바로 믿지 마세요.", "앉기 전에 확인하세요."],
    tone: "unexpected",
  },
  {
    subject: "완벽하게 익숙한 비밀번호를",
    endings: ["너무 자신하지 마세요.", "천천히 입력하세요."],
    tone: "memory",
  },
  {
    subject: "마지막 한 계단을",
    endings: ["잊지 마세요.", "끝까지 지켜보세요."],
    tone: "timing",
  },
  {
    subject: "방금 온 짧은 메시지를",
    endings: ["너무 깊게 해석하지 마세요.", "두 번 읽고 한 번만 답하세요."],
    tone: "words",
  },
  {
    subject: "잘 닫힌 것 같은 가방 지퍼를",
    endings: ["한 번 더 확인하세요.", "소리까지 듣고 믿으세요."],
    tone: "routine",
  },
  {
    subject: "예상보다 뜨거운 첫 모금을",
    endings: ["조심하세요.", "서두르지 마세요."],
    tone: "timing",
  },
  {
    subject: "뒤에서 조용히 다가오는 날벼락을",
    endings: ["조심하세요.", "눈치보다 먼저 피하세요."],
    tone: "unexpected",
  },
  {
    subject: "양말 한쪽의 독립 선언을",
    endings: ["가볍게 넘기지 마세요.", "외출 전에 막아두세요."],
    tone: "memory",
  },
  {
    subject: "충전기 없는 12퍼센트를",
    endings: ["낙관하지 마세요.", "지금부터 아껴 쓰세요."],
    tone: "routine",
  },
];

const subtitlesByTone = {
  unexpected: [
    "갑작스러운 사건은 보통 아무 예고 없이 조용히 다가옵니다.",
    "평범해 보이는 장면일수록 작은 반전이 숨어 있을 수 있습니다.",
    "오늘의 변수는 가장 예상하지 못한 위치에서 존재감을 드러냅니다.",
  ],
  routine: [
    "사소한 변수는 언제나 가장 평범한 모습으로 다가옵니다.",
    "익숙함은 편리하지만 확인 한 번을 생략하게 만들기도 합니다.",
    "작은 방심은 생각보다 넓은 범위에 흔적을 남깁니다.",
  ],
  timing: [
    "오늘은 속도보다 정확한 한 박자가 더 큰 행운을 만듭니다.",
    "서두르는 순간보다 잠깐 멈추는 순간에 답이 있습니다.",
    "반 박자의 여유가 예상 밖의 실수를 조용히 비껴가게 합니다.",
  ],
  memory: [
    "분명하다고 느끼는 기억일수록 한 번 더 확인할 가치가 있습니다.",
    "오늘의 작은 혼선은 기억과 현실 사이에서 시작될 수 있습니다.",
    "찾는 일보다 미리 기억해두는 일이 훨씬 쉬운 하루입니다.",
  ],
  words: [
    "짧은 말은 생각보다 긴 여운을 남길 수 있습니다.",
    "오늘은 빠른 대답보다 정확한 이해가 먼저입니다.",
    "말 사이의 빈칸을 상상으로 너무 많이 채우지 마세요.",
  ],
};

const flowOpenings = [
  "오늘은 전체적으로 나쁘지 않은 흐름입니다.",
  "오늘의 흐름은 대체로 안정적인 편입니다.",
  "크게 걱정할 일은 없지만 작은 신호가 자주 보이는 날입니다.",
  "좋은 기운이 천천히 올라오고 있는 하루입니다.",
];

const flowMiddles = {
  high: [
    "예상 밖의 상황에서도 침착함이 금방 균형을 되찾아 줄 수 있습니다.",
    "평소의 감각을 믿되 마지막 확인만 더하면 좋은 흐름을 지킬 수 있습니다.",
  ],
  medium: [
    "다만 익숙한 장소나 반복되는 행동에서 작은 실수가 생길 수 있습니다.",
    "사소한 일정 변경이 생각보다 집중력을 흐릴 수 있습니다.",
  ],
  low: [
    "오늘은 작은 방심이 연달아 이어지지 않도록 초반에 끊어주는 것이 중요합니다.",
    "평소라면 지나칠 일도 오늘은 한 번 더 눈에 담아두는 편이 좋습니다.",
  ],
};

const flowClosings = [
  "급하게 움직이기보다 한 번 더 확인하는 태도가 좋습니다.",
  "잠깐의 여유를 챙기면 대부분의 변수는 무난하게 지나갑니다.",
  "결국 오늘의 행운은 침착한 사람 편에 설 가능성이 높습니다.",
  "작은 확인 하나가 하루의 리듬을 꽤 편안하게 만들어 줄 것입니다.",
];

const loadingMessages = [
  {
    title: "오늘의 불길한 기운을 확인하는 중입니다",
    subtext: "평범한 하루에 숨어 있는 작은 변수를 찾고 있습니다.",
  },
  {
    title: "사소한 위험을 감지하는 중입니다",
    subtext: "모서리, 뚜껑, 타이밍의 미세한 신호를 살펴보고 있습니다.",
  },
  {
    title: "행운지수를 계산하는 중입니다",
    subtext: "이름과 오늘의 흐름을 조심스럽게 조합하고 있습니다.",
  },
];

function createSessionVariation() {
  if (window.crypto?.getRandomValues) {
    return window.crypto.getRandomValues(new Uint32Array(1))[0] % 29;
  }
  return Math.floor(Math.random() * 29);
}

function formatDate(date, includeWeekday = true) {
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(includeWeekday ? { weekday: "long" } : {}),
  }).format(date);
}

function switchScreen(name) {
  Object.entries(screens).forEach(([screenName, screen]) => {
    const isActive = screenName === name;
    screen.classList.toggle("is-active", isActive);
    screen.setAttribute("aria-hidden", String(!isActive));
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function setCameraStatus(message, type = "default") {
  elements.cameraStatusText.textContent = message;
  elements.cameraStatus.classList.toggle("is-success", type === "success");
  elements.cameraStatus.classList.toggle("is-error", type === "error");
}

function updateReadyState() {
  const trimmedName = elements.nameInput.value.trim();
  const hasName = trimmedName.length > 0;
  const hasPhoto = Boolean(state.photoDataUrl);
  const readyTotal = Number(hasName) + Number(hasPhoto);

  elements.nameCount.textContent = String(elements.nameInput.value.length);
  elements.nameReadyItem.classList.toggle("is-ready", hasName);
  elements.nameReadyText.textContent = hasName
    ? `${trimmedName}님으로 확인합니다`
    : "아직 입력되지 않았습니다";
  elements.photoReadyItem.classList.toggle("is-ready", hasPhoto);
  elements.photoReadyText.textContent = hasPhoto
    ? "촬영이 완료되었습니다"
    : "촬영을 기다리고 있습니다";
  elements.readyCount.textContent = `${readyTotal} / 2`;
  elements.submitButton.disabled = !(hasName && hasPhoto);

  if (hasName) {
    elements.nameError.textContent = "";
  }
}

async function initializeFaceDetector() {
  if (state.faceDetector || state.detectorLoading || state.detectorUnavailable) {
    return state.faceDetector;
  }

  state.detectorLoading = true;
  setCameraStatus("얼굴 감지 기능을 준비하고 있습니다");

  try {
    const { FaceDetector, FilesetResolver } = await import(MEDIAPIPE_MODULE_URL);
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    state.faceDetector = await FaceDetector.createFromOptions(vision, {
      baseOptions: {
        modelAssetPath: FACE_MODEL_URL,
        delegate: "CPU",
      },
      runningMode: "VIDEO",
      minDetectionConfidence: 0.55,
      minSuppressionThreshold: 0.3,
    });
    return state.faceDetector;
  } catch (error) {
    console.error("MediaPipe 얼굴 감지기를 불러오지 못했습니다.", error);
    state.detectorUnavailable = true;
    setCameraStatus("얼굴 감지 기능을 불러오지 못했습니다", "error");
    return null;
  } finally {
    state.detectorLoading = false;
  }
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraStatus("이 브라우저에서는 카메라를 사용할 수 없습니다", "error");
    elements.cameraPlaceholder.querySelector("strong").textContent =
      "카메라를 사용할 수 없습니다";
    elements.cameraPlaceholder.querySelector("p").textContent =
      "HTTPS 환경 또는 최신 브라우저에서 다시 시도해주세요.";
    return;
  }

  stopCamera();
  elements.cameraFrame.classList.remove("is-captured");
  elements.cameraPlaceholder.hidden = false;
  elements.cameraButton.disabled = true;
  elements.cameraButton.textContent = "카메라 연결 중";
  setCameraStatus("카메라 사용 권한을 확인하고 있습니다");

  try {
    const detectorPromise = initializeFaceDetector();
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: "user",
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
    });

    state.stream = stream;
    elements.cameraVideo.srcObject = stream;
    await elements.cameraVideo.play();
    elements.cameraPlaceholder.hidden = true;
    elements.cameraButton.hidden = true;

    const detector = await detectorPromise;
    if (detector) {
      setCameraStatus("얼굴을 화면 중앙에 맞춰주세요");
      runFaceDetection();
    } else {
      state.faceDetected = true;
      elements.captureButton.disabled = false;
      setCameraStatus("자동 감지 없이 촬영할 수 있습니다");
    }
  } catch (error) {
    console.error("카메라를 시작하지 못했습니다.", error);
    stopCamera();
    elements.cameraButton.hidden = false;
    elements.cameraButton.disabled = false;
    elements.cameraButton.textContent = "카메라 다시 켜기";
    elements.cameraPlaceholder.hidden = false;

    if (error?.name === "NotAllowedError") {
      setCameraStatus("카메라 권한이 필요합니다", "error");
      elements.cameraPlaceholder.querySelector("strong").textContent =
        "카메라 권한이 꺼져 있습니다";
      elements.cameraPlaceholder.querySelector("p").textContent =
        "주소창의 카메라 설정을 허용한 뒤 다시 시도해주세요.";
    } else {
      setCameraStatus("카메라 연결에 실패했습니다", "error");
      elements.cameraPlaceholder.querySelector("strong").textContent =
        "카메라를 연결하지 못했습니다";
      elements.cameraPlaceholder.querySelector("p").textContent =
        "다른 앱에서 카메라를 사용 중인지 확인해주세요.";
    }
  }
}

function runFaceDetection() {
  cancelAnimationFrame(state.detectionFrame);

  const detect = (timestamp) => {
    if (!state.stream || elements.cameraVideo.readyState < 2 || state.photoDataUrl) {
      return;
    }

    if (timestamp - state.lastDetectionAt >= 220) {
      state.lastDetectionAt = timestamp;
      try {
        const result = state.faceDetector.detectForVideo(elements.cameraVideo, timestamp);
        const detected = Boolean(result?.detections?.length);
        state.faceDetected = detected;
        elements.faceGuide.classList.toggle("is-detected", detected);
        elements.captureButton.disabled = !detected;
        setCameraStatus(
          detected ? "얼굴이 감지되었습니다" : "얼굴을 화면 중앙에 맞춰주세요",
          detected ? "success" : "default",
        );
      } catch (error) {
        console.error("얼굴 감지 중 오류가 발생했습니다.", error);
        state.faceDetected = true;
        elements.captureButton.disabled = false;
        setCameraStatus("자동 감지 없이 촬영할 수 있습니다");
      }
    }

    state.detectionFrame = requestAnimationFrame(detect);
  };

  state.detectionFrame = requestAnimationFrame(detect);
}

function capturePhoto() {
  if (!state.stream || elements.cameraVideo.readyState < 2) {
    return;
  }

  const video = elements.cameraVideo;
  const canvas = elements.captureCanvas;
  const maxWidth = 960;
  const scale = Math.min(1, maxWidth / video.videoWidth);
  canvas.width = Math.round(video.videoWidth * scale);
  canvas.height = Math.round(video.videoHeight * scale);

  const context = canvas.getContext("2d", { alpha: false });
  context.drawImage(video, 0, 0, canvas.width, canvas.height);
  state.photoDataUrl = canvas.toDataURL("image/jpeg", 0.84);
  state.capturedAt = new Date();
  state.rerollCount = 0;

  elements.capturedImage.src = state.photoDataUrl;
  elements.loadingPhoto.src = state.photoDataUrl;
  elements.cameraFrame.classList.add("is-captured");
  elements.captureButton.hidden = true;
  elements.retakeButton.hidden = false;
  setCameraStatus("촬영이 완료되었습니다", "success");
  stopCamera();
  updateReadyState();
}

async function retakePhoto() {
  clearPhoto();
  elements.cameraFrame.classList.remove("is-captured");
  elements.captureButton.hidden = false;
  elements.captureButton.disabled = true;
  elements.retakeButton.hidden = true;
  await startCamera();
}

function clearPhoto() {
  state.photoDataUrl = "";
  state.capturedAt = null;
  state.faceDetected = false;
  elements.capturedImage.removeAttribute("src");
  elements.loadingPhoto.removeAttribute("src");
  elements.faceGuide.classList.remove("is-detected");
  updateReadyState();
}

function stopCamera() {
  cancelAnimationFrame(state.detectionFrame);
  state.detectionFrame = null;
  state.lastDetectionAt = 0;
  if (state.stream) {
    state.stream.getTracks().forEach((track) => track.stop());
    state.stream = null;
  }
  elements.cameraVideo.srcObject = null;
}

function resetExperience() {
  stopCamera();
  clearPhoto();
  state.rerollCount = 0;
  state.sessionVariation = createSessionVariation();
  elements.nameInput.value = "";
  elements.nameCount.textContent = "0";
  elements.nameError.textContent = "";
  elements.cameraFrame.classList.remove("is-captured");
  elements.cameraPlaceholder.hidden = false;
  elements.cameraPlaceholder.querySelector("strong").textContent =
    "카메라를 준비하고 있습니다";
  elements.cameraPlaceholder.querySelector("p").textContent =
    "브라우저에서 카메라 사용을 허용해주세요.";
  elements.cameraButton.hidden = false;
  elements.cameraButton.disabled = false;
  elements.cameraButton.textContent = "카메라 켜기";
  elements.captureButton.hidden = false;
  elements.captureButton.disabled = true;
  elements.retakeButton.hidden = true;
  elements.scoreFill.style.width = "0";
  elements.scoreMarker.style.left = "0";
  setCameraStatus("카메라를 켜서 얼굴을 촬영해주세요");
  updateReadyState();
  switchScreen("intro");
}

function hashString(value) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed) {
  return function random() {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick(list, random) {
  return list[Math.floor(random() * list.length)];
}

function buildFortune() {
  const name = elements.nameInput.value.trim();
  const capturedAt = state.capturedAt || new Date();
  const dayKey = [
    capturedAt.getFullYear(),
    String(capturedAt.getMonth() + 1).padStart(2, "0"),
    String(capturedAt.getDate()).padStart(2, "0"),
  ].join("-");
  const timeBlock = Math.floor(
    (capturedAt.getHours() * 60 + capturedAt.getMinutes()) / 20,
  );
  const stableSeed = hashString(`${name.normalize("NFC")}|${dayKey}`);
  const variationSeed = hashString(
    `${timeBlock}|${state.sessionVariation}|${state.rerollCount}`,
  );
  const random = mulberry32((stableSeed ^ variationSeed) >>> 0);

  const targetIndex =
    (stableSeed + state.rerollCount * 5 + Math.floor(random() * 4)) %
    warningTargets.length;
  const target = warningTargets[targetIndex];
  const ending = pick(target.endings, random);
  const warning = `오늘은 ${target.subject} ${ending}`;
  const subtitle = pick(subtitlesByTone[target.tone], random);

  const baseScore = 63 + (stableSeed % 27);
  const scoreVariation = Math.floor(random() * 15) - 7 + state.rerollCount * 2;
  const score = Math.max(50, Math.min(100, baseScore + scoreVariation));
  const scoreBand = score >= 82 ? "high" : score >= 67 ? "medium" : "low";
  const description = [
    pick(flowOpenings, random),
    pick(flowMiddles[scoreBand], random),
    pick(flowClosings, random),
  ].join(" ");

  return { name, warning, subtitle, score, description, date: capturedAt };
}

function renderResult(result) {
  elements.resultName.textContent = result.name;
  elements.resultDate.textContent = formatDate(result.date, false);
  elements.resultTitle.textContent = result.warning;
  elements.resultSubtitle.textContent = result.subtitle;
  elements.resultDescription.textContent = result.description;
  elements.scoreTrack.setAttribute("aria-valuenow", String(result.score));

  const scorePosition = ((result.score - 50) / 50) * 100;
  elements.resultScore.textContent = "50";
  elements.scoreFill.style.width = "0";
  elements.scoreMarker.style.left = "0";

  switchScreen("result");

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      elements.scoreFill.style.width = `${scorePosition}%`;
      elements.scoreMarker.style.left = `${scorePosition}%`;
      animateNumber(elements.resultScore, 50, result.score, 850);
    });
  });
}

function animateNumber(element, start, end, duration) {
  const startedAt = performance.now();

  const tick = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = String(Math.round(start + (end - start) * eased));
    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
}

function runLoadingSequence(result) {
  switchScreen("loading");
  elements.loadingProgress.style.width = "0";
  elements.loadingPercent.textContent = "0";

  const duration = 2800;
  const startedAt = performance.now();
  let messageIndex = -1;

  const update = (now) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    const percent = Math.round(progress * 100);
    const nextMessageIndex = Math.min(
      loadingMessages.length - 1,
      Math.floor(progress * loadingMessages.length),
    );

    if (nextMessageIndex !== messageIndex) {
      messageIndex = nextMessageIndex;
      const message = loadingMessages[messageIndex];
      elements.loadingTitle.textContent = message.title;
      elements.loadingSubtext.textContent = message.subtext;
    }

    elements.loadingProgress.style.width = `${percent}%`;
    elements.loadingPercent.textContent = String(percent);

    if (progress < 1) {
      requestAnimationFrame(update);
    } else {
      window.setTimeout(() => renderResult(result), 180);
    }
  };

  requestAnimationFrame(update);
}

function handleSubmit(event) {
  event.preventDefault();
  const name = elements.nameInput.value.trim();

  if (!name) {
    elements.nameError.textContent = "이름을 입력해주세요.";
    elements.nameInput.focus();
    return;
  }

  if (!state.photoDataUrl) {
    setCameraStatus("얼굴 촬영을 먼저 완료해주세요", "error");
    return;
  }

  state.rerollCount = 0;
  runLoadingSequence(buildFortune());
}

function showInputScreen() {
  switchScreen("input");
  window.setTimeout(() => elements.nameInput.focus(), 350);
}

elements.todayLabel.textContent = formatDate(new Date());
elements.resultDate.textContent = formatDate(new Date(), false);
updateReadyState();

elements.startButton.addEventListener("click", showInputScreen);
elements.brandButton.addEventListener("click", resetExperience);
elements.homeButton.addEventListener("click", resetExperience);
elements.cameraButton.addEventListener("click", startCamera);
elements.captureButton.addEventListener("click", capturePhoto);
elements.retakeButton.addEventListener("click", retakePhoto);
elements.fortuneForm.addEventListener("submit", handleSubmit);

elements.nameInput.addEventListener("input", () => {
  if (elements.nameInput.value.length > 12) {
    elements.nameInput.value = elements.nameInput.value.slice(0, 12);
  }
  updateReadyState();
});

elements.rerollButton.addEventListener("click", () => {
  state.rerollCount += 1;
  runLoadingSequence(buildFortune());
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && state.stream) {
    stopCamera();
    elements.cameraButton.hidden = false;
    elements.cameraButton.disabled = false;
    elements.cameraButton.textContent = "카메라 다시 켜기";
    elements.cameraPlaceholder.hidden = false;
    setCameraStatus("카메라가 일시 정지되었습니다");
  }
});

window.addEventListener("beforeunload", stopCamera);
