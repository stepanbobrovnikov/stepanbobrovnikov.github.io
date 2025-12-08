function normalizeBaseUrl(base) {
  if (!base) return "";
  return base
    .trim()
    // убираем случайно дописанные /leaderboard или /api/leaderboard
    .replace(/\/(leaderboard|api\/leaderboard)\/?$/i, "")
    // убираем хвостовые слеши
    .replace(/\/+$/, "");
}

async function fetchLeaderboard() {
  const statusEl = document.getElementById("updateStatus");
  const tableBody = document.querySelector("#leaderboardTable tbody");

  if (!statusEl || !tableBody) {
    console.error("Нет нужных элементов на странице");
    return;
  }

  const base = normalizeBaseUrl(window.BACKEND_BASE_URL || "");
  if (!base) {
    statusEl.textContent = "BACKEND_BASE_URL не задан";
    console.error("BACKEND_BASE_URL не задан");
    return;
  }

  const url = `${base}/leaderboard`;
  console.log("fetchLeaderboard → URL:", url);

  statusEl.textContent = "Loading...";

  try {
    const res = await fetch(url, {
      headers: {
        // говорим, что ждём JSON
        "Accept": "application/json",
        // говорим ngrok не показывать HTML-страницу-предупреждение
        "ngrok-skip-browser-warning": "1",
      },
    });

    console.log("fetchLeaderboard → status:", res.status, res.statusText);

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    console.log("fetchLeaderboard → content-type:", contentType);
    console.log("fetchLeaderboard → body preview:", text.slice(0, 200));

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      throw new Error("Ответ бэкенда не JSON, см. превью выше");
    }

    if (!Array.isArray(data)) {
      throw new Error("Неверный формат данных: ожидается массив");
    }

    tableBody.innerHTML = "";

    if (data.length === 0) {
      statusEl.textContent = "No participants yet";
      return;
    }

    data.forEach((row) => {
      const tr = document.createElement("tr");

      const rankTd = document.createElement("td");
      rankTd.className = "rank-cell";
      rankTd.textContent = row.rank;
      tr.appendChild(rankTd);

      const traderTd = document.createElement("td");
      traderTd.className = "trader-cell";
      const nameSpan = document.createElement("span");
      nameSpan.className = "trader-name";
      nameSpan.textContent = row.display_name;
      const linkA = document.createElement("a");
      linkA.className = "trader-link";
      linkA.href = row.polymarket_profile_url;
      linkA.target = "_blank";
      linkA.rel = "noopener noreferrer";
      linkA.textContent = row.address;
      traderTd.appendChild(nameSpan);
      traderTd.appendChild(linkA);
      tr.appendChild(traderTd);

      const portfolioTd = document.createElement("td");
      portfolioTd.textContent = `$${row.portfolio_value.toFixed(2)}`;
      tr.appendChild(portfolioTd);

      const realizedTd = document.createElement("td");
      realizedTd.textContent = `$${row.pnl_realized.toFixed(2)}`;
      if (row.pnl_realized > 0) {
        realizedTd.classList.add("number-positive");
      } else if (row.pnl_realized < 0) {
        realizedTd.classList.add("number-negative");
      }
      tr.appendChild(realizedTd);

      const unrealizedTd = document.createElement("td");
      unrealizedTd.textContent = `$${row.pnl_unrealized.toFixed(2)}`;
      if (row.pnl_unrealized > 0) {
        unrealizedTd.classList.add("number-positive");
      } else if (row.pnl_unrealized < 0) {
        unrealizedTd.classList.add("number-negative");
      }
      tr.appendChild(unrealizedTd);

      const flagsTd = document.createElement("td");
      flagsTd.className = "flags-cell";

      if (row.flags.large_deposit) {
        const el = document.createElement("span");
        el.className = "flag-icon flag-deposit";
        el.textContent = "H";
        el.title = "Суммарный депозит более 100$";
        flagsTd.appendChild(el);
      }

      if (row.flags.has_withdrawals) {
        const el = document.createElement("span");
        el.className = "flag-icon flag-withdraw";
        el.textContent = "L";
        el.title = "Низкий стартовый баланс";
        flagsTd.appendChild(el);
      }

      if (row.flags.non_fresh) {
        const el = document.createElement("span");
        el.className = "flag-icon flag-nonfresh";
        el.textContent = "O";
        el.title = "Старый кошелек";
        flagsTd.appendChild(el);
      }

      tr.appendChild(flagsTd);
      tableBody.appendChild(tr);
    });

    const now = new Date();
    statusEl.textContent = `Updated at ${now.toLocaleTimeString()}`;
  } catch (e) {
    console.error("fetchLeaderboard error:", e);
    statusEl.textContent = "Error loading leaderboard";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log(
    "main.js loaded, normalized base =",
    normalizeBaseUrl(window.BACKEND_BASE_URL || "")
  );
  fetchLeaderboard();
  setInterval(fetchLeaderboard, 60000);
});
