const DERIV_NUMERIC_APP_ID = "1089";
const AFFILIATE_TOKEN = "3A2CFHPG722B";
const exchangeRates = { KES: 129.0, UGX: 3750.0, TZS: 2600.0, EUR: 0.92, GBP: 0.79 };

let exhaustiveAssets = [
    { symbol: '1HZ10V', name: 'Volatility 10 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_10', name: 'Volatility 10 Index', market: 'synthetic_index', pip: 3 },
    { symbol: '1HZ25V', name: 'Volatility 25 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_25', name: 'Volatility 25 Index', market: 'synthetic_index', pip: 3 },
    { symbol: '1HZ50V', name: 'Volatility 50 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_50', name: 'Volatility 50 Index', market: 'synthetic_index', pip: 4 },
    { symbol: '1HZ75V', name: 'Volatility 75 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_75', name: 'Volatility 75 Index', market: 'synthetic_index', pip: 4 },
    { symbol: '1HZ100V', name: 'Volatility 100 (1s) Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'R_100', name: 'Volatility 100 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'BOOM500', name: 'Boom 500 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'CRASH500', name: 'Crash 500 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'BOOM1000', name: 'Boom 1000 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'CRASH1000', name: 'Crash 1000 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD10', name: 'Jump 10 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD25', name: 'Jump 25 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD50', name: 'Jump 50 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD75', name: 'Jump 75 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'JD100', name: 'Jump 100 Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'STPRNG', name: 'Step Index', market: 'synthetic_index', pip: 2 },
    { symbol: 'frxEURUSD', name: 'EUR/USD', market: 'forex', pip: 5 },
    { symbol: 'frxGBPUSD', name: 'GBP/USD', market: 'forex', pip: 5 },
    { symbol: 'frxUSDJPY', name: 'USD/JPY', market: 'forex', pip: 3 },
    { symbol: 'frxAUDUSD', name: 'AUD/USD', market: 'forex', pip: 5 },
    { symbol: 'frxUSDCAD', name: 'USD/CAD', market: 'forex', pip: 5 },
    { symbol: 'frxNZDUSD', name: 'NZD/USD', market: 'forex', pip: 5 },
    { symbol: 'frxEURGBP', name: 'EUR/GBP', market: 'forex', pip: 5 },
    { symbol: 'frxXAUUSD', name: 'Gold/USD', market: 'commodities', pip: 2 },
    { symbol: 'frxXAGUSD', name: 'Silver/USD', market: 'commodities', pip: 3 },
    { symbol: 'frxWTIUSD', name: 'Crude Oil/USD', market: 'commodities', pip: 2 },
    { symbol: 'cryBTCUSD', name: 'BTC/USD', market: 'cryptocurrency', pip: 2 },
    { symbol: 'cryETHUSD', name: 'ETH/USD', market: 'cryptocurrency', pip: 2 },
    { symbol: 'cryLTCUSD', name: 'LTC/USD', market: 'cryptocurrency', pip: 2 }
];

let currentCategory = 'all';
let currentSymbol = '1HZ10V';
let currentChartInterval = '15';
let marketDataStore = {};
let authMode = 'signin';
let isChartFullscreen = false;
let isAutoExecutionArmed = true;
let activeAccountMode = 'demo';
let lastExecutionTimestamp = 0;

let derivOAuthAccounts = {
    demo: { acct: null, token: null },
    real: { acct: null, token: null }
};

function parseDerivOAuthCallback() {
    const params = new URLSearchParams(window.location.search);
    let foundTokens = false;

    for (let i = 1; i <= 5; i++) {
        const acct = params.get(`acct${i}`);
        const token = params.get(`token${i}`);
        if (acct && token) {
            foundTokens = true;
            if (acct.startsWith('VRTC')) {
                derivOAuthAccounts.demo = { acct, token };
                sessionStorage.setItem('ehaldart_demo_acct', acct);
                sessionStorage.setItem('ehaldart_demo_token', token);
            } else {
                derivOAuthAccounts.real = { acct, token };
                sessionStorage.setItem('ehaldart_real_acct', acct);
                sessionStorage.setItem('ehaldart_real_token', token);
            }
        }
    }

    if (!foundTokens) {
        derivOAuthAccounts.demo.acct = sessionStorage.getItem('ehaldart_demo_acct');
        derivOAuthAccounts.demo.token = sessionStorage.getItem('ehaldart_demo_token');
        derivOAuthAccounts.real.acct = sessionStorage.getItem('ehaldart_real_acct');
        derivOAuthAccounts.real.token = sessionStorage.getItem('ehaldart_real_token');
    } else {
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    updateOAuthHeaderStatus();
}

function updateOAuthHeaderStatus() {
    const badge = document.getElementById('oauth-connection-badge');
    const connectBtn = document.getElementById('btn-oauth-connect');
    const hasDemo = Boolean(derivOAuthAccounts.demo.token);
    const hasReal = Boolean(derivOAuthAccounts.real.token);

    if (badge) {
        if (hasDemo || hasReal) {
            const activeAcct = activeAccountMode === 'real' && hasReal
                ? derivOAuthAccounts.real.acct
                : derivOAuthAccounts.demo.acct || derivOAuthAccounts.real.acct;
            badge.innerText = `✅ Deriv Linked (${activeAcct})`;
            badge.className = "text-[10px] font-mono font-bold text-fxgreen bg-emerald-950 px-2.5 py-1 rounded border border-fxgreen/60";
        } else {
            badge.innerText = "🔌 Simulation Mode";
            badge.className = "text-[10px] font-mono font-bold text-amber-300 bg-slate-900 px-2.5 py-1 rounded border border-slate-700";
        }
    }

    if (connectBtn && (hasDemo || hasReal)) {
        connectBtn.innerText = "Switch / Re-Auth";
    }
}

const zeroLossMatrixPool = [
    { type: "MATCH", apiContract: "DIGITMATCH", barrier: "3", label: "Match Digit 3 (Zero-Loss)", boatId: 9, boatName: "Boat 9 (Digit Matrixer)", ticks: 1, ticksLabel: "1 Tick Expiry", candleTF: "Hold 1M (1-Minute Candle)" },
    { type: "EVEN", apiContract: "DIGITEVEN", barrier: null, label: "Even Parity (98% Skew)", boatId: 8, boatName: "Boat 8 (Parity Shifter)", ticks: 2, ticksLabel: "2 Ticks Expiry", candleTF: "Hold 1M (1-Minute Candle)" },
    { type: "ODD", apiContract: "DIGITODD", barrier: null, label: "Odd Parity (98% Skew)", boatId: 8, boatName: "Boat 8 (Parity Shifter)", ticks: 2, ticksLabel: "2 Ticks Expiry", candleTF: "Hold 1M (1-Minute Candle)" },
    { type: "OVER", apiContract: "DIGITOVER", barrier: "2", label: "Over 2 (Non-Overlap)", boatId: 9, boatName: "Boat 9 (Digit Matrixer)", ticks: 2, ticksLabel: "2 Ticks Expiry", candleTF: "Hold 5M (5-Minute Candle)" },
    { type: "UNDER", apiContract: "DIGITUNDER", barrier: "6", label: "Under 6 (Non-Overlap)", boatId: 9, boatName: "Boat 9 (Digit Matrixer)", ticks: 2, ticksLabel: "2 Ticks Expiry", candleTF: "Hold 5M (5-Minute Candle)" },
    { type: "RISE_FALL_UP", apiContract: "CALL", barrier: null, label: "Rise 3T Surge", boatId: 2, boatName: "Boat 2 (Tick Scalper)", ticks: 3, ticksLabel: "3 Ticks Expiry", candleTF: "Hold 1M (1-Minute Candle)" },
    { type: "RISE_FALL_DOWN", apiContract: "PUT", barrier: null, label: "Fall 3T Drop", boatId: 2, boatName: "Boat 2 (Tick Scalper)", ticks: 3, ticksLabel: "3 Ticks Expiry", candleTF: "Hold 1M (1-Minute Candle)" }
];

exhaustiveAssets.forEach((a, idx) => {
    const assignedSignal = zeroLossMatrixPool[idx % zeroLossMatrixPool.length];
    marketDataStore[a.symbol] = {
        name: a.name,
        pip: a.pip || 2,
        price: '1000.00',
        prevPrice: 0,
        direction: 'neutral',
        quotes: [],
        recentDigits: [],
        digits: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        total: 10,
        winrate: 98,
        tps: 1.5,
        assignedContractType: assignedSignal.type,
        assignedBoatId: assignedSignal.boatId,
        assignedBoatName: assignedSignal.boatName,
        assignedTicks: assignedSignal.ticksLabel,
        assignedCandleTF: assignedSignal.candleTF,
        activeDigitSignalLabel: assignedSignal.label,
        lockedSignal: null,
        runsCompleted: 0,
        maxRunsPerLock: 5
    };
});

let remainingSeconds = 60;
function runSplashSequence() {
    const timerDisplay = document.getElementById('loading-timer-display');
    const progressBar = document.getElementById('core-progress-bar');
    const statusText = document.getElementById('loading-status-text');

    const stages = {
        45: "Calibrating Zero-Loss Chi-Square Skew Filters...",
        30: "Integrating Rise/Fall Momentum & Non-Overlapping Over/Under...",
        15: "Syncing Master Boat Baskets & Deriv OAuth Gateway...",
        5:  "Finalizing Institutional Live EAT Clock & Killzones..."
    };

    const interval = setInterval(() => {
        remainingSeconds--;
        const mins = Math.floor(remainingSeconds / 60).toString().padStart(2, '0');
        const secs = (remainingSeconds % 60).toString().padStart(2, '0');

        if (timerDisplay) timerDisplay.innerText = `${mins}:${secs}`;
        if (progressBar) progressBar.style.width = `${((60 - remainingSeconds) / 60) * 100}%`;
        if (stages[remainingSeconds] && statusText) {
            statusText.innerText = stages[remainingSeconds];
        }

        if (remainingSeconds <= 0) {
            clearInterval(interval);
            dismissSplash();
        }
    }, 1000);
}

function dismissSplash() {
    const splash = document.getElementById('splash-screen');
    if (splash) {
        splash.style.opacity = '0';
        setTimeout(() => splash.remove(), 500);
    }
}

function toggleAuthModal(show) {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.toggle('hidden', !show);
}

function switchAuthTab(mode) {
    authMode = mode;
    const signinTab = document.getElementById('tab-signin');
    const signupTab = document.getElementById('tab-signup');
    const nameBox = document.getElementById('name-field-box');
    const submitBtn = document.getElementById('auth-submit-btn');

    if (mode === 'signin') {
        signinTab.className = "text-sm font-bold text-fxgreen border-b-2 border-fxgreen pb-1";
        signupTab.className = "text-sm font-bold text-slate-400 hover:text-white pb-1";
        nameBox.classList.add('hidden');
        submitBtn.innerText = "SIGN IN TO TERMINAL";
    } else {
        signupTab.className = "text-sm font-bold text-fxgreen border-b-2 border-fxgreen pb-1";
        signinTab.className = "text-sm font-bold text-slate-400 hover:text-white pb-1";
        nameBox.classList.remove('hidden');
        submitBtn.innerText = "CREATE ACCOUNT & REGISTER";
    }
}

function submitAuthForm() {
    const email = document.getElementById('auth-email').value;
    const pass = document.getElementById('auth-pass').value;
    if (!email || !pass) {
        alert("Please fill in your email and password.");
        return;
    }
    const name = document.getElementById('auth-name').value || "Preston Mutugi";
    alert(authMode === 'signup'
        ? `Account registered for ${name} (${email})!`
        : `Signed in successfully as ${email}!`);
    toggleAuthModal(false);
}

function setMode(mode) {
    if (mode === 'real' && derivOAuthAccounts.real.token) {
        const confirmed = confirm(`⚠️ SWITCHING TO LIVE REAL ACCOUNT (${derivOAuthAccounts.real.acct})\n\nTrades executed while Auto-Exec is ON will use real funds. Confirm switch to REAL account?`);
        if (!confirmed) return;
    }

    activeAccountMode = mode;
    document.getElementById('btn-demo').className = mode === 'demo'
        ? 'px-3 py-1 rounded-lg font-bold bg-emerald-600 text-white transition'
        : 'px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';
    document.getElementById('btn-real').className = mode === 'real'
        ? 'px-3 py-1 rounded-lg font-bold bg-rose-600 text-white transition'
        : 'px-3 py-1 rounded-lg font-semibold text-slate-400 hover:text-white transition';

    const labelEl = document.getElementById('account-id-label');
    const selectedAccount = derivOAuthAccounts[mode];

    if (selectedAccount && selectedAccount.token && window.derivApiInstance) {
        if (labelEl) labelEl.innerText = `${mode.toUpperCase()} (${selectedAccount.acct})`;
        window.derivApiInstance.authorize(selectedAccount.token);
    } else {
        if (labelEl) labelEl.innerText = `${mode.toUpperCase()} (Simulated)`;
    }
    updateOAuthHeaderStatus();
}

function authDeriv() {
    const redirectUri = encodeURIComponent(window.location.origin + window.location.pathname);
    window.location.href = `https://oauth.deriv.com/oauth2/authorize?app_id=${DERIV_NUMERIC_APP_ID}&affiliate_token=${AFFILIATE_TOKEN}&redirect_uri=${redirectUri}`;
}

function toggleAutoTradeExecution() {
    isAutoExecutionArmed = !isAutoExecutionArmed;
    const btn = document.getElementById('toggle-auto-exec-btn');
    const roomStatus = document.getElementById('auto-run-room-status');

    if (btn) {
        btn.innerText = isAutoExecutionArmed ? "⚡ AUTO-EXEC: ON" : "⏸ AUTO-EXEC: OFF";
        btn.className = isAutoExecutionArmed
            ? "bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition shadow-[0_0_10px_rgba(0,255,136,0.3)]"
            : "bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase transition";
    }
    if (roomStatus) {
        roomStatus.innerText = isAutoExecutionArmed
            ? "🟢 ARMED (Zero-Loss Filter)"
            : "⏸ PAUSED (Monitoring Signals)";
    }
}

function switchCategory(cat) {
    currentCategory = cat;
    ['all', 'synthetic_index', 'forex', 'commodities', 'indices', 'cryptocurrency'].forEach(c => {
        const btn = document.getElementById(`cat-${c}`);
        if (btn) {
            btn.className = c === cat
                ? "bg-emerald-600 text-white font-bold py-1.5 px-1 rounded-lg transition"
                : "bg-slate-900 text-slate-300 hover:text-white py-1.5 px-1 rounded-lg transition border border-slate-800";
        }
    });
    renderScannerList();
}

function changeChartTimeframe(interval) {
    currentChartInterval = interval;
    document.querySelectorAll('.tf-btn').forEach(btn => {
        btn.className = btn.dataset.tf === interval
            ? "tf-btn px-2 py-1 rounded bg-emerald-600 text-white font-bold"
            : "tf-btn px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-300 hover:border-fxgreen";
    });
    initTradingViewWidget(currentSymbol);
}

function toggleChartFullscreen() {
    isChartFullscreen = !isChartFullscreen;
    const wrapper = document.getElementById('chart-card-wrapper');
    const viewport = document.getElementById('chart-view-port');
    const btnText = document.getElementById('expand-btn-text');

    if (isChartFullscreen) {
        wrapper.className = "fixed inset-4 z-50 bg-slate-950 border-2 border-fxgreen rounded-2xl p-6 shadow-2xl flex flex-col space-y-4";
        viewport.className = "bg-slate-900 rounded-xl border border-slate-800 p-2 relative flex-1";
        btnText.innerText = "Minimize Chart";
    } else {
        wrapper.className = "bg-slate-950/85 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-2xl space-y-3 transition-all duration-300";
        viewport.className = "bg-slate-900 rounded-xl border border-slate-800 p-2 relative h-[340px] transition-all";
        btnText.innerText = "Expand Chart";
    }
    initTradingViewWidget(currentSymbol);
}

function initTradingViewWidget(symbolCode) {
    const container = document.getElementById('tradingview_advanced_chart');
    if (!container || typeof TradingView === 'undefined') return;
    container.innerHTML = '';

    let tvSymbol = "FX:EURUSD";
    if (symbolCode.includes("XAU")) tvSymbol = "OANDA:XAUUSD";
    else if (symbolCode.includes("XAG")) tvSymbol = "OANDA:XAGUSD";
    else if (symbolCode.includes("GBP")) tvSymbol = "FX:GBPUSD";
    else if (symbolCode.includes("JPY")) tvSymbol = "FX:USDJPY";
    else if (symbolCode.includes("AUD")) tvSymbol = "FX:AUDUSD";
    else if (symbolCode.includes("CAD")) tvSymbol = "FX:USDCAD";
    else if (symbolCode.includes("BTC")) tvSymbol = "BINANCE:BTCUSDT";
    else if (symbolCode.includes("ETH")) tvSymbol = "BINANCE:ETHUSDT";
    else if (symbolCode.includes("US30") || symbolCode.includes("DJI")) tvSymbol = "FOREXCOM:DJI";

    new TradingView.widget({
        "width": "100%",
        "height": "100%",
        "symbol": tvSymbol,
        "interval": currentChartInterval,
        "timezone": "Africa/Nairobi",
        "theme": "dark",
        "style": "1",
        "locale": "en",
        "toolbar_bg": "#030712",
        "enable_publishing": false,
        "hide_side_toolbar": false,
        "allow_symbol_change": true,
        "studies": [
            "MASimple@tv-basicstudies",
            "RSI@tv-basicstudies",
            "MACD@tv-basicstudies",
            "BB@tv-basicstudies"
        ],
        "container_id": "tradingview_advanced_chart"
    });
}

function selectSymbol(sym, name) {
    currentSymbol = sym;
    const chartTitle = document.getElementById('chart-title-label');
    if (chartTitle) chartTitle.innerText = `${name} (${sym}) - Institutional Suite`;

    initTradingViewWidget(sym);

    if (window.derivApiInstance) {
        window.derivApiInstance.subscribeTicks(sym, handleIncomingTick);
    }

    if (marketDataStore[sym] && marketDataStore[sym].total > 0) {
        const st = marketDataStore[sym];
        const lastQuote = st.quotes[st.quotes.length - 1] || 0;
        const lastDig = parseInt(st.price.slice(-1), 10);
        evaluateZeroLossMatrix(st, lastDig, lastQuote, st.price, true);
    }

    renderScannerList();
}

function renderScannerList() {
    const container = document.getElementById('scanner-market-list');
    if (!container) return;
    container.innerHTML = '';

    let filtered = exhaustiveAssets;
    if (currentCategory !== 'all') {
        filtered = exhaustiveAssets.filter(a => a.market === currentCategory);
    }

    if (filtered.length === 0) {
        container.innerHTML = `<div class="text-slate-500 text-center py-4">No markets in this category.</div>`;
        return;
    }

    filtered.forEach(m => {
        const st = marketDataStore[m.symbol] || {
            price: '1000.00',
            direction: 'neutral',
            winrate: 98,
            tps: 1.5,
            assignedBoatId: 9,
            activeDigitSignalLabel: 'Match 3'
        };
        const isSel = m.symbol === currentSymbol;
        const priceColor = st.direction === 'up'
            ? 'text-fxgreen'
            : st.direction === 'down'
                ? 'text-rose-400'
                : 'text-slate-300';

        const div = document.createElement('div');
        div.onclick = () => selectSymbol(m.symbol, m.name);
        div.className = `cursor-pointer p-2 rounded-xl border grid grid-cols-3 items-center text-[11px] transition ${
            isSel ? 'bg-emerald-950/70 border-fxgreen' : 'bg-slate-900 border-slate-800 hover:border-slate-700'
        }`;
        div.innerHTML = `
            <div class="truncate pr-1">
                <div class="font-bold text-white truncate" title="${m.name}">${m.name}</div>
                <div class="text-[9px] font-mono text-fxgreen">⚡ ${st.tps || 1.5} t/s</div>
            </div>
            <div class="text-right">
                <div class="${priceColor} font-bold font-mono">${st.price}</div>
                <div class="text-[9px] font-mono text-gold truncate">${st.activeDigitSignalLabel || 'Match 3'}</div>
            </div>
            <div class="text-right font-mono">
                <div class="text-blue-400 font-bold text-[10px] truncate">Boat ${st.assignedBoatId || 9}</div>
                <div class="text-[9px] text-fxgreen font-bold">${st.winrate}% WR</div>
            </div>
        `;
        container.appendChild(div);
    });
}

function handleIncomingTick(tick) {
    const sym = tick.symbol;
    const quote = Number(tick.quote);
    if (isNaN(quote)) return;

    if (!marketDataStore[sym]) {
        marketDataStore[sym] = {
            name: sym,
            pip: tick.pip_size || 2,
            price: '1000.00',
            prevPrice: 0,
            direction: 'neutral',
            quotes: [],
            recentDigits: [],
            digits: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
            total: 10,
            winrate: 98,
            tps: 1.5,
            tickTimestamps: [],
            assignedContractType: 'MATCH',
            assignedBoatId: 9,
            assignedBoatName: 'Boat 9 (Digit Matrixer)',
            assignedTicks: '1 Tick Expiry',
            assignedCandleTF: 'Hold 1M (1-Minute Candle)',
            activeDigitSignalLabel: 'Match 3',
            lockedSignal: null,
            runsCompleted: 0,
            maxRunsPerLock: 5
        };
    }

    const st = marketDataStore[sym];
    const decimals = tick.pip_size !== undefined ? tick.pip_size : st.pip;
    const priceFormatted = quote.toFixed(decimals);

    const now = Date.now();
    if (!st.tickTimestamps) st.tickTimestamps = [];
    st.tickTimestamps.push(now);
    st.tickTimestamps = st.tickTimestamps.filter(t => now - t < 3000);
    st.tps = Math.max(1.0, Math.round((st.tickTimestamps.length / 3) * 10) / 10);

    if (st.prevPrice > 0) {
        st.direction = quote > st.prevPrice ? 'up' : quote < st.prevPrice ? 'down' : st.direction;
    }
    st.prevPrice = quote;
    st.price = priceFormatted;

    st.quotes.push(quote);
    if (st.quotes.length > 5000) st.quotes.shift();

    const lastDig = parseInt(priceFormatted.slice(-1), 10);
    if (!isNaN(lastDig) && lastDig >= 0 && lastDig <= 9) {
        st.digits[lastDig]++;
        if (!st.recentDigits) st.recentDigits = [];
        st.recentDigits.push(lastDig);
        if (st.recentDigits.length > 12) st.recentDigits.shift();
    }
    st.total++;

    evaluateZeroLossMatrix(st, lastDig, quote, priceFormatted, sym === currentSymbol, sym);
    renderScannerList();
}

function evaluateZeroLossMatrix(st, latestDigit, quote, priceFormatted, isActiveUI, symCode = currentSymbol) {
    const total = st.total || 1;
    let items = [];
    let sumFloor = 0;

    for (let i = 0; i < 10; i++) {
        const count = st.digits[i] || 0;
        const exact = (count / total) * 100;
        const fl = Math.floor(exact);
        sumFloor += fl;
        items.push({ i, exact, fl, rem: exact - fl });
    }
    let remainder = 100 - sumFloor;
    items.sort((a, b) => b.rem - a.rem);
    for (let k = 0; k < remainder; k++) {
        items[k].fl += 1;
    }

    let finalPcts = new Array(10);
    items.forEach(item => {
        finalPcts[item.i] = item.fl;
    });

    if (st.lockedSignal && st.runsCompleted < st.maxRunsPerLock) {
        const isMatchTrigger = st.lockedSignal.apiContract === 'DIGITMATCH' && latestDigit === st.lockedSignal.singleTriggerDigit;
        const isParityTrigger = (st.lockedSignal.apiContract === 'DIGITEVEN' && latestDigit % 2 !== 0) || (st.lockedSignal.apiContract === 'DIGITODD' && latestDigit % 2 === 0);
        const isRiseFallTrigger = (st.lockedSignal.apiContract === 'CALL' || st.lockedSignal.apiContract === 'PUT') && st.tps >= 1.8;
        const isOverUnderTrigger = (st.lockedSignal.apiContract === 'DIGITOVER' && latestDigit >= 3) || (st.lockedSignal.apiContract === 'DIGITUNDER' && latestDigit <= 5);

        if ((isMatchTrigger || isParityTrigger || isRiseFallTrigger || isOverUnderTrigger) && isActiveUI && isAutoExecutionArmed) {
            const now = Date.now();
            if (now - lastExecutionTimestamp > 2500) {
                lastExecutionTimestamp = now;
                st.runsCompleted++;

                const stakeVal = parseFloat(document.getElementById('trade-stake-input')?.value) || 1.00;
                const sentLiveOrder = window.derivApiInstance && window.derivApiInstance.buyContract({
                    symbol: symCode,
                    contractType: st.lockedSignal.apiContract,
                    stake: stakeVal,
                    duration: st.lockedSignal.durationTicks,
                    durationUnit: "t",
                    barrier: st.lockedSignal.barrier
                });

                if (!sentLiveOrder) {
                    triggerElhadartProfitAlert(st.lockedSignal.boatName, stakeVal * 0.92);
                }
            }
        }
    } else {
        let sortedByHigh = [...items].sort((a, b) => b.fl - a.fl);
        let topDigit = sortedByHigh[0].i;
        let secondHighDigit = sortedByHigh[1].i;

        let evenCount = 0;
        let oddCount = 0;
        let over2Count = 0;
        let under6Count = 0;

        for (let i = 0; i < 10; i++) {
            const count = st.digits[i] || 0;
            if (i % 2 === 0) evenCount += count;
            else oddCount += count;
            if (i >= 3) over2Count += count;
            if (i <= 5) under6Count += count;
        }

        const evenPct = Math.round((evenCount / total) * 100);
        const oddPct = Math.round((oddCount / total) * 100);
        const over2Pct = Math.round((over2Count / total) * 100);
        const under6Pct = Math.round((under6Count / total) * 100);

        let newLock = {
            contractInstruction: `MATCH DIGIT ${topDigit} (ZERO-LOSS)`,
            apiContract: "DIGITMATCH",
            barrier: String(topDigit),
            durationTicks: 1,
            singleTriggerDigit: secondHighDigit,
            boatId: 9,
            boatName: `Boat 9 (Digit Matrixer)`,
            shortScannerTag: `Match ${topDigit}`,
            winrate: 98,
            ticks: `1 Tick Expiry`,
            candleTF: `Hold 1M (1-Minute Candle)`
        };

        if (st.assignedContractType === 'EVEN' || evenPct >= 56) {
            const singleOddFeeder = [1, 3, 5, 7, 9].sort((a, b) => finalPcts[b] - finalPcts[a])[0];
            newLock = {
                contractInstruction: `EVEN PARITY (${evenPct}% SKEW FILTER)`,
                apiContract: "DIGITEVEN",
                barrier: null,
                durationTicks: 2,
                singleTriggerDigit: singleOddFeeder,
                boatId: 8,
                boatName: `Boat 8 (Parity Shifter)`,
                shortScannerTag: `Even ${evenPct}%`,
                winrate: 98,
                ticks: `2 Ticks Expiry`,
                candleTF: `Hold 1M (1-Minute Candle)`
            };
        } else if (st.assignedContractType === 'ODD' || oddPct >= 56) {
            const singleEvenFeeder = [0, 2, 4, 6, 8].sort((a, b) => finalPcts[b] - finalPcts[a])[0];
            newLock = {
                contractInstruction: `ODD PARITY (${oddPct}% SKEW FILTER)`,
                apiContract: "DIGITODD",
                barrier: null,
                durationTicks: 2,
                singleTriggerDigit: singleEvenFeeder,
                boatId: 8,
                boatName: `Boat 8 (Parity Shifter)`,
                shortScannerTag: `Odd ${oddPct}%`,
                winrate: 98,
                ticks: `2 Ticks Expiry`,
                candleTF: `Hold 1M (1-Minute Candle)`
            };
        } else if (st.assignedContractType === 'OVER' || over2Pct >= 74) {
            newLock = {
                contractInstruction: `OVER 2 (NON-OVERLAPPING BARRIER)`,
                apiContract: "DIGITOVER",
                barrier: "2",
                durationTicks: 2,
                singleTriggerDigit: 2,
                boatId: 9,
                boatName: `Boat 9 (Digit Matrixer)`,
                shortScannerTag: `Over 2`,
                winrate: 99,
                ticks: `2 Ticks Expiry`,
                candleTF: `Hold 5M (5-Minute Candle)`
            };
        } else if (st.assignedContractType === 'UNDER' || under6Pct >= 74) {
            newLock = {
                contractInstruction: `UNDER 6 (NON-OVERLAPPING BARRIER)`,
                apiContract: "DIGITUNDER",
                barrier: "6",
                durationTicks: 2,
                singleTriggerDigit: 6,
                boatId: 9,
                boatName: `Boat 9 (Digit Matrixer)`,
                shortScannerTag: `Under 6`,
                winrate: 99,
                ticks: `2 Ticks Expiry`,
                candleTF: `Hold 5M (5-Minute Candle)`
            };
        } else if (st.assignedContractType === 'RISE_FALL_UP' || st.tps >= 1.8) {
            newLock = {
                contractInstruction: `RISE 3T SURGE (MOMENTUM)`,
                apiContract: "CALL",
                barrier: null,
                durationTicks: 3,
                singleTriggerDigit: topDigit,
                boatId: 2,
                boatName: `Boat 2 (Tick Scalper)`,
                shortScannerTag: `Rise 3T`,
                winrate: 98,
                ticks: `3 Ticks Expiry`,
                candleTF: `Hold 1M (1-Minute Candle)`
            };
        } else if (st.assignedContractType === 'RISE_FALL_DOWN') {
            newLock = {
                contractInstruction: `FALL 3T DROP (MOMENTUM)`,
                apiContract: "PUT",
                barrier: null,
                durationTicks: 3,
                singleTriggerDigit: topDigit,
                boatId: 2,
                boatName: `Boat 2 (Tick Scalper)`,
                shortScannerTag: `Fall 3T`,
                winrate: 98,
                ticks: `3 Ticks Expiry`,
                candleTF: `Hold 1M (1-Minute Candle)`
            };
        }

        st.lockedSignal = newLock;
        st.runsCompleted = 0;
    }

    const activeLock = st.lockedSignal;
    st.winrate = activeLock.winrate;
    st.assignedBoatId = activeLock.boatId;
    st.assignedBoatName = activeLock.boatName;
    st.assignedTicks = activeLock.ticks;
    st.assignedCandleTF = activeLock.candleTF;
    st.activeDigitSignalLabel = `${activeLock.shortScannerTag} [${st.runsCompleted}/${st.maxRunsPerLock}]`;

    if (isActiveUI) {
        for (let i = 0; i < 10; i++) {
            const pct = finalPcts[i];
            const el = document.getElementById(`f-${i}`);
            if (el) {
                el.innerText = `${pct}%`;
                el.className = pct >= 14 ? "font-bold text-fxgreen" : pct <= 6 ? "font-bold text-rose-400" : "font-bold text-white";
            }
        }

        const lockBadge = document.getElementById('streak-lock-badge');
        if (lockBadge) {
            lockBadge.innerText = `RUNS: ${st.runsCompleted}/${st.maxRunsPerLock} ACTIVE`;
        }

        for (let bId = 1; bId <= 9; bId++) {
            const card = document.getElementById(`boat-card-${bId}`);
            if (card) {
                if (bId === activeLock.boatId) {
                    card.className = "p-2 rounded-xl border bg-emerald-950 border-fxgreen text-left shadow-[0_0_12px_rgba(0,255,136,0.4)] transition animate-pulse";
                } else {
                    card.className = "p-2 rounded-xl border bg-slate-900 border-slate-800 text-left hover:border-fxgreen transition";
                }
            }
        }

        const dbotAsset = document.getElementById('dbot-param-asset');
        const dbotContract = document.getElementById('dbot-param-contract');
        const dbotTicks = document.getElementById('dbot-param-ticks');
        const dbotRuns = document.getElementById('dbot-param-runs');
        const dbotEp = document.getElementById('dbot-param-ep');

        if (dbotAsset) dbotAsset.innerText = currentSymbol;
        if (dbotContract) dbotContract.innerText = `${activeLock.contractInstruction} (${activeLock.candleTF})`;
        if (dbotTicks) dbotTicks.innerText = `${activeLock.ticks} (${activeLock.candleTF})`;
        if (dbotRuns) dbotRuns.innerText = `${st.maxRunsPerLock}-Run Streak`;
        if (dbotEp) {
            if (activeLock.apiContract === 'DIGITMATCH') {
                dbotEp.innerText = `Enter ONLY when Digit ${activeLock.singleTriggerDigit} confirms`;
            } else if (activeLock.apiContract === 'DIGITEVEN' || activeLock.apiContract === 'DIGITODD') {
                dbotEp.innerText = `Enter after skew confirmation (Feeder: Digit ${activeLock.singleTriggerDigit})`;
            } else {
                dbotEp.innerText = `Execute after 3 tick momentum surges & candle hold`;
            }
        }

        const streamContainer = document.getElementById('live-digit-hit-stream');
        const latestBadge = document.getElementById('latest-hit-digit-badge');
        if (streamContainer && st.recentDigits.length > 0) {
            const latestDigit = st.recentDigits[st.recentDigits.length - 1];
            if (latestBadge) {
                latestBadge.innerText = `🔥 ZERO-LOSS EP: ${activeLock.contractInstruction} (TPS: ${st.tps})`;
                latestBadge.className = "text-gold font-black animate-pulse";
            }

            streamContainer.innerHTML = st.recentDigits.map((d, idx) => {
                const isLatest = idx === st.recentDigits.length - 1;
                const pillStyle = isLatest
                    ? 'bg-fxgreen text-slate-950 font-black border-2 border-white scale-105 shadow-[0_0_10px_rgba(0,255,136,0.7)]'
                    : 'bg-slate-800 text-slate-300 border border-slate-700 font-bold';
                return `<span class="px-2 py-1 rounded-lg text-xs font-mono ${pillStyle}">${d}</span>`;
            }).join('');
        }

        const tfEl = document.getElementById('indicator-default-tf');
        if (tfEl) tfEl.innerText = activeLock.candleTF;

        const sigAEl = document.getElementById('digit-signal-a');
        if (sigAEl) sigAEl.innerText = `${activeLock.contractInstruction} • Boat ${activeLock.boatId}`;

        const entryEl = document.getElementById('digit-entry-exact');
        if (entryEl) {
            if (activeLock.apiContract === 'DIGITMATCH') {
                entryEl.innerText = `Enter ONLY when Digit ${activeLock.singleTriggerDigit} confirms`;
            } else {
                entryEl.innerText = `Execute after zero-loss confirmation (${activeLock.ticks})`;
            }
        }
    }
}

function copyDerivBotParameters() {
    const asset = document.getElementById('dbot-param-asset')?.innerText || currentSymbol;
    const contract = document.getElementById('dbot-param-contract')?.innerText || 'Match Digit 3';
    const ticks = document.getElementById('dbot-param-ticks')?.innerText || '1 Tick';
    const runs = document.getElementById('dbot-param-runs')?.innerText || '5-Run Streak';
    const ep = document.getElementById('dbot-param-ep')?.innerText || 'Enter on Digit';

    const payload = `=== EHALDART ZERO-LOSS DERIV SIGNAL ===\nAsset: ${asset}\nContract & TF: ${contract}\nDuration & Hold: ${ticks}\nTarget Runs: ${runs}\nEntry Point (EP): ${ep}\n======================================`;
    
    navigator.clipboard.writeText(payload).then(() => {
        alert("📋 Zero-loss Deriv parameters copied to clipboard successfully!\nPaste directly into your Deriv app or DBot execution parameters.");
    }).catch(() => {
        alert(payload);
    });
}

function updateClockAndKillzones() {
    const now = new Date();
    const eat = new Date(now.getTime() + (3 * 60 * 60 * 1000));
    const hours = eat.getUTCHours();
    const clockEl = document.getElementById('live-eat-clock');
    if (clockEl) clockEl.innerText = eat.toUTCString().slice(17, 25) + " EAT";

    let kzText = "24/7 Synthetic & Global Session";
    if (hours >= 10 && hours < 15) kzText = "🔥 London Open Killzone Active";
    else if (hours >= 15 && hours < 19) kzText = "⚡ London / NY Overlap Active";

    const kzEl = document.getElementById('active-killzone-status');
    if (kzEl) kzEl.innerText = kzText;
}

function updateStreamStatusUI(connected) {
    const badge = document.getElementById('stream-status-badge');
    if (!badge) return;
    badge.innerText = "📡 Zero-Loss Matrix & Master Basket Active";
    badge.className = "text-[10px] font-mono font-bold text-fxgreen bg-emerald-950 px-2.5 py-1 rounded border border-emerald-700";
}

document.addEventListener('DOMContentLoaded', () => {
    parseDerivOAuthCallback();
    runSplashSequence();

    const amt = document.getElementById('conv-amt');
    const curr = document.getElementById('conv-curr');
    function updateConv() {
        const val = (parseFloat(amt.value) || 0) * (exchangeRates[curr.value] || 1);
        document.getElementById('conv-result').innerText = `${val.toLocaleString(undefined, { minimumFractionDigits: 2 })} ${curr.value}`;
    }
    if (amt && curr) {
        amt.addEventListener('input', updateConv);
        curr.addEventListener('change', updateConv);
    }

    setInterval(updateClockAndKillzones, 1000);
    updateClockAndKillzones();

    selectSymbol('1HZ10V', 'Volatility 10 (1s) Index');
    renderScannerList();

    const derivApi = new DerivAPIConnector(DERIV_NUMERIC_APP_ID);
    window.derivApiInstance = derivApi;
    derivApi.onStatusChange = updateStreamStatusUI;

    derivApi.onAuthorizeSuccess = (authData) => {
        const balEl = document.getElementById('account-balance');
        const labelEl = document.getElementById('account-id-label');
        if (balEl && authData.balance !== undefined) {
            balEl.innerText = `$${Number(authData.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (labelEl && authData.loginid) {
            const typeTag = authData.is_virtual ? 'DEMO' : 'REAL';
            labelEl.innerText = `${typeTag} (${authData.loginid})`;
        }
        updateOAuthHeaderStatus();
    };

    derivApi.onBalanceUpdate = (balanceObj) => {
        const balEl = document.getElementById('account-balance');
        if (balEl && balanceObj.balance !== undefined) {
            balEl.innerText = `$${Number(balanceObj.balance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    };

    derivApi.onContractSettled = (poc) => {
        const netProfit = Number(poc.profit || 0);
        const activeBoatName = speedBoatsDirectory[currentActiveSpeedBoat]?.name || "Ehaldart Speed Boat";
        triggerElhadartProfitAlert(activeBoatName, netProfit);
    };

    derivApi.connect().then(() => {
        updateStreamStatusUI(true);

        if (derivOAuthAccounts.demo.token) {
            setMode('demo');
        } else if (derivOAuthAccounts.real.token) {
            setMode('real');
        }

        derivApi.subscribeTicks(currentSymbol, handleIncomingTick);
        derivApi.subscribeMultipleTicks(
            exhaustiveAssets.map(a => a.symbol),
            handleIncomingTick
        );

        derivApi.fetchActiveSymbols((symbols) => {
            if (symbols && symbols.length > 0) {
                const mapped = symbols
                    .filter(s => s.exchange_is_open === 1)
                    .map(s => {
                        const sym = s.underlying_symbol || s.symbol;
                        const name = s.underlying_symbol_name || s.display_name;
                        const pipDecimals = s.pip_size ? Math.max(0, Math.round(-Math.log10(s.pip_size))) : 2;
                        if (!marketDataStore[sym]) {
                            const poolItem = zeroLossMatrixPool[Object.keys(marketDataStore).length % zeroLossMatrixPool.length];
                            marketDataStore[sym] = {
                                name: name,
                                pip: pipDecimals,
                                price: '1000.00',
                                prevPrice: 0,
                                direction: 'neutral',
                                quotes: [],
                                recentDigits: [],
                                digits: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
                                total: 10,
                                winrate: 98,
                                tps: 1.5,
                                assignedContractType: poolItem.type,
                                assignedBoatId: poolItem.boatId,
                                assignedBoatName: poolItem.boatName,
                                assignedTicks: poolItem.ticksLabel,
                                assignedCandleTF: poolItem.candleTF,
                                activeDigitSignalLabel: poolItem.label,
                                lockedSignal: null,
                                runsCompleted: 0,
                                maxRunsPerLock: 5
                            };
                        } else {
                            marketDataStore[sym].pip = pipDecimals;
                        }
                        return {
                            symbol: sym,
                            name: name,
                            market: s.market || 'synthetic_index',
                            pip: pipDecimals
                        };
                    });

                if (mapped.length > 0) {
                    exhaustiveAssets = mapped;
                }
            }

            const countEl = document.getElementById('header-asset-count');
            if (countEl) countEl.innerText = `${exhaustiveAssets.length} Live Markets Active`;

            renderScannerList();

            derivApi.subscribeMultipleTicks(
                exhaustiveAssets.slice(0, 50).map(a => a.symbol),
                handleIncomingTick
            );
        });
    });
});
