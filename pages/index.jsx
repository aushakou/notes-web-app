import Link from 'next/link';

export default function Home() {
  return (
    <main className="p-4 m-4">
      <h1>Welcome!</h1>

      <nav className="p-4 m-4">
        <ul>
          <li><Link href="/notes">Notes App</Link></li>
          <li><Link href="/public">Public Notes Page</Link></li>
        </ul>
      </nav>
    </main>
  );
}
