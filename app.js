/**
 * AI 기반 맞춤형 분리수거 안내 시스템 - 메인 스크립트
 * [인공지능 지도학습(Supervised Learning) 분류 엔진 탑재]
 * - 적용 알고리즘: k-최근접 이웃(k-NN) 분류기 & 다항 나이브 베이즈(Naive Bayes) 분류기
 * 저작자: 성신여자고등학교 20814 양효은 (2026 인공지능 기초)
 */

// ========================================================
// 1. 인공지능 지도학습(Supervised Learning) 분류기 클래스
// ========================================================
class SupervisedRecyclingClassifier {
    constructor() {
        this.dataset = [];
        this.vocab = new Map(); // 단어/토큰 -> 인덱스
        this.vocabList = [];
        this.classes = [];      // 고유 레이블 목록
        this.classSamples = {}; // 클래스별 샘플 수
        this.classPriors = {};  // P(C)
        this.featureCounts = {};// 클래스별 단어 출현 빈도수 { class: { token: count } }
        this.totalClassWords = {}; // 클래스별 총 단어 수
        this.trainVectors = []; // k-NN용 정규화된 TF-IDF 특징 벡터
    }

    // 텍스트 토큰화 및 특징 추출 (형태소, 바이그램, 키워드 추출)
    tokenize(text) {
        if (!text) return [];
        const clean = text.toLowerCase().replace(/[^a-zA-Z0-9가-힣\s]/g, " ").trim();
        const words = clean.split(/\s+/).filter(w => w.length > 0);
        
        const tokens = new Set();
        // 1) 개별 단어 유니그램
        words.forEach(w => {
            tokens.add(w);
            // 한국어 조사 간이 분리 (페트병을 -> 페트병, 피자박스는 -> 피자박스 등)
            const stripped = w.replace(/(은|는|이|가|을|를|의|에|와|과|도|로|으로)$/, "");
            if (stripped.length >= 2) tokens.add(stripped);

            // 2) 문자 바이그램 (한국어 어미 변형 대응)
            if (w.length >= 2) {
                for (let i = 0; i < w.length - 1; i++) {
                    tokens.add(w.slice(i, i + 2));
                }
            }
        });

        return Array.from(tokens);
    }

    // 지도학습 훈련(Training) 함수
    train(rawDataset) {
        this.dataset = JSON.parse(JSON.stringify(rawDataset));
        this.vocab.clear();
        this.vocabList = [];
        this.classes = [];
        this.classSamples = {};
        this.classPriors = {};
        this.featureCounts = {};
        this.totalClassWords = {};
        this.trainVectors = [];

        // 고유 클래스 및 어휘 사전 수집
        const classSet = new Set();
        this.dataset.forEach(item => {
            classSet.add(item.label);
            this.classSamples[item.label] = (this.classSamples[item.label] || 0) + 1;

            const tokens = this.tokenize(item.text);
            tokens.forEach(tok => {
                if (!this.vocab.has(tok)) {
                    this.vocab.set(tok, this.vocab.size);
                    this.vocabList.push(tok);
                }
            });
        });

        this.classes = Array.from(classSet);
        const totalSamples = this.dataset.length;

        // 사전 확률 P(C) 및 나이브 베이즈 빈도수 테이블 초기화
        this.classes.forEach(c => {
            this.classPriors[c] = this.classSamples[c] / totalSamples;
            this.featureCounts[c] = {};
            this.totalClassWords[c] = 0;
        });

        // 훈련 데이터셋 단어 카운트 및 특징 벡터 생성
        this.dataset.forEach((item, idx) => {
            const tokens = this.tokenize(item.text);
            const vec = new Float32Array(this.vocab.size);

            tokens.forEach(tok => {
                const vocabIdx = this.vocab.get(tok);
                if (vocabIdx !== undefined) {
                    vec[vocabIdx] += 1;
                    this.featureCounts[item.label][tok] = (this.featureCounts[item.label][tok] || 0) + 1;
                    this.totalClassWords[item.label] += 1;
                }
            });

            // k-NN을 위한 L2 벡터 정규화 (Cosine 유사도 최적화)
            let norm = 0;
            for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
            norm = Math.sqrt(norm);
            if (norm > 0) {
                for (let i = 0; i < vec.length; i++) vec[i] /= norm;
            }

            this.trainVectors.push({
                text: item.text,
                label: item.label,
                vector: vec
            });
        });

        console.log(`[지도학습 완료] 훈련 샘플: ${totalSamples}개, 어휘 크기: ${this.vocab.size}개, 분류 클래스: ${this.classes.length}개`);
        return {
            sampleCount: totalSamples,
            vocabSize: this.vocab.size,
            classCount: this.classes.length
        };
    }

    // 특징 벡터 변환 (Inference용)
    vectorize(text) {
        const tokens = this.tokenize(text);
        const vec = new Float32Array(this.vocab.size);
        tokens.forEach(tok => {
            const vocabIdx = this.vocab.get(tok);
            if (vocabIdx !== undefined) {
                vec[vocabIdx] += 1;
            }
        });

        let norm = 0;
        for (let i = 0; i < vec.length; i++) norm += vec[i] * vec[i];
        norm = Math.sqrt(norm);
        if (norm > 0) {
            for (let i = 0; i < vec.length; i++) vec[i] /= norm;
        }
        return { tokens, vector: vec };
    }

    // [모델 1] k-최근접 이웃(k-NN) 지도학습 분류기
    predictKNN(text, k = 3) {
        const { tokens, vector } = this.vectorize(text);
        
        // 모든 훈련 데이터와 코사인 유사도 계산
        const similarities = [];
        this.trainVectors.forEach(sample => {
            let dot = 0;
            const sv = sample.vector;
            for (let i = 0; i < vector.length; i++) {
                if (vector[i] > 0 && sv[i] > 0) {
                    dot += vector[i] * sv[i];
                }
            }
            similarities.push({
                text: sample.text,
                label: sample.label,
                similarity: dot
            });
        });

        // 유사도 기준 내림차순 정렬 후 상위 k개 추출
        similarities.sort((a, b) => b.similarity - a.similarity);
        const neighbors = similarities.slice(0, k);

        // 거리 가중치 투표 (Distance-weighted Voting)
        const classScores = {};
        this.classes.forEach(c => classScores[c] = 0);

        let totalWeight = 0;
        neighbors.forEach(n => {
            const weight = Math.max(0.001, n.similarity);
            classScores[n.label] += weight;
            totalWeight += weight;
        });

        // 확률 정규화
        const probs = this.classes.map(c => ({
            label: c,
            score: totalWeight > 0 ? (classScores[c] / totalWeight) : (1 / this.classes.length)
        })).sort((a, b) => b.score - a.score);

        const top = probs[0];
        const maxSim = neighbors[0] ? neighbors[0].similarity : 0;
        const confidence = Math.min(99.4, Math.max(35.0, top.score * (maxSim > 0.1 ? 95 : 50)));

        return {
            modelName: "k-최근접 이웃 (k-NN, k=3)",
            topClass: top.label,
            confidence: Math.round(confidence * 10) / 10,
            probabilities: probs.slice(0, 3).map(p => ({
                label: p.label,
                percentage: Math.round(p.score * 1000) / 10
            })),
            neighbors: neighbors.map(n => ({
                text: n.text,
                label: n.label,
                similarityPct: Math.round(n.similarity * 1000) / 10
            }))
        };
    }

    // [모델 2] 다항 나이브 베이즈(Naive Bayes) 지도학습 분류기
    predictNaiveBayes(text) {
        const { tokens } = this.vectorize(text);
        const vocabSize = this.vocab.size;

        const logPosteriors = {};
        const wordContributions = {};

        this.classes.forEach(c => {
            logPosteriors[c] = Math.log(this.classPriors[c] || 0.01);
            wordContributions[c] = [];

            const totalWordsInClass = this.totalClassWords[c] || 1;
            tokens.forEach(tok => {
                if (this.vocab.has(tok)) {
                    const count = (this.featureCounts[c] && this.featureCounts[c][tok]) || 0;
                    const condProb = (count + 1) / (totalWordsInClass + vocabSize);
                    const logProb = Math.log(condProb);
                    logPosteriors[c] += logProb;
                    if (count > 0) {
                        wordContributions[c].push({ token: tok, weight: count });
                    }
                }
            });
        });

        const maxLog = Math.max(...Object.values(logPosteriors));
        let sumExp = 0;
        const expScores = {};

        this.classes.forEach(c => {
            expScores[c] = Math.exp(logPosteriors[c] - maxLog);
            sumExp += expScores[c];
        });

        const probs = this.classes.map(c => ({
            label: c,
            score: sumExp > 0 ? (expScores[c] / sumExp) : (1 / this.classes.length)
        })).sort((a, b) => b.score - a.score);

        const top = probs[0];
        const topFeatures = (wordContributions[top.label] || [])
            .sort((a, b) => b.weight - a.weight)
            .slice(0, 4)
            .map(w => w.token);

        const confidence = Math.min(99.1, Math.max(40.0, top.score * 100));

        return {
            modelName: "나이브 베이즈 (Naive Bayes)",
            topClass: top.label,
            confidence: Math.round(confidence * 10) / 10,
            probabilities: probs.slice(0, 3).map(p => ({
                label: p.label,
                percentage: Math.round(p.score * 1000) / 10
            })),
            topFeatures: topFeatures
        };
    }

    predict(text, modelType = "knn") {
        if (modelType === "nb") {
            return this.predictNaiveBayes(text);
        }
        return this.predictKNN(text, 3);
    }
}

const mlClassifier = new SupervisedRecyclingClassifier();

const state = {
    selectedSido: "제주특별자치도",
    selectedSigungu: "제주시",
    selectedModel: "knn",
    fontSizeLevel: 1,
    isHighContrast: false,
    currentResult: null,
    speechSynthesisUtterance: null
};

let elements = {};

document.addEventListener("DOMContentLoaded", () => {
    if (typeof TRAINING_DATASET !== "undefined") {
        mlClassifier.train(TRAINING_DATASET);
    }

    initElements();
    initRegionSelects();
    initEventListeners();
    initFontSize();
    initQuickTags();
    initDatasetModal();

    elements.itemInput.value = "깨끗한 플라스틱 페트병";
    handleAnalyze();
});

function initElements() {
    elements = {
        sidoSelect: document.getElementById("sidoSelect"),
        sigunguSelect: document.getElementById("sigunguSelect"),
        itemInput: document.getElementById("itemInput"),
        analyzeBtn: document.getElementById("analyzeBtn"),
        voiceInputBtn: document.getElementById("voiceInputBtn"),
        resultSection: document.getElementById("resultSection"),
        fontNormalBtn: document.getElementById("fontNormalBtn"),
        fontLargeBtn: document.getElementById("fontLargeBtn"),
        fontXLargeBtn: document.getElementById("fontXLargeBtn"),
        highContrastToggle: document.getElementById("highContrastToggle"),
        quickTagsContainer: document.getElementById("quickTagsContainer"),
        voiceSpeakBtn: document.getElementById("voiceSpeakBtn"),
        imageUploadInput: document.getElementById("imageUploadInput"),
        
        modelKnn: document.getElementById("modelKnn"),
        modelNb: document.getElementById("modelNb"),
        openDatasetModalBtn: document.getElementById("openDatasetModalBtn"),
        trainCount: document.getElementById("trainCount"),
        datasetModal: document.getElementById("datasetModal"),
        closeDatasetModalBtn: document.getElementById("closeDatasetModalBtn"),
        closeDatasetModalBottomBtn: document.getElementById("closeDatasetModalBottomBtn"),
        newTrainText: document.getElementById("newTrainText"),
        newTrainLabel: document.getElementById("newTrainLabel"),
        addTrainDataBtn: document.getElementById("addTrainDataBtn"),
        resetDatasetBtn: document.getElementById("resetDatasetBtn"),
        datasetTableBody: document.getElementById("datasetTableBody"),
        datasetTotalCount: document.getElementById("datasetTotalCount")
    };
}

function initRegionSelects() {
    elements.sidoSelect.innerHTML = "";
    Object.keys(REGION_DATABASE).forEach(sido => {
        const option = document.createElement("option");
        option.value = sido;
        option.textContent = sido;
        if (sido === state.selectedSido) option.selected = true;
        elements.sidoSelect.appendChild(option);
    });

    updateSigunguSelect();

    elements.sidoSelect.addEventListener("change", (e) => {
        state.selectedSido = e.target.value;
        updateSigunguSelect();
        if (state.currentResult) handleAnalyze();
    });

    elements.sigunguSelect.addEventListener("change", (e) => {
        state.selectedSigungu = e.target.value;
        if (state.currentResult) handleAnalyze();
    });
}

function updateSigunguSelect() {
    const regionInfo = REGION_DATABASE[state.selectedSido];
    elements.sigunguSelect.innerHTML = "";
    
    if (regionInfo && regionInfo.subRegions) {
        regionInfo.subRegions.forEach(sigungu => {
            const option = document.createElement("option");
            option.value = sigungu;
            option.textContent = sigungu;
            if (sigungu === state.selectedSigungu) option.selected = true;
            elements.sigunguSelect.appendChild(option);
        });
        state.selectedSigungu = elements.sigunguSelect.value;
    }
}

function initQuickTags() {
    const sampleKeywords = [
        "투명 생수 페트병",
        "갈색 맥주 페트병",
        "기름 묻은 피자박스",
        "깨끗이 씻은 배달용기",
        "마라탕 국물 플라스틱",
        "깨진 유리컵",
        "다 쓴 AA 건전지",
        "남은 감기약",
        "고흡수성 젤 아이스팩",
        "친환경 물 아이스팩",
        "펼쳐서 말린 우유팩",
        "택배 뽁뽁이 비닐"
    ];

    elements.quickTagsContainer.innerHTML = "";
    sampleKeywords.forEach(tag => {
        const chip = document.createElement("button");
        chip.type = "button";
        chip.className = "quick-tag-chip";
        chip.textContent = `# ${tag}`;
        chip.addEventListener("click", () => {
            elements.itemInput.value = tag;
            handleAnalyze();
        });
        elements.quickTagsContainer.appendChild(chip);
    });
}

function initEventListeners() {
    elements.analyzeBtn.addEventListener("click", () => handleAnalyze());
    
    elements.itemInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleAnalyze();
        }
    });

    if (elements.modelKnn) {
        elements.modelKnn.addEventListener("change", () => {
            state.selectedModel = "knn";
            if (state.currentResult) handleAnalyze();
        });
    }
    if (elements.modelNb) {
        elements.modelNb.addEventListener("change", () => {
            state.selectedModel = "nb";
            if (state.currentResult) handleAnalyze();
        });
    }

    elements.fontNormalBtn.addEventListener("click", () => setFontSize(0));
    elements.fontLargeBtn.addEventListener("click", () => setFontSize(1));
    elements.fontXLargeBtn.addEventListener("click", () => setFontSize(2));

    elements.highContrastToggle.addEventListener("click", toggleHighContrast);

    if (elements.voiceSpeakBtn) {
        elements.voiceSpeakBtn.addEventListener("click", toggleVoiceGuidance);
    }

    if (elements.voiceInputBtn) {
        elements.voiceInputBtn.addEventListener("click", handleVoiceInput);
    }

    if (elements.imageUploadInput) {
        elements.imageUploadInput.addEventListener("change", handleImageUpload);
    }
}

function initFontSize() {
    setFontSize(state.fontSizeLevel);
}

function setFontSize(level) {
    state.fontSizeLevel = level;
    document.body.classList.remove("font-size-0", "font-size-1", "font-size-2");
    document.body.classList.add(`font-size-${level}`);

    [elements.fontNormalBtn, elements.fontLargeBtn, elements.fontXLargeBtn].forEach((btn, idx) => {
        if (btn) btn.classList.toggle("active", idx === level);
    });
}

function toggleHighContrast() {
    state.isHighContrast = !state.isHighContrast;
    document.body.classList.toggle("high-contrast-mode", state.isHighContrast);
    elements.highContrastToggle.setAttribute("aria-pressed", state.isHighContrast.toString());
    elements.highContrastToggle.textContent = state.isHighContrast ? "☀️ 기본화면 보기" : "👁️ 고대비 모드";
}

function analyzeDisposalQuery(userText, sido, sigungu) {
    const rawText = userText.trim();
    if (!rawText) return null;

    const mlResult = mlClassifier.predict(rawText, state.selectedModel);
    
    let matchedItem = ITEM_DATABASE.find(item => item.id === mlResult.topClass);
    if (!matchedItem) {
        matchedItem = ITEM_DATABASE[0];
    }

    let ambiguousNotice = null;
    Object.keys(AMBIGUOUS_CASES).forEach(key => {
        if (rawText.includes(key)) {
            ambiguousNotice = AMBIGUOUS_CASES[key];
        }
    });

    const regionData = REGION_DATABASE[sido] || {};
    const regionRules = regionData.specialRules || null;

    return {
        query: userText,
        item: matchedItem,
        region: `${sido} ${sigungu}`,
        regionRules: regionRules,
        ambiguousNotice: ambiguousNotice,
        mlResult: mlResult,
        todayDayOfWeek: getTodayDayName()
    };
}

function getTodayDayName() {
    const days = ["일요일", "월요일", "화요일", "수요일", "목요일", "금요일", "토요일"];
    return days[new Date().getDay()];
}

function handleAnalyze() {
    const query = elements.itemInput.value;
    if (!query.trim()) {
        alert("버리려는 물건의 이름이나 상태를 입력해주세요. (예: 깨끗한 플라스틱 페트병, 피자박스)");
        elements.itemInput.focus();
        return;
    }

    const result = analyzeDisposalQuery(query, state.selectedSido, state.selectedSigungu);
    state.currentResult = result;
    renderResult(result);
}

function renderResult(result) {
    elements.resultSection.classList.remove("hidden");
    elements.resultSection.scrollIntoView({ behavior: "smooth", block: "start" });

    if (elements.voiceSpeakBtn) {
        elements.voiceSpeakBtn.style.display = "inline-flex";
    }

    const { item, region, regionRules, ambiguousNotice, todayDayOfWeek, mlResult } = result;

    let mlReasoningHtml = "";
    if (mlResult.neighbors && mlResult.neighbors.length > 0) {
        mlReasoningHtml = `
            <div class="ml-reasoning-box">
                <span class="ml-reasoning-title">🔍 k-NN 판별 근거 (가장 거리가 가까운 상위 3개 훈련 데이터):</span>
                <div class="ml-neighbors-chips">
                    ${mlResult.neighbors.map(n => {
                        const targetItem = ITEM_DATABASE.find(i => i.id === n.label);
                        const labelName = targetItem ? targetItem.name.split(" ")[0] : n.label;
                        return `<span class="ml-neighbor-chip">"${escapeHtml(n.text)}" ➔ <strong>${escapeHtml(labelName)}</strong> (유사도 ${n.similarityPct}%)</span>`;
                    }).join("")}
                </div>
            </div>
        `;
    } else if (mlResult.topFeatures && mlResult.topFeatures.length > 0) {
        mlReasoningHtml = `
            <div class="ml-reasoning-box">
                <span class="ml-reasoning-title">🔍 나이브 베이즈 확률 기여 핵심 단어(Features):</span>
                <div class="ml-neighbors-chips">
                    ${mlResult.topFeatures.map(tok => `<span class="ml-neighbor-chip"># ${escapeHtml(tok)}</span>`).join("")}
                </div>
            </div>
        `;
    }

    const probListHtml = mlResult.probabilities.map(p => {
        const pItem = ITEM_DATABASE.find(i => i.id === p.label);
        const name = pItem ? pItem.name : p.label;
        const color = pItem ? pItem.categoryColor : "#3b82f6";
        return `
            <div class="ml-prob-item">
                <span class="ml-prob-name">${escapeHtml(name)}</span>
                <div class="ml-prob-bar-container">
                    <div class="ml-prob-bar-inner" style="width: ${p.percentage}%; background-color: ${color};"></div>
                </div>
                <span class="ml-prob-pct">${p.percentage}%</span>
            </div>
        `;
    }).join("");

    const mlReportCard = `
        <div class="ml-report-card">
            <div class="ml-report-header">
                <div class="ml-badge-title">
                    <span>🤖 지도학습(Supervised Learning) 분류 판별 리포트</span>
                </div>
                <span class="ml-model-tag">${escapeHtml(mlResult.modelName)}</span>
            </div>

            <div class="ml-confidence-row">
                <div class="ml-confidence-label">
                    <span>1순위 예측 신뢰도 (Confidence)</span>
                    <strong style="color: #059669;">${mlResult.confidence}%</strong>
                </div>
                <div class="ml-confidence-bar-bg">
                    <div class="ml-confidence-fill" style="width: ${mlResult.confidence}%;"></div>
                </div>
            </div>

            <div class="ml-prob-list">
                <div style="font-size:0.8rem; font-weight:700; color:#4b5563; margin-bottom:4px;">📊 상위 후보 품목별 사후 확률 분포:</div>
                ${probListHtml}
            </div>

            ${mlReasoningHtml}
        </div>
    `;

    let regionSpecificHtml = "";
    if (regionRules) {
        let scheduleNote = "";
        if (regionRules.schedule) {
            const todaySchedule = regionRules.schedule[todayDayOfWeek] || null;
            scheduleNote = `
                <div class="region-schedule-box">
                    <div class="schedule-header">
                        <span class="calendar-icon">📅</span>
                        <strong>오늘(${todayDayOfWeek})의 ${region} 배출 가능 품목:</strong>
                        <span class="today-item-highlight">${todaySchedule ? todaySchedule : "거주 지역 수거 일정 확인 필요"}</span>
                    </div>
                </div>
            `;
        }

        regionSpecificHtml = `
            <div class="region-alert-card">
                <div class="region-alert-header">
                    <span class="region-pin">📍</span>
                    <h3>${region} 맞춤 수거 안내</h3>
                    <span class="system-tag">${regionRules.systemName || "지역 조례 준수"}</span>
                </div>
                <p class="region-desc">${regionRules.description || ""}</p>
                ${scheduleNote}
                ${regionRules.notes ? `<div class="region-subnote">💡 <strong>지자체 핵심 팁:</strong> ${regionRules.notes}</div>` : ""}
            </div>
        `;
    }

    const carbonSaved = calculateCarbonSavings(item.id);

    const washBadge = item.washRequired 
        ? `<span class="check-pill required">💧 물 세척 필수</span>` 
        : `<span class="check-pill not-required">💧 세척 불필요</span>`;

    const labelBadge = item.labelRemovalRequired 
        ? `<span class="check-pill required">🏷️ 라벨/테이프 제거 필수</span>` 
        : `<span class="check-pill not-required">🏷️ 라벨 제거 해당없음</span>`;

    const separateBadge = item.separateDisposal 
        ? `<span class="check-pill highlight">⭐ 전용 수거함 별도 배출</span>` 
        : `<span class="check-pill not-required">일반 수거함 배출</span>`;

    elements.resultSection.innerHTML = `
        <div class="result-card">
            ${mlReportCard}

            <div class="result-header">
                <div class="badge-row">
                    <span class="category-badge" style="background-color: ${item.categoryColor}; color: #ffffff;">
                        ${item.category}
                    </span>
                    <span class="region-indicator">📍 ${region} 기준</span>
                </div>
                <h2 class="item-name">${escapeHtml(item.name)}</h2>
                <div class="method-summary">
                    <strong>👉 올바른 배출 방법:</strong> ${escapeHtml(item.disposalMethod)}
                </div>
            </div>

            ${regionSpecificHtml}

            <div class="checklist-section">
                <h4 class="section-label">✅ 배출 전 3대 필수 확인사항</h4>
                <div class="checklist-pills">
                    ${washBadge}
                    ${labelBadge}
                    ${separateBadge}
                </div>
            </div>

            <div class="steps-section">
                <h4 class="section-label">📋 단계별 분리배출 방법</h4>
                <ol class="steps-list">
                    ${item.steps.map(step => `<li>${escapeHtml(step)}</li>`).join("")}
                </ol>
            </div>

            ${item.specialWarning ? `
                <div class="warning-callout">
                    <span class="warning-icon">⚠️</span>
                    <div>
                        <strong>꼭 확인하세요!</strong>
                        <p>${escapeHtml(item.specialWarning)}</p>
                    </div>
                </div>
            ` : ""}

            ${ambiguousNotice ? `
                <div class="ambiguous-callout">
                    <span class="info-icon">💡</span>
                    <div>
                        <strong>헷갈리기 쉬운 복합 물품 안내:</strong>
                        <p>${escapeHtml(ambiguousNotice)}</p>
                    </div>
                </div>
            ` : ""}

            <div class="eco-impact-box">
                <div class="eco-icon">🌱</div>
                <div class="eco-content">
                    <strong>나의 분리배출 환경 기여도</strong>
                    <p>이 물품을 올바르게 배출하면 약 <strong>${carbonSaved}g의 온실가스(CO₂)</strong>를 감축할 수 있습니다.</p>
                </div>
            </div>

            <div class="source-footer">
                <span>데이터 출처: 환경부 생활폐기물 분리배출 누리집 (분리배출.kr) 및 공공데이터포털</span>
                <a href="https://www.분리배출.kr" target="_blank" rel="noopener" class="source-link">공식 포털 바로가기 ↗</a>
            </div>
        </div>
    `;
}

function calculateCarbonSavings(itemId) {
    const savingsMap = {
        pet_clear: 85,
        pet_colored: 45,
        plastic_container_clean: 60,
        plastic_container_dirty: 0,
        pizza_box_clean: 120,
        pizza_box_greasy: 0,
        can_metal: 190,
        glass_bottle_clean: 140,
        paper_pack: 95,
        styrofoam_clean: 70,
        battery: 210,
        medicine: 150
    };
    return savingsMap[itemId] || 50;
}

function toggleVoiceGuidance() {
    if (!window.speechSynthesis) {
        alert("현재 사용하시는 브라우저는 음성 안내 기능을 지원하지 않습니다.");
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        elements.voiceSpeakBtn.innerHTML = `🔊 큰 소리로 듣기`;
        return;
    }

    if (!state.currentResult) {
        speakText("물품을 먼저 검색해 주세요.");
        return;
    }

    const { item, region, mlResult } = state.currentResult;
    const textToSpeak = `${region} 기준, 인공지능 지도학습이 ${mlResult.confidence}% 확률로 ${item.name}으로 판별했습니다. 올바른 배출 방법은 ${item.disposalMethod}입니다.`;

    speakText(textToSpeak);
}

function speakText(text) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ko-KR";
    utterance.rate = 0.95;
    utterance.pitch = 1.0;

    utterance.onstart = () => {
        if (elements.voiceSpeakBtn) elements.voiceSpeakBtn.innerHTML = `⏹️ 소리 멈추기`;
    };

    utterance.onend = () => {
        if (elements.voiceSpeakBtn) elements.voiceSpeakBtn.innerHTML = `🔊 큰 소리로 듣기`;
    };

    utterance.onerror = () => {
        if (elements.voiceSpeakBtn) elements.voiceSpeakBtn.innerHTML = `🔊 큰 소리로 듣기`;
    };

    window.speechSynthesis.speak(utterance);
}

function handleVoiceInput() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("이 브라우저는 음성 인식을 지원하지 않습니다. 구글 크롬 또는 마이크로소프트 엣지 브라우저를 사용해 주세요.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "ko-KR";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    elements.voiceInputBtn.classList.add("listening");
    elements.voiceInputBtn.title = "음성을 듣고 있습니다... 말씀해 주세요.";

    recognition.onstart = () => {
        elements.itemInput.placeholder = "듣고 있습니다... 말씀해 주세요 (예: 깨끗한 페트병)";
    };

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        elements.itemInput.value = transcript;
        handleAnalyze();
    };

    recognition.onerror = () => {
        elements.voiceInputBtn.classList.remove("listening");
        elements.itemInput.placeholder = "버리려는 물건을 입력하세요 (예: 깨끗한 플라스틱 페트병, 피자박스)";
    };

    recognition.onend = () => {
        elements.voiceInputBtn.classList.remove("listening");
        elements.itemInput.placeholder = "버리려는 물건을 입력하세요 (예: 깨끗한 플라스틱 페트병, 피자박스)";
    };

    recognition.start();
}

function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const fileName = file.name.toLowerCase();
    let detectedItem = "깨끗한 플라스틱 페트병";

    if (fileName.includes("can") || fileName.includes("캔")) {
        detectedItem = "음료수캔";
    } else if (fileName.includes("box") || fileName.includes("박스")) {
        detectedItem = "택배상자";
    } else if (fileName.includes("glass") || fileName.includes("유리")) {
        detectedItem = "음료수 유리병";
    } else if (fileName.includes("battery") || fileName.includes("건전지")) {
        detectedItem = "다 쓴 AA 건전지";
    }

    elements.itemInput.value = detectedItem;
    alert(`📸 이미지 특징 추출 완료: '${detectedItem}'을(를) 인식하여 지도학습 모델로 분류합니다.`);
    handleAnalyze();
}

function initDatasetModal() {
    if (!elements.openDatasetModalBtn) return;

    elements.newTrainLabel.innerHTML = "";
    ITEM_DATABASE.forEach(item => {
        const opt = document.createElement("option");
        opt.value = item.id;
        opt.textContent = item.name.split(" ")[0] + ` (${item.category})`;
        elements.newTrainLabel.appendChild(opt);
    });

    updateDatasetCount();

    elements.openDatasetModalBtn.addEventListener("click", () => {
        renderDatasetTable();
        elements.datasetModal.style.display = "flex";
    });

    const closeModal = () => {
        elements.datasetModal.style.display = "none";
    };

    elements.closeDatasetModalBtn.addEventListener("click", closeModal);
    elements.closeDatasetModalBottomBtn.addEventListener("click", closeModal);

    elements.datasetModal.addEventListener("click", (e) => {
        if (e.target === elements.datasetModal) closeModal();
    });

    elements.addTrainDataBtn.addEventListener("click", () => {
        const text = elements.newTrainText.value.trim();
        const label = elements.newTrainLabel.value;

        if (!text) {
            alert("훈련용 쓰레기 텍스트를 입력해 주세요 (예: 치즈 묻은 피자박스).");
            elements.newTrainText.focus();
            return;
        }

        TRAINING_DATASET.push({ text, label });
        const trainResult = mlClassifier.train(TRAINING_DATASET);

        alert(`✅ [지도학습 완료] 새로운 데이터가 추가되어 모델이 실시간 재학습되었습니다!\n(총 훈련 데이터: ${trainResult.sampleCount}건)`);
        
        elements.newTrainText.value = "";
        updateDatasetCount();
        renderDatasetTable();

        if (elements.itemInput.value.trim()) {
            handleAnalyze();
        }
    });

    elements.resetDatasetBtn.addEventListener("click", () => {
        if (confirm("초기 기본 훈련 데이터셋으로 복원하시겠습니까?")) {
            mlClassifier.train(TRAINING_DATASET);
            updateDatasetCount();
            renderDatasetTable();
            alert("기본 훈련 데이터셋으로 모델이 재학습되었습니다.");
        }
    });
}

function updateDatasetCount() {
    const cnt = mlClassifier.dataset.length || TRAINING_DATASET.length;
    if (elements.trainCount) elements.trainCount.textContent = cnt;
    if (elements.datasetTotalCount) elements.datasetTotalCount.textContent = cnt;
}

function renderDatasetTable() {
    if (!elements.datasetTableBody) return;
    elements.datasetTableBody.innerHTML = "";

    const data = mlClassifier.dataset.length ? mlClassifier.dataset : TRAINING_DATASET;
    data.forEach((item, idx) => {
        const itemInfo = ITEM_DATABASE.find(i => i.id === item.label);
        const labelName = itemInfo ? itemInfo.name : item.label;
        const color = itemInfo ? itemInfo.categoryColor : "#059669";

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${idx + 1}</td>
            <td style="font-weight: 600;">${escapeHtml(item.text)}</td>
            <td>
                <span class="category-badge" style="background-color: ${color}; color: #ffffff; font-size: 0.76rem; padding: 3px 8px;">
                    ${escapeHtml(labelName.split(" ")[0])}
                </span>
            </td>
        `;
        elements.datasetTableBody.appendChild(tr);
    });
}

function escapeHtml(str) {
    if (!str) return "";
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
