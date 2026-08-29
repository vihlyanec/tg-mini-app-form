const jsonHeaders = (origin) => ({
  "Content-Type": "application/json; charset=utf-8",
  "Access-Control-Allow-Origin": origin,
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
});

function parseInitData(initData) {
  if (!initData) return {};

  const params = new URLSearchParams(initData);
  const user = params.get("user");

  if (!user) return {};

  try {
    return JSON.parse(user);
  } catch {
    return {};
  }
}

function getAllowedOrigin(request, env) {
  const origin = request.headers.get("Origin") ?? "";
  const allowed = env.ALLOWED_ORIGIN;

  if (!origin || !allowed) return allowed || "*";

  return origin === allowed || origin === `${allowed}/tg-mini-app-form`
    ? origin
    : allowed;
}

function requireText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default {
  async fetch(request, env) {
    const origin = getAllowedOrigin(request, env);

    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: jsonHeaders(origin) });
    }

    if (request.method !== "POST") {
      return Response.json(
        { ok: false, error: "Method not allowed" },
        { status: 405, headers: jsonHeaders(origin) },
      );
    }

    let body;

    try {
      body = await request.json();
    } catch {
      return Response.json(
        { ok: false, error: "Invalid JSON" },
        { status: 400, headers: jsonHeaders(origin) },
      );
    }

    const telegramUser = parseInitData(body.initData);
    const userId = String(body.telegramUser?.id ?? telegramUser.id ?? "").trim();

    if (!userId) {
      return Response.json(
        { ok: false, error: "Telegram user_id is required" },
        { status: 400, headers: jsonHeaders(origin) },
      );
    }

    const answers = body.answers ?? {};
    const contacts = body.contacts ?? {};
    const salebotBody = new URLSearchParams({
      message: env.SALEBOT_MESSAGE,
      user_id: userId,
      group_id: env.SALEBOT_GROUP_ID,
      resume_bot: "True",
      name: requireText(contacts.name),
      email: requireText(contacts.email),
      phone: requireText(contacts.phone),
      tattoo_experience: requireText(answers.experience),
      tattoo_goal: requireText(answers.goal),
      learning_priority: requireText(answers.learningPriority),
      wow_result_4_months: requireText(answers.wowResult),
      telegram_user_id: userId,
      telegram_first_name: requireText(body.telegramUser?.first_name ?? telegramUser.first_name),
      telegram_last_name: requireText(body.telegramUser?.last_name ?? telegramUser.last_name),
      telegram_username: requireText(body.telegramUser?.username ?? telegramUser.username),
      write_access: requireText(body.writeAccess),
      submitted_at: requireText(body.submittedAt),
    });

    const salebotUrl = `https://chatter.salebot.pro/api/${env.SALEBOT_API_KEY}/tg_callback`;
    const salebotResponse = await fetch(salebotUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=utf-8",
      },
      body: salebotBody,
    });

    if (!salebotResponse.ok) {
      return Response.json(
        { ok: false, error: "Salebot request failed" },
        { status: 502, headers: jsonHeaders(origin) },
      );
    }

    return Response.json(
      { ok: true },
      { status: 200, headers: jsonHeaders(origin) },
    );
  },
};
