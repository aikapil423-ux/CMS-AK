import FormulaParser from 'fast-formula-parser';

type Position = { sheet?:string; row:number; col:number };
type Range = { sheet?:string; from:Position; to:Position };
type GridValue = string | number | boolean | null;

export function calculateGridFormulas(
  formulas:Record<string,string>,
  sheets:Record<string,(string | undefined)[][]>,
  readValue:(key:string)=>string,
) {
  const positions = new Map<string,Position>();
  for (const [sheet, rows] of Object.entries(sheets)) {
    rows.forEach((row, r) => row.forEach((key,c) => {
      if (key && formulas[key]) positions.set(key,{sheet,row:r+1,col:c+1});
    }));
  }

  const results = new Map<string,GridValue>();
  const pending = new Set<string>();

  function cell(position:Position):GridValue {
    const key = sheets[position.sheet || '']?.[position.row-1]?.[position.col-1];
    if (!key) return null;
    if (formulas[key]) return evaluate(key);
    const value = readValue(key);
    if (value==='') return null;
    return /^-?(?:0|[1-9]\d*)(?:\.\d+)?$/.test(value) ? Number(value) : value;
  }

  function evaluate(key:string):GridValue {
    if (results.has(key)) return results.get(key)!;
    if (pending.has(key) || pending.size>=32) throw Error('Circular or excessively deep formula.');
    const position = positions.get(key);
    if (!position) return null;
    pending.add(key);
    try {
      const parser = new FormulaParser({
        onCell:cell,
        onRange:({sheet,from,to}:Range)=>{
          const height=to.row-from.row+1, width=to.col-from.col+1;
          if (height*width>10000) throw Error('Formula range is too large.');
          return Array.from({length:height},(_,r)=>
            Array.from({length:width},(_,c)=>cell({sheet,row:from.row+r,col:from.col+c})));
        },
      });
      const result = parser.parse(formulas[key].slice(1),position);
      const value = result!==null && typeof result==='object' ? result.error || '#VALUE!' : result;
      results.set(key,value);
      return value;
    } finally {
      pending.delete(key);
    }
  }

  return Object.fromEntries(Object.keys(formulas).map(key=>{
    try { return [key,String(evaluate(key) ?? '')]; }
    catch { return [key,'#ERROR!']; }
  }));
}
