# nice-table
A Node.js `console.table` alternative that does not overflow.

## Usage
```ts
import { createTable } from 'nice-table';

type Person = {
    name: string;
    age: number;
};

const myData: Person[] = [
    { name: 'John', age: 30 },
    { name: 'Jane', age: 25 },
    { name: 'Joe', age: 20 },
    {
        name: 'Pablo Diego José Francisco de Paula Juan Nepomuceno María de los Remedios Cipriano de la Santísima Trinidad Ruiz y Picasso',
        age: new Date(Date.now() - Date.UTC(1881, 3, 8)).getUTCFullYear() - 1970,
    },
];

console.log(
    createTable<Person>(myData, ['name', 'age'], {
        maxWidth: 60,
        columnSizing: 'stretch',
        horizontalAlignment: 'middle',
        verticalAlignment: 'middle',
        fullWidth: true,
        indexColumn: false,
        throwIfTooSmall: false,
    }),
);

// Output:
// ┌────────────────────────────────────────────────────┬─────┐
// │                        name                        │ age │
// ├────────────────────────────────────────────────────┼─────┤
// │                       'John'                       │ 30  │
// │                       'Jane'                       │ 25  │
// │                       'Joe'                        │ 20  │
// │ 'Pablo Diego José Francisco de Paula Juan Nepomuce │     │
// │ no María de los Remedios Cipriano de la Santísima  │ 141 │
// │              Trinidad Ruiz y Picasso'              │     │
// └────────────────────────────────────────────────────┴─────┘
```

## Options
### `maxWidth`
The maximum width of the table.
This width will never be exceeded by the table.
Can be set to `process.stdout.columns` to use the terminal width in Node.JS.

Defaults to `80`.

### `columnSizing`
The strategy used to determine the width of each column.
There are two possible values:
- `'stretch'`: The size of each column is proportional to the length of its content. All columns larger than `maxWidth / columnCount` are shrunk by the same ratio in case the table is too large for the configured `maxWidth`.    
- `'even'`: All columns will have the same size.

Defaults to `'stretch'`.

### `horizontalAlignment`
The horizontal alignment the text in all table cells. Possible values are `'left'`, `'middle'`, `'right'`.

Defaults to `'middle'`.

### `verticalAlignment`
The vertical alignment the text in all table cells. Possible values are `'top'`, `'middle'`, `'bottom'`.

Defaults to `'middle'`.

### `fullWidth`
Whether to stretch the table to the `maxWidth`.

Defaults to `false`.

### `throwIfTooSmall`
Whether to throw an error if the `maxWidth` is too small to fit the content.
`maxWidth` should be at least `4 * columnCount + 1` to fit a table with `columnCount` columns.

If set to `false` will return a message indicating that there is not enough space to fit the table.

Defaults to `true`.

### `indexColumn`
Whether to include an index column.

Defaults to `false`.