import { ThemeProvider } from '@/context/ThemeContext';
import NoBounceBehavior from '@/components/layout/NoBounceBehavior';
import '@/styles/globals.css';

export default function App({ Component, pageProps }) {
  return (
    <ThemeProvider>
      <NoBounceBehavior />
      <Component {...pageProps} />
    </ThemeProvider>
  );
}