import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import styles from "@/app/home.module.css";
import { TrackedLink } from "@/components/tracked-link";
import { PageViewTracker } from "@/components/page-view-tracker";
import { LandingFooter } from "@/components/landing-footer";
import { LandingNav } from "@/components/landing-nav";
import { DeadlineBar, DeadlinesSection } from "@/components/regulatory-deadlines";
import { BandZone } from "@/components/home/band-zone";
import { ExampleDashboard } from "@/components/home/example-dashboard";
import { Arrow, PenNote } from "@/components/home/pen-note";
import { SendrowMark } from "@/components/home/sendrow-mark";

export default async function Home() {
  const user = await currentUser();
  if (user) redirect(user.role === "consultant" ? "/consultant" : "/onboarding");

  const today = new Date().toISOString().slice(0, 10);

  return (
    <main>
      <PageViewTracker />

      <DeadlineBar today={today} />
      <LandingNav />

      <div className={styles.home}>
        {/* Hero: headline and exploded stack */}
        <section className={styles.hero} aria-label="Introduction">
          <div className={styles.wrap}>
            <div className={`${styles.grid} ${styles.heroRow}`}>
              <h1 className={styles.h1}>Your clients’ emissions data, every number traced to its bill.</h1>

              <div className={styles.heroSub}>
                <p className={styles.lede}>
                  For sustainability consultants. Send a client one link and they upload bills and invoices, no account
                  needed. Sendrow calculates CO2e with sourced factors. You review every number and freeze a dated
                  snapshot under your own brand.
                </p>
                <div className={`${styles.actions} ${styles.heroActions}`}>
                  <TrackedLink href="/signup" event="hero_get_started_click" className={`${styles.btn} ${styles.btnPrimary}`}>
                    Get started
                  </TrackedLink>
                  <TrackedLink href="/demo" event="hero_book_demo_click" className={`${styles.btn} ${styles.btnSecondary}`}>
                    Book a demo
                  </TrackedLink>
                </div>
              </div>

              <figure className={styles.stage}>
                <div className={styles.stageBox}>
                  <div className={styles.stack3d}>
                    <div className={`${styles.layer} ${styles.layerRow}`}>
                      <p className={styles.lyT}>Electricity, Fresno plant</p>
                      <p className={styles.lyBig}>
                        8.61<span className={styles.unit}>tCO2e</span>
                      </p>
                      <p className={styles.lyF}>
                        41,180 kWh × 0.000209 tCO2e/kWh = <span className={styles.nw}>8.61 tCO2e</span>
                      </p>
                      <p className={styles.lyM}>Reviewed by J. Rivera, Feb 17, 2026</p>
                    </div>
                    <div className={`${styles.layer} ${styles.layerFac}`}>
                      <p className={styles.lyT}>eGRID CAMX (California)</p>
                      <p className={styles.lyF}>0.000209 tCO2e/kWh</p>
                      <p className={styles.lyM}>EPA eGRID, 2024</p>
                      <p className={styles.lyM}>Location-based, eGRID subregion CAMX</p>
                    </div>
                    <div className={`${styles.layer} ${styles.layerBill}`}>
                      <p className={styles.lyT}>PG&amp;E electric bill, Mar 2025</p>
                      <p className={styles.lyM}>Fresno plant</p>
                      <p className={styles.lyHi}>41,180 kWh</p>
                      <p className={styles.lyFile}>pge-fresno-elec-2025-03.pdf</p>
                    </div>
                  </div>
                  <PenNote className={styles.nBill} text="every row links to the bill it came from">
                    <Arrow d="M46 6 C34 8 18 16 8 34 M8 34 L20 30 M8 34 L11 22" w={50} h={42} />
                  </PenNote>
                </div>
                <figcaption className={styles.caption}>Example data. Factor values are illustrative.</figcaption>
              </figure>

              <PenNote className={styles.heroNote} text="click any row, see the bill behind it">
                <Arrow d="M18 6 C10 52 40 104 110 118 M96 114 L110 120 L104 104" w={150} h={130} />
              </PenNote>
            </div>
          </div>
        </section>

        <BandZone>
          <ExampleDashboard />

          {/* Worked examples */}
          <section className={styles.worked} aria-labelledby="worked-h2">
            <div className={styles.wrap}>
              <div className={styles.workedHead}>
                <h2 id="worked-h2" className={styles.h2}>
                  Three numbers, traced
                </h2>
                <p className={styles.intro}>Each one is an example of what the trace shows at review.</p>
              </div>

              <article className={styles.ex}>
                <h3 className={styles.exTitle}>Electricity, with its bill attached</h3>
                <div className={styles.exRow}>
                  <div className={`${styles.doc} ${styles.exDoc}`}>
                    <p className={styles.docHead}>PG&amp;E</p>
                    <p className={`${styles.docLine} ${styles.docStrong}`}>Statement for Harbor Valley Foods, Fresno plant</p>
                    <p className={styles.docLine}>Electric usage: 41,180 kWh</p>
                  </div>
                  <div className={`${styles.rec} ${styles.exRec}`}>
                    <p className={styles.recF}>
                      41,180 kWh × 0.000209 tCO2e/kWh = <mark className={styles.markHi}>8.61 tCO2e</mark>
                    </p>
                    <p>Factor: eGRID CAMX (California), EPA eGRID, 2024</p>
                  </div>
                  <div className={styles.exNote}>
                    <PenNote text="the bill is attached to the row">
                      <Arrow className={styles.arrWide} d="M440 50 C300 60 120 46 14 16 M14 16 L28 16 M14 16 L22 30" w={452} h={62} />
                      <Arrow className={styles.arrUp} d="M52 46 C50 28 36 16 14 8 M14 8 L28 10 M14 8 L19 22" w={64} h={50} />
                    </PenNote>
                  </div>
                </div>
              </article>

              <article className={styles.ex}>
                <h3 className={styles.exTitle}>Diesel bought in dollars</h3>
                <div className={styles.exRow}>
                  <div className={`${styles.doc} ${styles.exDoc}`}>
                    <p className={styles.docHead}>Diesel purchases, Mar 2025</p>
                    <div className={styles.docTotal}>
                      <span>Total</span>
                      <span>$3,151.20</span>
                    </div>
                  </div>
                  <div className={`${styles.rec} ${styles.exRec}`}>
                    <p>
                      $3,151.20 at $3.90 per gallon = <mark className={styles.markHi}>808 gal</mark>
                    </p>
                    <p className={styles.recF}>808 gal × 0.01021 tCO2e/gal = 8.25 tCO2e</p>
                  </div>
                  <div className={styles.exNote}>
                    <PenNote text="price per gallon kept with the row">
                      <Arrow className={styles.arrWide} d="M440 50 C300 60 120 46 14 16 M14 16 L28 16 M14 16 L22 30" w={452} h={62} />
                      <Arrow className={styles.arrUp} d="M52 46 C50 28 36 16 14 8 M14 8 L28 10 M14 8 L19 22" w={64} h={50} />
                    </PenNote>
                  </div>
                </div>
              </article>

              <article className={styles.ex}>
                <h3 className={styles.exTitle}>A corrected bill</h3>
                <div className={styles.exRow}>
                  <div className={`${styles.doc} ${styles.exDoc}`}>
                    <p className={styles.docHead}>PG&amp;E</p>
                    <p className={`${styles.docLine} ${styles.docStrong}`}>Corrected statement: Stockton warehouse, Mar 2025</p>
                    <p className={styles.docLine}>Electric usage: 19,519 kWh (was 18,849 kWh)</p>
                  </div>
                  <div className={`${styles.rec} ${styles.exRec}`}>
                    <p>
                      Row 2: 3.94 became <mark className={styles.markHi}>4.08 tCO2e</mark>
                    </p>
                    <p>March: 41.02 became 41.16 tCO2e</p>
                    <p>FY2025 v2 created at 539.73 tCO2e. v1 unchanged.</p>
                  </div>
                  <div className={styles.exNote}>
                    <PenNote text="the 1 recipient of v1 got an alert">
                      <Arrow className={styles.arrWide} d="M440 50 C300 60 120 46 14 16 M14 16 L28 16 M14 16 L22 30" w={452} h={62} />
                      <Arrow className={styles.arrUp} d="M52 46 C50 28 36 16 14 8 M14 8 L28 10 M14 8 L19 22" w={64} h={50} />
                    </PenNote>
                  </div>
                </div>
              </article>
            </div>
          </section>
        </BandZone>

        {/* How a request runs, with the portal mock */}
        <section className={styles.sec} id="how" aria-labelledby="how-h2" style={{ scrollMarginTop: 24 }}>
          <div className={styles.wrap}>
            <h2 id="how-h2" className={styles.h2}>
              How a request runs
            </h2>
            <div className={`${styles.grid} ${styles.howG}`}>
              <div className={styles.stepsCol}>
                <ol className={styles.steps}>
                  <li>
                    <h3 className={styles.stepH}>1. Send a request</h3>
                    <p>
                      Choose what you need: electricity and gas, fleet fuel, spend, travel or a commute survey. Your client
                      gets one link, in your brand.
                    </p>
                  </li>
                  <li>
                    <h3 className={styles.stepH}>2. Your client uploads</h3>
                    <p>
                      They upload bills, invoices, fuel card exports or spreadsheets, or type the numbers in, without making
                      an account. Sendrow sends reminders until they finish.
                    </p>
                  </li>
                  <li>
                    <h3 className={styles.stepH}>3. Review every number</h3>
                    <p>
                      Each row shows its source document, the factor (name, value, source and year) and the formula. Fix or
                      exclude a row and Sendrow logs the change.
                    </p>
                  </li>
                  <li>
                    <h3 className={styles.stepH}>4. Freeze and share</h3>
                    <p>
                      Approve a dated snapshot and share a PDF in your brand, an Excel export that adds up to the totals, or a
                      read-only link. A shared snapshot never changes. If you correct it later, Sendrow makes a new snapshot
                      and alerts everyone who had the old one.
                    </p>
                  </li>
                </ol>
              </div>

              <div className={styles.portalCol}>
                <PenNote className={styles.portalNote} text="your brand at the top">
                  <Arrow d="M60 6 C50 26 34 40 12 48 M12 48 L26 44 M12 48 L18 34" w={70} h={56} />
                </PenNote>
                <div className={styles.portal}>
                  <div className={styles.portalTop}>
                    <SendrowMark size={22} />
                    <span>Cedar &amp; Pine Advisory</span>
                  </div>
                  <div className={styles.portalBody}>
                    <p className={styles.portalTitle}>Harbor Valley Foods: FY2025 data request</p>
                    <ul className={styles.portalItems}>
                      <li>
                        <span>Electricity and gas</span>
                        <span>Received Feb 12, 2026</span>
                      </li>
                      <li>
                        <span>Fleet fuel</span>
                        <span>Received Feb 13, 2026</span>
                      </li>
                      <li>
                        <span>Spend data</span>
                        <span>Waiting (reminder sent Feb 20, 2026)</span>
                      </li>
                    </ul>
                    <div className={styles.drop}>Drop bills or invoices here</div>
                  </div>
                  <p className={styles.portalFoot}>Powered by Sendrow</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <DeadlinesSection today={today} />

        {/* For clients */}
        <section className={styles.clients} aria-labelledby="clients-h2">
          <div className={`${styles.wrap} ${styles.grid}`}>
            <div className={styles.clientBox}>
              <h2 id="clients-h2" className={styles.h2Sm}>
                Got a request from your consultant?
              </h2>
              <p className={styles.clientP}>
                <mark className={styles.markHi}>You don’t need an account.</mark> Open the link in their email to upload
                your files. If you lost it, ask your consultant to resend it.
              </p>
              <p className={styles.clientMatch}>
                No consultant yet?{" "}
                <Link href="/get-matched" className={styles.inlineLink}>
                  Get matched
                </Link>
              </p>
            </div>
          </div>
        </section>

        {/* Close */}
        <section className={styles.close} aria-labelledby="close-h2">
          <div className={styles.wrap}>
            <h2 id="close-h2" className={styles.h2Xl}>
              Send your first request.
            </h2>
            <p>Add your brand, add a client, send the link.</p>
            <div className={`${styles.actions} ${styles.closeActions}`}>
              <TrackedLink href="/signup" event="close_get_started_click" className={`${styles.btn} ${styles.btnPrimary}`}>
                Get started
              </TrackedLink>
              <TrackedLink href="/demo" event="close_book_demo_click" className={`${styles.btn} ${styles.btnSecondary}`}>
                Book a demo
              </TrackedLink>
            </div>
          </div>
        </section>
      </div>

      <LandingFooter />
    </main>
  );
}
