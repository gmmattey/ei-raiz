const API_BASE_URL = process.env.EI_API_URL || "http://127.0.0.1:8787";
const ADMIN_TOKEN = process.env.EI_ADMIN_TOKEN;

if (!ADMIN_TOKEN) {
  console.error("Defina EI_ADMIN_TOKEN para executar o reset da massa de teste.");
  process.exit(1);
}

const response = await fetch(`${API_BASE_URL}/api/admin/test-data/reset`, {
  method: "POST",
  headers: {
    "content-type": "application/json",
    "x-admin-token": ADMIN_TOKEN,
  },
  body: "{}",
});

const payload = await response.json().catch(() => ({}));
if (!response.ok || !payload?.ok) {
  console.error("Falha no reset da massa de teste:", payload);
  process.exit(1);
}

console.log("Massa de teste resetada:", payload.dados);
