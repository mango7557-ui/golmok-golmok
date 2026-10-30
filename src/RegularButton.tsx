import { Heart } from 'lucide-react';
import { useApp } from './context';
import type { Store } from './domain';

/** Reuse saved IDs so existing hearts become regular stores without data loss. */
export function RegularButton({store,compact=false}:{store:Store;compact?:boolean}) {
  const {state,setState,tr,tx,toast}=useApp();
  const registered=state.saved.includes(store.id);
  return <button
    className={`regular-button ${compact?'compact':''} ${registered?'is-regular':''}`}
    aria-label={`${tx(store.name)} ${tr(registered?'regularRemove':'regularAdd')}`}
    aria-pressed={registered}
    title={tr(registered?'regularRemove':'regularAdd')}
    onClick={()=>{
      setState(current=>({...current,saved:current.saved.includes(store.id)
        ?current.saved.filter(id=>id!==store.id)
        :[...current.saved,store.id]}));
      toast(`${tx(store.name)} · ${tr(registered?'regularRemoved':'regularAdded')}`);
    }}
  ><Heart size={compact?16:20} fill={registered?'currentColor':'none'}/><span>{tr(registered?'regularRegistered':'regularAdd')}</span></button>;
}
