const STORAGE_KEY = "academic-command-center-v1";

const firstYear = {
  1: [
    {code:"BS25101", name:"Engineering Mathematics-I", credits:4, scheme:"3 Th · 1 Tut · 130 marks"},
    {code:"BS25104", name:"Engineering Chemistry", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"ET25101", name:"Basic Electronics Engineering", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"ME25101", name:"Engineering Graphics", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"CO25101", name:"Fundamentals of Programming Languages", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"CO25102", name:"Introduction to Python Programming", credits:2, scheme:"1 Th · 2 Pr · 60 marks"},
    {code:"HS25102", name:"Indian Knowledge System", credits:2, scheme:"2 Th · 60 marks"},
    {code:"HS25104", name:"Physical Education - Exercise and Field Activities", credits:2, scheme:"4 Pr · 50 marks"}
  ],
  2: [
    {code:"BS25102", name:"Engineering Mathematics-II", credits:4, scheme:"3 Th · 1 Tut · 130 marks"},
    {code:"BS25103", name:"Engineering Physics", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"EL25101", name:"Basic Electrical Engineering", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"CE25101", name:"Applied Mechanics", credits:3, scheme:"2 Th · 2 Pr · 100 marks"},
    {code:"AI25101", name:"Fundamentals of Data Structure", credits:3, scheme:"3 Th · 100 marks"},
    {code:"AI25102", name:"Workshop", credits:2, scheme:"1 Th · 2 Pr · 60 marks"},
    {code:"HS25101", name:"Communication and Professional Skills", credits:2, scheme:"2 Th · 60 marks"},
    {code:"HS25103", name:"Art and Culture", credits:2, scheme:"4 Pr · 50 marks"}
  ]
};

const blankYear = {
  1: firstYear[1],
  2: firstYear[2],
  3: [],
  4: []
};

function freshState(){
  return {
    selectedYear:1,
    selectedSem:1,
    years:{
      1:{1:cloneSubjects(firstYear[1]),2:cloneSubjects(firstYear[2])},
      2:{1:[],2:[]},3:{1:[],2:[]},4:{1:[],2:[]}
    }
  };
}
function cloneSubjects(arr){ return arr.map(s=>({...s,chapters:[]})); }
function loadState(){
  try{
    const raw=localStorage.getItem(STORAGE_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      return mergeState(parsed);
    }
  }catch(e){}
  return freshState();
}
function mergeState(saved){
  const base=freshState();
  if(!saved || typeof saved!=="object") return base;
  base.selectedYear=saved.selectedYear||1;
  base.selectedSem=saved.selectedSem||1;
  [1,2,3,4].forEach(y=>{
    [1,2].forEach(s=>{
      if(saved.years?.[y]?.[s]) base.years[y][s]=saved.years[y][s];
    });
  });
  return base;
}
let state=loadState();
let activeSubject=null;

function save(){ localStorage.setItem(STORAGE_KEY,JSON.stringify(state)); renderAll(); }
function subjects(){ return state.years[state.selectedYear][state.selectedSem]||[]; }
function chapters(s){ return s.chapters||[]; }
function chapterProgress(s){
  const c=chapters(s); if(!c.length) return 0;
  return Math.round(c.filter(x=>x.status==="Completed").length/c.length*100);
}
function semesterStats(year=state.selectedYear, sem=state.selectedSem){
  const list=state.years[year][sem]||[];
  const all=list.flatMap(s=>chapters(s));
  return {
    subjects:list.length,
    chapters:all.length,
    completed:all.filter(c=>c.status==="Completed").length,
    notes:all.filter(c=>c.notes==="Completed").length,
    revised:all.filter(c=>c.revised==="Yes").length,
    progress:all.length?Math.round(all.filter(c=>c.status==="Completed").length/all.length*100):0
  };
}
function totalYearProgress(y){
  const a=semesterStats(y,1),b=semesterStats(y,2), total=a.chapters+b.chapters;
  return total?Math.round((a.completed+b.completed)/total*100):0;
}
function esc(str){ return String(str??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m])); }

function renderAll(){
  renderYearGrid(); renderStats(); renderOverviewSubjects(); renderAttention();
  renderYearSwitcher(); renderCurriculum(); renderRevision();
  document.getElementById("overviewSemTitle").textContent=`Semester ${roman(state.selectedSem)}`;
  document.getElementById("curriculumEyebrow").textContent=`${yearLabel(state.selectedYear).toUpperCase()} · SEMESTER ${roman(state.selectedSem)}`;
  document.getElementById("curriculumTitle").textContent=`Semester ${roman(state.selectedSem)}`;
}
function roman(n){return n===1?"I":"II"}
function yearLabel(y){return y===1?"First Year":y===2?"Second Year":y===3?"Third Year":"Fourth Year"}

function renderYearGrid(){
  const el=document.getElementById("yearGrid");
  el.innerHTML=[1,2,3,4].map(y=>{
    const p=totalYearProgress(y), active=y===state.selectedYear;
    return `<button class="year-card ${active?"active":""}" data-year="${y}">
      <h4>${yearLabel(y)}</h4><p>${y===1?"2025–26 · Loaded": "Ready for syllabus entry"}</p>
      <div class="year-progress"><span style="width:${p}%"></span></div>
      <div class="subject-meta" style="margin-top:8px">${p}% tracked</div>
    </button>`;
  }).join("");
  el.querySelectorAll("[data-year]").forEach(b=>b.onclick=()=>{state.selectedYear=+b.dataset.year;state.selectedSem=1;save();switchView("curriculum")});
}
function renderStats(){
  const st=semesterStats();
  document.getElementById("statsGrid").innerHTML=[
    ["Subjects",st.subjects,"in this semester"],
    ["Chapters",st.chapters,`${st.completed} completed`],
    ["Notes",st.notes,`${st.chapters?Math.round(st.notes/st.chapters*100):0}% chapter notes done`],
    ["Revised",st.revised,`${st.chapters?Math.round(st.revised/st.chapters*100):0}% revised`]
  ].map(x=>`<div class="stat"><div class="stat-label">${x[0]}</div><div class="stat-value">${x[1]}</div><div class="stat-foot">${x[2]}</div></div>`).join("");
}
function renderOverviewSubjects(){
  const el=document.getElementById("overviewSubjects"), list=subjects();
  el.innerHTML=list.length?list.slice(0,8).map(s=>{
    const p=chapterProgress(s);
    return `<div class="subject-row"><div class="subject-main"><div class="subject-code">${esc(s.code)}</div><div class="subject-name">${esc(s.name)}</div><div class="subject-meta">${s.credits} credits · ${chapters(s).length} chapters</div></div><div class="subject-progress"><div class="progress-value">${p}%</div><div class="progress-track"><span style="width:${p}%"></span></div></div></div>`
  }).join(""):`<div class="empty">No subjects added to this semester yet.</div>`;
}
function renderAttention(){
  const el=document.getElementById("attentionList");
  const items=[];
  subjects().forEach(s=>chapters(s).forEach(c=>{
    if(c.status!=="Completed") items.push({title:c.name,sub:`${s.code} · ${s.name}`,kind:c.priority==="Critical"?"Critical":"Incomplete"});
    else if(c.revised!=="Yes") items.push({title:c.name,sub:`${s.code} · Completed but not revised`,kind:"Revision"});
  }));
  el.innerHTML=items.slice(0,6).map(i=>`<div class="attention"><strong>${esc(i.title)}</strong><span>${esc(i.sub)} · ${esc(i.kind)}</span></div>`).join("") || `<div class="empty">Nothing urgent here. Add chapters to start tracking.</div>`;
}
function renderYearSwitcher(){
  document.getElementById("yearSwitcher").innerHTML=[1,2,3,4].map(y=>`<button class="year-switch ${y===state.selectedYear?"active":""}" data-y="${y}">${yearLabel(y)}</button>`).join("");
  document.querySelectorAll(".year-switch").forEach(b=>b.onclick=()=>{state.selectedYear=+b.dataset.y;save()});
}
function renderCurriculum(){
  const list=subjects(), st=semesterStats();
  document.getElementById("semesterProgress").textContent=`${st.progress}%`;
  document.getElementById("semesterProgressBar").style.width=`${st.progress}%`;
  document.getElementById("semesterMeta").textContent=`${st.completed} / ${st.chapters} chapters completed`;
  document.getElementById("subjectGrid").innerHTML=list.length?list.map((s,i)=>{
    const p=chapterProgress(s);
    return `<article class="subject-card">
      <div class="subject-card-top"><span class="code-badge">${esc(s.code)}</span><span class="credits">${s.credits} credits</span></div>
      <h3>${esc(s.name)}</h3><div class="scheme">${esc(s.scheme||"Custom subject")} · ${chapters(s).length} chapters</div>
      <div class="card-progress"><div class="card-progress-head"><span>Chapter completion</span><span>${p}%</span></div><div class="progress-track"><span style="width:${p}%"></span></div></div>
      <div class="card-foot"><span>${chapters(s).filter(c=>c.notes==="Completed").length} notes · ${chapters(s).filter(c=>c.revised==="Yes").length} revised</span><button class="open-subject" data-sub="${i}">Open subject →</button></div>
    </article>`;
  }).join(""):`<div class="empty" style="grid-column:1/-1">No subjects in ${yearLabel(state.selectedYear)}, Semester ${roman(state.selectedSem)}. Use “+ Add subject” to build this semester.</div>`;
  document.querySelectorAll(".open-subject").forEach(b=>b.onclick=()=>openSubject(+b.dataset.sub));
}
function renderRevision(){
  const el=document.getElementById("revisionGrid"), items=[];
  [1,2,3,4].forEach(y=>[1,2].forEach(s=>{
    (state.years[y][s]||[]).forEach(sub=>chapters(sub).forEach(c=>{
      if(c.status!=="Completed" || c.revised!=="Yes") items.push({y,s,sub,c});
    }))
  }));
  el.innerHTML=items.length?items.slice(0,40).map(x=>{
    const status=x.c.status==="Completed"?"Completed":"Incomplete";
    return `<article class="revision-card"><span class="tag ${status==="Completed"?"done":"warn"}">${status}</span><h3>${esc(x.c.name)}</h3><p>${yearLabel(x.y)} · Sem ${roman(x.s)} · ${esc(x.sub.code)} · ${esc(x.sub.name)}</p><div style="margin-top:12px"><span class="tag">${x.c.revised==="Yes"?"Revised":"Needs revision"}</span> <span class="tag">${esc(x.c.priority||"Normal")}</span></div></article>`;
  }).join(""):`<div class="empty" style="grid-column:1/-1">Revision queue is empty.</div>`;
}

function openSubject(index){
  activeSubject={year:state.selectedYear,sem:state.selectedSem,index};
  const s=state.years[activeSubject.year][activeSubject.sem][index];
  document.getElementById("modalEyebrow").textContent=s.code;
  document.getElementById("modalTitle").textContent=s.name;
  document.getElementById("modalSub").textContent=`${yearLabel(activeSubject.year)} · Semester ${roman(activeSubject.sem)} · ${s.credits} credits`;
  renderSubjectModal();
  showModal("subjectModal");
}
function renderSubjectModal(){
  const s=state.years[activeSubject.year][activeSubject.sem][activeSubject.index], c=chapters(s);
  const complete=c.filter(x=>x.status==="Completed").length, notes=c.filter(x=>x.notes==="Completed").length, rev=c.filter(x=>x.revised==="Yes").length;
  document.getElementById("modalStats").innerHTML=[
    ["Chapters",c.length],["Completed",complete],["Notes",notes],["Revised",rev]
  ].map(x=>`<div class="modal-stat"><strong>${x[1]}</strong><span>${x[0]}</span></div>`).join("");
  document.getElementById("chapterList").innerHTML=c.length?c.map((ch,i)=>`
    <div class="chapter">
      <div class="chapter-top"><div class="chapter-title">${i+1}. ${esc(ch.name)}</div><button class="remove-chapter" data-remove="${i}">Remove</button></div>
      <div class="chapter-fields">
        <label>Status<select data-field="status" data-i="${i}">${["Not Started","In Progress","Completed"].map(v=>`<option ${ch.status===v?"selected":""}>${v}</option>`).join("")}</select></label>
        <label>Notes<select data-field="notes" data-i="${i}">${["Not Started","In Progress","Completed"].map(v=>`<option ${ch.notes===v?"selected":""}>${v}</option>`).join("")}</select></label>
        <label>Revised<select data-field="revised" data-i="${i}">${["No","Yes"].map(v=>`<option ${ch.revised===v?"selected":""}>${v}</option>`).join("")}</select></label>
        <label>Weightage %<input data-field="weightage" data-i="${i}" type="number" min="0" max="100" value="${ch.weightage??0}"></label>
      </div>
    </div>`).join(""):`<div class="empty">No chapters added yet. Add the official units/chapters here instead of guessing them.</div>`;
  document.querySelectorAll("[data-field]").forEach(el=>el.onchange=()=>{
    const i=+el.dataset.i, field=el.dataset.field;
    s.chapters[i][field]=field==="weightage"?Number(el.value):el.value;
    save(); openSubject(activeSubject.index);
  });
  document.querySelectorAll("[data-remove]").forEach(b=>b.onclick=()=>{
    const i=+b.dataset.remove;
    if(confirm("Remove this chapter?")){s.chapters.splice(i,1);save();openSubject(activeSubject.index)}
  });
}
function showModal(id){document.getElementById(id).classList.remove("hidden")}
function hideModal(id){document.getElementById(id).classList.add("hidden")}

function switchView(view){
  document.querySelectorAll(".view").forEach(v=>v.classList.remove("active"));
  document.getElementById(view+"View").classList.add("active");
  document.querySelectorAll(".nav-item").forEach(n=>n.classList.toggle("active",n.dataset.view===view));
  document.getElementById("pageTitle").textContent=view==="overview"?"Overview":view==="curriculum"?"Curriculum":view==="revision"?"Revision Hub":"Data & Settings";
  window.scrollTo({top:0,behavior:"smooth"});
}

document.querySelectorAll(".nav-item").forEach(n=>n.onclick=()=>switchView(n.dataset.view));
document.getElementById("openCurriculum").onclick=()=>switchView("curriculum");
document.getElementById("overviewSeeAll").onclick=()=>switchView("curriculum");

document.querySelectorAll("#overviewSemTabs .seg").forEach(b=>b.onclick=()=>{
  state.selectedSem=+b.dataset.sem; save();
});
document.querySelectorAll("#semTabs .seg").forEach(b=>b.onclick=()=>{
  state.selectedSem=+b.dataset.sem; save();
});

document.getElementById("addSubjectBtn").onclick=()=>showModal("subjectFormModal");
document.getElementById("subjectForm").onsubmit=e=>{
  e.preventDefault();
  const code=document.getElementById("newCode").value.trim(), name=document.getElementById("newName").value.trim(), credits=Number(document.getElementById("newCredits").value||0);
  if(!code||!name)return;
  state.years[state.selectedYear][state.selectedSem].push({code,name,credits,scheme:"Custom subject",chapters:[]});
  e.target.reset();document.getElementById("newCredits").value=3;hideModal("subjectFormModal");save();
};
document.getElementById("addChapterBtn").onclick=()=>showModal("chapterFormModal");
document.getElementById("chapterForm").onsubmit=e=>{
  e.preventDefault();
  const s=state.years[activeSubject.year][activeSubject.sem][activeSubject.index];
  s.chapters.push({name:document.getElementById("chapterName").value.trim(),weightage:Number(document.getElementById("chapterWeight").value||0),priority:document.getElementById("chapterPriority").value,status:"Not Started",notes:"Not Started",revised:"No"});
  e.target.reset();document.getElementById("chapterWeight").value=0;hideModal("chapterFormModal");save();openSubject(activeSubject.index);
};

document.querySelectorAll("[data-close]").forEach(el=>el.onclick=()=>{
  const t=el.dataset.close; hideModal(t==="modal"?"subjectModal":t==="subject-form"?"subjectFormModal":"chapterFormModal");
});
document.addEventListener("keydown",e=>{if(e.key==="Escape"){["subjectModal","subjectFormModal","chapterFormModal"].forEach(hideModal)}});

function downloadJSON(){
  const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});
  const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="academic-tracker-backup.json";a.click();URL.revokeObjectURL(a.href);
}
document.getElementById("exportBtn").onclick=downloadJSON;
document.getElementById("settingsExport").onclick=downloadJSON;
document.getElementById("importInput").onchange=e=>{
  const file=e.target.files[0]; if(!file)return;
  const reader=new FileReader();
  reader.onload=()=>{try{state=mergeState(JSON.parse(reader.result));save();alert("Tracker data imported successfully.");}catch(err){alert("That file is not a valid tracker backup.");}};
  reader.readAsText(file);
};
document.getElementById("resetBtn").onclick=()=>{
  if(confirm("Reset all tracker data and restore the original first-year structure?")){state=freshState();save();}
};

renderAll();
