import { useState, useEffect, useCallback, useRef } from "react";
import {
  MapPin,
  Compass,
  MessageCircle,
  UserRound,
  Search,
  ChevronDown,
  ArrowUpRight,
  ArrowRight,
  SlidersHorizontal,
  Clock,
  Ticket,
  Sparkles,
  Target,
  Heart,
  Navigation,
  List,
  Map as MapIcon,
  X,
  ShoppingBag,
  Store as StoreIcon,
  Globe,
  Settings2,
  Check,
  Leaf,
  ChevronRight,
  ShoppingBasket,
  RotateCcw,
  Truck,
  Wallet,
} from "lucide-react";
import { AppContext } from "./context";
import {
  type State,
  type Lang,
  type Store,
  type Cart,
  type Category,
  type Text,
  type VoucherId,
  regionalVouchers,
  STORAGE_KEY,
  text,
  categories,
  clockNames,
  businessStatus,
  nowFor,
  balance,
  kst,
  missionProgress,
} from "./domain";
import { initialState, loadState } from "./data";
import { t, won } from "./i18n";
import { mapAdapter, type MapBounds } from "./Map";
import {
  Photo,
  Status,
  StoreDetail,
  Checkout,
  Modal,
  Empty,
  categoryIcons,
} from "./components";
import {
  OrdersScreen,
  Chat,
  MissionsScreen,
  MyScreen,
  MallScreen,
} from "./screens";
import { OwnerScreen } from "./Owner";
import { RegularButton } from "./RegularButton";
import {LiveMap} from './LiveMap';
import {AccountScreen} from './Member';
import {AdminScreen} from './Admin';
const MapComponent = LiveMap;
export default function App() {
  const [state, setState] = useState<State>(loadState);
  const [tab, setTab] = useState("map");
  const [owner, setOwner] = useState(false);
  const [ownerId, setOwnerId] = useState("s1");
  const [selected, setSelected] = useState<string | null>(() =>
    new URLSearchParams(location.hash.slice(1)).get("store"),
  );
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category | "all">("all");
  const [filters, setFilters] = useState<string[]>([]);
  const [voucherFilter, setVoucherFilter] = useState<VoucherId | "all">("all");
  const [mode, setMode] = useState("modeNow");
  const [view, setView] = useState("map");
  const [sheet, setSheet] = useState("middle");
  const [bounds, setBounds] = useState<MapBounds | null>(null);
  const [mapError, setMapError] = useState(false);
  const [checkout, setCheckout] = useState(false);
  const [chatId, setChatId] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<{
    message: string;
    action: () => void;
  } | null>(null);
  const [showClock, setShowClock] = useState(false);
  const [notification, setNotification] = useState("");
  const [storageError, setStorageError] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lang = state.lang;
  const tr = (key: string) => t(key, lang);
  const tx = (value: Text) => text(value, lang);
  const toast = useCallback((message: string) => {
    setNotification(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setNotification(""), 4200);
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStorageError(false);
    } catch {
      setStorageError(true);
    }
    document.documentElement.lang = state.lang;
  }, [state]);
  useEffect(() => {
    if (tab === "map" && sessionStorage.getItem("mission-filter")) {
      setMode("mission");
      sessionStorage.removeItem("mission-filter");
    }
  }, [tab]);
  useEffect(() => {
    if (state.clock !== "real") return;
    const timer = setInterval(() => setState((s) => ({ ...s })), 60000);
    return () => clearInterval(timer);
  }, [state.clock]);
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.querySelector(".modal"))
        setSelected(null);
    };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, []);
  const confirm = (message: string, action: () => void) =>
    setConfirmation({ message, action });
  const openStore = (id: string) => {
    setTab("map");
    setOwner(false);
    setSelected(id);
  };
  const openChat = (storeId: string, orderId?: string) => {
    const id = `${storeId}-${orderId ?? "inquiry"}`;
    setState((s) =>
      s.conversations.some((c) => c.id === id)
        ? s
        : {
            ...s,
            conversations: [
              ...s.conversations,
              { id, storeId, orderId, messages: [] },
            ],
          },
    );
    setChatId(id);
  };
  const addCart = (
    store: Store,
    cartMode: Cart["mode"],
    menuId: string,
    optionId: string,
  ) => {
    const add = () => {
      setState((s) => {
        const same = s.cart?.storeId === store.id && s.cart.mode === cartMode;
        const cart: Cart = same
          ? s.cart!
          : { storeId: store.id, mode: cartMode, items: [] };
        const exists = cart.items.some(
          (i) => i.menuId === menuId && i.optionId === optionId,
        );
        return {
          ...s,
          cart: {
            ...cart,
            items: exists
              ? cart.items.map((i) =>
                  i.menuId === menuId && i.optionId === optionId
                    ? { ...i, quantity: Math.min(20, i.quantity + 1) }
                    : i,
                )
              : [...cart.items, { menuId, optionId, quantity: 1 }],
          },
        };
      });
      toast(
        `${tx(store.menu.find((m) => m.id === menuId)!.name)} · ${tr("add")} ✓`,
      );
    };
    if (
      state.cart?.items.length &&
      (state.cart.storeId !== store.id || state.cart.mode !== cartMode)
    )
      confirm(tr("switchCart"), add);
    else add();
  };
  const reset = () =>
    confirm(tr("resetConfirm"), () => {
      setState(initialState());
      setSelected(null);
      setSearch("");
      setCategory("all");
      setFilters([]);
      setVoucherFilter("all");
      setBounds(null);
      setMode("modeNow");
      setOwner(false);
      setTab("map");
      setChatId(null);
      setCheckout(false);
      setMapError(false);
      toast(tr("updated"));
    });
  const now = nowFor(state.clock);
  const today = kst(now).date;
  const activeCoupons = state.coupons.filter(
    (c) =>
      c.start <= today &&
      c.end >= today &&
      state.couponIssues.filter(
        (i) => i.couponId === c.id && i.status === "used",
      ).length < c.quantity,
  );
  const filtered = state.stores.filter((s) => {
    const status = businessStatus(s, now);
    const matched =
      !search ||
      [
        ...s.name,
        ...s.tags,
        ...categories[s.category],
        ...regionalVouchers
          .filter((v) => (s.vouchers ?? []).includes(v.id))
          .flatMap((v) => [...v.name, ...v.region]),
      ].some((v) => v.toLowerCase().includes(search.toLowerCase()));
    return (
      matched &&
      (category === "all" || s.category === category) &&
      (voucherFilter === "all" || (s.vouchers ?? []).includes(voucherFilter)) &&
      (!filters.includes("open") || ["open", "soon"].includes(status.code)) &&
      (!filters.includes("pickup") || s.pickup) &&
      (!filters.includes("delivery") || s.delivery) &&
      (!filters.includes("couponFilter") ||
        activeCoupons.some((c) => c.storeId === s.id)) &&
      (mode !== "coupon" || activeCoupons.some((c) => c.storeId === s.id)) &&
      (mode !== "points" || balance(state, s.id) > 0) &&
      (mode !== "mission" || s.mission) &&
      (!bounds ||
        (s.x >= bounds.left &&
          s.x <= bounds.right &&
          s.y >= bounds.top &&
          s.y <= bounds.bottom))
    );
  });
  const store = state.stores.find((s) => s.id === selected);
  const conversation = state.conversations.find((c) => c.id === chatId);
  const progress = missionProgress(state)[0].storeIds;
  const totalCart = state.cart?.items.reduce((n, i) => n + i.quantity, 0) ?? 0;
  const clearFilters = () => {
    setSearch("");
    setCategory("all");
    setFilters([]);
    setVoucherFilter("all");
    setBounds(null);
    setMode("modeNow");
  };
  const locationRequest = () => {
    if (!navigator.geolocation) {
      toast(
        tx([
          "위치를 사용할 수 없습니다. 성수 기본 지역을 유지합니다.",
          "Location unavailable. Staying in Seongsu.",
          "无法定位，将继续显示圣水区域。",
          "位置情報を利用できません。聖水エリアを表示します。",
        ]),
      );
      return;
    }
    toast(
      tx([
        "현재 위치 권한을 요청합니다…",
        "Requesting location permission…",
        "正在请求定位权限…",
        "位置情報の許可をリクエスト中…",
      ]),
    );
    navigator.geolocation.getCurrentPosition(
      () =>
        toast(
          tx([
            "위치를 확인했습니다. 가상 매장 데모는 성수 영역에서 탐색합니다.",
            "Location received. Fictional stores remain in the Seongsu demo area.",
            "已获取位置，虚拟店铺仍在圣水演示区域展示。",
            "位置を確認しました。架空店舗は聖水デモエリアで探索できます。",
          ]),
        ),
      () =>
        toast(
          tx([
            "위치 권한 거부 또는 위치 오류 · 성수 기본 지역을 유지합니다.",
            "Location denied or unavailable · staying in Seongsu.",
            "定位被拒绝或失败 · 保持圣水默认区域。",
            "位置情報の拒否・取得エラー。聖水エリアを表示します。",
          ]),
        ),
      { timeout: 8000 },
    );
  };
  return (
    <AppContext.Provider
      value={{
        state,
        setState,
        lang,
        tr,
        tx,
        toast,
        openStore,
        openChat,
        addCart,
        openCheckout: () => setCheckout(true),
        setTab,
        confirm,
        owner,
        ownerId,
        setOwnerId,
      }}
    >
      <div className={`app ${owner ? "owner-mode" : ""}`}>
        <header className="app-header">
          <button
            className="brand"
            onClick={() => {
              setTab("map");
              setOwner(false);
            }}
            aria-label="성수역 골목형 상점가 홈"
          >
            <span className="brand-symbol">
              <span />
              <span />
              <span />
              <span />
            </span>
            <span className="brand-name">
              <span className="brand-korean">성수역 <b>골목형 상점가</b></span><small>SEONGSU ALLEY MARKET</small>
            </span>
          </button>
          <span className="header-divider" />
          <span className="brand-slogan">{tr("slogan")}</span>
          <nav className="desktop-nav" aria-label="Main">
            {[
              ["map", MapIcon],
              ["mall", Truck],
              ["missions", Compass],
              ["orders", MessageCircle],
              ["my", UserRound],
            ].map(([id, Icon]) => {
              const I = Icon as typeof MapIcon;
              return (
                <button
                  key={id as string}
                  className={!owner && tab === id ? "active" : ""}
                  onClick={() => {
                    setTab(id as string);
                    setOwner(false);
                  }}
                >
                  <I size={17} />
                  {tr(id as string)}
                  {id === "orders" &&
                    state.orders.some(
                      (o) =>
                        ![
                          "completed",
                          "cancelled",
                          "rejected",
                          "refunded",
                        ].includes(o.status),
                    ) && <i className="notification-dot" />}
                </button>
              );
            })}
          </nav>
          <div className="header-actions">
            <button className="account-entry" aria-label="가입·내 계정" onClick={()=>{setTab('account');setOwner(false);setSelected(null);}}><UserRound size={18}/><span>{tx(['가입·계정','Account','账户','アカウント'])}</span></button>
            <button className="admin-entry" aria-label="관리자 페이지" onClick={()=>{setTab('admin');setOwner(false);setSelected(null);}}><Settings2 size={18}/><span>{tx(['운영 관리','Admin','管理','管理'])}</span></button>
            <div className="language-select">
              <Globe size={16} />
              <select
                aria-label="Language"
                value={lang}
                onChange={(e) =>
                  setState((s) => ({ ...s, lang: e.target.value as Lang }))
                }
              >
                <option value="ko">한국어</option>
                <option value="en">English</option>
                <option value="zh">简体中文</option>
                <option value="ja">日本語</option>
              </select>
              <ChevronDown size={12} />
            </div>
            <button
              className={`mode-switch ${owner ? "is-owner" : ""}`}
              onClick={() => {
                setOwner(!owner);
                setSelected(null);
              }}
            >
              <StoreIcon size={16} />
              <span>{tr(owner ? "customer" : "owner")}</span>
              <ArrowUpRight size={13} />
            </button>
          </div>
        </header>
        <div className="demo-ribbon">
          <span>
            <span className="ribbon-dot" />
            {tr("demo")}
            <span className="ribbon-separator">·</span>
            {tr("virtual")}
          </span>
          <button onClick={() => setShowClock(true)}>
            <Clock size={12} />
            <span>{tx(clockNames[state.clock])}</span>
            {state.clock !== "real" && (
              <span className="demo-time-label">{tr("demoTime")}</span>
            )}
            <ChevronDown size={12} />
          </button>
        </div>
        {storageError && (
          <div className="storage-error" role="alert">
            {tr("storageError")}
          </div>
        )}
        {tab==='admin'&&!owner?<main className="admin-main"><AdminScreen onExit={()=>setTab('map')} onMerchant={id=>{setOwnerId(id);setOwner(true);}}/></main>:owner ? (
          <main className="page-scroll">
            <OwnerScreen />
          </main>
        ) : tab === "map" ? (
          <main
            className={`explore-layout ${store ? "has-detail" : ""} ${view === "list" ? "list-view" : ""} sheet-${sheet}`}
          >
            <section className="discovery-panel">
              <div className="mobile-sheet-handle">
                <button
                  aria-label={tr("mobileSheet")}
                  onClick={() =>
                    setSheet((s) =>
                      s === "collapsed"
                        ? "middle"
                        : s === "middle"
                          ? "full"
                          : "collapsed",
                    )
                  }
                >
                  <span />
                </button>
              </div>
              <div className="discovery-top">
                <div className="area-title">
                  <span>
                    <MapPin size={14} />{" "}
                    {tx([
                      "서울, 성수동",
                      "Seongsu, Seoul",
                      "首尔，圣水洞",
                      "ソウル、聖水洞",
                    ])}
                    <ChevronDown size={13} />
                  </span>
                  <span className="local-time">
                    {state.clock === "real" ? "LIVE" : "DEMO"} <i />
                  </span>
                </div>
                <h1>
                  {tr("nearby")}
                  <span className="heading-sparkle">✳</span>
                </h1>
                <p className="discovery-subtitle">{tr("nearbySub")}</p>
                <div className="search-box">
                  <Search size={19} />
                  <input
                    aria-label={tr("search")}
                    placeholder={tr("search")}
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                  {search ? (
                    <button
                      aria-label={tr("resetFilters")}
                      onClick={() => setSearch("")}
                    >
                      <X size={16} />
                    </button>
                  ) : (
                    <span className="search-shortcut">⌕</span>
                  )}
                </div>
                <div className="map-mode-tabs">
                  {[
                    ["modeNow", Clock],
                    ["coupon", Ticket],
                    ["points", Sparkles],
                    ["mission", Target],
                  ].map(([id, Icon]) => {
                    const I = Icon as typeof Clock;
                    return (
                      <button
                        className={mode === id ? "active" : ""}
                        key={id as string}
                        onClick={() => setMode(id as string)}
                      >
                        <I size={18} />
                        <span>{tr(id as string)}</span>
                      </button>
                    );
                  })}
                </div>
                <div className="category-filters">
                  <button
                    className={category === "all" ? "active" : ""}
                    onClick={() => setCategory("all")}
                  >
                    {tr("all")}
                  </button>
                  {Object.entries(categories).map(([id, label]) => {
                    const I = categoryIcons[id as Category];
                    return (
                      <button
                        className={category === id ? "active" : ""}
                        key={id}
                        onClick={() => setCategory(id as Category)}
                      >
                        <I size={13} />
                        {tx(label)}
                      </button>
                    );
                  })}
                </div>
                <div className="attribute-filters">
                  {["open", "pickup", "delivery", "couponFilter"].map((id) => (
                    <button
                      className={filters.includes(id) ? "active" : ""}
                      key={id}
                      onClick={() =>
                        setFilters((f) =>
                          f.includes(id)
                            ? f.filter((k) => k !== id)
                            : [...f, id],
                        )
                      }
                    >
                      {filters.includes(id) ? (
                        <Check size={12} />
                      ) : (
                        <span className="filter-circle" />
                      )}
                      {tr(id)}
                    </button>
                  ))}
                  <select
                    className={`voucher-filter-select ${voucherFilter !== "all" ? "active" : ""}`}
                    aria-label={tr("vouchers")}
                    value={voucherFilter}
                    onChange={(e) =>
                      setVoucherFilter(e.target.value as VoucherId | "all")
                    }
                  >
                    <option value="all">{tr("allVouchers")}</option>
                    {regionalVouchers.map((v) => (
                      <option key={v.id} value={v.id}>
                        {tx(v.name)}
                      </option>
                    ))}
                  </select>
                  <button
                    aria-label={tr("resetFilters")}
                    className="reset-filter"
                    onClick={clearFilters}
                  >
                    <SlidersHorizontal size={15} />
                  </button>
                </div>
              </div>
              <div className="store-results">
                <div className="results-toolbar">
                  <span>
                    <b>{filtered.length}</b> {tr("results")}
                  </span>
                  <button
                    onClick={() => setView(view === "map" ? "list" : "map")}
                  >
                    {view === "map" ? (
                      <List size={14} />
                    ) : (
                      <MapIcon size={14} />
                    )}
                    <span>{tr(view === "map" ? "list" : "mapView")}</span>
                  </button>
                </div>
                {filtered.length ? (
                  filtered.map((s) => {
                    const coupon = activeCoupons.find(
                      (c) => c.storeId === s.id,
                    );
                    const firstVoucher = regionalVouchers.find((v) =>
                      voucherFilter !== "all"
                        ? v.id === voucherFilter
                        : (s.vouchers ?? []).includes(v.id),
                    );
                    return (
                      <article
                        key={s.id}
                        className={`store-card ${selected === s.id ? "active" : ""}`}
                      >
                        <button
                          className="store-card-main"
                          onClick={() => setSelected(s.id)}
                          aria-label={`${tx(s.name)} ${tr("details")}`}
                        >
                          <div className="store-card-title">
                            <span className="store-category">
                              {tx(categories[s.category])}
                              <span>·</span>
                              {s.preparation}{" "}
                              {lang === "ko"
                                ? "분"
                                : lang === "ja"
                                  ? "分"
                                  : lang === "zh"
                                    ? "分钟"
                                    : "min"}
                            </span>
                            <h3>
                              {tx(s.name)}
                              {s.id === "s1" && (
                                <span className="pick-label">PICK</span>
                              )}
                            </h3>
                            <Status store={s} detail />
                            <p>{tx(s.description)}</p>
                          </div>
                          <Photo store={s} />
                        </button>
                        <div className="store-card-bottom">
                          <div className="store-badges">
                            {mode === "points" ? (
                              <span className="coupon-badge">
                                <Sparkles size={12} />
                                {balance(state, s.id)}P
                              </span>
                            ) : mode === "mission" ? (
                              <span className="mission-badge">
                                <Target size={12} />
                                {tr(
                                  progress.includes(s.id)
                                    ? "explored"
                                    : "target",
                                )}
                              </span>
                            ) : coupon ? (
                              <span className="coupon-badge">
                                <Ticket size={12} />
                                {won(coupon.amount, lang)} {tr("coupon")}
                              </span>
                            ) : (
                              <span className="point-badge">
                                <Sparkles size={12} />
                                {s.rate}%{" "}
                                {lang === "ko" ? "적립" : tr("points")}
                              </span>
                            )}
                            {s.pickup && (
                              <span className="pickup-badge">
                                <ShoppingBag size={11} />
                                {tr("pickup")}
                              </span>
                            )}
                            {s.delivery && (
                              <span className="delivery-badge">
                                <Truck size={11} />
                                {tr("delivery")}
                              </span>
                            )}
                            {firstVoucher && (
                              <span className="voucher-badge">
                                <Wallet size={11} />
                                {tx(firstVoucher.name)}
                              </span>
                            )}
                          </div>
                          <RegularButton store={s} compact />
                        </div>
                      </article>
                    );
                  })
                ) : (
                  <Empty title={tr("noResults")}>
                    <button className="secondary" onClick={clearFilters}>
                      {tr("resetFilters")}
                    </button>
                  </Empty>
                )}
                <div className="list-ending">
                  <Leaf size={17} />
                  <span>{tr("exploreHint")}</span>
                  <small>성수역 골목형 상점가</small>
                </div>
              </div>
              <div
                className="explore-promo"
                onClick={() => setTab("missions")}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setTab("missions");
                }}
              >
                <span className="promo-stamp">
                  <Compass size={27} />
                </span>
                <div>
                  <small>SEONGSU EXPLORER</small>
                  <b>{tr("explore5")}</b>
                  <span>
                    {progress.length}/5{" "}
                    <span className="promo-progress">
                      <i
                        style={{
                          width: `${Math.min(100, (progress.length / 5) * 100)}%`,
                        }}
                      />
                    </span>
                  </span>
                </div>
                <ArrowRight size={18} />
              </div>
            </section>
            <section className="map-panel" aria-label={tr("map")}>
              <MapComponent
                stores={filtered}
                state={state}
                selected={selected}
                onSelect={setSelected}
                onSearch={(b) => {
                  setBounds(b);
                  toast(tr("updated"));
                }}
                onLocation={locationRequest}
                mode={mode}
                lang={lang}
                mapError={mapError}
                onRetry={() => setMapError(false)}
              />
              <div className="map-welcome-card">
                <div className="welcome-icon">
                  <Leaf size={21} />
                </div>
                <div>
                  <span>LOCAL FINDS, LITTLE JOYS</span>
                  <b>{tr("exploreHint")}</b>
                  <small>
                    {tx([
                      "골목마다 숨겨진 취향을 만나보세요",
                      "A little something, around every corner",
                      "每个街角，都藏着你的小喜好",
                      "路地ごとに、あなたの好みを発見",
                    ])}
                  </small>
                </div>
                <button
                  aria-label={tr("missions")}
                  onClick={() => setTab("missions")}
                >
                  <ArrowUpRight size={20} />
                </button>
              </div>
            </section>
            {store && (
              <StoreDetail
                key={store.id}
                store={store}
                onClose={() => setSelected(null)}
              />
            )}
            <button
              className="mobile-map-toggle"
              onClick={() => {
                setView(view === "map" ? "list" : "map");
                setSheet("full");
              }}
            >
              {view === "map" ? <List size={17} /> : <MapIcon size={17} />}{" "}
              {tr(view === "map" ? "list" : "mapView")}
            </button>
          </main>
        ) : (
          <main className="page-scroll">
            {tab==='account'?<AccountScreen onAdmin={()=>setTab('admin')}/>:tab === "mall" ? (
              <MallScreen />
            ) : tab === "orders" ? (
              <OrdersScreen />
            ) : tab === "missions" ? (
              <MissionsScreen />
            ) : (
              <MyScreen
                onReset={reset}
                onMapError={() => {
                  setMapError(true);
                  setTab("map");
                  toast(tr("mapError"));
                }}
              />
            )}
          </main>
        )}
        {!owner && tab!=='admin' && (
          <nav className="bottom-nav" aria-label="Mobile navigation">
            {[
              ["map", MapIcon],
              ["mall", Truck],
              ["missions", Compass],
              ["orders", MessageCircle],
              ["my", UserRound],
            ].map(([id, Icon]) => {
              const I = Icon as typeof MapIcon;
              return (
                <button
                  key={id as string}
                  className={tab === id ? "active" : ""}
                  onClick={() => {
                    setTab(id as string);
                    setSelected(null);
                  }}
                >
                  <I size={21} />
                  <span>{tr(id as string)}</span>
                  {id === "orders" &&
                    state.orders.some((o) => o.status === "ready") && (
                      <i className="notification-dot" />
                    )}
                </button>
              );
            })}
          </nav>
        )}
        {totalCart > 0 && !checkout && !store && !owner && (
          <button className="floating-cart" onClick={() => setCheckout(true)}>
            <ShoppingBasket size={19} />
            {tr("cart")}
            <b>{totalCart}</b>
            <ArrowUpRight size={16} />
          </button>
        )}
        {checkout && (
          <Checkout
            onClose={() => setCheckout(false)}
            onSuccess={() => setTab("orders")}
          />
        )}
        {conversation && (
          <Chat conversation={conversation} onClose={() => setChatId(null)} />
        )}
        {confirmation && (
          <Modal title={tr("confirm")} onClose={() => setConfirmation(null)}>
            <div className="modal-body">
              <p>{confirmation.message}</p>
              <div className="confirm-buttons">
                <button
                  className="secondary"
                  onClick={() => setConfirmation(null)}
                >
                  {tr("cancel")}
                </button>
                <button
                  className="primary"
                  onClick={() => {
                    confirmation.action();
                    setConfirmation(null);
                  }}
                >
                  {tr("confirm")}
                </button>
              </div>
            </div>
          </Modal>
        )}
        {showClock && (
          <Modal title={tr("clock")} onClose={() => setShowClock(false)}>
            <div className="modal-body">
              <p>{tr("timeNotice")}</p>
              <div className="clock-options">
                {Object.entries(clockNames).map(([id, label]) => (
                  <button
                    className={state.clock === id ? "selected" : ""}
                    key={id}
                    onClick={() => {
                      setState((s) => ({ ...s, clock: id }));
                      setShowClock(false);
                    }}
                  >
                    <Clock size={16} />
                    {tx(label)}
                    {state.clock === id && <Check size={15} />}
                  </button>
                ))}
              </div>
              <p className="fine-print">{tr("notRealServices")}</p>
            </div>
          </Modal>
        )}
        {notification && (
          <div className="toast" role="status">
            <Check size={17} />
            <span>{notification}</span>
            <button
              aria-label={tr("close")}
              onClick={() => setNotification("")}
            >
              <X size={15} />
            </button>
          </div>
        )}
      </div>
    </AppContext.Provider>
  );
}
