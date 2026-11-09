/** Only public configuration is compiled into the client. Never put service-role or payment secrets here. */
export const serviceConfig = {
  supabaseUrl: (import.meta.env.VITE_SUPABASE_URL ?? "").replace(/\/$/, ""),
  supabaseKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
};
export const authConfigured =
  !!serviceConfig.supabaseUrl && !!serviceConfig.supabaseKey;
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
declare global {
  interface Window {
    daum?: {
      Postcode: new (options: {
        oncomplete: (data: AddressResult) => void;
        onclose?: () => void;
      }) => { embed: (container: HTMLElement) => void };
    };
  }
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
    name: "Kakao Login",
    category: "간편 로그인",
    description:
      "실제 카카오 로그인은 미연결. 연결 전 인증 완료로 표시하지 않습니다.",
    status: "pending",
    needs:
      "카카오 개발자 앱, 비즈앱 설정, Redirect URI, Supabase OAuth 제공자 설정.",
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
