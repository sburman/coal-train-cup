import Link from "next/link";
import HomeStats from "./HomeStats";

export const dynamic = "force-dynamic";

export default function HomePage() {

  return (
    <>
      <div style={{ marginBottom: "1.5rem" }}>
        {/* Add public/brlogo.jpeg for logo */}
        <img
          src="/brlogo.jpeg"
          alt="Boom Rookies"
          width={300}
          style={{ maxWidth: "100%", height: "auto" }}
        />
      </div>
      <p style={{ fontStyle: "italic", marginBottom: "1rem" }}>
        Join the{" "}
        <Link href="https://www.patreon.com/nrlboomrookies" target="_blank" rel="noopener">
          patreon
        </Link>
        , to access the competition!
      </p>
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <p>Congrats to the 2025 Coal Train Cup winner!</p>
      <h2 style={{ margin: "0.5rem 0 1rem", color: "var(--primary)" }}>🏆 Paul Mac</h2>
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <p>Congrats to the 2025 Siliva Shield winner!</p>
      <h2 style={{ margin: "0.5rem 0 1rem", color: "var(--primary)" }}>🛡️ Kyle (damiencooked)</h2>
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <h2 style={{ marginBottom: "0.5rem" }}>Coal Train Cup weekly competition rules</h2>
      <ul style={{ marginLeft: "1.25rem", marginBottom: "1rem" }}>
        <li>Return to this site weekly to submit one tip per round</li>
        <li>If you choose to submit again, your previous tip will be replaced</li>
        <li>You can&apos;t tip <em>for</em> the same team in consecutive rounds</li>
        <li>You can&apos;t tip <em>against</em> the same team in consecutive rounds</li>
      </ul>
      <h2 style={{ marginBottom: "0.5rem" }}>End of season compliance</h2>
      <p style={{ marginBottom: "1rem" }}>
        After 27 rounds, you must have:
      </p>
      <ul style={{ marginLeft: "1.25rem", marginBottom: "1rem" }}>
        <li>tipped 13 home teams and 13 away teams (magic round counts as neutral)</li>
        <li>tipped every team at least once</li>
        <li>tipped no single team more than 3 times</li>
      </ul>
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <HomeStats />
      <hr style={{ borderColor: "rgba(255,255,255,0.2)", margin: "1rem 0" }} />
      <p style={{ fontSize: "0.875rem", opacity: 0.8 }}>version: 2026.1.1</p>
    </>
  );
}
