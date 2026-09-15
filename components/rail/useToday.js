import { useEffect, useState } from 'react';

/**
 * Today's date as an ISO string — but only once the page is on the client.
 *
 * A statically exported page is rendered once at build time, so anything that
 * depends on "today" (a countdown, an "open now" badge) would be frozen at the
 * build date and, worse, differ from what the browser renders and trip a
 * hydration mismatch. Returning null on the server and on the first client
 * render keeps both identical; the real date arrives one effect later.
 */
export default function useToday() {
  const [today, setToday] = useState(null);
  useEffect(() => {
    const now = new Date();
    setToday(
      `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
    );
  }, []);
  return today;
}
