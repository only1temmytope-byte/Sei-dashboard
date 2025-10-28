
import React from "react";
type Props={title:string;value:React.ReactNode;sub?:React.ReactNode};
export default function Card({title,value,sub}:Props){
  return (<div className="rounded-2xl shadow-sm border border-zinc-200 bg-white p-4 sm:p-6 flex flex-col gap-1">
    <div className="text-sm text-zinc-500">{title}</div>
    <div className="text-2xl sm:text-3xl font-semibold tracking-tight">{value}</div>
    {sub?<div className="text-xs text-zinc-500">{sub}</div>:null}
  </div>);
}
