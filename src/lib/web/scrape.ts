// lib/web/scrape.ts
export async function scrapeWeb(query: string): Promise<string> {
  try {
    const res = await fetch(
      `http://157.230.39.117:3001/scrape?q=${encodeURIComponent(query)}`,
      {
        headers: {
          "x-api-key": process.env.SCRAPER_API_KEY!,
        },
        next: { revalidate: 60 }, // Optional cache control
      }
    );

    if (!res.ok) throw new Error(`Scraper error: ${res.statusText}`);

    const data = await res.text(); // or .json() if your scraper returns JSON
    return data;
  } catch (err) {
    console.error("Scraper failed:", err);
    return "Sorry, I couldn't find that online.";
  }
}
