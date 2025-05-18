// components/Layout.jsx
import Link from 'next/link';

export default function Layout({ children }) {
  return (
    <div>
      <nav style={{ padding: "1rem", borderBottom: "1px solid #ccc" }}>
        <Link href="/">🏠 Home</Link> | <Link href="/notes">📝 Notes</Link>
      </nav>
      <main style={{ padding: "1rem" }}>{children}</main>
    </div>
  );
}
