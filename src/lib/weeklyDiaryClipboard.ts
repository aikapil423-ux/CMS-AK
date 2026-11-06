export function writeDiaryClipboard(rows:string[][]) {
  return rows.map(row=>row.map(value=>/[\t\r\n"]/.test(value)
    ? '"'+value.replaceAll('"','""')+'"'
    : value).join('\t')).join('\n');
}

export function readDiaryClipboard(text:string) {
  const rows:string[][]=[[]];
  let value='', quoted=false;
  for(let i=0;i<text.length;i++){
    const character=text[i];
    if(quoted){
      if(character==='"' && text[i+1]==='"'){value+='"';i++;}
      else if(character==='"')quoted=false;
      else value+=character;
    }else if(character==='"' && value===''){
      quoted=true;
    }else if(character==='\t' || character==='\n' || character==='\r'){
      rows.at(-1)!.push(value);
      value='';
      if(character==='\r' && text[i+1]==='\n')i++;
      if(character!=='\t' && i<text.length-1)rows.push([]);
    }else{
      value+=character;
    }
  }
  if(value || !rows.at(-1)!.length || text.endsWith('\t') || !/[\r\n]$/.test(text))rows.at(-1)!.push(value);
  return rows;
}
