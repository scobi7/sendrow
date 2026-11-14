"use client";

import { useEffect, useRef, useState } from "react";
import styles from "@/app/home.module.css";
import { LEDGER, TOTALS, TRACE } from "./example-data";
import { Arrow, PenNote } from "./pen-note";
import { SendrowMark } from "./sendrow-mark";

type FreezeState = "idle" | "preview" | "frozen";
type FocusTarget = "open" | "ok" | "done";

/**
 * The example dashboard. Selecting a row updates the "How calculated" trace.
 * Freeze shows the preview first, then the frozen state. All client-side, no backend.
 */
export function ExampleDashboard() {
  const [selected, setSelected] = useState(0);
  const [freeze, setFreeze] = useState<FreezeState>("idle");

  const openRef = useRef<HTMLButtonElement>(null);
  const okRef = useRef<HTMLButtonElement>(null);
  const doneRef = useRef<HTMLParagraphElement>(null);
  const focusNext = useRef<FocusTarget | null>(null);

  // Move focus only after a user action, so the page never jumps on load.
  useEffect(() => {
    const target = focusNext.current;
    if (!target) return;
    focusNext.current = null;
    const el = target === "open" ? openRef.current : target === "ok" ? okRef.current : doneRef.current;
    el?.focus();
  }, [freeze]);

  const trace = TRACE[selected];

  return (
    <section className={styles.example} id="example" aria-label="Example data request">
      <div className={styles.wrap}>
        <div className={styles.frameWrap}>
          <div className={`${styles.sheet} ${styles.sheetSnap}`} aria-hidden="true">
            Snapshot FY2025 v1
          </div>
          <div className={`${styles.sheet} ${styles.sheetPortal}`} aria-hidden="true">
            Client portal: Harbor Valley Foods, FY2025 data request
          </div>

          <div className={styles.frame} data-frame>
            <aside className={styles.side} aria-label="Consultant workspace">
              <div className={styles.sideBrand}>
                <SendrowMark size={26} />
                <span>Cedar &amp; Pine Advisory</span>
              </div>
              <ul className={styles.sideList}>
                <li className={styles.sideOn}>Clients</li>
                <li>Compliance calendar</li>
                <li>Request templates</li>
                <li>Format library</li>
                <li>Settings</li>
              </ul>
            </aside>

            <div className={styles.main}>
              <p className={styles.crumb}>Clients / Harbor Valley Foods</p>
              <h2 className={styles.appTitle}>Harbor Valley Foods</h2>
              <PenNote className={styles.nReq} text="your client never makes an account">
                <Arrow className={styles.arrowReq} d="M48 6 C36 4 18 14 7 32 M7 32 L19 30 M7 32 L12 21" w={52} h={44} />
              </PenNote>
              <p className={styles.req}>FY2025 data request, sent Feb 3, 2026. 2 of 3 items received.</p>

              <div className={styles.tabs}>
                <span>Overview</span>
                <span className={styles.tabOn}>Data ledger</span>
                <span>Review</span>
                <span>Activity</span>
                <span>Enter data</span>
              </div>

              <div className={styles.totals}>
                {TOTALS.map((t) => (
                  <div key={t.label}>
                    <span className={styles.totL}>{t.label}</span>
                    <span className={styles.totV}>
                      {t.value}
                      <span className={styles.totU}>tCO2e</span>
                    </span>
                  </div>
                ))}
              </div>

              <PenNote className={styles.nSrc} text="the bill is attached to the row">
                <Arrow className={styles.arrowSrc} d="M70 62 C66 40 36 22 14 8 M14 8 L28 12 M14 8 L21 22" w={80} h={66} />
              </PenNote>

              <div className={styles.ledgerWrap} data-scroll-x>
                <table className={styles.ledger}>
                  <caption className={styles.srOnly}>
                    Ledger rows for March 2025. Select a row to see how its number is calculated.
                  </caption>
                  <thead>
                    <tr>
                      <th scope="col">Activity and site</th>
                      <th scope="col">Source document</th>
                      <th scope="col" className={styles.num}>Quantity</th>
                      <th scope="col">Factor</th>
                      <th scope="col" className={styles.num}>tCO2e</th>
                      <th scope="col">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {LEDGER.map((row, i) => {
                      const on = i === selected;
                      return (
                        <tr key={`${row.activity}-${row.site}`} className={on ? styles.rowSel : undefined}>
                          <td>
                            <button
                              type="button"
                              className={styles.rowBtn}
                              aria-pressed={on}
                              onClick={() => setSelected(i)}
                            >
                              {row.activity}
                              <span className={styles.sub}>{row.site}</span>
                            </button>
                          </td>
                          <td>{row.source}</td>
                          <td className={styles.num}>{row.quantity}</td>
                          <td>
                            {row.factorName}
                            <span className={styles.sub}>{row.factorValue}</span>
                          </td>
                          <td className={styles.num}>{row.tco2e}</td>
                          <td>
                            <span className={row.needsReview ? styles.stNeed : styles.st}>{row.status}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <aside className={styles.panel} aria-labelledby="calc-title">
              <h3 id="calc-title" className={styles.panelH}>How calculated</h3>
              <p className={styles.big}>
                {trace.value}
                <span className={styles.unit}>tCO2e</span>
              </p>
              <p className={styles.formula}>{trace.formula}</p>
              <dl className={styles.kv}>
                <div>
                  <dt>Activity</dt>
                  <dd>{trace.activity}</dd>
                </div>
                <div>
                  <dt>Source document</dt>
                  <dd>
                    <span>{trace.source}</span>
                    <span className={styles.fakeLink}>{trace.file}</span>
                  </dd>
                </div>
                <div>
                  <dt>Factor</dt>
                  <dd>{trace.factor}</dd>
                </div>
                <div>
                  <dt>Method</dt>
                  <dd>{trace.method}</dd>
                </div>
                <div>
                  <dt>Uploaded</dt>
                  <dd>{trace.uploaded}</dd>
                </div>
                <div>
                  <dt>Reviewed</dt>
                  <dd>{trace.reviewed}</dd>
                </div>
                {trace.note && (
                  <div>
                    <dt>Note</dt>
                    <dd>{trace.note}</dd>
                  </div>
                )}
              </dl>

              <PenNote className={styles.nFrz} text="frozen snapshots never change">
                <Arrow className={styles.arrowFrz} d="M70 60 C72 36 50 18 26 6 M26 6 L40 10 M26 6 L30 20" w={80} h={64} />
              </PenNote>

              <div className={styles.freeze}>
                {freeze === "idle" && (
                  <button
                    ref={openRef}
                    type="button"
                    className={`${styles.btn} ${styles.btnSecondary}`}
                    onClick={() => {
                      focusNext.current = "ok";
                      setFreeze("preview");
                    }}
                  >
                    Freeze FY2025 v1
                  </button>
                )}
                {freeze === "preview" && (
                  <div>
                    <p className={styles.previewText}>
                      Freeze FY2025 v1? 72 rows, 539.59 tCO2e. A frozen snapshot never changes. If you correct it later,
                      Sendrow creates v2 and alerts everyone you shared v1 with.
                    </p>
                    <div className={styles.actions}>
                      <button
                        ref={okRef}
                        type="button"
                        className={`${styles.btn} ${styles.btnPrimary}`}
                        onClick={() => {
                          focusNext.current = "done";
                          setFreeze("frozen");
                        }}
                      >
                        Freeze snapshot
                      </button>
                      <button
                        type="button"
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        onClick={() => {
                          focusNext.current = "open";
                          setFreeze("idle");
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {freeze === "frozen" && (
                  <p ref={doneRef} tabIndex={-1} className={styles.frozen}>
                    Frozen Mar 2, 2026. FY2025 v1, 539.59 tCO2e.
                  </p>
                )}
              </div>
            </aside>
          </div>

          <p className={styles.caption}>
            Click any row to see where its number came from. Example data. Factor values are illustrative.
          </p>
        </div>
      </div>
    </section>
  );
}
