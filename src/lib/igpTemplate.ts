import source from './igpTemplate.json';

type Box = [number, number, number, number];
export type IgpCell = {
  c: number; text: string; field: boolean; colSpan: number; rowSpan: number;
  fill: string; size: number; align: string;
};
export type IgpTable = { kind: 'table'; box: Box; columns: number[]; rows: IgpCell[][] };
type IgpShape = IgpTable | { kind: 'logo'; box: Box } | { kind: 'text'; box: Box; text: string; size: number };

export const igpSlides = source as IgpShape[][];
export const igpTables = (slide: number) => igpSlides[slide - 1].filter((shape): shape is IgpTable => shape.kind === 'table');
export const igpCellKey = (slide: number, table: number, row: number, column: number) => [slide, table, row, column].join(':');

export type IgpBriefing = {
  district: string;
  cutoff: string;
  values: Record<string, string | number>;
  caseOverflow: Record<string, (string | number)[][]>;
};
