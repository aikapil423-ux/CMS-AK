/** One completed recognition turn submits once; aborted/error turns never submit. */
export function voiceTurn(onText:(text:string)=>void,onSend:(text:string)=>void,onStop:()=>void) {
  let finalText='', cancelled=false, ended=false;
  return {
    result(event:{results:ArrayLike<{isFinal:boolean;[index:number]:{transcript:string}}>}) {
      if(cancelled||ended)return;
      let text='';finalText='';
      for(let i=0;i<event.results.length;i++) {
        const result=event.results[i];text+=result[0].transcript+' ';
        if(result.isFinal)finalText+=result[0].transcript+' ';
      }
      if(/^(stop|ruko|रुको)[।.!?]*$/i.test(text.trim())){cancelled=true;onStop();return;}
      onText(text.trim());
    },
    cancel(){cancelled=true;},
    end(){if(ended)return;ended=true;if(!cancelled&&finalText.trim())onSend(finalText.trim());},
  };
}
