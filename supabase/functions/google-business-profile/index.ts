// Supabase Edge Function - Google Business Profile (avaliacoes)
// Deploy: supabase functions deploy google-business-profile

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const RATING_MAP: Record<string, number> = {
  STAR_RATING_UNSPECIFIED: 0,
  STAR_RATING_ONE: 1,
  STAR_RATING_TWO: 2,
  STAR_RATING_THREE: 3,
  STAR_RATING_FOUR: 4,
  STAR_RATING_FIVE: 5,
};

const getEnv = (name: string) => {
  const value = Deno.env.get(name);
  if (!value) {
    throw new Error(`Variavel de ambiente ausente: ${name}`);
  }
  return value;
};

const buildAuthUrl = () => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI");
  const scope = "https://www.googleapis.com/auth/business.manage";
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    scope,
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
};

const exchangeCodeForTokens = async (code: string) => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");
  const redirectUri = getEnv("GOOGLE_REDIRECT_URI");

  const body = new URLSearchParams({
    code,
    client_id: clientId,
    client_secret: clientSecret,
    redirect_uri: redirectUri,
    grant_type: "authorization_code",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Erro no OAuth: ${await response.text()}`);
  }

  return response.json();
};

const getAccessToken = async () => {
  const clientId = getEnv("GOOGLE_CLIENT_ID");
  const clientSecret = getEnv("GOOGLE_CLIENT_SECRET");
  const refreshToken = getEnv("GOOGLE_REFRESH_TOKEN");

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    refresh_token: refreshToken,
    grant_type: "refresh_token",
  });

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!response.ok) {
    throw new Error(`Erro ao renovar token: ${await response.text()}`);
  }

  const data = await response.json();
  return data.access_token as string;
};

const fetchAccounts = async (accessToken: string) => {
  const response = await fetch("https://mybusinessaccountmanagement.googleapis.com/v1/accounts", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!response.ok) {
    throw new Error(`Erro ao buscar contas: ${await response.text()}`);
  }

  return response.json();
};

const fetchLocations = async (accessToken: string, accountId: string) => {
  const params = new URLSearchParams({
    readMask: "name,title,storefrontAddress,metadata",
  });
  const response = await fetch(
    `https://mybusinessbusinessinformation.googleapis.com/v1/accounts/${accountId}/locations?${params.toString()}`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar locais: ${await response.text()}`);
  }

  return response.json();
};

const fetchReviews = async (accessToken: string, accountId: string, locationId: string) => {
  const response = await fetch(
    `https://businessprofile.googleapis.com/v1/accounts/${accountId}/locations/${locationId}/reviews?pageSize=20`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  );

  if (!response.ok) {
    throw new Error(`Erro ao buscar avaliacoes: ${await response.text()}`);
  }

  return response.json();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "reviews";

    if (action === "auth") {
      const authUrl = buildAuthUrl();
      return new Response(JSON.stringify({ authUrl }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "callback") {
      const code = url.searchParams.get("code");
      if (!code) {
        return new Response(JSON.stringify({ error: "Codigo OAuth ausente." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        });
      }

      const tokens = await exchangeCodeForTokens(code);
      return new Response(JSON.stringify(tokens), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = await getAccessToken();

    if (action === "accounts") {
      const data = await fetchAccounts(accessToken);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "locations") {
      const accountId = url.searchParams.get("accountId") || getEnv("GBP_ACCOUNT_ID");
      const data = await fetchLocations(accessToken, accountId);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accountId = getEnv("GBP_ACCOUNT_ID");
    const locationId = getEnv("GBP_LOCATION_ID");
    const data = await fetchReviews(accessToken, accountId, locationId);

    const reviews = (data.reviews || []).map((review: any) => {
      const rating = RATING_MAP[review.starRating] ?? 0;
      const name = review.reviewer?.displayName || "Cliente WG";
      return {
        id: review.reviewId,
        name,
        rating,
        date: review.updateTime || review.createTime,
        text: review.comment || "",
        avatar: name.trim().slice(0, 1).toUpperCase(),
      };
    });

    const reviewCount = reviews.length;
    const averageRating = reviewCount
      ? Number(
          (reviews.reduce((sum: number, review: any) => sum + (review.rating || 0), 0) / reviewCount).toFixed(2)
        )
      : 0;

    return new Response(
      JSON.stringify({
        reviews,
        reviewCount,
        averageRating,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Erro na funcao google-business-profile:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
