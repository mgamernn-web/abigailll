const https=require('https');
function f(url){return new Promise((r,j)=>{https.get(url,{headers:{'User-Agent':'Abigail-Bot'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(d))}).on('error',j)})}
(async()=>{
  const reactions=['kill','choke','strangle','slap','punch','bite','kick','angry','stab','fight','grab','neck','chokehold','throttle','grip'];
  for(const r of reactions){
    try{
      const d=await f('https://api.otakugifs.xyz/gif?reaction='+r);
      const j=JSON.parse(d);
      if(j.url)console.log('OK:',r,j.url);
      else console.log('FAIL:',r,d.substring(0,100));
    }catch(e){console.log('ERR:',r,e.message)}
  }
})();
