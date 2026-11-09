import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Layers, LocateFixed, RotateCw } from "lucide-react";
import { mapAdapter as illustratedAdapter, type MapAdapterProps } from "./Map";
import { businessStatus, nowFor, text } from "./domain";
import { t } from "./i18n";
const Demo = illustratedAdapter.Component;
export function LiveMap(props: MapAdapterProps) {
  const [kind, setKind] = useState<"real" | "demo">("real");
  return (
    <div className="map-provider-shell">
      <div className="map-provider-tabs">
        <button
          className={kind === "real" ? "active" : ""}
          onClick={() => setKind("real")}
        >
          OpenStreetMap
        </button>
        <button
          className={kind === "demo" ? "active" : ""}
          onClick={() => setKind("demo")}
        >
          {props.lang === "ko" ? "데모 지도" : "Demo map"}
        </button>
      </div>
      {kind === "real" && !props.mapError ? (
        <StreetMap {...props} onFallback={() => setKind("demo")} />
      ) : (
        <Demo {...props} />
      )}
    </div>
  );
}
function StreetMap({
  stores,
  state,
  selected,
  onSelect,
  onSearch,
  onLocation,
  lang,
  onFallback,
}: MapAdapterProps & { onFallback: () => void }) {
  const element = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const select = useRef(onSelect);
  select.current = onSelect;
  const [tileState, setTileState] = useState<"loading" | "ready" | "error">(
    "loading",
  );
  const [zoom, setZoom] = useState(16);
  useEffect(() => {
    if (!element.current) return;
    let loaded = 0,
      failed = 0;
    const instance = L.map(element.current, {
      zoomControl: false,
      scrollWheelZoom: true,
    }).setView([37.546, 127.0514], 16);
    map.current = instance;
    L.control.zoom({ position: "topright" }).addTo(instance);
    const tiles = L.tileLayer(
      "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      {
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors',
      },
    ).addTo(instance);
    tiles.on("tileload", () => {
      loaded++;
      setTileState("ready");
    });
    tiles.on("tileerror", () => {
      failed++;
      if (!loaded && failed >= 3) setTileState("error");
    });
    const timer = setTimeout(() => {
      if (!loaded) setTileState("error");
    }, 15000);
    layer.current = L.layerGroup().addTo(instance);
    instance.on("zoomend", () => setZoom(instance.getZoom()));
    const observer = new ResizeObserver(() => instance.invalidateSize());
    observer.observe(element.current);
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      instance.remove();
      map.current = null;
      layer.current = null;
    };
  }, []);
  useEffect(() => {
    const instance = map.current,
      markers = layer.current;
    if (!instance || !markers) return;
    markers.clearLayers();
    const groups: (typeof stores)[] = [];
    for (const store of stores) {
      const point = instance.project([store.lat, store.lng], zoom);
      const group =
        zoom < 19 && store.id !== selected
          ? groups.find((g) => {
              if (g[0].id === selected) return false;
              const other = instance.project([g[0].lat, g[0].lng], zoom);
              return (
                Math.abs(point.x - other.x) < 145 &&
                Math.abs(point.y - other.y) < 64
              );
            })
          : undefined;
      if (group) group.push(store);
      else groups.push([store]);
    }
    for (const group of groups) {
      const s = group[0];
      const status = businessStatus(s, nowFor(state.clock));
      const container = document.createElement("div");
      container.className = `live-store-pin ${selected === s.id ? "selected" : ""}`;
      if (group.length > 1) {
        container.textContent = String(group.length);
        container.classList.add("live-cluster");
      } else {
        const dot = document.createElement("i");
        dot.className = `status-${status.code}`;
        const title = document.createElement("b");
        title.textContent = text(s.name, lang);
        const small = document.createElement("small");
        small.textContent = `${t(status.code, lang)} · ${s.rate}%`;
        container.append(dot, title, small);
      }
      const marker = L.marker([s.lat, s.lng], {
        icon: L.divIcon({
          html: container,
          className: "live-pin-wrapper",
          iconSize: group.length > 1 ? [42, 42] : [140, 53],
          iconAnchor: group.length > 1 ? [21, 21] : [70, 53],
        }),
        title: group.length > 1 ? `${group.length} stores` : text(s.name, lang),
        keyboard: true,
        zIndexOffset: selected === s.id ? 1000 : 0,
      }).addTo(markers);
      marker.on("click", () => {
        if (group.length > 1)
          instance.setView([s.lat, s.lng], Math.min(19, zoom + 1));
        else select.current(s.id);
      });
    }
  }, [stores, state.clock, selected, lang, zoom]);
  return (
    <div className="live-map-surface">
      <div
        ref={element}
        className="live-map-canvas"
        aria-label="OpenStreetMap 실제 지도"
      />
      <div className="live-map-disclaimer">
        <span className="live-dot" />
        {lang === "ko"
          ? "실제 배경 지도 · 매장·핀 위치는 가상 데이터"
          : "Real basemap · fictional stores & locations"}
      </div>
      <button
        className="search-area live-search-area"
        onClick={() => {
          const bounds = map.current?.getBounds();
          if (bounds)
            onSearch({
              left: (bounds.getWest() - 127.049) / 0.000003,
              right: (bounds.getEast() - 127.049) / 0.000003,
              top: (bounds.getSouth() - 37.544) / 0.000003,
              bottom: (bounds.getNorth() - 37.544) / 0.000003,
            });
        }}
      >
        <RotateCw size={15} />
        {t("searchHere", lang)}
      </button>
      <div className="live-map-buttons">
        <button aria-label={t("location", lang)} onClick={onLocation}>
          <LocateFixed size={20} />
        </button>
        <button
          aria-label={t("resetFilters", lang)}
          onClick={() => {
            map.current?.setView([37.546, 127.0514], 16);
            onSearch({ left: 0, right: 1400, top: 0, bottom: 1000 });
          }}
        >
          <Layers size={20} />
        </button>
      </div>
      {tileState === "loading" && (
        <span className="map-loading-note">
          {t("loading", lang)} · OpenStreetMap
        </span>
      )}
      {tileState === "error" && (
        <div className="map-network-error" role="status">
          <b>
            {lang === "ko"
              ? "지도 네트워크 연결을 확인해 주세요"
              : "Map network unavailable"}
          </b>
          <p>
            {lang === "ko"
              ? "목록 탐색은 계속 사용할 수 있습니다."
              : "You can continue using the store list."}
          </p>
          <button className="secondary" onClick={onFallback}>
            {lang === "ko"
              ? "조작 가능한 데모 지도로 전환"
              : "Use interactive demo map"}
          </button>
        </div>
      )}
    </div>
  );
}
