const LOC_API = "https://ir0-loc.onrender.com/api/loc";
const STORAGE_KEY = "lastLOC";
const ONE_DAY_MS = 60 * 1000; 

// ✅ Actualiza el display con innerHTML bilingüe
function updateDisplay(value) {
    const el = document.getElementById("loc");
    if (!el) return;

    const isEnglish =
        document.documentElement.lang === "en" ||
        window.location.pathname.includes("index_en");

    const locValue = isNaN(value) ? "unknown" : value.toLocaleString();

    if (isEnglish) {
        el.innerHTML = `The kernel currently has <strong>${locValue}</strong> lines of code.`;
    } else {
        el.innerHTML = `El kernel actualmente tiene <strong>${locValue}</strong> líneas de código.`;
    }
}

// ✅ Pide el LOC desde la API y actualiza solo si es válido y distinto de cero
async function fetchLOC() {
    try {
        const res = await fetch(LOC_API, { cache: "no-store" });
        if (!res.ok) throw new Error("Error HTTP " + res.status);

        const data = await res.json();
        const newLoc = data?.loc;

        // ⚠️ Si Render devuelve 0 (por reset del loc.json), no sobrescribimos
        if (typeof newLoc === "number" && newLoc > 0) {
            const payload = { value: newLoc, timestamp: Date.now() };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
            updateDisplay(newLoc);
        } else {
            console.warn("LOC inválido o cero, manteniendo el último guardado");
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const { value } = JSON.parse(saved);
                updateDisplay(value);
            } else {
                updateDisplay("desconocido");
            }
        }
    } catch (e) {
        console.warn("Error al obtener LOC:", e);
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const { value } = JSON.parse(saved);
            updateDisplay(value);
        } else {
            updateDisplay("desconocido");
        }
    }
}

// ✅ Inicializa mostrando el último valor conocido
(function init() {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
        const { value } = JSON.parse(saved);
        updateDisplay(value);
    } else {
        updateDisplay("...");
    }

    fetchLOC();
    setInterval(fetchLOC, ONE_DAY_MS);
})();
