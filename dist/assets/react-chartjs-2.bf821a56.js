import{r as a}from"./react.5e86ad27.js";import{C as m,B as E,D as O}from"./chart.js.2222c2ea.js";import{j as b}from"./@fullcalendar.e9cd324a.js";const C="label";function h(t,e){typeof t=="function"?t(e):t&&(t.current=e)}function B(t,e){Object.assign(t.options,e)}function x(t,e){t.labels=e}function y(t,e){let n=arguments.length>2&&arguments[2]!==void 0?arguments[2]:C;const c=[];t.datasets=e.map(s=>{const o=t.datasets.find(i=>i[n]===s[n]);return!o||!s.data||c.includes(o)?{...s}:(c.push(o),Object.assign(o,s),o)})}function I(t){let e=arguments.length>1&&arguments[1]!==void 0?arguments[1]:C;const n={labels:[],datasets:[]};return x(n,t.labels),y(n,t.datasets,e),n}function K(t,e){let{height:n=150,width:c=300,redraw:s=!1,datasetIdKey:o,type:i,data:u,options:f,plugins:R=[],fallbackContent:j,updateMode:g,...D}=t;const d=a.exports.useRef(null),r=a.exports.useRef(),l=()=>{!d.current||(r.current=new m(d.current,{type:i,data:I(u,o),options:f&&{...f},plugins:R}),h(e,r.current))},p=()=>{h(e,null),r.current&&(r.current.destroy(),r.current=null)};return a.exports.useEffect(()=>{!s&&r.current&&f&&B(r.current,f)},[s,f]),a.exports.useEffect(()=>{!s&&r.current&&x(r.current.config.data,u.labels)},[s,u.labels]),a.exports.useEffect(()=>{!s&&r.current&&u.datasets&&y(r.current.config.data,u.datasets,o)},[s,u.datasets]),a.exports.useEffect(()=>{!r.current||(s?(p(),setTimeout(l)):r.current.update(g))},[s,f,u.labels,u.datasets,g]),a.exports.useEffect(()=>{!r.current||(p(),setTimeout(l))},[i]),a.exports.useEffect(()=>(l(),()=>p()),[]),b("canvas",{...Object.assign({ref:d,role:"img",height:n,width:c},D),children:j})}const v=a.exports.forwardRef(K);function w(t,e){return m.register(e),a.exports.forwardRef((n,c)=>b(v,{...Object.assign({},n,{ref:c,type:t})}))}const M=w("bar",E),$=w("doughnut",O);export{M as B,$ as D};