(function () {
  "use strict";

  const GOAL = 1_000_000;
  const START_CASH = 1_000;
  const MEAL_BASE = 35;
  const MEAL_STEP = 12;
  const CLINIC_BASE = 70;
  const CLINIC_STEP = 22;
  const MEAL_HEAL_BASE = 15;
  const MEAL_HUNGER_BASE = 40;
  const CLINIC_HEAL_BASE = 50;
  const MAX_HEALTH = 100;
  const MAX_HUNGER = 100;
  const MAX_CANDLES = 30;
  const DAILY_EVENT_CHANCE = 0.52;
  const STATUS_EFFECT_CHANCE = 0.14;
  const DELIST_THRESHOLD = 5;
  const CANDLE_SLOT_WIDTH = 17;
  const MIN_CANDLE_BODY = 4;
  const INFO_PRICE_RATIO = 0.2;
  const LOAN_CAP_MULT = 2.5;
  const LOAN_INTEREST_INTERVAL = 5;
  const LOAN_INTEREST_RATE = 0.06;

  function basePriceFromVol(volatility) {
    return Math.round(45 + volatility * 950);
  }

  const STOCKS = [
    {
      id: "stable",
      name: "안정전자",
      desc: "변동성 낮음 · 안정적",
      volatility: 0.04,
      trend: 0.002,
      color: "#3d9eff",
      aliases: ["안정전자", "드림전자", "한빛전자", "미래반도체"],
    },
    {
      id: "bio",
      name: "바이오헬스",
      desc: "변동성 중간 · 성장주",
      volatility: 0.08,
      trend: 0.004,
      color: "#3dd68c",
      aliases: ["바이오헬스", "메디케어", "생명과학", "뉴바이오"],
    },
    {
      id: "energy",
      name: "에너지파워",
      desc: "변동성 중상 · 원자재",
      volatility: 0.1,
      trend: 0.003,
      color: "#ff9f43",
      aliases: ["에너지파워", "그린에너지", "솔라텍", "풍력코어"],
    },
    {
      id: "ai",
      name: "AI네트웍스",
      desc: "변동성 높음 · 기술주",
      volatility: 0.12,
      trend: 0.005,
      color: "#a78bfa",
      aliases: ["AI네트웍스", "딥러닝", "스마트AI", "퓨처봇"],
    },
    {
      id: "crypto",
      name: "크립토코인",
      desc: "변동성 최고 · 고위험",
      volatility: 0.15,
      trend: 0.001,
      color: "#ffc857",
      aliases: ["크립토코인", "디지코인", "넥스트코인", "메타체인"],
    },
  ].map((s) => ({ ...s, basePrice: basePriceFromVol(s.volatility) }));

  const NEWS = [
    "시장이 조용합니다. 오늘은 관망세가 이어집니다.",
    "금리 발표가 임박했습니다. 변동성이 커질 수 있습니다.",
    "바이오 섹터에 호재가 전해졌습니다.",
    "테크 주가 일제히 상승했습니다.",
    "글로벌 경기 둔화 우려로 하락 압력이 있습니다.",
    "개인 투자자 매수세가 유입되었습니다.",
    "암호화폐 규제 뉴스로 크립토가 요동칩니다.",
    "안정적인 실적 발표로 우량주가 강세입니다.",
  ];

  const DAILY_EVENTS = [
    { id: "flu", icon: "🤒", type: "health", tone: "bad", title: "감기", msg: "감기에 걸렸습니다.", health: -14, hunger: 8 },
    { id: "overwork", icon: "😫", type: "health", tone: "bad", title: "야근", msg: "야근으로 몸이 지쳤습니다.", health: -10, hunger: 12 },
    { id: "rain", icon: "🌧️", type: "health", tone: "bad", title: "궂은 날씨", msg: "비가 와 관절이 쑤십니다.", health: -8, hunger: 0 },
    { id: "food_poison", icon: "🤢", type: "health", tone: "bad", title: "식중독", msg: "식중독으로 고생했습니다.", health: -18, hunger: 15 },
    { id: "sleep", icon: "😴", type: "health", tone: "good", title: "숙면", msg: "충분한 수면을 취했습니다.", health: 12, hunger: -5 },
    { id: "exercise", icon: "🏃", type: "health", tone: "good", title: "운동", msg: "가벼운 운동으로 활력이 돌아왔습니다.", health: 10, hunger: 10 },
    { id: "walk", icon: "🚶", type: "health", tone: "good", title: "산책", msg: "친구와 산책하며 기분이 좋아졌습니다.", health: 8, hunger: 6 },
    { id: "vitamin", icon: "💊", type: "health", tone: "good", title: "비타민", msg: "비타민을 챙겨 몸이 가벼워졌습니다.", health: 6, hunger: -3 },
    { id: "checkup_ok", icon: "✅", type: "wellness", tone: "good", title: "검진 양호", msg: "건강 검진 결과가 양호합니다!", health: 15, hunger: 0 },
    { id: "meditation", icon: "🧘", type: "wellness", tone: "good", title: "명상", msg: "명상으로 스트레스가 줄었습니다.", health: 9, hunger: -8 },
    { id: "stress", icon: "😰", type: "wellness", tone: "bad", title: "스트레스", msg: "스트레스가 쌓여 건강이 나빠졌습니다.", health: -12, hunger: 5 },
    { id: "hospital_wait", icon: "🏥", type: "wellness", tone: "bad", title: "병원 대기", msg: "병원 대기로 하루가 힘들었습니다.", health: -6, hunger: 10 },
    { id: "skip_meal", icon: "🍽️", type: "hunger", tone: "bad", title: "거른 식사", msg: "밥을 거르고 일했습니다.", health: -5, hunger: 20 },
    { id: "home_meal", icon: "🍲", type: "hunger", tone: "good", title: "집밥", msg: "집밥을 든든히 먹었습니다.", health: 5, hunger: -25 },
    { id: "coin", icon: "🪙", type: "luck", tone: "good", title: "동전 발견", msg: "길에서 동전을 주웠습니다.", health: 3, hunger: -5, cash: 50 },
    { id: "lost_wallet", icon: "👛", type: "luck", tone: "bad", title: "지갑 분실", msg: "지갑을 잃어버렸습니다.", health: -3, hunger: 0, cash: -80 },
    { id: "food_sale", icon: "🏷️", type: "price", tone: "good", title: "밥값 할인", msg: "식료품 할인 행사가 열렸습니다! 밥값이 내려갑니다.", mealMult: 0.75 },
    { id: "food_inflate", icon: "📈", type: "price", tone: "bad", title: "식재료 폭등", msg: "식재료 가격이 급등했습니다. 밥값이 오릅니다.", mealFlat: 25 },
    { id: "clinic_sale", icon: "💉", type: "price", tone: "good", title: "의료 지원", msg: "정부 의료 지원으로 검진비가 싸집니다.", clinicMult: 0.7 },
    { id: "clinic_hike", icon: "🩺", type: "price", tone: "bad", title: "의료비 인상", msg: "병원비가 인상되었습니다. 검진비가 오릅니다.", clinicFlat: 35 },
    { id: "welfare", icon: "🎁", type: "price", tone: "good", title: "복지 쿠폰", msg: "복지 쿠폰을 받았습니다. 생활비가 전반적으로 내려갑니다.", mealMult: 0.85, clinicMult: 0.85 },
    { id: "inflation", icon: "🔥", type: "price", tone: "bad", title: "물가 상승", msg: "물가가 치솟았습니다. 식사·휴식 비용이 모두 비싸집니다.", mealFlat: 15, clinicFlat: 25 },
    { id: "restaurant_boom", icon: "🍜", type: "price", tone: "bad", title: "외식 붐", msg: "외식 수요가 늘어 밥값이 오릅니다.", mealMult: 1.25 },
    { id: "free_clinic", icon: "❤️‍🩹", type: "price", tone: "good", title: "무료 검진", msg: "지역 무료 검진 행사가 열렸습니다!", clinicFlat: -20 },
  ];

  const STATUS_POOL = [
    { id: "vigor", kind: "buff", icon: "💪", name: "활력", days: 3, desc: "매일 체력 +4", healthPerDay: 4 },
    { id: "lucky", kind: "buff", icon: "🍀", name: "행운", days: 2, desc: "매일 소액 보너스", cashPerDay: 30 },
    { id: "focus", kind: "buff", icon: "🎯", name: "집중", days: 3, desc: "정보 구매 30% 할인", infoDiscount: 0.7 },
    { id: "iron", kind: "buff", icon: "🛡️", name: "강인함", days: 2, desc: "배고픔 증가 -50%", hungerMult: 0.5 },
    { id: "fatigue", kind: "debuff", icon: "😩", name: "피로", days: 3, desc: "매일 체력 -5", healthPerDay: -5 },
    { id: "insomnia", kind: "debuff", icon: "🌙", name: "불면", days: 2, desc: "매일 배고픔 +8", hungerPerDay: 8 },
    { id: "panic", kind: "debuff", icon: "📉", name: "공포", days: 2, desc: "주가 변동성 +40%", volMult: 1.4 },
    { id: "flu_debuff", kind: "debuff", icon: "🤧", name: "몸살", days: 2, desc: "매일 체력 -8", healthPerDay: -8 },
  ];

  const MEAL_TIERS = [
    { key: "cup", label: "컵라면", icon: "🍜", mult: 0.4 },
    { key: "lunchbox", label: "도시락", icon: "🍱", mult: 0.65 },
    { key: "full", label: "한 상 정식", icon: "🍽️", mult: 0.85 },
    { key: "samgye", label: "삼계탕", icon: "🍲", mult: 1.1 },
    { key: "buffet", label: "뷔페", icon: "🥂", mult: 1.45 },
  ];

  const REST_TIERS = [
    { key: "walk", label: "산책", icon: "🚶", mult: 0.4 },
    { key: "hobby", label: "취미 생활", icon: "🎨", mult: 0.65 },
    { key: "home", label: "집캉스", icon: "🏠", mult: 0.85 },
    { key: "hotel", label: "호캉스", icon: "🏨", mult: 1.1 },
    { key: "travel", label: "여행", icon: "✈️", mult: 1.45 },
  ];

  let state;
  let gameStarted = false;
  let activeChartStock = "stable";
  let toastTimer = null;
  let savedQtyInputs = {};
  let delistNotices = [];
  let lastRenderedCash = START_CASH;

  function makeCandle(close) {
    const spread = Math.max(2, Math.round(close * 0.02));
    return {
      open: close,
      high: close + spread,
      low: Math.max(DELIST_THRESHOLD + 1, close - spread),
      close,
    };
  }

  function initState() {
    const stocks = {};
    STOCKS.forEach((s) => {
      const c = makeCandle(s.basePrice);
      stocks[s.id] = {
        price: s.basePrice,
        displayName: s.name,
        generation: 0,
        candles: [c],
        holdings: 0,
        avgCost: 0,
        infoUntilDay: 0,
        infoText: "",
        nextBias: 0,
      };
    });
    return {
      day: 1,
      cash: START_CASH,
      health: MAX_HEALTH,
      hunger: 0,
      stocks,
      gameOver: false,
      won: false,
      mealUses: 0,
      clinicUses: 0,
      mealMult: 1,
      clinicMult: 1,
      mealFlat: 0,
      clinicFlat: 0,
      statusEffects: [],
      loanDebt: 0,
    };
  }

  function getMealCost() {
    const raw = (MEAL_BASE + state.mealUses * MEAL_STEP + state.mealFlat) * state.mealMult;
    return Math.max(15, Math.round(raw));
  }

  function getClinicCost() {
    const raw = (CLINIC_BASE + state.clinicUses * CLINIC_STEP + state.clinicFlat) * state.clinicMult;
    return Math.max(25, Math.round(raw));
  }

  function rollFromTiers(tiers) {
    const idx = Math.floor(Math.random() * tiers.length);
    return tiers[idx];
  }

  function rollMealTier() {
    return rollFromTiers(MEAL_TIERS);
  }

  function rollRestTier() {
    return rollFromTiers(REST_TIERS);
  }

  function formatMoney(n) {
    return Math.floor(n).toLocaleString("ko-KR");
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function grossAssets() {
    let total = state.cash;
    STOCKS.forEach((s) => {
      const st = state.stocks[s.id];
      total += st.holdings * st.price;
    });
    return total;
  }

  function netAssets() {
    return grossAssets() - (state.loanDebt || 0);
  }

  function totalAssets() {
    return netAssets();
  }

  function getHighestStockPrice() {
    return Math.max(...STOCKS.map((s) => state.stocks[s.id].price));
  }

  function getMaxLoanCap() {
    return Math.max(50, Math.round(getHighestStockPrice() * LOAN_CAP_MULT));
  }

  function getRemainingLoanCapacity() {
    return Math.max(0, getMaxLoanCap() - state.loanDebt);
  }

  function hasAnyHoldings() {
    return STOCKS.some((s) => state.stocks[s.id].holdings > 0);
  }

  function canAffordAnyStock() {
    const minPrice = Math.min(...STOCKS.map((s) => state.stocks[s.id].price));
    return state.cash >= minPrice;
  }

  function canTakeLoan() {
    if (state.gameOver) return false;
    if (hasAnyHoldings()) return false;
    if (canAffordAnyStock()) return false;
    return getRemainingLoanCapacity() > 0;
  }

  function clampStat(value, max) {
    return Math.max(0, Math.min(max, value));
  }

  function setCash(newCash, animate) {
    const prev = state.cash;
    state.cash = Math.max(0, Math.floor(newCash));
    if (animate && prev !== state.cash) {
      state._cashAnim = state.cash > prev ? "up" : "down";
    }
  }

  function addCash(delta, animate) {
    if (!delta) return;
    setCash(state.cash + delta, animate !== false);
  }

  function animateCashDisplay() {
    const el = document.getElementById("stat-cash");
    if (!el || !state._cashAnim) return;
    el.classList.remove("cash-animate-up", "cash-animate-down", "cash-animate-pulse");
    void el.offsetWidth;
    el.classList.add(state.cash > lastRenderedCash ? "cash-animate-up" : "cash-animate-down");
    state._cashAnim = null;
    setTimeout(() => el.classList.remove("cash-animate-up", "cash-animate-down"), 700);
  }

  function showToast(message) {
    const el = document.getElementById("toast");
    el.textContent = message;
    el.classList.remove("hidden");
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.add("hidden"), 3200);
  }

  function showEventPopup(ev, detailText) {
    const card = document.querySelector("#event-popup .event-popup-card");
    card.classList.remove("status-card", "debuff-card", "life-card", "clinic-card");
    document.getElementById("event-popup-title").textContent = ev.title || "돌발 이벤트";
    document.getElementById("event-popup-desc").textContent = detailText || ev.msg;
    const imgEl = document.getElementById("event-popup-image");
    imgEl.textContent = "";
    const span = document.createElement("span");
    span.className = "event-emoji";
    span.setAttribute("aria-hidden", "true");
    span.textContent = ev.icon || "📢";
    imgEl.appendChild(span);
    document.getElementById("event-popup").classList.remove("hidden");
  }

  function hideEventPopup() {
    document.getElementById("event-popup").classList.add("hidden");
    const card = document.querySelector("#event-popup .event-popup-card");
    if (card) card.classList.remove("status-card", "debuff-card", "life-card", "clinic-card");
  }

  function buildStatusEffectDetail(def, daysLeft) {
    return `${def.desc}\n${daysLeft}일 남음`;
  }

  function showLifePopup(tier, detail, kind) {
    const card = document.querySelector("#event-popup .event-popup-card");
    card.classList.remove("status-card", "debuff-card", "life-card", "rest-card");
    card.classList.add("life-card");
    if (kind === "rest") card.classList.add("rest-card");
    const typeLabel = kind === "meal" ? "식사" : "휴식";
    document.getElementById("event-popup-title").textContent = `${typeLabel} — ${tier.label}`;
    document.getElementById("event-popup-desc").textContent = detail;
    const imgEl = document.getElementById("event-popup-image");
    imgEl.textContent = "";
    const span = document.createElement("span");
    span.className = "event-emoji";
    span.setAttribute("aria-hidden", "true");
    span.textContent = tier.icon;
    imgEl.appendChild(span);
    document.getElementById("event-popup").classList.remove("hidden");
  }

  function showStatusPopup(def, daysLeft, renewed) {
    if (state.gameOver) return;
    const kindLabel = def.kind === "buff" ? "버프" : "디버프";
    const card = document.querySelector("#event-popup .event-popup-card");
    card.classList.add("status-card", def.kind === "debuff" ? "debuff-card" : "");
    document.getElementById("event-popup-title").textContent =
      `${def.icon} ${kindLabel}: ${def.name}` + (renewed ? " (갱신)" : "");
    document.getElementById("event-popup-desc").textContent = buildStatusEffectDetail(def, daysLeft);
    const imgEl = document.getElementById("event-popup-image");
    imgEl.textContent = "";
    const span = document.createElement("span");
    span.className = "event-emoji";
    span.setAttribute("aria-hidden", "true");
    span.textContent = def.icon;
    imgEl.appendChild(span);
    document.getElementById("event-popup").classList.remove("hidden");
  }

  function showInfoPopup(title, desc) {
    document.getElementById("info-popup-title").textContent = title;
    document.getElementById("info-popup-desc").textContent = desc;
    document.getElementById("info-popup").classList.remove("hidden");
  }

  function hideInfoPopup() {
    document.getElementById("info-popup").classList.add("hidden");
  }

  function parseQuantity(stockId) {
    const input = document.getElementById(`qty-${stockId}`);
    if (!input) return { error: "수량 입력란을 찾을 수 없습니다." };
    const raw = String(input.value).trim();
    if (raw === "") return { error: "수량을 입력해 주세요." };
    if (/[.,]/.test(raw)) return { error: "소수는 사용할 수 없습니다. 1 이상의 정수만 입력하세요." };
    const num = Number(raw);
    if (!Number.isFinite(num) || !Number.isInteger(num)) {
      return { error: "소수는 사용할 수 없습니다. 1 이상의 정수만 입력하세요." };
    }
    if (num < 1) return { error: "음수나 0은 사용할 수 없습니다. 1 이상의 정수를 입력하세요." };
    return { value: num };
  }

  function getInfoDiscount() {
    let discount = 1;
    state.statusEffects.forEach((s) => {
      const def = STATUS_POOL.find((p) => p.id === s.id);
      if (def && def.infoDiscount) discount *= def.infoDiscount;
    });
    return discount;
  }

  function getInfoCost(stockId) {
    const price = state.stocks[stockId].price;
    return Math.max(5, Math.round(price * INFO_PRICE_RATIO * getInfoDiscount()));
  }

  function generateStockInfo(stockDef, stockState) {
    const volLabel =
      stockDef.volatility < 0.06 ? "낮음" : stockDef.volatility < 0.11 ? "중간" : "높음";
    const bias = stockState.nextBias;
    let forecast = "횡보 가능";
    if (bias > 0.02) forecast = "내일 상승 쏠림";
    else if (bias < -0.02) forecast = "내일 하락 쏠림";

    return (
      `변동성: ${volLabel} (${(stockDef.volatility * 100).toFixed(0)}%)\n` +
      `추세: ${stockDef.trend >= 0.003 ? "성장" : "보합"}\n` +
      `전망: ${forecast}\n` +
      `현재가 대비 정보 비용: ${formatMoney(getInfoCost(stockDef.id))}원 (20%)`
    );
  }

  function buyStockInfo(stockId) {
    if (state.gameOver) return;
    const def = STOCKS.find((s) => s.id === stockId);
    const st = state.stocks[stockId];
    const cost = getInfoCost(stockId);
    if (state.cash < cost) {
      showToast(`정보 구매 비용(${formatMoney(cost)}원)이 부족합니다.`);
      return;
    }
    addCash(-cost, true);
    st.infoUntilDay = state.day + 1;
    st.infoText = generateStockInfo(def, st);
    showInfoPopup(`${st.displayName} 종목 정보`, st.infoText);
    setNews(`${st.displayName} 정보 구매 (−${formatMoney(cost)}원)`);
    render();
  }

  function applyPriceEvent(ev) {
    if (ev.mealMult) state.mealMult = Math.max(0.5, state.mealMult * ev.mealMult);
    if (ev.clinicMult) state.clinicMult = Math.max(0.5, state.clinicMult * ev.clinicMult);
    if (ev.mealFlat) state.mealFlat += ev.mealFlat;
    if (ev.clinicFlat) state.clinicFlat += ev.clinicFlat;
  }

  function buildEventDetail(ev) {
    const parts = [ev.msg];
    if (ev.health) parts.push(`체력 ${ev.health > 0 ? "+" : ""}${ev.health}`);
    if (ev.hunger) parts.push(`배고픔 ${ev.hunger > 0 ? "+" : ""}${ev.hunger}`);
    if (ev.cash) parts.push(`현금 ${ev.cash > 0 ? "+" : ""}${ev.cash}원`);
    if (ev.mealMult || ev.mealFlat) parts.push(`현재 식사비 ${formatMoney(getMealCost())}원`);
    if (ev.clinicMult || ev.clinicFlat) parts.push(`현재 휴식비 ${formatMoney(getClinicCost())}원`);
    return parts.join("\n");
  }

  function applyEventEffects(ev) {
    state.health = clampStat(state.health + (ev.health || 0), MAX_HEALTH);
    state.hunger = clampStat(state.hunger + (ev.hunger || 0), MAX_HUNGER);
    if (ev.cash) addCash(ev.cash, true);
    if (ev.type === "price") applyPriceEvent(ev);
  }

  function applyDailyRandomEvent() {
    if (Math.random() > DAILY_EVENT_CHANCE) {
      hideEventBanner();
      return null;
    }

    const ev = DAILY_EVENTS[Math.floor(Math.random() * DAILY_EVENTS.length)];
    applyEventEffects(ev);

    const detail = buildEventDetail(ev);
    const gameEnded = state.health <= 0;

    if (gameEnded) {
      return `[${ev.title}] ${ev.msg}`;
    }

    showEventBanner(detail.replace(/\n/g, " · "), ev.tone);
    showEventPopup(ev, detail);
    return `[${ev.title}] ${ev.msg}`;
  }

  function showEventBanner(text, tone) {
    const el = document.getElementById("event-banner");
    el.textContent = text;
    el.classList.remove("hidden", "event-good", "event-bad", "event-neutral");
    el.classList.add(
      tone === "good" ? "event-good" : tone === "bad" ? "event-bad" : "event-neutral"
    );
  }

  function hideEventBanner() {
    document.getElementById("event-banner").classList.add("hidden");
  }

  function cloneStatus(def) {
    return { id: def.id, kind: def.kind, icon: def.icon, name: def.name, daysLeft: def.days, desc: def.desc };
  }

  function tryApplyRandomStatus() {
    if (Math.random() > STATUS_EFFECT_CHANCE) return null;
    const def = STATUS_POOL[Math.floor(Math.random() * STATUS_POOL.length)];
    const existing = state.statusEffects.find((s) => s.id === def.id);
    let renewed = false;
    let daysLeft = def.days;
    if (existing) {
      existing.daysLeft = def.days;
      daysLeft = existing.daysLeft;
      renewed = true;
    } else {
      state.statusEffects.push(cloneStatus(def));
    }
    if (!state.gameOver) {
      showStatusPopup(def, daysLeft, renewed);
    }
    return `${def.icon} ${def.kind === "buff" ? "버프" : "디버프"} [${def.name}] (${daysLeft}일) — ${def.desc}`;
  }

  function tickStatusEffects() {
    const msgs = [];
    state.statusEffects.forEach((eff) => {
      const def = STATUS_POOL.find((p) => p.id === eff.id);
      if (!def) return;
      if (def.healthPerDay) {
        state.health = clampStat(state.health + def.healthPerDay, MAX_HEALTH);
      }
      if (def.hungerPerDay) {
        let h = def.hungerPerDay;
        if (def.hungerMult) h = Math.round(h * def.hungerMult);
        state.hunger = clampStat(state.hunger + h, MAX_HUNGER);
      }
      if (def.cashPerDay) addCash(def.cashPerDay, false);
      eff.daysLeft -= 1;
    });
    state.statusEffects = state.statusEffects.filter((e) => {
      if (e.daysLeft <= 0) {
        msgs.push(`${e.name} 종료`);
        return false;
      }
      return true;
    });
    return msgs;
  }

  function getVolatilityMult() {
    let mult = 1;
    state.statusEffects.forEach((eff) => {
      const def = STATUS_POOL.find((p) => p.id === eff.id);
      if (def && def.volMult) mult *= def.volMult;
    });
    return mult;
  }

  function getHungerDayGain() {
    let gain = 18;
    state.statusEffects.forEach((eff) => {
      const def = STATUS_POOL.find((p) => p.id === eff.id);
      if (def && def.hungerMult) gain = Math.round(gain * def.hungerMult);
    });
    return gain;
  }

  function pickNewStockName(stockDef, generation) {
    const aliases = stockDef.aliases;
    const idx = generation % aliases.length;
    const suffix = generation >= aliases.length ? ` ${Math.floor(generation / aliases.length) + 1}` : "";
    return aliases[idx] + suffix;
  }

  function relistStock(stockDef, stockState, lastValidPrice) {
    const oldName = stockState.displayName;
    let payout = 0;
    if (stockState.holdings > 0) {
      const liquidPrice = Math.max(1, Math.floor(lastValidPrice * 0.25));
      payout = stockState.holdings * liquidPrice;
      addCash(payout, true);
    }
    stockState.generation += 1;
    const newPrice = Math.max(20, Math.round(stockDef.basePrice * (0.45 + Math.random() * 0.45)));
    stockState.displayName = pickNewStockName(stockDef, stockState.generation);
    stockState.holdings = 0;
    stockState.avgCost = 0;
    stockState.price = newPrice;
    stockState.candles = [makeCandle(newPrice)];
    stockState.infoUntilDay = 0;
    stockState.infoText = "";
    stockState.nextBias = (Math.random() - 0.5) * 0.06;
    return { oldName, newName: stockState.displayName, payout, newPrice, lastValidPrice };
  }

  function computeNextClose(prevClose, stockDef, stockState) {
    const volMult = getVolatilityMult();
    const effectiveVol = stockDef.volatility * volMult;
    const bias = stockState.nextBias || 0;
    let close = prevClose;
    let attempts = 0;
    const minMove = Math.max(1, Math.round(prevClose * 0.012));

    while (close === prevClose && attempts < 30) {
      const direction = Math.random() < 0.5 + bias * 2 ? -1 : 1;
      const shock = direction * (minMove / prevClose + Math.random() * effectiveVol);
      const drift = stockDef.trend * (Math.random() > 0.5 ? 1 : -1);
      close = Math.round(prevClose * (1 + shock + drift + bias));
      if (close === prevClose) close = prevClose + direction * minMove;
      attempts++;
    }
    if (close === prevClose) close = prevClose + (Math.random() < 0.5 ? -minMove : minMove);

    stockState.nextBias = (Math.random() - 0.5) * effectiveVol * 0.5;
    return close;
  }

  function pushCandle(stockState, open, close, stockDef) {
    const volMult = getVolatilityMult();
    const wick = Math.max(2, Math.round(Math.abs(close - open) * stockDef.volatility * volMult * 8 + 2));
    const high = Math.max(open, close) + Math.floor(Math.random() * wick) + 1;
    let low = Math.min(open, close) - Math.floor(Math.random() * wick) - 1;
    low = Math.max(DELIST_THRESHOLD + 1, low);
    if (high <= low) {
      return { open, high: Math.max(open, close) + 1, low: Math.min(open, close), close };
    }
    return { open, high, low, close };
  }

  function updateStockPrice(stockDef, stockState) {
    const prevClose = stockState.price;
    let close = computeNextClose(prevClose, stockDef, stockState);

    if (close <= DELIST_THRESHOLD) {
      const info = relistStock(stockDef, stockState, prevClose);
      delistNotices.push(
        `⚠ ${info.oldName} 상장폐지!` +
          (info.payout > 0 ? ` 환급 ${formatMoney(info.payout)}원.` : "") +
          ` → ${info.newName} (${formatMoney(info.newPrice)}원)`
      );
      return { delta: info.newPrice - prevClose, delisted: true };
    }

    const open = prevClose;
    const candle = pushCandle(stockState, open, close, stockDef);
    stockState.price = close;
    stockState.candles.push(candle);
    if (stockState.candles.length > MAX_CANDLES) stockState.candles.shift();
    return { delta: close - prevClose, delisted: false };
  }

  function passDay() {
    if (!gameStarted || state.gameOver) return;

    STOCKS.forEach((s) => {
      const st = state.stocks[s.id];
      if (st.infoUntilDay && state.day > st.infoUntilDay) {
        st.infoUntilDay = 0;
        st.infoText = "";
      }
    });

    delistNotices = [];
    const changes = [];
    STOCKS.forEach((s) => {
      changes.push({ name: state.stocks[s.id].displayName, ...updateStockPrice(s, state.stocks[s.id]) });
    });

    state.hunger = clampStat(state.hunger + getHungerDayGain(), MAX_HUNGER);
    const hungerPenalty = Math.floor(state.hunger / 25) * 4;
    state.health = Math.max(0, state.health - 6 - hungerPenalty);
    state.day += 1;

    const interestMsg = applyLoanInterest();

    const statusTickMsgs = tickStatusEffects();
    const statusMsg = tryApplyRandomStatus();
    const eventMsg = applyDailyRandomEvent();

    let newsText = NEWS[Math.floor(Math.random() * NEWS.length)];
    if (interestMsg) newsText = interestMsg + " · " + newsText;
    if (statusMsg) newsText = statusMsg + " · " + newsText;
    if (statusTickMsgs.length) newsText = statusTickMsgs.join(", ") + " · " + newsText;
    if (eventMsg) newsText = eventMsg + " · " + newsText;
    if (delistNotices.length) newsText = delistNotices.join(" ") + " · " + newsText;

    const parts = changes.map((c) => {
      const sign = c.delta > 0 ? "▲" : "▼";
      return `${c.name} ${sign}${Math.abs(c.delta)}원${c.delisted ? " [재상장]" : ""}`;
    });
    newsText += " · " + parts.join(" | ");

    setNews(newsText);
    checkEndConditions();
    render();
    drawCandlestickChart();
  }

  function setNews(text) {
    document.getElementById("daily-news").textContent = text;
  }

  function applyLoanInterest() {
    if (state.loanDebt <= 0) return null;
    if (state.day % LOAN_INTEREST_INTERVAL !== 0) return null;
    const interest = Math.max(1, Math.round(state.loanDebt * LOAN_INTEREST_RATE));
    state.loanDebt += interest;
    return `📈 대출 이자 +${formatMoney(interest)}원 (총 부채 ${formatMoney(state.loanDebt)}원, 5일마다 ${LOAN_INTEREST_RATE * 100}%)`;
  }

  function parseLoanAmount() {
    const input = document.getElementById("loan-amount-input");
    if (!input) return { error: "대출 금액 입력란을 찾을 수 없습니다." };
    const raw = String(input.value).trim();
    if (raw === "") return { error: "대출 금액을 입력해 주세요." };
    if (/[.,]/.test(raw)) return { error: "소수는 사용할 수 없습니다. 1 이상의 정수만 입력하세요." };
    const num = Number(raw);
    if (!Number.isFinite(num) || !Number.isInteger(num)) {
      return { error: "1 이상의 정수를 입력해 주세요." };
    }
    if (num < 1) return { error: "1원 이상 입력해 주세요." };
    return { value: num };
  }

  function openLoanPopup() {
    if (!canTakeLoan()) {
      showToast("대출 조건: 보유 주식 없음 + 어떤 주식도 살 수 없을 때만 가능합니다.");
      return;
    }
    const max = getRemainingLoanCapacity();
    if (max <= 0) return;
    document.getElementById("loan-max-label").textContent = formatMoney(max);
    const input = document.getElementById("loan-amount-input");
    input.max = String(max);
    input.value = String(max);
    document.getElementById("loan-popup").classList.remove("hidden");
  }

  function hideLoanPopup() {
    document.getElementById("loan-popup").classList.add("hidden");
  }

  function setLoanInputByPct(pct) {
    const max = getRemainingLoanCapacity();
    if (max <= 0) return;
    const amount = Math.max(1, Math.round(max * pct));
    document.getElementById("loan-amount-input").value = String(amount);
  }

  function confirmLoan() {
    if (!canTakeLoan()) {
      showToast("지금은 대출할 수 없습니다.");
      hideLoanPopup();
      return;
    }
    const parsed = parseLoanAmount();
    if (parsed.error) {
      showToast(parsed.error);
      return;
    }
    const max = getRemainingLoanCapacity();
    if (parsed.value > max) {
      showToast(`최대 ${formatMoney(max)}원까지 대출할 수 있습니다.`);
      return;
    }
    const amount = parsed.value;
    state.loanDebt += amount;
    addCash(amount, true);
    hideLoanPopup();
    const cap = getMaxLoanCap();
    showEventPopup(
      {
        icon: "🏦",
        title: "긴급 대출",
        msg: "대출이 실행되었습니다.",
        tone: "neutral",
      },
      `대출액: +${formatMoney(amount)}원\n` +
        `총 부채: ${formatMoney(state.loanDebt)}원\n` +
        `한도: 최고가 주식의 ${LOAN_CAP_MULT}배 (${formatMoney(cap)}원)\n` +
        `5일마다 이자 ${LOAN_INTEREST_RATE * 100}% (총자산에서 차감)`
    );
    setNews(`긴급 대출 +${formatMoney(amount)}원 (부채 ${formatMoney(state.loanDebt)}원)`);
    render();
  }

  function repayLoan() {
    if (state.loanDebt <= 0 || state.cash <= 0) return;
    const pay = Math.min(state.cash, state.loanDebt);
    addCash(-pay, true);
    state.loanDebt -= pay;
    setNews(`대출 상환 −${formatMoney(pay)}원 (잔여 부채 ${formatMoney(state.loanDebt)}원)`);
    showToast(`대출 ${formatMoney(pay)}원 상환`);
    checkEndConditions();
    render();
  }

  function checkEndConditions() {
    const total = totalAssets();
    if (total >= GOAL) {
      endGame(true, `축하합니다! ${formatMoney(total)}원을 모았습니다. 100만원 목표 달성!`);
      return true;
    }
    if (state.health <= 0) {
      endGame(false, "체력이 바닥났습니다. 건강을 챙기며 다시 도전해 보세요.");
      return true;
    }
    return false;
  }

  function endGame(won, message) {
    state.gameOver = true;
    hideEventPopup();
    document.getElementById("overlay").classList.remove("hidden");
    document.getElementById("modal-title").textContent = won ? "승리!" : "게임 오버";
    document.getElementById("modal-msg").textContent = message;
    render();
  }

  function canBuy(stockId) {
    if (state.gameOver) return false;
    return state.cash >= state.stocks[stockId].price;
  }

  function canSell(stockId) {
    if (state.gameOver) return false;
    return state.stocks[stockId].holdings > 0;
  }

  function buyStock(stockId) {
    if (state.gameOver) return;
    const parsed = parseQuantity(stockId);
    if (parsed.error) {
      showToast(parsed.error);
      return;
    }
    const qty = parsed.value;
    const st = state.stocks[stockId];
    const cost = st.price * qty;
    if (cost > state.cash) {
      showToast(`보유 현금(${formatMoney(state.cash)}원)으로는 ${qty}주를 살 수 없습니다.`);
      return;
    }
    const prevHold = st.holdings;
    const newHold = prevHold + qty;
    st.avgCost =
      prevHold === 0 ? st.price : Math.round((st.avgCost * prevHold + st.price * qty) / newHold);
    st.holdings = newHold;
    addCash(-cost, true);
    setNews(`${st.displayName} ${qty}주 매수 (−${formatMoney(cost)}원)`);
    checkEndConditions();
    render();
  }

  function sellStock(stockId) {
    if (state.gameOver) return;
    const parsed = parseQuantity(stockId);
    if (parsed.error) {
      showToast(parsed.error);
      return;
    }
    const qty = parsed.value;
    const st = state.stocks[stockId];
    if (qty > st.holdings) {
      showToast(`보유 ${st.holdings}주보다 많이 팔 수 없습니다.`);
      return;
    }
    const revenue = st.price * qty;
    st.holdings -= qty;
    if (st.holdings === 0) st.avgCost = 0;
    addCash(revenue, true);
    setNews(`${st.displayName} ${qty}주 매도 (+${formatMoney(revenue)}원)`);
    checkEndConditions();
    render();
  }

  function eatMeal() {
    if (!gameStarted || state.gameOver) return;
    const cost = getMealCost();
    if (state.cash < cost) {
      showToast(`식사 비용이 부족합니다. (${formatMoney(cost)}원 필요)`);
      return;
    }
    const tier = rollMealTier();
    const healthGain = Math.max(1, Math.round(MEAL_HEAL_BASE * tier.mult));
    const hungerLoss = Math.max(1, Math.round(MEAL_HUNGER_BASE * tier.mult));
    addCash(-cost, true);
    state.mealUses += 1;
    state.health = clampStat(state.health + healthGain, MAX_HEALTH);
    state.hunger = clampStat(state.hunger - hungerLoss, MAX_HUNGER);
    const next = getMealCost();
    const detail =
      `메뉴: ${tier.label}\n` +
      `비용: ${formatMoney(cost)}원\n` +
      `체력 +${healthGain}, 배고픔 -${hungerLoss}\n` +
      `다음 식사비: ${formatMoney(next)}원`;
    setNews(`식사 [${tier.label}] 체력+${healthGain}, 배고픔-${hungerLoss}`);
    showLifePopup(tier, detail, "meal");
    render();
  }

  function visitClinic() {
    if (!gameStarted || state.gameOver) return;
    const cost = getClinicCost();
    if (state.cash < cost) {
      showToast(`휴식 비용이 부족합니다. (${formatMoney(cost)}원 필요)`);
      return;
    }
    const tier = rollRestTier();
    const healthGain = Math.max(1, Math.round(CLINIC_HEAL_BASE * tier.mult));
    addCash(-cost, true);
    state.clinicUses += 1;
    state.health = clampStat(state.health + healthGain, MAX_HEALTH);
    const next = getClinicCost();
    const detail =
      `활동: ${tier.label}\n` +
      `비용: ${formatMoney(cost)}원\n` +
      `체력 +${healthGain}\n` +
      `다음 휴식비: ${formatMoney(next)}원`;
    setNews(`휴식 [${tier.label}] 체력+${healthGain}`);
    showLifePopup(tier, detail, "rest");
    render();
  }

  function hungerColor(pct) {
    const t = Math.min(1, pct / 100);
    if (t < 0.45) {
      const r = Math.round(139 + (196 - 139) * (t / 0.45));
      const g = Math.round(156 + (165 - 156) * (t / 0.45));
      const b = Math.round(179 + (116 - 179) * (t / 0.45));
      return `rgb(${r},${g},${b})`;
    }
    const u = (t - 0.45) / 0.55;
    const r = Math.round(196 + (240 - 196) * u);
    const g = Math.round(165 - 165 * u);
    const b = Math.round(116 - 50 * u);
    return `rgb(${r},${g},${b})`;
  }

  function saveQtyInputs() {
    savedQtyInputs = {};
    STOCKS.forEach((def) => {
      const el = document.getElementById(`qty-${def.id}`);
      if (el) savedQtyInputs[def.id] = el.value;
    });
  }

  function renderLifeCosts() {
    document.getElementById("meal-cost-label").textContent = `(-${formatMoney(getMealCost())}원)`;
    document.getElementById("clinic-cost-label").textContent = `(-${formatMoney(getClinicCost())}원)`;
  }

  function renderStatusEffects() {
    const list = document.getElementById("status-list");
    if (!state.statusEffects.length) {
      list.innerHTML = '<span class="status-none">없음</span>';
      return;
    }
    list.innerHTML = state.statusEffects
      .map((e) => {
        const def = STATUS_POOL.find((p) => p.id === e.id);
        const desc = def ? def.desc : e.desc;
        return `<span class="status-chip ${e.kind}" data-status-id="${escapeHtml(e.id)}" title="${escapeHtml(desc)} · ${e.daysLeft}일 남음">${e.icon} ${escapeHtml(e.name)} <strong>${e.daysLeft}일</strong></span>`;
      })
      .join("");
    list.querySelectorAll("[data-status-id]").forEach((chip) => {
      chip.addEventListener("click", () => {
        const def = STATUS_POOL.find((p) => p.id === chip.getAttribute("data-status-id"));
        const eff = state.statusEffects.find((s) => s.id === def.id);
        if (def && eff) showStatusPopup(def, eff.daysLeft, false);
      });
    });
  }

  function renderLoanUI() {
    const loanBtn = document.getElementById("btn-loan");
    const repayBtn = document.getElementById("btn-repay");
    const loanWrap = document.getElementById("loan-stat-wrap");
    const canLoan = canTakeLoan();
    loanBtn.classList.toggle("hidden", !canLoan);
    repayBtn.classList.toggle("hidden", state.loanDebt <= 0 || state.cash <= 0 || state.gameOver);
    loanWrap.classList.toggle("hidden", state.loanDebt <= 0);
    if (state.loanDebt > 0) {
      document.getElementById("stat-loan").textContent = formatMoney(state.loanDebt);
      loanBtn.textContent = `🏦 대출 (최대 ${formatMoney(getRemainingLoanCapacity())}원)`;
    } else {
      loanBtn.textContent = "🏦 긴급 대출";
    }
  }

  function renderStats() {
    const total = netAssets();
    document.getElementById("stat-day").textContent = `${state.day} 일차`;
    document.getElementById("stat-cash").textContent = formatMoney(state.cash);
    document.getElementById("stat-total").textContent = formatMoney(total);
    renderLoanUI();
    document.getElementById("stat-health").textContent = state.health;

    const hungerPct = state.hunger;
    const hungerEl = document.getElementById("stat-hunger");
    const hungerBar = document.getElementById("hunger-bar");
    hungerEl.textContent = hungerPct;
    hungerEl.style.color = hungerColor(hungerPct);
    hungerBar.style.width = `${hungerPct}%`;
    hungerBar.style.background = `linear-gradient(90deg, #8b9cb3, ${hungerColor(hungerPct)})`;

    document.getElementById("health-bar").style.width = `${state.health}%`;
    document.getElementById("health-bar").style.background =
      state.health < 30 ? "linear-gradient(90deg, #8b2020, var(--health-low))" : "";

    const pct = Math.min(100, (total / GOAL) * 100);
    document.getElementById("goal-bar").style.width = `${pct}%`;
    document.getElementById("stat-goal-pct").textContent = `${pct.toFixed(1)}%`;

    renderLifeCosts();
    renderStatusEffects();
    animateCashDisplay();
    lastRenderedCash = state.cash;
  }

  function renderStocks() {
    saveQtyInputs();
    const container = document.getElementById("stocks-container");
    document.getElementById("stocks-panel").classList.toggle("panel-disabled", state.gameOver);
    container.innerHTML = "";

    STOCKS.forEach((def) => {
      const st = state.stocks[def.id];
      const candles = st.candles;
      const prev = candles.length >= 2 ? candles[candles.length - 2].close : st.price;
      const delta = st.price - prev;
      const pct = prev ? ((delta / prev) * 100).toFixed(1) : "0.0";
      const changeClass = delta > 0 ? "up" : "down";
      const changeSign = delta > 0 ? "+" : "";
      const buyOk = canBuy(def.id);
      const sellOk = canSell(def.id);
      const infoCost = getInfoCost(def.id);
      const infoActive = st.infoUntilDay >= state.day && st.infoText;
      const infoOk = state.cash >= infoCost && !state.gameOver;
      const qtyVal = escapeHtml(String(savedQtyInputs[def.id] ?? "1").replace(/[^\d]/g, "") || "1");

      const card = document.createElement("div");
      card.className = "stock-card";
      card.innerHTML = `
        <div class="stock-header">
          <div>
            <div class="stock-name">${escapeHtml(st.displayName)}${st.generation > 0 ? ` <span class="gen-badge">G${st.generation}</span>` : ""}</div>
            <div class="stock-desc">${escapeHtml(def.desc)} · 초기가 ${formatMoney(def.basePrice)}원</div>
          </div>
          <div>
            <div class="stock-price">${formatMoney(st.price)}원</div>
            <div class="stock-change ${changeClass}">${changeSign}${delta} (${changeSign}${pct}%)</div>
          </div>
        </div>
        ${infoActive ? `<div class="stock-info-badge"><strong>📊 정보</strong> ${escapeHtml(st.infoText.replace(/\n/g, " · "))}</div>` : ""}
        <div class="stock-actions">
          <input type="number" min="1" step="1" value="${qtyVal}" id="qty-${def.id}" aria-label="수량" />
          <div class="trade-block ${buyOk ? "" : "trade-disabled"}" data-disabled-reason="매수 불가">
            <button type="button" class="btn btn-buy" data-buy="${def.id}">매수</button>
          </div>
          <div class="trade-block ${sellOk ? "" : "trade-disabled"}" data-disabled-reason="매도 불가">
            <button type="button" class="btn btn-sell" data-sell="${def.id}">매도</button>
          </div>
          <div class="trade-block ${infoOk ? "" : "trade-disabled"}" data-disabled-reason="정보 불가">
            <button type="button" class="btn btn-info" data-info="${def.id}" title="이 주식의 미래를 알려드립니다">정보 ${formatMoney(infoCost)}원</button>
          </div>
          <span style="font-size:0.8rem;color:var(--muted)">보유 ${st.holdings}주</span>
        </div>
      `;
      container.appendChild(card);
    });

    container.querySelectorAll("[data-buy]").forEach((btn) => {
      btn.addEventListener("click", () => buyStock(btn.getAttribute("data-buy")));
    });
    container.querySelectorAll("[data-sell]").forEach((btn) => {
      btn.addEventListener("click", () => sellStock(btn.getAttribute("data-sell")));
    });
    container.querySelectorAll("[data-info]").forEach((btn) => {
      btn.addEventListener("click", () => buyStockInfo(btn.getAttribute("data-info")));
    });
  }

  function renderPortfolio() {
    const tbody = document.getElementById("portfolio-body");
    const rows = STOCKS.filter((s) => state.stocks[s.id].holdings > 0).map((def) => {
      const st = state.stocks[def.id];
      const value = st.holdings * st.price;
      const cost = st.holdings * st.avgCost;
      const pl = value - cost;
      const plClass = pl >= 0 ? "profit" : "loss";
      const plSign = pl >= 0 ? "+" : "";
      return `<tr>
        <td>${escapeHtml(st.displayName)}</td>
        <td>${st.holdings}주</td>
        <td>${formatMoney(st.avgCost)}원</td>
        <td>${formatMoney(st.price)}원</td>
        <td>${formatMoney(value)}원</td>
        <td class="${plClass}">${plSign}${formatMoney(pl)}원</td>
      </tr>`;
    });
    tbody.innerHTML =
      rows.length > 0
        ? rows.join("")
        : '<tr><td colspan="6" class="empty">보유 주식이 없습니다</td></tr>';
  }

  function renderChartTabs() {
    const tabs = document.getElementById("chart-tabs");
    tabs.innerHTML = "";
    STOCKS.forEach((def) => {
      const st = state.stocks[def.id];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chart-tab" + (def.id === activeChartStock ? " active" : "");
      btn.textContent = st.displayName;
      btn.addEventListener("click", () => {
        activeChartStock = def.id;
        renderChartTabs();
        drawCandlestickChart();
      });
      tabs.appendChild(btn);
    });
  }

  function drawCandlestickChart() {
    const st = state.stocks[activeChartStock];
    const candles = st.candles;
    const canvas = document.getElementById("price-chart");
    const wrap = canvas.parentElement;
    const dpr = window.devicePixelRatio || 1;
    const w = wrap.clientWidth || 480;
    const h = wrap.clientHeight || 260;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";

    const ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const pad = { top: 16, right: 12, bottom: 28, left: 52 };
    const chartH = h - pad.top - pad.bottom;

    ctx.fillStyle = "#1a2332";
    ctx.fillRect(0, 0, w, h);
    if (candles.length === 0) return;

    let minP = Infinity;
    let maxP = -Infinity;
    candles.forEach((c) => {
      minP = Math.min(minP, c.low);
      maxP = Math.max(maxP, c.high);
    });
    const range = maxP - minP || 1;
    minP -= range * 0.05;
    maxP += range * 0.05;

    const yScale = (price) => pad.top + chartH - ((price - minP) / (maxP - minP)) * chartH;
    const bodyW = Math.max(MIN_CANDLE_BODY, Math.min(12, CANDLE_SLOT_WIDTH - 3));

    ctx.strokeStyle = "rgba(45, 63, 86, 0.6)";
    for (let i = 0; i <= 4; i++) {
      const price = minP + ((maxP - minP) * i) / 4;
      const y = yScale(price);
      ctx.beginPath();
      ctx.moveTo(pad.left, y);
      ctx.lineTo(w - pad.right, y);
      ctx.stroke();
      ctx.fillStyle = "#8b9cb3";
      ctx.font = "10px JetBrains Mono, monospace";
      ctx.textAlign = "right";
      ctx.fillText(formatMoney(price), pad.left - 6, y + 3);
    }

    candles.forEach((c, i) => {
      const cx = pad.left + i * CANDLE_SLOT_WIDTH + CANDLE_SLOT_WIDTH / 2;
      const openY = yScale(c.open);
      const closeY = yScale(c.close);
      const highY = yScale(c.high);
      const lowY = yScale(c.low);
      const bullish = c.close >= c.open;
      const color = bullish ? "#3dd68c" : "#f07178";
      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(cx, highY);
      ctx.lineTo(cx, lowY);
      ctx.stroke();
      const top = Math.min(openY, closeY);
      const bodyH = Math.max(2, Math.abs(closeY - openY));
      ctx.fillStyle = color;
      ctx.fillRect(cx - bodyW / 2, top, bodyW, bodyH);
      if (bodyH <= 2) ctx.fillRect(cx - bodyW / 2, top - 1, bodyW, 2);
    });

    ctx.fillStyle = "#8b9cb3";
    ctx.font = "9px Noto Sans KR, sans-serif";
    ctx.textAlign = "center";
    const labelEvery = candles.length <= 8 ? 1 : Math.max(1, Math.floor(candles.length / 6));
    candles.forEach((_, i) => {
      if (i % labelEvery !== 0 && i !== candles.length - 1) return;
      const dayNum = state.day - candles.length + i + 1;
      const cx = pad.left + i * CANDLE_SLOT_WIDTH + CANDLE_SLOT_WIDTH / 2;
      ctx.fillText(`${dayNum}일`, cx, h - 8);
    });

    const last = candles[candles.length - 1];
    const first = candles[0];
    const change = last.close - first.close;
    const changePct = first.close ? ((change / first.close) * 100).toFixed(1) : "0.0";
    const sign = change >= 0 ? "+" : "";
    const cls = change > 0 ? "up" : change < 0 ? "down" : "flat";
    document.getElementById("chart-change").textContent =
      `${st.displayName} · 종 ${formatMoney(last.close)} (${sign}${changePct}%)`;
    document.getElementById("chart-change").className = `chart-legend stock-change ${cls}`;
  }

  function render() {
    renderStats();
    renderStocks();
    renderPortfolio();
    const disabled = state.gameOver;
    document.getElementById("btn-next-day").disabled = disabled;
    document.getElementById("btn-meal").disabled = disabled;
    document.getElementById("btn-clinic").disabled = disabled;
    document.getElementById("btn-loan").disabled = disabled || !canTakeLoan();
    document.getElementById("btn-repay").disabled =
      disabled || state.loanDebt <= 0 || state.cash <= 0;
  }

  function showStartScreen() {
    gameStarted = false;
    document.getElementById("start-screen").classList.remove("hidden");
    document.querySelector(".app").classList.add("start-hidden");
    document.getElementById("overlay").classList.add("hidden");
    hideEventPopup();
    hideInfoPopup();
    hideLoanPopup();
    hideEventBanner();
  }

  function beginGame() {
    gameStarted = true;
    document.getElementById("start-screen").classList.add("hidden");
    document.querySelector(".app").classList.remove("start-hidden");
    restart();
  }

  function restart() {
    state = initState();
    activeChartStock = "stable";
    savedQtyInputs = {};
    delistNotices = [];
    lastRenderedCash = START_CASH;
    STOCKS.forEach((s) => {
      state.stocks[s.id].nextBias = (Math.random() - 0.5) * 0.04;
    });
    document.getElementById("overlay").classList.add("hidden");
    hideEventPopup();
    hideInfoPopup();
    hideLoanPopup();
    hideEventBanner();
    setNews("게임을 시작했습니다. 주식을 사고팔며 100만원을 모아보세요!");
    renderChartTabs();
    render();
    drawCandlestickChart();
  }

  function bindEvents() {
    document.getElementById("btn-start-game").addEventListener("click", beginGame);
    document.getElementById("btn-next-day").addEventListener("click", passDay);
    document.getElementById("btn-meal").addEventListener("click", eatMeal);
    document.getElementById("btn-clinic").addEventListener("click", visitClinic);
    document.getElementById("btn-loan").addEventListener("click", openLoanPopup);
    document.getElementById("btn-repay").addEventListener("click", repayLoan);
    document.getElementById("loan-confirm").addEventListener("click", confirmLoan);
    document.getElementById("loan-cancel").addEventListener("click", hideLoanPopup);
    document.getElementById("loan-popup").addEventListener("click", (e) => {
      if (e.target.id === "loan-popup") hideLoanPopup();
    });
    document.querySelectorAll("[data-loan-pct]").forEach((btn) => {
      btn.addEventListener("click", () => setLoanInputByPct(Number(btn.getAttribute("data-loan-pct"))));
    });
    document.getElementById("btn-restart").addEventListener("click", restart);
    document.getElementById("event-popup-close").addEventListener("click", hideEventPopup);
    document.getElementById("event-popup").addEventListener("click", (e) => {
      if (e.target.id === "event-popup") hideEventPopup();
    });
    document.getElementById("info-popup-close").addEventListener("click", hideInfoPopup);
    document.getElementById("info-popup").addEventListener("click", (e) => {
      if (e.target.id === "info-popup") hideInfoPopup();
    });
    window.addEventListener("resize", drawCandlestickChart);
  }

  bindEvents();
  showStartScreen();
})();
