import { useEffect, useState } from "react";
import {
  ArrowRight,
  Check,
  Heart,
  Mail,
  MapPin,
  ShieldCheck,
  UserRound,
  LogOut,
  ArrowLeft,
  MessageCircle,
  Copy,
} from "lucide-react";
import { useApp } from "./context";
import {
  authConfigured,
  kakaoConfigured,
  getKakaoRedirectUri,
  startKakaoLogin,
  readKakaoSession,
  clearKakaoSession,
  readSession,
  signIn,
  signOut,
  signUp,
  recoverPassword,
} from "./services";
export interface DemoMember {
  name: string;
  interests: string[];
  joinedAt: string;
}
export const MEMBER_KEY = "seongsu-demo-member-v1";
export function readMember(): DemoMember | null {
  try {
    return JSON.parse(localStorage.getItem(MEMBER_KEY) ?? "null");
  } catch {
    return null;
  }
}
export function AccountScreen({ onAdmin }: { onAdmin: () => void }) {
  const { tx, setTab, toast } = useApp();
  const [screen, setScreen] = useState<"signup" | "login" | "recover">(
    "signup",
  );
  const [member, setMember] = useState(readMember);
  const [session, setSession] = useState(readSession);
  const [kakaoSession, setKakaoSession] = useState(readKakaoSession);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [terms, setTerms] = useState(false);
  const [privacy, setPrivacy] = useState(false);
  const [interests, setInterests] = useState<string[]>(["카페"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const fn = () => {
      setSession(readSession());
      setKakaoSession(readKakaoSession());
    };
    window.addEventListener("seongsu-auth", fn);
    return () => window.removeEventListener("seongsu-auth", fn);
  }, []);
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);
    try {
      if (!authConfigured) {
        if (!name.trim() || !terms || !privacy)
          throw new Error("닉네임과 필수 확인 항목을 입력해 주세요.");
        const value = {
          name: name.trim(),
          interests,
          joinedAt: new Date().toISOString(),
        };
        localStorage.setItem(MEMBER_KEY, JSON.stringify(value));
        setMember(value);
        toast("체험 프로필이 만들어졌습니다.");
      } else if (screen === "recover") {
        await recoverPassword(email);
        setNotice("계정이 존재하면 비밀번호 재설정 메일이 발송됩니다.");
      } else if (screen === "login") {
        await signIn(email, password);
        setSession(readSession());
        toast("로그인되었습니다.");
      } else {
        if (!terms || !privacy)
          throw new Error("서비스 이용 및 개인정보 처리 동의를 확인해 주세요.");
        await signUp(email, password, name);
        setNotice(
          "가입 요청을 보냈습니다. 받은 인증 메일에서 이메일을 확인한 후 로그인하세요.",
        );
        setPassword("");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "요청을 처리하지 못했습니다.");
    } finally {
      setBusy(false);
    }
  }
  const title = tx([
    "골목과 더 가까워지는 시작",
    "Your neighborhood starts here",
    "与小巷更亲近的开始",
    "路地ともっと近くなる",
  ]);
  return (
    <div className="account-page">
      <button className="back-link" onClick={() => setTab("map")}>
        <ArrowLeft size={16} />
        {tx(["지도로 돌아가기", "Back to explore", "返回地图", "地図に戻る"])}
      </button>
      <div className="account-shell">
        <aside className="account-story">
          <span className="editorial-label">SEONGSU ALLEY MARKET</span>
          <div>
            <span className="story-number">01 / YOUR LOCAL LIFE</span>
            <h1>{title}</h1>
            <p>
              {tx([
                "좋아하는 가게를 단골로, 작은 발견을 나만의 일상으로. 성수에서 당신의 취향을 만나보세요.",
                "Find your favorites. Make little discoveries part of everyday life.",
                "收藏心仪店铺，让小发现走进日常。",
                "お気に入りのお店と、小さな発見のある毎日を。",
              ])}
            </p>
          </div>
          <div className="story-perks">
            <span>
              <Heart size={18} />
              {tx([
                "나만의 단골 매장",
                "Your favorite places",
                "我的常去店铺",
                "行きつけの店",
              ])}
            </span>
            <span>
              <MapPin size={18} />
              {tx([
                "골목 탐험과 미션",
                "Neighborhood missions",
                "小巷探索任务",
                "路地探検ミッション",
              ])}
            </span>
            <span>
              <ShieldCheck size={18} />
              {tx([
                "한눈에 보는 주문과 혜택",
                "Orders and perks together",
                "订单优惠一览",
                "注文と特典を一覧",
              ])}
            </span>
          </div>
          <span className="story-bottom">SMALL STREETS. BIG DISCOVERIES.</span>
        </aside>
        <section className="account-form-panel">
          {member || session || kakaoSession ? (
            <div className="member-complete">
              <div className="member-emblem">
                <UserRound size={38} />
              </div>
              <span className="editorial-label">
                WELCOME TO THE NEIGHBORHOOD
              </span>
              <h2>
                {kakaoSession?.nickname ??
                  session?.user.user_metadata?.name ??
                  member?.name ??
                  session?.user.email}
                님,
                <br />
                반가워요.
              </h2>
              <p>
                {kakaoSession
                  ? `카카오 인증 완료 계정입니다 (${kakaoSession.email ?? `ID #${kakaoSession.kakaoId}`}).`
                  : session
                    ? "인증 서버에 로그인된 계정입니다."
                    : "이 브라우저에 저장된 체험 프로필입니다. 실제 회원가입·본인인증은 수행되지 않았습니다."}
              </p>
              {member && (
                <div className="interest-tags">
                  {member.interests.map((i) => (
                    <span key={i}>{i}</span>
                  ))}
                </div>
              )}
              <button className="primary full" onClick={() => setTab("my")}>
                나의 혜택 보기 <ArrowRight size={17} />
              </button>
              <button
                className="secondary full"
                onClick={async () => {
                  try {
                    if (kakaoSession) clearKakaoSession();
                    else if (session) await signOut();
                    else localStorage.removeItem(MEMBER_KEY);
                    setKakaoSession(null);
                    setSession(null);
                    setMember(null);
                  } catch (e) {
                    setError(String(e));
                  }
                }}
              >
                <LogOut size={16} />
                {kakaoSession || session ? "로그아웃" : "체험 프로필 지우기"}
              </button>
            </div>
          ) : (
            <>
              <span className="editorial-label">
                {authConfigured ? "MEMBERSHIP" : "PREVIEW MEMBERSHIP"}
              </span>
              <h2>
                {!authConfigured
                  ? tx(["가입 체험", "Try membership", "体验加入", "会員体験"])
                  : screen === "login"
                    ? "로그인"
                    : screen === "recover"
                      ? "비밀번호 재설정"
                      : "회원가입"}
              </h2>
              <p className="form-intro">
                {authConfigured
                  ? "이메일 인증을 통해 안전하게 시작하세요."
                  : tx([
                      "닉네임만으로 먼저 둘러보세요. 인증 서버가 연결되기 전까지 이메일·비밀번호를 수집하지 않습니다.",
                      "Start with a nickname. Email and password are not collected until authentication is configured.",
                      "先用昵称体验，认证服务器连接前不收集邮箱和密码。",
                      "ニックネームで体験。認証サーバー接続まではメール・パスワードを収集しません。",
                    ])}
              </p>
              <form onSubmit={submit}>
                {(!authConfigured || screen === "signup") && (
                  <label className="field">
                    <span>닉네임</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      minLength={2}
                      maxLength={30}
                      required
                      placeholder="골목에서 불리고 싶은 이름"
                      autoComplete="nickname"
                    />
                  </label>
                )}
                {authConfigured && (
                  <>
                    <label className="field">
                      <span>이메일</span>
                      <input
                        type="email"
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        placeholder="you@example.com"
                      />
                    </label>
                    {screen !== "recover" && (
                      <label className="field">
                        <span>비밀번호</span>
                        <input
                          type="password"
                          minLength={10}
                          autoComplete={
                            screen === "signup"
                              ? "new-password"
                              : "current-password"
                          }
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          required
                          placeholder="10자 이상 입력"
                        />
                      </label>
                    )}
                  </>
                )}
                {(!authConfigured || screen === "signup") && (
                  <>
                    <label className="field">
                      <span>관심 있는 골목</span>
                    </label>
                    <div className="interest-picker">
                      {["맛집", "카페", "소품", "공방", "팝업"].map((i) => (
                        <button
                          type="button"
                          aria-pressed={interests.includes(i)}
                          className={interests.includes(i) ? "active" : ""}
                          key={i}
                          onClick={() =>
                            setInterests((v) =>
                              v.includes(i)
                                ? v.filter((x) => x !== i)
                                : [...v, i],
                            )
                          }
                        >
                          {interests.includes(i) && <Check size={13} />} {i}
                        </button>
                      ))}
                    </div>
                    <div className="consent-box">
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={terms}
                          onChange={(e) => setTerms(e.target.checked)}
                          required
                        />
                        {authConfigured
                          ? "[필수] 서비스 체험 이용 안내를 확인했습니다."
                          : "[필수] 실제 가입이 아닌 체험 프로필임을 확인했습니다."}
                      </label>
                      <label className="check-field">
                        <input
                          type="checkbox"
                          checked={privacy}
                          onChange={(e) => setPrivacy(e.target.checked)}
                          required
                        />
                        {authConfigured
                          ? "[필수] 가입 정보의 인증 서비스 저장에 동의합니다."
                          : "[필수] 닉네임·관심 분야를 이 브라우저에 저장합니다."}
                      </label>
                      <details>
                        <summary>이용 및 정보 처리 안내</summary>
                        <p>
                          이 시제품의 주문·결제·상품권은 데모입니다. 체험
                          프로필은 이 기기의 브라우저에 저장되며 프로필 지우기로
                          삭제할 수 있습니다. 실제 인증 모드에서는 이메일과
                          닉네임이 설정된 Supabase 프로젝트에 전송됩니다. 상용
                          서비스 약관은 사업자 정보와 정책 확정 후 별도 적용이
                          필요합니다.
                        </p>
                      </details>
                    </div>
                  </>
                )}
                {error && (
                  <p className="form-error" role="alert">
                    {error}
                  </p>
                )}
                {notice && (
                  <p className="inline-info" role="status">
                    {notice}
                  </p>
                )}
                <button className="primary full large" disabled={busy}>
                  {busy
                    ? "처리 중…"
                    : !authConfigured
                      ? "체험 프로필 만들기"
                      : screen === "login"
                        ? "로그인"
                        : screen === "recover"
                          ? "재설정 메일 보내기"
                          : "이메일로 회원가입"}
                  <ArrowRight size={18} />
                </button>
              </form>
              {authConfigured && (
                <div className="account-links">
                  <button
                    onClick={() => {
                      setScreen(screen === "login" ? "signup" : "login");
                      setError("");
                    }}
                  >
                    {screen === "login"
                      ? "회원가입"
                      : "이미 계정이 있나요? 로그인"}
                  </button>
                  <button onClick={() => setScreen("recover")}>
                    비밀번호 찾기
                  </button>
                </div>
              )}
              {kakaoConfigured && (
                <div className="kakao-auth-block">
                  <button
                    type="button"
                    className="kakao-login-btn full"
                    disabled={busy}
                    onClick={async () => {
                      setError("");
                      setNotice("");
                      setBusy(true);
                      try {
                        await startKakaoLogin();
                      } catch (e) {
                        setError(
                          e instanceof Error
                            ? e.message
                            : "카카오 로그인을 시작하지 못했습니다.",
                        );
                        setBusy(false);
                      }
                    }}
                  >
                    <MessageCircle size={18} />
                    카카오로 계속하기 (Kakao SDK)
                  </button>
                  <details className="kakao-uri-guide">
                    <summary>카카오 콘솔 Redirect URI · 도메인 설정 안내</summary>
                    <p>
                      카카오 개발자 콘솔 <b>플랫폼 → Web</b>에{" "}
                      <code>https://mango7557-ui.github.io</code>,{" "}
                      <b>카카오 로그인 → Redirect URI</b>에{" "}
                      <code>{getKakaoRedirectUri()}</code> 등록이 필요합니다.
                    </p>
                    <button
                      type="button"
                      className="text-button"
                      onClick={() => {
                        navigator.clipboard
                          ?.writeText(getKakaoRedirectUri())
                          .then(() => toast("Redirect URI를 복사했습니다."));
                      }}
                    >
                      <Copy size={13} /> Redirect URI 복사
                    </button>
                  </details>
                </div>
              )}
              <div className="account-social">
                <Mail size={16} />
                {authConfigured
                  ? "실제 이메일 인증 사용"
                  : kakaoConfigured
                    ? "카카오 JS SDK 연결됨 · 이메일 인증 대기"
                    : "카카오·이메일 인증 연결 대기"}
              </div>
            </>
          )}
          <button className="text-button account-admin-link" onClick={onAdmin}>
            운영 관리 · API 연결 상태 <ArrowRight size={14} />
          </button>
        </section>
      </div>
    </div>
  );
}
