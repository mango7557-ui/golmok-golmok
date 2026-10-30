import {createContext,useContext,type Dispatch,type SetStateAction} from 'react';
import {type State,type Lang,type Store,type Cart,text} from './domain';
import {t} from './i18n';
export interface AppContextValue {state:State;setState:Dispatch<SetStateAction<State>>;lang:Lang;tr:(key:string)=>string;tx:(value:Parameters<typeof text>[0])=>string;toast:(message:string)=>void;openStore:(id:string)=>void;openChat:(storeId:string,orderId?:string)=>void;addCart:(store:Store,mode:Cart['mode'],menuId:string,optionId:string)=>void;openCheckout:()=>void;setTab:(tab:string)=>void;confirm:(message:string,action:()=>void)=>void;owner:boolean;ownerId:string;setOwnerId:(id:string)=>void}
export const AppContext=createContext<AppContextValue>(null!);
export const useApp=()=>useContext(AppContext);
export const makeTranslator=(lang:Lang)=>(key:string)=>t(key,lang);
