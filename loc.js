const LOC_API = "https://ir0-loc.onrender.com/api/loc";
const STORAGE_KEY = "lastLOC";
const ONE_DAY_MS = 300;

// Función para actualizar el display con innerHTML
function updateDisplay(value) {
    const el = document.getElementById("loc");
    if (el) {
        const isEnglish = document.documentElement.lang === 'en' || window.location.pathname.includes('index_en');
        if (isEnglish) {
            el.innerHTML = `The kernel currently has <strong>${value.toLocaleString()}</strong> lines of code.`;
        } else {
            el.innerHTML = `El kernel actualmente tiene <strong>${value.toLocaleString()}</strong> líneas de código.`;
        }
    }
}

// Función para pedir el LOC desde la API
async function fetchLOC() {
    try {
        const res = await fetch(LOC_API);
        if (!res.ok) throw new Error("Error HTTP " + res.status);
        const data = await res.json();
        if (typeof data.loc === "number") {
            localStorage.setItem(STORAGE_KEY, data.loc);
            updateDisplay(data.loc);
        } else {
            throw new Error("Respuesta inválida");
        }
    } catch (e) {
        console.warn("No se pudo obtener LOC, usando último valor guardado:", e);
        const last = localStorage.getItem(STORAGE_KEY);
        if (last) updateDisplay(Number(last));
        else updateDisplay("desconocido");
    }
}

// Ejecutar al cargar la página
fetchLOC();

// Agregar refresh automático cada 24h
setInterval(fetchLOC, ONE_DAY_MS);
