// Deploy: supabase functions deploy kakao-auth
// Required Server Secrets (NEVER expose in frontend):
//   KAKAO_REST_API_KEY, KAKAO_CLIENT_SECRET, APP_ORIGIN=https://mango7557-ui.github.io
Deno.serve(async (req: Request) => {
  const origin = Deno.env.get("APP_ORIGIN") ?? "https://mango7557-ui.github.io";
  const headers = {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Headers": "authorization, apikey, content-type",
    "Content-Type": "application/json",
  };
  if (req.method === "OPTIONS") return new Response(null, { headers });
  if (req.method !== "POST")
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers,
    });

  try {
    const { code, redirectUri } = await req.json();
    if (typeof code !== "string" || !code || typeof redirectUri !== "string") {
      return new Response(JSON.stringify({ error: "Invalid authorization payload" }), {
        status: 400,
        headers,
      });
    }
    const restApiKey = Deno.env.get("KAKAO_REST_API_KEY");
    const clientSecret = Deno.env.get("KAKAO_CLIENT_SECRET");
    if (!restApiKey) {
      return new Response(
        JSON.stringify({ error: "KAKAO_REST_API_KEY secret is not configured on server" }),
        { status: 503, headers },
      );
    }

    const body = new URLSearchParams({
      grant_type: "authorization_code",
      client_id: restApiKey,
      redirect_uri: redirectUri,
      code,
      ...(clientSecret ? { client_secret: clientSecret } : {}),
    });

    const tokenRes = await fetch("https://kauth.kakao.com/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded;charset=utf-8" },
      body: body.toString(),
      signal: AbortSignal.timeout(12000),
    });
    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      return new Response(
        JSON.stringify({
          error: tokenData.error_description ?? "Kakao token exchange failed",
        }),
        { status: 401, headers },
      );
    }

    const profileRes = await fetch("https://kapi.kakao.com/v2/user/me", {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/x-www-form-urlencoded;charset=utf-8",
      },
      signal: AbortSignal.timeout(10000),
    });
    const profile = await profileRes.json();
    if (!profileRes.ok || !profile.id) {
      return new Response(JSON.stringify({ error: "Failed to load Kakao profile" }), {
        status: 502,
        headers,
      });
    }

    return new Response(
      JSON.stringify({
        kakaoId: String(profile.id),
        nickname:
          profile.kakao_account?.profile?.nickname ??
          profile.properties?.nickname ??
          "카카오 회원",
        email: profile.kakao_account?.email ?? undefined,
      }),
      { headers },
    );
  } catch {
    return new Response(JSON.stringify({ error: "Kakao authentication unavailable" }), {
      status: 502,
      headers,
    });
  }
});
