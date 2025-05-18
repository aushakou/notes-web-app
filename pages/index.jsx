import Link from 'next/link';

export default function Home() {
  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Welcome!</h1>

      <nav style={{ marginTop: "2rem" }}>
        <ul>
          <li><Link href="/notes">Notes App</Link></li>
          <li><Link href="/public">Public Notes Page</Link></li>
        </ul>
      </nav>
    </main>
  );
}
