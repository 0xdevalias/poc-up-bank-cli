#!/usr/bin/env node_modules/.bin/tsx

// TODO: add option to --since and --until (or a new param) to give a financial year/related range?
// TODO: add --dry-run arg?
// TODO: add --pretty arg to pretty print JSON output?
// TODO: should we use a middleware or similar to handle pretty print/etc of results somehow?
//  That way we could just return the raw result object or similar from each command and not have to repeat ourselves each time

// TODO: Explore the following yargs features:
//   https://yargs.js.org/docs/#api-reference-configkey-description-parsefn
//   https://yargs.js.org/docs/#api-reference-pkgconfkey-cwd
//   https://yargs.js.org/docs/#api-reference-envprefix
//   https://yargs.js.org/docs/#api-reference-conflictsx-y
//   https://yargs.js.org/docs/#api-reference-hidekey
//   https://yargs.js.org/docs/#api-reference-epiloguestr
//   https://yargs.js.org/docs/#api-reference-examplecmd-desc
//   https://yargs.js.org/docs/#api-reference-failfn-boolean
//   https://yargs.js.org/docs/#api-reference-groupkeys-groupname
//   https://yargs.js.org/docs/#api-reference-middlewarecallbacks-applybeforevalidation

import dotenv from "dotenv";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import {
  default as originalFetch,
  RequestInfo,
  RequestInit,
  Response,
} from "node-fetch";
import { parseISO, isValid, startOfDay, endOfDay } from "date-fns";

// Load environment variables
dotenv.config();

const BASE_URL = "https://api.up.com.au/api/v1";
const UP_API_ACCESS_TOKEN = process.env.UP_API_ACCESS_TOKEN;

// List of valid categories manually extracted from the API 2023-05-31
//   https://developer.up.com.au/#get_categories
const CATEGORIES = [
  "games-and-software",
  "car-insurance-and-maintenance",
  "family",
  "good-life",
  "groceries",
  "booze",
  "clothing-and-accessories",
  "cycling",
  "homeware-and-appliances",
  "personal",
  "education-and-student-loans",
  "events-and-gigs",
  "fuel",
  "home",
  "internet",
  "fitness-and-wellbeing",
  "hobbies",
  "home-maintenance-and-improvements",
  "parking",
  "transport",
  "gifts-and-charity",
  "holidays-and-travel",
  "pets",
  "public-transport",
  "hair-and-beauty",
  "lottery-and-gambling",
  "home-insurance-and-rates",
  "car-repayments",
  "health-and-medical",
  "pubs-and-bars",
  "rent-and-mortgage",
  "taxis-and-share-cars",
  "investments",
  "restaurants-and-cafes",
  "toll-roads",
  "utilities",
  "life-admin",
  "takeaway",
  "mobile-phone",
  "tobacco-and-vaping",
  "news-magazines-and-books",
  "tv-and-music",
  "adult",
  "technology",
];

// TODO: move this to a seperate helpers file?
type ProcessDateOptions = {
  endOfDayFlag: boolean;
};

const processDate = (
  dateStr: string,
  { endOfDayFlag }: ProcessDateOptions
): string => {
  const timeRegex = /T\d+/;

  let date = parseISO(dateStr);

  if (!isValid(date)) {
    throw new Error(
      `Invalid date format for date ${dateStr}. Please provide a date-time in RFC-3339 standard (e.g., 2020-01-01T01:02:03+10:00) or a simple date (e.g., 2020-01-01).`
    );
  }

  // If user input did not include time, expand it to full timestamp
  if (!timeRegex.test(dateStr)) {
    date = endOfDayFlag ? endOfDay(date) : startOfDay(date);
    return date.toISOString();
  }

  return dateStr;
};

type MakeFetchArgs = {
  withDebug?: boolean;
};

const makeFetchDefaultArgs: MakeFetchArgs = {
  withDebug: false,
};

function makeFetch({
  withDebug,
}: MakeFetchArgs = makeFetchDefaultArgs): typeof originalFetch {
  if (!withDebug) return originalFetch;

  return async function debugFetch(url, options) {
    console.debug("[fetch]", url, options);

    const response = await originalFetch(url, options);

    console.debug("[fetch] Response status:", response.status);
    console.debug("[fetch] Response headers:", response.headers.raw());
    console.debug("[fetch] Response body:", await response.clone().text());

    return response;
  };
}

type FetchTransactionsArgs = {
  size?: number;
  status?: string;
  since?: string;
  until?: string;
  category?: string;
  tag?: string;
};

interface PaginationOptions {
  paginate?: boolean;
  maxPages?: number;
  maxResults?: number;
}

// TODO: should we pass config into this function, or just read it from the global config variable?
// TODO: what is a clean pattern for passing the pagination options into this function, and through to the underlying function?
async function fetchTransactions(
  { size, status, since, until, category, tag }: FetchTransactionsArgs,
  paginationOptions: PaginationOptions = {}
) {
  const fetchedTransactionsPaginator = await fetchUpWithAuth(
    "/transactions",
    {
      "page[size]": size,
      "filter[status]": status,
      "filter[since]": since,
      "filter[until]": until,
      "filter[category]": category,
      "filter[tag]": tag,
    },
    paginationOptions
  );

  // TODO: we should abstract all this pagination handling functionality into a seperate helper function
  //   (could we also implement the min/max page size logic there to encapsulate things better?)
  const fetchedPages = [];
  let fetchedPageCount = 0;
  for await (const fetchedTransactionsPage of fetchedTransactionsPaginator) {
    fetchedPageCount++;
    fetchedPages.push(fetchedTransactionsPage);

    // TODO: only show this when debug enabled?
    console.error(
      `Fetched page ${fetchedPageCount} with ${fetchedTransactionsPage.length} transactions`
    );
  }
  // TODO: think about how to rewrite this in a way that it better uses the generator function to read multiple pages of results
  // TODO: I think can probably just loop over it or similar.. but also probably want to reduce it to a single capture of data..
  //   See this for further ideas/examples: https://chat.openai.com/c/acb5ebf9-6d4b-4bcb-a739-ac72eb1a12bc
  // const response = await fetchedTransactionsPaginator.next();

  // TODO: do we want to return the data as an array of transaction pages, or reduce it to be a single merged array of transactions?
  // TODO: probably should add a CLI arg for --pretty or similar and use that here
  // TODO: probably should check this value before trying to use it like this..?
  // const responseJson = JSON.stringify(response.value, null, 2);
  const responseJson = JSON.stringify(fetchedPages, null, 2);
  console.log(responseJson);
}

type APIParams = { [key: string]: any };

// TODO: Analyse and iterate on this version of the generator function that supports pagination.. not sure if it's accurate as is.. and feels a bit complex/messy
async function* fetchUpWithAuth(
  endpoint: string,
  params?: APIParams,
  paginationOptions: PaginationOptions = {}
) {
  const { paginate } = paginationOptions;
  // const { paginate, maxPages, maxResults } = paginationOptions;
  let url = new URL(
    `${BASE_URL}${endpoint.startsWith("/") ? "" : "/"}${endpoint}`
  );
  // let pageCounter = 0;
  // let resultCounter = 0;

  if (params) {
    Object.entries(params).forEach(([key, value]) =>
      value !== undefined ? url.searchParams.append(key, value) : null
    );
  }

  // TODO: we need to pass down more than just 'PaginationOptions'.. we need to pass down all the args.. or at least all the relevant ones..
  // TODO: once we do that, we can remove the hardcoded withDebug flag, and instead pass it down from the top level
  // const fetch = makeFetch({ withDebug: true });
  const fetch = makeFetch({ withDebug: false });

  while (url) {
    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${UP_API_ACCESS_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const { data, links } = await response.json();

    // TODO: should we show this when debug enabled?
    // console.error("links", links);

    // Update the URL to be the 'next' link, or null (which will end the loop) if there is no 'next' link
    url = paginate && links && links.next ? new URL(links.next) : null;

    yield data;

    // TODO: Figure out how to implement maxPages and maxResults in a clean/logical way
    //   Do we even want to do that at this level within this function? Or could we do it at a higher level helper that chooses
    //   if/whether to try and read more pages from this generator?
    // pageCounter++;
    // resultCounter += data.length;
    //
    // // If maxResults is defined and this page would cause us to exceed that, only yield the part of the page that fits within maxResults
    // if (maxResults && resultCounter > maxResults) {
    //   yield data.slice(0, data.length - (resultCounter - maxResults));
    // } else {
    //   yield data;
    // }
    //
    // if (paginate) {
    //   // If maxPages or maxResults is defined and we've already fetched that many pages or results, break the loop
    //   if ((maxPages && pageCounter >= maxPages) || (maxResults && resultCounter >= maxResults)) {
    //     break;
    //   }
    // } else {
    //   break;
    // }
  }
}

// Define the CLI
// TODO: separate these commands out into separate files?
await yargs(hideBin(process.argv))
  .middleware((config) => {
    // Display parsed config if debug is enabled
    if (config?.debug) {
      console.error("Config:", config);
    }
  })
  .command(
    "transactions",
    "Retrieve a list of all transactions across all accounts for the currently authenticated user. The returned list is paginated and can be scrolled by following the next and prev links where present. To narrow the results to a specific date range pass one or both of filter[since] and filter[until] in the query string. These filter parameters should not be used for pagination. Results are ordered newest first to oldest last.\n\nDocs: https://developer.up.com.au/#get_transactions",
    (yargs) => {
      return yargs
        .option("size", {
          // TODO should we move --size into the global'ish paginate options?
          describe: "Page size",
          type: "number",
          group: "Fetch Transactions:",
        })
        .option("status", {
          describe: "Transaction status",
          type: "string",
          group: "Fetch Transactions:",
        })
        .option("since", {
          describe: "Start date (eg. 2020-01-01T01:02:03+10:00)",
          type: "string",
          coerce: (since) => processDate(since, { endOfDayFlag: false }),
          group: "Fetch Transactions:",
        })
        .option("until", {
          describe: "End date (eg. 2020-02-01T01:02:03+10:00)",
          type: "string",
          coerce: (until) => processDate(until, { endOfDayFlag: true }),
          group: "Fetch Transactions:",
        })
        .option("tag", {
          describe: "Tag",
          type: "string",
          group: "Fetch Transactions:",
        })
        .option("category", {
          describe: "Category identifier",
          type: "string",
          choices: CATEGORIES,
          group: "Fetch Transactions:",
        });
    },
    async (config) => {
      // TODO: we really should improve the parameters and types being passed through here..
      return fetchTransactions(config as any, config as PaginationOptions);
    }
  )
  .option("paginate", {
    describe: "Make additional HTTP requests to fetch all pages of results",
    type: "boolean",
    default: false,
    global: true,
    group: "Pagination:",
  })
  .option("max-pages", {
    describe:
      "Maximum number of pages of results to fetch when using --paginate",
    type: "number",
    global: true,
    implies: ["paginate"],
    conflicts: ["max-results"],
    group: "Pagination:",
  })
  .option("max-results", {
    describe: "Maximum number of results to fetch when using --paginate",
    type: "number",
    global: true,
    implies: ["paginate"],
    conflicts: ["max-pages"],
    group: "Pagination:",
  })
  .option("debug", {
    describe: "Enable debug mode",
    type: "boolean",
    default: ["1", "true"].includes(process.env.DEBUG),
    global: true,
  })
  .check((args) => {
    if (args.paginate) {
      if (args["max-pages"] && args["max-results"]) {
        throw new Error(
          "When using --paginate, please specify either nothing, or only one of --max-pages or --max-results, but not both."
        );
      }
    }

    return true;
  })
  .completion()
  .version()
  .help()
  .alias("help", "h")
  // .showHelpOnFail(false, 'Specify --help for available options')
  .recommendCommands() // Provide suggestions regarding similar commands if no matching command is found
  .demandCommand(1, "") // Require at least 1 command, show no error message
  .strict(true)
  .parseAsync();
//.argv;
