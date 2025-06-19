import { load } from "cheerio";
import fs from "fs";
import path from "path";

type JDrama = {
  title: string;
  url: string;
};

const BASE_URL = "https://mydramalist.com";
const SEARCH_URL = "https://mydramalist.com/search";

const START_YEAR = 2004;
const END_YEAR = 2024;
const RESULTS_PER_YEAR = 15;

const jdramasByYear: Record<string, JDrama[]> = {};

async function fetchTopDramas(year: number): Promise<JDrama[]> {
  console.log(`Fetching top dramas for year ${year}...`);

  // Build URL with filters: type=68 (drama), country=1 (Japan), sort=top, year filter
  const url = `${SEARCH_URL}?adv=titles&ty=68&co=1&re=${year},${year}&so=top`;
  // const url = `${SEARCH_URL}?adv=titles&ty=68&co=1&re=${year},${year}&so=popular`;
  
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`Failed to fetch data for year ${year}: ${res.statusText}`);
    return [];
  }

  const html = await res.text();
  const $ = load(html);

//   fs.writeFileSync(`debug-${year}.html`, html);

  const dramas: JDrama[] = [];

    $(".item a.block").each((_, el) => {
    if (dramas.length >= RESULTS_PER_YEAR) return;

    const href = $(el).attr("href");
    const img = $(el).find("img");
    const title = img.attr("alt")?.trim();

    if (title && href && href.startsWith("/")) {
        dramas.push({
        title,
        url: BASE_URL + href,
        });
    }
    });

  return dramas;
}

async function main() {
  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const dramas = await fetchTopDramas(year);
    jdramasByYear[year] = dramas;
  }

  const outputPath = path.resolve("jdramas-by-year.ts");
  const outputContent =
    `export const jdramasByYear = ${JSON.stringify(jdramasByYear, null, 2)};\n`;

  fs.writeFileSync(outputPath, outputContent);
  console.log(`✅ Saved top dramas by year to ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
