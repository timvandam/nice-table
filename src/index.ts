import { inspect } from 'util';

export type HorizontalAlignment = 'left' | 'middle' | 'right';
export type VerticalAlignment = 'top' | 'middle' | 'bottom';
export type ColumnSizing = 'stretch' | 'even';

export type TableOptions = {
  maxWidth: number;
  columnSizing: ColumnSizing;
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
  fullWidth: boolean;
  throwIfTooSmall: boolean;
  indexColumn: boolean;
};

export function createTable<T extends object>(
  items: T[],
  keys: (keyof T)[],
  {
    horizontalAlignment = 'middle',
    verticalAlignment = 'middle',
    fullWidth = false,
    columnSizing = 'stretch',
    maxWidth = 80,
    indexColumn = false,
    throwIfTooSmall = true,
  }: Partial<TableOptions> = {},
): string {
  let columnCount = keys.length;
  const columnNames = keys.map((key) => key.toString());
  const tableContent = items.map((item) => keys.map((key) => inspect(item[key])));

  if (indexColumn) {
    columnNames.unshift('(index)');
    tableContent.forEach((row, i) => row.unshift(i.toString()));
    columnCount++;
  }

  const minimumWidth = 4 * columnCount + 1;
  if (maxWidth < minimumWidth) {
    const message = `The table does not fit. The width should be set to at least ${
      4 * columnCount + 1
    } (4 * ColumnCount + 1) for this table to fit (received width ${maxWidth}).`;
    if (throwIfTooSmall) {
      throw new Error(message);
    } else {
      return message;
    }
  }

  const availableColumnWidth = maxWidth - columnCount - 1; // each key/column has a │ on the left, and there is one │ at the end of each row
  const averageColumnWidth = Math.floor(availableColumnWidth / columnCount);
  const columnWidths = columnNames.map((columnName, i) =>
    Math.max(columnName.length + 2, ...tableContent.map((row) => row[i].length + 2)),
  );

  let overflow = columnWidths.reduce((a, b) => a + b, 0) - availableColumnWidth;

  switch (columnSizing) {
    case 'stretch': {
      if (overflow > 0) {
        shrinkColumns(columnWidths, averageColumnWidth, overflow);
        overflow = 0;
      }
      break;
    }
    case 'even': {
      const maxColumnWidth = Math.max(...columnWidths);
      for (let i = 0; i < columnWidths.length; i++) {
        columnWidths[i] = maxColumnWidth;
      }
      overflow = maxColumnWidth * columnCount - availableColumnWidth;
      if (overflow > 0) {
        shrinkColumns(columnWidths, averageColumnWidth, overflow);
        overflow = 0;
      }
      break;
    }
    default:
      throw new Error(`Unknown column sizing '${columnSizing}'`);
  }

  if (fullWidth && overflow < 0) {
    growColumns(columnWidths, averageColumnWidth, -overflow);
    overflow = 0;
  }

  for (const columnWidth of columnWidths) {
    if (columnWidth < 3) {
      throw new Error(
        'Table does not fit. Please file a bug report as this error should not happen: https://github.com/timvandam/nice-table/issues/new',
      );
    }
  }

  return [
    createTableTop(columnWidths),
    createTableColumnNames(columnNames, columnWidths, horizontalAlignment, verticalAlignment),
    createTableRows(tableContent, columnWidths, horizontalAlignment, verticalAlignment),
    createTableBottom(columnWidths),
  ].join('\n');
}

const TOP_LEFT = '┌';
const TOP_RIGHT = '┐';
const TOP_MIDDLE = '┬';
const BOTTOM_LEFT = '└';
const BOTTOM_RIGHT = '┘';
const BOTTOM_MIDDLE = '┴';
const LEFT_MIDDLE = '├';
const RIGHT_MIDDLE = '┤';
const MIDDLE = '┼';
const HORIZONTAL = '─';
const VERTICAL = '│';

function createTableTop(columnWidths: number[]) {
  return (
    TOP_LEFT + columnWidths.map((size) => HORIZONTAL.repeat(size)).join(TOP_MIDDLE) + TOP_RIGHT
  );
}

function createTableMiddleLine(columnWidths: number[]) {
  return (
    LEFT_MIDDLE + columnWidths.map((size) => HORIZONTAL.repeat(size)).join(MIDDLE) + RIGHT_MIDDLE
  );
}

function createTableBottom(columnWidths: number[]) {
  return (
    BOTTOM_LEFT +
    columnWidths.map((size) => HORIZONTAL.repeat(size)).join(BOTTOM_MIDDLE) +
    BOTTOM_RIGHT
  );
}

function centerText(text: string, width: number) {
  text = text.trim();
  const padding = Math.floor((width - text.length) / 2);
  return (' '.repeat(padding) + text).padEnd(width, ' ');
}

function createRow(
  cells: string[],
  columnWidths: number[],
  horizontalAlignment: HorizontalAlignment,
) {
  return (
    VERTICAL +
    columnWidths
      .map((columnWidth, i) => {
        if (horizontalAlignment === 'left') {
          return (' ' + cells[i]).padEnd(columnWidth, ' ');
        } else if (horizontalAlignment === 'right') {
          return (cells[i] + ' ').padStart(columnWidth, ' ');
        } else {
          return centerText(cells[i], columnWidth);
        }
      })
      .join(VERTICAL) +
    VERTICAL
  );
}

function createMultiLineRows(
  row: string[],
  columnWidths: number[],
  horizontalAlignment: HorizontalAlignment,
  verticalAlignment: VerticalAlignment,
) {
  const cells: string[][] = [];
  let rowHeight = 0;

  // Split single cells into multiple cells if they are too long
  for (let i = 0; i < columnWidths.length; i++) {
    const columnWidth = columnWidths[i];
    let cell = row[i];

    const cellLines: string[] = [];
    while (cell.length) {
      cellLines.push(cell.slice(0, columnWidth - 2)); // -2 for the left and right padding
      cell = cell.slice(columnWidth - 2);
    }

    cells.push(cellLines);
    rowHeight = Math.max(rowHeight, cellLines.length);
  }

  // Align cells vertically
  if (verticalAlignment !== 'top') {
    for (let i = 0; i < cells.length; i++) {
      const padding =
        {
          top: 0,
          middle: Math.floor((rowHeight - cells[i].length) / 2),
          bottom: rowHeight - cells[i].length,
        }[verticalAlignment] ?? 0;

      cells[i].unshift(...Array(padding).fill(''));
    }
  }

  const cellRows: string[][] = [];

  for (let i = 0; i < rowHeight; i++) {
    cellRows.push(cells.map((cell) => cell[i] ?? ''));
  }

  return cellRows.map((row) => createRow(row, columnWidths, horizontalAlignment)).join('\n');
}

function createTableRows(
  tableContent: string[][],
  columnWidths: number[],
  horizontalAlignment: HorizontalAlignment,
  verticalAlignment: VerticalAlignment,
) {
  return tableContent
    .map((row) => createMultiLineRows(row, columnWidths, horizontalAlignment, verticalAlignment))
    .join('\n');
}

function createTableColumnNames(
  columnNames: string[],
  columnWidths: number[],
  horizontalAlignment: HorizontalAlignment,
  verticalAlignment: VerticalAlignment,
) {
  return (
    createMultiLineRows(columnNames, columnWidths, horizontalAlignment, verticalAlignment) +
    '\n' +
    createTableMiddleLine(columnWidths)
  );
}

/**
 * Shrink columns to fit the table width.
 * Can lead to negative widths columns if the minimum width is too low (taking $AvailableWidth / ColumnCount$ always works).
 */
function shrinkColumns(columnWidths: number[], minimumWidth: number, overflow: number) {
  const bigColumnIndices = Array.from({ length: columnWidths.length }, (_, i) => i).filter(
    (i) => columnWidths[i] > minimumWidth,
  );
  let bigColumnsWidth = bigColumnIndices.reduce(
    (totalWidth, columnIndex) => totalWidth + columnWidths[columnIndex],
    0,
  );

  const shrinkFactor = 1 - overflow / (bigColumnsWidth - bigColumnIndices.length * minimumWidth);

  for (const columnIndex of bigColumnIndices.slice(0, -1)) {
    const currentColumnWidth = columnWidths[columnIndex];
    const fixedWidth = Math.max(minimumWidth, Math.floor(shrinkFactor * currentColumnWidth));
    const widthReduction = currentColumnWidth - fixedWidth;

    columnWidths[columnIndex] = fixedWidth;
    overflow -= widthReduction;
    bigColumnsWidth -= widthReduction;
  }

  columnWidths[bigColumnIndices[bigColumnIndices.length - 1]] -= overflow;
}

/**
 * Grow small columns by a certain amount.
 */
function growColumns(columnWidths: number[], minimumWidth: number, growth: number) {
  const smallColumnIndices = Array.from({ length: columnWidths.length }, (_, i) => i).filter(
    (i) => columnWidths[i] < minimumWidth,
  );
  let smallColumnsWidth = smallColumnIndices.reduce(
    (totalWidth, columnIndex) => totalWidth + columnWidths[columnIndex],
    0,
  );
  const growFactor = 1 + growth / smallColumnsWidth;

  for (const columnIndex of smallColumnIndices.slice(0, -1)) {
    const currentColumnWidth = columnWidths[columnIndex];
    const fixedWidth = Math.floor(growFactor * currentColumnWidth);
    const widthGrowth = fixedWidth - currentColumnWidth;

    columnWidths[columnIndex] = fixedWidth;
    growth -= widthGrowth;
    smallColumnsWidth += widthGrowth;
  }

  columnWidths[smallColumnIndices[smallColumnIndices.length - 1]] += growth;
}
