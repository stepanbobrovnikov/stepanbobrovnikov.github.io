async function fetchLeaderboard() {
  const statusEl = document.getElementById("updateStatus");
  const tableBody = document.querySelector("#leaderboardTable tbody");

  if (!window.BACKEND_BASE_URL) {
    console.error("BACKEND_BASE_URL is not defined");
    if (statusEl) statusEl.textContent = "BACKEND_BASE_URL is not defined";
    return;
  }

  const url = `${window.BACKEND_BASE_URL}/leaderboard`;
  console.log("Fetching leaderboard from:", url);

  if (statusEl) statusEl.textContent = "Loading...";

  try {
    const res = await fetch(url);

    console.log("Response status:", res.status, res.statusText);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    const contentType = res.headers.get("content-type") || "";
    const text = await res.text();

    if (!contentType.includes("application/json")) {
      console.error("Unexpected content-type:", contentType);
      console.error("Response starts with:", text.slice(0, 200));
      throw new Error("Backend returned non-JSON response");
    }

    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      console.error("JSON parse error:", e);
      console.error("Raw text:", text.slice(0, 200));
      throw new Error("Failed to parse JSON from backend");
    }

    if (!Array.isArray(data)) {
      console.error("Unexpected data format:", data);
      throw new Error("Backend returned non-array JSON");
    }

    tableBody.innerHTML = "";

    if (data.length === 0) {
      if (statusEl) statusEl.textContent = "No participants yet";
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
        el.textContent = "D";
        el.title = "Суммарные депозиты на Polymarket > 110 USDC.e";
        flagsTd.appendChild(el);
      }

      if (row.flags.has_withdrawals) {
        const el = document.createElement("span");
        el.className = "flag-icon flag-withdraw";
        el.textContent = "W";
        el.title = "Есть выводы средств с кошелька";
        flagsTd.appendChild(el);
      }

      if (row.flags.non_fresh) {
        const el = document.createElement("span");
        el.className = "flag-icon flag-nonfresh";
        el.textContent = "F";
        el.title = "Не-фреш кошелёк: > 5 транзакций пополнения/вывода";
        flagsTd.appendChild(el);
      }

      tr.appendChild(flagsTd);

      tableBody.appendChild(tr);
    });

    const now = new Date();
    if (statusEl) statusEl.textContent = `Updated at ${now.toLocaleTimeString()}`;
  } catch (e) {
    console.error("fetchLeaderboard error:", e);
    if (statusEl) statusEl.textContent = "Error loading leaderboard";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  console.log("main.js loaded, BACKEND_BASE_URL =", window.BACKEND_BASE_URL);
  fetchLeaderboard();
  setInterval(fetchLeaderboard, 60000);
});
