import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { loadPostcode, type AddressResult } from "./services";
export function AddressSearch({
  onSelect,
}: {
  onSelect: (value: AddressResult) => void;
}) {
  const [opened, setOpened] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const container = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  useEffect(() => {
    if (!opened) return;
    let cancelled = false;
    setLoading(true);
    setError("");
    loadPostcode()
      .then(() => {
        if (cancelled || !container.current) return;
        new window.daum!.Postcode({
          oncomplete: (data) => {
            onSelectRef.current(data);
            setOpened(false);
            button.current?.focus();
          },
        }).embed(container.current);
        setLoading(false);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e.message);
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [opened]);
  return (
    <div className="address-search">
      <button
        type="button"
        ref={button}
        className="secondary"
        onClick={() => setOpened(!opened)}
      >
        <Search size={15} />
        도로명 주소 검색 <small>Daum</small>
      </button>
      {opened && (
        <div className="address-search-panel">
          <div>
            <b>실제 도로명 주소 검색</b>
            <button
              type="button"
              aria-label="주소 검색 닫기"
              onClick={() => {
                setOpened(false);
                button.current?.focus();
              }}
            >
              <X size={17} />
            </button>
          </div>
          {loading && <p role="status">주소 검색 서비스에 연결 중…</p>}
          {error && (
            <p role="alert" className="form-error">
              {error}
            </p>
          )}
          <div ref={container} style={{ height: loading || error ? 0 : 400 }} />
        </div>
      )}
    </div>
  );
}
