/** Only public configuration is compiled into the client. Never put service-role or payment secrets here. */
export const serviceConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, ""),
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
  kakaoJsKey: (import.meta.env.VITE_KAKAO_JS_KEY ?? "").trim(),
};
export const authConfigured =
  !!serviceConfig.supabaseUrl && !!serviceConfig.supabaseKey;
export const kakaoConfigured = !!serviceConfig.kakaoJsKey;
export interface AuthSession {
  access_token: string;
  refresh_token: string;
  expires_at?: number;
  expires_in?: number;
  user: { id: string; email?: string; user_metadata?: { name?: string } };
}
const SESSION_KEY = "seongsu-auth-session";
export function readSession(): AuthSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(SESSION_KEY) ?? "null");
  } catch {
    return null;
  }
}
export function saveSession(value: AuthSession | null) {
  if (value) sessionStorage.setItem(SESSION_KEY, JSON.stringify(value));
  else sessionStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event("seongsu-auth"));
}
async function authRequest(path: string, body?: unknown, token?: string) {
  if (!authConfigured)
    throw new Error(
      "회원 인증 서버가 연결되지 않았습니다. 관리자 → API 연결에서 필요한 설정을 확인하세요.",
    );
  const response = await fetch(`${serviceConfig.supabaseUrl}/auth/v1/${path}`, {
    method: body === undefined ? "GET" : "POST",
    headers: {
      apikey: serviceConfig.supabaseKey,
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    signal: AbortSignal.timeout(15000),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      data.msg ??
        data.error_description ??
        data.message ??
        `인증 요청 실패 (${response.status})`,
    );
  return data;
}
export async function signUp(email: string, password: string, name: string) {
  return authRequest("signup", {
    email,
    password,
    data: { name },
    gotrue_meta_security: {},
  });
}
export async function signIn(email: string, password: string) {
  const data: AuthSession = await authRequest("token?grant_type=password", {
    email,
    password,
  });
  data.expires_at = Date.now() + (data.expires_in ?? 3600) * 1000;
  saveSession(data);
  return data;
}
export async function currentSession() {
  let session = readSession();
  if (!session) return null;
  if (session.expires_at && session.expires_at < Date.now() + 60000) {
    session = await authRequest("token?grant_type=refresh_token", {
      refresh_token: session.refresh_token,
    });
    session!.expires_at = Date.now() + (session!.expires_in ?? 3600) * 1000;
    saveSession(session);
  }
  return session;
}
export async function signOut() {
  const s = readSession();
  try {
    if (s && authConfigured) await authRequest("logout", {}, s.access_token);
  } finally {
    saveSession(null);
  }
}
export async function recoverPassword(email: string) {
  return authRequest("recover", { email });
}
export async function checkAuthConnection() {
  await authRequest("settings");
  return "Supabase 인증 API 응답 확인";
}
export async function getServerRole() {
  const s = await currentSession();
  if (!s) return null;
  const response = await fetch(
    `${serviceConfig.supabaseUrl}/rest/v1/profiles?select=role&id=eq.${encodeURIComponent(s.user.id)}`,
    {
      headers: {
        apikey: serviceConfig.supabaseKey,
        Authorization: `Bearer ${s.access_token}`,
      },
      signal: AbortSignal.timeout(10000),
    },
  );
  if (!response.ok) throw new Error("서버 권한을 확인할 수 없습니다.");
  const rows = await response.json();
  return rows[0]?.role ?? "customer";
}
export async function translateWithServer(original: string, target: string) {
  const session = await currentSession();
  if (!session || !authConfigured) throw new Error("실시간 번역 서버 미연결");
  const response = await fetch(
    `${serviceConfig.supabaseUrl}/functions/v1/translate`,
    {
      method: "POST",
      headers: {
        apikey: serviceConfig.supabaseKey,
        Authorization: `Bearer ${session.access_token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: original, target }),
      signal: AbortSignal.timeout(20000),
    },
  );
  const data = await response.json();
  if (!response.ok || typeof data.translation !== "string")
    throw new Error(data.error ?? "번역 요청 실패");
  return data.translation as string;
}
export interface AddressResult {
  address: string;
  zonecode: string;
}
export interface KakaoVerifiedSession {
  kakaoId: string;
  nickname: string;
  email?: string;
  verifiedAt: string;
}
const KAKAO_SESSION_KEY = "seongsu-kakao-verified";
const KAKAO_STATE_KEY = "seongsu-kakao-oauth-state";
export function readKakaoSession(): KakaoVerifiedSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(KAKAO_SESSION_KEY) ?? "null");
  } catch {
    return null;
  }
}
export function clearKakaoSession() {
  sessionStorage.removeItem(KAKAO_SESSION_KEY);
  window.dispatchEvent(new Event("seongsu-auth"));
}
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: AddressResult) => void;
        onclose?: () => void;
      }) => { embed: (container: HTMLElement) => void };
    };
    Kakao?: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Auth: {
        authorize: (options: {
          redirectUri: string;
          state?: string;
          scope?: string;
        }) => void;
      };
      Share: {
        sendDefault: (payload: Record<string, unknown>) => void;
      };
    };
    kakao?: {
      maps?: {
        load: (cb: () => void) => void;
        LatLng: new (lat: number, lng: number) => any;
        Map: new (container: HTMLElement, options: { center: any; level: number }) => any;
        CustomOverlay: new (options: Record<string, unknown>) => any;
      };
    };
  }
}
let kakaoSdkPromise: Promise<void> | null = null;
export function getKakaoRedirectUri() {
  if (location.protocol === "http:" || location.protocol === "https:") {
    return `${location.origin}${location.pathname}`;
  }
  return "https://mango7557-ui.github.io/golmok-golmok/";
}
export function loadKakaoSdk(): Promise<void> {
  if (!kakaoConfigured)
    return Promise.reject(new Error("카카오 JavaScript 키가 설정되지 않았습니다."));
  if (window.Kakao?.isInitialized()) return Promise.resolve();
  if (kakaoSdkPromise) return kakaoSdkPromise;
  kakaoSdkPromise = new Promise((resolve, reject) => {
    const init = () => {
      try {
        if (!window.Kakao) throw new Error("Kakao SDK 객체를 찾을 수 없습니다.");
        if (!window.Kakao.isInitialized()) {
          window.Kakao.init(serviceConfig.kakaoJsKey);
        }
        if (window.Kakao.isInitialized()) resolve();
        else throw new Error("Kakao SDK 초기화 실패");
      } catch (err) {
        kakaoSdkPromise = null;
        reject(err instanceof Error ? err : new Error("Kakao SDK 오류"));
      }
    };
    if (window.Kakao) {
      init();
      return;
    }
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      kakaoSdkPromise = null;
      reject(new Error("카카오 SDK 로드 시간이 초과되었습니다."));
    }, 12000);
    script.src = "https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js";
    script.crossOrigin = "anonymous";
    script.onload = () => {
      clearTimeout(timer);
      init();
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      kakaoSdkPromise = null;
      reject(new Error("카카오 SDK 네트워크 연결 실패"));
    };
    document.head.appendChild(script);
  });
  return kakaoSdkPromise;
}
export async function startKakaoLogin() {
  if (location.protocol === "file:") {
    throw new Error(
      "로컬 파일(file://)에서는 카카오 OAuth 리다이렉트를 사용할 수 없습니다. 배포 링크(https://mango7557-ui.github.io/golmok-golmok/)에서 실행해 주세요.",
    );
  }
  await loadKakaoSdk();
  const state = crypto.randomUUID();
  sessionStorage.setItem(KAKAO_STATE_KEY, state);
  window.Kakao!.Auth.authorize({
    redirectUri: getKakaoRedirectUri(),
    state,
  });
}
export async function consumeKakaoRedirect(): Promise<{
  notice?: string;
  error?: string;
} | null> {
  const params = new URLSearchParams(location.search);
  const code = params.get("code");
  const error = params.get("error");
  const errorDesc = params.get("error_description");
  const returnedState = params.get("state");
  if (!code && !error) return null;

  params.delete("code");
  params.delete("error");
  params.delete("error_description");
  params.delete("state");
  const cleanSearch = params.toString();
  history.replaceState(
    null,
    "",
    `${location.pathname}${cleanSearch ? `?${cleanSearch}` : ""}${location.hash}`,
  );

  if (error) {
    return {
      error: `카카오 인증 취소/오류: ${errorDesc ?? error}`,
    };
  }
  const expectedState = sessionStorage.getItem(KAKAO_STATE_KEY);
  sessionStorage.removeItem(KAKAO_STATE_KEY);
  if (!expectedState || expectedState !== returnedState) {
    return { error: "카카오 OAuth 보안 상태(state) 검증에 실패했습니다. 다시 시도해 주세요." };
  }
  if (!serviceConfig.supabaseUrl) {
    return {
      notice:
        "카카오 인가 코드 수신 확인! 실제 토큰 교환을 완료하려면 Client Secret이 저장된 서버(supabase/functions/kakao-auth) 연결이 필요합니다.",
    };
  }
  try {
    const res = await fetch(
      `${serviceConfig.supabaseUrl}/functions/v1/kakao-auth`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(serviceConfig.supabaseKey
            ? { apikey: serviceConfig.supabaseKey }
            : {}),
        },
        body: JSON.stringify({ code, redirectUri: getKakaoRedirectUri() }),
        signal: AbortSignal.timeout(15000),
      },
    );
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.kakaoId) {
      return {
        error:
          data.error ??
          `카카오 토큰 교환 실패 (${res.status}) · 서버 KAKAO_REST_API_KEY / Redirect URI 설정을 확인하세요.`,
      };
    }
    const verified: KakaoVerifiedSession = {
      kakaoId: data.kakaoId,
      nickname: data.nickname,
      email: data.email,
      verifiedAt: new Date().toISOString(),
    };
    sessionStorage.setItem(KAKAO_SESSION_KEY, JSON.stringify(verified));
    window.dispatchEvent(new Event("seongsu-auth"));
    return { notice: `${verified.nickname}님, 카카오 인증이 완료되었습니다.` };
  } catch {
    return {
      error:
        "카카오 토큰 교환 서버에 연결하지 못했습니다. supabase/functions/kakao-auth 배포 상태를 확인하세요.",
    };
  }
}
export async function shareStoreViaKakao(info: {
  title: string;
  description: string;
  url: string;
  imageUrl: string;
}) {
  await loadKakaoSdk();
  window.Kakao!.Share.sendDefault({
    objectType: "feed",
    content: {
      title: info.title,
      description: info.description,
      imageUrl: info.imageUrl,
      link: { mobileWebUrl: info.url, webUrl: info.url },
    },
    buttons: [
      {
        title: "성수역 골목형 상점가 열기",
        link: { mobileWebUrl: info.url, webUrl: info.url },
      },
    ],
  });
}
let kakaoMapPromise: Promise<void> | null = null;
export function loadKakaoMaps(): Promise<void> {
  if (!kakaoConfigured)
    return Promise.reject(new Error("카카오 JavaScript 키가 설정되지 않았습니다."));
  if (window.kakao?.maps?.Map) return Promise.resolve();
  if (kakaoMapPromise) return kakaoMapPromise;
  kakaoMapPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      kakaoMapPromise = null;
      reject(
        new Error(
          "카카오맵 로드 시간 초과 · 카카오 개발자 콘솔에 현재 웹 도메인 등록이 필요합니다.",
        ),
      );
    }, 10000);
    script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${encodeURIComponent(serviceConfig.kakaoJsKey)}&autoload=false`;
    script.onload = () => {
      clearTimeout(timer);
      if (!window.kakao?.maps?.load) {
        kakaoMapPromise = null;
        reject(
          new Error(
            "카카오맵 초기화 불가 · 카카오 개발자 콘솔 [플랫폼 → Web]에 현재 도메인을 등록해 주세요.",
          ),
        );
        return;
      }
      window.kakao.maps.load(() => resolve());
    };
    script.onerror = () => {
      clearTimeout(timer);
      script.remove();
      kakaoMapPromise = null;
      reject(
        new Error(
          `카카오맵 도메인 미등록 또는 네트워크 차단 · 콘솔 [플랫폼 → Web]에 ${location.origin} 등록 필요`,
        ),
      );
    };
    document.head.appendChild(script);
  });
  return kakaoMapPromise;
}
export async function checkKakaoConnection() {
  await loadKakaoSdk();
  return `카카오 JS SDK v2.7.4 초기화 완료 · Redirect URI: ${getKakaoRedirectUri()}`;
}
let postcodeScript: Promise<void> | null = null;
export function loadPostcode(): Promise<void> {
  if (window.daum?.Postcode) return Promise.resolve();
  if (postcodeScript) return postcodeScript;
  postcodeScript = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    const timer = setTimeout(() => {
      script.remove();
      postcodeScript = null;
      reject(new Error("주소 검색을 불러오지 못했습니다. 직접 입력해 주세요."));
    }, 12000);
    script.src =
      "https://t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js";
    script.onload = () => {
      clearTimeout(timer);
      if (window.daum?.Postcode) resolve();
      else {
        postcodeScript = null;
        reject(new Error("주소 검색 SDK 오류"));
      }
    };
    script.onerror = () => {
      clearTimeout(timer);
      postcodeScript = null;
      script.remove();
      reject(new Error("주소 검색 연결 실패 · 직접 입력 가능"));
    };
    document.head.appendChild(script);
  });
  return postcodeScript;
}
export const integrationCatalog = [
  {
    id: "map",
    name: "OpenStreetMap",
    category: "지도",
    description:
      "실제 지도 타일 · 드래그 · 확대 · 범위 재검색. 매장 핀은 가상 위치입니다.",
    status: "public",
    needs:
      "출처 표시와 타일 사용 정책 준수. 대규모 서비스 전용 타일 공급자 계약 권장.",
    url: "https://operations.osmfoundation.org/policies/tiles/",
  },
  {
    id: "address",
    name: "Daum 우편번호",
    category: "배송지",
    description: "실제 도로명 주소·우편번호 검색. SDK 로딩 실패 시 직접 입력.",
    status: "public",
    needs: "별도 비밀키 불필요. 주소 검색을 열어 네트워크 연결을 확인합니다.",
    url: "https://postcode.map.daum.net/guide",
  },
  {
    id: "auth",
    name: "Supabase Auth",
    category: "회원가입 / 로그인",
    description: "이메일 가입·로그인·인증 메일·비밀번호 재설정 어댑터 구현.",
    status: authConfigured ? "configured" : "pending",
    needs:
      "Supabase 프로젝트 URL + 공개 anon key, 메일 발송 설정과 Redirect URL 등록.",
    url: "https://supabase.com/dashboard",
  },
  {
    id: "db",
    name: "Supabase Database",
    category: "데이터 / 관리자 권한",
    description:
      "회원 프로필·관리자 역할 RLS 스키마 제공. 주문·원장은 현재 로컬 데모.",
    status: "pending",
    needs:
      "프로젝트 생성, supabase/schema.sql 실행, 관리자 계정 역할을 서버에서 지정.",
    url: "https://supabase.com/docs/guides/database",
  },
  {
    id: "kakao",
    name: "Kakao SDK (로그인 · 공유 · 카카오맵)",
    category: "카카오 플랫폼",
    description: kakaoConfigured
      ? "카카오 JS SDK(로그인 인가·카카오톡 공유·카카오맵) 연결 및 서버 토큰 교환 함수(kakao-auth) 준비 완료. 비밀키는 GitHub Secrets로 분리 저장됨."
      : "실제 카카오 로그인은 미연결. 연결 전 인증 완료로 표시하지 않습니다.",
    status: kakaoConfigured ? "configured" : "pending",
    needs:
      "카카오 개발자 콘솔 [플랫폼 → Web]에 https://mango7557-ui.github.io 등록 및 [카카오 로그인 → Redirect URI]에 https://mango7557-ui.github.io/golmok-golmok/ 등록, 토큰 교환 서버 배포.",
    url: "https://developers.kakao.com/console/app",
  },
  {
    id: "payment",
    name: "결제 대행사 (PG)",
    category: "결제 / 환불",
    description: "실결제 비활성 · 모든 주문은 데모 Payment 기록.",
    status: "pending",
    needs:
      "사업자 PG 계약, 테스트/운영 키, 서버 금액 검증·승인·웹훅 구현과 심사.",
    url: "https://developers.tosspayments.com/",
  },
  {
    id: "voucher",
    name: "지역상품권 / 온누리",
    category: "상품권 / 정산",
    description: "데모 잔액만 사용. 실제 상품권 잔액·가맹 검증·정산 미연결.",
    status: "pending",
    needs:
      "상품권 운영기관 계약·가맹점 등록·공식 연동 권한. 타 지역 사용 가능 여부를 임의 인정하지 않습니다.",
    url: "https://www.sbiz.or.kr/",
  },
  {
    id: "translation",
    name: "OpenAI 번역",
    category: "다국어 채팅",
    description:
      "인증된 서버 번역 함수 제공. 미연결 시 기존 샘플 사전과 원문 전달.",
    status: "pending",
    needs:
      "Supabase Edge Function 배포 + 서버 OPENAI_API_KEY 설정. 프론트엔드 키 입력 금지.",
    url: "https://platform.openai.com/api-keys",
  },
  {
    id: "shipping",
    name: "택배사 / 배송 추적",
    category: "택배 주문",
    description: "현재 DEMO 운송장. 실제 집하 예약·운송장 조회 미연결.",
    status: "pending",
    needs: "택배 계약, 발송자 정보, 운송장 발급·추적 API 권한.",
    url: "https://tracker.delivery/",
  },
  {
    id: "push",
    name: "알림 / 실시간 주문",
    category: "매장 접수",
    description:
      "현재 브라우저 내 점주·고객 상태 공유. 실제 매장에 전송되지 않습니다.",
    status: "pending",
    needs: "서버 주문 저장·Realtime 구독·매장 단말 인증·알림 서비스 자격 증명.",
    url: "https://supabase.com/docs/guides/realtime",
  },
] as const;
