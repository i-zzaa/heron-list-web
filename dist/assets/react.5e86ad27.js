import{g as A}from"./fast-deep-equal.aae8ee5f.js";function F(e,t){for(var n=0;n<t.length;n++){const r=t[n];if(typeof r!="string"&&!Array.isArray(r)){for(const o in r)if(o!=="default"&&!(o in e)){const i=Object.getOwnPropertyDescriptor(r,o);i&&Object.defineProperty(e,o,i.get?i:{enumerable:!0,get:()=>r[o]})}}}return Object.freeze(Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}))}var v={exports:{}},u={};/**
 * @license React
 * react.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var y=Symbol.for("react.element"),L=Symbol.for("react.portal"),N=Symbol.for("react.fragment"),U=Symbol.for("react.strict_mode"),V=Symbol.for("react.profiler"),q=Symbol.for("react.provider"),M=Symbol.for("react.context"),z=Symbol.for("react.forward_ref"),B=Symbol.for("react.suspense"),H=Symbol.for("react.memo"),W=Symbol.for("react.lazy"),$=Symbol.iterator;function J(e){return e===null||typeof e!="object"?null:(e=$&&e[$]||e["@@iterator"],typeof e=="function"?e:null)}var j={isMounted:function(){return!1},enqueueForceUpdate:function(){},enqueueReplaceState:function(){},enqueueSetState:function(){}},x=Object.assign,g={};function p(e,t,n){this.props=e,this.context=t,this.refs=g,this.updater=n||j}p.prototype.isReactComponent={};p.prototype.setState=function(e,t){if(typeof e!="object"&&typeof e!="function"&&e!=null)throw Error("setState(...): takes an object of state variables to update or a function which returns an object of state variables.");this.updater.enqueueSetState(this,e,t,"setState")};p.prototype.forceUpdate=function(e){this.updater.enqueueForceUpdate(this,e,"forceUpdate")};function C(){}C.prototype=p.prototype;function R(e,t,n){this.props=e,this.context=t,this.refs=g,this.updater=n||j}var E=R.prototype=new C;E.constructor=R;x(E,p.prototype);E.isPureReactComponent=!0;var w=Array.isArray,P=Object.prototype.hasOwnProperty,b={current:null},I={key:!0,ref:!0,__self:!0,__source:!0};function T(e,t,n){var r,o={},i=null,c=null;if(t!=null)for(r in t.ref!==void 0&&(c=t.ref),t.key!==void 0&&(i=""+t.key),t)P.call(t,r)&&!I.hasOwnProperty(r)&&(o[r]=t[r]);var s=arguments.length-2;if(s===1)o.children=n;else if(1<s){for(var f=Array(s),a=0;a<s;a++)f[a]=arguments[a+2];o.children=f}if(e&&e.defaultProps)for(r in s=e.defaultProps,s)o[r]===void 0&&(o[r]=s[r]);return{$$typeof:y,type:e,key:i,ref:c,props:o,_owner:b.current}}function Y(e,t){return{$$typeof:y,type:e.type,key:t,ref:e.ref,props:e.props,_owner:e._owner}}function k(e){return typeof e=="object"&&e!==null&&e.$$typeof===y}function G(e){var t={"=":"=0",":":"=2"};return"$"+e.replace(/[=:]/g,function(n){return t[n]})}var O=/\/+/g;function S(e,t){return typeof e=="object"&&e!==null&&e.key!=null?G(""+e.key):t.toString(36)}function _(e,t,n,r,o){var i=typeof e;(i==="undefined"||i==="boolean")&&(e=null);var c=!1;if(e===null)c=!0;else switch(i){case"string":case"number":c=!0;break;case"object":switch(e.$$typeof){case y:case L:c=!0}}if(c)return c=e,o=o(c),e=r===""?"."+S(c,0):r,w(o)?(n="",e!=null&&(n=e.replace(O,"$&/")+"/"),_(o,t,n,"",function(a){return a})):o!=null&&(k(o)&&(o=Y(o,n+(!o.key||c&&c.key===o.key?"":(""+o.key).replace(O,"$&/")+"/")+e)),t.push(o)),1;if(c=0,r=r===""?".":r+":",w(e))for(var s=0;s<e.length;s++){i=e[s];var f=r+S(i,s);c+=_(i,t,n,f,o)}else if(f=J(e),typeof f=="function")for(e=f.call(e),s=0;!(i=e.next()).done;)i=i.value,f=r+S(i,s++),c+=_(i,t,n,f,o);else if(i==="object")throw t=String(e),Error("Objects are not valid as a React child (found: "+(t==="[object Object]"?"object with keys {"+Object.keys(e).join(", ")+"}":t)+"). If you meant to render a collection of children, use an array instead.");return c}function d(e,t,n){if(e==null)return e;var r=[],o=0;return _(e,r,"","",function(i){return t.call(n,i,o++)}),r}function K(e){if(e._status===-1){var t=e._result;t=t(),t.then(function(n){(e._status===0||e._status===-1)&&(e._status=1,e._result=n)},function(n){(e._status===0||e._status===-1)&&(e._status=2,e._result=n)}),e._status===-1&&(e._status=0,e._result=t)}if(e._status===1)return e._result.default;throw e._result}var l={current:null},m={transition:null},Q={ReactCurrentDispatcher:l,ReactCurrentBatchConfig:m,ReactCurrentOwner:b};u.Children={map:d,forEach:function(e,t,n){d(e,function(){t.apply(this,arguments)},n)},count:function(e){var t=0;return d(e,function(){t++}),t},toArray:function(e){return d(e,function(t){return t})||[]},only:function(e){if(!k(e))throw Error("React.Children.only expected to receive a single React element child.");return e}};u.Component=p;u.Fragment=N;u.Profiler=V;u.PureComponent=R;u.StrictMode=U;u.Suspense=B;u.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED=Q;u.cloneElement=function(e,t,n){if(e==null)throw Error("React.cloneElement(...): The argument must be a React element, but you passed "+e+".");var r=x({},e.props),o=e.key,i=e.ref,c=e._owner;if(t!=null){if(t.ref!==void 0&&(i=t.ref,c=b.current),t.key!==void 0&&(o=""+t.key),e.type&&e.type.defaultProps)var s=e.type.defaultProps;for(f in t)P.call(t,f)&&!I.hasOwnProperty(f)&&(r[f]=t[f]===void 0&&s!==void 0?s[f]:t[f])}var f=arguments.length-2;if(f===1)r.children=n;else if(1<f){s=Array(f);for(var a=0;a<f;a++)s[a]=arguments[a+2];r.children=s}return{$$typeof:y,type:e.type,key:o,ref:i,props:r,_owner:c}};u.createContext=function(e){return e={$$typeof:M,_currentValue:e,_currentValue2:e,_threadCount:0,Provider:null,Consumer:null,_defaultValue:null,_globalName:null},e.Provider={$$typeof:q,_context:e},e.Consumer=e};u.createElement=T;u.createFactory=function(e){var t=T.bind(null,e);return t.type=e,t};u.createRef=function(){return{current:null}};u.forwardRef=function(e){return{$$typeof:z,render:e}};u.isValidElement=k;u.lazy=function(e){return{$$typeof:W,_payload:{_status:-1,_result:e},_init:K}};u.memo=function(e,t){return{$$typeof:H,type:e,compare:t===void 0?null:t}};u.startTransition=function(e){var t=m.transition;m.transition={};try{e()}finally{m.transition=t}};u.unstable_act=function(){throw Error("act(...) is not supported in production builds of React.")};u.useCallback=function(e,t){return l.current.useCallback(e,t)};u.useContext=function(e){return l.current.useContext(e)};u.useDebugValue=function(){};u.useDeferredValue=function(e){return l.current.useDeferredValue(e)};u.useEffect=function(e,t){return l.current.useEffect(e,t)};u.useId=function(){return l.current.useId()};u.useImperativeHandle=function(e,t,n){return l.current.useImperativeHandle(e,t,n)};u.useInsertionEffect=function(e,t){return l.current.useInsertionEffect(e,t)};u.useLayoutEffect=function(e,t){return l.current.useLayoutEffect(e,t)};u.useMemo=function(e,t){return l.current.useMemo(e,t)};u.useReducer=function(e,t,n){return l.current.useReducer(e,t,n)};u.useRef=function(e){return l.current.useRef(e)};u.useState=function(e){return l.current.useState(e)};u.useSyncExternalStore=function(e,t,n){return l.current.useSyncExternalStore(e,t,n)};u.useTransition=function(){return l.current.useTransition()};u.version="18.2.0";(function(e){e.exports=u})(v);const X=A(v.exports),ce=F({__proto__:null,default:X},[v.exports]);var Z={exports:{}},h={};/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */var ee=v.exports,te=Symbol.for("react.element"),re=Symbol.for("react.fragment"),ne=Object.prototype.hasOwnProperty,oe=ee.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner,ue={key:!0,ref:!0,__self:!0,__source:!0};function D(e,t,n){var r,o={},i=null,c=null;n!==void 0&&(i=""+n),t.key!==void 0&&(i=""+t.key),t.ref!==void 0&&(c=t.ref);for(r in t)ne.call(t,r)&&!ue.hasOwnProperty(r)&&(o[r]=t[r]);if(e&&e.defaultProps)for(r in t=e.defaultProps,t)o[r]===void 0&&(o[r]=t[r]);return{$$typeof:te,type:e,key:i,ref:c,props:o,_owner:oe.current}}h.Fragment=re;h.jsx=D;h.jsxs=D;(function(e){e.exports=h})(Z);export{X as R,ce as a,Z as j,v as r};
