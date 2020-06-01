!function(e){var t={};function n(a){if(t[a])return t[a].exports;var r=t[a]={i:a,l:!1,exports:{}};return e[a].call(r.exports,r,r.exports,n),r.l=!0,r.exports}n.m=e,n.c=t,n.d=function(e,t,a){n.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:a})},n.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},n.t=function(e,t){if(1&t&&(e=n(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var a=Object.create(null);if(n.r(a),Object.defineProperty(a,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var r in e)n.d(a,r,function(t){return e[t]}.bind(null,r));return a},n.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return n.d(t,"a",t),t},n.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},n.p="",n(n.s=0)}([function(e,t,n){"use strict";function a(e){return e<10?"0"+e:""+e}function r(e){var t,n;return(t=e,n=60,[Math.floor(t/n),t%n]).map(a).join(":")}function i(e){const[t,n]=e.split(":").map(Number);return 60*t+n}function o(e){return`${e.getFullYear()}-${a(e.getMonth()+1)}-${a(e.getDate())}`}function s(e){return e.replace(/-(\w|$)/g,(e,t)=>t.toUpperCase())}n.r(t);function l(e,t){return()=>{let n;n=i(e.value)>=i(t.value)?"Start can't be after end.":"",e.setCustomValidity(n),t.setCustomValidity(n)}}let d,u;const c=new WeakMap,m=new WeakMap,p=new WeakMap,f=new WeakMap,y=new WeakMap;let h={get(e,t,n){if(e instanceof IDBTransaction){if("done"===t)return m.get(e);if("objectStoreNames"===t)return e.objectStoreNames||p.get(e);if("store"===t)return n.objectStoreNames[1]?void 0:n.objectStore(n.objectStoreNames[0])}return v(e[t])},set:(e,t,n)=>(e[t]=n,!0),has:(e,t)=>e instanceof IDBTransaction&&("done"===t||"store"===t)||t in e};function w(e){return e!==IDBDatabase.prototype.transaction||"objectStoreNames"in IDBTransaction.prototype?(u||(u=[IDBCursor.prototype.advance,IDBCursor.prototype.continue,IDBCursor.prototype.continuePrimaryKey])).includes(e)?function(...t){return e.apply(g(this),t),v(c.get(this))}:function(...t){return v(e.apply(g(this),t))}:function(t,...n){const a=e.call(g(this),t,...n);return p.set(a,t.sort?t.sort():[t]),v(a)}}function b(e){return"function"==typeof e?w(e):(e instanceof IDBTransaction&&function(e){if(m.has(e))return;const t=new Promise((t,n)=>{const a=()=>{e.removeEventListener("complete",r),e.removeEventListener("error",i),e.removeEventListener("abort",i)},r=()=>{t(),a()},i=()=>{n(e.error||new DOMException("AbortError","AbortError")),a()};e.addEventListener("complete",r),e.addEventListener("error",i),e.addEventListener("abort",i)});m.set(e,t)}(e),t=e,(d||(d=[IDBDatabase,IDBObjectStore,IDBIndex,IDBCursor,IDBTransaction])).some(e=>t instanceof e)?new Proxy(e,h):e);var t}function v(e){if(e instanceof IDBRequest)return function(e){const t=new Promise((t,n)=>{const a=()=>{e.removeEventListener("success",r),e.removeEventListener("error",i)},r=()=>{t(v(e.result)),a()},i=()=>{n(e.error),a()};e.addEventListener("success",r),e.addEventListener("error",i)});return t.then(t=>{t instanceof IDBCursor&&c.set(t,e)}).catch(()=>{}),y.set(t,e),t}(e);if(f.has(e))return f.get(e);const t=b(e);return t!==e&&(f.set(e,t),y.set(t,e)),t}const g=e=>y.get(e);const M=["get","getKey","getAll","getAllKeys","count"],E=["put","add","delete","clear"],x=new Map;function S(e,t){if(!(e instanceof IDBDatabase)||t in e||"string"!=typeof t)return;if(x.get(t))return x.get(t);const n=t.replace(/FromIndex$/,""),a=t!==n,r=E.includes(n);if(!(n in(a?IDBIndex:IDBObjectStore).prototype)||!r&&!M.includes(n))return;const i=async function(e,...t){const i=this.transaction(e,r?"readwrite":"readonly");let o=i.store;a&&(o=o.index(t.shift()));const s=await o[n](...t);return r&&await i.done,s};return x.set(t,i),i}h=(e=>({...e,get:(t,n,a)=>S(t,n)||e.get(t,n,a),has:(t,n)=>!!S(t,n)||e.has(t,n)}))(h);const L=async function(){return await function(e,t,{blocked:n,upgrade:a,blocking:r,terminated:i}={}){const o=indexedDB.open(e,t),s=v(o);return a&&o.addEventListener("upgradeneeded",e=>{a(v(o.result),e.oldVersion,e.newVersion,v(o.transaction))}),n&&o.addEventListener("blocked",()=>n()),s.then(e=>{i&&e.addEventListener("close",()=>i()),r&&e.addEventListener("versionchange",()=>r())}).catch(()=>{}),s}("dewt",1,{upgrade(e){const t=e.createObjectStore("timeboxes",{keyPath:"id",autoIncrement:!0});for(let e of["project","details","themeColor","startMinute","endMinute","date"])t.createIndex(e,e,{unique:!1});e.createObjectStore("workhours",{keyPath:"id",autoIncrement:!0}).createIndex("date","date")}})}(),D="error",C=document.querySelector(".notifications");function k(e,t){const n=document.createElement("div");n.classList.add("notification",t),C.appendChild(n);const a=document.createElement("p");a.textContent=e,n.appendChild(a),n.addEventListener("click",()=>{n.classList.add("hide"),setTimeout((function(){n.remove()}),200)})}async function j(e,t){return await e.getAllFromIndex("timeboxes","date",o(t))}async function P(e,t){return await e.get("timeboxes",Number(t))}async function A(e,t){const n=[],a=await j(e,new Date);for(let e of a)e.id!==t.id&&(t.startMinute>=e.startMinute&&t.startMinute<e.endMinute||t.endMinute>=e.startMinute&&t.endMinute<e.endMinute)&&n.push("Timeboxes can't overlap. Try adjusting start / end times.");if(n.length>0){for(let e of n)k(e,D);throw new Error("Timebox validation failed.")}return n===[]}const I=new class{constructor(e,t,n){this.agendaElement=e,this.totalMinutes=t,this.dayStartsAtMin=n,this.dateStr=function(){const e=new URL(window.location.href).searchParams.get("date");if(null===e)return new Date;if(e.match(/\d{4}-\d{2}-\d{2}/)){const[t,n,a]=e.split("-").map(Number);return new Date(t,n-1,a)}throw document.querySelector("body").innerHTML="<h1>Page not found</h1><p>You really shouldn't be here…</p>",Error("Malformed date! "+e)}()}draw(){this._setTotalMinutesOnAgendaElement(),this._drawCalendarDate(),this._drawHours(),this._drawMajorLines(),this._drawMinorLines(),this._drawNowRule()}_setTotalMinutesOnAgendaElement(){this.agendaElement.style.setProperty("--total-minutes",this.totalMinutes)}_drawCalendarDate(){const e={month:"short",weekday:"short"},[t,n]=new Intl.DateTimeFormat("en-US",e).formatToParts(this.dateStr).filter(({type:t})=>Object.keys(e).includes(t)).map(({value:e})=>e),a=this.dateStr.getDate(),r=document.querySelectorAll(".day p");r[0].textContent=t,r[1].textContent=a,r[2].textContent=n}_drawHours(){for(let e=60-this.dayStartsAtMin%60;e<this.totalMinutes;e+=60){const t=document.createElement("h3");t.className="time-hint",t.style.setProperty("--start-minute",e),t.style.setProperty("--end-minute",e+59),t.textContent=(this.dayStartsAtMin+e)/60;const n=document.createElement("sup");n.textContent="00",t.appendChild(n),this.agendaElement.appendChild(t)}}_drawMajorLines(){const e=60-this.dayStartsAtMin%60;this._drawLinesEvery60Min("rule-major",e)}_drawMinorLines(){let e;e=this.dayStartsAtMin%60<30?30-this.dayStartsAtMin%30:60-(this.dayStartsAtMin-30)%60,this._drawLinesEvery60Min("rule-minor",e)}_drawNowRule(){const e=document.createElement("div");e.className="rule-now",this.agendaElement.appendChild(e);const t=this.dayStartsAtMin,n=this.totalMinutes;!function a(){const r=new Date,i=60*r.getHours()+r.getMinutes()-t;i>=n?e.remove():(e.style.setProperty("--start-minute",i),setTimeout(a,6e4))}()}_drawLinesEvery60Min(e,t){for(let n=t;n<this.totalMinutes;n+=60){const t=document.createElement("div");t.className=e,t.style.setProperty("--start-minute",n),this.agendaElement.appendChild(t)}}}(document.querySelector(".agenda"),840,420);let q;function B(e){const t=document.querySelector(`article[data-timebox-id="${e.id}"]`);if(t&&t.remove(),e.date!==o(new Date))return;const n=document.createElement("article");n.classList.add("timebox","theme-color-"+e.themeColor),n.style.setProperty("--start-minute",e.startMinute-I.dayStartsAtMin),n.style.setProperty("--end-minute",e.endMinute-I.dayStartsAtMin);const a=document.createElement("h4");a.textContent=e.details,n.appendChild(a);const r=document.createElement("h5");r.textContent=e.project,n.appendChild(r),n.dataset.timeboxId=e.id,n.addEventListener("click",T),I.agendaElement.appendChild(n)}function N(e){const t=(e-=I.dayStartsAtMin)+45;q=document.createElement("article"),q.classList.add("timebox","timebox-draft"),q.style.setProperty("--start-minute",e),q.style.setProperty("--end-minute",t),I.agendaElement.appendChild(q);const n=document.createElement("form");n.addEventListener("submit",_),q.appendChild(n);const a=document.createElement("textarea");a.name="details",a.placeholder="Work on something deeply",a.addEventListener("input",e=>{e.target.value=e.target.value.replace(/\n/g,"")}),n.appendChild(a),a.focus();const r=document.createElement("button");r.type="submit",a.addEventListener("keydown",e=>{"Enter"==e.key&&""!==a.value&&n.requestSubmit()}),n.appendChild(r);const i=document.createElement("div");i.className="closeBtn",i.textContent="×",i.addEventListener("click",e=>{e.stopPropagation(),R()}),q.appendChild(i),q.addEventListener("keydown",e=>{"Escape"==e.key&&R()}),q.addEventListener("click",e=>e.stopPropagation())}async function T(e){if(e.stopPropagation(),!H())return;const t=e.currentTarget,n=t.dataset.timeboxId,a=await L,i=await P(a,n);q=document.createElement("div"),q.className="timebox-edit",q.dataset.timeboxId=n,q.insertAdjacentHTML("beforeend",`\n    <form>\n      <fieldset>\n        <ul>\n          <li class="project">\n            <label for="project">Project</label>\n            <input type="text" name="project" value="${i.project||""}">\n          </li>\n          <li class="details">\n            <label for="details">Details</label>\n            <input type="text" name="details" required value="${i.details}">\n          </li>\n        </ul>\n      </fieldset>\n      <fieldset>\n        <ul>\n          <li class="start-minute">\n            <label for="start-minute">Start</label>\n            <input type="text" name="start-minute" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${r(i.startMinute)}">\n          </li>\n          <li class="end-minute">\n            <label for="end-minute">End</label>\n            <input type="text" name="end-minute" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${r(i.endMinute)}">\n          </li>\n          <li class="date">\n            <label for="date">Date</label>\n            <input type="text" name="date" required pattern="\\d{4}-\\d{2}-\\d{2}" title="yyyy-mm-dd" value="${i.date}">\n          </li>\n        </ul>\n      </fieldset>\n      <fieldset>\n        <ul>\n          <li class="theme-color">\n            <label for="theme-color">Color</label>\n            <input type="text" name="theme-color" required pattern="[1-7]" title="any number from 1 to 7" value="${i.themeColor}">\n          </li>\n        </ul>\n      </fieldset>\n      <fieldset>\n        <ul>\n          <li class="delete-timebox"><a href="#">Delete</a></li>\n          <li class="cancel"><a href="#">Cancel</a></li>\n          <li><button type="submit">Save</button></li>\n        </ul>\n      </fieldset>\n    </form>`),q.querySelector(".cancel a").addEventListener("click",e=>{e.preventDefault(),R()}),q.querySelector(".delete-timebox a").addEventListener("click",async e=>{e.preventDefault(),await async function(e,t){await e.delete("timeboxes",Number(t))}(a,n),R(),t.remove()}),q.querySelector("form").addEventListener("submit",O),q.addEventListener("click",e=>e.stopPropagation());const o=q.querySelector("form"),[s,d]=o.querySelectorAll("input[name=start-minute], input[name=end-minute]");s.addEventListener("input",l(s,d)),d.addEventListener("input",l(s,d)),t.appendChild(q)}async function _(e){e.preventDefault();let t=null,n=new FormData(e.target).get("details");const a=n.indexOf(":");-1!==a&&(t=n.slice(0,a),n=n.slice(a+1));const r=await L;try{B(await async function(e,t){await A(e,t);const n=await e.put("timeboxes",t);return t.id=n,t}(r,{project:t,details:n,themeColor:1,date:o(new Date),startMinute:Number(q.style.getPropertyValue("--start-minute"))+I.dayStartsAtMin,endMinute:Number(q.style.getPropertyValue("--end-minute"))+I.dayStartsAtMin})),R()}catch{W()}}async function O(e){e.preventDefault();if(!q.querySelector("form").reportValidity())return;const t=Array.from(q.querySelectorAll("input")).filter(e=>e.value!==e.defaultValue);let n={};for(let e of t){let t=e.value,a=s(e.name);switch(a){case"startMinute":case"endMinute":t=i(t);break;case"date":const[e,n,a]=t.split("-").map(Number);t=o(new Date(e,n-1,a))}n[a]=t}const a=q.dataset.timeboxId,r=await L;try{B(await async function(e,t,n){const a=await P(e,t);for(let[e,t]of Object.entries(n))a[e]=t;return await A(e,a),await e.put("timeboxes",a),a}(r,a,n)),R()}catch{W()}}async function $(e){e.preventDefault();const t=new FormData(e.target),n={date:o(new Date),startMinute:i(t.get("start")),endMinute:i(t.get("end"))},a=await L;await async function(e,t){const n=await e.getFromIndex("workhours","date",t.date);n&&(t.id=n.id);await e.put("workhours",t)}(a,n),R(),F(a)}async function V(e,t){let n=await e.getFromIndex("workhours","date",t);return n||(n={date:t,startMinute:480,endMinute:1080}),n}async function F(e){const t=await V(e,o(new Date)),n=document.querySelector(".work-hours");n.style.setProperty("--start-minute",t.startMinute-I.dayStartsAtMin),n.style.setProperty("--end-minute",t.endMinute-I.dayStartsAtMin),I.agendaElement.appendChild(n)}function H(){return!q||(function(){if(!q)throw new Error("Cannot discard a non-existent modalBox.");let e=[];q.classList.contains("timebox-draft")?e=[q.querySelector("textarea")]:q.classList.contains("timebox-edit")&&(e=Array.from(q.querySelectorAll("input")));return e.every(e=>e.defaultValue===e.value)}()?(R(),!0):(W(),!1))}function R(){q.remove(),q=null}function W(){q.classList.add("box-flash"),setTimeout(()=>{q&&q.classList.remove("box-flash")},800)}I.draw(),"true"===new URL(window.location.href).searchParams.get("test")&&L.then((async function(e){const t=new Date,n=new Date(t.getFullYear(),t.getMonth(),t.getDate()+1),a=o(t),r=[{project:"writing",details:"Aufsatz zur Verwandlung von Pangolinen",themeColor:1,date:a,startMinute:570,endMinute:670,id:1},{project:"Dewt",details:"Dewt Namen finden",themeColor:2,date:a,startMinute:683,endMinute:765,id:2},{project:null,details:"Email",themeColor:1,date:a,startMinute:765,endMinute:900,id:3},{project:"I SHOULD",details:"NOT APPEAR",themeColor:3,date:o(n),startMinute:540,endMinute:900,id:4}];for(let t of r)await e.get("timeboxes",t.id)&&await e.delete("timeboxes",t.id),await e.put("timeboxes",t)})),L.then((async function(e){const t=await j(e,new Date);for(let e of t)B(e)})),function(e){let t;e.agendaElement.addEventListener("mousemove",e=>{t=e.clientY}),e.agendaElement.addEventListener("click",n=>{if(!H())return;const a=e.agendaElement.getBoundingClientRect().y;N(t-a+e.dayStartsAtMin)})}(I),L.then(F),I.agendaElement.querySelector(".set-work-hours a").addEventListener("click",e=>{e.stopPropagation(),async function(){if(!H())return;const e=await L,t=await V(e,o(new Date));q=document.createElement("div"),q.className="work-hours-modal",q.insertAdjacentHTML("beforeend",`\n    <p>Set your working hours:</p>\n    <form>\n      <fieldset>\n        <ul>\n          <li class="work-start">\n            <label for="start">Start</label>\n            <input type="text" name="start" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${r(t.startMinute)}">\n          </li>\n          <li class="work-end">\n            <label for="end">End</label>\n            <input type="text" name="end" required pattern="(2[0-3]|[0-1]?\\d):[0-5]\\d" title="hh:mm (24h time)" value="${r(t.endMinute)}">\n          </li>\n        </ul>\n      </fieldset>\n      <fieldset>\n        <ul>\n          <li><a href="#">Cancel</a></li>\n          <li><button type="submit">Save</button></li>\n        </ul>\n      </fieldset>\n    </form>`),I.agendaElement.appendChild(q),q.addEventListener("click",e=>e.stopPropagation()),q.querySelector("a").addEventListener("click",e=>{e.preventDefault(),R()});const n=q.querySelector("form");n.addEventListener("submit",$);const[a,i]=n.querySelectorAll("input[name=start], input[name=end]");a.addEventListener("input",l(a,i)),i.addEventListener("input",l(a,i))}()})}]);