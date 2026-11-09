import { useEffect, useState } from "react";
import {
  Activity,
  ArrowLeft,
  ArrowUpRight,
  CheckCircle2,
  ClipboardList,
  Database,
  Download,
  ExternalLink,
  LayoutDashboard,
  Plug,
  Search,
  ShieldCheck,
  Store,
  Users,
  Wallet,
} from "lucide-react";
import { useApp } from "./context";
import { businessStatus, nowFor } from "./domain";
import { OrderCard } from "./screens";
import { Photo, Status } from "./components";
import {
  authConfigured,
  checkAuthConnection,
  getServerRole,
  integrationCatalog,
} from "./services";
import { readMember } from "./Member";
import { won } from "./i18n";
export function AdminScreen({
  onExit,
  onMerchant,
}: {
  onExit: () => void;
  onMerchant: (id: string) => void;
}) {
  const { state, tx, tr, lang, toast } = useApp();
  const [section, setSection] = useState("overview");
  const [query, setQuery] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState("");
  const [role, setRole] = useState("미연결");
  useEffect(() => {
    if (authConfigured)
      getServerRole()
        .then((r) => setRole(r ?? "로그인 필요"))
        .catch(() => setRole("권한 확인 실패"));
  }, []);
  const active = state.stores.filter((s) =>
    ["open", "soon"].includes(businessStatus(s, nowFor(state.clock)).code),
  ).length;
  const completed = state.orders.filter((o) => o.status === "completed");
  const revenue = completed.reduce(
    (n, o) => n + o.total + (o.voucherUsed ?? 0),
    0,
  );
  const pending = state.orders.filter((o) =>
    ["requested", "accepted", "preparing", "ready"].includes(o.status),
  ).length;
  const nav = [
    ["overview", "운영 개요", LayoutDashboard],
    ["stores", "매장 관리", Store],
    ["orders", "주문 관리", ClipboardList],
    ["members", "회원·가입", Users],
    ["benefits", "혜택 현황", Wallet],
    ["integrations", "API 연결", Plug],
  ] as const;
  const exportData = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      environment: "local-demo",
      stores: state.stores.map((s) => ({
        id: s.id,
        name: s.name[0],
        delivery: s.delivery,
      })),
      orders: state.orders.map((o) => ({
        id: o.id,
        storeId: o.storeId,
        status: o.status,
        total: o.total,
        mode: o.mode,
      })),
      summary: { completed: completed.length, revenue, pending },
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(report, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "seongsu-operations-demo.json";
    link.click();
    URL.revokeObjectURL(url);
    toast("개인정보를 제외한 데모 보고서를 내려받았습니다.");
  };
  return (
    <div className="admin-layout">
      <aside className="admin-sidebar">
        <div className="admin-identity">
          <span className="admin-monogram">S.</span>
          <div>
            <b>성수역 상점가</b>
            <small>OPERATIONS STUDIO</small>
          </div>
        </div>
        <span className="sidebar-label">WORKSPACE</span>
        <nav>
          {nav.map(([id, label, Icon]) => (
            <button
              key={id}
              onClick={() => setSection(id)}
              className={section === id ? "active" : ""}
            >
              <Icon size={18} />
              {label}
              {id === "orders" && pending > 0 && <span>{pending}</span>}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-bottom">
          <span className="environment-dot" /> LOCAL DEMO
          <p>
            이 브라우저의 체험 데이터
            <br />
            실서비스 관리자 인증 아님
          </p>
          <button onClick={onExit}>
            <ArrowLeft size={15} /> 고객 화면으로
          </button>
        </div>
      </aside>
      <div className="admin-workspace">
        <header className="admin-topbar">
          <span>
            Workspace <span>/</span> {nav.find((n) => n[0] === section)?.[1]}
          </span>
          <div>
            <span className="admin-demo-tag">DEMO</span>
            <button className="secondary" onClick={exportData}>
              <Download size={15} /> 보고서
            </button>
          </div>
        </header>
        <div className="admin-content">
          <div className="admin-page-title">
            <div>
              <span className="editorial-label">SEONGSU OPERATIONS</span>
              <h1>
                {section === "overview"
                  ? "골목의 오늘을 한눈에."
                  : nav.find((n) => n[0] === section)?.[1]}
              </h1>
              <p>
                {section === "integrations"
                  ? "실제 연결 상태와 다음 연결에 필요한 정보를 확인하세요."
                  : "고객의 발견부터 주문 완료까지, 상점가의 흐름을 관리하세요."}
              </p>
            </div>
            <span className="workspace-date">
              {nowFor(state.clock).toLocaleDateString("ko-KR", {
                timeZone: "Asia/Seoul",
              })}
              <small>테스트 시계 기준</small>
            </span>
          </div>
          {section === "overview" && (
            <>
              <div className="admin-kpis">
                {[
                  [
                    Store,
                    "참여 매장",
                    `${state.stores.length}`,
                    `${active}곳 영업 중`,
                  ],
                  [
                    ClipboardList,
                    "처리 중 주문",
                    `${pending}`,
                    "접수 · 준비 · 수령 대기",
                  ],
                  [
                    CheckCircle2,
                    "이용 완료",
                    `${completed.length}`,
                    "완료 주문 기준",
                  ],
                  [
                    Wallet,
                    "완료 결제액",
                    won(revenue, lang),
                    "상품권 포함 · 데모 금액",
                  ],
                ].map(([Icon, label, value, sub]) => {
                  const I = Icon as typeof Store;
                  return (
                    <article key={label as string}>
                      <span>
                        <I size={19} />
                        {label as string}
                      </span>
                      <strong>{value as string}</strong>
                      <small>{sub as string}</small>
                    </article>
                  );
                })}
              </div>
              <div className="admin-overview-grid">
                <section className="admin-panel">
                  <div className="panel-title">
                    <h3>주문 흐름</h3>
                    <span>LOCAL ACTIVITY</span>
                  </div>
                  <div className="pipeline-chart">
                    {[
                      "requested",
                      "accepted",
                      "preparing",
                      "ready",
                      "completed",
                    ].map((k) => {
                      const count = state.orders.filter(
                        (o) => o.status === k,
                      ).length;
                      return (
                        <div key={k}>
                          <strong>{count}</strong>
                          <div>
                            <span
                              style={{
                                height: `${state.orders.length ? Math.max(6, (count / state.orders.length) * 120) : 4}px`,
                              }}
                            />
                          </div>
                          <small>{tr(k)}</small>
                        </div>
                      );
                    })}
                  </div>
                  {!state.orders.length && (
                    <p className="admin-empty-note">
                      아직 접수된 주문이 없습니다. 고객 화면에서 데모 주문을
                      만들어 보세요.
                    </p>
                  )}
                </section>
                <section className="admin-panel">
                  <div className="panel-title">
                    <h3>연결 준비 상태</h3>
                    <Plug size={18} />
                  </div>
                  <div className="connection-summary">
                    <strong>
                      2<span> / 10</span>
                    </strong>
                    <p>
                      인증키 없이 사용할 수 있는
                      <br />
                      지도·주소 검색 연결 구현
                    </p>
                  </div>
                  <p className="fine-print">
                    개별 브라우저의 네트워크 연결은 실행 시 확인됩니다.
                    결제·상품권·실매장 접수는 미연결입니다.
                  </p>
                  <button
                    className="secondary full"
                    onClick={() => setSection("integrations")}
                  >
                    API 연결 상태 보기 <ArrowUpRight size={16} />
                  </button>
                </section>
              </div>
              <section className="admin-panel">
                <div className="panel-title">
                  <h3>최근 주문</h3>
                  <button
                    className="text-button"
                    onClick={() => setSection("orders")}
                  >
                    전체 보기 <ArrowUpRight size={14} />
                  </button>
                </div>
                {state.orders.length ? (
                  <div className="admin-order-list">
                    {state.orders.slice(0, 5).map((o) => (
                      <div key={o.id}>
                        <span>{o.id}</span>
                        <b>
                          {tx(
                            state.stores.find((s) => s.id === o.storeId)!.name,
                          )}
                        </b>
                        <span className="order-status">{tr(o.status)}</span>
                        <strong>{won(o.total, lang)}</strong>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="admin-empty-state">
                    <ClipboardList size={27} />
                    <h4>첫 번째 주문을 기다리고 있어요</h4>
                    <p>주문이 생성되면 이곳에서 바로 확인할 수 있습니다.</p>
                  </div>
                )}
              </section>
            </>
          )}
          {section === "stores" && (
            <section className="admin-panel">
              <div className="admin-search">
                <Search size={18} />
                <input
                  aria-label="매장 검색"
                  placeholder="매장명 검색"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
              </div>
              <div className="admin-store-table">
                {state.stores
                  .filter((s) =>
                    s.name.some((n) =>
                      n.toLowerCase().includes(query.toLowerCase()),
                    ),
                  )
                  .map((s) => (
                    <article key={s.id}>
                      <Photo store={s} />
                      <div>
                        <h3>{tx(s.name)}</h3>
                        <small>
                          {s.id} · {s.verified} 확인
                        </small>
                      </div>
                      <Status store={s} />
                      <span className="admin-delivery">
                        {s.delivery ? "택배 가능" : "방문 중심"}
                      </span>
                      <button
                        className="secondary"
                        onClick={() => onMerchant(s.id)}
                      >
                        매장 관리 <ArrowUpRight size={14} />
                      </button>
                    </article>
                  ))}
              </div>
            </section>
          )}
          {section === "orders" && (
            <>
              <div className="admin-filter-row">
                <label>
                  주문 상태{" "}
                  <select
                    value={orderFilter}
                    onChange={(e) => setOrderFilter(e.target.value)}
                  >
                    <option value="all">전체 주문</option>
                    {[
                      "requested",
                      "accepted",
                      "preparing",
                      "ready",
                      "completed",
                      "cancelled",
                      "refunded",
                      "rejected",
                    ].map((k) => (
                      <option key={k} value={k}>
                        {tr(k)}
                      </option>
                    ))}
                  </select>
                </label>
                <span>
                  {
                    state.orders.filter(
                      (o) => orderFilter === "all" || o.status === orderFilter,
                    ).length
                  }
                  건
                </span>
              </div>
              <div className="order-grid">
                {state.orders
                  .filter(
                    (o) => orderFilter === "all" || o.status === orderFilter,
                  )
                  .map((o) => (
                    <OrderCard key={o.id} order={o} merchant />
                  ))}
              </div>
              {!state.orders.filter(
                (o) => orderFilter === "all" || o.status === orderFilter,
              ).length && (
                <div className="admin-empty-state">
                  <ClipboardList size={28} />
                  <h3>해당 상태의 주문이 없습니다</h3>
                </div>
              )}
            </>
          )}
          {section === "members" && (
            <section className="admin-panel">
              <div className="panel-title">
                <h3>회원 연결 상태</h3>
                <Users size={20} />
              </div>
              <div className="connection-banner">
                <ShieldCheck size={24} />
                <div>
                  <b>
                    {authConfigured
                      ? "인증 설정 있음"
                      : "실제 회원 서버 미연결"}
                  </b>
                  <p>
                    서버 권한: {role} · 클라이언트 가입으로 관리자 권한을
                    부여하지 않습니다.
                  </p>
                </div>
              </div>
              <p className="fine-print">
                실제 회원 목록은 관리자 역할을 검증하는 서버 API 연결 후
                제공됩니다. 현재 목록은 이 브라우저의 체험 프로필만 표시합니다.
              </p>
              {readMember() ? (
                <div className="member-preview-row">
                  <Users size={22} />
                  <b>{readMember()!.name}</b>
                  <span>로컬 체험 프로필</span>
                </div>
              ) : (
                <div className="admin-empty-state">
                  <Users size={28} />
                  <p>이 브라우저에 체험 프로필이 없습니다.</p>
                </div>
              )}
            </section>
          )}
          {section === "benefits" && (
            <>
              <div className="admin-kpis">
                <article>
                  <span>발행 쿠폰</span>
                  <strong>{state.coupons.length}</strong>
                  <small>가상 매장 쿠폰</small>
                </article>
                <article>
                  <span>포인트 기록</span>
                  <strong>{state.ledger.length}</strong>
                  <small>적립·사용·복원·회수</small>
                </article>
                <article>
                  <span>상품권 기록</span>
                  <strong>{state.voucherLedger?.length ?? 0}</strong>
                  <small>실제 정산 미연결</small>
                </article>
              </div>
              <section className="admin-panel">
                <div className="panel-title">
                  <h3>매장별 쿠폰 현황</h3>
                  <Wallet size={20} />
                </div>
                {state.coupons.map((c) => (
                  <div className="benefit-admin-row" key={c.id}>
                    <b>
                      {tx(state.stores.find((s) => s.id === c.storeId)!.name)}
                    </b>
                    <span>{tx(c.title)}</span>
                    <strong>{won(c.amount, lang)}</strong>
                    <small>{c.end}</small>
                  </div>
                ))}
              </section>
            </>
          )}
          {section === "integrations" && (
            <>
              <div className="connection-banner">
                <Plug size={26} />
                <div>
                  <b>실제 연결과 데모를 구분합니다.</b>
                  <p>
                    결제·상품권·택배사 접수는 계약과 서버 인증이 필요한
                    기능입니다. 비밀키를 이 화면이나 프론트엔드에 입력하지
                    않습니다.
                  </p>
                </div>
              </div>
              <div className="integration-grid">
                {integrationCatalog.map((service) => (
                  <article className="integration-card" key={service.id}>
                    <div className="integration-card-head">
                      <span className="integration-icon">
                        <Plug size={21} />
                      </span>
                      <span className={`integration-status ${service.status}`}>
                        {service.status === "public"
                          ? "공개 API 구현"
                          : service.status === "configured"
                            ? "설정됨 · 확인 필요"
                            : "연결 대기"}
                      </span>
                    </div>
                    <small>{service.category}</small>
                    <h3>{service.name}</h3>
                    <p>{service.description}</p>
                    <div className="integration-needs">
                      <b>연결에 필요한 것</b>
                      <p>{service.needs}</p>
                    </div>
                    <a href={service.url} target="_blank" rel="noreferrer">
                      공식 서비스 <ExternalLink size={13} />
                    </a>
                    {service.id === "auth" && (
                      <button
                        className="secondary"
                        disabled={!authConfigured || checking}
                        onClick={async () => {
                          setChecking(true);
                          try {
                            setCheckResult(await checkAuthConnection());
                          } catch (e) {
                            setCheckResult(
                              e instanceof Error ? e.message : "연결 실패",
                            );
                          } finally {
                            setChecking(false);
                          }
                        }}
                      >
                        {checking ? "확인 중…" : "실제 인증 API 확인"}
                      </button>
                    )}
                  </article>
                ))}
              </div>
              {checkResult && (
                <p role="status" className="inline-info">
                  {checkResult}
                </p>
              )}
              <section className="admin-panel deploy-guide">
                <h3>배포 연결 순서</h3>
                <ol>
                  <li>
                    Supabase 프로젝트를 만들고 <code>supabase/schema.sql</code>
                    을 실행합니다.
                  </li>
                  <li>
                    <code>VITE_SUPABASE_URL</code>,{" "}
                    <code>VITE_SUPABASE_ANON_KEY</code>를 배포 환경에
                    설정합니다.
                  </li>
                  <li>
                    인증 메일·Redirect URL을 등록하고 가입·로그인을 검증합니다.
                  </li>
                  <li>번역 키는 Edge Function 비밀 환경변수에만 등록합니다.</li>
                  <li>
                    PG·상품권 운영기관·택배사 계약과 공식 API 권한을 확보합니다.
                  </li>
                </ol>
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
