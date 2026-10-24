export interface OperatorAttachment {text:string;summary:string;uncertainties:string[]}

async function docxText(file:File):Promise<string> {
  const bytes=new Uint8Array(await file.arrayBuffer()), view=new DataView(bytes.buffer);
  // Central-directory sizes are authoritative even when local ZIP headers use descriptors.
  let eocd=-1;
  for(let i=bytes.length-22;i>=Math.max(0,bytes.length-65557);i--) if(view.getUint32(i,true)===0x06054b50){eocd=i;break;}
  if(eocd<0) throw Error('Invalid DOCX ZIP');
  let offset=view.getUint32(eocd+16,true);
  const count=view.getUint16(eocd+10,true);
  for(let i=0;i<count;i++) {
    if(view.getUint32(offset,true)!==0x02014b50) throw Error('Invalid DOCX directory');
    const length=view.getUint16(offset+28,true),extra=view.getUint16(offset+30,true),comment=view.getUint16(offset+32,true);
    const name=new TextDecoder().decode(bytes.subarray(offset+46,offset+46+length));
    if(name==='word/document.xml') {
      const size=view.getUint32(offset+24,true),compressed=view.getUint32(offset+20,true),method=view.getUint16(offset+10,true),local=view.getUint32(offset+42,true);
      if(size>4*1024*1024 || view.getUint16(offset+8,true)&1) throw Error('DOCX is encrypted or too large');
      const start=local+30+view.getUint16(local+26,true)+view.getUint16(local+28,true);
      if(start+compressed>bytes.length) throw Error('Truncated DOCX');
      const data=bytes.slice(start,start+compressed);
      let xml:string;
      if(method===0) xml=new TextDecoder().decode(data);
      else if(method===8) {
        const reader=new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw')).getReader();
        const chunks:Uint8Array[]=[];let total=0;
        while(true){const part=await reader.read();if(part.done) break;total+=part.value.length;if(total>4*1024*1024){await reader.cancel();throw Error('DOCX expands beyond limit');}chunks.push(part.value);}
        xml=await new Blob(chunks as BlobPart[]).text();
      } else throw Error('Unsupported DOCX compression');
      const doc=new DOMParser().parseFromString(xml,'application/xml');
      if(doc.querySelector('parsererror')) throw Error('Invalid DOCX XML');
      return Array.from(doc.getElementsByTagNameNS('*','p')).map(p=>Array.from(p.getElementsByTagNameNS('*','t')).map(t=>t.textContent).join('')).join('\n');
    }
    offset+=46+length+extra+comment;
  }
  throw Error('DOCX document text not found');
}

export async function readOperatorAttachment(file:File):Promise<OperatorAttachment> {
  if(!file.size || file.size>8*1024*1024) throw Error('File खाली है या 8 MB से बड़ी है।');
  const ext=file.name.split('.').pop()?.toLowerCase();
  if(['txt','csv','md','json','docx'].includes(ext || '')) {
    const text=ext==='docx'?await docxText(file):await file.text();
    if(!text.trim()) throw Error('File में readable text नहीं मिला।');
    if(text.length>40000) throw Error('File में 40,000 से अधिक characters हैं। छोटा document दें।');
    return {text,summary:`${text.length} characters पढ़े।`,uncertainties:[]};
  }
  const data=new FormData();data.append('file',file);
  const res=await fetch('/api/cms-agent/attachment',{method:'POST',body:data,signal:AbortSignal.timeout(110000)});
  const result=await res.json();
  if(!res.ok || !result.text?.trim()) throw Error(result.error || 'File readable नहीं है; साफ copy upload करें।');
  return result;
}
