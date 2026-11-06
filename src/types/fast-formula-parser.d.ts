declare module 'fast-formula-parser' {
  export default class FormulaParser {
    constructor(options: {
      onCell: (position: { sheet?:string; row:number; col:number }) => unknown;
      onRange: (range: { sheet?:string; from:{row:number;col:number}; to:{row:number;col:number} }) => unknown;
    });
    parse(formula:string,position:{sheet?:string;row:number;col:number}):{error?:string}|number|string|boolean|null;
  }
}
