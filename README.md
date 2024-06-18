# lume-duck

> [DuckDB](https://duckdb.org) data in [Lume](https://lume.land)

You will need to have the appropriate DuckDB library installed for your system!
See https://duckdb.org/docs/installation/index?version=stable&environment=cplusplus

## Quick start

Add the following lines to your Lume _config.ts file

```ts
import { duckDbLoader } from "jsr:@dringtech/lume-duck";

site.loadData([".sql"], duckDbLoader());
```

Any SQL files in `_data` directories will be loaded as DuckDB queries. The data
file name is a function which executes the contained SQL, i.e.
`_data/sample.sql` would be accessible as `sample()`.

Examples (each assumes in a file called `_data/query.sql`):

| SQL                            | Query    | Result         |
| ------------------------------ | -------- | -------------- |
| `SELECT 1 AS number;`          | `query()`  | `[{number:1}]` |
| `SELECT ?::INTEGER AS number;` | `query(2)` | `[{number:2}]` |
| `SELECT ?::INTEGER AS number, ?::STRING AS string;` | `query(3, 'x')` | `[{number:3,string:'x'}]`|
| `SELECT $2::INTEGER AS number, $1::STRING AS string;` | `query('y', 4)` | `[{number:4,string:'y'}]`|
