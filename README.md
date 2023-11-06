# PoC - Up Bank CLI

Proof of Concept (PoC) script for interacting with [Up Bank](https://up.com.au/)'s API ([Ref](https://developer.up.com.au/)).

## Usage

First you will need to run:

```shell
npm install
```

Then you can use the script as follows:

```shell
up-bank-cli.ts --help

up-bank-cli.ts --version 

up-bank-cli.ts transactions --since 20210701 --until 20220630 --size 100 --tag Tax --paginate

etc
```

Output from `./up-bank-cli.ts --help`:

```shell
⇒ ./up-bank-cli.ts --help
up-bank-cli.ts <command>

Commands:
  up-bank-cli.ts transactions  Retrieve a list of all transactions across all ac
                               counts for the currently authenticated user. The
                               returned list is paginated and can be scrolled by
                                following the next and prev links where present.
                                To narrow the results to a specific date range p
                               ass one or both of filter[since] and filter[until
                               ] in the query string. These filter parameters sh
                               ould not be used for pagination. Results are orde
                               red newest first to oldest last.

                               Docs: https://d
                               eveloper.up.com.au/#get_transactions
  up-bank-cli.ts completion    generate completion script

Pagination:
      --paginate     Make additional HTTP requests to fetch all pages of results
                                                      [boolean] [default: false]
      --max-pages    Maximum number of pages of results to fetch when using --pa
                     ginate                                             [number]
      --max-results  Maximum number of results to fetch when using --paginate
                                                                        [number]

Options:
      --debug    Enable debug mode                    [boolean] [default: false]
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```

Output from `./up-bank-cli.ts transactions --help`:

```shell
⇒ ./up-bank-cli.ts transactions --help
up-bank-cli.ts transactions

Retrieve a list of all transactions across all accounts for the currently authen
ticated user. The returned list is paginated and can be scrolled by following th
e next and prev links where present. To narrow the results to a specific date ra
nge pass one or both of filter[since] and filter[until] in the query string. The
se filter parameters should not be used for pagination. Results are ordered newe
st first to oldest last.

Docs: https://developer.up.com.au/#get_transactions

Fetch Transactions:
      --size      Page size                                             [number]
      --status    Transaction status                                    [string]
      --since     Start date (eg. 2020-01-01T01:02:03+10:00)            [string]
      --until     End date (eg. 2020-02-01T01:02:03+10:00)              [string]
      --tag       Tag                                                   [string]
      --category  Category identifier
  [string] [choices: "games-and-software", "car-insurance-and-maintenance", "fam
  ily", "good-life", "groceries", "booze", "clothing-and-accessories", "cycling"
  , "homeware-and-appliances", "personal", "education-and-student-loans", "event
  s-and-gigs", "fuel", "home", "internet", "fitness-and-wellbeing", "hobbies", "
  home-maintenance-and-improvements", "parking", "transport", "gifts-and-charity
  ", "holidays-and-travel", "pets", "public-transport", "hair-and-beauty", "lott
  ery-and-gambling", "home-insurance-and-rates", "car-repayments", "health-and-m
  edical", "pubs-and-bars", "rent-and-mortgage", "taxis-and-share-cars", "invest
  ments", "restaurants-and-cafes", "toll-roads", "utilities", "life-admin", "tak
  eaway", "mobile-phone", "tobacco-and-vaping", "news-magazines-and-books", "tv-
                                              and-music", "adult", "technology"]

Pagination:
      --paginate     Make additional HTTP requests to fetch all pages of results
                                                      [boolean] [default: false]
      --max-pages    Maximum number of pages of results to fetch when using --pa
                     ginate                                             [number]
      --max-results  Maximum number of results to fetch when using --paginate
                                                                        [number]

Options:
      --debug    Enable debug mode                    [boolean] [default: false]
      --version  Show version number                                   [boolean]
  -h, --help     Show help                                             [boolean]
```

## Libs / Dependencies

- https://github.com/yargs/yargs
  - https://yargs.js.org/docs/
- https://github.com/node-fetch/node-fetch
- https://github.com/esbuild-kit/tsx
