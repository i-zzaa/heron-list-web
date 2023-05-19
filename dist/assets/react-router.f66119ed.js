import{i as p,A as N,p as F,s as V,m as k,j as y,a as _,r as J,b as $}from"./@remix-run.f7ecdf14.js";import{a as b,r as s}from"./react.5e86ad27.js";import{j as c,a as M,F as G}from"./@fullcalendar.e9cd324a.js";/**
 * React Router v6.4.2
 *
 * Copyright (c) Remix Software Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE.md file in the root directory of this source tree.
 *
 * @license MIT
 */function D(){return D=Object.assign?Object.assign.bind():function(e){for(var t=1;t<arguments.length;t++){var n=arguments[t];for(var r in n)Object.prototype.hasOwnProperty.call(n,r)&&(e[r]=n[r])}return e},D.apply(this,arguments)}function W(e,t){return e===t&&(e!==0||1/e===1/t)||e!==e&&t!==t}const X=typeof Object.is=="function"?Object.is:W,{useState:Y,useEffect:q,useLayoutEffect:z,useDebugValue:K}=b;function Q(e,t,n){const r=t(),[{inst:o},l]=Y({inst:{value:r,getSnapshot:t}});return z(()=>{o.value=r,o.getSnapshot=t,P(o)&&l({inst:o})},[e,r,t]),q(()=>(P(o)&&l({inst:o}),e(()=>{P(o)&&l({inst:o})})),[e]),K(r),r}function P(e){const t=e.getSnapshot,n=e.value;try{const r=t();return!X(n,r)}catch{return!0}}function Z(e,t,n){return t()}const H=typeof window<"u"&&typeof window.document<"u"&&typeof window.document.createElement<"u",A=!H,ee=A?Z:Q;"useSyncExternalStore"in b&&(e=>e.useSyncExternalStore)(b);const te=s.exports.createContext(null),re=s.exports.createContext(null),L=s.exports.createContext(null),j=s.exports.createContext(null),E=s.exports.createContext(null),g=s.exports.createContext({outlet:null,matches:[]}),I=s.exports.createContext(null);function ve(e,t){let{relative:n}=t===void 0?{}:t;v()||p(!1);let{basename:r,navigator:o}=s.exports.useContext(j),{hash:l,pathname:a,search:u}=ne(e,{relative:n}),i=a;return r!=="/"&&(i=a==="/"?r:y([r,a])),o.createHref({pathname:i,search:u,hash:l})}function v(){return s.exports.useContext(E)!=null}function R(){return v()||p(!1),s.exports.useContext(E).location}function xe(e){v()||p(!1);let{pathname:t}=R();return s.exports.useMemo(()=>_(e,t),[t,e])}function T(e){return e.filter((t,n)=>n===0||!t.route.index&&t.pathnameBase!==e[n-1].pathnameBase)}function me(){v()||p(!1);let{basename:e,navigator:t}=s.exports.useContext(j),{matches:n}=s.exports.useContext(g),{pathname:r}=R(),o=JSON.stringify(T(n).map(u=>u.pathnameBase)),l=s.exports.useRef(!1);return s.exports.useEffect(()=>{l.current=!0}),s.exports.useCallback(function(u,i){if(i===void 0&&(i={}),!l.current)return;if(typeof u=="number"){t.go(u);return}let d=J(u,JSON.parse(o),r,i.relative==="path");e!=="/"&&(d.pathname=d.pathname==="/"?e:y([e,d.pathname])),(i.replace?t.replace:t.push)(d,i.state,i)},[e,t,o,r])}function ne(e,t){let{relative:n}=t===void 0?{}:t,{matches:r}=s.exports.useContext(g),{pathname:o}=R(),l=JSON.stringify(T(r).map(a=>a.pathnameBase));return s.exports.useMemo(()=>J(e,JSON.parse(l),o,n==="path"),[e,l,o,n])}function oe(e,t){v()||p(!1);let n=s.exports.useContext(L),{matches:r}=s.exports.useContext(g),o=r[r.length-1],l=o?o.params:{};o&&o.pathname;let a=o?o.pathnameBase:"/";o&&o.route;let u=R(),i;if(t){var d;let h=typeof t=="string"?F(t):t;a==="/"||((d=h.pathname)==null?void 0:d.startsWith(a))||p(!1),i=h}else i=u;let f=i.pathname||"/",C=a==="/"?f:f.slice(a.length)||"/",x=k(e,{pathname:C}),m=ie(x&&x.map(h=>Object.assign({},h,{params:Object.assign({},l,h.params),pathname:y([a,h.pathname]),pathnameBase:h.pathnameBase==="/"?a:y([a,h.pathnameBase])})),r,n||void 0);return t?c(E.Provider,{value:{location:D({pathname:"/",search:"",hash:"",state:null,key:"default"},i),navigationType:N.Pop},children:m}):m}function ae(){let e=ce(),t=$(e)?e.status+" "+e.statusText:e instanceof Error?e.message:JSON.stringify(e),n=e instanceof Error?e.stack:null,r="rgba(200,200,200, 0.5)",o={padding:"0.5rem",backgroundColor:r},l={padding:"2px 4px",backgroundColor:r};return M(G,{children:[c("h2",{children:"Unhandled Thrown Error!"}),c("h3",{style:{fontStyle:"italic"},children:t}),n?c("pre",{style:o,children:n}):null,c("p",{children:"\u{1F4BF} Hey developer \u{1F44B}"}),M("p",{children:["You can provide a way better UX than this when your app throws errors by providing your own\xA0",c("code",{style:l,children:"errorElement"})," props on\xA0",c("code",{style:l,children:"<Route>"})]})]})}class se extends s.exports.Component{constructor(t){super(t),this.state={location:t.location,error:t.error}}static getDerivedStateFromError(t){return{error:t}}static getDerivedStateFromProps(t,n){return n.location!==t.location?{error:t.error,location:t.location}:{error:t.error||n.error,location:n.location}}componentDidCatch(t,n){console.error("React Router caught the following error during render",t,n)}render(){return this.state.error?c(I.Provider,{value:this.state.error,children:this.props.component}):this.props.children}}function le(e){let{routeContext:t,match:n,children:r}=e,o=s.exports.useContext(te);return o&&n.route.errorElement&&(o._deepestRenderedBoundaryId=n.route.id),c(g.Provider,{value:t,children:r})}function ie(e,t,n){if(t===void 0&&(t=[]),e==null)if(n!=null&&n.errors)e=n.matches;else return null;let r=e,o=n==null?void 0:n.errors;if(o!=null){let l=r.findIndex(a=>a.route.id&&(o==null?void 0:o[a.route.id]));l>=0||p(!1),r=r.slice(0,Math.min(r.length,l+1))}return r.reduceRight((l,a,u)=>{let i=a.route.id?o==null?void 0:o[a.route.id]:null,d=n?a.route.errorElement||c(ae,{}):null,f=()=>c(le,{match:a,routeContext:{outlet:l,matches:t.concat(r.slice(0,u+1))},children:i?d:a.route.element!==void 0?a.route.element:l});return n&&(a.route.errorElement||u===0)?c(se,{location:n.location,component:d,error:i,children:f()}):f()},null)}var U;(function(e){e.UseRevalidator="useRevalidator"})(U||(U={}));var S;(function(e){e.UseLoaderData="useLoaderData",e.UseActionData="useActionData",e.UseRouteError="useRouteError",e.UseNavigation="useNavigation",e.UseRouteLoaderData="useRouteLoaderData",e.UseMatches="useMatches",e.UseRevalidator="useRevalidator"})(S||(S={}));function ue(e){let t=s.exports.useContext(L);return t||p(!1),t}function ce(){var e;let t=s.exports.useContext(I),n=ue(S.UseRouteError),r=s.exports.useContext(g),o=r.matches[r.matches.length-1];return t||(r||p(!1),o.route.id||p(!1),(e=n.errors)==null?void 0:e[o.route.id])}function pe(e){p(!1)}function ge(e){let{basename:t="/",children:n=null,location:r,navigationType:o=N.Pop,navigator:l,static:a=!1}=e;v()&&p(!1);let u=t.replace(/^\/*/,"/"),i=s.exports.useMemo(()=>({basename:u,navigator:l,static:a}),[u,l,a]);typeof r=="string"&&(r=F(r));let{pathname:d="/",search:f="",hash:C="",state:x=null,key:m="default"}=r,h=s.exports.useMemo(()=>{let O=V(d,u);return O==null?null:{pathname:O,search:f,hash:C,state:x,key:m}},[u,d,f,C,x,m]);return h==null?null:c(j.Provider,{value:i,children:c(E.Provider,{children:n,value:{location:h,navigationType:o}})})}function Ce(e){let{children:t,location:n}=e,r=s.exports.useContext(re),o=r&&!t?r.router.routes:B(t);return oe(o,n)}var w;(function(e){e[e.pending=0]="pending",e[e.success=1]="success",e[e.error=2]="error"})(w||(w={}));new Promise(()=>{});function B(e,t){t===void 0&&(t=[]);let n=[];return s.exports.Children.forEach(e,(r,o)=>{if(!s.exports.isValidElement(r))return;if(r.type===s.exports.Fragment){n.push.apply(n,B(r.props.children,t));return}r.type!==pe&&p(!1),!r.props.index||!r.props.children||p(!1);let l=[...t,o],a={id:r.props.id||l.join("-"),caseSensitive:r.props.caseSensitive,element:r.props.element,index:r.props.index,path:r.props.path,loader:r.props.loader,action:r.props.action,errorElement:r.props.errorElement,hasErrorBoundary:r.props.errorElement!=null,shouldRevalidate:r.props.shouldRevalidate,handle:r.props.handle};r.props.children&&(a.children=B(r.props.children,l)),n.push(a)}),n}export{L as D,ge as R,xe as a,ve as b,me as c,R as d,Ce as e,pe as f,ne as u};
