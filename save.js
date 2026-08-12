
(function(){
  const KEY = "mfl_v3_save";

  window.MFL_SAVE = {
    load(){
      try{
        const raw = localStorage.getItem(KEY);
        return raw ? JSON.parse(raw) : null;
      }catch(e){
        return null;
      }
    },
    save(data){
      try{
        localStorage.setItem(KEY, JSON.stringify(data));
      }catch(e){}
    },
    clear(){
      try{ localStorage.removeItem(KEY); }catch(e){}
    },
    create(player){
      return {
        version:"3.0",
        player,
        day:1,
        time:420,
        money:15000,
        energy:90,
        condition:82,
        stress:10,
        football:50,
        x:380,
        y:560
      };
    }
  };
})();
