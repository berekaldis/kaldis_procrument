function l(c,o){const n=o.map(r=>r.map(s=>`"${String(s??"").replace(/"/g,'""')}"`).join(",")).join(`
`),a=new Blob([n],{type:"text/csv;charset=utf-8;"}),t=URL.createObjectURL(a),e=document.createElement("a");e.href=t,e.download=c,e.click(),URL.revokeObjectURL(t)}export{l as d};
