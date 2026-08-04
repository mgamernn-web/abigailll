const https=require('https');
function f(url){return new Promise((r,j)=>{https.get(url,{headers:{'User-Agent':'Abigail-Bot'}},res=>{let d='';res.on('data',c=>d+=c);res.on('end',()=>r(d))}).on('error',j)})}
(async()=>{
  const all=['hug','kiss','slap','punch','bite','pat','wink','wave','blush','cry','smile','cuddle','poke','highfive','handhold','lick','nom','kill','shoot','stab','angry','bully','bonk','kick','yeet','baka','happy','dance','feed','glomp','carry','handshake','laugh','facepalm','think','pout','nod','nope','run','shake','sleep','shrug','stare','confused','shocked','bored','yawn','tickle','smug','peck','sip','bleh','teehee','wag','nya','lurk','clap','thumbsup','salute','tableflip','blowkiss','lappillow','kabedon','spin'];
  const ok=[];
  for(const r of all){
    try{
      const d=await f('https://api.otakugifs.xyz/gif?reaction='+r);
      const j=JSON.parse(d);
      if(j.url){
        ok.push(r);
        console.log('OK:',r,j.url);
      }
    }catch(e){}
  }
  console.log('\nAvailable:', ok.join(', '));
})();
