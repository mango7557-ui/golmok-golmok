export type Lang = "ko" | "en" | "zh" | "ja";
export type Text = [string, string, string, string];
export const text = (v: Text, lang: Lang) =>
  v[["ko", "en", "zh", "ja"].indexOf(lang)];
export type Category = "food" | "cafe" | "shop" | "studio" | "popup";
export interface BusinessHours {
  weekly: Record<number, [string, string] | null>;
  breaks: [string, string][] | null;
  lastOrder: number;
  closedDays: number[];
  exceptions: Record<
    string,
    | {
        closed?: boolean;
        hours?: [string, string];
        breaks?: [string, string][];
      }
    | undefined
  >;
}
export interface MenuItem {
  id: string;
  name: Text;
  price: number;
  description: Text;
  soldOut: boolean;
  options: { id: string; name: Text; price: number }[];
}
export type VoucherId = "seongdong" | "seoul" | "onnuri" | "gyeonggi" | "busan";
export interface RegionalVoucher {
  id: VoucherId;
  name: Text;
  region: Text;
  desc: Text;
}
export const regionalVouchers: RegionalVoucher[] = [
  {
    id: "seongdong",
    name: [
      "성동사랑상품권",
      "Seongdong Love Voucher",
      "城东爱心商品券",
      "城東愛商品券",
    ],
    region: [
      "서울 성동구",
      "Seongdong-gu, Seoul",
      "首尔城东区",
      "ソウル城東区",
    ],
    desc: [
      "성수·성동구 가맹 골목매장 전용",
      "Accepted at Seongsu & Seongdong stores",
      "圣水·城东区加盟店专用",
      "聖水・城東区加盟店専用",
    ],
  },
  {
    id: "seoul",
    name: [
      "서울페이+ 광역상품권",
      "SeoulPay+ Voucher",
      "首尔Pay+商品券",
      "ソウルペイ+商品券",
    ],
    region: ["서울특별시", "Seoul Metro", "首尔特别市", "ソウル特別市"],
    desc: [
      "서울 전역 가맹 소상공인 매장 사용",
      "Accepted at participating Seoul merchants",
      "首尔全市加盟小商户可用",
      "ソウル全域の加盟店で使用可能",
    ],
  },
  {
    id: "onnuri",
    name: [
      "디지털 온누리상품권",
      "Digital Onnuri Voucher",
      "数字温努里商品券",
      "デジタルオンヌリ商品券",
    ],
    region: [
      "전국 전통시장·골목상권",
      "National Alley & Market",
      "全国传统市场·胡同商圈",
      "全国伝統市場・路地商圏",
    ],
    desc: [
      "온누리 가맹 골목상권·온라인몰 사용",
      "Accepted at Onnuri alley & online stores",
      "温努里加盟店及在线商城可用",
      "オンヌリ加盟店・オンラインで利用可能",
    ],
  },
  {
    id: "gyeonggi",
    name: [
      "경기지역화폐",
      "Gyeonggi Local Currency",
      "京畿地区货币",
      "京畿地域通貨",
    ],
    region: [
      "경기도 · 사용 지역 확인 필요",
      "Gyeonggi · region verification required",
      "京畿道 · 需确认使用区域",
      "京畿道・利用地域の確認が必要",
    ],
    desc: [
      "데모 지갑 · 성수 실매장 사용을 보장하지 않음",
      "Demo wallet · no real Seongsu acceptance claimed",
      "演示钱包 · 不保证圣水实际店铺可用",
      "デモ財布・聖水実店舗の利用を保証しません",
    ],
  },
  {
    id: "busan",
    name: ["부산 동백전", "Busan Dongbaekjeon", "釜山冬柏传", "釜山ドンベク伝"],
    region: [
      "부산광역시 · 사용 지역 확인 필요",
      "Busan · region verification required",
      "釜山市 · 需确认使用区域",
      "釜山市・利用地域の確認が必要",
    ],
    desc: [
      "데모 지갑 · 실제 가맹·택배 결제 권한 미확인",
      "Demo wallet · merchant and parcel eligibility unverified",
      "演示钱包 · 加盟与快递支付资格未确认",
      "デモ財布・加盟と宅配決済資格は未確認",
    ],
  },
];
export interface VoucherLedger {
  id: string;
  voucherId: VoucherId;
  storeId?: string;
  orderId?: string;
  amount: number;
  kind: "charge" | "spend" | "restore";
  createdAt: string;
}
export interface Store {
  id: string;
  name: Text;
  category: Category;
  description: Text;
  tags: string[];
  x: number;
  y: number;
  lat: number;
  lng: number;
  address: string;
  photo: string;
  hours: BusinessHours;
  pickup: boolean;
  pickupWindow: [string, string];
  preparation: number;
  capacity: number;
  delivery?: boolean;
  shippingFee?: number;
  freeShippingMin?: number;
  shippingLead?: Text;
  vouchers?: VoucherId[];
  menu: MenuItem[];
  rate: number;
  pointCap: number;
  campaignCap: number;
  pointMin: number;
  pointExpiry: number;
  stackPoints: boolean;
  mission: boolean;
  verified: string;
}
export interface Coupon {
  id: string;
  storeId: string;
  title: Text;
  amount: number;
  min: number;
  start: string;
  end: string;
  from: string;
  to: string;
  quantity: number;
  excluded: string;
  stack: boolean;
  template: number;
}
export interface CouponIssue {
  couponId: string;
  orderId: string;
  status: "used" | "restored";
}
export interface Cart {
  storeId: string;
  mode: "pickup" | "table" | "delivery";
  items: { menuId: string; optionId: string; quantity: number }[];
}
export type OrderStatus =
  | "requested"
  | "accepted"
  | "preparing"
  | "ready"
  | "completed"
  | "rejected"
  | "cancelled"
  | "refunded";
export interface ShippingAddress {
  recipient: string;
  phone: string;
  postcode: string;
  address: string;
  detail: string;
}
export interface Order {
  id: string;
  storeId: string;
  mode: "pickup" | "table" | "delivery";
  table?: string;
  items: { name: Text; option?: Text; unit: number; quantity: number }[];
  subtotal: number;
  shippingFee?: number;
  discount: number;
  pointsUsed: number;
  voucherId?: VoucherId;
  voucherUsed?: number;
  total: number;
  couponId?: string;
  createdAt: string;
  pickupAt: string;
  request: string;
  shippingAddress?: ShippingAddress;
  trackingNumber?: string;
  status: OrderStatus;
  earn: number;
  policy: {
    rate: number;
    pointCap: number;
    campaignCap: number;
    expiry: number;
  };
  completedAt?: string;
}
export interface Payment {
  orderId: string;
  method: string;
  amount: number;
  status: "demo_paid" | "demo_refunded";
}
export interface Message {
  id: string;
  role: "customer" | "owner";
  original: string;
  translated: string | null;
  status: "translated" | "original" | "unsupported";
  read: boolean;
  time: string;
  auto?: boolean;
  translationProvider?: 'sample' | 'api';
  translationTarget?: Lang;
}
export interface Conversation {
  id: string;
  storeId: string;
  orderId?: string;
  messages: Message[];
}
export interface PointLedger {
  id: string;
  storeId: string;
  orderId?: string;
  amount: number;
  kind: "welcome" | "earn" | "spend" | "restore" | "revoke";
  createdAt: string;
  expiresAt?: string;
}
export interface Mission {
  id: string;
  target: number;
  reward: number;
  upcoming: boolean;
}
export interface MissionProgress {
  id: string;
  storeIds: string[];
  complete: boolean;
  reward: number;
}
export interface State {
  version: 3;
  stores: Store[];
  coupons: Coupon[];
  couponIssues: CouponIssue[];
  orders: Order[];
  payments: Payment[];
  conversations: Conversation[];
  ledger: PointLedger[];
  voucherLedger?: VoucherLedger[];
  saved: string[];
  cart: Cart | null;
  lang: Lang;
  clock: string;
  missionRewards: Record<string, number>;
}
export const STORAGE_KEY = "golmok-demo-v3";
export const missions: Mission[] = [
  { id: "seongsu5", target: 5, reward: 2000, upcoming: false },
  { id: "seongsu10", target: 10, reward: 5000, upcoming: false },
  { id: "national100", target: 100, reward: 0, upcoming: true },
  { id: "national1000", target: 1000, reward: 0, upcoming: true },
];
export const categories: Record<Category, Text> = {
  food: ["음식점", "Restaurant", "餐厅", "レストラン"],
  cafe: ["카페", "Café", "咖啡馆", "カフェ"],
  shop: ["소품숍", "Lifestyle", "杂货店", "雑貨店"],
  studio: ["공방", "Workshop", "工坊", "工房"],
  popup: ["팝업", "Pop-up", "快闪店", "ポップアップ"],
};
export const clockNames: Record<string, Text> = {
  real: ["실제 시간", "Live time", "实际时间", "現在時刻"],
  lunch: ["평일 점심", "Weekday lunch", "工作日午餐", "平日ランチ"],
  break: ["브레이크타임", "Afternoon break", "午休时间", "休憩時間"],
  evening: ["저녁", "Evening", "晚间", "夜"],
  holiday: ["휴무일", "Sunday", "休息日", "定休日"],
};
export function nowFor(clock: string): Date {
  return clock === "real"
    ? new Date()
    : new Date(
        (
          {
            lunch: "2026-10-28T12:30:00+09:00",
            break: "2026-10-28T15:30:00+09:00",
            evening: "2026-10-28T20:35:00+09:00",
            holiday: "2026-11-01T12:30:00+09:00",
          } as Record<string, string>
        )[clock] || "2026-10-28T12:30:00+09:00",
      );
}
export function kst(date: Date) {
  const d = new Date(date.getTime() + 9 * 3600000);
  return {
    date: d.toISOString().slice(0, 10),
    day: d.getUTCDay(),
    minute: d.getUTCHours() * 60 + d.getUTCMinutes(),
  };
}
export const mins = (s: string) => {
  const [h, m] = s.split(":").map(Number);
  return h * 60 + m;
};
export const hhmm = (n: number) =>
  `${String(Math.floor((n % 1440) / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
export function schedule(store: Store, date: Date) {
  const k = kst(date);
  const ex = store.hours.exceptions[k.date];
  if (ex?.closed)
    return {
      hours: null,
      breaks: ex.breaks ?? store.hours.breaks,
      reason: "temporary",
    };
  if (ex?.hours)
    return {
      hours: ex.hours,
      breaks: ex.breaks ?? store.hours.breaks,
      reason: "exception",
    };
  if (store.hours.closedDays.includes(k.day))
    return { hours: null, breaks: store.hours.breaks, reason: "regular" };
  return {
    hours: store.hours.weekly[k.day] ?? null,
    breaks: ex?.breaks ?? store.hours.breaks,
    reason: "weekly",
  };
}
export interface BusinessStatus {
  code: "open" | "soon" | "break" | "closed" | "unknown";
  until?: string;
  hours: [string, string] | null;
  breaks: [string, string][] | null;
  reason: string;
  remaining?: number;
}
export function businessStatus(store: Store, date: Date): BusinessStatus {
  const k = kst(date);
  const today = schedule(store, date);
  let active = today;
  let n = k.minute;
  // Explicit closure for today wins over an overnight segment from yesterday.
  if (today.reason === "temporary") return { code: "closed", ...today };
  const yesterday = schedule(store, new Date(date.getTime() - 86400000));
  if (
    yesterday.hours &&
    mins(yesterday.hours[1]) <= mins(yesterday.hours[0]) &&
    k.minute < mins(yesterday.hours[1])
  ) {
    active = yesterday;
    n += 1440;
  }
  if (!active.hours)
    return {
      code:
        !Object.values(store.hours.weekly).some(Boolean) &&
        today.reason === "weekly"
          ? "unknown"
          : "closed",
      ...active,
    };
  const [a, b] = active.hours.map(mins);
  const end = b <= a ? b + 1440 : b;
  if (n < a || n >= end) return { code: "closed", ...active };
  for (const br of active.breaks ?? []) {
    let [start, finish] = br.map(mins);
    if (start < a) start += 1440;
    if (finish <= start % 1440) finish += 1440;
    if (n >= start && n < finish)
      return { code: "break", until: br[1], ...active };
  }
  return {
    code: end - n <= 30 ? "soon" : "open",
    until: active.hours[1],
    remaining: end - n,
    ...active,
  };
}
export function pickupSlots(store: Store, date: Date): string[] {
  const current = businessStatus(store, date);
  if (!store.pickup || !["open", "soon"].includes(current.code)) return [];
  const slots: string[] = [];
  const k = kst(date);
  const start = Math.ceil((k.minute + store.preparation) / 15) * 15;
  for (let m = start; m <= k.minute + 180; m += 15) {
    const d = new Date(date.getTime() + (m - k.minute) * 60000);
    const status = businessStatus(store, d);
    if (!["open", "soon"].includes(status.code) || !status.hours) continue;
    const open = mins(status.hours[0]);
    let close = mins(status.hours[1]);
    if (close <= open) close += 1440;
    const windowStart = mins(store.pickupWindow[0]);
    let windowEnd = mins(store.pickupWindow[1]);
    if (windowEnd <= windowStart) windowEnd += 1440;
    if (m < windowStart || m > windowEnd || m > close - store.hours.lastOrder)
      continue;
    slots.push(`${kst(d).date}T${hhmm(m)}:00+09:00`);
  }
  return slots;
}
export function balance(
  state: State,
  storeId: string,
  date = nowFor(state.clock),
) {
  return Math.max(
    0,
    state.ledger
      .filter(
        (e) =>
          e.storeId === storeId &&
          (!e.expiresAt || e.expiresAt >= kst(date).date),
      )
      .reduce((n, e) => n + e.amount, 0),
  );
}
export function voucherBalance(state: State, voucherId: VoucherId) {
  return Math.max(
    0,
    (state.voucherLedger ?? [])
      .filter((e) => e.voucherId === voucherId)
      .reduce((n, e) => n + e.amount, 0),
  );
}
export function chargeVoucher(
  state: State,
  voucherId: VoucherId,
  amount: number,
): State {
  const clean = Math.max(0, Math.min(500000, Math.floor(amount) || 0));
  if (!clean) return state;
  const date = nowFor(state.clock);
  const stamp = `${kst(date).date}T${hhmm(kst(date).minute)}:00+09:00`;
  return {
    ...state,
    voucherLedger: [
      ...(state.voucherLedger ?? []),
      {
        id: `charge-${voucherId}-${Date.now().toString(36)}-${(state.voucherLedger ?? []).length + 1}`,
        voucherId,
        amount: clean,
        kind: "charge",
        createdAt: stamp,
      },
    ],
  };
}
export function missionProgress(state: State): MissionProgress[] {
  const ids = [
    ...new Set(
      state.orders
        .filter(
          (o) =>
            o.status === "completed" &&
            o.total + (o.voucherUsed ?? 0) > 0 &&
            o.completedAt &&
            o.completedAt.slice(0, 10) >= "2026-10-01" &&
            o.completedAt.slice(0, 10) <= "2026-12-31" &&
            state.stores.find((s) => s.id === o.storeId)?.mission,
        )
        .map((o) => o.storeId),
    ),
  ];
  return missions.map((m) => ({
    id: m.id,
    storeIds: ids,
    complete: !m.upcoming && ids.length >= m.target,
    reward: !m.upcoming && ids.length >= m.target ? m.reward : 0,
  }));
}
function reconcileMissions(state: State) {
  state.missionRewards = Object.fromEntries(
    missionProgress(state).map((m) => [m.id, m.reward]),
  );
  return state;
}
export function couponValid(
  c: Coupon,
  store: Store,
  date: Date,
  subtotal: number,
  items: Cart["items"],
  state: State,
  mode: Cart["mode"] = "pickup",
) {
  const k = kst(date);
  return (
    (mode === "delivery" ||
      ["open", "soon"].includes(businessStatus(store, date).code)) &&
    c.storeId === store.id &&
    c.start <= k.date &&
    c.end >= k.date &&
    (mode === "delivery" ||
      (k.minute >= mins(c.from) && k.minute <= mins(c.to))) &&
    subtotal >= c.min &&
    state.couponIssues.filter((i) => i.couponId === c.id && i.status === "used")
      .length < c.quantity &&
    (!c.excluded ||
      !items.some((i) =>
        text(store.menu.find((m) => m.id === i.menuId)!.name, "ko").includes(
          c.excluded,
        ),
      ))
  );
}
export function quote(
  state: State,
  cart: Cart,
  couponId: string,
  points: number,
  voucherId?: VoucherId | "",
  voucherAmount = 0,
) {
  const store = state.stores.find((s) => s.id === cart.storeId)!;
  const items = cart.items.map((i) => {
    const menu = store.menu.find((m) => m.id === i.menuId)!;
    const option = menu.options.find((o) => o.id === i.optionId);
    return {
      name: menu.name,
      option: option?.name,
      unit: menu.price + (option?.price ?? 0),
      quantity: Math.max(1, Math.floor(i.quantity)),
    };
  });
  const subtotal = items.reduce((a, i) => a + i.unit * i.quantity, 0);
  const shippingFee =
    cart.mode === "delivery" && store.delivery
      ? subtotal >= (store.freeShippingMin ?? 30000)
        ? 0
        : (store.shippingFee ?? 3000)
      : 0;
  const c = state.coupons.find((c) => c.id === couponId);
  const coupon =
    c &&
    couponValid(
      c,
      store,
      nowFor(state.clock),
      subtotal,
      cart.items,
      state,
      cart.mode,
    )
      ? c
      : undefined;
  const discount = coupon ? Math.min(subtotal, coupon.amount) : 0;
  const canPoints =
    subtotal >= store.pointMin &&
    (!coupon || (coupon.stack && store.stackPoints));
  const pointsUsed = canPoints
    ? Math.min(
        Math.max(0, Math.floor(points) || 0),
        balance(state, store.id),
        subtotal + shippingFee - discount,
      )
    : 0;
  const afterPoints = subtotal + shippingFee - discount - pointsUsed;
  const acceptedVoucher =
    voucherId && (store.vouchers ?? []).includes(voucherId)
      ? voucherId
      : undefined;
  const voucherUsed = acceptedVoucher
    ? Math.min(
        Math.max(0, Math.floor(voucherAmount) || 0),
        voucherBalance(state, acceptedVoucher),
        afterPoints,
      )
    : 0;
  const total = afterPoints - voucherUsed;
  return {
    items,
    subtotal,
    shippingFee,
    discount,
    pointsUsed,
    voucherId: voucherUsed > 0 ? acceptedVoucher : undefined,
    voucherUsed,
    total,
    couponId: coupon?.id,
    earn: Math.min(
      store.pointCap,
      Math.floor(
        (Math.max(0, subtotal - discount - pointsUsed) * store.rate) / 100,
      ),
    ),
  };
}
export function placeOrder(
  state: State,
  info: {
    couponId: string;
    points: number;
    pickupAt: string;
    request: string;
    method: string;
    shippingAddress?: ShippingAddress;
    voucherId?: VoucherId | "";
    voucherAmount?: number;
  },
): State {
  const cart = state.cart;
  if (!cart?.items.length) throw Error("EMPTY_CART");
  const store = state.stores.find((s) => s.id === cart.storeId)!;
  if (cart.mode === "delivery") {
    if (!store.delivery) throw Error("DELIVERY_UNAVAILABLE");
    const addr = info.shippingAddress;
    if (
      !addr ||
      !addr.recipient.trim() ||
      !addr.phone.trim() ||
      !addr.address.trim()
    )
      throw Error("INVALID_ADDRESS");
  } else {
    const status = businessStatus(store, nowFor(state.clock));
    if (!["open", "soon"].includes(status.code)) throw Error("STORE_CLOSED");
    if ((status.remaining ?? 0) <= store.hours.lastOrder)
      throw Error("LAST_ORDER_PASSED");
    if (
      cart.mode === "pickup" &&
      !pickupSlots(store, nowFor(state.clock)).includes(info.pickupAt)
    )
      throw Error("INVALID_SLOT");
    if (
      state.orders.filter(
        (o) =>
          o.storeId === store.id &&
          o.pickupAt === info.pickupAt &&
          o.createdAt.slice(0, 10) === kst(nowFor(state.clock)).date &&
          !["cancelled", "rejected", "refunded"].includes(o.status),
      ).length >= store.capacity
    )
      throw Error("SLOT_FULL");
  }
  if (
    cart.items.some((i) => store.menu.find((m) => m.id === i.menuId)?.soldOut)
  )
    throw Error("SOLD_OUT");
  const q = quote(
    state,
    cart,
    info.couponId,
    info.points,
    info.voucherId,
    info.voucherAmount ?? 0,
  );
  if (info.couponId && !q.couponId) throw Error("INVALID_COUPON");
  if (info.points > q.pointsUsed) throw Error("INVALID_POINTS");
  if (info.voucherId && !(store.vouchers ?? []).includes(info.voucherId))
    throw Error("INVALID_VOUCHER");
  if ((info.voucherAmount ?? 0) > q.voucherUsed)
    throw Error("INVALID_VOUCHER_AMOUNT");
  const id = `GG-${Date.now().toString(36).toUpperCase()}-${state.orders.length + 1}`;
  const date = kst(nowFor(state.clock)).date;
  const createdAt = `${date}T${hhmm(kst(nowFor(state.clock)).minute)}:00+09:00`;
  const order: Order = {
    id,
    storeId: store.id,
    mode: cart.mode,
    table: cart.mode === "table" ? "04" : undefined,
    ...q,
    createdAt,
    pickupAt: cart.mode === "delivery" ? "parcel-delivery" : info.pickupAt,
    request: info.request,
    shippingAddress:
      cart.mode === "delivery" ? info.shippingAddress : undefined,
    status: "requested",
    policy: {
      rate: store.rate,
      pointCap: store.pointCap,
      campaignCap: store.campaignCap,
      expiry: store.pointExpiry,
    },
  };
  return {
    ...state,
    cart: null,
    orders: [order, ...state.orders],
    payments: [
      ...state.payments,
      {
        orderId: id,
        method: info.method,
        amount: q.total,
        status: "demo_paid",
      },
    ],
    couponIssues: q.couponId
      ? [
          ...state.couponIssues,
          { couponId: q.couponId, orderId: id, status: "used" },
        ]
      : state.couponIssues,
    ledger: q.pointsUsed
      ? [
          ...state.ledger,
          {
            id: `${id}-spend`,
            storeId: store.id,
            orderId: id,
            amount: -q.pointsUsed,
            kind: "spend",
            createdAt,
          },
        ]
      : state.ledger,
    voucherLedger:
      q.voucherId && q.voucherUsed
        ? [
            ...(state.voucherLedger ?? []),
            {
              id: `${id}-vspend`,
              voucherId: q.voucherId,
              storeId: store.id,
              orderId: id,
              amount: -q.voucherUsed,
              kind: "spend",
              createdAt,
            },
          ]
        : (state.voucherLedger ?? []),
  };
}
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  requested: ["accepted", "rejected", "cancelled"],
  accepted: ["preparing", "cancelled"],
  preparing: ["ready", "cancelled"],
  ready: ["completed", "cancelled"],
  completed: ["refunded"],
  rejected: [],
  cancelled: [],
  refunded: [],
};
export function transitionOrder(
  state: State,
  id: string,
  status: OrderStatus,
): State {
  const old = state.orders.find((o) => o.id === id);
  if (!old || !transitions[old.status].includes(status)) return state;
  const date = nowFor(state.clock);
  const stamp = `${kst(date).date}T${hhmm(kst(date).minute)}:00+09:00`;
  const tracking =
    status === "ready" && old.mode === "delivery" && !old.trackingNumber
      ? `CJ-DEMO-${id.slice(-5)}`
      : old.trackingNumber;
  let next: State = {
    ...state,
    orders: state.orders.map((o) =>
      o.id === id
        ? {
            ...o,
            status,
            ...(tracking ? { trackingNumber: tracking } : {}),
            ...(status === "completed" ? { completedAt: stamp } : {}),
          }
        : o,
    ),
    ledger: [...state.ledger],
    voucherLedger: [...(state.voucherLedger ?? [])],
  };
  const add = (kind: PointLedger["kind"], amount: number) => {
    if (amount && !next.ledger.some((l) => l.id === `${id}-${kind}`))
      next.ledger.push({
        id: `${id}-${kind}`,
        storeId: old.storeId,
        orderId: id,
        amount,
        kind,
        createdAt: stamp,
        ...(kind === "earn"
          ? {
              expiresAt: kst(
                new Date(date.getTime() + old.policy.expiry * 86400000),
              ).date,
            }
          : {}),
      });
  };
  if (status === "completed") {
    const used = next.ledger
      .filter(
        (l) => l.storeId === old.storeId && ["earn", "revoke"].includes(l.kind),
      )
      .reduce((a, l) => a + l.amount, 0);
    add("earn", Math.min(old.earn, Math.max(0, old.policy.campaignCap - used)));
  }
  if (["cancelled", "rejected", "refunded"].includes(status)) {
    const earned = next.ledger.find((l) => l.id === `${id}-earn`)?.amount ?? 0;
    add("revoke", -earned);
    add("restore", old.pointsUsed);
    if (
      old.voucherId &&
      old.voucherUsed &&
      !next.voucherLedger!.some((v) => v.id === `${id}-vrestore`)
    )
      next.voucherLedger!.push({
        id: `${id}-vrestore`,
        voucherId: old.voucherId,
        storeId: old.storeId,
        orderId: id,
        amount: old.voucherUsed,
        kind: "restore",
        createdAt: stamp,
      });
    next.payments = state.payments.map((p) =>
      p.orderId === id ? { ...p, status: "demo_refunded" } : p,
    );
    next.couponIssues = state.couponIssues.map((c) =>
      c.orderId === id ? { ...c, status: "restored" } : c,
    );
  }
  return reconcileMissions(next);
}
const samples: { phrases: string[]; result: Text }[] = [
  {
    phrases: [
      "No cilantro, sauce on the side please.",
      "고수 제외, 소스 별도 요청",
    ],
    result: [
      "고수 제외, 소스 별도 요청",
      "No cilantro, sauce on the side please.",
      "不要香菜，酱汁请另放。",
      "パクチー抜き、ソースは別添えでお願いします。",
    ],
  },
  {
    phrases: ["No peanuts.", "땅콩 제외 요청"],
    result: [
      "땅콩 제외 요청",
      "No peanuts.",
      "不要花生。",
      "ピーナッツ抜きでお願いします。",
    ],
  },
  ...(
    [
      [
        "포장 가능한가요?",
        "Is takeaway available?",
        "可以打包吗？",
        "テイクアウトできますか？",
      ],
      [
        "수령 시간을 변경할 수 있나요?",
        "Can I change the pickup time?",
        "可以更改取餐时间吗？",
        "受取時間を変更できますか？",
      ],
      [
        "소스를 따로 받을 수 있나요?",
        "Can I get the sauce on the side?",
        "酱汁可以另放吗？",
        "ソースを別添えにできますか？",
      ],
      [
        "알레르기 확인이 필요합니다.",
        "I need an allergy check.",
        "我需要确认过敏原。",
        "アレルギーの確認が必要です。",
      ],
      ["확인하겠습니다.", "I will check.", "我会确认。", "確認いたします。"],
      ["가능합니다.", "Yes, that is possible.", "可以。", "可能です。"],
      [
        "어렵습니다.",
        "Sorry, that is not possible.",
        "抱歉，无法安排。",
        "申し訳ありませんが、できません。",
      ],
      [
        "준비에 10분 더 걸립니다.",
        "We need 10 more minutes.",
        "还需要10分钟。",
        "あと10分かかります。",
      ],
      [
        "주문이 준비되었습니다.",
        "Your order is ready.",
        "您的订单已备好。",
        "ご注文の準備ができました。",
      ],
    ] as Text[]
  ).map((result) => ({ phrases: [...result], result })),
];
export const quickQuestions = samples.slice(2, 6).map((s) => s.result);
export const quickReplies = samples.slice(6).map((s) => s.result);
export function translate(original: string, target: Lang) {
  const s = samples.find((s) =>
    s.phrases.some((p) => p.toLowerCase() === original.trim().toLowerCase()),
  );
  return s ? text(s.result, target) : null;
}
